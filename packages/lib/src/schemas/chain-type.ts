import { z } from 'zod'

/**
 * Schema for validating chain type.
 * Chain types supported by Dynamic SDK.
 */
export const chainTypeSchema = z.enum([
  'evm',
  'solana',
  'cosmos',
  'bitcoin',
  'flow',
  'starknet',
  'algorand',
  'sui',
  'spark',
  'tron',
])
