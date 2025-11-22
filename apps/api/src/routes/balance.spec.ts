import { describe, it, expect, beforeEach } from 'vitest'
import { balanceRoute } from './balance'
import { walletRoute } from './wallet'
import { testRoute } from '../test/utils/elysia'
import { BalanceSchema } from '@vencura/types'
import { zEnv } from '../lib/env'
import { resetClients } from '../services/wallet-client'

// Skip tests if Dynamic SDK credentials aren't set (real credentials required for blackbox tests)
// Use zEnv instead of process.env - validation ensures required vars are present
const hasDynamicCredentials =
  zEnv.DYNAMIC_ENVIRONMENT_ID &&
  zEnv.DYNAMIC_API_TOKEN &&
  zEnv.DYNAMIC_ENVIRONMENT_ID !== 'test-env-id' &&
  zEnv.DYNAMIC_API_TOKEN !== 'test-api-token'

describe.skipIf(!hasDynamicCredentials)('balanceRoute', () => {
  // zEnv is already validated - all required vars (DYNAMIC_ENVIRONMENT_ID, DYNAMIC_API_TOKEN, ENCRYPTION_KEY) are present
  // Reset clients between tests to ensure clean state
  beforeEach(() => {
    resetClients()
  })

  it(
    'should get native token balance via HTTP endpoint',
    { timeout: 30000 }, // 30 second timeout for balance queries
    async () => {
      // First, create a wallet for the test user
      const createWalletResponse = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-balance-native',
        },
      })

      // Wallet creation may return 200, 201, or 400 (if wallet already exists)
      if (createWalletResponse.status === 400) {
        // Wallet exists in Dynamic SDK but not in DB - skip this test
        return
      }

      expect([200, 201]).toContain(createWalletResponse.status)

      // Now get balance for the wallet
      const balanceResponse = await testRoute(balanceRoute, {
        method: 'POST',
        path: '/wallets/balance',
        body: {
          chainId: 421614, // Arbitrum Sepolia
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-balance-native',
        },
      })

      expect(balanceResponse.status).toBe(200)
      const data = await balanceResponse.json()
      const balance = BalanceSchema.parse(data)

      expect(balance).toHaveProperty('balance')
      expect(balance).toHaveProperty('chainId')
      expect(balance).toHaveProperty('chainType')
      expect(balance.chainId).toBe(421614)
      expect(balance.chainType).toBe('evm')
      expect(typeof balance.balance).toBe('string')
      // Balance should be a non-negative number string
      expect(Number.parseFloat(balance.balance)).toBeGreaterThanOrEqual(0)
    },
  )

  it(
    'should get ERC20 token balance via HTTP endpoint',
    { timeout: 30000 }, // 30 second timeout for balance queries
    async () => {
      // First, create a wallet for the test user
      const createWalletResponse = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-balance-token',
        },
      })

      // Wallet creation may return 200, 201, or 400 (if wallet already exists)
      if (createWalletResponse.status === 400) {
        // Wallet exists in Dynamic SDK but not in DB - skip this test
        return
      }

      expect([200, 201]).toContain(createWalletResponse.status)

      // Get USDC token balance (testnet token on Arbitrum Sepolia)
      const balanceResponse = await testRoute(balanceRoute, {
        method: 'POST',
        path: '/wallets/balance',
        body: {
          chainId: 421614, // Arbitrum Sepolia
          chainType: 'evm',
          tokenAddress: '0x6a2fE04d877439a44938D38709698d524BCF5c40', // USDC testnet token
        },
        headers: {
          'X-Test-User-Id': 'test-user-balance-token',
        },
      })

      expect(balanceResponse.status).toBe(200)
      const data = await balanceResponse.json()
      const balance = BalanceSchema.parse(data)

      expect(balance).toHaveProperty('balance')
      expect(balance).toHaveProperty('chainId')
      expect(balance).toHaveProperty('chainType')
      expect(balance).toHaveProperty('token')
      expect(balance.chainId).toBe(421614)
      expect(balance.chainType).toBe('evm')
      expect(balance.token).toBeDefined()
      expect(balance.token?.address.toLowerCase()).toBe(
        '0x6a2fE04d877439a44938D38709698d524BCF5c40'.toLowerCase(),
      )
      expect(balance.token?.symbol).toBe('USDC')
      expect(balance.token?.name).toBe('USD Coin')
      expect(balance.token?.decimals).toBe(6)
      expect(typeof balance.balance).toBe('string')
      expect(Number.parseFloat(balance.balance)).toBeGreaterThanOrEqual(0)
    },
  )

  it(
    'should cache token metadata after first request',
    { timeout: 30000 }, // 30 second timeout for balance queries
    async () => {
      // First, create a wallet for the test user
      const createWalletResponse = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-balance-cache',
        },
      })

      // Wallet creation may return 200, 201, or 400 (if wallet already exists)
      if (createWalletResponse.status === 400) {
        // Wallet exists in Dynamic SDK but not in DB - skip this test
        return
      }

      expect([200, 201]).toContain(createWalletResponse.status)

      // First request - should fetch token metadata from chain
      const firstResponse = await testRoute(balanceRoute, {
        method: 'POST',
        path: '/wallets/balance',
        body: {
          chainId: 421614,
          chainType: 'evm',
          tokenAddress: '0x5f036f0B6948d4593364f975b81caBB3206aD994', // USDT testnet token
        },
        headers: {
          'X-Test-User-Id': 'test-user-balance-cache',
        },
      })

      expect(firstResponse.status).toBe(200)
      const firstData = await firstResponse.json()
      const firstBalance = BalanceSchema.parse(firstData)

      // Second request - should use cached token metadata
      const secondResponse = await testRoute(balanceRoute, {
        method: 'POST',
        path: '/wallets/balance',
        body: {
          chainId: 421614,
          chainType: 'evm',
          tokenAddress: '0x5f036f0B6948d4593364f975b81caBB3206aD994', // Same token
        },
        headers: {
          'X-Test-User-Id': 'test-user-balance-cache',
        },
      })

      expect(secondResponse.status).toBe(200)
      const secondData = await secondResponse.json()
      const secondBalance = BalanceSchema.parse(secondData)

      // Token metadata should be identical (cached)
      expect(secondBalance.token?.address.toLowerCase()).toBe(
        firstBalance.token?.address.toLowerCase(),
      )
      expect(secondBalance.token?.symbol).toBe(firstBalance.token?.symbol)
      expect(secondBalance.token?.name).toBe(firstBalance.token?.name)
      expect(secondBalance.token?.decimals).toBe(firstBalance.token?.decimals)
    },
  )

  it('should return 400 for invalid chainType', async () => {
    const response = await testRoute(balanceRoute, {
      method: 'POST',
      path: '/wallets/balance',
      body: {
        chainId: 421614,
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
    const response = await testRoute(balanceRoute, {
      method: 'POST',
      path: '/wallets/balance',
      body: {
        chainId: 421614,
        // Missing chainType - should fail Zod validation
      },
      headers: {
        'X-Test-User-Id': 'test-user-123',
      },
    })

    // Zod validation should catch this and return 400
    expect(response.status).toBe(400)
  })

  it('should return 400 for missing chainId', async () => {
    const response = await testRoute(balanceRoute, {
      method: 'POST',
      path: '/wallets/balance',
      body: {
        chainType: 'evm',
        // Missing chainId - should fail Zod validation
      },
      headers: {
        'X-Test-User-Id': 'test-user-123',
      },
    })

    // Zod validation should catch this and return 400
    expect(response.status).toBe(400)
  })

  it('should return 404 for wallet not found', async () => {
    const response = await testRoute(balanceRoute, {
      method: 'POST',
      path: '/wallets/balance',
      body: {
        chainId: 421614,
        chainType: 'evm',
      },
      headers: {
        'X-Test-User-Id': 'test-user-no-wallet', // User with no wallet
      },
    })

    // Should return 404 for wallet not found
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Wallet not found')
  })

  it('should validate response matches BalanceSchema contract', async () => {
    // First, create a wallet for the test user
    const createWalletResponse = await testRoute(walletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainType: 'evm',
      },
      headers: {
        'X-Test-User-Id': 'test-user-balance-validation',
      },
    })

    // Wallet creation may return 200, 201, or 400 (if wallet already exists)
    if (createWalletResponse.status === 400) {
      // Wallet exists in Dynamic SDK but not in DB - skip this test
      return
    }

    expect([200, 201]).toContain(createWalletResponse.status)

    const response = await testRoute(balanceRoute, {
      method: 'POST',
      path: '/wallets/balance',
      body: {
        chainId: 421614,
        chainType: 'evm',
      },
      headers: {
        'X-Test-User-Id': 'test-user-balance-validation',
      },
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    // Should parse successfully with BalanceSchema
    const balance = BalanceSchema.parse(data)
    expect(balance.balance).toBeTruthy()
    expect(balance.chainId).toBeTruthy()
    expect(balance.chainType).toBeTruthy()
  })
})
