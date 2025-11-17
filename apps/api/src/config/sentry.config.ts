import * as Sentry from '@sentry/node'
import { validateEnv } from './env.schema'

/**
 * Initializes Sentry error tracking if DSN is configured.
 * Follows RORO pattern (Receive an Object, Return an Object).
 * Includes beforeSend hook to filter sensitive data.
 */
export function initSentry({ env = process.env }: { env?: NodeJS.ProcessEnv } = {}) {
  const validatedEnv = validateEnv({ env })
  const dsn = validatedEnv.SENTRY_DSN
  const environment = validatedEnv.SENTRY_ENVIRONMENT || env.NODE_ENV || 'development'

  if (!dsn) return { initialized: false }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    debug: environment === 'development',
    beforeSend(event) {
      // Additional safety: ensure no sensitive data leaks through
      // The exception filter already filters extras, but this is a final safeguard
      if (event.extra) {
        // Remove any potentially sensitive fields that might have been added elsewhere
        const sensitiveKeys = ['body', 'query', 'password', 'token', 'secret', 'authorization']
        for (const key of sensitiveKeys) {
          if (key in event.extra) {
            delete event.extra[key]
          }
        }
      }
      return event
    },
  })

  return { initialized: true }
}
