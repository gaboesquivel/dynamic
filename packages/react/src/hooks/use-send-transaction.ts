import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import type { SendTransactionResult, SendTransactionInput } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'

export interface UseSendTransactionInput extends SendTransactionInput {
  walletId: string
}

export const useSendTransaction = (): UseMutationResult<
  SendTransactionResult,
  Error,
  UseSendTransactionInput
> => {
  const client = useVencuraClient()

  return useMutation({
    mutationFn: ({ walletId, ...input }: UseSendTransactionInput) =>
      client.sendTransaction({ walletId, ...input }),
  })
}
