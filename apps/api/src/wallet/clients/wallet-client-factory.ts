import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getChainMetadata, getChainType } from '../../common/chains'
import { LoggerService } from '../../common/logger/logger.service'
import { RateLimitService } from '../../common/rate-limit.service'
import { BaseWalletClient } from './base-wallet-client'
import { EvmWalletClient } from './evm-wallet-client'
import { SolanaWalletClient } from './solana-wallet-client'

@Injectable()
export class WalletClientFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {}

  /**
   * Create appropriate wallet client based on chain type
   */
  createWalletClient(chainId: number | string): BaseWalletClient | null {
    const chainMetadata = getChainMetadata(chainId)
    if (!chainMetadata) return null

    const chainType = getChainType(chainId)
    if (!chainType) return null

    switch (chainType) {
      case 'evm':
        return new EvmWalletClient(
          this.configService,
          chainMetadata,
          this.rateLimitService,
          this.logger,
        )
      case 'solana':
        return new SolanaWalletClient(
          this.configService,
          chainMetadata,
          this.rateLimitService,
          this.logger,
        )
      // Add other chain types as they become supported
      case 'cosmos':
      case 'bitcoin':
      case 'flow':
      case 'starknet':
      case 'algorand':
      case 'sui':
      case 'spark':
      case 'tron':
        throw new Error(`Chain type ${chainType} is not yet implemented. Chain ID: ${chainId}`)
      default:
        return null
    }
  }
}
