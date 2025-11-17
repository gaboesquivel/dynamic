import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import * as Sentry from '@sentry/node'
import { sanitizeErrorMessage } from '../common/error-handler'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

/**
 * Normalizes HttpException response to a consistent string format.
 * HttpException.getResponse() can return string | object, so we extract the message field.
 */
function normalizeExceptionMessage(exception: unknown, isProduction: boolean): string {
  if (!(exception instanceof HttpException)) return 'Internal server error'

  const response = exception.getResponse()
  let message: string

  if (typeof response === 'string') {
    message = response
  } else if (typeof response === 'object' && response !== null) {
    if ('message' in response && typeof response.message === 'string') {
      message = response.message
    } else if ('error' in response && typeof response.error === 'string') {
      message = response.error
    } else {
      message = JSON.stringify(response)
    }
  } else {
    message = 'Internal server error'
  }

  // Sanitize error message to prevent information leakage in production
  return sanitizeErrorMessage(message, isProduction)
}

/**
 * Global exception filter that reports errors to Sentry.
 * Only reports to Sentry if Sentry is initialized.
 * Security: Only sends safe fields (method, url, userId) - excludes body and query to prevent PII leakage.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<AuthenticatedRequest>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

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
          path: request.url,
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
      path: request.url,
      message,
    })
  }
}
