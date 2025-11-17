import { ZodError } from 'zod'

/**
 * Formats zod validation errors into a readable string array.
 *
 * @param error - ZodError to format
 * @returns Array of formatted error strings
 *
 * @example
 * ```ts
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   const errors = formatZodErrors(result.error)
 *   // Returns: ['field1: Required', 'field2: Invalid format']
 * }
 * ```
 */
export function formatZodErrors(error: ZodError): string[] {
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
}
