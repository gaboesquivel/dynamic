/**
 * @vencura/react
 *
 * React hooks for Vencura API using TanStack Query.
 * Provides type-safe hooks for interacting with the Vencura custodial wallet API.
 *
 * @example
 * ```tsx
 * import { VencuraProvider, useWallets } from '@vencura/react'
 *
 * function App() {
 *   return (
 *     <VencuraProvider
 *       baseUrl="https://api.vencura.com"
 *       headers={{ Authorization: 'Bearer token' }}
 *     >
 *       <WalletsList />
 *     </VencuraProvider>
 *   )
 * }
 *
 * function WalletsList() {
 *   const { data: wallets, isLoading } = useWallets()
 *   // ...
 * }
 * ```
 *
 * @packageDocumentation
 */

export { VencuraProvider, type VencuraProviderProps } from './provider'
export * from './hooks'
export * from './context'

// Re-export types from @vencura/core for convenience
export type {
  Wallet,
  CreateWalletInput,
  WalletBalance,
  SignMessageInput,
  SignMessageResult,
  SendTransactionInput,
  SendTransactionResult,
} from '@vencura/core'
