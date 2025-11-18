import { Module, Global } from '@nestjs/common'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { getErrorMessage } from '@vencura/lib'
import * as schema from './schema'

/**
 * Initialize database schema for tests.
 * Creates tables directly using SQL (simpler than migrations for test environment).
 */
async function initializeTestDatabase(client: PGlite): Promise<void> {
  try {
    // Create users table
    await client.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)

    // Create wallets table
    await client.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        address TEXT NOT NULL,
        private_key_encrypted TEXT NOT NULL,
        network TEXT NOT NULL DEFAULT '421614',
        chain_type TEXT NOT NULL DEFAULT 'evm',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create token_metadata table
    await client.exec(`
      CREATE TABLE IF NOT EXISTS token_metadata (
        id TEXT PRIMARY KEY,
        chain_id TEXT NOT NULL,
        address TEXT NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `)

    // Seed token metadata for Arbitrum Sepolia mock tokens
    await client.exec(`
      INSERT INTO token_metadata (id, chain_id, address, symbol, name, decimals)
      VALUES
        ('421614-0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F', '421614', '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F', 'DNMC', 'Dynamic Arcade Token', 18),
        ('421614-0x6a2fE04d877439a44938D38709698d524BCF5c40', '421614', '0x6a2fE04d877439a44938D38709698d524BCF5c40', 'USDC', 'USD Coin', 6),
        ('421614-0x5f036f0B6948d4593364f975b81caBB3206aD994', '421614', '0x5f036f0B6948d4593364f975b81caBB3206aD994', 'USDT', 'Tether USD', 6)
      ON CONFLICT (id) DO NOTHING
    `)
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(`Failed to initialize test database: ${message}`)
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'PGLITE',
      useFactory: async () => {
        const client = new PGlite()
        await client.waitReady

        // Initialize schema in test mode
        if (process.env.NODE_ENV === 'test') {
          await initializeTestDatabase(client)
        }

        return client
      },
    },
    {
      provide: 'DATABASE',
      useFactory: (client: PGlite) => drizzle(client, { schema }),
      inject: ['PGLITE'],
    },
    {
      provide: 'DB_SCHEMA',
      useValue: schema,
    },
  ],
  exports: ['DATABASE', 'DB_SCHEMA', 'PGLITE'],
})
export class DatabaseModule {}
