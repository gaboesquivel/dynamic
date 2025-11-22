import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { ListWalletsResponse } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'

export const useWallets = (): UseQueryResult<ListWalletsResponse, Error> => {
  const client = useVencuraClient()

  return useQuery({
    queryKey: ['wallets'],
    queryFn: () => client.listWallets(),
  })
}
