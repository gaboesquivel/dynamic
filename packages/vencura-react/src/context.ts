import { createContext, useContext } from 'react'
import type { Api } from '@vencura/core'

/**
 * Context for the Vencura API client instance.
 * Used internally by hooks to access the API client.
 */
export const VencuraContext = createContext<Api<unknown> | null>(null)

/**
 * Hook to access the Vencura API client from context.
 * @throws {Error} If used outside of VencuraProvider
 * @returns The Vencura API client instance
 */
export function useVencuraClient() {
  const client = useContext(VencuraContext)
  if (!client) {
    throw new Error('useVencuraClient must be used within VencuraProvider')
  }
  return client
}
