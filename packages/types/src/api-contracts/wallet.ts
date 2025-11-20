import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import {
  Wallet,
  CreateWalletInput,
  WalletBalance,
  SignMessageInput,
  SignMessageResult,
  SendTransactionInput,
  SendTransactionResult,
} from '../schemas/wallet'

const c = initContract()

/**
 * Error details schema for enhanced error responses.
 * Optional fields provide context for debugging and user guidance.
 */
export const ErrorDetailsSchema = z.object({
  existingWalletAddress: z.string().optional(),
  chainId: z.union([z.number(), z.string()]).optional(),
  dynamicNetworkId: z.string().optional(),
  transactionHash: z.string().optional(),
})

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>

/**
 * Error response schema with message and optional details.
 */
export const ErrorResponseSchema = z.object({
  message: z.string(),
  details: ErrorDetailsSchema.optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/**
 * Wallet API contract defining all wallet-related endpoints.
 * This API contract is shared between backend, SDK, and frontend for type safety.
 */
export const walletAPIContract = c.router({
  /**
   * List all wallets for the authenticated user.
   */
  list: {
    method: 'GET',
    path: '/wallets',
    responses: {
      200: z.array(Wallet),
      401: z.object({ message: z.string() }),
    },
    summary: 'Get all wallets for the authenticated user',
  },
  /**
   * Create a new custodial wallet (idempotent).
   */
  create: {
    method: 'POST',
    path: '/wallets',
    body: CreateWalletInput,
    responses: {
      200: Wallet, // Idempotent creation - wallet already exists
      201: Wallet, // New wallet created
      400: ErrorResponseSchema,
      401: z.object({ message: z.string() }),
    },
    summary: 'Create a new custodial wallet (idempotent)',
  },
  /**
   * Get wallet balance.
   */
  getBalance: {
    method: 'GET',
    path: '/wallets/:id/balance',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: WalletBalance,
      401: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get wallet balance',
  },
  /**
   * Sign a message with wallet's private key.
   */
  signMessage: {
    method: 'POST',
    path: '/wallets/:id/sign',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: SignMessageInput,
    responses: {
      200: SignMessageResult,
      401: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Sign a message with wallet private key',
  },
  /**
   * Send a transaction from a wallet.
   */
  sendTransaction: {
    method: 'POST',
    path: '/wallets/:id/send',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: SendTransactionInput,
    responses: {
      200: SendTransactionResult,
      401: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Send transaction on blockchain',
  },
})
