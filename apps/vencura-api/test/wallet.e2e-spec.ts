import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { getTestAuthToken } from './utils/dynamic-auth'
import { TEST_CHAINS, TEST_ADDRESSES, TEST_MESSAGES } from './utils/fixtures'
import { createTestWallet } from './utils/test-helpers'

describe('WalletController (e2e)', () => {
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

    // Get real Dynamic auth token
    authToken = await getTestAuthToken()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /wallets', () => {
    it('should return empty list when user has no wallets', async () => {
      return request(app.getHttpServer())
        .get('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true)
        })
    })

    it('should return user wallets after creating one', async () => {
      // Create a wallet first
      await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Then get wallets
      return request(app.getHttpServer())
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
    it('should create a wallet on Arbitrum Sepolia', async () => {
      return request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id')
          expect(res.body).toHaveProperty('address')
          expect(res.body).toHaveProperty('network', '421614')
          expect(res.body).toHaveProperty('chainType', 'evm')
          expect(res.body.address).toMatch(/^0x[a-fA-F0-9]{40}$/)
        })
    })

    it('should create a wallet on Base Sepolia', async () => {
      return request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.EVM.BASE_SEPOLIA })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id')
          expect(res.body).toHaveProperty('address')
          expect(res.body).toHaveProperty('network', '84532')
          expect(res.body).toHaveProperty('chainType', 'evm')
        })
    })

    it('should create a wallet on Solana devnet', async () => {
      return request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: TEST_CHAINS.SOLANA.DEVNET })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id')
          expect(res.body).toHaveProperty('address')
          expect(res.body).toHaveProperty('network', 'solana-devnet')
          expect(res.body).toHaveProperty('chainType', 'solana')
        })
    })

    it('should return 400 for invalid chain ID', async () => {
      return request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ chainId: 99999 })
        .expect(400)
    })

    it('should return 400 for missing chainId', async () => {
      return request(app.getHttpServer())
        .post('/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })
  })

  describe('GET /wallets/:id/balance', () => {
    it('should return balance for existing wallet', async () => {
      // Create a wallet first
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Then get balance
      return request(app.getHttpServer())
        .get(`/wallets/${wallet.id}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('balance')
          expect(typeof res.body.balance).toBe('number')
          expect(res.body.balance).toBeGreaterThanOrEqual(0)
        })
    })

    it('should return 404 for non-existent wallet', async () => {
      const fakeWalletId = '00000000-0000-0000-0000-000000000000'
      return request(app.getHttpServer())
        .get(`/wallets/${fakeWalletId}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should return 401 for unauthorized access to balance endpoint', async () => {
      // Create a wallet first
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Attempt to get balance without Authorization header
      return request(app.getHttpServer())
        .get(`/wallets/${wallet.id}/balance`)
        .expect(401)
    })
  })

  describe('POST /wallets/:id/sign', () => {
    it('should sign a message', async () => {
      // Create a wallet first
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Then sign message
      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: TEST_MESSAGES.SIMPLE })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('signedMessage')
          expect(typeof res.body.signedMessage).toBe('string')
          expect(res.body.signedMessage.length).toBeGreaterThan(0)
        })
    })

    it('should return 400 for missing message', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })

    it('should return 404 for non-existent wallet', async () => {
      const fakeWalletId = '00000000-0000-0000-0000-000000000000'
      return request(app.getHttpServer())
        .post(`/wallets/${fakeWalletId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: TEST_MESSAGES.SIMPLE })
        .expect(404)
    })

    it('should return 401 for unauthorized access to sign endpoint', async () => {
      // Create a wallet first
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Attempt to sign without Authorization header
      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/sign`)
        .send({ message: TEST_MESSAGES.SIMPLE })
        .expect(401)
    })
  })

  describe('POST /wallets/:id/send', () => {
    it('should return 400 for invalid address format', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'invalid-address',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for missing to address', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(app.getHttpServer())
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for missing amount', async () => {
      const wallet = await createTestWallet({
        app,
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      const response = await request(app.getHttpServer())
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
      return request(app.getHttpServer())
        .post(`/wallets/${fakeWalletId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM,
          amount: 0.001,
        })
        .expect(404)
    })
  })

  describe('Authentication', () => {
    it('should return 401 for missing authorization header', async () => {
      return request(app.getHttpServer()).get('/wallets').expect(401)
    })

    it('should return 401 for invalid token', async () => {
      return request(app.getHttpServer())
        .get('/wallets')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })
  })
})
