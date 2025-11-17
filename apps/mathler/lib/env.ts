import { z } from 'zod'
import { validateEnv } from '@vencura/lib'

const envSchema = z.object({
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function validateAppEnv({ env = process.env }: { env?: NodeJS.ProcessEnv } = {}) {
  const envData: NodeJS.ProcessEnv = {
    ...env,
    NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
    NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }
  return validateEnv({ schema: envSchema, env: envData })
}

/**
 * Gets validated environment variables with defaults.
 * Returns validated env vars or throws in production if required vars are missing.
 * Note: In Next.js, NEXT_PUBLIC_* variables are replaced at build time.
 */
export function getEnv(): Env {
  const result = validateAppEnv()

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
