/**
 * Generates a consistent date key in YYYY-MM-DD format.
 *
 * @param date - Optional date, defaults to today
 * @returns Date string in YYYY-MM-DD format
 * @throws Error if date is invalid
 *
 * @example
 * ```ts
 * const key = getDateKey(new Date('2024-01-15'))
 * // Returns: '2024-01-15'
 * ```
 */
export function getDateKey(date?: Date): string {
  const d = date ?? new Date()

  if (isNaN(d.getTime())) throw new Error('Invalid date provided to getDateKey')

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
