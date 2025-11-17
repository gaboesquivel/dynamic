import { z } from 'zod'

/**
 * Wallet schema representing a custodial wallet.
 */
export const Wallet = z.object({
  id: z.string().uuid(),
  address: z.string(),
  network: z.string().describe('Dynamic network ID'),
  chainType: z
    .enum([
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
    .describe('Chain type - aligned with Dynamic SDK supported chains'),
})

export type Wallet = z.infer<typeof Wallet>

/**
 * Chain type union type extracted from Wallet schema.
 * Aligned with Dynamic SDK supported chain types.
 */
export type ChainType = Wallet['chainType']

/**
 * Input schema for creating a new wallet.
 */
export const CreateWalletInput = z.object({
  chainId: z
    .union([z.number(), z.string()])
    .describe(
      'Chain ID (number) or Dynamic network ID (string). Examples: 421614 (Arbitrum Sepolia), "solana-mainnet"',
    ),
})

export type CreateWalletInput = z.infer<typeof CreateWalletInput>

/**
 * Wallet balance response schema.
 */
export const WalletBalance = z.object({
  balance: z.number().describe('Balance in native token units'),
})

export type WalletBalance = z.infer<typeof WalletBalance>

/**
 * Input schema for signing a message.
 */
export const SignMessageInput = z.object({
  message: z.string().min(1).describe('Message to sign'),
})

export type SignMessageInput = z.infer<typeof SignMessageInput>

/**
 * Sign message response schema.
 */
export const SignMessageResult = z.object({
  signedMessage: z.string().describe('Signed message'),
})

export type SignMessageResult = z.infer<typeof SignMessageResult>

/**
 * Input schema for sending a transaction.
 * Address format is validated server-side based on wallet's chain type.
 */
export const SendTransactionInput = z.object({
  to: z.string().min(1).describe('Recipient address - format validated based on wallet chain type'),
  amount: z.number().min(0).describe('Amount in native token units'),
})

export type SendTransactionInput = z.infer<typeof SendTransactionInput>

/**
 * Send transaction response schema.
 */
export const SendTransactionResult = z.object({
  transactionHash: z.string().describe('Transaction hash'),
})

export type SendTransactionResult = z.infer<typeof SendTransactionResult>
