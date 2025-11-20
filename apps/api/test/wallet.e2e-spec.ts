import request from 'supertest'
import { getTestAuthToken } from './auth'
import { TEST_CHAINS, TEST_ADDRESSES, TEST_MESSAGES } from './fixtures'
import { createTestWallet, getOrCreateTestWallet } from './helpers'
import { walletAPIContract } from '@vencura/types/api-contracts'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

/**
 * E2E tests for WalletController.
 *
 * These tests verify that wallets are created through Dynamic SDK and all
 * operations use real Dynamic SDK APIs with real API keys. NO MOCKS are used.
 *
 * All tests hit real Dynamic SDK endpoints:
 * - Wallet creation uses Dynamic SDK's createWalletAccount()
 * - Message signing uses Dynamic SDK's signMessage()
 * - Balance queries use real blockchain RPCs
 * - Transaction sending tests are in wallet-transactions.e2e-spec.ts (mocked for now)
 */
describe('WalletController (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    // Get real Dynamic auth token (uses real Dynamic API)
    authToken = await getTestAuthToken()
  })

  // CRITICAL: Throttle between tests to prevent Dynamic SDK rate limits
  // Dynamic SDK has rate limits (typically 10-20 requests per minute for wallet operations)
  // This ensures minimum 5 seconds between wallet creation calls across all tests
  beforeEach(async () => {
    // Wait 5 seconds before each test to prevent rate limits
    // This works in conjunction with throttling in createTestWallet helper
    const { delay } = await import('@vencura/lib')
    await delay(5000)
  })

  describe.skip('GET /wallets', () => {
    it('should return empty list when user has no wallets', async () =>
      request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true)
        }))

    it('should return user wallets after creating one', async () => {
      // Create a wallet first
      await createTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Then get wallets
      return request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true)
          expect(res.body.length).toBeGreaterThan(0)
          expect(res.body[0]).toHaveProperty('id')
          expect(res.body[0]).toHaveProperty('address')
          expect(res.body[0]).toHaveProperty('network')
          expect(res.body[0]).toHaveProperty('chainType')
        })
    })
  })

  describe('POST /wallets', () => {
    it.only('should create a wallet on Arbitrum Sepolia using Dynamic SDK (idempotent - accepts existing)', async () => {
      // Make a single POST request to create wallet
      // If wallet already exists, should return 200 with existing wallet (idempotent)
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema
      const WalletSchema =
        response.status === 201
          ? walletAPIContract.create.responses[201]
          : walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
      const wallet = WalletSchema.parse(response.body)

      // Validate wallet structure
      expect(wallet).toHaveProperty('id')
      expect(wallet).toHaveProperty('address')
      expect(wallet).toHaveProperty('network', '421614')
      expect(wallet).toHaveProperty('chainType', 'evm')
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it.skip('should create a wallet on Base Sepolia (idempotent - accepts existing)', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.BASE_SEPOLIA })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema
      const WalletSchema = walletAPIContract.create.responses[201]
      const validatedWallet = WalletSchema.parse(response.body)

      expect(validatedWallet).toHaveProperty('id')
      expect(validatedWallet).toHaveProperty('address')
      expect(validatedWallet).toHaveProperty('network', '84532')
      expect(validatedWallet).toHaveProperty('chainType', 'evm')
    })

    it.skip('should return 400 for unsupported chain ID', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 999999 })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('supported chain')
        }))

    it.skip('should return 400 for invalid chain ID format', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 'invalid-chain-id' })
        .expect(400))

    it.skip('should return 413 for oversized request payload', async () => {
      // Create a payload larger than 10kb
      const largePayload = {
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
        data: 'x'.repeat(11 * 1024),
      }

      return request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Length', String(JSON.stringify(largePayload).length))
        .send(largePayload)
        .expect(413)
        .expect(res => {
          expect(res.body.message).toContain('Payload too large')
        })
    })

    it.skip('should include X-Request-ID header in wallet creation response (idempotent - accepts existing)', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema
      const WalletSchema = walletAPIContract.create.responses[201]
      WalletSchema.parse(response.body)

      expect(response.headers['x-request-id']).toBeDefined()
      expect(typeof response.headers['x-request-id']).toBe('string')
    })

    it.skip('should create a wallet on Solana devnet using Dynamic SDK', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })

      // Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      expect([200, 201]).toContain(response.status)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('address')
      expect(response.body).toHaveProperty('network', 'solana-devnet')
      expect(response.body).toHaveProperty('chainType', 'solana')
      // Verify Solana address format (created via Dynamic SDK)
      // Solana addresses are base58 encoded, typically 32-44 characters
      expect(response.body.address).toBeTruthy()
      expect(typeof response.body.address).toBe('string')
      expect(response.body.address.length).toBeGreaterThan(0)
    })

    it.skip('should return 400 for invalid chain ID', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 99999 })
        .expect(400))

    it.skip('should return 400 for missing chainId', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400))
  })

  describe.skip('GET /wallets/:id/balance', () => {
    it('should return balance for existing wallet created via Dynamic SDK', async () => {
      // Get or create a wallet (via Dynamic SDK)
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Get initial balance and validate with TS-REST schema
      const balanceBeforeResponse = await request(TEST_SERVER_URL)
        .get(`/wallets/${wallet.id}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Validate response using TS-REST contract schema
      const BalanceSchema = walletAPIContract.getBalance.responses[200]
      const balanceBefore = BalanceSchema.parse(balanceBeforeResponse.body)

      // Get balance again (no operation performed, so should be same)
      const balanceAfterResponse = await request(TEST_SERVER_URL)
        .get(`/wallets/${wallet.id}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const balanceAfter = BalanceSchema.parse(balanceAfterResponse.body)

      // Assert balance is a number and hasn't changed unexpectedly (delta-based assertion)
      expect(balanceAfter.balance).toBeGreaterThanOrEqual(0)
      // If no operation was performed, balance should be same
      expect(balanceAfter.balance).toBe(balanceBefore.balance)
      // Balance is queried from blockchain using address created by Dynamic SDK
    })

    it('should return 404 for non-existent wallet', async () => {
      const fakeWalletId = '00000000-0000-0000-0000-000000000000'
      return request(TEST_SERVER_URL)
        .get(`/wallets/${fakeWalletId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should return 401 for unauthorized access to balance endpoint', async () => {
      // Get or create a wallet first
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Attempt to get balance without Authorization header
      return request(TEST_SERVER_URL).get(`/wallets/${wallet.id}/balance`).expect(401)
    })
  })

  describe.skip('POST /wallets/:id/sign', () => {
    it('should sign a message using Dynamic SDK', async () => {
      // Get or create a wallet (via Dynamic SDK)
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Then sign message using Dynamic SDK's signMessage
      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: TEST_MESSAGES.SIMPLE })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('signedMessage')
          expect(typeof res.body.signedMessage).toBe('string')
          expect(res.body.signedMessage.length).toBeGreaterThan(0)
          // Verify signature format (EVM signatures are 0x-prefixed hex strings)
          expect(res.body.signedMessage).toMatch(/^0x[a-fA-F0-9]+$/)
        })
    })

    it('should return 400 for missing message', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })

    it('should return 404 for non-existent wallet', async () => {
      const fakeWalletId = '00000000-0000-0000-0000-000000000000'
      return request(TEST_SERVER_URL)
        .post(`/wallets/${fakeWalletId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: TEST_MESSAGES.SIMPLE })
        .expect(404)
    })

    it('should return 401 for unauthorized access to sign endpoint', async () => {
      // Get or create a wallet
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Attempt to sign without Authorization header
      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/sign`)
        .send({ message: TEST_MESSAGES.SIMPLE })
        .expect(401)
    })
  })

  describe.skip('POST /wallets/:id/send', () => {
    it('should return 400 for invalid address format', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'invalid-address',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for missing to address', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for missing amount', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM,
        })
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })

    it('should return 404 for non-existent wallet', async () => {
      const fakeWalletId = '00000000-0000-0000-0000-000000000000'
      return request(TEST_SERVER_URL)
        .post(`/wallets/${fakeWalletId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM,
          amount: 0.001,
        })
        .expect(404)
    })
  })

  describe.skip('Authentication', () => {
    it('should return 401 for missing authorization header', async () =>
      request(TEST_SERVER_URL).get('/wallets').expect(401))

    it('should return 401 for invalid token', async () =>
      request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401))
  })
})
