import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EncryptionService } from '../common/encryption.service'
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
import * as schema from '../database/schema'
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

  async createWallet(
    userId: string,
    chainId: number | string,
  ): Promise<{ id: string; address: string; network: string; chainType: ChainType }> {
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
      throw new BadRequestException(`Could not determine Dynamic network ID for chain: ${chainId}`)

    const chainType = getChainType(chainId)
    if (!chainType)
      throw new BadRequestException(`Could not determine chain type for chain: ${chainId}`)

    // Get appropriate wallet client
    const walletClient = this.walletClientFactory.createWalletClient(chainId)
    if (!walletClient)
      throw new BadRequestException(`Wallet client not available for chain: ${chainId}`)

    // Create wallet using chain-specific client
    const wallet = await walletClient.createWallet()

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
