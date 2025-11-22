import { Elysia } from 'elysia'
import { z } from 'zod'
import { getErrorMessage } from '@vencura/lib'
import { getUserId } from '../middleware/auth'
import { createWalletService, getUserWallets } from '../services/wallet.service'
import { getBalanceService } from '../services/balance.service'
import { sendTransactionService } from '../services/transaction.service'
import {
  WalletSchema,
  BalanceSchema,
  SendTransactionResultSchema,
  ChainTypeSchema,
  type ChainType,
} from '@vencura/types'

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  id: z.string().optional(),
})

const toolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.unknown()),
})

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
})

// Shared chain type options for tool parameter definitions
const CHAIN_TYPE_OPTIONS = [
  'evm',
  'solana',
  'cosmos',
  'bitcoin',
  'flow',
  'starknet',
  'algorand',
  'sui',
  'spark',
  'tron',
] as const

// Zod schemas for tool input validation
const createWalletToolInputSchema = z.object({
  chainType: ChainTypeSchema,
})

const getBalanceToolInputSchema = z.object({
  chainId: z.number().int().positive(),
  chainType: ChainTypeSchema,
  tokenAddress: z.string().optional(),
})

const sendTransactionToolInputSchema = z.object({
  walletId: z.string().min(1),
  to: z.string().min(1),
  amount: z.number().nonnegative(),
  data: z.string().optional(),
})

// Tool definitions for wallet operations
const walletTools = [
  {
    name: 'getWallets',
    description: 'List all wallets for the authenticated user',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'createWallet',
    description: 'Create a new custodial wallet for a specific chain type',
    parameters: {
      type: 'object',
      properties: {
        chainType: {
          type: 'string',
          enum: CHAIN_TYPE_OPTIONS,
          description: 'The chain type to create the wallet for',
        },
      },
      required: ['chainType'],
    },
  },
  {
    name: 'getBalance',
    description: 'Get the balance of a wallet for a specific chain',
    parameters: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'The chain ID (e.g., 421614 for Arbitrum Sepolia)',
        },
        chainType: {
          type: 'string',
          enum: CHAIN_TYPE_OPTIONS,
          description: 'The chain type',
        },
        tokenAddress: {
          type: 'string',
          description:
            'Optional token address for ERC20 token balance. If omitted, returns native token balance.',
        },
      },
      required: ['chainId', 'chainType'],
    },
  },
  {
    name: 'sendTransaction',
    description: 'Send a transaction from a wallet',
    parameters: {
      type: 'object',
      properties: {
        walletId: {
          type: 'string',
          description: 'The wallet ID to send from',
        },
        to: {
          type: 'string',
          description: 'The recipient address',
        },
        amount: {
          type: 'number',
          description: 'The amount to send',
        },
        data: {
          type: 'string',
          description: 'Optional transaction data',
        },
      },
      required: ['walletId', 'to', 'amount'],
    },
  },
]

async function executeTool({
  toolCall,
  userId,
}: {
  toolCall: z.infer<typeof toolCallSchema>
  userId: string
}): Promise<unknown> {
  switch (toolCall.name) {
    case 'getWallets': {
      const wallets = await getUserWallets(userId)
      return wallets.map(w => ({
        id: w.id,
        address: w.address,
        chainType: w.chainType,
      }))
    }

    case 'createWallet': {
      const validated = createWalletToolInputSchema.parse(toolCall.arguments)
      const result = await createWalletService({
        userId,
        chainType: validated.chainType,
      })
      return WalletSchema.parse({
        id: result.id,
        address: result.address,
        chainType: result.chainType,
      })
    }

    case 'getBalance': {
      const validated = getBalanceToolInputSchema.parse(toolCall.arguments)
      const result = await getBalanceService({
        userId,
        chainId: validated.chainId,
        chainType: validated.chainType,
        tokenAddress: validated.tokenAddress,
      })
      return BalanceSchema.parse(result)
    }

    case 'sendTransaction': {
      const validated = sendTransactionToolInputSchema.parse(toolCall.arguments)
      const result = await sendTransactionService({
        userId,
        walletId: validated.walletId,
        to: validated.to,
        amount: validated.amount,
        data: validated.data ?? undefined,
      })
      return SendTransactionResultSchema.parse({
        transactionHash: result.transactionHash,
      })
    }

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`)
  }
}

export const chatRoute = new Elysia()
  .derive(({ request }) => ({
    userId: getUserId(request),
  }))
  .get('/chat/tools', () => {
    return walletTools
  })
  .post('/chat', async ({ body, userId }) => {
    try {
      const validated = chatRequestSchema.parse(body)

      // For now, return a simple response indicating tool calls are supported
      // In a full implementation, this would integrate with an AI provider (OpenAI, Anthropic, etc.)
      // and handle tool calls automatically
      return {
        message: {
          role: 'assistant' as const,
          content:
            'I can help you manage your wallets. Available operations: create wallet, list wallets, check balance, send transactions.',
        },
        finishReason: 'stop' as const,
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err) ?? String(err)
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          message: errorMessage,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  })
