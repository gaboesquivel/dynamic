import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const tokenMetadata = pgTable('token_metadata', {
  id: text('id').primaryKey(), // Composite: '{chainId}-{address}'
  chainId: text('chain_id').notNull(),
  address: text('address').notNull(),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  decimals: integer('decimals').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
