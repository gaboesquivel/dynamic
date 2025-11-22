import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Balance, BalanceInput } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'

export const useWalletBalance = (input: BalanceInput): UseQueryResult<Balance, Error> => {
  const client = useVencuraClient()

  return useQuery({
    queryKey: ['wallet-balance', input.chainId, input.chainType, input.tokenAddress],
    queryFn: () => client.getBalance(input),
    enabled: input.chainId != null && Boolean(input.chainType),
  })
}
