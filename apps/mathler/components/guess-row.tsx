'use client'

interface GuessRowProps {
  guess: string
  feedback: Array<'correct' | 'present' | 'absent'>
  isCurrentRow: boolean
  currentInput: string
  cursorPosition?: number
  onTileClick?: (position: number) => void
}

export function GuessRow({
  guess,
  feedback,
  isCurrentRow,
  currentInput,
  cursorPosition = -1,
  onTileClick,
}: GuessRowProps) {
  const displayValue = isCurrentRow ? currentInput : guess
  const maxLength = 9
  const hasFeedback = feedback.length > 0 && !isCurrentRow
  const showCursor = isCurrentRow && cursorPosition >= 0

  return (
    <div className="flex gap-1 justify-center">
      {[...Array(maxLength)].map((_, i) => {
        const char = displayValue[i] || ''
        const isActive = i < displayValue.length
        const feedbackType = feedback[i]
        const isCursorHere = showCursor && cursorPosition === i
        const isClickable = isCurrentRow && onTileClick

        let bgColor = 'bg-muted border-2 border-border'
        if (hasFeedback && feedbackType) {
          if (feedbackType === 'correct') {
            bgColor = 'bg-green-500 border-2 border-green-600'
          } else if (feedbackType === 'present') {
            bgColor = 'bg-yellow-400 border-2 border-yellow-500'
          } else if (feedbackType === 'absent') {
            bgColor = 'bg-gray-500 border-2 border-gray-600'
          }
        }

        return (
          <div
            key={i}
            onClick={() => isClickable && onTileClick(i)}
            className={`
              relative w-12 h-12 flex items-center justify-center text-xl font-bold
              rounded transition-all duration-200 ${bgColor}
              ${isCurrentRow && isActive ? 'border-2 border-primary scale-105' : ''}
              ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}
              ${isCursorHere ? 'ring-2 ring-primary ring-offset-2' : ''}
            `}
          >
            <span className={hasFeedback && feedbackType ? 'text-white' : 'text-foreground'}>
              {char}
            </span>
            {isCursorHere ? <span className="absolute w-0.5 h-6 bg-primary animate-pulse" /> : null}
          </div>
        )
      })}
    </div>
  )
}
