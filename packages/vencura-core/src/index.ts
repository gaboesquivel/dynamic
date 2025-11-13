// Export ts-rest client as primary API
export { createVencuraClient, type VencuraClient, type VencuraClientConfig } from './client.js'

// Re-export types from contracts for convenience
export type {
  Wallet,
  CreateWalletInput,
  WalletBalance,
  SignMessageInput,
  SignMessageResult,
  SendTransactionInput,
  SendTransactionResult,
} from '@vencura/types'
