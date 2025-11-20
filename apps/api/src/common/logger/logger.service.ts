import { Injectable } from '@nestjs/common'
import pino from 'pino'
import { requestContext } from '../context/request-context'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

@Injectable()
export class LoggerService {
  private readonly logger: pino.Logger

  constructor() {
    const nodeEnv = process.env.NODE_ENV || 'development'
    const logLevel =
      (process.env.LOG_LEVEL as LogLevel) || (nodeEnv === 'production' ? 'info' : 'debug')

    // Configure transport: pretty only in development, JSON for production/test
    const transport =
      nodeEnv === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss.l',
              ignore: 'pid,hostname',
            },
          }
        : undefined

    this.logger = pino({
      level: logLevel,
      transport,
      timestamp: pino.stdTimeFunctions.isoTime,
    })
  }

  private enrichLog(metadata?: Record<string, unknown>): Record<string, unknown> {
    const context = requestContext.getStore()
    return {
      ...(context?.requestId && { requestId: context.requestId }),
      ...(context?.userId && { userId: context.userId }),
      ...(context?.chainId && { chainId: context.chainId }),
      ...metadata,
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.logger.debug(this.enrichLog(metadata), message)
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(this.enrichLog(metadata), message)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logger.warn(this.enrichLog(metadata), message)
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.logger.error(this.enrichLog(metadata), message)
  }

  child(bindings: Record<string, unknown>): pino.Logger {
    return this.logger.child(bindings)
  }
}
