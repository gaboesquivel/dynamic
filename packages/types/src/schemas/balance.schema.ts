import { z } from 'zod'
import { ChainTypeSchema } from './wallet.schema'

/**
 * Token metadata schema for balance responses.
 */
export const TokenMetadataSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number().int().min(0).max(255),
})

export type TokenMetadata = z.infer<typeof TokenMetadataSchema>

/**
 * Balance request input schema.
 * Requires chainId and chainType, with optional tokenAddress for ERC20 tokens.
 */
export const BalanceInputSchema = z.object({
  chainId: z.number().int().positive(),
  chainType: ChainTypeSchema,
  tokenAddress: z.string().optional(), // If omitted, returns native token balance
})

export type BalanceInput = z.infer<typeof BalanceInputSchema>

/**
 * Balance response schema.
 */
export const BalanceSchema = z.object({
  balance: z.string(), // Balance as string to handle large numbers
  chainId: z.number().int().positive(),
  chainType: ChainTypeSchema,
  token: TokenMetadataSchema.optional(), // Present if tokenAddress was provided
})

export type Balance = z.infer<typeof BalanceSchema>
