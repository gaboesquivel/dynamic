/**
 * Error handler utilities for sanitizing error messages in production.
 * Follows RORO pattern (Receive an Object, Return an Object).
 */

interface SanitizeErrorParams {
  error: unknown
  isProduction: boolean
}

interface SanitizedError {
  message: string
  details: string | null
}

/**
 * Sanitizes error messages to prevent information leakage in production.
 * Returns generic message in production, full details in development.
 */
export function sanitizeError({ error, isProduction }: SanitizeErrorParams): SanitizedError {
  if (isProduction) return { message: 'Internal server error', details: null }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? (error.stack ?? null) : null

  return { message: errorMessage, details: errorStack }
}

/**
 * Checks if an error message contains sensitive information that should be sanitized.
 */
export function containsSensitiveInfo(message: string): boolean {
  const sensitivePatterns = [
    /ENCRYPTION_KEY/,
    /DYNAMIC_API_TOKEN/,
    /DATABASE_URL/,
    /SENTRY_DSN/,
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
  ]

  return sensitivePatterns.some(pattern => pattern.test(message))
}

/**
 * Sanitizes error messages by removing sensitive information.
 */
export function sanitizeErrorMessage(message: string, isProduction: boolean): string {
  if (!isProduction) return message
  if (containsSensitiveInfo(message)) return 'Configuration error'
  return message
}
