import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { HelloResponse } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'

export const useHello = (): UseQueryResult<HelloResponse, Error> => {
  const client = useVencuraClient()

  return useQuery({
    queryKey: ['hello'],
    queryFn: () => client.hello(),
  })
}
