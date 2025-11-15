import { Parser } from 'expr-eval'
import { uniq } from 'lodash'

/**
 * Singleton parser instance configured for basic arithmetic only.
 * - No functions or variables allowed
 * - Only supports: +, -, *, /, parentheses, and numbers
 * - Reused across all evaluations for better performance
 *
 * Note: Regex validation in evaluateExpression prevents function calls and variables
 * from reaching the parser, but we also restrict the parser itself as defense-in-depth.
 */
const arithmeticParser = new Parser()
// Explicitly disable all functions and constants to restrict to basic arithmetic only
arithmeticParser.functions = {}
arithmeticParser.consts = {}

/**
 * Evaluates a mathematical expression string.
 * Only supports basic arithmetic: numbers, +, -, *, /, and parentheses.
 * Results are rounded to 6 decimal places to avoid floating-point precision issues.
 *
 * @param expr - Expression string (may contain × and ÷ Unicode operators)
 * @returns Evaluated result as a number, or null if expression is invalid
 */
export function evaluateExpression(expr: string): number | null {
  try {
    // Replace × and ÷ with * and /
    const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/')

    // Validate expression (only allow digits, operators, and parentheses)
    if (!/^[\d+\-*/.()]+$/.test(normalized)) {
      return null
    }

    // Check for valid syntax - reject expressions starting or ending with operators
    // Reject unary minus at start (we don't support negative numbers)
    if (/^[+*/%-]|[+*/%]$/.test(normalized)) {
      return null
    }

    if (/[+\-*/%]{2,}/.test(normalized)) {
      return null
    }

    // Explicit check for leading zeros (e.g., "01", "02", "03+5")
    // This prevents invalid number representations that the parser might accept
    if (/\b0\d/.test(normalized)) {
      return null
    }

    // Evaluate using the singleton parser (restricted to basic arithmetic only)
    const result = arithmeticParser.evaluate(normalized)

    // Check if result is a valid number
    if (typeof result !== 'number' || !isFinite(result)) {
      return null
    }

    // Round to 6 decimal places to avoid floating-point precision issues
    // Example: 0.1 + 0.2 = 0.30000000000000004 -> 0.3
    return Math.round(result * 1000000) / 1000000
  } catch {
    return null
  }
}

/**
 * Generates a consistent date key in YYYY-MM-DD format
 * @param date - Optional date, defaults to today
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateKey(date?: Date): string {
  const d = date ?? new Date()

  // Validate date is valid
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to getDateKey')
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generates a random target number for daily puzzles
 * Uses current date as seed for daily consistency
 */
export function getRandomTarget(): number {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate()

  // Seeded random generator
  let rand = Math.sin(seed) * 10000
  rand = rand - Math.floor(rand)

  // Target between 10 and 100
  return Math.floor(rand * 91) + 10
}

/**
 * Generates all possible equations that equal a target
 * (for hint system or verification)
 */
export function generateEquationsForTarget(target: number, maxLength = 9): string[] {
  const equations: string[] = []

  // Simple brute force for small numbers
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      if (i + j === target && `${i}+${j}`.length <= maxLength) {
        equations.push(`${i}+${j}`)
      }
      if (i - j === target && `${i}-${j}`.length <= maxLength) {
        equations.push(`${i}-${j}`)
      }
      if (i * j === target && `${i}*${j}`.length <= maxLength) {
        equations.push(`${i}*${j}`)
      }
      if (j !== 0 && i % j === 0 && i / j === target && `${i}/${j}`.length <= maxLength) {
        equations.push(`${i}/${j}`)
      }
    }
  }

  return uniq(equations).slice(0, 10)
}

/**
 * Seeded random number generator for consistent daily puzzles
 * Accepts both number and string seeds (strings are hashed to numbers)
 */
