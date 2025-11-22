/**
 * @vencura/react
 *
 * React hooks for the Vencura API using TanStack Query.
 * Built on top of @vencura/core with contract-first architecture.
 *
 * @packageDocumentation
 */

export { VencuraProvider } from './provider'
export { useHello } from './hooks/use-hello'
export { useVencuraClient } from './hooks/use-vencura-client'
export { useWallets } from './hooks/use-wallets'
export { useCreateWallet } from './hooks/use-create-wallet'
export { useWalletBalance } from './hooks/use-wallet-balance'
export { useSendTransaction } from './hooks/use-send-transaction'
export type { UseSendTransactionInput } from './hooks/use-send-transaction'
export * from './queries'
