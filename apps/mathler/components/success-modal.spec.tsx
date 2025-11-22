import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuccessModal } from './success-modal'

// Mock the dialog component since it might have complex dependencies
vi.mock('@vencura/ui/components/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-description">{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
}))

vi.mock('@vencura/ui/components/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

describe('SuccessModal', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnPlayAgain = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should open when open prop is true', () => {
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={3}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.getByTestId('dialog')).toBeInTheDocument()
  })

  it('should not render when open prop is false', () => {
    render(
      <SuccessModal
        open={false}
        onOpenChange={mockOnOpenChange}
        guessCount={3}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
  })

  it('should display correct guess count', () => {
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={5}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.getByText(/you solved it in 5 guesses/i)).toBeInTheDocument()
  })

  it('should display singular guess count', () => {
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={1}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    expect(screen.getByText(/you solved it in 1 guess/i)).toBeInTheDocument()
  })

  it('should call onPlayAgain when play again button clicked', async () => {
    const user = userEvent.setup()
    render(
      <SuccessModal
        open={true}
        onOpenChange={mockOnOpenChange}
        guessCount={3}
        onPlayAgain={mockOnPlayAgain}
      />,
    )

    const button = screen.getByRole('button', { name: /play again/i })
    await user.click(button)

    expect(mockOnPlayAgain).toHaveBeenCalledTimes(1)
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
