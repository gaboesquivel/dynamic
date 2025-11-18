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
    it('should create wallet on Arbitrum Sepolia', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', '421614')
          expect(res.body).toHaveProperty('chainType', 'evm')
          expect(res.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
        }))

    it('should create wallet on Base Sepolia', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.BASE_SEPOLIA })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', '84532')
          expect(res.body).toHaveProperty('chainType', 'evm')
          expect(res.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
        }))

    it('should create wallet on Ethereum Sepolia', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ETHEREUM_SEPOLIA })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', '11155111')
          expect(res.body).toHaveProperty('chainType', 'evm')
          expect(res.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
        }))

    it('should create wallet on Optimism Sepolia', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.OPTIMISM_SEPOLIA })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', '11155420')
          expect(res.body).toHaveProperty('chainType', 'evm')
          expect(res.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
        }))

    it('should create wallet on Polygon Amoy', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.POLYGON_AMOY })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', '80002')
          expect(res.body).toHaveProperty('chainType', 'evm')
          expect(res.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
        }))
  })

  describe('Solana Chain Wallet Creation', () => {
    it('should create wallet on Solana Mainnet', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.MAINNET })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', 'solana-mainnet')
          expect(res.body).toHaveProperty('chainType', 'solana')
          expect(res.body.address).toBeTruthy()
          expect(typeof res.body.address).toBe('string')
        }))

    it('should create wallet on Solana Devnet', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', 'solana-devnet')
          expect(res.body).toHaveProperty('chainType', 'solana')
          expect(res.body.address).toBeTruthy()
        }))

    it('should create wallet on Solana Testnet', async () =>
      request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.TESTNET })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('network', 'solana-testnet')
          expect(res.body).toHaveProperty('chainType', 'solana')
          expect(res.body.address).toBeTruthy()
        }))
  })

  describe('Chain-Specific Balance Queries', () => {
    it('should get balance for EVM wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })
        .expect(201)

      const walletId = createResponse.body.id

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

    it('should get balance for Solana wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })
        .expect(201)

      const walletId = createResponse.body.id

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
        .expect(201)

      const walletId = createResponse.body.id

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

    it('should sign message with Solana wallet', async () => {
      const createResponse = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })
        .expect(201)

      const walletId = createResponse.body.id

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
      // Create wallets on different chains
      const arbitrumWallet = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })
        .expect(201)

      const baseWallet = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.BASE_SEPOLIA })
        .expect(201)

      const solanaWallet = await request(TEST_SERVER_URL)
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })
        .expect(201)

      // Verify all wallets are returned
      const walletsResponse = await request(TEST_SERVER_URL)
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(walletsResponse.body.length).toBeGreaterThanOrEqual(3)

      const walletIds = walletsResponse.body.map((w: { id: string }) => w.id)
      expect(walletIds).toContain(arbitrumWallet.body.id)
      expect(walletIds).toContain(baseWallet.body.id)
      expect(walletIds).toContain(solanaWallet.body.id)
    })
  })
})
