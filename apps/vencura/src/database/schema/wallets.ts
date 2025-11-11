import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const wallets = pgTable('wallets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  address: text('address').notNull(),
  privateKeyEncrypted: text('private_key_encrypted').notNull(),
  network: text('network').notNull().default('arbitrum-sepolia'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
