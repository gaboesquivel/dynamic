import { z } from 'zod'
import { validateEnv } from './validate-env'

/**
 * Gets validated environment variables for Next.js apps.
 * Uses zod schema inference to automatically reconstruct env objects.
 * Returns validated env vars or throws in production if required vars are missing.
 *
 * @param params - Parameters
 * @param params.schema - Zod schema for environment variables
 * @param params.env - Environment variables object (defaults to process.env)
 * @returns Validated environment variables (typed from zod schema)
 * @throws Error in production if validation fails
 *
 * @example
 * ```ts
 * const envSchema = z.object({
 *   NEXT_PUBLIC_API_URL: z.string().url().optional(),
 *   NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
 * })
 *
 * export type Env = z.infer<typeof envSchema>
 *
 * export function getEnv(): Env {
 *   return getEnvHelper({ schema: envSchema })
 * }
 * ```
 */
export function getEnvHelper<T extends z.ZodTypeAny>({
  schema,
  env = process.env,
}: {
  schema: T
  env?: NodeJS.ProcessEnv
}): z.infer<T> {
  const result = validateEnv({ schema, env })

  if (!result.isValid) {
    const errorMessage = result.errors?.join('\n') || 'Environment validation failed'
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment validation failed:\n${errorMessage}`)
    }
    console.warn(`Environment validation warnings:\n${errorMessage}`)
    // In development, try to return parsed data even if validation had warnings
    // Zod will apply defaults and return partial data for optional fields
    const parsed = schema.safeParse(env)
    if (parsed.success) {
      return parsed.data
    }
    // If parsing still fails, throw error instead of unsafe fallback
    // This prevents returning invalid data when required fields are missing
    throw new Error(`Environment validation failed in development:\n${errorMessage}`)
  }

  return result.data as z.infer<T>
}
