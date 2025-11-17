import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { IsSupportedChain } from './validators/is-supported-chain.validator'

export class CreateWalletDto {
  @ApiProperty({
    example: 421614,
    description:
      'Chain ID (number) or Dynamic network ID (string). Examples: 421614 (Arbitrum Sepolia), 84532 (Base Sepolia), "solana-mainnet" (Solana Mainnet)',
    oneOf: [
      { type: 'number', example: 421614 },
      { type: 'string', example: 'solana-mainnet' },
    ],
  })
  @IsNotEmpty()
  @IsSupportedChain({
    message:
      'Chain ID must be a supported chain. Provide a valid chain ID (number) or Dynamic network ID (string).',
  })
  chainId!: number | string
}
