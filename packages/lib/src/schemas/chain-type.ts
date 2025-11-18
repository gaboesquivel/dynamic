import { Wallet } from '@vencura/types/schemas'

/**
 * Schema for validating chain type.
 * Extracted from Wallet schema for reuse across services.
 */
export const chainTypeSchema = Wallet.shape.chainType

