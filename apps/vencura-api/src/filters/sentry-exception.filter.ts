import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import * as Sentry from '@sentry/node'

/**
 * Global exception filter that reports errors to Sentry.
 * Only reports to Sentry if Sentry is initialized.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    // Report to Sentry if initialized
    if (Sentry.getCurrentHub().getClient()) {
      Sentry.captureException(exception, {
        tags: {
          path: request.url,
          method: request.method,
        },
        extra: {
          statusCode: status,
          body: request.body,
          query: request.query,
        },
      })
    }

    // Return error response
    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error'

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    })
  }
}
