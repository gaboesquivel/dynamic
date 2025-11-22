import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { Wallet, CreateWalletInput } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'

export const useCreateWallet = (): UseMutationResult<Wallet, Error, CreateWalletInput> => {
  const client = useVencuraClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWalletInput) => client.createWallet(input),
    onSuccess: () => {
      // Invalidate wallets query to refetch list
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })
}
