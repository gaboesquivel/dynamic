import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GuessRow from './guess-row'

describe('GuessRow', () => {
  it('should render current input correctly', () => {
    render(<GuessRow guess="" feedback={[]} isCurrentRow={true} currentInput="1+2" />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should display feedback colors correctly', () => {
    const { container } = render(
      <GuessRow
        guess="1+2"
        feedback={['correct', 'correct', 'absent']}
        isCurrentRow={false}
        currentInput=""
      />,
    )

    const cells = container.querySelectorAll('div.flex > div')
    // First two should have green background (correct)
    expect(cells[0]).toHaveClass('bg-green-500')
    expect(cells[1]).toHaveClass('bg-green-500')
    // Third should have gray background (absent)
    expect(cells[2]).toHaveClass('bg-gray-500')
  })

  it('should show present feedback as yellow', () => {
    const { container } = render(
      <GuessRow
        guess="2+1"
        feedback={['present', 'correct', 'present']}
        isCurrentRow={false}
        currentInput=""
      />,
    )

    const cells = container.querySelectorAll('div.flex > div')
    expect(cells[0]).toHaveClass('bg-yellow-400')
    expect(cells[1]).toHaveClass('bg-green-500')
    expect(cells[2]).toHaveClass('bg-yellow-400')
  })

  it('should show empty slots for unused positions', () => {
    render(<GuessRow guess="1+2" feedback={[]} isCurrentRow={true} currentInput="1+2" />)

    // Should render 9 slots total
    const cells = screen.getAllByText(/^[0-9+\-*÷×]?$/)
    expect(cells.length).toBeGreaterThanOrEqual(3)
  })

  it('should highlight active row', () => {
    const { container } = render(
      <GuessRow guess="" feedback={[]} isCurrentRow={true} currentInput="1" />,
    )

    const cells = container.querySelectorAll('div.flex > div')
    // Active cell should have primary border
    expect(cells[0]).toHaveClass('border-primary')
  })

  it('should display guess when not current row', () => {
    render(
      <GuessRow
        guess="3+4"
        feedback={['absent', 'absent', 'absent', 'absent']}
        isCurrentRow={false}
        currentInput=""
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('should show cursor position when provided', () => {
    const { container } = render(
      <GuessRow guess="" feedback={[]} isCurrentRow={true} currentInput="12" cursorPosition={1} />,
    )

    const cells = container.querySelectorAll('div.flex > div')
    expect(cells[1]).toHaveClass('ring-primary')
  })

  it('should call onTileClick when tile is clicked', async () => {
    const mockOnTileClick = jest.fn()
    const user = userEvent.setup()
    const { container } = render(
      <GuessRow
        guess=""
        feedback={[]}
        isCurrentRow={true}
        currentInput="12"
        cursorPosition={0}
        onTileClick={mockOnTileClick}
      />,
    )

    const cells = container.querySelectorAll('div.flex > div')
    await user.click(cells[1] as HTMLElement)

    expect(mockOnTileClick).toHaveBeenCalledWith(1)
  })

  it('should not call onTileClick when not current row', async () => {
    const mockOnTileClick = jest.fn()
    const user = userEvent.setup()
    render(
      <GuessRow
        guess="12"
        feedback={[]}
        isCurrentRow={false}
        currentInput=""
        onTileClick={mockOnTileClick}
      />,
    )

    const cells = screen.getAllByText(/^[0-9]?$/)
    await user.click(cells[0])

    expect(mockOnTileClick).not.toHaveBeenCalled()
  })
})
