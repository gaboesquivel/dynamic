import { z } from 'zod'
import { getEnvHelper } from '@vencura/lib'

const envSchema = z.object({
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Gets validated environment variables with defaults.
 * Returns validated env vars or throws in production if required vars are missing.
 * Note: In Next.js, NEXT_PUBLIC_* variables are replaced at build time.
 */
export function getEnv(): Env {
  return getEnvHelper({ schema: envSchema })
}
