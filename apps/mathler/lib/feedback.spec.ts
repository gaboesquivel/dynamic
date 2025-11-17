import { calculateFeedback } from './feedback'

describe('calculateFeedback', () => {
  it('should mark all correct positions', () => {
    const feedback = calculateFeedback('1+2', '1+2')
    expect(feedback).toEqual(['correct', 'correct', 'correct'])
  })

  it('should mark correct positions', () => {
    const feedback = calculateFeedback('1+2', '1+3')
    expect(feedback[0]).toBe('correct')
    expect(feedback[1]).toBe('correct')
    expect(feedback[2]).toBe('absent')
  })

  it('should mark present but wrong position', () => {
    const feedback = calculateFeedback('2+1', '1+2')
    expect(feedback[0]).toBe('present')
    expect(feedback[1]).toBe('correct')
    expect(feedback[2]).toBe('present')
  })

  it('should mark absent characters', () => {
    const feedback = calculateFeedback('1+2', '3+4')
    // '+' is correct, '1' and '2' are absent
    expect(feedback[0]).toBe('absent')
    expect(feedback[1]).toBe('correct')
    expect(feedback[2]).toBe('absent')
  })

  it('should handle duplicate characters correctly', () => {
    const feedback = calculateFeedback('1+1', '1+2')
    // First '1' is correct, second '1' should be absent (not present, since solution only has one '1')
    expect(feedback[0]).toBe('correct')
    expect(feedback[1]).toBe('correct')
    expect(feedback[2]).toBe('absent')
  })

  it('should handle duplicate characters in solution', () => {
    const feedback = calculateFeedback('2+2', '1+1')
    // Both '2's should be absent
    expect(feedback[0]).toBe('absent')
    expect(feedback[1]).toBe('correct')
    expect(feedback[2]).toBe('absent')
  })

  it('should handle different lengths', () => {
    const feedback = calculateFeedback('1+2', '10+2')
    // '1' matches first position, '+' and '2' are present but in wrong positions
    expect(feedback[0]).toBe('correct')
    expect(feedback[1]).toBe('present')
    expect(feedback[2]).toBe('present')
  })

  it('should handle complex equations', () => {
    const feedback = calculateFeedback('2*3+1', '2*3+1')
    expect(feedback.every(f => f === 'correct')).toBe(true)
  })

  it('should handle operators correctly', () => {
    const feedback = calculateFeedback('1+2', '1-2')
    expect(feedback[0]).toBe('correct')
    expect(feedback[1]).toBe('absent') // '+' is not in solution
    expect(feedback[2]).toBe('correct')
  })

  it('should prioritize correct over present', () => {
    const feedback = calculateFeedback('1+1', '1+1')
    // Both should be correct, not present
    expect(feedback).toEqual(['correct', 'correct', 'correct'])
  })

  it('should handle empty strings', () => {
    const feedback = calculateFeedback('', '')
    expect(feedback).toEqual([])
  })

  it('should handle partial matches', () => {
    const feedback = calculateFeedback('1+2', '1+3')
    expect(feedback[0]).toBe('correct')
    expect(feedback[1]).toBe('correct')
    expect(feedback[2]).toBe('absent')
  })
})
