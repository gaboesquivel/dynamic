import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MathlerGame } from './mathler-game'
import { evaluateExpression, getRandomTarget, generateSolutionEquation } from '@/lib/math'
import { calculateFeedback } from '@/lib/feedback'

// Mock the utility functions to control game behavior
vi.mock('@/lib/math', () => ({
  evaluateExpression: vi.fn(),
  getRandomTarget: vi.fn(),
  generateSolutionEquation: vi.fn(),
  getDateKey: vi.fn(() => '2024-01-01'),
}))

vi.mock('@/lib/feedback', () => ({
  calculateFeedback: vi.fn(),
}))

vi.mock('@/hooks/use-game-history', () => ({
  useGameHistory: vi.fn(() => ({
    saveGame: vi.fn().mockResolvedValue(true),
    getHistory: vi.fn(() => []),
    getGameByDate: vi.fn(() => undefined),
    getStats: vi.fn(() => ({
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageGuesses: 0,
    })),
    isAuthenticated: false,
    history: [],
  })),
}))

// Mock child components to simplify testing
vi.mock('./guess-row', () => ({
  GuessRow: function GuessRow({
    guess,
    currentInput,
    isCurrentRow,
    cursorPosition,
    onTileClick,
  }: {
    guess: string
    currentInput: string
    isCurrentRow: boolean
    cursorPosition?: number
    onTileClick?: (position: number) => void
  }) {
    const display = isCurrentRow ? currentInput : guess
    return (
      <div data-testid={`guess-row-${isCurrentRow ? 'current' : 'past'}`}>
        {display}
        {onTileClick && isCurrentRow ? (
          <button onClick={() => onTileClick(0)} data-testid="tile-click-0">
            Click Tile 0
          </button>
        ) : null}
        {cursorPosition !== undefined && cursorPosition >= 0 && isCurrentRow ? (
          <span data-testid="cursor-position">{cursorPosition}</span>
        ) : null}
      </div>
    )
  },
}))

vi.mock('./game-keypad', () => ({
  GameKeypad: function GameKeypad({
    onInput,
    onBackspace,
    onSubmit,
    currentInput,
  }: {
    onInput: (value: string) => void
    onBackspace: () => void
    onSubmit: () => void
    currentInput: string
  }) {
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    const operators = ['+', '-', '×', '÷']
    return (
      <div data-testid="game-keypad">
        {numbers.map(num => (
          <button key={num} onClick={() => onInput(currentInput + num)}>
            {num}
          </button>
        ))}
        {operators.map(op => (
          <button key={op} onClick={() => onInput(currentInput + op)}>
            {op}
          </button>
        ))}
        <button onClick={onBackspace}>Back</button>
        <button onClick={onSubmit} disabled={!currentInput}>
          Submit
        </button>
      </div>
    )
  },
}))

vi.mock('./game-status', () => ({
  GameStatus: function GameStatus({
    status,
    onReset,
  }: {
    status: 'won' | 'lost'
    onReset: () => void
  }) {
    return (
      <div data-testid="game-status">
        <div>{status}</div>
        <button onClick={onReset}>Reset</button>
      </div>
    )
  },
}))

vi.mock('./success-modal', () => ({
  SuccessModal: function SuccessModal({
    open,
    onPlayAgain,
  }: {
    open: boolean
    onPlayAgain: () => void
  }) {
    if (!open) return null
    return (
      <div data-testid="success-modal">
        <button onClick={onPlayAgain}>Play Again</button>
      </div>
    )
  },
}))

vi.mock('./voice-control', () => ({
  VoiceControl: function VoiceControl({
    onResult,
    onCommand,
  }: {
    onResult: (text: string) => void
    onCommand: (command: 'backspace' | 'delete' | 'enter' | 'submit' | 'clear') => void
  }) {
    return (
      <div data-testid="voice-control">
        <button onClick={() => onResult('1+2')}>Test Voice Input</button>
        <button onClick={() => onCommand('enter')}>Test Voice Command</button>
      </div>
    )
  },
}))

