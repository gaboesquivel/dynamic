import request from 'supertest'
import { getTestAuthToken } from './auth'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

describe('ChatController (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await getTestAuthToken()
  })

  describe('POST /chat', () => {
    it('should return 401 for unauthorized access', async () =>
      request(TEST_SERVER_URL)
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        })
        .expect(401))

    it('should return 400 for invalid request body', async () =>
      request(TEST_SERVER_URL)
        .post('/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400))

    it('should return 400 for missing messages', async () =>
      request(TEST_SERVER_URL)
        .post('/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          model: 'gpt-4o-mini',
        })
        .expect(400))

    it('should return tools list', async () =>
      request(TEST_SERVER_URL)
        .get('/chat/tools')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('getWallets')
          expect(res.body).toHaveProperty('createWallet')
          expect(res.body).toHaveProperty('getBalance')
          expect(res.body).toHaveProperty('sendTransaction')
          expect(res.body).toHaveProperty('signMessage')
        }))

    it('should return 401 for tools endpoint without auth', async () =>
      request(TEST_SERVER_URL).get('/chat/tools').expect(401))
  })
})
