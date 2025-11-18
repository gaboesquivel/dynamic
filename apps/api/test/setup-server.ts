// Jest global setup - starts API server before all tests
import { spawn, ChildProcess } from 'child_process'
import { resolve } from 'path'
import { execSync } from 'child_process'
import { fetchWithTimeout } from '@vencura/lib'

let serverProcess: ChildProcess | null = null

const TEST_SERVER_PORT = process.env.TEST_SERVER_PORT || '3077'
const TEST_SERVER_URL = process.env.TEST_SERVER_URL || `http://localhost:${TEST_SERVER_PORT}`

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if server is ready by hitting health check endpoint
 */
async function isServerReady(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout({
      url: TEST_SERVER_URL,
      options: {
        method: 'GET',
      },
      timeoutMs: 2000,
    })
    return response.ok && response.status === 200
  } catch {
    return false
  }
}

/**
 * Build the application before starting server
 */
function buildApp(): void {
  console.log('Building application for tests...')
  try {
    const apiDir = resolve(__dirname, '../')
    execSync('pnpm run build', {
      cwd: apiDir,
      stdio: 'inherit',
    })
    console.log('Application built successfully')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to build application: ${errorMessage}`)
  }
}

/**
 * Start API server as separate process
 */
async function startServer(): Promise<void> {
  console.log(`Starting API server on port ${TEST_SERVER_PORT}...`)

  const apiDir = resolve(__dirname, '../')
  const mainJsPath = resolve(apiDir, 'dist/main.js')

  // Set environment variables for the server process
  const serverEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: TEST_SERVER_PORT,
  }

  // Start server process
  serverProcess = spawn('node', [mainJsPath], {
    cwd: apiDir,
    env: serverEnv,
    stdio: 'pipe',
    detached: false,
  })

  // Handle process errors
  serverProcess.on('error', error => {
    console.error('Failed to start server:', error.message)
    throw error
  })

  // Log server output for debugging
  serverProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString().trim()
    if (output) {
      console.log(`[Server] ${output}`)
    }
  })

  serverProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString().trim()
    if (output) {
      console.error(`[Server Error] ${output}`)
    }
  })

  // Wait for server to be ready (polling with exponential backoff)
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    if (await isServerReady()) {
      console.log(`API server is ready at ${TEST_SERVER_URL}`)
      return
    }
    // Exponential backoff: start with 200ms, increase gradually
    await delay(200 + i * 50)
  }

  // Check if process exited
  if (serverProcess.killed || serverProcess.exitCode !== null) {
    throw new Error(`Server process exited unexpectedly with code ${serverProcess.exitCode}`)
  }

  throw new Error(`Server failed to start within timeout period. Check server logs above.`)
}

/**
 * Jest global setup function
 * Builds app and starts server before all tests
 */
export default async function globalSetup(): Promise<void> {
  try {
    buildApp()
    await startServer()

    // Store PID in environment variable for teardown
    // Jest globalSetup/teardown run in separate processes, so we use env var
    if (serverProcess?.pid) {
      process.env.TEST_SERVER_PID = serverProcess.pid.toString()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Global setup failed: ${errorMessage}`)
    if (serverProcess) {
      serverProcess.kill()
    }
    throw error
  }
}
