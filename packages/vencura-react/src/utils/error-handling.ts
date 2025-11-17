import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

/**
 * Formats a zod error into a user-friendly error message.
 * Uses zod-validation-error for better error formatting.
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
  try {
    const validationError = fromZodError(error)
    return validationError.message
  } catch {
    // Fallback to default message if zod-validation-error fails
    return defaultMessage
  }
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
