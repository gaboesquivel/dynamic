import request from 'supertest'
import { getTestAuthToken } from './auth'
import { TEST_CHAINS } from './fixtures'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

/**
 * Comprehensive security test suite.
 * Tests all security features: headers, request limits, Swagger UI feature flag, CORS, request IDs.
 */
describe('Security Features (e2e)', () => {
  let authToken: string
  const originalEnv = process.env

  beforeAll(async () => {
    authToken = await getTestAuthToken()
  })

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  describe('Security Headers', () => {
    it('should include HSTS header in all responses', async () => {
      const response = await request(TEST_SERVER_URL).get('/').expect(200)

      expect(response.headers['strict-transport-security']).toBeDefined()
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000')
      expect(response.headers['strict-transport-security']).toContain('includeSubDomains')
      expect(response.headers['strict-transport-security']).toContain('preload')
    })

    it('should include X-Frame-Options header set to DENY', async () => {
      const response = await request(TEST_SERVER_URL).get('/').expect(200)

      expect(response.headers['x-frame-options']).toBe('DENY')
    })

    it('should include X-Content-Type-Options header set to nosniff', async () => {
      const response = await request(TEST_SERVER_URL).get('/').expect(200)

      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })

    it('should include Referrer-Policy header', async () => {
      const response = await request(TEST_SERVER_URL).get('/').expect(200)

      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should include security headers in authenticated endpoints', async () => {
      const response = await request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.headers['strict-transport-security']).toBeDefined()
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })
  })

  describe('Request Size Limits', () => {
    it('should reject requests larger than 10kb', async () => {
      const largePayload = {
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
        data: 'x'.repeat(11 * 1024),
      }

      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Length', String(JSON.stringify(largePayload).length))
        .send(largePayload)
        .expect(413)

      expect(response.body.statusCode).toBe(413)
      expect(response.body.message).toContain('Payload too large')
    })

    it('should accept requests smaller than 10kb', async () => {
      const normalPayload = { chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA }

      await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(normalPayload)
        .expect(201)
    })
  })

  describe('Swagger UI Feature Flag', () => {
    it('should return 404 when ENABLE_SWAGGER_UI is not set (default disabled)', async () => {
      delete process.env.ENABLE_SWAGGER_UI
      // Note: App needs to be recreated to pick up env var changes
      // This test verifies default behavior
      const response = await request(TEST_SERVER_URL).get('/api')

      // Swagger should be disabled by default
      expect(response.status).toBe(404)
      expect(response.body.statusCode).toBe(404)
    })
  })

  describe('CORS Configuration', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(TEST_SERVER_URL).options('/wallets').expect(204)

      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined()
    })

    it('should allow preflight OPTIONS requests', async () => {
      await request(TEST_SERVER_URL)
        .options('/wallets')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
        .expect(204)
    })
  })

  describe('Request ID Generation', () => {
    it('should include X-Request-ID header in all responses', async () => {
      const response = await request(TEST_SERVER_URL).get('/').expect(200)

      expect(response.headers['x-request-id']).toBeDefined()
      expect(typeof response.headers['x-request-id']).toBe('string')
      expect(response.headers['x-request-id'].length).toBeGreaterThan(0)
    })

    it('should generate unique request IDs for each request', async () => {
      const response1 = await request(TEST_SERVER_URL).get('/').expect(200)
      const response2 = await request(TEST_SERVER_URL).get('/').expect(200)

      expect(response1.headers['x-request-id']).not.toBe(response2.headers['x-request-id'])
    })

    it('should include request ID in error responses', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 999999 })
        .expect(400)

      expect(response.headers['x-request-id']).toBeDefined()
    })

    it('should include request ID in authenticated endpoints', async () => {
      const response = await request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.headers['x-request-id']).toBeDefined()
    })
  })
})
