'use client'

import type React from 'react'

interface GameKeypadProps {
  onInput: (value: string) => void
  onBackspace: () => void
  onSubmit: () => void
  currentInput: string
}

export default function GameKeypad({
  onInput,
  onBackspace,
  onSubmit,
  currentInput,
}: GameKeypadProps) {
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const operators = ['+', '-', '×', '÷']

  return (
    <div className="space-y-3">
      {/* Numbers Grid */}
      <div className="grid grid-cols-5 gap-2">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => onInput(currentInput + num)}
            className="py-3 font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
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
            onClick={() => onInput(currentInput + op)}
            className="py-3 font-semibold text-lg rounded-lg bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {op}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBackspace}
          className="py-3 font-semibold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!currentInput}
          className="py-3 font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Submit
        </button>
      </div>
    </div>
  )
}
