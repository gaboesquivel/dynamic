import { ZodError } from 'zod'

/**
 * Formats a zod error into a user-friendly error message.
 * Follows RORO pattern (Receive an Object, Return an Object).
 *
 * @param params - Error formatting parameters
 * @param params.error - ZodError to format
 * @param params.defaultMessage - Default message if error cannot be formatted
 * @returns Formatted error message
 */
export function formatZodError({
  error,
  defaultMessage = 'Validation failed',
}: {
  error: ZodError
  defaultMessage?: string
}): string {
  if (error.errors.length === 0) return defaultMessage

  // Return the first error message for simplicity
  // In production, you might want to combine multiple errors
  const firstError = error.errors[0]
  if (firstError) {
    const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : ''
    return `${path}${firstError.message}`
  }

  return defaultMessage
}

/**
 * Checks if an error is a ZodError.
 *
 * @param error - Error to check
 * @returns True if error is a ZodError
 */
export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError
}

/**
 * Extracts a user-friendly error message from various error types.
 * Handles ZodError, Error, and unknown error types.
 *
 * @param error - Error to extract message from
 * @returns Error message string or null
 */
export function extractErrorMessage(error: unknown): string | null {
  if (!error) return null

  if (isZodError(error)) return formatZodError({ error })

  if (error instanceof Error) return error.message

  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string')
    return error.message

  return String(error)
}
