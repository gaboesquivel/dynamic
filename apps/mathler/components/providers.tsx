'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { getEnv } from '@/lib/env'

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
      }}
    >
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
    </DynamicContextProvider>
  )
}
