import { z } from 'zod'
import { formatZodErrors } from '@vencura/lib'

/**
 * Validates API response data against a zod schema.
 *
 * @param params - Validation parameters
 * @param params.data - The data to validate
 * @param params.schema - Zod schema to validate against
 * @param params.errorMessage - Custom error message if validation fails
 * @returns Validated data
 * @throws Error if validation fails
 *
 * @example
 * ```ts
 * const validatedWallet = validateResponse({
 *   data: apiResponse.body,
 *   schema: Wallet,
 *   errorMessage: 'Invalid wallet response'
 * })
 * ```
 */
export function validateResponse<T extends z.ZodTypeAny>({
  data,
  schema,
  errorMessage = 'Response validation failed',
}: {
  data: unknown
  schema: T
  errorMessage?: string
}): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = formatZodErrors(result.error).join(', ')
    throw new Error(`${errorMessage}: ${errors}`)
  }

  return result.data
}
