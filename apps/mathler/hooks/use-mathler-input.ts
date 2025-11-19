'use client'

import { useCallback, useEffect } from 'react'
import { useSetState } from 'react-use'

interface UseMathlerInputProps {
  maxLength: number
  gameStatus: 'playing' | 'won' | 'lost'
  onSubmit: (value: string) => void
}

interface InputState {
  input: string
  cursor: number
}

export function useMathlerInput({ maxLength, gameStatus, onSubmit }: UseMathlerInputProps) {
  const [state, setState] = useSetState<InputState>({ input: '', cursor: 0 })

  const insertAt = useCallback(
    (char: string, position = state.cursor) => {
      if (gameStatus !== 'playing') return
      const next = state.input.slice(0, position) + char + state.input.slice(position)
      if (next.length <= maxLength) setState({ input: next, cursor: position + 1 })
    },
    [gameStatus, state.cursor, state.input, maxLength, setState],
  )

  const backspace = useCallback(() => {
    if (gameStatus !== 'playing' || state.cursor === 0) return
    const next = state.input.slice(0, state.cursor - 1) + state.input.slice(state.cursor)
    setState({ input: next, cursor: state.cursor - 1 })
  }, [gameStatus, state.cursor, state.input, setState])

  const moveCursor = useCallback(
    (dir: 'left' | 'right') => {
      if (gameStatus !== 'playing') return
      setState({
        cursor:
          dir === 'left'
            ? Math.max(0, state.cursor - 1)
            : Math.min(state.input.length, state.cursor + 1),
      })
    },
    [gameStatus, state.cursor, state.input.length, setState],
  )

  const clear = useCallback(() => {
    if (gameStatus !== 'playing') return
    setState({ input: '', cursor: 0 })
  }, [gameStatus, setState])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
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
      )
        e.preventDefault()

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
      if (e.key === 'Enter' && state.input) {
        onSubmit(state.input)
        clear()
        return
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [
    gameStatus,
    state.input,
    state.cursor,
    maxLength,
    onSubmit,
    moveCursor,
    clear,
    insertAt,
    backspace,
  ])

  const reset = () => {
    setState({ input: '', cursor: 0 })
  }

  const setCursor = (pos: number) => {
    setState({ cursor: pos })
  }

  return {
    input: state.input,
    cursor: state.cursor,
    insertAt,
    backspace,
    moveCursor,
    clear,
    setCursor,
    reset,
  }
}
