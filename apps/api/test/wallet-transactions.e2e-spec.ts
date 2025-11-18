import request from 'supertest'
import { getTestAuthToken } from './auth'
import { TEST_CHAINS, TEST_ADDRESSES, TEST_TOKEN_ADDRESSES, TEST_TOKEN_DECIMALS } from './fixtures'
import { getOrCreateTestWallet, mintTestTokenViaFaucet, waitForTransaction } from './helpers'
import { parseUnits } from 'viem'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

/**
 * Transaction sending tests for EVM and Solana wallets.
 * Tests use real transactions on testnets.
 *
 * Test accounts are created via Dynamic API. Token minting uses the transaction
 * endpoint to call the mint function on TestToken contracts (which allow anyone to mint).
 */
describe('WalletController Transactions (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await getTestAuthToken()
  })

  describe('EVM Transaction Sending', () => {
    it('should send real transaction on Arbitrum Sepolia', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Wallet is automatically funded with minimum ETH required via ARB_TESTNET_GAS_FAUCET_KEY
      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM,
          amount: 0.0001, // Small amount to minimize gas costs
        })

      // Test expects success - wallet must be manually funded
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transactionHash')
      expect(typeof response.body.transactionHash).toBe('string')
      // EVM transaction hashes start with 0x and are 66 characters
      expect(response.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should send real transaction on Base Sepolia', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.BASE_SEPOLIA,
      })

      // Wallet is automatically funded with minimum ETH required via ARB_TESTNET_GAS_FAUCET_KEY
      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM,
          amount: 0.0001, // Small amount to minimize gas costs
        })

      // Test expects success - wallet is automatically funded
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transactionHash')
      expect(response.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should return 400 for invalid EVM address format', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'invalid-address',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return error for insufficient balance', async () => {
      // Create a fresh wallet (not reused) to test insufficient balance
      // Note: This wallet will still be auto-funded, but we send a very large amount
      const { createTestWallet } = await import('./helpers.js')
      const wallet = await createTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM,
          amount: 1000000, // Large amount that should fail
        })

      // Should fail with 400 or 500 due to insufficient balance
      expect([400, 500]).toContain(response.status)
    })

    it('should mint ERC20 tokens to test wallet via faucet', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Mint small amount of test tokens (10 tokens) using token faucet
      // The mint function is open, so any wallet can call it
      const mintAmount = parseUnits('10', TEST_TOKEN_DECIMALS.DNMC)
      const mintResult = await mintTestTokenViaFaucet({
        authToken,
        tokenAddress: TEST_TOKEN_ADDRESSES.DNMC as `0x${string}`,
        recipientAddress: wallet.address as `0x${string}`,
        amount: mintAmount,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      if (!mintResult.success) {
        throw new Error(`Failed to mint tokens: ${mintResult.error}`)
      }

      await waitForTransaction({ delayMs: 2000 })

      expect(mintResult.txHash).toBeDefined()
      expect(mintResult.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })
  })

  describe('Solana Transaction Sending', () => {
    it('should send real transaction on Solana Devnet', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.SOLANA.DEVNET,
      })

      // Wallet must be manually funded with SOL - test will fail if insufficient balance
      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.SOLANA,
          amount: 0.001,
        })

      // Test expects success - wallet must be manually funded
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transactionHash')
      expect(typeof response.body.transactionHash).toBe('string')
      // Solana transaction signatures are base58 encoded, typically 88 characters
      expect(response.body.transactionHash.length).toBeGreaterThanOrEqual(64)
    })

    it('should return 400 for invalid Solana address format', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.SOLANA.DEVNET,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'invalid-solana-address',
          amount: 0.001,
        })
        .expect(400)
    })

    it('should return 400 for EVM address when using Solana wallet', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.SOLANA.DEVNET,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM, // EVM address on Solana wallet
          amount: 0.001,
        })
        .expect(400)
    })
  })

  describe('Cross-Chain Address Validation', () => {
    it('should return 400 for Solana address when using EVM wallet', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.SOLANA, // Solana address on EVM wallet
          amount: 0.001,
        })
        .expect(400)
    })
  })

  describe('Transaction Hash Validation', () => {
    it('should return valid EVM transaction hash format when transaction succeeds', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Wallet is automatically funded with minimum ETH required via ARB_TESTNET_GAS_FAUCET_KEY
      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.EVM,
          amount: 0.0001,
        })

      // Test expects success - wallet is automatically funded
      expect(response.status).toBe(200)
      const txHash = response.body.transactionHash
      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(txHash.length).toBe(66) // 0x + 64 hex chars
    })

    it('should return valid Solana transaction signature format when transaction succeeds', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.SOLANA.DEVNET,
      })

      // Note: Solana wallets are not auto-funded yet (only EVM wallets on Arbitrum Sepolia)
      // Wallet must be manually funded with SOL - test will fail if insufficient balance
      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_ADDRESSES.SOLANA,
          amount: 0.001,
        })

      // Test expects success - wallet must be manually funded
      expect(response.status).toBe(200)
      const txHash = response.body.transactionHash
      expect(typeof txHash).toBe('string')
      expect(txHash.length).toBeGreaterThanOrEqual(64)
    })
  })
})
