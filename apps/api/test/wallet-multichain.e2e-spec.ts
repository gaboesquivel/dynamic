import request from 'supertest'
import { getTestAuthToken } from './auth'
import { TEST_CHAINS } from './fixtures'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

describe('WalletController Multichain (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await getTestAuthToken()
  })

  describe('EVM Chain Wallet Creation', () => {
    it('should create wallet on Arbitrum Sepolia', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', '421614')
        expect(response.body).toHaveProperty('chainType', 'evm')
        expect(response.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })

    it('should create wallet on Base Sepolia', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.BASE_SEPOLIA })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', '84532')
        expect(response.body).toHaveProperty('chainType', 'evm')
        expect(response.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })

    it('should create wallet on Ethereum Sepolia', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ETHEREUM_SEPOLIA })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', '11155111')
        expect(response.body).toHaveProperty('chainType', 'evm')
        expect(response.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })

    it('should create wallet on Optimism Sepolia', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.OPTIMISM_SEPOLIA })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', '11155420')
        expect(response.body).toHaveProperty('chainType', 'evm')
        expect(response.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })

    it('should create wallet on Polygon Amoy', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.POLYGON_AMOY })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', '80002')
        expect(response.body).toHaveProperty('chainType', 'evm')
        expect(response.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })
  })

  describe.skip('Solana Chain Wallet Creation', () => {
    it('should create wallet on Solana Mainnet', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.MAINNET })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', 'solana-mainnet')
        expect(response.body).toHaveProperty('chainType', 'solana')
        expect(response.body.address).toBeTruthy()
        expect(typeof response.body.address).toBe('string')
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })

    it('should create wallet on Solana Devnet', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', 'solana-devnet')
        expect(response.body).toHaveProperty('chainType', 'solana')
        expect(response.body.address).toBeTruthy()
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })

    it('should create wallet on Solana Testnet', async () => {
      const response = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.TESTNET })

      // Accept both 201 (created) and 400 (already exists) as valid responses
      expect([201, 400]).toContain(response.status)
      if (response.status === 201) {
        expect(response.body).toHaveProperty('network', 'solana-testnet')
        expect(response.body).toHaveProperty('chainType', 'solana')
        expect(response.body.address).toBeTruthy()
      } else {
        expect(response.body.message).toContain('Wallet already exists')
      }
    })
  })

  describe('Chain-Specific Balance Queries', () => {
    it('should get balance for EVM wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // Handle both 201 (created) and 400 (already exists) responses
      let walletId: string
      if (createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // If wallet already exists, get existing wallets and find the one for this chain
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
        .get(`/wallets/${walletId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('balance')
          expect(typeof res.body.balance).toBe('number')
          expect(res.body.balance).toBeGreaterThanOrEqual(0)
        })
    })

    it.skip('should get balance for Solana wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })

      // Handle both 201 (created) and 400 (already exists) responses
      let walletId: string
      if (createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // If wallet already exists, get existing wallets and find the one for this chain
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
        .get(`/wallets/${walletId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('balance')
          expect(typeof res.body.balance).toBe('number')
          expect(res.body.balance).toBeGreaterThanOrEqual(0)
        })
    })
  })

  describe('Chain-Specific Message Signing', () => {
    it('should sign message with EVM wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })

      // Handle both 201 (created) and 400 (already exists) responses
      let walletId: string
      if (createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // If wallet already exists, get existing wallets and find the one for this chain
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

      // Handle both 201 (created) and 400 (already exists) responses
      let walletId: string
      if (createResponse.status === 201) {
        walletId = createResponse.body.id
      } else {
        // If wallet already exists, get existing wallets and find the one for this chain
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

      // If wallets were just created, verify their IDs are in the list
      if (arbitrumResponse.status === 201) {
        expect(walletIds).toContain(arbitrumResponse.body.id)
      }
      if (baseResponse.status === 201) {
        expect(walletIds).toContain(baseResponse.body.id)
      }
      // if (solanaResponse.status === 201) {
      //   expect(walletIds).toContain(solanaResponse.body.id)
      // }
    })
  })
})
