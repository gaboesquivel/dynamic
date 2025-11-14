'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  evaluateExpression,
  getRandomTarget,
  generateSolutionEquation,
  getDateKey,
} from '@/lib/math-utils'
import { calculateFeedback } from '@/lib/feedback-utils'
import { useGameHistory } from '@/hooks/use-game-history'
import GuessRow from './guess-row'
import GameKeypad from './game-keypad'
import GameStatus from './game-status'
import SuccessModal from './success-modal'

export default function MathlerGame() {
  const [target, setTarget] = useState<number>(0)
  const [solution, setSolution] = useState<string>('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState<string>('')
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [feedback, setFeedback] = useState<Array<Array<'correct' | 'present' | 'absent'>>>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { saveGame } = useGameHistory()

  const resetGame = useCallback(() => {
    const newTarget = getRandomTarget()
    const newSolution = generateSolutionEquation(newTarget)
    setTarget(newTarget)
    setSolution(newSolution)
    setGuesses([])
    setCurrentInput('')
    setGameStatus('playing')
    setFeedback([])
    setShowSuccessModal(false)
  }, [])

  useEffect(() => {
    resetGame()
  }, [resetGame])

  const handleInputChange = useCallback(
    (value: string) => {
      if (gameStatus !== 'playing') return
      if (value.length <= 9) {
        setCurrentInput(value)
      }
    },
    [gameStatus],
  )

  const handleBackspace = useCallback(() => {
    if (gameStatus !== 'playing') return
    setCurrentInput(prev => prev.slice(0, -1))
  }, [gameStatus])

  const handleSubmit = useCallback(() => {
    if (!currentInput || gameStatus !== 'playing') return

    try {
      const result = evaluateExpression(currentInput)

      if (result === null) {
        alert('Invalid expression')
        return
      }

      setGuesses(prevGuesses => {
        const newGuesses = [...prevGuesses, currentInput]

        // Normalize guess for feedback comparison (× -> *, ÷ -> /)
        const normalizedGuess = currentInput.replace(/×/g, '*').replace(/÷/g, '/')

        // Calculate feedback comparing guess to solution equation
        const feedbackRow = calculateFeedback(normalizedGuess, solution)
        setFeedback(prevFeedback => [...prevFeedback, feedbackRow])

        // Check win condition (result equals target AND guess matches solution exactly)
        const isWin = result === target && normalizedGuess === solution
        const isGameOver = isWin || newGuesses.length >= 6

        if (isWin) {
          setGameStatus('won')
          setShowSuccessModal(true)
        } else if (newGuesses.length >= 6) {
          setGameStatus('lost')
        }

        // Save game history when game ends
        if (isGameOver) {
          const finalStatus: 'won' | 'lost' = isWin ? 'won' : 'lost'
          saveGame({
            date: getDateKey(),
            target,
            solution,
            guesses: newGuesses,
            status: finalStatus,
            guessCount: newGuesses.length,
          }).catch(error => {
            console.error('Failed to save game history:', error)
          })
        }

        return newGuesses
      })

      setCurrentInput('')
    } catch {
      alert('Invalid expression')
    }
  }, [currentInput, gameStatus, solution, target, saveGame])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return

      // Prevent default for game keys
      if (
        /^[0-9+\-*/]$/.test(e.key) ||
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Enter'
      ) {
        e.preventDefault()
      }

      // Handle number and operator keys
      if (/^[0-9+\-*/]$/.test(e.key)) {
        setCurrentInput(prev => {
          if (prev.length < 9) {
            return prev + e.key
          }
          return prev
        })
      }

      // Handle backspace/delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleBackspace()
      }

      // Handle enter
      if (e.key === 'Enter') {
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStatus, handleSubmit, handleBackspace])

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mathler</h1>
        <p className="text-lg text-muted-foreground">
          Find the equation that equals <span className="font-bold text-primary">{target}</span>
        </p>
      </div>

      {/* Game Board */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <GuessRow
            key={i}
            guess={guesses[i] || ''}
            feedback={feedback[i] || []}
            isCurrentRow={i === guesses.length && gameStatus === 'playing'}
            currentInput={i === guesses.length ? currentInput : ''}
          />
        ))}
      </div>

      {/* Game Status */}
      {gameStatus !== 'playing' && (
        <GameStatus
          status={gameStatus}
          target={target}
          guessCount={guesses.length}
          onReset={resetGame}
        />
      )}

      {/* Keypad */}
      {gameStatus === 'playing' && (
        <GameKeypad
          onInput={handleInputChange}
          onBackspace={handleBackspace}
          onSubmit={handleSubmit}
          currentInput={currentInput}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        guessCount={guesses.length}
        onPlayAgain={resetGame}
      />
    </div>
  )
}
