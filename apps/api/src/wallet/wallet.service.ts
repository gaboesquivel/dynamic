import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EncryptionService } from '../common/encryption.service'
import { LoggerService } from '../common/logger/logger.service'
import {
  getChainMetadata,
  getDynamicNetworkId,
  isSupportedChain,
  getChainType,
} from '../common/chains'
import { validateAddress } from '../common/address-validation'
import type { ChainType } from '@vencura/core'
import { WalletClientFactory } from './clients/wallet-client-factory'
import type {
  BalanceResult,
  SignMessageResult,
  SendTransactionResult,
} from './clients/base-wallet-client'
import { isHttpException } from './clients/base-wallet-client'
import * as schema from '../database/schema/index'
import { eq, and } from 'drizzle-orm'
import { keySharesSchema, chainTypeSchema, parseJsonWithSchema } from '@vencura/lib'

@Injectable()
export class WalletService {
  constructor(
    @Inject('DATABASE')
    private readonly db: ReturnType<typeof import('drizzle-orm/pglite').drizzle>,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    private readonly walletClientFactory: WalletClientFactory,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {}

  /**
   * Helper method to get wallet by ID and userId with existence check.
   * Reduces boilerplate across multiple service methods.
   */
  private async getWalletByIdAndUserId(
    walletId: string,
    userId: string,
  ): Promise<typeof schema.wallets.$inferSelect> {
    const [wallet] = await this.db
      .select()
      .from(schema.wallets)
      .where(and(eq(schema.wallets.id, walletId), eq(schema.wallets.userId, userId)))
      .limit(1)

    if (!wallet) throw new NotFoundException('Wallet not found')

    return wallet
  }

  /**
   * Helper method to get existing wallet by userId and network (Dynamic network ID).
   * Returns wallet address if found, null otherwise.
   * Used to provide existing wallet address in error details when multiple wallets error occurs.
   *
   * @param userId - User ID
   * @param network - Dynamic network ID (string)
   * @returns Wallet address if found, null otherwise
   */
  async getExistingWalletByChain({
    userId,
    network,
  }: {
    userId: string
    network: string
  }): Promise<string | null> {
    const [wallet] = await this.db
      .select({ address: schema.wallets.address })
      .from(schema.wallets)
      .where(and(eq(schema.wallets.userId, userId), eq(schema.wallets.network, network)))
      .limit(1)

    return wallet?.address || null
  }

  async createWallet(
    userId: string,
    chainId: number | string,
  ): Promise<{ id: string; address: string; network: string; chainType: ChainType }> {
    try {
      // Validate chain is supported
      if (!isSupportedChain(chainId)) {
        throw new BadRequestException(
          `Unsupported chain: ${chainId}. Please provide a valid chain ID or Dynamic network ID.`,
        )
      }

      // Get chain metadata and Dynamic network ID
      const chainMetadata = getChainMetadata(chainId)
      if (!chainMetadata) throw new BadRequestException(`Invalid chain: ${chainId}`)

      const dynamicNetworkId = getDynamicNetworkId(chainId)
      if (!dynamicNetworkId)
        throw new BadRequestException(
          `Could not determine Dynamic network ID for chain: ${chainId}`,
        )

      const chainType = getChainType(chainId)
      if (!chainType)
        throw new BadRequestException(`Could not determine chain type for chain: ${chainId}`)

      // Get appropriate wallet client
      const walletClient = this.walletClientFactory.createWalletClient(chainId)
      if (!walletClient)
        throw new BadRequestException(`Wallet client not available for chain: ${chainId}`)

      // Check for existing wallet before attempting creation
      // This allows us to provide existing wallet address in error details if creation fails
      const existingWalletAddress = await this.getExistingWalletByChain({
        userId,
        network: dynamicNetworkId,
      })

      // Create wallet using chain-specific client (pass userId and chainId via RORO pattern)
      const wallet = await walletClient.createWallet({
        userId,
        chainId,
        existingWalletAddress,
      })

      // Encrypt and store the key shares
      const keySharesEncrypted = await this.encryptionService.encrypt(
        JSON.stringify(wallet.externalServerKeyShares),
      )

      const walletId = crypto.randomUUID()

      await this.db.insert(schema.wallets).values({
        id: walletId,
        userId,
        address: wallet.accountAddress,
        privateKeyEncrypted: keySharesEncrypted,
        network: dynamicNetworkId,
        chainType,
      })

      return {
        id: walletId,
        address: wallet.accountAddress,
        network: dynamicNetworkId,
        chainType,
      }
    } catch (error) {
      // Re-throw HTTP exceptions, but enrich with existing wallet address if multiple wallets error
      if (isHttpException(error)) {
        // If it's a BadRequestException with multiple wallets error, enrich with existing wallet address
        const errorResponse = error.getResponse()
        if (
          error.getStatus() === 400 &&
          errorResponse &&
          typeof errorResponse === 'object' &&
          'message' in errorResponse
        ) {
          const message = String(errorResponse.message).toLowerCase()
          if (
            message.includes('multiple wallets') ||
            message.includes('wallet already exists') ||
            message.includes('you cannot create multiple wallets')
          ) {
            // Query for existing wallet address if not already provided
            const existingWalletAddress =
              (errorResponse as any).details?.existingWalletAddress ||
              (await this.getExistingWalletByChain({
                userId,
                network: dynamicNetworkId,
              }))

            // Re-throw with enriched error details
            throw new BadRequestException({
              message: errorResponse.message,
              details: {
                existingWalletAddress: existingWalletAddress || undefined,
                chainId,
                dynamicNetworkId,
              },
            })
          }
        }
        throw error
      }

      // Log full error details for debugging
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error('WalletService.createWallet error', {
        message: errorMessage,
        stack: errorStack,
        chainId,
        userId,
      })

      // Convert unexpected errors to InternalServerErrorException
      throw new InternalServerErrorException(`Failed to create wallet: ${errorMessage}`)
    }
  }

  async getUserWallets(
    userId: string,
  ): Promise<Array<{ id: string; address: string; network: string; chainType: ChainType }>> {
    const wallets = await this.db
      .select({
        id: schema.wallets.id,
        address: schema.wallets.address,
        network: schema.wallets.network,
        chainType: schema.wallets.chainType,
      })
      .from(schema.wallets)
      .where(eq(schema.wallets.userId, userId))

    // Validate chainType using zod schema instead of type assertion
    return wallets.map(wallet => ({
      ...wallet,
      chainType: chainTypeSchema.parse(wallet.chainType),
    }))
  }

  async getBalance(walletId: string, userId: string): Promise<BalanceResult> {
    const wallet = await this.getWalletByIdAndUserId(walletId, userId)

    // Get appropriate wallet client based on stored network/chain type
    const walletClient = this.walletClientFactory.createWalletClient(wallet.network)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for network: ${wallet.network}`)

    // Get balance using chain-specific client
    return await walletClient.getBalance(wallet.address)
  }

  async signMessage(walletId: string, userId: string, message: string): Promise<SignMessageResult> {
    const wallet = await this.getWalletByIdAndUserId(walletId, userId)

    const keySharesEncrypted = await this.encryptionService.decrypt(wallet.privateKeyEncrypted)
    // Validate JSON.parse result with zod schema for type safety
    const externalServerKeyShares = parseJsonWithSchema({
      jsonString: keySharesEncrypted,
      schema: keySharesSchema,
    })

    // Get appropriate wallet client based on stored network/chain type
    const walletClient = this.walletClientFactory.createWalletClient(wallet.network)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for network: ${wallet.network}`)

    // Sign message using chain-specific client
    return await walletClient.signMessage(wallet.address, externalServerKeyShares, message)
  }

