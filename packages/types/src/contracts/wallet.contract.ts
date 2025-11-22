import {
  CreateWalletInputSchema,
  WalletSchema,
  SendTransactionInputSchema,
  SendTransactionResultSchema,
} from '../schemas/wallet.schema'

/**
 * Create wallet endpoint contract.
 * Defines the POST /wallets endpoint structure.
 */
export const createWalletContract = {
  method: 'POST' as const,
  path: '/wallets',
  body: CreateWalletInputSchema,
  response: WalletSchema,
}

export type CreateWalletContract = typeof createWalletContract

/**
 * Send transaction endpoint contract.
 * Defines the POST /wallets/:id/send endpoint structure.
 */
export const sendTransactionContract = {
  method: 'POST' as const,
  path: '/wallets/:id/send',
  body: SendTransactionInputSchema,
  response: SendTransactionResultSchema,
}

export type SendTransactionContract = typeof sendTransactionContract
