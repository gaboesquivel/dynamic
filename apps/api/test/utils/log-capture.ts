// Singleton object for capturing logs during tests (NOT globalThis to avoid race conditions)
interface LogEntry {
  level: string
  message: string
  metadata?: Record<string, unknown>
  timestamp: string
}

class LogCapture {
  private logs: LogEntry[] = []

  appendLog(level: string, message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    })
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }

  getLogsAsString(): string {
    return this.logs
      .map(log => {
        const metaStr = log.metadata ? ` ${JSON.stringify(log.metadata)}` : ''
        return `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${metaStr}`
      })
      .join('\n')
  }
}

// Export singleton instance
export const logCapture = new LogCapture()

// Export convenience functions
export function appendLog(
  level: string,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  logCapture.appendLog(level, message, metadata)
}

export function getLogs(): LogEntry[] {
  return logCapture.getLogs()
}

export function clearLogs(): void {
  logCapture.clearLogs()
}

export function getLogsAsString(): string {
  return logCapture.getLogsAsString()
}
