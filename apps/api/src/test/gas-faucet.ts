import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { zEnv } from '../lib/env'

/**
 * Gas faucet helper for test wallets.
 * Funds wallets with minimum ETH required for transactions on Arbitrum Sepolia.
 * Test-only utility - requires ARB_TESTNET_GAS_FAUCET_KEY to be set.
 *
 * @param params - Funding parameters
 * @param params.address - Wallet address to fund
 * @param params.chainId - Chain ID (defaults to 421614 for Arbitrum Sepolia)
 * @returns Transaction hash and funded amount in wei
 */
export async function fundWalletWithGas({
  address,
  chainId = 421614,
}: {
  address: string
  chainId?: number
}): Promise<{ transactionHash: string; fundedWei: bigint }> {
  // Guard: Only allow if ARB_TESTNET_GAS_FAUCET_KEY is set (test-only)
  if (!zEnv.ARB_TESTNET_GAS_FAUCET_KEY) {
    throw new Error(
      'ARB_TESTNET_GAS_FAUCET_KEY is not set. Gas faucet is only available in test environments.',
    )
  }

  // Only support Arbitrum Sepolia for now
  if (chainId !== 421614) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Only Arbitrum Sepolia (421614) is supported.`,
    )
  }

  // Derive faucet account from private key
  const faucetAccount = privateKeyToAccount(zEnv.ARB_TESTNET_GAS_FAUCET_KEY as `0x${string}`)

  // Get RPC URL (priority: SEPOLIA_RPC_URL > default)
  const rpcUrl = zEnv.SEPOLIA_RPC_URL || arbitrumSepolia.rpcUrls.default.http[0]

  // Create public client to get gas price
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
  })

  // Get current gas price
  const gasPrice = await publicClient.getGasPrice()

  // Calculate minimum ETH needed: gasPrice * gasLimit * 1.2 (20% buffer)
  // Use conservative gas limit of 65,000 for simple ETH transfer
  const gasLimit = 65_000n
  const gasCost = gasPrice * gasLimit
  const gasCostWithBuffer = (gasCost * 120n) / 100n // 20% buffer

  // Create wallet client for faucet account
  const walletClient = createWalletClient({
    account: faucetAccount,
    chain: arbitrumSepolia,
    transport: http(rpcUrl),
  })

  // Send exact amount needed
  const hash = await walletClient.sendTransaction({
    to: address as `0x${string}`,
    value: gasCostWithBuffer,
  })

  return {
    transactionHash: hash,
    fundedWei: gasCostWithBuffer,
  }
}
