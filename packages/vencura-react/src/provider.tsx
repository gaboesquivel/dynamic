'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { Api, type ApiConfig } from '@vencura/core'
import { VencuraContext } from './context'

export interface VencuraProviderProps {
  /**
   * Base URL for the Vencura API.
   * @example "https://api.vencura.com"
   */
  baseUrl?: string
  /**
   * Default headers to include with all requests.
   * @example { Authorization: "Bearer token" }
   */
  headers?: Record<string, string>
  /**
   * Security worker function to handle authentication.
   * Called for each request marked as secure.
   */
  securityWorker?: ApiConfig<unknown>['securityWorker']
  /**
   * Optional QueryClient instance. If not provided, a default one will be created.
   */
  queryClient?: QueryClient
  /**
   * React children to render.
   */
  children: ReactNode
}

/**
 * Provider component that wraps your app and provides the Vencura API client
 * and React Query context to all child components.
 *
 * @example
 * ```tsx
 * import { VencuraProvider } from '@vencura/react'
 *
 * function App() {
 *   return (
 *     <VencuraProvider
 *       baseUrl="https://api.vencura.com"
 *       headers={{ Authorization: 'Bearer token' }}
 *     >
 *       <YourApp />
 *     </VencuraProvider>
 *   )
 * }
 * ```
 */
export function VencuraProvider({
  baseUrl,
  headers,
  securityWorker,
  queryClient: providedQueryClient,
  children,
}: VencuraProviderProps) {
  const queryClient = useMemo(
    () =>
      providedQueryClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 3,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [providedQueryClient],
  )

  const apiClient = useMemo(
    () =>
      new Api({
        baseUrl,
        baseApiParams: {
          headers,
        },
        securityWorker,
      }),
    [baseUrl, headers, securityWorker],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <VencuraContext.Provider value={apiClient}>{children}</VencuraContext.Provider>
    </QueryClientProvider>
  )
}
