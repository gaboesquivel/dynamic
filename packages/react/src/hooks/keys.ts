import { createQueryKeys } from '@lukemorales/query-key-factory'

/**
 * Query key factory for wallet-related queries.
 * Provides centralized, type-safe query keys for cache management.
 *
 * @example
 * ```tsx
 * import { walletsKeys } from '@vencura/react/hooks/keys'
 * import { useQueryClient } from '@tanstack/react-query'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all wallet queries
 * queryClient.invalidateQueries({ queryKey: walletsKeys._def })
 *
 * // Invalidate specific wallet balance
 * queryClient.invalidateQueries({ queryKey: walletsKeys.balance(walletId).queryKey })
 * ```
 */
export const walletsKeys = createQueryKeys('wallets', {
  /**
   * Query key factory for fetching all wallets.
   * Note: queryFn is provided in the hook using client from context.
   * @returns Query key for listing all wallets
   */
  all: {
    queryKey: null,
  },
  /**
   * Query key factory for fetching wallet balance.
   * Note: queryFn is provided in the hook using client from context.
   * @param id - Wallet ID
   * @returns Query key for wallet balance
   */
  balance: (id: string) => ({
    queryKey: [id, 'balance'] as const,
  }),
})
