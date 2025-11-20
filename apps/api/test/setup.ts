// Jest setup file - runs before all tests
// Note: This file is transformed to CJS by ts-jest, so __dirname will be available at runtime
import { config } from 'dotenv'
import { resolve } from 'path'

// __dirname is available after ts-jest transforms to CJS
declare const __dirname: string

// Load environment variables with priority: .env (highest) > .env.test > .env.local
// .env is loaded last to overwrite all other env files (sensitive data takes precedence)
const envDir = resolve(__dirname, '../')
config({ path: resolve(envDir, '.env.local') })
config({ path: resolve(envDir, '.env.test') })
config({ path: resolve(envDir, '.env') }) // Load last to overwrite everything

// Note: Environment validation happens when the server starts (in globalSetup/setup-server.ts)
// The server validates env on startup, so we don't need to validate here
// Note: Server logs are captured via stdout/stderr streams in setup-server.ts
// Test log capture utilities are available in test/utils/ for programmatic use if needed
