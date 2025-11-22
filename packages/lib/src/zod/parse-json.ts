import { z } from 'zod'
import { isZodError } from '../error/is-zod-error'
import { getErrorMessage } from '../error/get-error-message'

/**
 * Parses a JSON string and validates it against a Zod schema.
 * Encapsulates the common pattern of JSON.parse + Zod validation with proper error handling.
 *
 * @param params - Parsing parameters
 * @param params.jsonString - JSON string to parse and validate
 * @param params.schema - Zod schema to validate against
 * @returns Validated data typed from the schema
 * @throws ZodError if validation fails
 * @throws Error if JSON parsing fails
 *
 * @example
 * ```ts
 * const keyShares = parseJsonWithSchema({
 *   jsonString: encryptedData,
 *   schema: z.array(z.string())
 * })
 * ```
 */
export function parseJsonWithSchema<T extends z.ZodTypeAny>({
  jsonString,
  schema,
}: {
  jsonString: string
  schema: T
}): z.infer<T> {
  try {
    const parsed = JSON.parse(jsonString)
    return schema.parse(parsed)
  } catch (error) {
    if (isZodError(error)) {
      throw error
    }
    // Re-throw JSON.parse errors with context
    throw new Error(`Failed to parse JSON: ${getErrorMessage(error) ?? String(error)}`)
  }
}
