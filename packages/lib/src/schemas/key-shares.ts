import { z } from 'zod'

/**
 * Schema for validating key shares array.
 * Used for JSON.parse validation of encrypted key shares.
 */
export const keySharesSchema = z.array(z.string())
