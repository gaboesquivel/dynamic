import { isEmpty } from 'lodash'
import { z } from 'zod'
import type { ChainType } from '@vencura/types'
import { createAddressSchema } from '@vencura/types/schemas'
import { isZodError } from '@vencura/lib'

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
 * Uses zod schemas from @vencura/types for validation - server-side validation is the source of truth.
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
  const trimmed = address.trim()
  if (isEmpty(trimmed)) {
    return { valid: false, error: 'Address is required' }
  }

  // Use EVM as default if chainType is not provided
  const validationChainType = chainType || 'evm'

  try {
    const schema = createAddressSchema({ chainType: validationChainType })
    schema.parse(trimmed)
    return { valid: true }
  } catch (error) {
    if (isZodError(error)) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid address format' }
    }
    // Log unexpected errors to help debug potential bugs
    console.error('Unexpected error during address validation:', error)
    // Return consistent error object instead of throwing
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      valid: false,
      error: `Unexpected validation error${errorMessage ? `: ${errorMessage}` : ''}`,
    }
  }
}
