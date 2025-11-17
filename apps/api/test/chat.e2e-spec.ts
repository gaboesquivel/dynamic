import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { getTestAuthToken } from './utils/dynamic-auth'

describe('ChatController (e2e)', () => {
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

  describe('POST /chat', () => {
    it('should return 401 for unauthorized access', async () =>
      request(app.getHttpServer())
        .post('/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        })
        .expect(401))

    it('should return 400 for invalid request body', async () =>
      request(app.getHttpServer())
        .post('/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400))

    it('should return 400 for missing messages', async () =>
      request(app.getHttpServer())
        .post('/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          model: 'gpt-4o-mini',
        })
        .expect(400))

    it('should return tools list', async () =>
      request(app.getHttpServer())
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
      request(app.getHttpServer()).get('/chat/tools').expect(401))
  })
})
