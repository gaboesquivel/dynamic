'use client'

import { useEffect } from 'react'
import { useSetState } from 'react-use'
import { evaluateExpression, getRandomTarget, generateSolutionEquation } from '@/lib/math'
import { getDateKey } from '@vencura/lib'
import { calculateFeedback } from '@/lib/feedback'
import { useGameHistory } from '@/hooks/use-game-history'
import { useMathlerInput } from '@/hooks/use-mathler-input'
import { GuessRow } from './guess-row'
import { GameKeypad } from './game-keypad'
import { GameStatus } from './game-status'
import { SuccessModal } from './success-modal'
import { VoiceControl } from './voice-control'

interface GameState {
  target: number
  solution: string
  guesses: string[]
  gameStatus: 'playing' | 'won' | 'lost'
  feedback: Array<Array<'correct' | 'present' | 'absent'>>
  showSuccessModal: boolean
}

export function MathlerGame() {
  const [gameState, setGameState] = useSetState<GameState>({
    target: 0,
    solution: '',
    guesses: [],
    gameStatus: 'playing',
    feedback: [],
    showSuccessModal: false,
  })
  const { saveGame } = useGameHistory()

  const handleSubmit = (value: string) => {
    if (!value || gameState.gameStatus !== 'playing') return

    try {
      const result = evaluateExpression(value)

      if (result === null) {
        alert('Invalid expression')
        return
      }

      const newGuesses = [...gameState.guesses, value]

      // Normalize guess for feedback comparison (× -> *, ÷ -> /)
      const normalizedGuess = value.replace(/×/g, '*').replace(/÷/g, '/')

      // Calculate feedback comparing guess to solution equation
      const feedbackRow = calculateFeedback(normalizedGuess, gameState.solution)

      // Check win condition (result equals target AND guess matches solution exactly)
      const isWin = result === gameState.target && normalizedGuess === gameState.solution
      const isGameOver = isWin || newGuesses.length >= 6

      if (isWin) {
        setGameState({
          guesses: newGuesses,
          feedback: [...gameState.feedback, feedbackRow],
          gameStatus: 'won',
          showSuccessModal: true,
        })
      } else if (newGuesses.length >= 6) {
        setGameState({
          guesses: newGuesses,
          feedback: [...gameState.feedback, feedbackRow],
          gameStatus: 'lost',
        })
      } else {
        setGameState({
          guesses: newGuesses,
          feedback: [...gameState.feedback, feedbackRow],
        })
      }

      // Save game history when game ends
      if (isGameOver) {
        const finalStatus: 'won' | 'lost' = isWin ? 'won' : 'lost'
        saveGame({
          date: getDateKey(),
          target: gameState.target,
          solution: gameState.solution,
          guesses: newGuesses,
          status: finalStatus,
          guessCount: newGuesses.length,
        })
      }
    } catch {
      alert('Invalid expression')
    }
  }

  const {
    input: currentInput,
    cursor: cursorPosition,
    insertAt: handleInputAtPosition,
    backspace: handleBackspace,
    clear: handleClear,
    setCursor: setCursorPosition,
    reset: resetInput,
  } = useMathlerInput({
    maxLength: 9,
    gameStatus: gameState.gameStatus,
    onSubmit: handleSubmit,
  })

  const resetGame = () => {
    const newTarget = getRandomTarget()
    const newSolution = generateSolutionEquation(newTarget)
    setGameState({
      target: newTarget,
      solution: newSolution,
      guesses: [],
      gameStatus: 'playing',
      feedback: [],
      showSuccessModal: false,
    })
    resetInput()
  }

  useEffect(() => {
    resetGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (value: string) => {
    if (gameState.gameStatus !== 'playing') return
    // Replace entire input
    resetInput()
    for (const char of value) {
      handleInputAtPosition(char)
    }
  }

  const handleVoiceResult = (text: string) => {
    if (gameState.gameStatus !== 'playing') return
    // Insert voice input at cursor position
    for (const char of text) {
      handleInputAtPosition(char)
    }
  }

  const handleVoiceCommand = (command: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear') => {
    if (gameState.gameStatus !== 'playing') return
    if (command === 'backspace' || command === 'delete') handleBackspace()
    else if (command === 'enter' || command === 'submit') {
      if (currentInput) handleSubmit(currentInput)
    } else if (command === 'clear') handleClear()
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mathler</h1>
        <p className="text-lg text-muted-foreground">
          Find the equation that equals{' '}
          <span className="font-bold text-primary">{gameState.target}</span>
        </p>
      </div>

      {/* Game Board */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => {
          const isCurrentRow = i === gameState.guesses.length && gameState.gameStatus === 'playing'
          return (
            <GuessRow
              key={i}
              guess={gameState.guesses[i] || ''}
              feedback={gameState.feedback[i] || []}
              isCurrentRow={isCurrentRow}
              currentInput={i === gameState.guesses.length ? currentInput : ''}
              cursorPosition={i === gameState.guesses.length ? cursorPosition : -1}
              onTileClick={
                i === gameState.guesses.length ? pos => setCursorPosition(pos) : undefined
              }
            />
          )
        })}
      </div>

      {/* Game Status */}
      {gameState.gameStatus !== 'playing' ? (
        <GameStatus
          status={gameState.gameStatus}
          target={gameState.target}
          guessCount={gameState.guesses.length}
          onReset={resetGame}
        />
      ) : null}

      {/* Keypad */}
      {gameState.gameStatus === 'playing' ? (
        <div className="space-y-4">
          <VoiceControl onResult={handleVoiceResult} onCommand={handleVoiceCommand} />
          <GameKeypad
            onInput={handleInputChange}
            onBackspace={handleBackspace}
            onSubmit={() => {
              if (currentInput) handleSubmit(currentInput)
            }}
            currentInput={currentInput}
            onInputAtPosition={handleInputAtPosition}
          />
        </div>
      ) : null}

      {/* Success Modal */}
      <SuccessModal
        open={gameState.showSuccessModal}
        onOpenChange={open => setGameState({ showSuccessModal: open })}
        guessCount={gameState.guesses.length}
        onPlayAgain={resetGame}
      />
    </div>
  )
}
