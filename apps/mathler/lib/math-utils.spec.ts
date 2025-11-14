import {
  evaluateExpression,
  getRandomTarget,
  generateSolutionEquation,
  generateEquationsForTarget,
  getDateKey,
} from './math-utils'

describe('evaluateExpression', () => {
  it('should evaluate simple addition', () => {
    expect(evaluateExpression('1+2')).toBe(3)
    expect(evaluateExpression('10+5')).toBe(15)
  })

  it('should evaluate simple subtraction', () => {
    expect(evaluateExpression('10-5')).toBe(5)
    expect(evaluateExpression('20-8')).toBe(12)
  })

  it('should evaluate simple multiplication', () => {
    expect(evaluateExpression('2*3')).toBe(6)
    expect(evaluateExpression('5*4')).toBe(20)
  })

  it('should evaluate simple division', () => {
    expect(evaluateExpression('8/2')).toBe(4)
    expect(evaluateExpression('15/3')).toBe(5)
  })

  it('should handle order of operations', () => {
    expect(evaluateExpression('2+3*4')).toBe(14) // 2 + 12 = 14
    expect(evaluateExpression('10/2+3')).toBe(8) // 5 + 3 = 8
    expect(evaluateExpression('2*3+4')).toBe(10) // 6 + 4 = 10
  })

  it('should handle parentheses', () => {
    expect(evaluateExpression('(1+2)*3')).toBe(9)
    expect(evaluateExpression('2*(3+4)')).toBe(14)
    expect(evaluateExpression('(10-2)/2')).toBe(4)
  })

  it('should normalize unicode operators', () => {
    expect(evaluateExpression('2×3')).toBe(6)
    expect(evaluateExpression('8÷2')).toBe(4)
    expect(evaluateExpression('2×3+1')).toBe(7)
  })

  it('should return null for invalid expressions', () => {
    expect(evaluateExpression('')).toBeNull()
    expect(evaluateExpression('+')).toBeNull()
    expect(evaluateExpression('*')).toBeNull()
    expect(evaluateExpression('abc')).toBeNull()
    expect(evaluateExpression('1+')).toBeNull()
    expect(evaluateExpression('+1')).toBeNull()
    expect(evaluateExpression('1++2')).toBeNull()
    expect(evaluateExpression('1--2')).toBeNull()
  })

  it('should handle floating point precision', () => {
    const result = evaluateExpression('1/3')
    expect(result).toBeCloseTo(0.333333, 5)
  })

  it('should handle division by zero', () => {
    // Division by zero returns Infinity, which is not finite, so returns null
    const result = evaluateExpression('1/0')
    expect(result).toBeNull()
  })

  it('should handle complex expressions', () => {
    expect(evaluateExpression('2+3*4-1')).toBe(13) // 2 + 12 - 1 = 13
    expect(evaluateExpression('10/2*3')).toBe(15) // 5 * 3 = 15
  })
})

describe('getDateKey', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const date = new Date('2024-01-15')
    const key = getDateKey(date)
    expect(key).toBe('2024-01-15')
  })

  it('should use today if no date provided', () => {
    const today = new Date()
    const key = getDateKey()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(key).toBe(expected)
  })

  it('should pad single digit months and days with zeros', () => {
    const date = new Date('2024-01-05')
    const key = getDateKey(date)
    expect(key).toBe('2024-01-05')
  })

  it('should handle dates at year boundaries', () => {
    const date1 = new Date('2024-12-31')
    expect(getDateKey(date1)).toBe('2024-12-31')

    const date2 = new Date('2025-01-01')
    expect(getDateKey(date2)).toBe('2025-01-01')
  })

  it('should throw error for invalid date', () => {
    const invalidDate = new Date('invalid')
    expect(() => getDateKey(invalidDate)).toThrow('Invalid date provided to getDateKey')
  })

  it('should handle dates with different months', () => {
    expect(getDateKey(new Date('2024-03-15'))).toBe('2024-03-15')
    expect(getDateKey(new Date('2024-10-25'))).toBe('2024-10-25')
  })
})

