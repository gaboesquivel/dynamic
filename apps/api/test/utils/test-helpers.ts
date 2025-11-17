import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { getTestAuthToken } from './dynamic-auth'
import type { App } from 'supertest/types'

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
  app: INestApplication<App>
  authToken: string
  walletId: string
  transactionHash: string
  maxAttempts?: number
  delayMs?: number
}): Promise<boolean> {
  // For now, just wait a bit - in a real implementation, you'd check transaction status
  // This is a placeholder for transaction confirmation polling
  await new Promise(resolve => setTimeout(resolve, delayMs))
  return true
}
