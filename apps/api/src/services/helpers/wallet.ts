import { eq, and } from 'drizzle-orm'
import { parseJsonWithSchema, keySharesSchema } from '@vencura/lib'
import { getDatabase } from '../database'
import { keyShares } from '../../db/schema'
import { decryptKeyShare } from '../encryption'
import { getWalletByIdForUser } from '../wallet.service'
import type { ChainType } from '../chain-utils'

/**
 * Get wallet info and decrypted key shares for a user's wallet.
 * Consolidates wallet lookup, key share retrieval, decryption, and parsing.
 */
export async function getWalletAndKeyShares({
  userId,
  walletId,
}: {
  userId: string
  walletId: string
}) {
  // Get wallet info by ID and user
  const walletInfo = await getWalletByIdForUser({ userId, walletId })
  if (!walletInfo) {
    throw new Error(`Wallet not found for user ${userId}`)
  }

  const { address, chainType } = walletInfo

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

  // Decrypt and parse key shares
  const keySharesEncrypted = await decryptKeyShare(keyShare.encryptedKeyShares)
  const externalServerKeyShares = parseJsonWithSchema({
    jsonString: keySharesEncrypted,
    schema: keySharesSchema,
  })

  return { walletInfo, externalServerKeyShares }
}