describe('MathlerGame', () => {
  const mockEvaluateExpression = evaluateExpression as ReturnType<typeof vi.fn>
  const mockGetRandomTarget = getRandomTarget as ReturnType<typeof vi.fn>
  const mockGenerateSolutionEquation = generateSolutionEquation as ReturnType<typeof vi.fn>
  const mockCalculateFeedback = calculateFeedback as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mocks
    mockGetRandomTarget.mockReturnValue(10)
    mockGenerateSolutionEquation.mockReturnValue('5+5')
    mockEvaluateExpression.mockImplementation(expr => {
      if (expr === '5+5') return 10
      if (expr === '1+2') return 3
      if (expr === '2+3') return 5
      return null
    })
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
  })

  it('should initialize game with target and solution', () => {
    render(<MathlerGame />)

    expect(mockGetRandomTarget).toHaveBeenCalled()
    expect(mockGenerateSolutionEquation).toHaveBeenCalledWith(10)
    expect(screen.getByText(/find the equation that equals/i)).toBeInTheDocument()
  })

  it('should accept valid input characters', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    screen.getByTestId('game-keypad')
    const button1 = screen.getByRole('button', { name: '1' })
    await user.click(button1)

    // Input should be handled
    await waitFor(() => {
      expect(screen.getByTestId('guess-row-current')).toHaveTextContent('1')
    })
  })

  it('should limit input to 9 characters', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    render(<MathlerGame />)

    // Use keyboard to input more than 9 characters
    await user.keyboard('1234567890')

    // Should only accept first 9 characters
    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      // Extract just the input text (numbers and operators), excluding mock UI elements
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect((inputMatch?.[0] || '').length).toBeLessThanOrEqual(9)
    })
  })

  it('should validate expression before submission', async () => {
    const user = userEvent.setup()
    // Mock window.alert to avoid error
    window.alert = vi.fn()
    mockEvaluateExpression.mockReturnValue(null) // Invalid expression
    render(<MathlerGame />)

    const button1 = screen.getByRole('button', { name: '1' })
    await user.click(button1)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    // Should show alert for invalid expression
    await waitFor(() => {
      expect(mockEvaluateExpression).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Invalid expression')
    })
  })

  it('should calculate feedback correctly on submit', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    mockCalculateFeedback.mockReturnValue(['correct', 'correct', 'correct'])
    render(<MathlerGame />)

    // Input the solution
    const button5 = screen.getByRole('button', { name: '5' })
    await user.click(button5)
    const buttonPlus = screen.getByRole('button', { name: '+' })
    await user.click(buttonPlus)
    await user.click(button5)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCalculateFeedback).toHaveBeenCalledWith('5+5', '5+5')
    })
  })

  it('should detect win condition', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    mockCalculateFeedback.mockReturnValue(['correct', 'correct', 'correct'])
    render(<MathlerGame />)

    // Input correct solution
    const button5 = screen.getByRole('button', { name: '5' })
    await user.click(button5)
    const buttonPlus = screen.getByRole('button', { name: '+' })
    await user.click(buttonPlus)
    await user.click(button5)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('success-modal')).toBeInTheDocument()
    })
  })

  it('should detect lose condition after 6 guesses', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(5) // Wrong answer
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    render(<MathlerGame />)

    // Submit 6 wrong guesses
    for (let i = 0; i < 6; i++) {
      const button1 = screen.getByRole('button', { name: '1' })
      await user.click(button1)
      const buttonPlus = screen.getByRole('button', { name: '+' })
      await user.click(buttonPlus)
      const button2 = screen.getByRole('button', { name: '2' })
      await user.click(button2)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockEvaluateExpression).toHaveBeenCalled()
      })
    }

    await waitFor(() => {
      expect(screen.getByTestId('game-status')).toBeInTheDocument()
      expect(screen.getByText('lost')).toBeInTheDocument()
    })
  })

  it('should reset game when reset button clicked', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(5)
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    render(<MathlerGame />)

    // First render should call getRandomTarget
    expect(mockGetRandomTarget).toHaveBeenCalledTimes(1)

    // Lose the game first to show reset button
    for (let i = 0; i < 6; i++) {
      await user.keyboard('1+2')
      await user.keyboard('{Enter}')
      await waitFor(() => {
        expect(mockEvaluateExpression).toHaveBeenCalled()
      })
    }

    // Click reset
    const resetButton = screen.getByRole('button', { name: 'Reset' })
    await user.click(resetButton)

    // Should call getRandomTarget again
    await waitFor(() => {
      expect(mockGetRandomTarget).toHaveBeenCalledTimes(2)
    })
  })

  it('should handle keyboard input', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    // Simulate keyboard input
    await user.keyboard('1')

    await waitFor(() => {
      expect(screen.getByTestId('guess-row-current')).toHaveTextContent('1')
    })
  })

  it('should handle Enter key for submit', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(10)
    render(<MathlerGame />)

    await user.keyboard('5+5')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockEvaluateExpression).toHaveBeenCalledWith('5+5')
    })
  })

  it('should handle Backspace key', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    await user.keyboard('123')
    await user.keyboard('{Backspace}')

    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect(inputMatch?.[0] || '').toBe('12')
    })
  })

  it('should block input when game is not playing', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(5)
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    render(<MathlerGame />)

    // Lose the game
    for (let i = 0; i < 6; i++) {
      await user.keyboard('1+2')
      await user.keyboard('{Enter}')
      await waitFor(() => {
        expect(mockEvaluateExpression).toHaveBeenCalled()
      })
    }

    // Try to input after game is lost
    await user.keyboard('9')
    // Should not accept input
    const currentRow = screen.queryByTestId('guess-row-current')
    expect(currentRow).not.toBeInTheDocument()
  })

  it('should clear current input after submit', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(5)
    mockCalculateFeedback.mockReturnValue(['absent', 'absent', 'absent'])
    render(<MathlerGame />)

    await user.keyboard('1+2')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect(inputMatch?.[0] || '').toBe('')
    })
  })

  it('should handle arrow keys for cursor navigation', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    await user.keyboard('123')
    await user.keyboard('{ArrowLeft}')
    await user.keyboard('{ArrowLeft}')

    await waitFor(() => {
      const cursorPos = screen.getByTestId('cursor-position')
      expect(cursorPos.textContent).toBe('1')
    })
  })

  it('should handle Escape key to clear input', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    await user.keyboard('123')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      const text = currentRow.textContent || ''
      const inputMatch = text.match(/^[\d+\-×÷]+/)
      expect(inputMatch?.[0] || '').toBe('')
    })
  })

  it('should handle tile click to position cursor', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    await user.keyboard('123')
    const tileButton = screen.getByTestId('tile-click-0')
    await user.click(tileButton)

    await waitFor(() => {
      const cursorPos = screen.getByTestId('cursor-position')
      expect(cursorPos.textContent).toBe('0')
    })
  })

  it('should handle voice input', async () => {
    const user = userEvent.setup()
    render(<MathlerGame />)

    const voiceButton = screen.getByRole('button', { name: 'Test Voice Input' })
    await user.click(voiceButton)

    await waitFor(() => {
      const currentRow = screen.getByTestId('guess-row-current')
      expect(currentRow.textContent).toContain('1')
    })
  })

  it('should handle voice commands', async () => {
    const user = userEvent.setup()
    mockEvaluateExpression.mockReturnValue(3)
    render(<MathlerGame />)

    await user.keyboard('1+2')
    const voiceCommandButton = screen.getByRole('button', { name: 'Test Voice Command' })
    await user.click(voiceCommandButton)

    await waitFor(() => {
      expect(mockEvaluateExpression).toHaveBeenCalled()
    })
  })
})
