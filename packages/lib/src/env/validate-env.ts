import { z } from 'zod'
import { formatZodErrors } from '../zod/format-errors'

/**
 * Generic environment variable validation helper using zod.
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
}): {
  isValid: boolean
  data?: z.infer<T>
  errors?: string[]
} {
  const result = schema.safeParse(env)

  if (!result.success) {
    return { isValid: false, errors: formatZodErrors(result.error) }
  }

  return { isValid: true, data: result.data }
}
