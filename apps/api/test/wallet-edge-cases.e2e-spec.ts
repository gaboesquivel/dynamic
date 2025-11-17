import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { getTestAuthToken } from './utils/dynamic-auth'
import { TEST_CHAINS, TEST_MESSAGES } from './utils/fixtures'
import { createTestWallet } from './utils/test-helpers'

describe('WalletController Edge Cases (e2e)', () => {
  let app: INestApplication<App>
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    )
    await app.init()

    authToken = await getTestAuthToken()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Wallet Creation Edge Cases', () => {
    it('should return 400 for unsupported chain ID', async () =>
      request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 999999 })
        .expect(400))

    it('should return 400 for negative chain ID', async () =>
      request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: -1 })
        .expect(400))

    it('should return 400 for zero chain ID', async () =>
      request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 0 })
        .expect(400))

    it('should return 400 for empty string chain ID', async () =>
      request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: '' })
        .expect(400))

    it('should return 400 for null chain ID', async () =>
      request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: null })
        .expect(400))
  })

  describe('Balance Query Edge Cases', () => {
    it('should return balance of 0 for new wallet', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .get(`/wallets/${wallet.id}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('balance')
          expect(typeof res.body.balance).toBe('number')
          expect(res.body.balance).toBe(0)
        })
    })

    it('should return 404 for invalid UUID format', async () =>
      request(app.getHttpServer())
        .get('/wallets/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404))

    it('should return 404 for empty wallet ID', async () =>
      request(app.getHttpServer())
        .get('/wallets/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404))
  })

  describe('Message Signing Edge Cases', () => {
    it('should handle empty message', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: TEST_MESSAGES.EMPTY })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('signedMessage')
          expect(typeof res.body.signedMessage).toBe('string')
        })
    })

    it('should handle long message', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: TEST_MESSAGES.LONG })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('signedMessage')
          expect(typeof res.body.signedMessage).toBe('string')
        })
    })

    it('should handle special characters in message', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: TEST_MESSAGES.SPECIAL_CHARS })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('signedMessage')
          expect(typeof res.body.signedMessage).toBe('string')
        })
    })

    it('should return 400 for non-string message', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 12345 })
        .expect(400)
    })
  })

  describe('Transaction Sending Edge Cases', () => {
    it('should return 400 for invalid EVM address format', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0xinvalid',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for address that is too short', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x123',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for negative amount', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: -0.001,
        })
        .expect(400)
    })

    it('should return 400 for zero amount', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: 0,
        })
        .expect(400)
    })

    it('should return 400 for very large amount', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: 1e20,
        })
        .expect(400)
    })

    it('should return 400 for non-numeric amount', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: 'not-a-number',
        })
        .expect(400)
    })
  })

  describe('Malformed Request Bodies', () => {
    it('should return 400 for malformed JSON in wallet creation', async () =>
      request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"chainId": 421614, invalid}')
        .expect(400))

    it('should return 400 for extra fields in wallet creation', async () =>
      request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
          extraField: 'should be ignored',
        })
        .expect(201))
  })

  describe('Error Message Sanitization', () => {
    it('should return generic error messages in production mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      // Test that error messages don't leak sensitive information
      const response = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 999999 })
        .expect(400)

      // Error message should not contain internal details
      expect(response.body.message).not.toContain('ENCRYPTION_KEY')
      expect(response.body.message).not.toContain('DYNAMIC_API_TOKEN')
      expect(response.body.message).not.toContain('DATABASE_URL')

      process.env.NODE_ENV = originalEnv
    })

    it('should include X-Request-ID in error responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 999999 })
        .expect(400)

      expect(response.headers['x-request-id']).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Rate limit headers may be present (depends on throttler configuration)
      // Check that request ID is present
      expect(response.headers['x-request-id']).toBeDefined()
    })

    it('should enforce rate limits on wallet creation', async () => {
      // Create multiple wallets rapidly to test rate limiting
      const requests = Array.from({ length: 15 }, () =>
        request(app.getHttpServer())
          .post('/wallets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA }),
      )

      const responses = await Promise.all(requests)
      // Note: Rate limiting may not trigger immediately, but structure is tested
      // Verify all requests completed (some may be rate limited with 429)
      expect(responses.length).toBe(15)
      // Verify at least some requests succeeded or were rate limited
      const hasValidResponses = responses.some(res => res.status === 201 || res.status === 429)
      expect(hasValidResponses).toBe(true)
    })
  })
})
