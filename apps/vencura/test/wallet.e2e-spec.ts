import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('WalletController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    // Mock auth token - in real tests, you'd get this from Dynamic
    authToken = 'mock-dynamic-token';
  });

  afterAll(async () => {
    await app.close();
  });

  it('/wallets (POST) should create a wallet', () => {
    return request(app.getHttpServer())
      .post('/wallets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ network: 'arbitrum-sepolia' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('address');
        expect(res.body).toHaveProperty('network');
      });
  });

  it('/wallets/:id/balance (GET) should return balance', async () => {
    // First create a wallet
    const createResponse = await request(app.getHttpServer())
      .post('/wallets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ network: 'arbitrum-sepolia' })
      .expect(201);

    const walletId = createResponse.body.id;

    // Then get balance
    return request(app.getHttpServer())
      .get(`/wallets/${walletId}/balance`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('balance');
        expect(typeof res.body.balance).toBe('number');
      });
  });

  it('/wallets/:id/sign (POST) should sign a message', async () => {
    // First create a wallet
    const createResponse = await request(app.getHttpServer())
      .post('/wallets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ network: 'arbitrum-sepolia' })
      .expect(201);

    const walletId = createResponse.body.id;

    // Then sign message
    return request(app.getHttpServer())
      .post(`/wallets/${walletId}/sign`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: 'Hello, World!' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('signedMessage');
        expect(typeof res.body.signedMessage).toBe('string');
      });
  });

  it('/wallets/:id/send (POST) should send a transaction', async () => {
    // First create a wallet
    const createResponse = await request(app.getHttpServer())
      .post('/wallets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ network: 'arbitrum-sepolia' })
      .expect(201);

    const walletId = createResponse.body.id;

    // Then send transaction
    return request(app.getHttpServer())
      .post(`/wallets/${walletId}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        amount: 0.001,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('transactionHash');
        expect(typeof res.body.transactionHash).toBe('string');
      });
  });
});
