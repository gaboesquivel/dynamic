// Jest global teardown - stops API server after all tests

/**
 * Jest global teardown function
 * Kills server process started in globalSetup using PID from environment variable
 */
export default async function globalTeardown(): Promise<void> {
  console.log('Stopping API server...')

  const pid = process.env.TEST_SERVER_PID

  if (pid) {
    try {
      const pidNum = parseInt(pid, 10)
      if (!isNaN(pidNum)) {
        // Try graceful shutdown first
        process.kill(pidNum, 'SIGTERM')

        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if process is still running and force kill if needed
        try {
          process.kill(pidNum, 0) // Check if process exists
          // Process still exists, force kill
          process.kill(pidNum, 'SIGKILL')
        } catch {
          // Process already terminated, good
        }

        console.log('API server stopped')
      } else {
        console.warn(`Invalid PID: ${pid}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Error stopping server: ${errorMessage}`)
    }
  } else {
    console.log('Server PID not found in environment, server may have already stopped')
  }
}
