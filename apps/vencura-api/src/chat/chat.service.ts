import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { openai, streamText } from 'ai'
import type { StreamTextResult } from 'ai'
import { WalletService } from '../wallet/wallet.service'
import { createWalletTools } from './tools/wallet-tools'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  stream?: boolean
  temperature?: number
  maxTokens?: number
}

@Injectable()
export class ChatService {
  constructor(
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  streamChat(
    messages: ChatMessage[],
    userId: string,
    options: ChatRequest = {},
  ): StreamTextResult<ReturnType<typeof createWalletTools>> {
    const openAiKey = this.configService.get<string>('ai.openAiKey')

    if (!openAiKey) {
      throw new BadRequestException(
        'OpenAI API key is not configured. Please set OPEN_AI_KEY environment variable.',
      )
    }

    const model = options.model || 'gpt-4o-mini'
    const tools = createWalletTools(this.walletService, userId)

    const result = streamText({
      model: openai(model, { apiKey: openAiKey }),
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      tools,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens,
    })

    return result as StreamTextResult<ReturnType<typeof createWalletTools>>
  }

  getTools() {
    // Return tool schemas for client reference
    return {
      getWallets: {
        name: 'getWallets',
        description: 'Get all wallets for the authenticated user',
        parameters: {},
      },
      createWallet: {
        name: 'createWallet',
        description: 'Create a new custodial wallet on a specific chain',
        parameters: {
          chainId: {
            type: 'number | string',
            description: 'Chain ID or Dynamic network ID',
          },
        },
      },
      getBalance: {
        name: 'getBalance',
        description: 'Get the balance of a specific wallet',
        parameters: {
          walletId: {
            type: 'string',
            description: 'The wallet ID',
          },
        },
      },
      sendTransaction: {
        name: 'sendTransaction',
        description: 'Send a transaction from a wallet to another address',
        parameters: {
          walletId: { type: 'string', description: 'The wallet ID' },
          to: { type: 'string', description: 'Recipient address' },
          amount: { type: 'number', description: 'Amount to send' },
        },
      },
      signMessage: {
        name: 'signMessage',
        description: 'Sign a message with a wallet private key',
        parameters: {
          walletId: { type: 'string', description: 'The wallet ID' },
          message: { type: 'string', description: 'Message to sign' },
        },
      },
    }
  }
}
