import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'
import { requestContext } from '../context/request-context'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
  }
  requestId?: string
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<AuthenticatedRequest>()
    const response = ctx.getResponse<Response>()

    const method = request.method
    // Sanitize URL: remove query parameters to avoid logging sensitive data
    const sanitizedUrl = request.url.split('?')[0]
    const requestId = request.requestId
    const userId = request.user?.id

    // Extract chainId from request body/params/query (safe to log)
    const chainId =
      (request.body as { chainId?: number | string })?.chainId ||
      (request.params as { chainId?: number | string })?.chainId ||
      (request.query as { chainId?: number | string })?.chainId

    const startTime = Date.now()

    // Set up AsyncLocalStorage context for this request
    return requestContext.run({ requestId, userId, chainId }, () => {
      return next.handle().pipe(
        tap({
          next: () => {
            const duration = Date.now() - startTime
            const status = response.statusCode

            const logMetadata = {
              method,
              url: sanitizedUrl,
              status,
              duration,
              requestId,
              ...(userId && { userId }),
              ...(chainId && { chainId }),
            }

            // Log based on status code
            if (status >= 500) {
              this.logger.error('Request completed with server error', logMetadata)
            } else if (status >= 400) {
              this.logger.warn('Request completed with client error', logMetadata)
            } else {
              this.logger.info('Request completed successfully', logMetadata)
            }
          },
          error: (error: unknown) => {
            const duration = Date.now() - startTime
            const status = response.statusCode || 500

            const errorMessage = error instanceof Error ? error.message : String(error)
            const errorStack = error instanceof Error ? error.stack : undefined

            const logMetadata = {
              method,
              url: sanitizedUrl,
              status,
              duration,
              requestId,
              ...(userId && { userId }),
              ...(chainId && { chainId }),
              error: errorMessage,
              ...(errorStack && { stack: errorStack }),
            }

            this.logger.error('Request failed', logMetadata)
          },
        }),
      )
    })
  }
}
