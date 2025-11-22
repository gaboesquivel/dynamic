import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Balance, BalanceInput } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'
import { balance } from '../queries/balance'

export const useWalletBalance = (input: BalanceInput): UseQueryResult<Balance, Error> => {
  const client = useVencuraClient()

  return useQuery<Balance, Error>({
    ...balance.detail(input),
    queryFn: () => client.getBalance(input),
    enabled: input.chainId != null && Boolean(input.chainType),
  })
}
