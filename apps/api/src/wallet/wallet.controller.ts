import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { WalletService } from './wallet.service'
import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CreateWalletDto } from './dto/create-wallet.dto'
import { SignMessageDto } from './dto/sign-message.dto'
import { SendTransactionDto } from './dto/send-transaction.dto'

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get all wallets for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Wallets retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          address: { type: 'string' },
          network: { type: 'string', description: 'Dynamic network ID' },
          chainType: {
            type: 'string',
            description: 'Chain type: evm, solana, cosmos, etc.',
            example: 'evm',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWallets(@CurrentUser() user: { id: string; email: string }) {
    return this.walletService.getUserWallets(user.id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 wallet creations per minute
  @ApiOperation({
    summary: 'Create a new custodial wallet',
    description:
      'Create a wallet on any supported chain. Provide chainId as a number (e.g., 421614 for Arbitrum Sepolia) or Dynamic network ID string (e.g., "solana-mainnet" for Solana).',
  })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        address: { type: 'string' },
        network: {
          type: 'string',
          description: 'Dynamic network ID',
          example: '421614',
        },
        chainType: {
          type: 'string',
          description: 'Chain type',
          example: 'evm',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or unsupported chain ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createWallet(
    @CurrentUser() user: { id: string; email: string },
    @Body() createWalletDto: CreateWalletDto,
  ) {
    return this.walletService.createWallet(user.id, createWalletDto.chainId)
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getBalance(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') walletId: string,
  ) {
    return this.walletService.getBalance(walletId, user.id)
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 sign operations per minute
  @ApiOperation({ summary: 'Sign a message with wallet private key' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: 200,
    description: 'Message signed successfully',
    schema: {
      type: 'object',
      properties: {
        signedMessage: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async signMessage(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') walletId: string,
    @Body() signMessageDto: SignMessageDto,
  ) {
    return this.walletService.signMessage(walletId, user.id, signMessageDto.message)
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 transactions per minute
  @ApiOperation({ summary: 'Send transaction on blockchain' })
  @ApiParam({ name: 'id', description: 'Wallet ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction sent successfully',
    schema: {
      type: 'object',
      properties: {
        transactionHash: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async sendTransaction(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') walletId: string,
    @Body() sendTransactionDto: SendTransactionDto,
  ) {
    return this.walletService.sendTransaction(
      walletId,
      user.id,
      sendTransactionDto.to,
      sendTransactionDto.amount,
    )
  }
}
