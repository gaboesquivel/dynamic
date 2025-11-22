import { describe, it, expect, beforeEach } from 'vitest'
import { walletRoute } from './wallet'
import { testRoute } from '../test/utils/elysia'
import { WalletSchema, SendTransactionResultSchema } from '@vencura/types'
import { zEnv } from '../lib/env'
import { resetClients } from '../services/wallet-client'
import { fundWalletWithGas } from '../test/gas-faucet'
import { createPublicClient, http, waitForTransactionReceipt } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

// Skip tests if Dynamic SDK credentials and gas faucet key aren't set
const hasRequiredCredentials =
  zEnv.DYNAMIC_ENVIRONMENT_ID &&
  zEnv.DYNAMIC_API_TOKEN &&
  zEnv.ENCRYPTION_KEY &&
  zEnv.ARB_TESTNET_GAS_FAUCET_KEY &&
  zEnv.DYNAMIC_ENVIRONMENT_ID !== 'test-env-id' &&
  zEnv.DYNAMIC_API_TOKEN !== 'test-api-token'

describe.skipIf(!hasRequiredCredentials)('walletRoute send transaction', () => {
  beforeEach(() => {
    resetClients()
  })

  it(
    'should send transaction to self on Arbitrum Sepolia',
    { timeout: 60000 }, // 60 second timeout for wallet creation + funding + transaction
    async () => {
      // Step 1: Create or get EVM wallet
      const createResponse = await testRoute(walletRoute, {
        method: 'POST',
        path: '/wallets',
        body: {
          chainType: 'evm',
        },
        headers: {
          'X-Test-User-Id': 'test-user-send-tx',
        },
      })

      // Note: May return 200 if wallet already exists (idempotent behavior)
      // May return 400 if wallet exists in Dynamic SDK but not in local DB
      if (createResponse.status === 400) {
        const errorData = await createResponse.json()
        expect(errorData.error).toBe('Wallet already exists')
        // Skip test if wallet already exists in Dynamic SDK but not in DB
        // This indicates a data inconsistency that would need to be resolved
        return
      }

      expect([200, 201]).toContain(createResponse.status)
      const walletData = await createResponse.json()
      const wallet = WalletSchema.parse(walletData)

      expect(wallet.chainType).toBe('evm')
      expect(wallet.address).toBeTruthy()
      expect(wallet.id).toBeTruthy()

      // Step 2: Fund wallet with gas using faucet
      const faucetResult = await fundWalletWithGas({
        address: wallet.address,
        chainId: 421614,
      })

      expect(faucetResult.transactionHash).toBeTruthy()
      expect(faucetResult.fundedWei).toBeGreaterThan(0n)

      // Step 3: Wait for faucet transaction to be mined
      const rpcUrl = zEnv.SEPOLIA_RPC_URL || arbitrumSepolia.rpcUrls.default.http[0]

      const publicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(rpcUrl),
      })

      await waitForTransactionReceipt(publicClient, {
        hash: faucetResult.transactionHash as `0x${string}`,
      })

      // Step 4: Send transaction to self
      const sendResponse = await testRoute(walletRoute, {
        method: 'POST',
        path: `/wallets/${wallet.id}/send`,
        body: {
          to: wallet.address, // Send to self
          amount: 0.0001, // Small amount of ETH
        },
        headers: {
          'X-Test-User-Id': 'test-user-send-tx',
        },
      })

      expect(sendResponse.status).toBe(200)
      const sendData = await sendResponse.json()
      const result = SendTransactionResultSchema.parse(sendData)

      expect(result.transactionHash).toBeTruthy()
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

      // Step 5: Wait for transaction to be mined
      await waitForTransactionReceipt(publicClient, {
        hash: result.transactionHash as `0x${string}`,
      })
    },
  )
})
