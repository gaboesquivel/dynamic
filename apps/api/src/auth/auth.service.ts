import { Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { isEmpty } from 'lodash'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import * as schema from '../database/schema'
import { eq } from 'drizzle-orm'
import { fetchWithTimeout, getErrorMessage } from '@vencura/lib'

// Zod schema for Dynamic API public key response
const dynamicPublicKeyResponseSchema = z.object({
  key: z.object({
    publicKey: z.string(),
  }),
})

// Zod schema for JWT payload structure
const jwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
  iss: z.string().optional(),
  aud: z.string().optional(),
})

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

    if (isEmpty(environmentId) || isEmpty(apiToken))
      throw new Error('Dynamic configuration is not set')

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const response = await fetchWithTimeout({
      url: `https://app.dynamicauth.com/api/v0/environments/${environmentId}/keys`,
      options: {
        headers: { Authorization: `Bearer ${apiToken}` },
      },
      timeoutMs: 5000,
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!response.ok) throw new Error('Failed to fetch Dynamic public key')

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const jsonData = await response.json()
    const data = dynamicPublicKeyResponseSchema.parse(jsonData)
    return Buffer.from(data.key.publicKey, 'base64').toString('ascii')
  }

  /**
   * Verify API key for testing purposes (test mode only).
   * Returns a consistent test user based on environment ID.
   */
  async verifyApiKeyForTesting(apiToken: string): Promise<{ id: string; email: string }> {
    const expectedApiToken = this.configService.get<string>('dynamic.apiToken')
    const environmentId = this.configService.get<string>('dynamic.environmentId')

    if (isEmpty(expectedApiToken) || isEmpty(environmentId))
      throw new UnauthorizedException('Dynamic configuration is not set')

    if (apiToken !== expectedApiToken)
      throw new UnauthorizedException('Invalid API token for testing')

    const testUserId = `test-user-${environmentId}`
    const [existingUser] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    if (!existingUser)
      await this.db.insert(schema.users).values({ id: testUserId, email: 'test@vencura.test' })

    return { id: testUserId, email: 'test@vencura.test' }
  }

  async verifyToken(token: string): Promise<{ id: string; email: string }> {
    try {
      const decodedRaw = jwt.verify(token, await this.getPublicKey(), {
        algorithms: ['RS256'],
      })
      const decoded = jwtPayloadSchema.parse(decodedRaw)

      const userId = decoded.sub
      const email = decoded.email || ''

      const [existingUser] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1)

      if (!existingUser) await this.db.insert(schema.users).values({ id: userId, email })

      return { id: userId, email }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedException('Invalid token')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      throw new UnauthorizedException(`Token verification failed: ${getErrorMessage(error)}`)
    }
  }
}
