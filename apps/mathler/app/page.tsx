'use client'

import { useState, useEffect } from 'react'
import MathlerGame from '@/components/mathler-game'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <MathlerGame />
    </main>
  )
}
