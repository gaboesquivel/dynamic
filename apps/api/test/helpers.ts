import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { getTestAuthToken } from './auth'
import type { App } from 'supertest/types'
import { delay } from '@vencura/lib'

export interface TestWallet {
  id: string
  address: string
  network: string
  chainType: string
}

export async function createTestWallet({
  app,
  authToken,
  chainId,
}: {
  app: INestApplication<App>
  authToken: string
  chainId: number | string
}): Promise<TestWallet> {
  const response = await request(app.getHttpServer())
    .post('/wallets')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ chainId })
    .expect(201)

  return response.body as TestWallet
}

export async function getTestAuthTokenHelper(): Promise<string> {
  return getTestAuthToken()
}

export async function waitForTransaction({
  delayMs = 1000,
}: {
  delayMs?: number
}): Promise<boolean> {
  await delay(delayMs)
  return true
}
