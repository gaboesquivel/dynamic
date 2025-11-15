'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { getEnv } from '@/lib/env'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  const env = getEnv()
  const environmentId = env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID

  // Only initialize on client side after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Warn/error handling for missing environment ID
  React.useEffect(() => {
    if (!environmentId) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is required in production. Please set it in your environment variables.',
        )
      } else {
        console.warn(
          'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set. Dynamic authentication will be disabled.',
        )
      }
    }
  }, [environmentId])

  // Base providers that don't depend on Dynamic SDK
  const baseProviders = (
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
  )

  // Don't initialize Dynamic SDK if:
  // 1. Not mounted yet (SSR)
  // 2. Missing environment ID in production
  // 3. Missing environment ID in development (graceful degradation)
  if (!mounted || !environmentId) {
    return baseProviders
  }

  // Initialize Dynamic SDK with valid environment ID
  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        appName: 'Mathler',
      }}
    >
      {baseProviders}
    </DynamicContextProvider>
  )
}
