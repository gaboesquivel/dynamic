import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { and, eq } from 'drizzle-orm'
import { getErrorMessage } from '@vencura/lib'
import { schema, tokenMetadata } from '../db/schema'

/**
 * Initialize database schema with static SQL.
 * PGLite cannot use drizzle-kit migrations, so we use direct SQL.
 */
async function initializeDatabase(client: PGlite): Promise<void> {
  try {
    // Create key_shares table - stores encrypted server-side key shares for wallet signing
    // Keyed by userId + address + chainType (e.g., 'evm', 'solana')
    // One wallet per user per chainType, matching DynamicSDK's model
    await client.exec(`
      CREATE TABLE IF NOT EXISTS key_shares (
        user_id TEXT NOT NULL,
        address TEXT NOT NULL,
        chain_type TEXT NOT NULL,
        encrypted_key_shares TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (user_id, address, chain_type)
      )
    `)

    // Create token_metadata table - caches ERC20 token metadata to avoid repeated on-chain queries
    // Keyed by address + chainId to support same token address across different chains
    await client.exec(`
      CREATE TABLE IF NOT EXISTS token_metadata (
        address TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (address, chain_id)
      )
    `)

    // Create index for efficient lookups by chainId and address
    await client.exec(`
      CREATE INDEX IF NOT EXISTS idx_token_metadata_chain_address 
      ON token_metadata(chain_id, address)
    `)
  } catch (error) {
    const message = getErrorMessage(error) || 'Unknown error'
    throw new Error(`Failed to initialize database: ${message}`)
  }
}

/**
 * Seed database with testnet token metadata from contracts/evm/README.md.
 * Called after database initialization to populate known testnet tokens.
 */
export async function seedTestnetTokens(): Promise<void> {
  try {
    const db = await getDatabase()

    // Arbitrum Sepolia testnet tokens (chain ID: 421614)
    const testnetTokens = [
      {
        address: '0x6a2fE04d877439a44938D38709698d524BCF5c40',
        chainId: 421614,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      },
      {
        address: '0x5f036f0B6948d4593364f975b81caBB3206aD994',
        chainId: 421614,
        name: 'USD Tether',
        symbol: 'USDT',
        decimals: 6,
      },
      {
        address: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
        chainId: 421614,
        name: 'Dynamic Arcade Token',
        symbol: 'DNMC',
        decimals: 18,
      },
    ]

    for (const token of testnetTokens) {
      // Check if token already exists
      const existing = await db
        .select()
        .from(tokenMetadata)
        .where(
          and(eq(tokenMetadata.address, token.address), eq(tokenMetadata.chainId, token.chainId)),
        )
        .limit(1)

      if (existing.length === 0) {
        await db.insert(tokenMetadata).values({
          address: token.address,
          chainId: token.chainId,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
        })
      }
    }
  } catch (error) {
    // Log but don't fail initialization if seeding fails
    const message = getErrorMessage(error) || 'Unknown error'
    console.warn(`Failed to seed testnet tokens: ${message}`)
  }
}

let dbInstance: ReturnType<typeof drizzle> | null = null
let pgliteInstance: PGlite | null = null

/**
 * Get singleton PGLite client instance.
 */
export async function getPGliteClient(): Promise<PGlite> {
  if (!pgliteInstance) {
    pgliteInstance = new PGlite()
    await pgliteInstance.waitReady
    await initializeDatabase(pgliteInstance)
    // Seed testnet tokens after initialization
    await seedTestnetTokens()
  }
  return pgliteInstance
}

/**
 * Get singleton Drizzle database instance.
 */
export async function getDatabase() {
  if (!dbInstance) {
    const client = await getPGliteClient()
    dbInstance = drizzle(client, { schema })
  }
  return dbInstance
}
