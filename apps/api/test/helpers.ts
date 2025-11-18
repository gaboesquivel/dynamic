import request from 'supertest'
import { getTestAuthToken } from './auth'
import { delay } from '@vencura/lib'
import type { Address } from 'viem'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

export interface TestWallet {
  id: string
  address: string
  network: string
  chainType: string
}

/**
 * Create a new test wallet (always creates, never reuses).
 * Use this when you specifically need a fresh wallet (e.g., testing wallet creation).
 *
 * For most tests, use `getOrCreateTestWallet()` instead, which reuses existing wallets.
 *
 * Note: Wallets are automatically funded with minimum ETH required for transactions.
 */
export async function createTestWallet({
  baseUrl = TEST_SERVER_URL,
  authToken,
  chainId,
}: {
  baseUrl?: string
  authToken: string
  chainId: number | string
}): Promise<TestWallet> {
  const response = await request(baseUrl)
    .post('/wallets')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ chainId })
    .expect(201)

  return response.body as TestWallet
}

/**
 * Fund a wallet with minimum ETH required for transactions on Arbitrum Sepolia.
 * Uses ARB_TESTNET_GAS_FAUCET_KEY to send only the minimum amount needed.
 *
 * @param address - Wallet address to fund
 * @param rpcUrl - RPC URL for Arbitrum Sepolia (defaults to env or public RPC)
 * @returns Success status and transaction hash if successful
 */
