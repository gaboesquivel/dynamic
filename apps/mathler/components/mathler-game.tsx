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
import { useMathlerInput } from '@/hooks/use-mathler-input'
import GuessRow from './guess-row'
import GameKeypad from './game-keypad'
import GameStatus from './game-status'
import SuccessModal from './success-modal'
import VoiceControl from './voice-control'

export default function MathlerGame() {
  const [target, setTarget] = useState<number>(0)
  const [solution, setSolution] = useState<string>('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [feedback, setFeedback] = useState<Array<Array<'correct' | 'present' | 'absent'>>>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { saveGame } = useGameHistory()

  const handleSubmit = useCallback(
    (value: string) => {
      if (!value || gameStatus !== 'playing') return

      try {
        const result = evaluateExpression(value)

        if (result === null) {
          alert('Invalid expression')
          return
        }

        setGuesses(prevGuesses => {
          const newGuesses = [...prevGuesses, value]

          // Normalize guess for feedback comparison (× -> *, ÷ -> /)
          const normalizedGuess = value.replace(/×/g, '*').replace(/÷/g, '/')

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
      } catch {
        alert('Invalid expression')
      }
    },
    [gameStatus, solution, target, saveGame],
  )

  const {
    input: currentInput,
    cursor: cursorPosition,
    insertAt: handleInputAtPosition,
    backspace: handleBackspace,
    moveCursor: handleCursorMove,
    clear: handleClear,
    setCursor: setCursorPosition,
    reset: resetInput,
  } = useMathlerInput({
    maxLength: 9,
    gameStatus,
    onSubmit: handleSubmit,
  })

  const resetGame = useCallback(() => {
    const newTarget = getRandomTarget()
    const newSolution = generateSolutionEquation(newTarget)
    setTarget(newTarget)
    setSolution(newSolution)
    setGuesses([])
    resetInput()
    setGameStatus('playing')
    setFeedback([])
    setShowSuccessModal(false)
  }, [resetInput])

  useEffect(() => {
    resetGame()
  }, [resetGame])

  const handleInputChange = useCallback(
    (value: string) => {
      if (gameStatus !== 'playing') return
      // Replace entire input
      resetInput()
      for (const char of value) {
        handleInputAtPosition(char)
      }
    },
    [gameStatus, resetInput, handleInputAtPosition],
  )

  const handleVoiceResult = useCallback(
    (text: string) => {
      if (gameStatus !== 'playing') return
      // Insert voice input at cursor position
      for (const char of text) {
        handleInputAtPosition(char)
      }
    },
    [gameStatus, handleInputAtPosition],
  )

  const handleVoiceCommand = useCallback(
    (command: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear') => {
      if (gameStatus !== 'playing') return
      if (command === 'backspace' || command === 'delete') {
        handleBackspace()
      } else if (command === 'enter' || command === 'submit') {
        if (currentInput) {
          handleSubmit(currentInput)
        }
      } else if (command === 'clear') {
        handleClear()
      }
    },
    [gameStatus, handleBackspace, handleSubmit, handleClear, currentInput],
  )

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
            cursorPosition={i === guesses.length ? cursorPosition : -1}
            onTileClick={i === guesses.length ? pos => setCursorPosition(pos) : undefined}
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
        <div className="space-y-4">
          <VoiceControl onResult={handleVoiceResult} onCommand={handleVoiceCommand} />
          <GameKeypad
            onInput={handleInputChange}
            onBackspace={handleBackspace}
            onSubmit={() => {
              if (currentInput) {
                handleSubmit(currentInput)
              }
            }}
            currentInput={currentInput}
            onInputAtPosition={handleInputAtPosition}
          />
        </div>
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