function seededRandom(seed: number | string): number {
  let numericSeed: number
  if (typeof seed === 'string') {
    // Simple hash function to convert string to number
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash | 0 // Convert to 32-bit integer
    }
    numericSeed = hash
  } else {
    numericSeed = seed
  }
  const x = Math.sin(numericSeed) * 10000
  return x - Math.floor(x)
}

/**
 * Operator definition for equation generation
 * @property sym - The operator symbol (+, -, *, /)
 * @property fn - Function that performs the operation, returns undefined for invalid operations
 * @property guard - Predicate that checks if operation is valid (e.g., no division by zero, positive subtraction)
 * @property prec - Precedence level (1 = addition/subtraction, 2 = multiplication/division)
 */
interface Op {
  sym: '+' | '-' | '*' | '/'
  fn: (x: number, y: number) => number | undefined
  guard: (x: number, y: number) => boolean
  prec: 1 | 2
  commutative: boolean
}

/**
 * Available operators for equation generation
 * - Addition: Always valid, precedence 1
 * - Subtraction: Only valid when x > y (to avoid negative results), precedence 1
 * - Multiplication: Always valid, precedence 2 (higher than add/sub)
 * - Division: Only valid when y !== 0 and x is divisible by y (integer results), precedence 2
 */
const OPS: Op[] = [
  { sym: '+', fn: (x, y) => x + y, guard: () => true, prec: 1, commutative: true },
  { sym: '-', fn: (x, y) => x - y, guard: (x, y) => x > y, prec: 1, commutative: false },
  { sym: '*', fn: (x, y) => x * y, guard: () => true, prec: 2, commutative: true },
  {
    sym: '/',
    fn: (x, y) => (y !== 0 && x % y === 0 ? x / y : undefined),
    guard: (x, y) => y !== 0,
    prec: 2,
    commutative: false,
  },
]

/**
 * Generates a solution equation for a given target number.
 *
 * ## Strategy
 *
 * This function uses a two-phase approach to generate valid equations:
 *
 * ### Phase 1: Two-Number Equations
 * Generates simple equations of the form `a op b = target`:
 * - Iterates through all combinations of numbers (1-99) and operators
 * - Validates operations using operator guards (e.g., no division by zero, no negative subtraction)
 * - Filters equations that exceed the 9-character limit
 *
 * Examples: `5+10=15`, `20-5=15`, `3*5=15`, `30/2=15`
 *
 * ### Phase 2: Three-Number Equations with Order of Operations
 * Generates equations with three numbers considering operator precedence:
 *
 * **Left-associative**: `(a op1 b) op2 c`
 * - Example: `(2+3)*4` evaluates as `(5)*4 = 20`
 * - Parentheses added when op2 has higher precedence than op1
 * - Also added when equal precedence but non-commutative (e.g., subtraction)
 *
 * **Right-associative**: `a op1 (b op2 c)`
 * - Example: `2+(3*4)` evaluates as `2+(12) = 14`
 * - Parentheses added when op2 has lower precedence than op1
 * - Example: `2+(3*4)` needs parens, but `2*(3+4)` doesn't (due to precedence)
 *
 * ### Selection Strategy
 * - Collects all valid candidates in a Set (automatic deduplication)
 * - Uses seeded random based on date and target for daily consistency
 * - Falls back to `target+0` if no valid equations found (shouldn't happen in practice)
 *
 * ## Constraints
 * - Maximum equation length: 9 characters
 * - Operators: +, -, *, / only
 * - No negative results (subtraction only when x > y)
 * - Integer division only (x must be divisible by y)
 * - No division by zero
 * - Supports parentheses for grouping
 *
 * ## Daily Consistency
 * Uses date-based seeding to ensure the same puzzle is generated for the same date.
 * The seed combines the date (YYYYMMDD format) with the target number to avoid collisions.
 *
 * @param target - The target number the equation must equal (typically 10-100)
 * @param seed - Optional seed for deterministic generation (defaults to current date)
 * @returns A valid equation string that evaluates to the target
 */
