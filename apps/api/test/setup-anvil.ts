// Anvil setup for local blockchain testing
import { spawn } from 'child_process'
import { accessSync, constants } from 'fs'
import { fetchWithTimeout } from '@vencura/lib'

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const ANVIL_RPC_URL = 'http://localhost:8545'
const ANVIL_PORT = 8545
let anvilProcess: ReturnType<typeof spawn> | null = null

/**
 * Check if Anvil is already running by attempting to connect
 */
async function isAnvilRunning(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout({
      url: ANVIL_RPC_URL,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          id: 1,
        }),
      },
      timeoutMs: 2000, // Short timeout for localhost check
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Start Anvil local blockchain node
 * Returns true if Anvil started successfully, false otherwise
 * Handles parallel execution by checking multiple times and adding random delay
 */
export async function startAnvil(): Promise<boolean> {
  // Check multiple times with small delays to handle race conditions in parallel execution
  // This helps when multiple Jest workers try to start Anvil simultaneously
  for (let checkAttempt = 0; checkAttempt < 5; checkAttempt++) {
    if (await isAnvilRunning()) {
      console.log('Anvil is already running on http://localhost:8545')
      return true
    }
    // Small random delay to reduce collision probability when multiple processes start simultaneously
    await delay(100 + Math.random() * 200)
  }

  console.log('Starting Anvil local blockchain...')

  try {
    // Find anvil in PATH or use foundry bin directory
    const anvilPath =
      process.env.ANVIL_PATH ||
      (() => {
        const foundryBin = `${process.env.HOME}/.foundry/bin/anvil`
        try {
          accessSync(foundryBin, constants.F_OK)
          return foundryBin
        } catch {
          return 'anvil' // Fallback to PATH
        }
      })()

    // Start Anvil in background
    // Use spawn to allow process to continue after test completion
    anvilProcess = spawn(anvilPath, ['--host', '0.0.0.0', '--port', String(ANVIL_PORT)], {
      stdio: 'pipe',
      detached: false,
    })

    // Handle process errors
    anvilProcess.on('error', error => {
      console.error('Failed to start Anvil:', error.message)
      console.error(
        'Make sure Foundry is installed: https://book.getfoundry.sh/getting-started/installation',
      )
    })

    // Wait for Anvil to be ready (polling with exponential backoff)
    const maxAttempts = 30
    for (let i = 0; i < maxAttempts; i++) {
      // Check if another process already started Anvil (race condition handling)
      if (await isAnvilRunning()) {
        // If Anvil is running but we didn't start it, that's fine - another process did
        if (anvilProcess && !anvilProcess.killed) {
          console.log('Anvil is ready!')
        } else {
          console.log('Anvil is already running (started by another process)')
        }
        return true
      }
      // Exponential backoff: start with 200ms, increase gradually
      await delay(200 + i * 50)
    }

    // Final check - maybe another process started it while we were waiting
    if (await isAnvilRunning()) {
      console.log('Anvil is ready! (started by another process)')
      return true
    }

    console.error('Anvil failed to start within timeout period')
    return false
  } catch (error) {
    // Final check - maybe another process started it while we were handling the error
    if (await isAnvilRunning()) {
      console.log('Anvil is running (started by another process)')
      return true
    }
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Failed to start Anvil: ${errorMessage}`)
    return false
  }
}

/**
 * Stop Anvil process if we started it
 * Only stops the process we started, not other processes on the port
 * This prevents killing Anvil instances started by other test workers
 */
export async function stopAnvil(): Promise<void> {
  // Only kill Anvil process if we started it
  // Don't kill processes started by other workers - they'll clean up themselves
  if (anvilProcess) {
    try {
      anvilProcess.kill()
      anvilProcess = null
      console.log('Anvil stopped')
    } catch (error) {
      // Ignore errors when stopping
      console.warn('Error stopping Anvil:', error)
    }
  }
  // Don't kill other processes on the port - they might be from other test workers
  // Each worker manages its own Anvil instance, and the last one will clean up
}

/**
 * Get Anvil RPC URL
 */
export function getAnvilRpcUrl(): string {
  return ANVIL_RPC_URL
}
