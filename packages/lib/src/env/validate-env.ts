import { z } from 'zod'
import { formatZodErrors } from '../zod/format-errors'

/**
 * Core validation logic that always returns a result.
 * Internal helper used by both public functions.
 */
function _validateEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): { isValid: false; errors: string[] } | { isValid: true; data: z.infer<T> } {
  const result = schema.safeParse(env)

  if (!result.success) {
    return { isValid: false, errors: formatZodErrors(result.error) }
  }

  return { isValid: true, data: result.data }
}

/**
 * Validates environment variables and returns a result object.
 * Use this for Next.js apps where you want to handle errors gracefully.
 *
 * @param params - Validation parameters
 * @param params.schema - Zod schema for environment variables
 * @param params.env - Environment variables object (defaults to process.env)
 * @returns Validation result with isValid flag, data, and errors
 *
 * @example
 * ```ts
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
 */
export function validateEnv<T extends z.ZodTypeAny>({
  schema,
  env = process.env,
}: {
  schema: T
  env?: NodeJS.ProcessEnv
}): { isValid: false; errors: string[] } | { isValid: true; data: z.infer<T> } {
  return _validateEnv(schema, env)
}

/**
 * Validates environment variables and throws on error.
 * Use this for NestJS apps where validation failures should crash the app.
 *
 * @param params - Validation parameters
 * @param params.schema - Zod schema for environment variables
 * @param params.env - Environment variables object (defaults to process.env)
 * @returns Validated environment variables (typed from zod schema)
 * @throws Error if validation fails
 *
 * @example
 * ```ts
 * const envSchema = z.object({
 *   API_URL: z.string().url(),
 *   PORT: z.string().optional()
 * })
 *
 * const env = validateEnvOrThrow({ schema: envSchema })
 * // env is typed as z.infer<typeof envSchema>
 * ```
 */
export function validateEnvOrThrow<T extends z.ZodTypeAny>({
  schema,
  env = process.env,
}: {
  schema: T
  env?: NodeJS.ProcessEnv
}): z.infer<T> {
  const result = _validateEnv(schema, env)
  if (!result.isValid) {
    const errorMessage = result.errors.join('\n')
    throw new Error(`Environment validation failed:\n${errorMessage}`)
  }
  return result.data
}
