// Export ts-rest client as primary API
export { createVencuraClient, type VencuraClient, type VencuraClientConfig } from './client'

// Re-export types from API contracts for convenience
export type {
  Wallet,
  CreateWalletInput,
  WalletBalance,
  SignMessageInput,
  SignMessageResult,
  SendTransactionInput,
  SendTransactionResult,
} from '@vencura/types'
