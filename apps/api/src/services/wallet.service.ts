import { createHash } from 'crypto'
import { getDatabase } from './database'
import { keyShares } from '../db/schema'
import { encryptKeyShare } from './encryption'
import { createWallet } from './wallet-client'
import { type ChainType } from './chain-utils'

/**
 * Generate deterministic wallet ID from address and chainType.
 * Uses SHA-256 hash of address+chainType to create a deterministic ID.
 */
function generateWalletId(address: string, chainType: string): string {
  const input = `${address}:${chainType}`
  const hash = createHash('sha256').update(input).digest('hex')
  // Format as UUID v4-like string (but deterministic)
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`
}

/**
 * Get all wallets for a user (query DB by chainType).
 * Note: Schema doesn't track userId, so we return all wallets in key_shares table.
 */
async function getUserWallets(): Promise<
  Array<{ id: string; address: string; chainType: ChainType }>
> {
  const db = await getDatabase()
  const allKeyShares = await db.select().from(keyShares)

  return allKeyShares.map(keyShare => {
    const id = generateWalletId(keyShare.address, keyShare.chainType)
    return {
      id,
      address: keyShare.address,
      chainType: keyShare.chainType as ChainType,
    }
  })
}

/**
 * Create wallet with idempotent behavior.
 * One wallet per chainType, matching DynamicSDK's model.
 * 1. Query DB first using chainType
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
  // Query DB first - check if wallet exists for this chainType (idempotent check)
  const existingWallets = await getUserWallets()
  const existingWallet = existingWallets.find(w => w.chainType === chainType)

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
      userId,
      chainType,
    })

    // Encrypt key shares
    const keySharesEncrypted = await encryptKeyShare(JSON.stringify(wallet.externalServerKeyShares))

    // Save to DB (upsert to handle race conditions)
    const db = await getDatabase()
    await db
      .insert(keyShares)
      .values({
        address: wallet.accountAddress,
        chainType,
        encryptedKeyShares: keySharesEncrypted,
      })
      .onConflictDoUpdate({
        target: [keyShares.address, keyShares.chainType],
        set: {
          encryptedKeyShares: keySharesEncrypted,
        },
      })

    // Compute walletId deterministically
    const walletId = generateWalletId(wallet.accountAddress, chainType)

    return {
      id: walletId,
      address: wallet.accountAddress,
      chainType,
      isNew: true,
    }
  } catch (error) {
    // Handle Dynamic SDK "wallet already exists" errors
    // Dynamic SDK wraps errors, so we check error message and stack for indicators
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : ''
    const lowerMessage = errorMessage.toLowerCase()
    const stackLower = errorStack.toLowerCase()

    // Check if this is a "multiple wallets" error
    // Dynamic SDK wraps errors, so we check error message and stack for indicators
    const isMultipleWalletsError =
      stackLower.includes('multiple wallets per chain') ||
      stackLower.includes('wallet already exists') ||
      stackLower.includes('you cannot create multiple wallets') ||
      lowerMessage.includes('multiple wallets per chain') ||
      lowerMessage.includes('wallet already exists') ||
      lowerMessage.includes('you cannot create multiple wallets')

    // Check if this is a generic wallet creation error (might be wrapped "multiple wallets" error)
    // Dynamic SDK wraps "multiple wallets" errors as "Error creating wallet account"
    const isWalletCreationError =
      lowerMessage.includes('error creating') ||
      lowerMessage.includes('wallet account') ||
      isMultipleWalletsError

    // If it's a wallet creation error, check DB again (might have been created in race condition)
    if (isWalletCreationError) {
      const finalCheckWallets = await getUserWallets()
      const finalCheckWallet = finalCheckWallets.find(w => w.chainType === chainType)
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
