'use client'

import type React from 'react'

interface GameKeypadProps {
  onInput: (value: string) => void
  onBackspace: () => void
  onSubmit: () => void
  currentInput: string
  onInputAtPosition?: (char: string) => void
}

export function GameKeypad({
  onInput,
  onBackspace,
  onSubmit,
  currentInput,
  onInputAtPosition,
}: GameKeypadProps) {
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const operators = ['+', '-', '×', '÷']

  const handleClick = (char: string) => {
    if (onInputAtPosition) onInputAtPosition(char)
    else onInput(currentInput + char)
  }

  return (
    <div className="space-y-3">
      {/* Numbers Grid */}
      <div className="grid grid-cols-5 gap-2">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => handleClick(num)}
            className="py-3 font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Operators */}
      <div className="grid grid-cols-4 gap-2">
        {operators.map(op => (
          <button
            key={op}
            onClick={() => handleClick(op)}
            className="py-3 font-semibold text-lg rounded-lg bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            {op}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBackspace}
          className="py-3 font-semibold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-opacity"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!currentInput}
          className="py-3 font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-opacity"
        >
          Submit
        </button>
      </div>
    </div>
  )
}
