import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { getDefaultRpcUrl, type ChainMetadata } from '../../common/chains'
import {
  BaseWalletClient,
  isHttpException,
  type CreateWalletResult,
  type CreateWalletParams,
  type BalanceResult,
  type SignMessageResult,
  type SendTransactionResult,
  type SendTransactionParams,
  handleDynamicSDKError,
  extractDynamicSDKErrorMessage,
} from './base-wallet-client'
import { LoggerService } from '../../common/logger/logger.service'

// Safe fields to log from Dynamic SDK responses
const SAFE_SDK_FIELDS = ['accountAddress', 'chainId', 'networkId'] as const

function sanitizeSdkResponse(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') return {}

  const sanitized: Record<string, unknown> = {}
  const obj = response as Record<string, unknown>

  for (const field of SAFE_SDK_FIELDS) {
    if (field in obj) {
      sanitized[field] = obj[field]
    }
  }

  // Include error.message if present
  if ('error' in obj && obj.error && typeof obj.error === 'object') {
    const error = obj.error as Record<string, unknown>
    if ('message' in error && typeof error.message === 'string') {
      sanitized.errorMessage = error.message
    }
  }

  return sanitized
}

/**
 * Interface for Dynamic SDK's Solana wallet client.
 * Uses the actual Dynamic SDK client type - no manual duplication.
 * The client is imported dynamically, so we use an interface that matches the SDK's interface.
 */
interface DynamicSvmWalletClient {
  authenticateApiToken: (token: string) => Promise<void>
  createWalletAccount: (options: {
    thresholdSignatureScheme: unknown
    backUpToClientShareService: boolean
  }) => Promise<CreateWalletResult> // Use our aligned type instead of duplicating
  signMessage: (options: {
    accountAddress: string
    externalServerKeyShares: string[]
    message: string
  }) => Promise<string>
  signTransaction: (options: {
    accountAddress: string
    externalServerKeyShares: string[]
    transaction: Transaction
  }) => Promise<Transaction | Buffer>
}

