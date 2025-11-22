import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { getErrorMessage } from '@vencura/lib'
import { schema } from '../db/schema'

/**
 * Initialize database schema with static SQL.
 * PGLite cannot use drizzle-kit migrations, so we use direct SQL.
 */
async function initializeDatabase(client: PGlite): Promise<void> {
  try {
    // Create key_shares table - stores encrypted server-side key shares for wallet signing
    // Keyed by address + chainType (e.g., 'evm', 'solana')
    // One wallet per chainType, matching DynamicSDK's model
    await client.exec(`
      CREATE TABLE IF NOT EXISTS key_shares (
        address TEXT NOT NULL,
        chain_type TEXT NOT NULL,
        encrypted_key_shares TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (address, chain_type)
      )
    `)
  } catch (error) {
    const message = getErrorMessage(error) || 'Unknown error'
    throw new Error(`Failed to initialize database: ${message}`)
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
