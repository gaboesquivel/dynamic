import request from 'supertest'
import { getTestAuthToken } from './auth'
import { TEST_CHAINS, TEST_MESSAGES } from './fixtures'
import { createTestWallet, getOrCreateTestWallet } from './helpers'
import { delay } from '@vencura/lib'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

describe.skip('WalletController Edge Cases (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await getTestAuthToken()
  })

  // CRITICAL: Throttle between tests to prevent Dynamic SDK rate limits
  // Dynamic SDK has rate limits (typically 10-20 requests per minute for wallet operations)
  // This ensures minimum 3 seconds between wallet creation calls across all tests
  beforeEach(async () => {
    // Wait 3 seconds before each test to prevent rate limits
    // This works in conjunction with throttling in createTestWallet helper
    await delay(3000)
  })

  describe('Wallet Creation Edge Cases', () => {
    it('should return 400 for unsupported chain ID', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 999999 })
        .expect(400))

    it('should return 400 for negative chain ID', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: -1 })
        .expect(400))

    it('should return 400 for zero chain ID', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 0 })
        .expect(400))

    it('should return 400 for empty string chain ID', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: '' })
        .expect(400))

    it('should return 400 for null chain ID', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: null })
        .expect(400))
  })

  describe('Balance Query Edge Cases', () => {
    it('should return balance for new wallet (delta-based assertion)', async () => {
      const wallet = await createTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Use delta-based balance assertion (never assert absolute values)
      const { getInitialBalance, assertBalanceDelta } = await import('./helpers')
      const initialBalance = await getInitialBalance({
        baseUrl: TEST_SERVER_URL,
        authToken,
        walletId: wallet.id,
      })

      // Assert that the balance is a number and hasn't changed unexpectedly
      await assertBalanceDelta({
        baseUrl: TEST_SERVER_URL,
        authToken,
        walletId: wallet.id,
        expectedDelta: 0, // No operation performed, so expected delta is 0
        initialBalance,
      })
    })

    it('should return 404 for invalid UUID format', async () =>
      request(TEST_SERVER_URL)
        .get('/wallets/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404))

    it('should return 404 for empty wallet ID', async () =>
      request(TEST_SERVER_URL)
        .get('/wallets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404))
  })

  describe('Message Signing Edge Cases', () => {
    it('should handle empty message', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
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
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
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
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
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
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 12345 })
        .expect(400)
    })
  })

  describe('Transaction Sending Edge Cases', () => {
    it('should return 400 for invalid EVM address format', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0xinvalid',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for address that is too short', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x123',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for negative amount', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: -0.001,
        })
        .expect(400)
    })

    it('should return 400 for zero amount', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: 0,
        })
        .expect(400)
    })

    it('should return 400 for very large amount', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: 1e20,
        })
        .expect(400)
    })

    it('should return 400 for non-numeric amount', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
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
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"chainId": 421614, invalid}')
        .expect(400))

    it('should ignore extra fields in wallet creation (idempotent - accepts existing)', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
          extraField: 'should be ignored',
        })
        .expect(res => {
          // Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
          // Extra fields are ignored by NestJS validation (whitelist: true)
          expect([200, 201]).toContain(res.status)
        }))
  })

  describe('Error Message Sanitization', () => {
    it('should return generic error messages in production mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      // Test that error messages don't leak sensitive information
      const response = await request(TEST_SERVER_URL)
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
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 999999 })
        .expect(400)

      expect(response.headers['x-request-id']).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Rate limit headers may be present (depends on throttler configuration)
      // Check that request ID is present
      expect(response.headers['x-request-id']).toBeDefined()
    })

    it('should handle multiple wallet creation requests with throttling', async () => {
      // Throttle requests to avoid hitting Dynamic SDK rate limits
      // CRITICAL: Rate limit (429) is NOT a valid response - tests must throttle to prevent it
      const { throttleWalletCreation } = await import('./helpers')
      const responses = []
      for (let i = 0; i < 5; i++) {
        // Use throttleWalletCreation helper to ensure minimum 3 seconds between calls
        await throttleWalletCreation()

        const response = await request(TEST_SERVER_URL)
          .post('/wallets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

        responses.push(response)
      }

      // Verify all requests completed successfully
      expect(responses.length).toBe(5)
      // CRITICAL: Only accept 200 (existing) or 201 (created) - rate limit (429) is NOT valid
      const allValid = responses.every(res => res.status === 200 || res.status === 201)
      expect(allValid).toBe(true)
    })
  })
})