describe('getRandomTarget', () => {
  it('should return a number between 10 and 100', () => {
    const target = getRandomTarget()
    expect(target).toBeGreaterThanOrEqual(10)
    expect(target).toBeLessThanOrEqual(100)
  })

  it('should return same target for same date', () => {
    // Mock Date to ensure consistent testing
    const originalDate = Date
    const mockDate = jest.fn(() => new originalDate('2024-01-15'))
    global.Date = mockDate as any

    const target1 = getRandomTarget()
    const target2 = getRandomTarget()

    expect(target1).toBe(target2)

    global.Date = originalDate
  })

  it('should return different targets for different dates', () => {
    // This test verifies the seeded random works
    // We can't easily test this without mocking, but we verify the range
    const targets = new Set()
    for (let i = 0; i < 10; i++) {
      const date = new Date(2024, 0, i + 1)
      const originalDate = Date
      global.Date = jest.fn(() => date) as any
      targets.add(getRandomTarget())
      global.Date = originalDate
    }
    // Should have some variety (though not guaranteed to be all different)
    expect(targets.size).toBeGreaterThan(1)
  })
})

describe('generateSolutionEquation', () => {
  it('should return a valid equation string', () => {
    const equation = generateSolutionEquation(10)
    expect(typeof equation).toBe('string')
    expect(equation.length).toBeGreaterThan(0)
  })

  it('should return equation that evaluates to target', () => {
    const target = 15
    const equation = generateSolutionEquation(target)
    const result = evaluateExpression(equation)
    expect(result).toBe(target)
  })

  it('should return equation with length <= 9', () => {
    const equation = generateSolutionEquation(50)
    expect(equation.length).toBeLessThanOrEqual(9)
  })

  it('should return same equation for same seed', () => {
    const seed = 20240115
    const equation1 = generateSolutionEquation(10, seed)
    const equation2 = generateSolutionEquation(10, seed)
    expect(equation1).toBe(equation2)
  })

  it('should handle edge cases', () => {
    // Test with various targets using fixed seed for deterministic results
    for (let target = 10; target <= 20; target++) {
      const seed = 20240101 // Fixed seed for deterministic testing
      const equation = generateSolutionEquation(target, seed)
      const result = evaluateExpression(equation)
      expect(result).toBe(target)
      expect(equation.length).toBeLessThanOrEqual(9)
    }
  })

  it('should return fallback equation when no candidates found', () => {
    // This is hard to test directly, but we verify it always returns something valid
    const equation = generateSolutionEquation(999999)
    expect(typeof equation).toBe('string')
    expect(equation.length).toBeGreaterThan(0)
  })
})

describe('generateEquationsForTarget', () => {
  it('should return array of valid equations', () => {
    const equations = generateEquationsForTarget(10)
    expect(Array.isArray(equations)).toBe(true)
    expect(equations.length).toBeGreaterThan(0)
  })

  it('should return equations that evaluate to target', () => {
    const target = 15
    const equations = generateEquationsForTarget(target)
    equations.forEach(equation => {
      const result = evaluateExpression(equation)
      expect(result).toBe(target)
    })
  })

  it('should respect maxLength constraint', () => {
    const equations = generateEquationsForTarget(10, 5)
    equations.forEach(equation => {
      expect(equation.length).toBeLessThanOrEqual(5)
    })
  })

  it('should return unique equations', () => {
    const equations = generateEquationsForTarget(10)
    const uniqueEquations = new Set(equations)
    expect(uniqueEquations.size).toBe(equations.length)
  })

  it('should handle various targets', () => {
    for (let target = 10; target <= 30; target += 5) {
      const equations = generateEquationsForTarget(target)
      expect(equations.length).toBeGreaterThan(0)
      equations.forEach(equation => {
        const result = evaluateExpression(equation)
        expect(result).toBe(target)
      })
    }
  })
})
