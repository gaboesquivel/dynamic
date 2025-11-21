import { createContext, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createVencuraClient, type VencuraClient } from '@vencura/core'

export interface VencuraProviderProps {
  baseUrl: string
  headers?: Record<string, string>
  children: ReactNode
}

const VencuraContext = createContext<{ client: VencuraClient } | null>(null)

export const VencuraProvider = ({ baseUrl, headers, children }: VencuraProviderProps) => {
  const queryClient = new QueryClient()
  const client = createVencuraClient({ baseUrl, headers })

  return (
    <QueryClientProvider client={queryClient}>
      <VencuraContext.Provider value={{ client }}>{children}</VencuraContext.Provider>
    </QueryClientProvider>
  )
}

export { VencuraContext }
