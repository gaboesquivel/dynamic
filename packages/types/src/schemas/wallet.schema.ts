import { z } from 'zod'

/**
 * Chain type schema - supported chain types.
 */
export const ChainTypeSchema = z.enum([
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
])

export type ChainType = z.infer<typeof ChainTypeSchema>

/**
 * Create wallet input schema.
 */
export const CreateWalletInputSchema = z.object({
  chainType: ChainTypeSchema,
})

export type CreateWalletInput = z.infer<typeof CreateWalletInputSchema>

/**
 * Wallet response schema.
 */
export const WalletSchema = z.object({
  id: z.string(),
  address: z.string(),
  chainType: ChainTypeSchema,
})

export type Wallet = z.infer<typeof WalletSchema>

/**
 * Send transaction input schema.
 */
export const SendTransactionInputSchema = z.object({
  to: z.string().min(1),
  amount: z.number().nonnegative(),
  data: z.string().nullable().optional(),
})

export type SendTransactionInput = z.infer<typeof SendTransactionInputSchema>

/**
 * Send transaction result schema.
 */
export const SendTransactionResultSchema = z.object({
  transactionHash: z.string().min(1),
})

export type SendTransactionResult = z.infer<typeof SendTransactionResultSchema>
