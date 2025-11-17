// Jest setup file - runs before all tests
import { config } from 'dotenv'
import { resolve } from 'path'
import { validateEnv } from '../src/config/env.schema'

// Load environment variables from .env file
const envPath = resolve(__dirname, '../.env')
config({ path: envPath })

// Validate required environment variables using zod schema
try {
  const validatedEnv = validateEnv()
  console.log('Test environment configured successfully')
  console.log(`Dynamic Environment ID: ${validatedEnv.DYNAMIC_ENVIRONMENT_ID}`)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  throw new Error(
    `${errorMessage}\nPlease ensure required environment variables are set in ${envPath}`,
  )
}
