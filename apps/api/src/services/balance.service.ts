import { createPublicClient, http, type Address, getAddress, formatUnits, parseUnits } from 'viem'
import { getErrorMessage } from '@vencura/lib'
import { getChainMetadata } from './chain-utils'
import { getWalletByChainType } from './wallet.service'
import { getTokenMetadata } from './token-metadata.service'
import { testnetTokenAbi } from '@vencura/evm/abis/asset/TestnetToken'
import type { ChainType } from '@vencura/types'

/**
 * Get balance for a user's wallet.
 * Supports both native token balance and ERC20 token balances.
 *
 * @param userId - User ID
 * @param chainId - Chain ID (e.g., 421614 for Arbitrum Sepolia)
 * @param chainType - Chain type (e.g., 'evm')
 * @param tokenAddress - Optional token address for ERC20 balance. If omitted, returns native token balance.
 * @returns Balance response with balance, chainId, chainType, and optional token metadata
 */
export async function getBalanceService({
  userId,
  chainId,
  chainType,
  tokenAddress,
}: {
  userId: string
  chainId: number
  chainType: ChainType
  tokenAddress?: string
}): Promise<{
  balance: string
  chainId: number
  chainType: ChainType
  token?: {
    address: string
    name: string
    symbol: string
    decimals: number
  }
}> {
  // Get user's wallet for the chain type
  const wallet = await getWalletByChainType(userId, chainType)
  if (!wallet) {
    throw new Error(`Wallet not found for user ${userId} on chain type ${chainType}`)
  }

  // Get chain metadata for viem client
  const chainMeta = getChainMetadata(chainId)
  if (!chainMeta?.viemChain) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  if (chainMeta.chainType !== chainType) {
    throw new Error(`Chain ID ${chainId} does not match chain type ${chainType}`)
  }

  const publicClient = createPublicClient({
    chain: chainMeta.viemChain,
    transport: http(chainMeta.defaultRpcUrl),
  })

  const walletAddress = getAddress(wallet.address) as Address

  // Get balance (native or token)
  let balance: bigint
  let tokenMetadata: Awaited<ReturnType<typeof getTokenMetadata>> | undefined

  if (tokenAddress) {
    // ERC20 token balance
    const normalizedTokenAddress = getAddress(tokenAddress) as Address

    // Get token balance
    balance = await publicClient.readContract({
      address: normalizedTokenAddress,
      abi: testnetTokenAbi,
      functionName: 'balanceOf',
      args: [walletAddress],
    })

    // Get token metadata (will use cache if available)
    tokenMetadata = await getTokenMetadata({
      address: normalizedTokenAddress,
      chainId,
    })
  } else {
    // Native token balance
    balance = await publicClient.getBalance({ address: walletAddress })
    // Native token decimals are always 18
    // Use chain-specific native token symbol (ETH for Ethereum chains)
    const nativeSymbol = chainMeta.viemChain.nativeCurrency?.symbol ?? 'ETH'
    tokenMetadata = {
      address: walletAddress,
      chainId,
      name: `${chainMeta.name} Native Token`,
      symbol: nativeSymbol,
      decimals: 18,
    }
  }

  // Format balance as string (preserving precision)
  const decimals = tokenMetadata?.decimals ?? 18
  const balanceString = formatUnits(balance, decimals)

  return {
    balance: balanceString,
    chainId,
    chainType,
    ...(tokenMetadata && {
      token: {
        address: tokenMetadata.address,
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        decimals: tokenMetadata.decimals,
      },
    }),
  }
}
