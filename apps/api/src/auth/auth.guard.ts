import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import isString from 'lodash/isString'
import type { Request } from 'express'
import { AuthService } from './auth.service'

interface User {
  id: string
  email: string
}

interface AuthenticatedRequest extends Request {
  user: User
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const authHeader = request.headers.authorization

    if (!isString(authHeader) || !authHeader.startsWith('Bearer '))
      throw new UnauthorizedException('Missing or invalid authorization header')

    const token = authHeader.substring(7)

    // Test mode bypass: use API key instead of JWT
    if (process.env.NODE_ENV === 'test') {
      const apiToken = this.configService.get<string>('dynamic.apiToken')
      if (token === apiToken) {
        ;(request as AuthenticatedRequest).user =
          await this.authService.verifyApiKeyForTesting(token)
        return true
      }
    }

    // Normal JWT verification for production/staging
    ;(request as AuthenticatedRequest).user = await this.authService.verifyToken(token)
    return true
  }
}