export async function fundWalletWithGas({
  address,
  rpcUrl,
}: {
  address: `0x${string}`
  rpcUrl?: string
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const faucetPrivateKey = process.env.ARB_TESTNET_GAS_FAUCET_KEY
    if (!faucetPrivateKey) {
      return {
        success: false,
        error: 'ARB_TESTNET_GAS_FAUCET_KEY environment variable is required',
      }
    }

    const effectiveRpcUrl =
      rpcUrl || process.env.RPC_URL_421614 || 'https://sepolia-rollup.arbitrum.io/rpc'

    const account = privateKeyToAccount(faucetPrivateKey as `0x${string}`)

    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(effectiveRpcUrl),
    })

    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(effectiveRpcUrl),
    })

    // Estimate gas for a simple token transfer transaction (~65,000 gas for ERC20)
    // Use a standard transfer as a baseline
    const gasEstimate = 65_000n // Base estimate for ERC20 transfer

    // Get current gas price from the network
    const gasPrice = await publicClient.getGasPrice()

    // Calculate minimum ETH: (gasLimit * gasPrice) * 1.2 (20% buffer)
    const gasCost = gasEstimate * gasPrice
    const amountWithBuffer = (gasCost * 120n) / 100n

    const hash = await walletClient.sendTransaction({
      account,
      to: address,
      value: amountWithBuffer,
    })

    return { success: true, txHash: hash }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Failed to fund wallet: ${errorMessage}`,
    }
  }
}

/**
 * Get or create a test wallet, reusing existing wallets when available.
 * Automatically funds wallets with minimum ETH required for transactions.
 *
 * Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614).
 *
 * @param baseUrl - Base URL for test server (defaults to TEST_SERVER_URL env var or http://localhost:3077)
 * @param authToken - Dynamic auth token (API key in test mode)
 * @param chainId - Chain ID or Dynamic network ID (defaults to 421614 for Arbitrum Sepolia)
 * @returns Existing wallet if found, otherwise creates a new one
 */
export async function getOrCreateTestWallet({
  baseUrl = TEST_SERVER_URL,
  authToken,
  chainId = 421614, // Default to Arbitrum Sepolia
}: {
  baseUrl?: string
  authToken: string
  chainId?: number | string
}): Promise<TestWallet> {
  const wallets = (
    await request(baseUrl).get('/wallets').set('Authorization', `Bearer ${authToken}`).expect(200)
  ).body as TestWallet[]

  const existingWallet = wallets.find(w => w.network === String(chainId))

  if (existingWallet) {
    // Only auto-fund Arbitrum Sepolia wallets (chain ID 421614)
    if (existingWallet.chainType === 'evm' && String(chainId) === '421614') {
      await fundWalletWithGas({
        address: existingWallet.address as `0x${string}`,
      })
    }
    return existingWallet
  }

  const wallet = await createTestWallet({ baseUrl, authToken, chainId })

  // Only auto-fund Arbitrum Sepolia wallets (chain ID 421614)
  if (wallet.chainType === 'evm' && String(chainId) === '421614') {
    await fundWalletWithGas({
      address: wallet.address as `0x${string}`,
    })
  }

  return wallet
}

/**
 * Mint test tokens using the API transaction endpoint.
 * The TestToken contract has an open mint function, so any wallet can call it.
 * Uses a test wallet created via Dynamic API to call the mint function.
 *
 * Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614).
 */
export async function mintTestTokenViaFaucet({
  baseUrl = TEST_SERVER_URL,
  authToken,
  tokenAddress,
  recipientAddress,
  amount,
  chainId = 421614, // Default to Arbitrum Sepolia
}: {
  baseUrl?: string
  authToken: string
  tokenAddress: Address
  recipientAddress: Address
  amount: bigint
  chainId?: number
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Get or create a test wallet via Dynamic API to use for minting
    // The mint function is open, so any wallet can call it
    const minterWallet = await getOrCreateTestWallet({
      baseUrl,
      authToken,
      chainId,
    })

    // Encode the mint function call using @vencura/evm/node utilities
    const { encodeFunctionData } = await import('viem')
    // Import testnetTokenAbi - it's exported from @vencura/evm/abis
    const { testnetTokenAbi } = await import('@vencura/evm/abis/asset/TestnetToken')
    const mintData = encodeFunctionData({
      abi: testnetTokenAbi,
      functionName: 'mint',
      args: [recipientAddress, amount],
    })

    // Send transaction to call mint function on the token contract
    const response = await request(baseUrl)
      .post(`/wallets/${minterWallet.id}/send`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        to: tokenAddress,
        amount: 0, // No native token transfer, just contract call
        data: mintData,
      })

    if (response.status === 200) {
      return { success: true, txHash: response.body.transactionHash }
    }

    return {
      success: false,
      error: `Failed to mint tokens: ${response.status} - ${JSON.stringify(response.body)}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Failed to mint tokens: ${errorMessage}`,
    }
  }
}

/**
 * @deprecated Use mintTestTokenViaFaucet instead
 */
export async function mintTestTokenViaAPI({
  baseUrl = TEST_SERVER_URL,
  authToken,
  tokenAddress,
  recipientAddress,
  amount,
  chainId = 421614,
}: {
  baseUrl?: string
  authToken: string
  tokenAddress: Address
  recipientAddress: Address
  amount: bigint
  chainId?: number
}): Promise<{ success: boolean; txHash?: string; error?: string }> {
  return mintTestTokenViaFaucet({
    baseUrl,
    authToken,
    tokenAddress,
    recipientAddress,
    amount,
    chainId,
  })
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

/**
 * Get initial balance of a wallet before operations.
 * Used for balance delta assertions in tests.
 */
export async function getInitialBalance({
  baseUrl = TEST_SERVER_URL,
  authToken,
  walletId,
}: {
  baseUrl?: string
  authToken: string
  walletId: string
}): Promise<number> {
  const response = await request(baseUrl)
    .get(`/wallets/${walletId}/balance`)
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200)

  return response.body.balance as number
}

/**
 * Assert that wallet balance changed by expected delta.
 * Accounts for account reuse - tests should assert deltas, not absolute values.
 */
export async function assertBalanceDelta({
  baseUrl = TEST_SERVER_URL,
  authToken,
  walletId,
  expectedDelta,
  initialBalance,
  tolerance = 0.0001,
}: {
  baseUrl?: string
  authToken: string
  walletId: string
  expectedDelta: number
  initialBalance: number
  tolerance?: number
}): Promise<void> {
  const currentBalance = await getInitialBalance({ baseUrl, authToken, walletId })
  const actualDelta = currentBalance - initialBalance
  const deltaDifference = Math.abs(actualDelta - expectedDelta)

  if (deltaDifference > tolerance) {
    throw new Error(
      `Balance delta assertion failed. Expected delta: ${expectedDelta}, Actual delta: ${actualDelta}, Initial: ${initialBalance}, Current: ${currentBalance}`,
    )
  }
}

/**
 * Mint test tokens and return initial and final balances.
 * Useful for tracking balance changes in tests.
 */
/**
 * Mint test tokens with balance tracking.
 * Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614).
 */
export async function mintTestTokenWithBalanceTracking({
  baseUrl = TEST_SERVER_URL,
  authToken,
  tokenAddress,
  recipientAddress,
  amount,
  chainId = 421614, // Default to Arbitrum Sepolia
}: {
  baseUrl?: string
  authToken: string
  tokenAddress: Address
  recipientAddress: Address
  amount: bigint
  chainId?: number
}): Promise<{
  success: boolean
  txHash?: string
  error?: string
  initialBalance?: number
  finalBalance?: number
}> {
  // Note: Token balance reads require a generic read endpoint
  // For now, we return the transaction result without balance tracking
  const result = await mintTestTokenViaFaucet({
    baseUrl,
    authToken,
    tokenAddress,
    recipientAddress,
    amount,
    chainId,
  })

  return {
    ...result,
    // TODO: Add balance tracking when generic read endpoint is available
    initialBalance: undefined,
    finalBalance: undefined,
  }
}
