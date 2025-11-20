import { getLogsAsString, clearLogs } from './log-capture'

/**
 * Dump logs to console. Should be called:
 * - On test failure (automatic)
 * - If LOG_TEST_OUTPUT=true env var is set
 * - Do NOT dump logs for passing tests (avoids log spam)
 */
export function dumpLogs(): void {
  const logs = getLogsAsString()
  if (logs) {
    console.log('\n=== Test Logs ===')
    console.log(logs)
    console.log('=== End Test Logs ===\n')
  }
}

/**
 * Clear logs after dumping (call after test suite or on demand)
 */
export function dumpAndClearLogs(): void {
  dumpLogs()
  clearLogs()
}
