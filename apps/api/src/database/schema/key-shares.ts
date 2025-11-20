import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'

/**
 * Key shares table - stores encrypted server-side key shares for wallet signing operations.
 * Keyed by wallet address and network (Dynamic network ID).
 * This is the only wallet-related data we store - all other wallet metadata comes from Dynamic SDK.
 */
export const keyShares = pgTable(
  'key_shares',
  {
    address: text('address').notNull(), // Wallet address
    network: text('network').notNull(), // Dynamic network ID (e.g., '421614', 'solana-mainnet')
    encryptedKeyShares: text('encrypted_key_shares').notNull(), // Encrypted externalServerKeyShares from Dynamic SDK
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.address, table.network] }),
  }),
)
