import { z } from 'zod'

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
    .transform(val => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional(),

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
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .optional(),

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
 */
export function validateEnv({ env = process.env }: { env?: NodeJS.ProcessEnv } = {}) {
  // Extract required fields for validation
  const requiredFields = {
    DYNAMIC_ENVIRONMENT_ID: env.DYNAMIC_ENVIRONMENT_ID,
    DYNAMIC_API_TOKEN: env.DYNAMIC_API_TOKEN,
    ENCRYPTION_KEY: env.ENCRYPTION_KEY,
    PORT: env.PORT,
    OPEN_AI_KEY: env.OPEN_AI_KEY,
    ARBITRUM_SEPOLIA_RPC_URL: env.ARBITRUM_SEPOLIA_RPC_URL,
    SOLANA_RPC_URL: env.SOLANA_RPC_URL,
    SENTRY_DSN: env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: env.SENTRY_ENVIRONMENT,
    ENABLE_SWAGGER_UI: env.ENABLE_SWAGGER_UI,
  }

  // Set default for ENABLE_SWAGGER_UI if not provided
  if (!requiredFields.ENABLE_SWAGGER_UI) {
    requiredFields.ENABLE_SWAGGER_UI = 'false'
  }

  // Validate required fields
  const result = envSchema.safeParse(requiredFields)

  if (!result.success) {
    const errors = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join('\n')
    throw new Error(`Environment validation failed:\n${errors}`)
  }

  return result.data
}
