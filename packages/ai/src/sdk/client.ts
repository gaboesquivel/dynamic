import { z } from 'zod'
import { fetchWithTimeout, getErrorMessage } from '@vencura/lib'
import { createVencuraClient } from '@vencura/core'
import {
  chatMessageSchema,
  chatOptionsSchema,
  chatResponseSchema,
  streamChatDeltaSchema,
  toolSchema,
  type ChatMessage,
  type ChatOptions,
  type ChatResponse,
  type StreamChatDelta,
  type Tool,
} from './schemas'
import type { Wallet, CreateWalletInput, BalanceInput, SendTransactionInput } from '@vencura/types'

export interface ChatbotSDKConfig {
  baseUrl: string
  headers?: Record<string, string>
}

export class ChatbotSDK {
  private baseUrl: string
  private headers: Record<string, string>

  constructor({ baseUrl, headers = {} }: ChatbotSDKConfig) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.headers = headers
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    // Validate input with Zod
    const validatedMessages = z.array(chatMessageSchema).parse(messages)
    const validatedOptions = chatOptionsSchema.parse(options)

    const response = await fetchWithTimeout({
      url: `${this.baseUrl}/chat`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({
          messages: validatedMessages,
          ...validatedOptions,
        }),
      },
      timeoutMs: 30000,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Chat request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return chatResponseSchema.parse(data)
  }

  async *streamChat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): AsyncGenerator<StreamChatDelta, void, unknown> {
    // Validate input with Zod
    const validatedMessages = z.array(chatMessageSchema).parse(messages)
    const validatedOptions = chatOptionsSchema.parse(options)

    const response = await fetchWithTimeout({
      url: `${this.baseUrl}/chat`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({
          messages: validatedMessages,
          ...validatedOptions,
          stream: true,
        }),
      },
      timeoutMs: 60000,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Chat stream request failed: ${response.status} - ${errorText}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        let newlineIndex: number
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)
          if (!line) continue

          if (line.startsWith('data:')) {
            const data = line.replace(/^data:\s*/, '')
            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)
              const delta = streamChatDeltaSchema.parse(parsed)
              yield delta
            } catch (error) {
              console.error('Failed to parse SSE data:', getErrorMessage(error) || 'Unknown error')
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async getTools(): Promise<Tool[]> {
    const response = await fetchWithTimeout({
      url: `${this.baseUrl}/chat/tools`,
      options: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
      },
      timeoutMs: 10000,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Get tools request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return z.array(toolSchema).parse(data)
  }

  // Wallet operation methods for programmatic use
  // These use @vencura/core client internally
  private getWalletClient() {
    return createVencuraClient({
      baseUrl: this.baseUrl,
      headers: this.headers,
    })
  }

  async createWallet(input: CreateWalletInput): Promise<Wallet> {
    return this.getWalletClient().createWallet(input)
  }

  async getWallets(): Promise<Wallet[]> {
    return this.getWalletClient().listWallets()
  }

  async getBalance(input: BalanceInput): Promise<import('@vencura/types').Balance> {
    return this.getWalletClient().getBalance(input)
  }

  async sendTransaction(
    input: SendTransactionInput & { walletId: string },
  ): Promise<import('@vencura/types').SendTransactionResult> {
    return this.getWalletClient().sendTransaction(input)
  }
}
