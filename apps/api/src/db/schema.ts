import { pgTable, text, timestamp, primaryKey, integer } from 'drizzle-orm/pg-core'

/**
 * Key shares table - stores encrypted server-side key shares for wallet signing operations.
 * Keyed by userId, wallet address, and chainType (e.g., 'evm', 'solana').
 * This is the only wallet-related data we store - all other wallet metadata comes from Dynamic SDK.
 * One wallet per user per chainType, matching DynamicSDK's model.
 */
export const keyShares = pgTable(
  'key_shares',
  {
    userId: text('user_id').notNull(), // User ID to scope wallets per user
    address: text('address').notNull(), // Wallet address
    chainType: text('chain_type').notNull(), // Chain type (e.g., 'evm', 'solana')
    encryptedKeyShares: text('encrypted_key_shares').notNull(), // Encrypted externalServerKeyShares from Dynamic SDK
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.userId, table.address, table.chainType] }),
  }),
)

/**
 * Token metadata table - caches ERC20 token metadata (name, symbol, decimals) to avoid repeated on-chain queries.
 * Keyed by token address and chainId to support same token address across different chains.
 */
export const tokenMetadata = pgTable(
  'token_metadata',
  {
    address: text('address').notNull(), // Token contract address
    chainId: integer('chain_id').notNull(), // Chain ID (e.g., 421614 for Arbitrum Sepolia)
    name: text('name').notNull(), // Token name (e.g., "USD Coin")
    symbol: text('symbol').notNull(), // Token symbol (e.g., "USDC")
    decimals: integer('decimals').notNull(), // Token decimals (e.g., 6 for USDC, 18 for ETH)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.address, table.chainId] }),
  }),
)

export const schema = {
  keyShares,
  tokenMetadata,
}
