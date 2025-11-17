import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

interface User {
  id: string
  email: string
}

interface AuthenticatedRequest extends Request {
  user: User
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()
  return request.user
})
