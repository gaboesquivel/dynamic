import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

interface RequestWithId extends Request {
  requestId?: string
}

/**
 * Request ID middleware that generates a unique ID for each request.
 * Adds X-Request-ID header to all responses for tracing and debugging.
 * Required to be a class for NestJS middleware decorators.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const requestId = randomUUID()
    req.requestId = requestId
    res.setHeader('X-Request-ID', requestId)
    next()
  }
}
