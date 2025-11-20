import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import isEmpty from 'lodash/isEmpty'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
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
  constructor(private readonly configService: ConfigService) {}

  private async getPublicKey(): Promise<string> {
    const environmentId = this.configService.get<string>('dynamic.environmentId')
    const apiToken = this.configService.get<string>('dynamic.apiToken')

    if (isEmpty(environmentId) || isEmpty(apiToken))
      throw new Error('Dynamic configuration is not set')

    const response = await fetchWithTimeout({
      url: `https://app.dynamicauth.com/api/v0/environments/${environmentId}/keys`,
      options: {
        headers: { Authorization: `Bearer ${apiToken}` },
      },
      timeoutMs: 5000,
    })

    if (!response.ok) throw new Error('Failed to fetch Dynamic public key')

    const jsonData = await response.json()
    const data = dynamicPublicKeyResponseSchema.parse(jsonData)
    return Buffer.from(data.key.publicKey, 'base64').toString('ascii')
  }

  /**
   * Verify API key for testing purposes (test mode only).
   * Returns a consistent test user based on environment ID.
   * No longer stores users in DB - relies on Dynamic SDK for user management.
   */
  async verifyApiKeyForTesting(apiToken: string): Promise<{ id: string; email: string }> {
    const expectedApiToken = this.configService.get<string>('dynamic.apiToken')
    const environmentId = this.configService.get<string>('dynamic.environmentId')

    if (isEmpty(expectedApiToken) || isEmpty(environmentId))
      throw new UnauthorizedException('Dynamic configuration is not set')

    if (apiToken !== expectedApiToken)
      throw new UnauthorizedException('Invalid API token for testing')

    const testUserId = `test-user-${environmentId}`
    // No longer store users in DB - return user info directly
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

      // No longer store users in DB - return user info directly from JWT
      return { id: userId, email }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      if (error instanceof jwt.JsonWebTokenError) throw new UnauthorizedException('Invalid token')
      throw new UnauthorizedException(`Token verification failed: ${getErrorMessage(error)}`)
    }
  }
}
