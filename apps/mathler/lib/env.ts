import { z } from 'zod'

/**
 * Schema for frontend environment variables.
 * Validates all required and optional environment variables with proper types.
 */
const envSchema = z.object({
  // Required environment variables
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z
    .string()
    .min(1, 'NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is required')
    .optional(),

  // Sentry error tracking (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
})

/**
 * Type inferred from env schema
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validates frontend environment variables and returns typed config.
 * Follows RORO pattern (Receive an Object, Return an Object).
 * Uses safeParse to avoid throwing errors in the browser.
 */
export function validateEnv({
  env = process.env,
}: {
  env?: NodeJS.ProcessEnv
} = {}): {
  isValid: boolean
  data?: Env
  errors?: string[]
} {
  const envData = {
    NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
    NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }

  const result = envSchema.safeParse(envData)

  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    return { isValid: false, errors }
  }

  return { isValid: true, data: result.data }
}

/**
 * Gets validated environment variables with defaults.
 * Returns validated env vars or throws in production if required vars are missing.
 * Note: In Next.js, NEXT_PUBLIC_* variables are replaced at build time.
 */
export function getEnv(): Env {
  const result = validateEnv()

  if (!result.isValid) {
    const errorMessage = result.errors?.join('\n') || 'Environment validation failed'
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment validation failed:\n${errorMessage}`)
    }
    console.warn(`Environment validation warnings:\n${errorMessage}`)
  }

  return {
    NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }
}
