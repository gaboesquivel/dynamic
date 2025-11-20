import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Loads environment-specific .env files based on NODE_ENV.
 *
 * Priority order (highest to lowest):
 * 1. .env (highest priority, sensitive data, never committed, overrides everything)
 * 2. .env.development / .env.staging / .env.production / .env.test (based on NODE_ENV, committed configs)
 *
 * Environment mapping:
 * - development -> .env.development
 * - staging -> .env.staging
 * - production -> .env.production
 * - test -> .env.test
 *
 * File purposes:
 * - .env - Sensitive data (API keys, tokens, secrets) - NEVER COMMIT
 * - .env.{environment} - Configuration (URLs, feature flags, non-sensitive settings) - COMMITTED
 * - .env-example - Template for .env file (shows required sensitive variables)
 */
export function loadEnv(): void {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const envDir = resolve(__dirname, '../../')

  // Map NODE_ENV to env file name
  const envFileMap: Record<string, string> = {
    development: '.env.development',
    staging: '.env.staging',
    production: '.env.production',
    test: '.env.test',
  }

  const envFileName = envFileMap[nodeEnv] || '.env.development'

  // Load in order (last loaded overwrites previous values):
  // 1. Environment-specific config file first (committed, non-sensitive configs)
  config({ path: resolve(envDir, envFileName) })

  // 2. .env file last (sensitive data, highest priority, never committed, overwrites configs)
  // This ensures .env values override .env.{environment} values
  config({ path: resolve(envDir, '.env') })
}
