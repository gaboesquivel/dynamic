import { BalanceInputSchema, BalanceSchema } from '../schemas/balance.schema'

/**
 * Get balance endpoint contract.
 * Defines the POST /wallets/balance endpoint structure.
 */
export const balanceContract = {
  method: 'POST' as const,
  path: '/wallets/balance',
  body: BalanceInputSchema,
  response: BalanceSchema,
}

export type BalanceContract = typeof balanceContract
