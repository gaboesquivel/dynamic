import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator'

export class SendTransactionDto {
  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    description: 'Recipient address - format validated server-side based on wallet chain type',
  })
  @IsString()
  @IsNotEmpty()
  to!: string

  @ApiProperty({
    example: 0.001,
    description: 'Amount in native token units (e.g., ETH, SOL)',
  })
  @IsNumber()
  @Min(0)
  amount!: number
}
