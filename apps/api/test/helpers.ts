import request from 'supertest'
import { getTestAuthToken } from './auth'
import { delay, getErrorMessage } from '@vencura/lib'
import isEmpty from 'lodash/isEmpty'
import type { Address } from 'viem'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'
import { walletAPIContract, ErrorResponseSchema } from '@vencura/types/api-contracts'
import { Wallet } from '@vencura/types/schemas'
import { z } from 'zod'

const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3077'

/**
 * Throttling mechanism to prevent Dynamic SDK rate limits.
 * Dynamic SDK SDK endpoints have rate limits: 100 req/min per IP, 10,000 req/min per project environment.
 * This ensures minimum time between wallet creation calls (2000ms = ~30 req/min, conservative to prevent rate limits).
 */
let lastWalletCreationTime = 0
const MIN_WALLET_CREATION_INTERVAL_MS = 2000 // 2 seconds between wallet creation calls (conservative to prevent rate limits)

/**
 * Throttle wallet creation calls to prevent rate limits.
 * Ensures minimum time interval between wallet creation API calls.
 *
 * This function is called automatically by createTestWallet() helper.
 * For direct API calls in tests, call this before making wallet creation requests.
 *
 * @example
 * ```ts
 * await throttleWalletCreation()
 * const response = await request(TEST_SERVER_URL)
 *   .post('/wallets')
 *   .set('Authorization', `Bearer ${authToken}`)
 *   .send({ chainId })
 * ```
 */
export async function throttleWalletCreation(): Promise<void> {
  const now = Date.now()
  const timeSinceLastCall = now - lastWalletCreationTime

  if (timeSinceLastCall < MIN_WALLET_CREATION_INTERVAL_MS) {
    const waitTime = MIN_WALLET_CREATION_INTERVAL_MS - timeSinceLastCall
    await delay(waitTime)
  }

  lastWalletCreationTime = Date.now()
}

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
 *
 * If a wallet already exists for this chain, returns the existing wallet instead of failing.
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
  // CRITICAL: Throttle wallet creation calls to prevent Dynamic SDK rate limits
  await throttleWalletCreation()

  const response = await request(baseUrl)
    .post('/wallets')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ chainId })

  // CRITICAL: Accept both 200 (existing) and 201 (created) as valid responses (idempotent creation)
  if (response.status === 200 || response.status === 201) {
    // Validate response body using TS-REST contract runtime schema
    // Use the correct schema based on status code
    const WalletSchema =
      response.status === 201
        ? walletAPIContract.create.responses[201]
        : walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
    const validatedWallet = WalletSchema.parse(response.body)

    return validatedWallet as TestWallet
  }

  // Handle rate limit errors (429) - increase delay for next call
  if (response.status === 429) {
    throw new Error(`Rate limit exceeded (429). Increase delays between wallet creation calls.`)
  }

  // Handle "multiple wallets per chain" error as SUCCESS (expected behavior)
  // CRITICAL: This is expected behavior, not a failure - we cannot create multiple wallets with same API key
  if (response.status === 400) {
    // Validate error response structure using zod schema
    const errorResponse = ErrorResponseSchema.safeParse(response.body)
    if (errorResponse.success) {
      const errorMessage = errorResponse.data.message.toLowerCase()
      if (
        errorMessage.includes('multiple wallets per chain') ||
        errorMessage.includes('wallet already exists') ||
        errorMessage.includes('you cannot create multiple wallets')
      ) {
        // Extract existing wallet address from error details
        const existingWalletAddress = errorResponse.data.details?.existingWalletAddress

        if (existingWalletAddress) {
          // Query wallet by address using GET /wallets endpoint
          const walletsResponse = await request(baseUrl)
            .get('/wallets')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)

          const wallets = walletsResponse.body as TestWallet[]
          const existingWallet = wallets.find(w => w.address === existingWalletAddress)

          if (existingWallet) {
            // Validate using TS-REST contract runtime schema (200 response for existing wallet)
            const WalletSchema =
              walletAPIContract.create.responses[200] || walletAPIContract.create.responses[201]
            const validatedWallet = WalletSchema.parse(existingWallet)
            return validatedWallet as TestWallet
          }
        }

        // Fallback: use getOrCreateTestWallet if we can't find wallet by address
        return getOrCreateTestWallet({ baseUrl, authToken, chainId })
      }
    }
  }

  // Log error response for debugging
  console.error('createTestWallet failed:', {
    status: response.status,
    body: response.body,
    chainId,
    headers: response.headers,
  })

  // Throw error for other status codes
  throw new Error(`Failed to create wallet. Status: ${response.status}`)
}

