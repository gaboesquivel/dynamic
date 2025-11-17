'use client'

import { useMemo } from 'react'
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core'

export function useVencuraHeaders(): Record<string, string> | undefined {
  const { user } = useDynamicContext()

  return useMemo(() => {
    const token = getAuthToken()
    if (!token || !user) return undefined
    return { Authorization: `Bearer ${token}` }
  }, [user])
}
