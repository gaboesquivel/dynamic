import { createPublicClient, http, type Address, getAddress } from 'viem'
import { and, eq } from 'drizzle-orm'
import { getErrorMessage } from '@vencura/lib'
import { getChainMetadata } from './chain-utils'
import { getDatabase } from './database'
import { tokenMetadata } from '../db/schema'
import { testnetTokenAbi } from '@vencura/evm/abis/asset/TestnetToken'

/**
 * Token metadata interface matching database schema.
 */
export interface TokenMetadata {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
}

/**
 * Get token metadata from database cache or fetch from chain via viem.
 * Caches metadata in database for subsequent requests.
 *
 * @param address - Token contract address
 * @param chainId - Chain ID (e.g., 421614 for Arbitrum Sepolia)
 * @returns Token metadata (name, symbol, decimals)
 */
export async function getTokenMetadata({
  address,
  chainId,
}: {
  address: string
  chainId: number
}): Promise<TokenMetadata> {
  // Normalize address to checksum format
  const normalizedAddress = getAddress(address)

  // Check database cache first
  const db = await getDatabase()
  const cached = await db
    .select()
    .from(tokenMetadata)
    .where(and(eq(tokenMetadata.address, normalizedAddress), eq(tokenMetadata.chainId, chainId)))
    .limit(1)

  if (cached.length > 0) {
    return {
      address: cached[0].address,
      chainId: cached[0].chainId,
      name: cached[0].name,
      symbol: cached[0].symbol,
      decimals: cached[0].decimals,
    }
  }

  // Not in cache - fetch from chain via viem
  const chainMeta = getChainMetadata(chainId)
  if (!chainMeta?.viemChain) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  const publicClient = createPublicClient({
    chain: chainMeta.viemChain,
    transport: http(chainMeta.defaultRpcUrl),
  })

  // Fetch token metadata using multicall for efficiency
  const [name, symbol, decimals] = await Promise.all([
    publicClient.readContract({
      address: normalizedAddress as Address,
      abi: testnetTokenAbi,
      functionName: 'name',
    }),
    publicClient.readContract({
      address: normalizedAddress as Address,
      abi: testnetTokenAbi,
      functionName: 'symbol',
    }),
    publicClient.readContract({
      address: normalizedAddress as Address,
      abi: testnetTokenAbi,
      functionName: 'decimals',
    }),
  ])

  const metadata: TokenMetadata = {
    address: normalizedAddress,
    chainId,
    name: name as string,
    symbol: symbol as string,
    decimals: Number(decimals),
  }

  // Cache in database for next request
  try {
    await db.insert(tokenMetadata).values({
      address: metadata.address,
      chainId: metadata.chainId,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: metadata.decimals,
    })
  } catch (error) {
    // Log but don't fail if insert fails (e.g., race condition)
    const message = getErrorMessage(error) || 'Unknown error'
    console.warn(`Failed to cache token metadata: ${message}`)
  }

  return metadata
}
