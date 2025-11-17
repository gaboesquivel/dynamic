import { formatZodError, isZodError, getErrorMessage } from '@vencura/lib'

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

  return getErrorMessage(error)
}

export { formatZodError, isZodError }
