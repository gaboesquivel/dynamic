import { z } from 'zod'
import type { ChainType } from '@vencura/types'

/**
 * Schema for sign message input.
 * Validates that message is not empty.
 */
export const signMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').trim(),
})

export type SignMessageFormData = z.infer<typeof signMessageSchema>

/**
 * Schema for send transaction input.
 * Validates address format and amount.
 */
export const sendTransactionSchema = z.object({
  to: z.string().min(1, 'Recipient address is required').trim(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .finite('Amount must be a finite number'),
})

export type SendTransactionFormData = z.infer<typeof sendTransactionSchema>

/**
 * Validates an address based on chain type.
 * Uses basic format validation - server-side validation is the source of truth.
 *
 * @param params - Validation parameters
 * @param params.address - Address to validate
 * @param params.chainType - Chain type for validation
 * @returns Validation result
 */
export function validateAddressInput({
  address,
  chainType,
}: {
  address: string
  chainType?: ChainType
}): { valid: boolean; error?: string } {
  if (!address.trim()) {
    return { valid: false, error: 'Address is required' }
  }

  const trimmed = address.trim()

  // Basic format validation based on chain type
  if (chainType === 'solana') {
    // Solana addresses are base58, typically 32-44 characters
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed))
      return { valid: false, error: 'Invalid Solana address format' }
  } else if (chainType === 'evm' || !chainType) {
    // EVM addresses are 0x-prefixed hex, 42 characters
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed))
      return {
        valid: false,
        error: 'Invalid EVM address format (must be 0x followed by 40 hex characters)',
      }
  }

  return { valid: true }
}
