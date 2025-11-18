import { z } from 'zod'
import { validateEnv as validateEnvLib } from '@vencura/lib'

/**
 * Schema for environment variables.
 * Validates all required and optional environment variables with proper types.
 */
export const envSchema = z.object({
  // Required environment variables
  DYNAMIC_ENVIRONMENT_ID: z.string().min(1, 'DYNAMIC_ENVIRONMENT_ID is required'),
  DYNAMIC_API_TOKEN: z.string().min(1, 'DYNAMIC_API_TOKEN is required'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters long'),

  // Optional environment variables
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a valid number')
    .default('3077')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive()),

  // AI/LLM configuration (optional)
  OPEN_AI_KEY: z.string().min(1).optional(),

  // RPC URL overrides (optional)
  ARBITRUM_SEPOLIA_RPC_URL: z.string().url().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),

  // Sentry error tracking (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Swagger UI feature flag (optional, default: false for security)
  ENABLE_SWAGGER_UI: z
    .string()
    .default('false')
    .transform(val => val === 'true')
    .pipe(z.boolean()),

  // Testing: Local blockchain configuration (optional, default: true for development/test, false for staging/production)
  USE_LOCAL_BLOCKCHAIN: z
    .string()
    .default('true')
    .transform(val => val === 'true')
    .pipe(z.boolean()),

  // Testing: Faucet private key for testnet funding (optional)
  FAUCET_PRIVATE_KEY: z.string().min(1).optional(),

  // Dynamic RPC_URL_* variables (validated as URLs when present)
  // Note: These are collected dynamically, so we validate them in the config function
})

/**
 * Type inferred from env schema (for required fields only)
 */
export type EnvSchema = z.infer<typeof envSchema>

/**
 * Validates environment variables and returns typed config.
 * Follows RORO pattern (Receive an Object, Return an Object).
 * Uses @lib's validateEnv with throwOnError for NestJS pattern.
 */
export function validateEnv({ env = process.env }: { env?: NodeJS.ProcessEnv } = {}): EnvSchema {
  // Prepare env object with defaults (matching Next.js pattern)
  const nodeEnv = env.NODE_ENV || 'development'
  const envData: NodeJS.ProcessEnv = {
    ...env,
    // Set defaults for optional fields (matching Next.js behavior)
    PORT: env.PORT || '3077',
    ENABLE_SWAGGER_UI: env.ENABLE_SWAGGER_UI || 'false',
    // Set default for USE_LOCAL_BLOCKCHAIN based on NODE_ENV (like Next.js)
    USE_LOCAL_BLOCKCHAIN:
      env.USE_LOCAL_BLOCKCHAIN ||
      (nodeEnv === 'development' || nodeEnv === 'test' ? 'true' : 'false'),
  }

  // Use @lib's validateEnv with throwOnError for NestJS pattern
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return validateEnvLib({ schema: envSchema, env: envData, throwOnError: true }) as EnvSchema
}
