import { z } from 'zod'
import { formatZodErrors } from '../zod/format-errors'

/**
 * Generic environment variable validation helper using zod.
 * Supports both Next.js pattern (return result) and NestJS pattern (throw on error).
 *
 * @param params - Validation parameters
 * @param params.schema - Zod schema for environment variables
 * @param params.env - Environment variables object (defaults to process.env)
 * @param params.throwOnError - If true, throws error instead of returning result (NestJS pattern)
 * @returns Validation result with isValid flag, data, and errors (or throws if throwOnError is true)
 *
 * @example
 * ```ts
 * // Next.js pattern (return result)
 * const envSchema = z.object({
 *   API_URL: z.string().url(),
 *   PORT: z.string().optional()
 * })
 *
 * const result = validateEnv({ schema: envSchema })
 * if (result.isValid) {
 *   console.log(result.data) // Typed env data
 * } else {
 *   console.error(result.errors) // Validation errors
 * }
 * ```
 *
 * @example
 * ```ts
 * // NestJS pattern (throw on error)
 * const envSchema = z.object({
 *   API_URL: z.string().url(),
 *   PORT: z.string().optional()
 * })
 *
 * const env = validateEnv({ schema: envSchema, throwOnError: true })
 * // env is typed as z.infer<typeof envSchema>
 * ```
 */
export function validateEnv<T extends z.ZodTypeAny>({
  schema,
  env = process.env,
  throwOnError = false,
}: {
  schema: T
  env?: NodeJS.ProcessEnv
  throwOnError?: boolean
}):
  | {
      isValid: boolean
      data?: z.infer<T>
      errors?: string[]
    }
  | z.infer<T> {
  const result = schema.safeParse(env)

  if (!result.success) {
    const errors = formatZodErrors(result.error)
    if (throwOnError) {
      const errorMessage = errors.join('\n')
      throw new Error(`Environment validation failed:\n${errorMessage}`)
    }
    return { isValid: false, errors }
  }

  if (throwOnError) {
    return result.data
  }

  return { isValid: true, data: result.data }
}
