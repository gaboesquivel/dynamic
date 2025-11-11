import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({
    example: 'arbitrum-sepolia',
    description: 'Blockchain network',
  })
  network?: string;
}
