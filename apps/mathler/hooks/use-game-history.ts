'use client'

import { useCallback, useMemo } from 'react'
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

  const saveGame = useCallback(
    async (gameData: Omit<GameHistoryEntry, 'completedAt'>) => {
      if (!user) {
        console.warn('Cannot save game: user not authenticated')
        return false
      }

      try {
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
        // updateUser throws on network/validation errors (caught by try-catch)
        // but we should verify the result exists and handle verification requirements
        if (!result) {
          console.error('Failed to save game history: updateUser returned no result')
          return false
        }

        // Refresh user to get updated metadata only if update was successful
        // (no verification required)
        const requiresVerification =
          result.isEmailVerificationRequired || result.isSmsVerificationRequired
        if (!requiresVerification) {
          await refreshUser()
        }

        return !requiresVerification
      } catch (error) {
        console.error('Failed to save game history:', error)
        return false
      }
    },
    [user, updateUser, refreshUser],
  )

  const getHistory = useCallback(() => {
    return history
  }, [history])

  const getGameByDate = useCallback(
    (date: string) => {
      return history.find(entry => entry.date === date)
    },
    [history],
  )

  const getStats = useCallback((): GameStats => {
    const totalGames = history.length
    const wins = history.filter(entry => entry.status === 'won').length
    const losses = history.filter(entry => entry.status === 'lost').length
    const winRate = totalGames > 0 ? wins / totalGames : 0
    const totalGuesses = history.reduce((sum, entry) => sum + entry.guessCount, 0)
    const averageGuesses = totalGames > 0 ? totalGuesses / totalGames : 0

    return {
      totalGames,
      wins,
      losses,
      winRate,
      averageGuesses,
    }
  }, [history])

  return {
    history,
    saveGame,
    getHistory,
    getGameByDate,
    getStats,
    isAuthenticated: !!user,
  }
}
