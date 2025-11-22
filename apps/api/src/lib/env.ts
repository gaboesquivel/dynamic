// Ensure env files are loaded before validation
import './load-env'

import { z } from 'zod'
import { validateEnvOrThrow } from '@vencura/lib'

const envSchema = z.object({
  DYNAMIC_ENVIRONMENT_ID: z.string().min(1),
  DYNAMIC_API_TOKEN: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(1),
  PORT: z.coerce.number().optional().default(3077),
  ARB_TESTNET_GAS_FAUCET_KEY: z.string().min(1).optional(),
  SEPOLIA_RPC_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Gets validated environment variables.
 * Throws error if validation fails (server should crash on invalid config).
 */
export function getEnv(): Env {
  return validateEnvOrThrow({ schema: envSchema })
}

/**
 * Validated environment configuration object.
 * Validated at module load - fails fast if config is invalid.
 */
export const zEnv = getEnv()
