import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { delay, getErrorMessage } from '@vencura/lib'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import isPlainObject from 'lodash/isPlainObject'
import { z } from 'zod'
import { LoggerService } from './logger/logger.service'

const RateLimitConfigSchema = z.object({
  maxRetries: z.number().int().positive().default(5),
  baseDelayMs: z.number().int().positive().default(1000),
  maxDelayMs: z.number().int().positive().default(30000),
  jitterMaxMs: z.number().int().nonnegative().default(1000),
})

type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>

interface RetryOptions {
  context: string
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

@Injectable()
export class RateLimitService implements OnModuleInit {
  private config: RateLimitConfig

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    // Initialize with defaults, will be updated in onModuleInit
    // Zod will coerce numbers, so we can pass the default values directly
    this.config = RateLimitConfigSchema.parse({
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
    })
  }

  onModuleInit(): void {
    // Get rate limit config from nested config structure or environment variables
    // ConfigService is now available after module initialization
    const rateLimitConfig = this.configService.get<
      { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number } | undefined
    >('dynamic.rateLimit')

    // Build config object - zod will handle defaults and type coercion
    const rawConfig: Partial<{ maxRetries: number; baseDelayMs: number; maxDelayMs: number }> = {}

    if (rateLimitConfig?.maxRetries !== undefined) {
      rawConfig.maxRetries = rateLimitConfig.maxRetries
    } else if (process.env.DYNAMIC_RATE_LIMIT_MAX_RETRIES) {
      rawConfig.maxRetries = parseInt(process.env.DYNAMIC_RATE_LIMIT_MAX_RETRIES, 10)
    }

    if (rateLimitConfig?.baseDelayMs !== undefined) {
      rawConfig.baseDelayMs = rateLimitConfig.baseDelayMs
    } else if (process.env.DYNAMIC_RATE_LIMIT_BASE_DELAY_MS) {
      rawConfig.baseDelayMs = parseInt(process.env.DYNAMIC_RATE_LIMIT_BASE_DELAY_MS, 10)
    }

    if (rateLimitConfig?.maxDelayMs !== undefined) {
      rawConfig.maxDelayMs = rateLimitConfig.maxDelayMs
    } else if (process.env.DYNAMIC_RATE_LIMIT_MAX_DELAY_MS) {
      rawConfig.maxDelayMs = parseInt(process.env.DYNAMIC_RATE_LIMIT_MAX_DELAY_MS, 10)
    }

    // Zod will apply defaults for any missing values
    this.config = RateLimitConfigSchema.parse(rawConfig)
  }

  async retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
    // Retry logic removed - delays are handled at test level to prevent rate limits
    // Just call the function directly
    return await fn()
  }

  private isRateLimitError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const errorObj = error as Record<string, unknown>

    const status = errorObj.status ?? (errorObj.response as Record<string, unknown>)?.status
    if (status === 429) return true

    const message = getErrorMessage(error)
    if (isEmpty(message)) return false

    const lowerMessage = message.toLowerCase()
    return (
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('429') ||
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('quota exceeded')
    )
  }

  private extractRetryAfter(error: unknown): number | null {
    if (!error || typeof error !== 'object') return null

    const errorObj = error as Record<string, unknown>
    const response = errorObj.response
    const headers =
      errorObj.headers ??
      (isPlainObject(response) ? (response as Record<string, unknown>)?.headers : undefined)

    if (!headers || !isPlainObject(headers)) return null

    const retryAfter = (headers as Record<string, unknown>)['retry-after']
    if (isString(retryAfter)) {
      const parsed = parseInt(retryAfter, 10)
      return isNaN(parsed) ? null : parsed
    }
    if (typeof retryAfter === 'number') return retryAfter

    return null
  }
}
