import * as Sentry from '@sentry/node'
import { validateEnv } from './env.schema'

/**
 * Initializes Sentry error tracking if DSN is configured.
 * Follows RORO pattern (Receive an Object, Return an Object).
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
  })

  return { initialized: true }
}
