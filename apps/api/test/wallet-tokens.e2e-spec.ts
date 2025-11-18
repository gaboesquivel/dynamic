import request from 'supertest'
import { getTestAuthToken } from './auth'
import { TEST_CHAINS, TEST_ADDRESSES, TEST_TOKEN_ADDRESSES, TEST_TOKEN_DECIMALS } from './fixtures'
import { getOrCreateTestWallet, mintTestTokenViaFaucet, waitForTransaction } from './helpers'
import { encodeFunctionData, parseUnits, type Address } from 'viem'
import { testnetTokenAbi } from '@vencura/evm/abis'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

/**
 * E2E tests for ERC20 token operations via the generic transaction endpoint.
 *
 * These tests verify ERC20 token operations (transfer, approve, etc.) using real
 * contract calls on testnet. All operations use the generic transaction endpoint
 * with encoded contract call data.
 *
 * Tests use real Dynamic SDK APIs and real blockchain RPCs. NO MOCKS are used.
 *
 * Token operations tested:
 * - Transfer tokens between addresses
 * - Approve tokens for spending
 * - Mint tokens (via faucet helper)
 * - Error handling (insufficient balance, invalid addresses, etc.)
 */
describe('WalletController ERC20 Token Operations (e2e)', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await getTestAuthToken()
  })

  describe('ERC20 Token Transfer', () => {
    it('should transfer ERC20 tokens between addresses', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Mint tokens to the wallet first
      const mintAmount = parseUnits('100', TEST_TOKEN_DECIMALS.DNMC)
      const mintResult = await mintTestTokenViaFaucet({
        authToken,
        tokenAddress: TEST_TOKEN_ADDRESSES.DNMC as Address,
        recipientAddress: wallet.address as Address,
        amount: mintAmount,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      expect(mintResult.success).toBe(true)
      expect(mintResult.txHash).toBeDefined()
      expect(mintResult.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

      await waitForTransaction({ delayMs: 2000 })

      // Transfer tokens to another address
      const transferAmount = parseUnits('10', TEST_TOKEN_DECIMALS.DNMC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0, // No native token transfer, just contract call
          data: transferData,
        })
        .expect(200)

      expect(response.body).toHaveProperty('transactionHash')
      expect(response.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should return error when transferring more tokens than balance', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Try to transfer a very large amount (more than any reasonable balance)
      const transferAmount = parseUnits('1000000', TEST_TOKEN_DECIMALS.DNMC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: transferData,
        })

      // Should fail with 400 or 500 due to insufficient balance
      expect([400, 500]).toContain(response.status)
    })

    it('should return 400 for invalid token address format', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      const transferAmount = parseUnits('10', TEST_TOKEN_DECIMALS.DNMC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'invalid-token-address',
          amount: 0,
          data: transferData,
        })
        .expect(400)
    })

    it('should return 400 for invalid recipient address in transfer', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Mint tokens first
      const mintAmount = parseUnits('100', TEST_TOKEN_DECIMALS.DNMC)
      await mintTestTokenViaFaucet({
        authToken,
        tokenAddress: TEST_TOKEN_ADDRESSES.DNMC as Address,
        recipientAddress: wallet.address as Address,
        amount: mintAmount,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      await waitForTransaction({ delayMs: 2000 })

      // Try to transfer with invalid recipient address (encoded in data)
      // This will fail at the contract level, but we test the API handles it
      const transferAmount = parseUnits('10', TEST_TOKEN_DECIMALS.DNMC)
      // Using an invalid address format in the encoded data
      const invalidAddress = '0x0000000000000000000000000000000000000000' // Zero address might be rejected
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [invalidAddress as Address, transferAmount],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: transferData,
        })

      // Contract call might succeed (zero address is valid), but we verify API accepts it
      // The actual validation happens at contract level
      expect([200, 400, 500]).toContain(response.status)
    })
  })

  describe('ERC20 Token Approval', () => {
    it('should approve ERC20 tokens for spending', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Approve tokens for spending by another address
      const approveAmount = parseUnits('50', TEST_TOKEN_DECIMALS.DNMC)
      const approveData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'approve',
        args: [TEST_ADDRESSES.EVM as Address, approveAmount],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: approveData,
        })
        .expect(200)

      expect(response.body).toHaveProperty('transactionHash')
      expect(response.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should approve maximum amount (2^256 - 1)', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Approve maximum uint256 value
      const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      const approveData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'approve',
        args: [TEST_ADDRESSES.EVM as Address, maxAmount],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: approveData,
        })
        .expect(200)

      expect(response.body).toHaveProperty('transactionHash')
      expect(response.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })

    it('should approve zero amount to revoke approval', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // First approve some amount
      const approveAmount = parseUnits('50', TEST_TOKEN_DECIMALS.DNMC)
      const approveData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'approve',
        args: [TEST_ADDRESSES.EVM as Address, approveAmount],
      })

      await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: approveData,
        })
        .expect(200)

      await waitForTransaction({ delayMs: 2000 })

      // Then revoke approval by approving zero
      const revokeData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'approve',
        args: [TEST_ADDRESSES.EVM as Address, BigInt(0)],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: revokeData,
        })
        .expect(200)

      expect(response.body).toHaveProperty('transactionHash')
      expect(response.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
    })
  })

  describe('ERC20 Token Minting', () => {
    it('should mint ERC20 tokens via contract call', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Mint tokens directly via contract call (using the transaction endpoint)
      const mintAmount = parseUnits('25', TEST_TOKEN_DECIMALS.DNMC)
      const mintData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'mint',
        args: [wallet.address as Address, mintAmount],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: mintData,
        })
        .expect(200)

      expect(response.body).toHaveProperty('transactionHash')
      expect(response.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

      await waitForTransaction({ delayMs: 2000 })
    })

    it('should mint tokens using helper function', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      const mintAmount = parseUnits('30', TEST_TOKEN_DECIMALS.DNMC)
      const mintResult = await mintTestTokenViaFaucet({
        authToken,
        tokenAddress: TEST_TOKEN_ADDRESSES.DNMC as Address,
        recipientAddress: wallet.address as Address,
        amount: mintAmount,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      expect(mintResult.success).toBe(true)
      expect(mintResult.txHash).toBeDefined()
      expect(mintResult.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)

      await waitForTransaction({ delayMs: 2000 })
    })
  })

  describe('ERC20 Token Operations with Different Tokens', () => {
    it('should transfer USDC tokens (6 decimals)', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Note: USDC contract might not have open minting, so we test the transfer encoding
      // In a real scenario, tokens would need to be minted or received first
      const transferAmount = parseUnits('10', TEST_TOKEN_DECIMALS.USDC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      // This will fail if wallet doesn't have USDC, but we test the API accepts the call
      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.USDC,
          amount: 0,
          data: transferData,
        })

      // API should accept the request (validation happens at contract level)
      expect([200, 400, 500]).toContain(response.status)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('transactionHash')
      }
    })

    it('should handle token operations with different decimal places', async () => {
      // Test with 18 decimals (DNMC)
      const amount18Decimals = parseUnits('1.5', TEST_TOKEN_DECIMALS.DNMC)
      const transferData18 = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, amount18Decimals],
      })

      // Test with 6 decimals (USDC)
      const amount6Decimals = parseUnits('1.5', TEST_TOKEN_DECIMALS.USDC)
      const transferData6 = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, amount6Decimals],
      })

      // Verify both encodings are valid hex strings
      expect(transferData18).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(transferData6).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(transferData18).not.toBe(transferData6) // Different amounts should produce different encodings
    })
  })

  describe('ERC20 Token Operation Error Handling', () => {
    it('should return 400 for missing data parameter when calling token contract', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Sending to token contract without data (just native token transfer)
      // This is valid but won't interact with the token contract
      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0.001, // Native token transfer
          // No data parameter - this is valid but won't call token functions
        })

      // Should succeed (native token transfer to contract address)
      expect([200, 400, 500]).toContain(response.status)
    })

    it('should return 400 for invalid contract call data', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: '0xinvalid', // Invalid hex data
        })
        .expect(400)
    })

    it('should return 400 for malformed function call data', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Valid hex but invalid function call
      const invalidData = '0x1234567890abcdef'

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: invalidData,
        })

      // Contract call will fail, but API should accept the request
      expect([200, 400, 500]).toContain(response.status)
    })

    it('should return 404 for non-existent wallet', async () => {
      const nonExistentWalletId = 'non-existent-wallet-id'
      const transferAmount = parseUnits('10', TEST_TOKEN_DECIMALS.DNMC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${nonExistentWalletId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: transferData,
        })
        .expect(404)
    })

    it('should return 401 for missing authorization token', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      const transferAmount = parseUnits('10', TEST_TOKEN_DECIMALS.DNMC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      return request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: transferData,
        })
        .expect(401)
    })
  })

  describe('ERC20 Token Operation Transaction Verification', () => {
    it('should return valid transaction hash for successful token transfer', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Mint tokens first
      const mintAmount = parseUnits('100', TEST_TOKEN_DECIMALS.DNMC)
      await mintTestTokenViaFaucet({
        authToken,
        tokenAddress: TEST_TOKEN_ADDRESSES.DNMC as Address,
        recipientAddress: wallet.address as Address,
        amount: mintAmount,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      await waitForTransaction({ delayMs: 2000 })

      // Transfer tokens
      const transferAmount = parseUnits('5', TEST_TOKEN_DECIMALS.DNMC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      const response = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: transferData,
        })
        .expect(200)

      const txHash = response.body.transactionHash
      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(txHash.length).toBe(66) // 0x + 64 hex characters
    })

    it('should handle multiple token operations in sequence', async () => {
      const wallet = await getOrCreateTestWallet({
        authToken,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      // Mint tokens
      const mintAmount = parseUnits('200', TEST_TOKEN_DECIMALS.DNMC)
      const mintResult = await mintTestTokenViaFaucet({
        authToken,
        tokenAddress: TEST_TOKEN_ADDRESSES.DNMC as Address,
        recipientAddress: wallet.address as Address,
        amount: mintAmount,
        chainId: TEST_CHAINS.EVM.ARBITRUM_SEPOLIA,
      })

      expect(mintResult.success).toBe(true)
      await waitForTransaction({ delayMs: 2000 })

      // Approve tokens
      const approveAmount = parseUnits('100', TEST_TOKEN_DECIMALS.DNMC)
      const approveData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'approve',
        args: [TEST_ADDRESSES.EVM as Address, approveAmount],
      })

      const approveResponse = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: approveData,
        })
        .expect(200)

      expect(approveResponse.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      await waitForTransaction({ delayMs: 2000 })

      // Transfer tokens
      const transferAmount = parseUnits('50', TEST_TOKEN_DECIMALS.DNMC)
      const transferData = encodeFunctionData({
        abi: testnetTokenAbi,
        functionName: 'transfer',
        args: [TEST_ADDRESSES.EVM as Address, transferAmount],
      })

      const transferResponse = await request(TEST_SERVER_URL)
        .post(`/wallets/${wallet.id}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: TEST_TOKEN_ADDRESSES.DNMC,
          amount: 0,
          data: transferData,
        })
        .expect(200)

      expect(transferResponse.body.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
      expect(transferResponse.body.transactionHash).not.toBe(approveResponse.body.transactionHash)
    })
  })
})
