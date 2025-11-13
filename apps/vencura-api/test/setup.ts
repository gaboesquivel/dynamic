// Jest setup file - runs before all tests
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
const envPath = resolve(__dirname, '../.env')
config({ path: envPath })

// Validate required environment variables
const requiredEnvVars = ['DYNAMIC_ENVIRONMENT_ID', 'DYNAMIC_API_TOKEN', 'ENCRYPTION_KEY']

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please ensure these are set in ${envPath}`,
  )
}

// Validate ENCRYPTION_KEY length
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters long')
}

console.log('Test environment configured successfully')
console.log(`Dynamic Environment ID: ${process.env.DYNAMIC_ENVIRONMENT_ID}`)
