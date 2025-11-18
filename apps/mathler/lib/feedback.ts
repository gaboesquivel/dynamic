export function calculateFeedback(
  guess: string,
  solution: string,
): Array<'correct' | 'present' | 'absent'> {
  const feedback = Array(guess.length).fill('absent') as Array<'correct' | 'present' | 'absent'>

  // First pass: mark correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === solution[i]) feedback[i] = 'correct'
  }

  // Second pass: mark present but wrong position
  const solutionChars = solution.split('')
  const guessChars = guess.split('')

  // Remove correct matches from consideration
  for (let i = 0; i < guess.length; i++) {
    if (feedback[i] === 'correct') {
      solutionChars[i] = ''
      guessChars[i] = ''
    }
  }

  // Mark present (exists but wrong position)
  for (let i = 0; i < guess.length; i++) {
    if (feedback[i] !== 'correct') {
      const char = guessChars[i]
      if (char) {
        const solutionIndex = solutionChars.indexOf(char)
        if (solutionIndex !== -1) {
          feedback[i] = 'present'
          solutionChars[solutionIndex] = ''
        }
      }
    }
  }

  return feedback
}
