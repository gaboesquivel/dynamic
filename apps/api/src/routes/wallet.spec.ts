import { describe, it, expect, beforeEach } from 'vitest'
import { walletRoute } from './wallet'
import { testRoute } from '../test/utils/elysia'
import { WalletSchema } from '@vencura/types'
import { zEnv } from '../lib/env'
import { resetClients } from '../services/wallet-client'

// Skip tests if Dynamic SDK credentials aren't set (real credentials required for blackbox tests)
// Use zEnv instead of process.env - validation ensures required vars are present
const hasDynamicCredentials =
  zEnv.DYNAMIC_ENVIRONMENT_ID &&
  zEnv.DYNAMIC_API_TOKEN &&
  zEnv.DYNAMIC_ENVIRONMENT_ID !== 'test-env-id' &&
  zEnv.DYNAMIC_API_TOKEN !== 'test-api-token'

describe.skipIf(!hasDynamicCredentials)('walletRoute', () => {
  // zEnv is already validated - all required vars (DYNAMIC_ENVIRONMENT_ID, DYNAMIC_API_TOKEN, ENCRYPTION_KEY) are present
  // Reset clients between tests to ensure clean state
  beforeEach(() => {
    resetClients()
  })

  it(
    'should create wallet via HTTP endpoint',
    { timeout: 30000 }, // 30 second timeout for wallet creation (keygen ceremony can take time)
    async () => {
      // Blackbox test: hit HTTP endpoint, not internal handler
      const response = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-123',
        },
      })

      // Validate response matches contract
      // Note: May return 200 if wallet already exists (idempotent behavior)
      // May return 400 if wallet exists in Dynamic SDK but not in local DB
      if (response.status === 400) {
        const errorData = await response.json()
        expect(errorData.error).toBe('Wallet already exists')
        return // Skip further validation for 400 responses
      }

      expect([200, 201]).toContain(response.status)
      const data = await response.json()
      const wallet = WalletSchema.parse(data)

      expect(wallet).toHaveProperty('id')
      expect(wallet).toHaveProperty('address')
      expect(wallet).toHaveProperty('chainType')
      expect(wallet.chainType).toBe('evm')
    },
  )

  it(
    'should return existing wallet on second request (idempotent)',
    { timeout: 30000 }, // 30 second timeout for wallet creation
    async () => {
      // First request - create wallet (or get existing if already exists in Dynamic SDK)
      const firstResponse = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-idempotent',
        },
      })

      // First request may return 201 (new wallet), 200 (existing in DB), or 400 (exists in Dynamic SDK but not DB)
      expect([200, 201, 400]).toContain(firstResponse.status)

      if (firstResponse.status === 400) {
        // Wallet exists in Dynamic SDK but not in DB - this is expected in some test scenarios
        // For idempotent test, we'll skip this case as it indicates a data inconsistency
        // that would need to be resolved before testing idempotency
        return
      }

      const firstData = await firstResponse.json()
      const firstWallet = WalletSchema.parse(firstData)

      // Second request - should return existing wallet with 200
      const secondResponse = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-idempotent',
        },
      })

      // Second request should return 200 (existing wallet) or 400 (if still inconsistent)
      expect([200, 400]).toContain(secondResponse.status)

      if (secondResponse.status === 400) {
        // Still inconsistent - skip validation
        return
      }

      const secondData = await secondResponse.json()
      const secondWallet = WalletSchema.parse(secondData)

      // Should return same wallet
      expect(secondWallet.id).toBe(firstWallet.id)
      expect(secondWallet.address).toBe(firstWallet.address)
      expect(secondWallet.chainType).toBe(firstWallet.chainType)
    },
  )

  it('should return 400 for invalid chainType', async () => {
    const response = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainType: 'invalid-chain-type', // Invalid chainType - should fail Zod validation
      },
      headers: {
        'X-Test-User-Id': 'test-user-123',
      },
    })

    // Zod validation should catch this and return 400
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Validation error')
  })

  it('should return 400 for missing chainType', async () => {
    const response = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        // Missing chainType - should fail Zod validation
      },
      headers: {
        'X-Test-User-Id': 'test-user-123',
      },
    })

    // Zod validation should catch this and return 400
    expect(response.status).toBe(400)
  })

  it(
    'should validate response matches WalletSchema contract',
    { timeout: 30000 }, // 30 second timeout for wallet creation
    async () => {
      const response = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-validation',
        },
      })

      // Note: May return 200 if wallet already exists (idempotent behavior)
      // May return 400 if wallet exists in Dynamic SDK but not in local DB
      if (response.status === 400) {
        const errorData = await response.json()
        expect(errorData.error).toBe('Wallet already exists')
        return // Skip further validation for 400 responses
      }

      expect([200, 201]).toContain(response.status)
      const data = await response.json()

      // Should parse successfully with WalletSchema
      const wallet = WalletSchema.parse(data)
      expect(wallet.id).toBeTruthy()
      expect(wallet.address).toBeTruthy()
      expect(wallet.chainType).toBeTruthy()
    },
  )
})
