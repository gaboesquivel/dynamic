import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameKeypad } from './game-keypad'

describe('GameKeypad', () => {
  const mockOnInput = vi.fn()
  const mockOnBackspace = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all number buttons', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput=""
      />,
    )

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
    }
  })

  it('should render all operator buttons', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput=""
      />,
    )

    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '÷' })).toBeInTheDocument()
  })

  it('should call onInput with correct value when number clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
      />,
    )

    const button = screen.getByRole('button', { name: '2' })
    await user.click(button)

    expect(mockOnInput).toHaveBeenCalledWith('12')
  })

  it('should call onInput with correct value when operator clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
      />,
    )

    const button = screen.getByRole('button', { name: '+' })
    await user.click(button)

    expect(mockOnInput).toHaveBeenCalledWith('1+')
  })

  it('should call onBackspace when backspace clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1+2"
      />,
    )

    const button = screen.getByRole('button', { name: /back/i })
    await user.click(button)

    expect(mockOnBackspace).toHaveBeenCalledTimes(1)
  })

  it('should call onSubmit when submit clicked', async () => {
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1+2"
      />,
    )

    const button = screen.getByRole('button', { name: /submit/i })
    await user.click(button)

    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
  })

  it('should disable submit when input empty', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput=""
      />,
    )

    const button = screen.getByRole('button', { name: /submit/i })
    expect(button).toBeDisabled()
  })

  it('should enable submit when input has value', () => {
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
      />,
    )

    const button = screen.getByRole('button', { name: /submit/i })
    expect(button).not.toBeDisabled()
  })

  it('should use onInputAtPosition when provided', async () => {
    const mockOnInputAtPosition = vi.fn()
    const user = userEvent.setup()
    render(
      <GameKeypad
        onInput={mockOnInput}
        onBackspace={mockOnBackspace}
        onSubmit={mockOnSubmit}
        currentInput="1"
        onInputAtPosition={mockOnInputAtPosition}
      />,
    )

    const button = screen.getByRole('button', { name: '2' })
    await user.click(button)

    expect(mockOnInputAtPosition).toHaveBeenCalledWith('2')
    expect(mockOnInput).not.toHaveBeenCalled()
  })
})
