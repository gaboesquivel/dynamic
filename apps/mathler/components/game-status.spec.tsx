import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameStatus from './game-status'

describe('GameStatus', () => {
  const mockOnReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display win message correctly', () => {
    render(<GameStatus status="won" target={10} guessCount={3} onReset={mockOnReset} />)

    expect(screen.getByText(/you won/i)).toBeInTheDocument()
    expect(screen.getByText(/you solved it in 3 guesses/i)).toBeInTheDocument()
  })

  it('should display lose message correctly', () => {
    render(<GameStatus status="lost" target={10} guessCount={6} onReset={mockOnReset} />)

    expect(screen.getByText(/game over/i)).toBeInTheDocument()
    expect(screen.getByText(/the answer was 10/i)).toBeInTheDocument()
  })

  it('should show singular guess count', () => {
    render(<GameStatus status="won" target={10} guessCount={1} onReset={mockOnReset} />)

    expect(screen.getByText(/you solved it in 1 guess/i)).toBeInTheDocument()
  })

  it('should show plural guess count', () => {
    render(<GameStatus status="won" target={10} guessCount={5} onReset={mockOnReset} />)

    expect(screen.getByText(/you solved it in 5 guesses/i)).toBeInTheDocument()
  })

  it('should call onReset when play again button clicked', async () => {
    const user = userEvent.setup()
    render(<GameStatus status="won" target={10} guessCount={3} onReset={mockOnReset} />)

    const button = screen.getByRole('button', { name: /play again/i })
    await user.click(button)

    expect(mockOnReset).toHaveBeenCalledTimes(1)
  })

  it('should have correct styling for win status', () => {
    const { container } = render(
      <GameStatus status="won" target={10} guessCount={3} onReset={mockOnReset} />,
    )

    const statusDiv = container.firstChild
    expect(statusDiv).toHaveClass('bg-green-500/20')
  })

  it('should have correct styling for lose status', () => {
    const { container } = render(
      <GameStatus status="lost" target={10} guessCount={6} onReset={mockOnReset} />,
    )

    const statusDiv = container.firstChild
    expect(statusDiv).toHaveClass('bg-red-500/20')
  })
})
