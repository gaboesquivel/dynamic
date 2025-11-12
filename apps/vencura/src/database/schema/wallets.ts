import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const wallets = pgTable('wallets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  address: text('address').notNull(),
  privateKeyEncrypted: text('private_key_encrypted').notNull(),
  network: text('network').notNull().default('421614'), // Dynamic network ID (string to support all chain types)
  chainType: text('chain_type').notNull().default('evm'), // 'evm', 'solana', 'cosmos', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
