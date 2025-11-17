'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { VencuraProvider } from '@vencura/react'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useVencuraHeaders } from '@/hooks/use-vencura-headers'
import { getEnv } from '@/lib/env'

function VencuraProviderWrapper({ children }: { children: React.ReactNode }) {
  const headers = useVencuraHeaders()
  const env = getEnv()
  const baseUrl = env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  return (
    <VencuraProvider baseUrl={baseUrl} headers={headers}>
      {children}
      {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </VencuraProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const env = getEnv()
  const environmentId = env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID

  // Warn/error handling for missing environment ID
  React.useEffect(() => {
    if (!environmentId) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is required in production. Please set it in your environment variables.',
        )
        // In production, log error but don't throw to avoid breaking the app
        // The placeholder ID will be used, but authentication won't work properly
      } else {
        console.warn(
          'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set. Using placeholder ID. Set this environment variable to enable Dynamic authentication.',
        )
      }
    }
  }, [environmentId])

  return (
    <DynamicContextProvider
      settings={{
        environmentId: environmentId || 'placeholder-id',
        walletConnectors: [EthereumWalletConnectors, SolanaWalletConnectors],
      }}
    >
      <VencuraProviderWrapper>
        <NuqsAdapter>
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
          </NextThemesProvider>
        </NuqsAdapter>
      </VencuraProviderWrapper>
    </DynamicContextProvider>
  )
}