  async sendTransaction(
    walletId: string,
    userId: string,
    to: string,
    amount: number,
    data?: string,
  ): Promise<SendTransactionResult> {
    const wallet = await this.getWalletByIdAndUserId(walletId, userId)

    // Destructure wallet properties
    const { network, address, privateKeyEncrypted, chainType: chainTypeRaw } = wallet

    // Validate chainType using zod schema instead of hardcoded array
    const chainType = chainTypeSchema.parse(chainTypeRaw)

    // Validate recipient address based on wallet's chain type
    if (!validateAddress({ address: to, chainType })) {
      throw new BadRequestException(
        `Invalid address format for chain type ${chainType}. Please provide a valid ${chainType} address.`,
      )
    }

    // Validate JSON.parse result with zod schema for type safety
    const keySharesEncrypted = await this.encryptionService.decrypt(privateKeyEncrypted)
    const externalServerKeyShares = parseJsonWithSchema({
      jsonString: keySharesEncrypted,
      schema: keySharesSchema,
    })

    // Get appropriate wallet client based on stored network/chain type
    const walletClient = this.walletClientFactory.createWalletClient(network)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for network: ${network}`)

    // Send transaction using chain-specific client
    return await walletClient.sendTransaction(address, externalServerKeyShares, {
      to,
      amount,
      ...(data && { data }),
    })
  }
}
