import { Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import * as schema from '../database/schema'
import { eq } from 'drizzle-orm'

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @Inject('DATABASE')
    private readonly db: ReturnType<typeof import('drizzle-orm/pglite').drizzle>,
  ) {}

  private async getPublicKey(): Promise<string> {
    const environmentId = this.configService.get<string>('dynamic.environmentId')
    const apiToken = this.configService.get<string>('dynamic.apiToken')

    if (!environmentId || !apiToken) {
      throw new Error('Dynamic configuration is not set')
    }

    const response = await fetch(
      `https://app.dynamicauth.com/api/v0/environments/${environmentId}/keys`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Dynamic public key')
    }

    type DynamicKeyResponse = {
      key: {
        publicKey: string
      }
    }

    const data = (await response.json()) as DynamicKeyResponse
    const publicKey = Buffer.from(data.key.publicKey, 'base64').toString('ascii')
    return publicKey
  }

  async verifyToken(token: string) {
    try {
      const publicKey = await this.getPublicKey()

      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload

      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException('Invalid token')
      }

      const userId = decoded.sub
      const email = (decoded.email as string) || ''

      // Ensure user exists in database
      const [existingUser] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1)

      if (!existingUser) {
        await this.db.insert(schema.users).values({
          id: userId,
          email,
        })
      }

      return {
        id: userId,
        email,
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token')
      }
      throw new UnauthorizedException('Token verification failed')
    }
  }
}
