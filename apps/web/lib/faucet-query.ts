import { z, ZodType } from 'zod'
import { getAddress } from 'viem'

/**
 * Zod schemas for faucet URL query parameter parsing.
 * Centralized to avoid duplication across components.
 */
export const actionSchema = z.enum(['mint', 'burn']).optional()
export const quantitySchema = z.string()
export const tokenSchema = z.string().transform(val => getAddress(val))
export const refetchSchema = z.string().transform(val => val === 'true')

/**
 * Helper function to parse a value with a Zod schema and return a fallback if parsing fails.
 * Reduces repetitive safeParse boilerplate in query parameter parsing.
 *
 * @param schema - Zod schema to parse against
 * @param fallback - Fallback value if parsing fails
 * @returns Parser function that can be used with nuqs useQueryStates
 *
 * @example
 * ```ts
 * parse: parseOrDefault(actionSchema, undefined)
 * ```
 */
export function parseOrDefault<T>(schema: ZodType<T>, fallback: T) {
  return (value: string): T => {
    const result = schema.safeParse(value)
    return result.success ? result.data : fallback
  }
}

