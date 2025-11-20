import request from 'supertest'
import { getTestAuthToken } from './auth'
import { TEST_CHAINS } from './fixtures'
import { delay } from '@vencura/lib'
import { walletAPIContract } from '@vencura/types/api-contracts'
import { getInitialBalance, assertBalanceDelta } from './helpers'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

describe.skip('WalletController Multichain (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await getTestAuthToken()
  })

  // CRITICAL: Throttle between tests to prevent Dynamic SDK rate limits
  // Dynamic SDK has rate limits (typically 10-20 requests per minute for wallet operations)
  // This ensures minimum 5 seconds between wallet creation calls across all tests
  beforeEach(async () => {
    // Wait 5 seconds before each test to prevent rate limits
    // This works in conjunction with throttling in createTestWallet helper
    await delay(5000)
  })

  describe('EVM Chain Wallet Creation', () => {
    it('should create wallet on Arbitrum Sepolia (idempotent - accepts existing)', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      // Rate limit (429) is NOT valid - tests should throttle to prevent it
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema (use correct schema based on status)
      const WalletSchema =
        response.status === 201
          ? walletAPIContract.create.responses[201]
          : walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
      const validatedWallet = WalletSchema.parse(response.body)

      // CRITICAL: Throttle after wallet creation to prevent Dynamic SDK rate limits
      await delay(500)

      expect(validatedWallet).toHaveProperty('network', '421614')
      expect(validatedWallet).toHaveProperty('chainType', 'evm')
      expect(validatedWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should create wallet on Base Sepolia (idempotent - accepts existing)', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.BASE_SEPOLIA })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      // Rate limit (429) is NOT valid - tests should throttle to prevent it
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema (use correct schema based on status)
      const WalletSchema =
        response.status === 201
          ? walletAPIContract.create.responses[201]
          : walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
      const validatedWallet = WalletSchema.parse(response.body)

      // CRITICAL: Throttle after wallet creation to prevent Dynamic SDK rate limits
      await delay(500)

      expect(validatedWallet).toHaveProperty('network', '84532')
      expect(validatedWallet).toHaveProperty('chainType', 'evm')
      expect(validatedWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should create wallet on Ethereum Sepolia (idempotent - accepts existing)', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ETHEREUM_SEPOLIA })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      // Rate limit (429) is NOT valid - tests should throttle to prevent it
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema (use correct schema based on status)
      const WalletSchema =
        response.status === 201
          ? walletAPIContract.create.responses[201]
          : walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
      const validatedWallet = WalletSchema.parse(response.body)

      // CRITICAL: Throttle after wallet creation to prevent Dynamic SDK rate limits
      await delay(500)

      expect(validatedWallet).toHaveProperty('network', '11155111')
      expect(validatedWallet).toHaveProperty('chainType', 'evm')
      expect(validatedWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should create wallet on Optimism Sepolia (idempotent - accepts existing)', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.OPTIMISM_SEPOLIA })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      // Rate limit (429) is NOT valid - tests should throttle to prevent it
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema (use correct schema based on status)
      const WalletSchema =
        response.status === 201
          ? walletAPIContract.create.responses[201]
          : walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
      const validatedWallet = WalletSchema.parse(response.body)

      // CRITICAL: Throttle after wallet creation to prevent Dynamic SDK rate limits
      await delay(500)

      expect(validatedWallet).toHaveProperty('network', '11155420')
      expect(validatedWallet).toHaveProperty('chainType', 'evm')
      expect(validatedWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })

    it('should create wallet on Polygon Amoy (idempotent - accepts existing)', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.POLYGON_AMOY })

      // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      // Rate limit (429) is NOT valid - tests should throttle to prevent it
      expect([200, 201]).toContain(response.status)

      // Validate response using TS-REST contract schema (use correct schema based on status)
      const WalletSchema =
        response.status === 201
          ? walletAPIContract.create.responses[201]
          : walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
      const validatedWallet = WalletSchema.parse(response.body)

      // CRITICAL: Throttle after wallet creation to prevent Dynamic SDK rate limits
      await delay(500)

      expect(validatedWallet).toHaveProperty('network', '80002')
      expect(validatedWallet).toHaveProperty('chainType', 'evm')
      expect(validatedWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe.skip('Solana Chain Wallet Creation', () => {
    it('should create wallet on Solana Mainnet', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.MAINNET })

      // Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      expect([200, 201]).toContain(response.status)
      expect(response.body).toHaveProperty('network', 'solana-mainnet')
      expect(response.body).toHaveProperty('chainType', 'solana')
      expect(response.body.address).toBeTruthy()
      expect(typeof response.body.address).toBe('string')
    })

    it('should create wallet on Solana Devnet', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })

      // Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      expect([200, 201]).toContain(response.status)
      expect(response.body).toHaveProperty('network', 'solana-devnet')
      expect(response.body).toHaveProperty('chainType', 'solana')
      expect(response.body.address).toBeTruthy()
    })

    it('should create wallet on Solana Testnet', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.TESTNET })

      // Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
      expect([200, 201]).toContain(response.status)
      expect(response.body).toHaveProperty('network', 'solana-testnet')
      expect(response.body).toHaveProperty('chainType', 'solana')
      expect(response.body.address).toBeTruthy()
    })
  })

  describe('Chain-Specific Balance Queries', () => {
    it('should get balance for EVM wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // Handle both 200 (existing) and 201 (created) responses (idempotent creation)
      let walletId: string
      if (createResponse.status === 200 || createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // Fallback: get existing wallets and find the one for this chain
        const walletsResponse = await request(TEST_SERVER_URL)
          .get('/wallets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
        const existingWallet = walletsResponse.body.find(
          (w: { network: string }) => w.network === '421614',
        )
        if (!existingWallet) {
          throw new Error('Expected wallet not found')
        }
        walletId = existingWallet.id
      }

      // Use delta-based balance assertion (never assert absolute values)
      const initialBalance = await getInitialBalance({
        baseUrl: TEST_SERVER_URL,
        authToken,
        walletId,
      })

      // Assert that the balance is a number and hasn't changed unexpectedly
      await assertBalanceDelta({
        baseUrl: TEST_SERVER_URL,
        authToken,
        walletId,
        expectedDelta: 0, // No operation performed, so expected delta is 0
        initialBalance,
      })
    })

    it.skip('should get balance for Solana wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })

      // Handle both 200 (existing) and 201 (created) responses (idempotent creation)
      let walletId: string
      if (createResponse.status === 200 || createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // Fallback: get existing wallets and find the one for this chain
        const walletsResponse = await request(TEST_SERVER_URL)
          .get('/wallets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
        const existingWallet = walletsResponse.body.find(
          (w: { network: string }) => w.network === 'solana-devnet',
        )
        if (!existingWallet) {
          throw new Error('Expected wallet not found')
        }
        walletId = existingWallet.id
      }

      // Use delta-based balance assertion (never assert absolute values)
      const initialBalance = await getInitialBalance({
        baseUrl: TEST_SERVER_URL,
        authToken,
        walletId,
      })

      // Assert that the balance is a number and hasn't changed unexpectedly
      await assertBalanceDelta({
        baseUrl: TEST_SERVER_URL,
        authToken,
        walletId,
        expectedDelta: 0, // No operation performed, so expected delta is 0
        initialBalance,
      })
    })
  })

  describe('Chain-Specific Message Signing', () => {
    it('should sign message with EVM wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // Handle both 200 (existing) and 201 (created) responses (idempotent creation)
      let walletId: string
      if (createResponse.status === 200 || createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // Fallback: get existing wallets and find the one for this chain
        const walletsResponse = await request(TEST_SERVER_URL)
          .get('/wallets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
        const existingWallet = walletsResponse.body.find(
          (w: { network: string }) => w.network === '421614',
        )
        if (!existingWallet) {
          throw new Error('Expected wallet not found')
        }
        walletId = existingWallet.id
      }

      return request(TEST_SERVER_URL)
        .post(`/wallets/${walletId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Test message for EVM' })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('signedMessage')
          expect(typeof res.body.signedMessage).toBe('string')
          expect(res.body.signedMessage.length).toBeGreaterThan(0)
        })
    })

    it.skip('should sign message with Solana wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })

      // Handle both 200 (existing) and 201 (created) responses (idempotent creation)
      let walletId: string
      if (createResponse.status === 200 || createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // Fallback: get existing wallets and find the one for this chain
        const walletsResponse = await request(TEST_SERVER_URL)
          .get('/wallets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
        const existingWallet = walletsResponse.body.find(
          (w: { network: string }) => w.network === 'solana-devnet',
        )
        if (!existingWallet) {
          throw new Error('Expected wallet not found')
        }
        walletId = existingWallet.id
      }

      return request(TEST_SERVER_URL)
        .post(`/wallets/${walletId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Test message for Solana' })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('signedMessage')
          expect(typeof res.body.signedMessage).toBe('string')
          expect(res.body.signedMessage.length).toBeGreaterThan(0)
        })
    })
  })

  describe('Multiple Wallets Per User', () => {
    it('should allow creating multiple wallets on different chains', async () => {
      // Create wallets on different chains (may return 201 or 400 if already exists)
      const arbitrumResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // CRITICAL: Throttle between wallet creation calls to prevent Dynamic SDK rate limits
      await delay(500)

      const baseResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.BASE_SEPOLIA })

      // Solana tests disabled - only supporting EVM for now
      // const solanaResponse = await request(TEST_SERVER_URL)
      //   .post('/wallets')
      //   .set('Authorization', `Bearer ${authToken}`)
      //   .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })

      // Get wallet IDs from responses or from existing wallets
      const walletsResponse = await request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(walletsResponse.body.length).toBeGreaterThanOrEqual(2)

      const walletIds = walletsResponse.body.map((w: { id: string }) => w.id)
      const walletNetworks = walletsResponse.body.map((w: { network: string }) => w.network)

      // Verify wallets exist for both EVM chains (Solana disabled)
      expect(walletNetworks).toContain('421614') // Arbitrum Sepolia
      expect(walletNetworks).toContain('84532') // Base Sepolia
      // expect(walletNetworks).toContain('solana-devnet') // Solana Devnet - disabled

      // If wallets were just created or already existed, verify their IDs are in the list
      if (arbitrumResponse.status === 200 || arbitrumResponse.status === 201) {
        expect(walletIds).toContain(arbitrumResponse.body.id)
      }
      if (baseResponse.status === 200 || baseResponse.status === 201) {
        expect(walletIds).toContain(baseResponse.body.id)
      }
      // if (solanaResponse.status === 201) {
      //   expect(walletIds).toContain(solanaResponse.body.id)
      // }
    })
  })
})
