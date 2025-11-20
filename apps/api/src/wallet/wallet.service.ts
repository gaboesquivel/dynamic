import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  HttpStatus,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'crypto'
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
import {
  keySharesSchema,
  chainTypeSchema,
  parseJsonWithSchema,
  getErrorMessage,
} from '@vencura/lib'
import isEmpty from 'lodash/isEmpty'
import isPlainObject from 'lodash/isPlainObject'
import {
  extractDynamicSDKErrorMessage,
  classifyDynamicSDKError,
} from './clients/base-wallet-client'

/**
 * Generate deterministic UUID v5 from address and network.
 * Uses SHA-1 hash of address+network to create a deterministic ID.
 */
function generateWalletId(address: string, network: string): string {
  const input = `${address}:${network}`
  const hash = createHash('sha256').update(input).digest('hex')
  // Format as UUID v4-like string (but deterministic)
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

/**
 * Parse wallet ID to extract address and network.
 * Since IDs are deterministic, we can't reverse them, so we'll need to store a mapping
 * or use address directly. For now, we'll use a lookup table approach.
 */
interface WalletInfo {
  id: string
  address: string
  network: string
  chainType: ChainType
}

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
   * Get wallet info by ID. Since IDs are deterministic, we can look up by scanning key_shares.
   * For efficiency, we'll store address+network -> ID mapping, but for now we'll scan.
   */
  private async getWalletInfoById(walletId: string): Promise<WalletInfo | null> {
    // Get all key shares and find matching ID
    const allKeyShares = await this.db.select().from(schema.keyShares)

    for (const keyShare of allKeyShares) {
      const id = generateWalletId(keyShare.address, keyShare.network)
      if (id === walletId) {
        // Determine chain type from network
        const chainType = this.getChainTypeFromNetwork(keyShare.network)
        return {
          id,
          address: keyShare.address,
          network: keyShare.network,
          chainType,
        }
      }
    }

    return null
  }

  /**
   * Get chain type from Dynamic network ID.
   */
  private getChainTypeFromNetwork(network: string): ChainType {
    if (network.startsWith('solana-')) return 'solana'
    // Default to EVM for numeric network IDs
    return 'evm'
  }

  /**
   * Extract wallet address from error details when "wallet already exists" error occurs.
   */
  private extractWalletAddressFromError(error: unknown): string | null {
    if (isHttpException(error)) {
      const response = error.getResponse()
      if (typeof response === 'object' && response !== null && 'details' in response) {
        const details = (response as { details?: { existingWalletAddress?: string } }).details
        if (details?.existingWalletAddress) {
          return details.existingWalletAddress
        }
      }
    }
    return null
  }

  async createWallet(
    userId: string,
    chainId: number | string,
  ): Promise<{
    id: string
    address: string
    network: string
    chainType: ChainType
    isNew: boolean
  }> {
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

      // Check if wallet already exists before creating (idempotent check)
      const existingWallets = await this.getUserWallets(userId)
      const existingWallet = existingWallets.find(w => w.network === dynamicNetworkId)

      // If wallet already exists, return it immediately (idempotent success)
      if (existingWallet) {
        return {
          id: existingWallet.id,
          address: existingWallet.address,
          network: existingWallet.network,
          chainType: existingWallet.chainType,
          isNew: false,
        }
      }

      // Get appropriate wallet client
      const walletClient = this.walletClientFactory.createWalletClient(chainId)
      if (!walletClient)
        throw new BadRequestException(`Wallet client not available for chain: ${chainId}`)

      // Try to create wallet via Dynamic SDK
      try {
        const wallet = await walletClient.createWallet({
          userId,
          chainId,
          existingWalletAddress: null,
        })

        // Encrypt and store the key shares
        const keySharesEncrypted = await this.encryptionService.encrypt(
          JSON.stringify(wallet.externalServerKeyShares),
        )

        // Store key shares (upsert to handle race conditions)
        await this.db
          .insert(schema.keyShares)
          .values({
            address: wallet.accountAddress,
            network: dynamicNetworkId,
            encryptedKeyShares: keySharesEncrypted,
          })
          .onConflictDoUpdate({
            target: [schema.keyShares.address, schema.keyShares.network],
            set: {
              encryptedKeyShares: keySharesEncrypted,
            },
          })

        const walletId = generateWalletId(wallet.accountAddress, dynamicNetworkId)

        return {
          id: walletId,
          address: wallet.accountAddress,
          network: dynamicNetworkId,
          chainType,
          isNew: true,
        }
      } catch (error) {
        // Extract error message using Dynamic SDK error extraction (handles nested structures)
        // This handles the case where handleDynamicSDKError has already thrown a BadRequestException
        const errorMessage =
          extractDynamicSDKErrorMessage(error) || getErrorMessage(error) || 'Unknown error'
        const lowerMessage = errorMessage.toLowerCase()

        // Check error stack for multiple wallets error (Dynamic SDK wraps errors)
        const errorStack = error instanceof Error ? error.stack : ''
        const stackLower = errorStack.toLowerCase()

        // Check if BadRequestException has existingWalletAddress in details (from handleDynamicSDKError)
        let hasExistingWalletInDetails = false
        if (isHttpException(error)) {
          const response = error.getResponse()
          if (isPlainObject(response) && response !== null) {
            const obj = response as Record<string, unknown>
            if (obj.details && isPlainObject(obj.details)) {
              const details = obj.details as Record<string, unknown>
              hasExistingWalletInDetails = typeof details.existingWalletAddress === 'string'
            }
          }
        }

        // Check if this is a "multiple wallets" error using classification
        // This handles wrapped errors and checks multiple sources
        const classification = classifyDynamicSDKError(error, errorMessage)
        const isMultipleWalletsError =
          hasExistingWalletInDetails ||
          classification.type === 'multiple_wallets' ||
          lowerMessage.includes('multiple wallets per chain') ||
          lowerMessage.includes('wallet already exists') ||
          lowerMessage.includes('you cannot create multiple wallets') ||
          stackLower.includes('multiple wallets per chain') ||
          stackLower.includes('wallet already exists') ||
          (isHttpException(error) &&
            error.getStatus() === HttpStatus.BAD_REQUEST &&
            (lowerMessage.includes('multiple wallets') ||
              lowerMessage.includes('error creating') ||
              lowerMessage.includes('wallet') ||
              stackLower.includes('multiple wallets')))

        if (isMultipleWalletsError) {
          // Try to extract wallet address from error details (from handleDynamicSDKError)
          let existingAddress = this.extractWalletAddressFromError(error)

          // Also check if BadRequestException has existingWalletAddress in details
          if (!existingAddress && isHttpException(error)) {
            const response = error.getResponse()
            if (isPlainObject(response) && response !== null) {
              const obj = response as Record<string, unknown>
              if (obj.details && isPlainObject(obj.details)) {
                const details = obj.details as Record<string, unknown>
                if (typeof details.existingWalletAddress === 'string') {
                  existingAddress = details.existingWalletAddress
                }
              }
            }
          }

          // If we can't extract from error, check if we have any wallet for this network
          // Use getUserWallets to get wallets for this user (more reliable than direct DB query)
          if (!existingAddress) {
            const existingWallets = await this.getUserWallets(userId)
            const existingWallet = existingWallets.find(w => w.network === dynamicNetworkId)
            if (existingWallet) {
              existingAddress = existingWallet.address
            } else {
              // Fallback to direct DB query if getUserWallets doesn't find it
              const [keyShare] = await this.db
                .select()
                .from(schema.keyShares)
                .where(eq(schema.keyShares.network, dynamicNetworkId))
                .limit(1)

              if (keyShare) {
                existingAddress = keyShare.address
              }
            }
          }

          // If we found an existing address, return wallet info (idempotent success)
          if (existingAddress) {
            const walletId = generateWalletId(existingAddress, dynamicNetworkId)
            return {
              id: walletId,
              address: existingAddress,
              network: dynamicNetworkId,
              chainType,
              isNew: false,
            }
          }

          // If we can't find existing wallet but know it's a "wallet already exists" error,
          // throw BadRequestException with wallet info in details (if we can extract from error)
          const extractedAddress = this.extractWalletAddressFromError(error)
          if (extractedAddress) {
            const walletId = generateWalletId(extractedAddress, dynamicNetworkId)
            throw new BadRequestException({
              message: errorMessage,
              details: {
                existingWalletAddress: extractedAddress,
                chainId,
                dynamicNetworkId,
              },
            })
          }

          // If we can't extract address, re-throw original error
          throw error
        }

        // Re-throw other errors
        throw error
      }
    } catch (error) {
      // Check for multiple wallets error in outer catch (in case inner catch didn't handle it)
      // This handles cases where handleDynamicSDKError throws BadRequestException
      if (isHttpException(error)) {
        const errorMessage = extractDynamicSDKErrorMessage(error) || getErrorMessage(error) || ''
        const lowerMessage = errorMessage.toLowerCase()
        const errorStack = error instanceof Error ? error.stack : ''
        const stackLower = errorStack.toLowerCase()

        // Check if this is a "multiple wallets" error
        const classification = classifyDynamicSDKError(error, errorMessage)
        const isMultipleWalletsError =
          classification.type === 'multiple_wallets' ||
          lowerMessage.includes('multiple wallets per chain') ||
          lowerMessage.includes('wallet already exists') ||
          stackLower.includes('multiple wallets per chain') ||
          (error.getStatus() === HttpStatus.BAD_REQUEST &&
            (lowerMessage.includes('multiple wallets') ||
              lowerMessage.includes('error creating') ||
              stackLower.includes('multiple wallets')))

        if (isMultipleWalletsError) {
          // Try to find existing wallet using getUserWallets (more reliable)
          const chainMetadata = getChainMetadata(chainId)
          if (chainMetadata) {
            const dynamicNetworkId = getDynamicNetworkId(chainId)
            if (dynamicNetworkId) {
              // Use getUserWallets to get wallets for this user
              const existingWallets = await this.getUserWallets(userId)
              const existingWallet = existingWallets.find(w => w.network === dynamicNetworkId)

              if (existingWallet) {
                const chainType = getChainType(chainId)
                if (chainType) {
                  return {
                    id: existingWallet.id,
                    address: existingWallet.address,
                    network: existingWallet.network,
                    chainType,
                    isNew: false,
                  }
                }
              } else {
                // Fallback to direct DB query if getUserWallets doesn't find it
                const [keyShare] = await this.db
                  .select()
                  .from(schema.keyShares)
                  .where(eq(schema.keyShares.network, dynamicNetworkId))
                  .limit(1)

                if (keyShare) {
                  const chainType = getChainType(chainId)
                  if (chainType) {
                    const walletId = generateWalletId(keyShare.address, dynamicNetworkId)
                    return {
                      id: walletId,
                      address: keyShare.address,
                      network: dynamicNetworkId,
                      chainType,
                      isNew: false,
                    }
                  }
                }
              }
            }
          }
        }

        // Re-throw HTTP exceptions as-is (already properly formatted)
        throw error
      }

      // Log full error details for debugging
      const errorMessage = getErrorMessage(error) || 'Unknown error'
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
    // Get all wallets from key_shares table
    // Note: We don't track userId anymore, so we return all wallets we have key shares for
    // In a real implementation, Dynamic SDK would provide user-specific wallet listing
    const keyShares = await this.db.select().from(schema.keyShares)

    return keyShares.map(keyShare => {
      const chainType = this.getChainTypeFromNetwork(keyShare.network)
      const id = generateWalletId(keyShare.address, keyShare.network)
      return {
        id,
        address: keyShare.address,
        network: keyShare.network,
        chainType,
      }
    })
  }

  async getBalance(walletId: string, userId: string): Promise<BalanceResult> {
    const walletInfo = await this.getWalletInfoById(walletId)
    if (!walletInfo) {
      throw new NotFoundException('Wallet not found')
    }

    // Get appropriate wallet client based on network
    const walletClient = this.walletClientFactory.createWalletClient(walletInfo.network)
    if (!walletClient)
      throw new BadRequestException(
        `Wallet client not available for network: ${walletInfo.network}`,
      )

    // Get balance using chain-specific client
    return await walletClient.getBalance(walletInfo.address)
  }

  async signMessage(walletId: string, userId: string, message: string): Promise<SignMessageResult> {
    const walletInfo = await this.getWalletInfoById(walletId)
    if (!walletInfo) {
      throw new NotFoundException('Wallet not found')
    }

    // Get key shares from database
    const [keyShare] = await this.db
      .select()
      .from(schema.keyShares)
      .where(
        and(
          eq(schema.keyShares.address, walletInfo.address),
          eq(schema.keyShares.network, walletInfo.network),
        ),
      )
      .limit(1)

    if (!keyShare) {
      throw new NotFoundException('Wallet key shares not found')
    }

    const keySharesEncrypted = await this.encryptionService.decrypt(keyShare.encryptedKeyShares)
    // Validate JSON.parse result with zod schema for type safety
    const externalServerKeyShares = parseJsonWithSchema({
      jsonString: keySharesEncrypted,
      schema: keySharesSchema,
    })

    // Get appropriate wallet client based on network
    const walletClient = this.walletClientFactory.createWalletClient(walletInfo.network)
    if (!walletClient)
      throw new BadRequestException(
        `Wallet client not available for network: ${walletInfo.network}`,
      )

    // Sign message using chain-specific client
    return await walletClient.signMessage(walletInfo.address, externalServerKeyShares, message)
  }

  async sendTransaction(
    walletId: string,
    userId: string,
    to: string,
    amount: number,
    data?: string,
  ): Promise<SendTransactionResult> {
    const walletInfo = await this.getWalletInfoById(walletId)
    if (!walletInfo) {
      throw new NotFoundException('Wallet not found')
    }

    // Get key shares from database
    const [keyShare] = await this.db
      .select()
      .from(schema.keyShares)
      .where(
        and(
          eq(schema.keyShares.address, walletInfo.address),
          eq(schema.keyShares.network, walletInfo.network),
        ),
      )
      .limit(1)

    if (!keyShare) {
      throw new NotFoundException('Wallet key shares not found')
    }

    // Validate chainType
    const chainType = chainTypeSchema.parse(walletInfo.chainType)

    // Validate recipient address based on wallet's chain type
    if (!validateAddress({ address: to, chainType })) {
      throw new BadRequestException(
        `Invalid address format for chain type ${chainType}. Please provide a valid ${chainType} address.`,
      )
    }

    // Validate JSON.parse result with zod schema for type safety
    const keySharesEncrypted = await this.encryptionService.decrypt(keyShare.encryptedKeyShares)
    const externalServerKeyShares = parseJsonWithSchema({
      jsonString: keySharesEncrypted,
      schema: keySharesSchema,
    })

    // Get appropriate wallet client based on network
    const walletClient = this.walletClientFactory.createWalletClient(walletInfo.network)
    if (!walletClient)
      throw new BadRequestException(
        `Wallet client not available for network: ${walletInfo.network}`,
      )

    // Send transaction using chain-specific client
    return await walletClient.sendTransaction(walletInfo.address, externalServerKeyShares, {
      to,
      amount,
      ...(data && { data }),
    })
  }
}
