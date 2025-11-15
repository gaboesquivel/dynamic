'use client'

import { useMemo } from 'react'
import { useAsyncFn } from 'react-use'
import { groupBy, sumBy } from 'lodash'
import {
  useDynamicContext,
  useUserUpdateRequest,
  useRefreshUser,
} from '@dynamic-labs/sdk-react-core'

export interface GameHistoryEntry {
  date: string // ISO date string (YYYY-MM-DD)
  target: number
  solution: string
  guesses: string[]
  status: 'won' | 'lost'
  guessCount: number
  completedAt: string // ISO timestamp
}

interface UserMetadata {
  mathlerHistory?: GameHistoryEntry[]
  [key: string]: unknown
}

interface GameStats {
  totalGames: number
  wins: number
  losses: number
  winRate: number
  averageGuesses: number
}

export function useGameHistory() {
  const { user } = useDynamicContext()
  const { updateUser } = useUserUpdateRequest()
  const refreshUser = useRefreshUser()

  const history = useMemo(() => {
    if (!user?.metadata) return []
    const metadata = user.metadata as UserMetadata
    return metadata.mathlerHistory ?? []
  }, [user?.metadata])

  const [saveGameState, saveGame] = useAsyncFn(
    async (gameData: Omit<GameHistoryEntry, 'completedAt'>) => {
      if (!user) {
        throw new Error('Cannot save game: user not authenticated')
      }

      const metadata = (user.metadata as UserMetadata) || {}
      const existingHistory = metadata.mathlerHistory ?? []

      // Check if game for this date already exists and update it, otherwise append
      const dateIndex = existingHistory.findIndex(entry => entry.date === gameData.date)
      const newEntry: GameHistoryEntry = {
        ...gameData,
        completedAt: new Date().toISOString(),
      }

      const updatedHistory =
        dateIndex >= 0
          ? existingHistory.map((entry, index) => (index === dateIndex ? newEntry : entry))
          : [...existingHistory, newEntry]

      const updatedMetadata: UserMetadata = {
        ...metadata,
        mathlerHistory: updatedHistory,
      }

      const result = await updateUser({
        metadata: updatedMetadata,
      })

      // Check for updateUser errors or unsuccessful responses
      if (!result) {
        throw new Error('Failed to save game history: updateUser returned no result')
      }

      // Type-safe error checking
      const hasError =
        typeof result === 'object' &&
        result !== null &&
        ('error' in result || ('success' in result && result.success === false))

      if (hasError) {
        const errorMessage =
          (typeof result === 'object' &&
            result !== null &&
            'error' in result &&
            typeof result.error === 'object' &&
            result.error !== null &&
            'message' in result.error &&
            typeof result.error.message === 'string' &&
            result.error.message) ||
          'Failed to update user metadata. Please try again.'
        throw new Error(errorMessage)
      }

      // Refresh user to get updated metadata only if update was successful
      // (no verification required)
      const requiresVerification =
        result.isEmailVerificationRequired || result.isSmsVerificationRequired
      if (!requiresVerification) {
        await refreshUser()
      }

      return !requiresVerification
    },
    [user, updateUser, refreshUser],
  )

  const getHistory = () => history

  const getGameByDate = (date: string) => history.find(entry => entry.date === date)

  const getStats = (): GameStats => {
    const totalGames = history.length
    const groupedByStatus = groupBy(history, 'status')
    const wins = groupedByStatus.won?.length ?? 0
    const losses = groupedByStatus.lost?.length ?? 0
    const winRate = totalGames > 0 ? wins / totalGames : 0
    const totalGuesses = sumBy(history, 'guessCount')
    const averageGuesses = totalGames > 0 ? totalGuesses / totalGames : 0

    return {
      totalGames,
      wins,
      losses,
      winRate,
      averageGuesses,
    }
  }

  return {
    history,
    saveGame,
    saveGameLoading: saveGameState.loading,
    saveGameError: saveGameState.error,
    getHistory,
    getGameByDate,
    getStats,
    isAuthenticated: !!user,
  }
}
