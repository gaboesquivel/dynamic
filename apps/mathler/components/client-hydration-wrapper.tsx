'use client'

import { useState, useEffect } from 'react'
import { MathlerGameSkeleton } from './mathler-game-skeleton'

export function ClientHydrationWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <MathlerGameSkeleton />
  }

  return <>{children}</>
}
