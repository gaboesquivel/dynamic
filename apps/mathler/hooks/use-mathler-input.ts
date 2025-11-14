'use client'

import { useState, useCallback, useEffect } from 'react'

interface UseMathlerInputProps {
  maxLength: number
  gameStatus: 'playing' | 'won' | 'lost'
  onSubmit: (value: string) => void
}

export function useMathlerInput({ maxLength, gameStatus, onSubmit }: UseMathlerInputProps) {
  const [input, setInput] = useState('')
  const [cursor, setCursor] = useState(0)

  const insertAt = useCallback(
    (char: string, position = cursor) => {
      if (gameStatus !== 'playing') return
      const next = input.slice(0, position) + char + input.slice(position)
      if (next.length <= maxLength) {
        setInput(next)
        setCursor(position + 1)
      }
    },
    [input, cursor, maxLength, gameStatus],
  )

  const backspace = useCallback(() => {
    if (gameStatus !== 'playing' || cursor === 0) return
    const next = input.slice(0, cursor - 1) + input.slice(cursor)
    setInput(next)
    setCursor(cursor - 1)
  }, [input, cursor, gameStatus])

  const moveCursor = useCallback(
    (dir: 'left' | 'right') => {
      if (gameStatus !== 'playing') return
      setCursor(c => (dir === 'left' ? Math.max(0, c - 1) : Math.min(input.length, c + 1)))
    },
    [input.length, gameStatus],
  )

  const clear = useCallback(() => {
    if (gameStatus !== 'playing') return
    setInput('')
    setCursor(0)
  }, [gameStatus])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return

      // Prevent default for game keys
      if (
        /^[0-9+\-*/]$/.test(e.key) ||
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Enter' ||
        e.key === 'Escape' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        e.preventDefault()
      }

      // Handle arrow keys for cursor navigation
      if (e.key === 'ArrowLeft') {
        moveCursor('left')
        return
      }
      if (e.key === 'ArrowRight') {
        moveCursor('right')
        return
      }

      // Handle Escape to clear
      if (e.key === 'Escape') {
        clear()
        return
      }

      // Handle number and operator keys
      if (/^[0-9+\-*/]$/.test(e.key)) {
        insertAt(e.key)
        return
      }

      // Handle × and ÷ from keyboard (Alt+0215 for ×, Alt+0247 for ÷)
      if (e.key === '×' || (e.altKey && e.key === 'x')) {
        insertAt('×')
        return
      }
      if (e.key === '÷' || (e.altKey && e.key === '/')) {
        insertAt('÷')
        return
      }

      // Handle backspace/delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        backspace()
        return
      }

      // Handle enter
      if (e.key === 'Enter' && input) {
        onSubmit(input)
        clear()
        return
      }
    },
    [gameStatus, insertAt, backspace, moveCursor, clear, input, onSubmit],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const reset = useCallback(() => {
    setInput('')
    setCursor(0)
  }, [])

  return {
    input,
    cursor,
    insertAt,
    backspace,
    moveCursor,
    clear,
    setCursor,
    reset,
  }
}
