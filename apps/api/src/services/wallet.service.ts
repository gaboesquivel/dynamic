import { createHash } from 'crypto'
import { eq } from 'drizzle-orm'
import { getErrorMessage } from '@vencura/lib'
import { getDatabase } from './database'
import { keyShares } from '../db/schema'
import { encryptKeyShare } from './encryption'
import { createWallet } from './wallet-client'
import { type ChainType } from './chain-utils'

/**
 * Generate deterministic wallet ID from userId, address and chainType.
 * Uses SHA-256 hash of userId+address+chainType to create a deterministic ID.
 */
function generateWalletId(userId: string, address: string, chainType: string): string {
  const input = `${userId}:${address}:${chainType}`
  const hash = createHash('sha256').update(input).digest('hex')
  // Format as UUID v4-like string (but deterministic)
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

/**
 * Get all wallets for a user (query DB by userId).
 */
async function getUserWallets(
  userId: string,
): Promise<Array<{ id: string; address: string; chainType: ChainType }>> {
  const db = await getDatabase()
  const userKeyShares = await db.select().from(keyShares).where(eq(keyShares.userId, userId))

  return userKeyShares.map(keyShare => {
    const id = generateWalletId(userId, keyShare.address, keyShare.chainType)
    return {
      id,
      address: keyShare.address,
      chainType: keyShare.chainType as ChainType,
    }
  })
}

/**
 * Get wallet by userId and chainType.
 */
export async function getWalletByChainType(
  userId: string,
  chainType: ChainType,
): Promise<{ id: string; address: string; chainType: ChainType } | null> {
  const wallets = await getUserWallets(userId)
  return wallets.find(w => w.chainType === chainType) ?? null
}

/**
 * Get wallet by ID for a specific user.
 * Returns wallet info including address and chainType.
 */
export async function getWalletByIdForUser({
  userId,
  walletId,
}: {
  userId: string
  walletId: string
}): Promise<{ address: string; chainType: ChainType } | null> {
  const wallets = await getUserWallets(userId)
  const wallet = wallets.find(w => w.id === walletId)
  return wallet ? { address: wallet.address, chainType: wallet.chainType } : null
}

type WalletError = Error | unknown

function getErrorStrings(error: WalletError) {
  const message = getErrorMessage(error) ?? String(error)
  const stack = error instanceof Error ? (error.stack ?? '') : ''
  const lowerMessage = message.toLowerCase()
  const lowerStack = stack.toLowerCase()
  return { lowerMessage, lowerStack }
}

function isMultipleWalletsError(error: WalletError): boolean {
  const { lowerMessage, lowerStack } = getErrorStrings(error)
  const patterns = [
    'multiple wallets per chain',
    'wallet already exists',
    'you cannot create multiple wallets',
  ]
  return patterns.some(p => lowerMessage.includes(p) || lowerStack.includes(p))
}

function isWalletCreationError(error: WalletError): boolean {
  const { lowerMessage } = getErrorStrings(error)
  return (
    lowerMessage.includes('error creating') ||
    lowerMessage.includes('wallet account') ||
    isMultipleWalletsError(error)
  )
}

/**
 * Create wallet with idempotent behavior.
 * One wallet per user per chainType, matching DynamicSDK's model.
 * 1. Query DB first using userId and chainType
 * 2. If found, return 200 with existing wallet
 * 3. Only call Dynamic SDK if DB is empty
 * 4. Create wallet, encrypt, save to DB
 * 5. Return 201 with new wallet
 */
export async function createWalletService({
  userId,
  chainType,
}: {
  userId: string
  chainType: ChainType
}): Promise<{
  id: string
  address: string
  chainType: ChainType
  isNew: boolean
}> {
  // Query DB first - check if wallet exists for this user and chainType (idempotent check)
  const existingWallet = await getWalletByChainType(userId, chainType)

  // If wallet already exists, return it immediately (idempotent success)
  if (existingWallet) {
    return {
      id: existingWallet.id,
      address: existingWallet.address,
      chainType: existingWallet.chainType,
      isNew: false,
    }
  }

  // Only call Dynamic SDK if DB is empty (no existing wallet found)
  try {
    const wallet = await createWallet({
      chainType,
    })

    // Encrypt key shares
    const keySharesEncrypted = await encryptKeyShare(JSON.stringify(wallet.externalServerKeyShares))

    // Save to DB (upsert to handle race conditions)
    const db = await getDatabase()
    await db
      .insert(keyShares)
      .values({
        userId,
        address: wallet.accountAddress,
        chainType,
        encryptedKeyShares: keySharesEncrypted,
      })
      .onConflictDoUpdate({
        target: [keyShares.userId, keyShares.address, keyShares.chainType],
        set: {
          encryptedKeyShares: keySharesEncrypted,
        },
      })

    // Compute walletId deterministically
    const walletId = generateWalletId(userId, wallet.accountAddress, chainType)

    return {
      id: walletId,
      address: wallet.accountAddress,
      chainType,
      isNew: true,
    }
  } catch (error) {
    // Handle Dynamic SDK "wallet already exists" errors
    if (isWalletCreationError(error)) {
      const finalCheckWallet = await getWalletByChainType(userId, chainType)
      if (finalCheckWallet) {
        return {
          id: finalCheckWallet.id,
          address: finalCheckWallet.address,
          chainType: finalCheckWallet.chainType,
          isNew: false,
        }
      }

      // If we get a wallet creation error but no wallet in DB, it's likely a "multiple wallets" error
      // that was wrapped. Dynamic SDK prevents multiple wallets per chainType, so if creation fails,
      // it means a wallet already exists in Dynamic SDK's system (possibly from a previous test run).
      // Throw a user-friendly error indicating wallet already exists.
      throw new Error(
        `Wallet already exists for chainType ${chainType}. Multiple wallets per chainType are not allowed.`,
      )
    }

    // Re-throw other errors
    throw error
  }
}
