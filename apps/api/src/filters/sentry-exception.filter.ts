import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Request, Response } from 'express'
import * as Sentry from '@sentry/node'
import { sanitizeErrorMessage, getErrorMessage } from '@vencura/lib'
import isPlainObject from 'lodash/isPlainObject'
import isEmpty from 'lodash/isEmpty'
import { LoggerService } from '../common/logger/logger.service'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
  }
  requestId?: string
}

/**
 * Normalizes HttpException response to a consistent string format.
 * HttpException.getResponse() can return string | object, so we extract the message field.
 * Uses @lib's getErrorMessage for non-HttpException cases and lodash for type checking.
 */
function normalizeExceptionMessage(exception: unknown, isProduction: boolean): string {
  if (!(exception instanceof HttpException)) {
    // Use @lib's getErrorMessage for non-HttpException cases
    const message = getErrorMessage(exception) || 'Internal server error'
    return sanitizeErrorMessage({ message, isProduction })
  }

  const response = exception.getResponse()
  let message: string

  if (typeof response === 'string') {
    message = response
  } else if (isPlainObject(response) && response !== null) {
    const obj = response as Record<string, unknown>
    if ('message' in obj && typeof obj.message === 'string') {
      message = obj.message
    } else if ('error' in obj && typeof obj.error === 'string') {
      message = obj.error
    } else {
      message = JSON.stringify(response)
    }
  } else {
    message = 'Internal server error'
  }

  // Sanitize error message to prevent information leakage in production
  return sanitizeErrorMessage({ message, isProduction })
}

/**
 * Global exception filter that reports errors to Sentry.
 * Only reports to Sentry if Sentry is initialized.
 * Security: Only sends safe fields (method, url, userId) - excludes body and query to prevent PII leakage.
 */
@Catch()
@Injectable()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LoggerService) private readonly logger?: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<AuthenticatedRequest>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    // Extract safe fields for logging (DO NOT log request.body or authorization headers)
    const errorMessage = exception instanceof Error ? exception.message : String(exception)
    const errorStack = exception instanceof Error ? exception.stack : undefined
    const sanitizedUrl = request.url.split('?')[0] // Remove query params

    // Log structured error before rethrowing
    const logMetadata = {
      method: request.method,
      url: sanitizedUrl,
      statusCode: status,
      requestId: request.requestId,
      ...(request.user?.id && { userId: request.user.id }),
      error: errorMessage,
      ...(errorStack && { stack: errorStack }),
    }

    // Use optional chaining with isEmpty check for logger
    if (!isEmpty(this.logger)) {
      this.logger.error('Exception caught by global filter', logMetadata)
    }

    // Report to Sentry if initialized - only send safe fields to prevent PII exposure
    if (Sentry.getCurrentHub().getClient()) {
      const safeExtras: Record<string, unknown> = {
        statusCode: status,
      }

      // Only include userId if user is authenticated (safe to log)
      if (request.user?.id) {
        safeExtras.userId = request.user.id
      }

      Sentry.captureException(exception, {
        tags: {
          path: sanitizedUrl,
          method: request.method,
        },
        extra: safeExtras,
      })
    }

    // Return error response with normalized and sanitized message
    const isProduction = process.env.NODE_ENV === 'production'
    const message = normalizeExceptionMessage(exception, isProduction)

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: sanitizedUrl,
      message,
    })
  }
}
