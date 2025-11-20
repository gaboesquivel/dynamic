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
// Lodash imports removed - using direct imports for ESM compatibility
import {
  createWalletClient,
  createPublicClient,
  http,
  formatEther,
  parseEther,
  type LocalAccount,
  type Hex,
  type TypedData,
  type SignableMessage,
  type TransactionSerializable,
} from 'viem'
import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm'
import { getViemChain, getDefaultRpcUrl, type ChainMetadata } from '../../common/chains'
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
  classifyDynamicSDKError,
} from './base-wallet-client'
import { LoggerService } from '../../common/logger/logger.service'
import { RateLimitService } from '../../common/rate-limit.service'

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

@Injectable()
export class EvmWalletClient extends BaseWalletClient {
  private dynamicEvmClient: DynamicEvmWalletClient | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly chainMetadata: ChainMetadata,
    private readonly rateLimitService: RateLimitService,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    super()
  }

  private async getDynamicEvmClient(): Promise<DynamicEvmWalletClient> {
    if (this.dynamicEvmClient) return this.dynamicEvmClient

    try {
      const environmentId = this.configService.get<string>('dynamic.environmentId')
      const apiToken = this.configService.get<string>('dynamic.apiToken')

      if (!environmentId || !apiToken) {
        throw new InternalServerErrorException('Dynamic configuration is not set')
      }

      // Use dynamic import for ESM module compatibility
      // Dynamic SDK packages are ESM-only - dynamic import() works from CommonJS
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const module = await import('@dynamic-labs-wallet/node-evm')
      const DynamicEvmWalletClientClass = module.DynamicEvmWalletClient
      this.dynamicEvmClient = new DynamicEvmWalletClientClass({ environmentId })
      await this.dynamicEvmClient.authenticateApiToken(apiToken)

      return this.dynamicEvmClient
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

  async createWallet(params: CreateWalletParams): Promise<CreateWalletResult> {
    try {
      this.logger.info('Creating EVM wallet', {
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })

      const dynamicEvmClient = await this.getDynamicEvmClient()

      // Use dynamic import for ESM module compatibility
      // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
      const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')

      // Leverage Dynamic SDK return type directly - no unnecessary mapping
      // Retry logic removed - delays are handled at test level to prevent rate limits
      const wallet = await dynamicEvmClient.createWalletAccount({
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
        this.logger.info('EVM wallet created successfully', {
          ...sanitized,
          chainId: this.chainMetadata.chainId,
        })
      }

      // Return Dynamic SDK result directly (matches CreateWalletResult interface)
      return wallet
    } catch (error) {
      // Extract error message for logging
      const errorMessage = extractDynamicSDKErrorMessage(error) || 'Unknown error'

      // Check if this is a "multiple wallets" error - don't log as error (it's expected behavior)
      const classification = classifyDynamicSDKError(error, errorMessage)
      const isMultipleWalletsError = classification.type === 'multiple_wallets'
      const lowerMessage = errorMessage.toLowerCase()
      const errorStack = error instanceof Error ? error.stack : ''
      const stackLower = errorStack.toLowerCase()
      const isExpectedError =
        isMultipleWalletsError ||
        lowerMessage.includes('multiple wallets per chain') ||
        lowerMessage.includes('wallet already exists') ||
        stackLower.includes('multiple wallets per chain')

      // Only log as error if it's NOT an expected "multiple wallets" error
      if (!isExpectedError) {
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
            extractedMessage: errorMessage,
          }
          // Try to get all properties including non-enumerable ones
          if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>
            // Check for nested error structures
            if (errorObj.error) {
              errorDetails.nestedError = errorObj.error
              if (typeof errorObj.error === 'object' && errorObj.error !== null) {
                const nested = errorObj.error as Record<string, unknown>
                errorDetails.nestedErrorKeys = Object.keys(nested)
                errorDetails.nestedErrorMessage = nested.message
                errorDetails.nestedErrorError = nested.error
              }
            }
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
      }

      // Use shared error handling utility
      // Try to extract existing wallet address from error BEFORE calling handleDynamicSDKError
      // This allows us to pass the address in error details for proper handling
      const { extractExistingWalletAddress } = await import('./base-wallet-client')
      const existingAddress =
        extractExistingWalletAddress(error) || params.existingWalletAddress || undefined

      // For "multiple wallets" errors, include existing wallet address in details
      // This allows wallet.service to return the existing wallet instead of throwing error
      handleDynamicSDKError(error, 'create wallet', {
        existingWalletAddress: existingAddress,
        chainId: params.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
    }
  }

  async getBalance(address: string): Promise<BalanceResult> {
    // Destructure chainMetadata
    const { chainId, dynamicNetworkId } = this.chainMetadata

    const viemChain = getViemChain(chainId)
    if (!viemChain) throw new Error(`Unsupported EVM chain: ${chainId}`)

    // Get RPC URL with priority: custom env var > Dynamic default > viem default
    const customRpcUrl = this.configService.get<string>(`rpc.${dynamicNetworkId}`)
    const rpcUrl = getDefaultRpcUrl(chainId, customRpcUrl) || viemChain.rpcUrls.default.http[0]

    const client = createPublicClient({
      chain: viemChain,
      transport: http(rpcUrl),
    })

    const balance = await client.getBalance({
      address: address as `0x${string}`,
    })

    return {
      balance: parseFloat(formatEther(balance)),
    }
  }

  async signMessage(
    address: string,
    externalServerKeyShares: string[],
    message: string,
  ): Promise<SignMessageResult> {
    try {
      this.logger.info('Signing EVM message', {
        address,
        chainId: this.chainMetadata.chainId,
        messageLength: message.length,
      })

      const dynamicEvmClient = await this.getDynamicEvmClient()

      // Retry logic removed - delays are handled at test level to prevent rate limits
      const signature = await dynamicEvmClient.signMessage({
        accountAddress: address,
        externalServerKeyShares,
        message,
      })

      this.logger.info('EVM message signed successfully', {
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
      // Destructure chainMetadata and params
      const { chainId, dynamicNetworkId } = this.chainMetadata
      const { to, amount, data } = params

      this.logger.info('Sending EVM transaction', {
        address,
        to,
        amount,
        chainId,
        hasData: !!data,
      })

      const viemChain = getViemChain(chainId)
      if (!viemChain) {
        throw new InternalServerErrorException(`Unsupported EVM chain: ${chainId}`)
      }

      const dynamicEvmClient = await this.getDynamicEvmClient()

      // Get RPC URL with priority: custom env var > Dynamic default > viem default
      const customRpcUrl = this.configService.get<string>(`rpc.${dynamicNetworkId}`)
      const rpcUrl = getDefaultRpcUrl(chainId, customRpcUrl) || viemChain.rpcUrls.default.http[0]

      // Helper to convert SignableMessage to string for Dynamic SDK
      const messageToString = (message: SignableMessage): string => {
        if (typeof message === 'string') return message
        if (message instanceof Uint8Array) {
          return new TextDecoder().decode(message)
        }
        if ('raw' in message) {
          if (typeof message.raw === 'string') return message.raw
          return new TextDecoder().decode(message.raw)
        }
        return String(message)
      }

      // Create a wallet account that can sign transactions
      const account = {
        address: address as `0x${string}`,
        type: 'local' as const,
        signMessage: async ({ message }: { message: SignableMessage }) => {
          const messageStr = messageToString(message)
          return (await dynamicEvmClient.signMessage({
            accountAddress: address,
            externalServerKeyShares,
            message: messageStr,
          })) as Hex
        },
        signTypedData: async <const TTypedData extends TypedData | { [key: string]: unknown }>(
          parameters: TTypedData,
        ) =>
          (await dynamicEvmClient.signTypedData({
            accountAddress: address,
            externalServerKeyShares,
            typedData: parameters,
          })) as Hex,
        signTransaction: async <
          transaction extends TransactionSerializable = TransactionSerializable,
        >(
          transaction: transaction,
        ) =>
          (await dynamicEvmClient.signTransaction({
            senderAddress: address,
            externalServerKeyShares,
            transaction,
          })) as Hex,
      } as LocalAccount

      const walletClient = createWalletClient({
        account,
        chain: viemChain,
        transport: http(rpcUrl),
      })

      // Retry logic removed - delays are handled at test level to prevent rate limits
      // Dynamic SDK calls happen inside account.signMessage/signTypedData/signTransaction
      // which are called by viem during sendTransaction
      const hash = await walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount.toString()),
        ...(data && { data: data as Hex }),
      })

      this.logger.info('EVM transaction sent successfully', {
        address,
        to,
        transactionHash: hash,
        chainId,
      })

      return {
        transactionHash: hash,
      }
    } catch (error) {
      // Use shared error handling utility
      // Extract transaction hash if available (from successful send before error)
      handleDynamicSDKError(error, 'send transaction', {
        chainId: this.chainMetadata.chainId,
        dynamicNetworkId: this.chainMetadata.dynamicNetworkId,
      })
    }
  }
}