export function generateSolutionEquation(target: number, seed?: number): string {
  const today = new Date()
  const dateSeed = seed ?? today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate()

  const MAX = 9
  const candidates = new Set<string>()

  // Generate two-number equations: a op b = target
  // Iterate through all combinations of numbers and operators
  // Example: 5+10=15, 20-5=15, 3*5=15, 30/2=15
  for (let a = 1; a <= 99; a++) {
    for (let b = 1; b <= 99; b++) {
      for (const { sym, fn, guard } of OPS) {
        // Skip if operation is invalid (e.g., division by zero, negative subtraction)
        if (!guard(a, b)) continue
        const v = fn(a, b)
        // If result matches target and equation fits length constraint, add to candidates
        if (v === target) {
          const eq = `${a}${sym}${b}`
          if (eq.length <= MAX) candidates.add(eq)
        }
      }
    }
  }

  // Generate three-number equations with order of operations support
  // We need to consider both left-associative and right-associative groupings
  // Example: (2+3)*4=20 vs 2+(3*4)=14
  for (let a = 1; a <= 50; a++) {
    for (let b = 1; b <= 50; b++) {
      for (let c = 1; c <= 50; c++) {
        for (const op1 of OPS) {
          // First operation: a op1 b
          if (!op1.guard(a, b)) continue
          const v1 = op1.fn(a, b)
          if (v1 === undefined) continue

          for (const op2 of OPS) {
            // Left-associative: (a op1 b) op2 c
            // Example: (2+3)*4 evaluates as (5)*4 = 20
            // Need parentheses if op2 has higher precedence, or if equal precedence and non-commutative
            if (op2.guard(v1, c)) {
              const v2 = op2.fn(v1, c)
              if (v2 === target) {
                // Validate the equation evaluates correctly before adding to candidates
                const needParens =
                  op2.prec > op1.prec || (op2.prec === op1.prec && !op2.commutative)
                const left = needParens ? `(${a}${op1.sym}${b})` : `${a}${op1.sym}${b}`
                const expr = `${left}${op2.sym}${c}`
                // Verify the equation evaluates correctly to avoid filtering later
                if (expr.length <= MAX) {
                  const result = evaluateExpression(expr)
                  if (result === target) {
                    candidates.add(expr)
                  }
                }
              }
            }

            // Right-associative: a op1 (b op2 c)
            // Example: 2+(3*4) evaluates as 2+(12) = 14
            // Parentheses are needed when op2 has lower precedence than op1
            // (e.g., 2+(3*4) needs parens, but 2*(3+4) doesn't due to precedence)
            if (op2.guard(b, c)) {
              const v3 = op2.fn(b, c)
              if (v3 === undefined) continue
              if (op1.guard(a, v3)) {
                const v4 = op1.fn(a, v3)
                if (v4 === target) {
                  // Add parentheses only when necessary for correct evaluation
                  // If op2 has lower precedence than op1, we need parens
                  // Example: 2+(3*4) needs parens, but 2*(3+4) doesn't
                  const mid = op2.prec < op1.prec ? `(${b}${op2.sym}${c})` : `${b}${op2.sym}${c}`
                  const expr = `${a}${op1.sym}${mid}`
                  // Verify the equation evaluates correctly to avoid filtering later
                  if (expr.length <= MAX) {
                    const result = evaluateExpression(expr)
                    if (result === target) {
                      candidates.add(expr)
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Convert Set to array (validation already done during generation)
  const arr = Array.from(candidates)

  // Fallback if no valid equations found (shouldn't happen in practice)
  if (!arr.length) return `${target}+0`

  // Use seeded random to ensure same puzzle for same date and target
  // Combine dateSeed with target using string concatenation to avoid collisions
  // This makes puzzles consistent across sessions for the same day
  const combinedSeed = `${dateSeed}:${target}`
  const randomIndex = Math.floor(seededRandom(combinedSeed) * arr.length)
  return arr[randomIndex] ?? arr[0] ?? `${target}+0`
}
