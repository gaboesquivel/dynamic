import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { ListWalletsResponse } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'
import { wallets } from '../queries/wallets'

export const useWallets = (): UseQueryResult<ListWalletsResponse, Error> => {
  const client = useVencuraClient()

  return useQuery<ListWalletsResponse, Error>({
    ...wallets.all,
    queryFn: () => client.listWallets(),
  })
}
