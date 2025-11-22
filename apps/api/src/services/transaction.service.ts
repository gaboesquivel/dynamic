import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  type LocalAccount,
  type Hex,
  type TypedData,
  type SignableMessage,
  type TransactionSerializable,
} from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { getErrorMessage } from '@vencura/lib'
import { parseJsonWithSchema, keySharesSchema, getChainMetadata } from '@vencura/lib'
import { getDatabase } from './database'
import { keyShares } from '../db/schema'
import { decryptKeyShare } from './encryption'
import { getEvmClient } from './wallet-client'
import { eq, and } from 'drizzle-orm'
import { getWalletByIdForUser } from './wallet.service'
import { zEnv } from '../lib/env'

/**
 * Send transaction service for EVM wallets.
 * Uses Dynamic SDK + viem to build, sign, and send transactions.
 */
export async function sendTransactionService({
  userId,
  walletId,
  to,
  amount,
  data,
}: {
  userId: string
  walletId: string
  to: string
  amount: number
  data?: string | null
}): Promise<{ transactionHash: string }> {
  // Get wallet info by ID and user
  const walletInfo = await getWalletByIdForUser({ userId, walletId })
  if (!walletInfo) {
    throw new Error(`Wallet not found for user ${userId}`)
  }

  const { address, chainType } = walletInfo

  // Only support EVM chains for now
  if (chainType !== 'evm') {
    throw new Error(`Unsupported chain type: ${chainType}. Only EVM chains are supported.`)
  }

  // For now, assume Arbitrum Sepolia (421614) for EVM wallets
  // TODO: Store chain ID in database or pass as parameter to support multiple EVM chains
  const chainId = 421614
  const chainMetadata = getChainMetadata(chainId)
  if (!chainMetadata || !chainMetadata.chainId || typeof chainMetadata.chainId !== 'number') {
    throw new Error(`Could not determine chain metadata for chain ID ${chainId}`)
  }

  const dynamicNetworkId = chainMetadata.dynamicNetworkId

  // Get key shares from database
  const db = await getDatabase()
  const [keyShare] = await db
    .select()
    .from(keyShares)
    .where(
      and(
        eq(keyShares.userId, userId),
        eq(keyShares.address, address),
        eq(keyShares.chainType, chainType),
      ),
    )
    .limit(1)

  if (!keyShare) {
    throw new Error(`Wallet key shares not found for wallet ${address}`)
  }

  // Decrypt key shares
  const keySharesEncrypted = await decryptKeyShare(keyShare.encryptedKeyShares)
  const externalServerKeyShares = parseJsonWithSchema({
    jsonString: keySharesEncrypted,
    schema: keySharesSchema,
  })

  // Get Dynamic EVM client
  const dynamicEvmClient = await getEvmClient()

  // Get RPC URL (priority: SEPOLIA_RPC_URL > default)
  const rpcUrl =
    zEnv.SEPOLIA_RPC_URL ||
    chainMetadata.viemChain?.rpcUrls?.default?.http?.[0] ||
    'https://sepolia-rollup.arbitrum.io/rpc'

  // Get viem chain (use Arbitrum Sepolia as default for now, extend later)
  const viemChain = chainMetadata.viemChain || arbitrumSepolia

  // Helper to convert SignableMessage to string for Dynamic SDK
  const messageToString = (message: SignableMessage): string => {
    if (typeof message === 'string') return message
    if (message instanceof Uint8Array) {
      return new TextDecoder().decode(message)
    }
    if ('raw' in message) {
      if (typeof message.raw === 'string') return message.raw
      return new TextDecoder().decode(message.raw)
    }
    return String(message)
  }

  // Create a wallet account that can sign transactions
  const account = {
    address: address as `0x${string}`,
    type: 'local' as const,
    signMessage: async ({ message }: { message: SignableMessage }) => {
      const messageStr = messageToString(message)
      return (await dynamicEvmClient.signMessage({
        accountAddress: address,
        externalServerKeyShares,
        message: messageStr,
      })) as Hex
    },
    signTypedData: async <const TTypedData extends TypedData | { [key: string]: unknown }>(
      parameters: TTypedData,
    ) =>
      (await dynamicEvmClient.signTypedData({
        accountAddress: address,
        externalServerKeyShares,
        typedData: parameters,
      })) as Hex,
    signTransaction: async <transaction extends TransactionSerializable = TransactionSerializable>(
      transaction: transaction,
    ) =>
      (await dynamicEvmClient.signTransaction({
        senderAddress: address,
        externalServerKeyShares,
        transaction,
      })) as Hex,
  } as LocalAccount

  const walletClient = createWalletClient({
    account,
    chain: viemChain,
    transport: http(rpcUrl),
  })

  // Send transaction
  try {
    const hash = await walletClient.sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount.toString()),
      ...(data && { data: data as Hex }),
    })

    return {
      transactionHash: hash,
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? String(error)
    throw new Error(`Failed to send transaction: ${errorMessage}`)
  }
}