/**
 * Fund a wallet with minimum ETH required for transactions on Arbitrum Sepolia.
 * Uses ARB_TESTNET_GAS_FAUCET_KEY to send only the minimum amount needed.
 * If faucet key is missing, returns balance info without funding.
 *
 * @param address - Wallet address to fund
 * @param rpcUrl - RPC URL for Arbitrum Sepolia (defaults to env or public RPC)
 * @returns Balance info and funding status
 */
export async function fundWalletWithGas({
  address,
  rpcUrl,
}: {
  address: string
  rpcUrl?: string
}): Promise<{
  balanceBefore: bigint
  balanceAfter: bigint
  funded: boolean
  transactionHash?: string
}> {
  const effectiveRpcUrl =
    rpcUrl || process.env.RPC_URL_421614 || 'https://sepolia-rollup.arbitrum.io/rpc'

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(effectiveRpcUrl),
  })

  // Get current balance
  const balanceBefore = await publicClient.getBalance({ address: address as Address })

  // Use isEmpty() from lodash to detect missing key
  const faucetPrivateKey = process.env.ARB_TESTNET_GAS_FAUCET_KEY
  if (isEmpty(faucetPrivateKey)) {
    // No faucet key - return balance info without funding
    return {
      balanceBefore,
      balanceAfter: balanceBefore,
      funded: false,
    }
  }

  try {
    const account = privateKeyToAccount(faucetPrivateKey as `0x${string}`)

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
      to: address as Address,
      value: amountWithBuffer,
    })

    // Wait for transaction to be mined
    await publicClient.waitForTransactionReceipt({ hash })

    const balanceAfter = await publicClient.getBalance({ address: address as Address })

    return {
      balanceBefore,
      balanceAfter,
      funded: true,
      transactionHash: hash,
    }
  } catch (error) {
    // Use getErrorMessage() from @vencura/lib for error extraction
    const errorMessage = getErrorMessage(error) || 'Unknown error'
    console.error('Failed to fund wallet:', errorMessage)

    // Return balance info even on error (never throw)
    return {
      balanceBefore,
      balanceAfter: balanceBefore,
      funded: false,
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
  const walletsResponse = await request(baseUrl)
    .get('/wallets')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(200)

  // Validate wallets array using TS-REST contract runtime schema
  const ListWalletsSchema = walletAPIContract.list.responses[200]
  const wallets = ListWalletsSchema.parse(walletsResponse.body) as TestWallet[]

  const existingWallet = wallets.find(w => w.network === String(chainId))

  if (existingWallet) {
    // Only auto-fund Arbitrum Sepolia wallets (chain ID 421614)
    if (existingWallet.chainType === 'evm' && String(chainId) === '421614') {
      await fundWalletWithGas({
        address: existingWallet.address,
      })
    }
    return existingWallet
  }

  const wallet = await createTestWallet({ baseUrl, authToken, chainId })

  // Only auto-fund Arbitrum Sepolia wallets (chain ID 421614)
  if (wallet.chainType === 'evm' && String(chainId) === '421614') {
    // CRITICAL: Throttle before funding to prevent rate limits
    await delay(300)
    await fundWalletWithGas({
      address: wallet.address,
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

  // Validate response using TS-REST contract runtime schema
  const BalanceSchema = walletAPIContract.getBalance.responses[200]
  const validatedBalance = BalanceSchema.parse(response.body)

  return validatedBalance.balance
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