@Injectable()
export class SolanaWalletClient extends BaseWalletClient {
  private dynamicSvmClient: DynamicSvmWalletClient | null = null
  private connection: Connection | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly chainMetadata: ChainMetadata,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    super()
  }

  private async getDynamicSvmClient(): Promise<DynamicSvmWalletClient> {
    if (this.dynamicSvmClient) return this.dynamicSvmClient

    try {
      const environmentId = this.configService.get<string>('dynamic.environmentId')
      const apiToken = this.configService.get<string>('dynamic.apiToken')

      if (!environmentId || !apiToken) {
        throw new InternalServerErrorException('Dynamic configuration is not set')
      }

      // Use dynamic import for ESM module compatibility
      // Dynamic SDK packages are ESM-only - dynamic import() works from CommonJS
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const module = await import('@dynamic-labs-wallet/node-svm')
      const DynamicSvmWalletClientClass = module.DynamicSvmWalletClient
      this.dynamicSvmClient = new DynamicSvmWalletClientClass({
        environmentId,
      }) as DynamicSvmWalletClient
      await this.dynamicSvmClient.authenticateApiToken(apiToken)

      return this.dynamicSvmClient
    } catch (error) {
      // Re-throw HTTP exceptions as-is (using safe HttpException check)
      if (isHttpException(error)) {
        throw error
      }

      // Convert Dynamic SDK errors to appropriate HTTP exceptions
      const errorMessage = error instanceof Error ? error.message : String(error)
      const lowerMessage = errorMessage.toLowerCase()

      // Check for status code in error object (AxiosError has response.status, others might have status directly)
      const errorObj = error as { status?: number; response?: { status?: number } }
      const errorStatus = errorObj?.response?.status ?? errorObj?.status

      // Authentication errors (401)
      if (
        errorStatus === 401 ||
        lowerMessage.includes('authentication') ||
        lowerMessage.includes('token') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('auth') ||
        lowerMessage.includes('credential') ||
        lowerMessage.includes('permission denied')
      ) {
        throw new UnauthorizedException(`Dynamic SDK authentication failed: ${errorMessage}`)
      }
      // Rate limit errors (429) - Check status code FIRST, then message strings
      if (
        errorStatus === 429 ||
        lowerMessage.includes('status code 429') ||
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('throttle') ||
        lowerMessage.includes('too many') ||
        lowerMessage.includes('quota') ||
        lowerMessage.includes('limit exceeded')
      ) {
        throw new HttpException(
          `Dynamic SDK rate limit exceeded: ${errorMessage}`,
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      // Network errors (502)
      if (
        lowerMessage.includes('network') ||
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('econnrefused') ||
        lowerMessage.includes('enotfound') ||
        lowerMessage.includes('econnreset') ||
        lowerMessage.includes('socket') ||
        lowerMessage.includes('dns')
      ) {
        throw new BadGatewayException(`Dynamic SDK network error: ${errorMessage}`)
      }
      // Not found errors (404)
      if (
        lowerMessage.includes('not found') ||
        lowerMessage.includes('does not exist') ||
        lowerMessage.includes('missing') ||
        lowerMessage.includes('not available')
      ) {
        throw new BadRequestException(`Dynamic SDK resource not found: ${errorMessage}`)
      }
      // Forbidden errors (403)
      if (
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('access denied') ||
        lowerMessage.includes('not allowed')
      ) {
        throw new UnauthorizedException(`Dynamic SDK access forbidden: ${errorMessage}`)
      }

      // Log the error for debugging
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error('Dynamic SDK initialization error', {
        message: errorMessage,
        stack: errorStack,
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
      throw new InternalServerErrorException(`Failed to initialize Dynamic SDK: ${errorMessage}`)
    }
  }

  private getConnection(): Connection {
    if (this.connection) return this.connection

    // Get RPC URL with priority: custom env var > Dynamic default > Solana default
    const customRpcUrl = this.configService.get<string>(
      `rpc.${this.chainMetadata.dynamicNetworkId}`,
    )
    const rpcUrl =
      getDefaultRpcUrl(this.chainMetadata.chainId, customRpcUrl) ||
      this.chainMetadata.defaultRpcUrl ||
      'https://api.mainnet-beta.solana.com'

    this.connection = new Connection(rpcUrl, 'confirmed')
    return this.connection
  }

  async createWallet(params: CreateWalletParams): Promise<CreateWalletResult> {
    try {
      this.logger.info('Creating Solana wallet', {
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })

      const dynamicSvmClient = await this.getDynamicSvmClient()

      // Use dynamic import for ESM module compatibility
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')

      // Leverage Dynamic SDK return type directly - no unnecessary mapping
      const wallet = await dynamicSvmClient.createWalletAccount({
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
        backUpToClientShareService: false,
      })

      // Log SDK response at debug level if flag is set, otherwise log sanitized version
      if (process.env.LOG_SDK_DEBUG === 'true') {
        this.logger.debug('Dynamic SDK wallet creation response', {
          response: wallet,
          chainId: this.chainMetadata.chainId,
        })
      } else {
        const sanitized = sanitizeSdkResponse(wallet)
        this.logger.info('Solana wallet created successfully', {
          ...sanitized,
          chainId: this.chainMetadata.chainId,
        })
      }

      // Return Dynamic SDK result directly (matches CreateWalletResult interface)
      return wallet
    } catch (error) {
      // Extract error message for logging
      const errorMessage = extractDynamicSDKErrorMessage(error) || 'Unknown error'

      // Log full error structure for debugging (only in test/dev mode)
      if (process.env.NODE_ENV !== 'production') {
        const errorStack = error instanceof Error ? error.stack : ''
        const errorDetails: Record<string, unknown> = {
          errorType: error?.constructor?.name,
          hasMessage: !!(error as any)?.message,
          message: (error as any)?.message,
          hasStatus: !!(error as any)?.status,
          status: (error as any)?.status,
          hasError: !!(error as any)?.error,
          errorProperty: (error as any)?.error,
          hasCause: !!(error as any)?.cause,
          cause: (error as any)?.cause,
          errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
          stack: errorStack,
        }
        try {
          errorDetails.errorStringified = JSON.stringify(error, null, 2)
        } catch {
          errorDetails.errorStringified = '[Circular or non-serializable]'
        }
        this.logger.error('Full error structure from Dynamic SDK', {
          ...errorDetails,
          chainId: this.chainMetadata.chainId,
          dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
        })
      }

      // Use shared error handling utility
      // Try to extract existing wallet address from error
      const { extractExistingWalletAddress } = await import('./base-wallet-client')
      const existingAddress =
        extractExistingWalletAddress(error) || params.existingWalletAddress || undefined

      // Include error details for multiple wallets error
      handleDynamicSDKError(error, 'create wallet', {
        existingWalletAddress: existingAddress,
        chainId: params.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
    }
  }

  async getBalance(address: string): Promise<BalanceResult> {
    const connection = this.getConnection()
    const publicKey = new PublicKey(address)

    const balance = await connection.getBalance(publicKey)

    return {
      balance: balance / LAMPORTS_PER_SOL,
    }
  }

  async signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult> {
    try {
      this.logger.info('Signing Solana message', {
        address,
        chainId: this.chainMetadata.chainId,
        messageLength: message.length,
      })

      const dynamicSvmClient = await this.getDynamicSvmClient()

      const signature = await dynamicSvmClient.signMessage({
        accountAddress: address,
        externalServerKeyShares,
        message,
      })

      this.logger.info('Solana message signed successfully', {
        address,
        chainId: this.chainMetadata.chainId,
      })

      return {
        signedMessage: signature,
      }
    } catch (error) {
      // Use shared error handling utility
      handleDynamicSDKError(error, 'sign message', {
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
    }
  }

  async sendTransaction(
    address: string,
    externalServerKeyShares: string[],
    params: SendTransactionParams,
  ): Promise<SendTransactionResult> {
    try {
      // Destructure params
      const { to, amount } = params

      this.logger.info('Sending Solana transaction', {
        address,
        to,
        amount,
        chainId: this.chainMetadata.chainId,
      })

      const dynamicSvmClient = await this.getDynamicSvmClient()
      const connection = this.getConnection()

      const fromPublicKey = new PublicKey(address)
      const toPublicKey = new PublicKey(to)

      // Create a transfer transaction using SystemProgram
      const lamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL))
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPublicKey,
          toPubkey: toPublicKey,
          lamports: Number(lamports),
        }),
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = fromPublicKey

      // Sign transaction using Dynamic SDK
      const signedTransaction = await dynamicSvmClient.signTransaction({
        accountAddress: address,
        externalServerKeyShares,
        transaction,
      })

      // Send transaction - Dynamic SDK may return Transaction object or serialized Buffer
      let signature: string
      if (signedTransaction instanceof Transaction) {
        // Serialize the transaction and send as raw transaction
        signature = await connection.sendRawTransaction(signedTransaction.serialize())
      } else if (Buffer.isBuffer(signedTransaction)) {
        signature = await connection.sendRawTransaction(signedTransaction)
      } else {
        // Try to serialize if it's a Transaction-like object
        const tx = signedTransaction as Transaction
        signature = await connection.sendRawTransaction(tx.serialize())
      }

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')

      this.logger.info('Solana transaction sent successfully', {
        address,
        to,
        transactionHash: signature,
        chainId: this.chainMetadata.chainId,
      })

      return {
        transactionHash: signature,
      }
    } catch (error) {
      // Use shared error handling utility
      handleDynamicSDKError(error, 'send transaction', {
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
    }
  }
}
