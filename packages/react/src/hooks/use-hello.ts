import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { HelloResponse } from '@vencura/types'
import { useVencuraClient } from './use-vencura-client'
import { hello } from '../queries/hello'

export const useHello = (): UseQueryResult<HelloResponse, Error> => {
  const client = useVencuraClient()

  return useQuery<HelloResponse, Error>({
    ...hello.all,
    queryFn: () => client.hello(),
  })
}
