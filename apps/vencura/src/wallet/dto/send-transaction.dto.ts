import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsNumber, Min, Matches } from 'class-validator'

export class SendTransactionDto {
  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    description: 'Recipient address',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message:
      'Invalid Ethereum address format. Must be a valid 0x-prefixed 40-character hex address.',
  })
  to!: string

  @ApiProperty({ example: 0.001, description: 'Amount in ETH' })
  @IsNumber()
  @Min(0)
  amount!: number
}
