import { z } from 'zod'
import type { ChainType } from './wallet'

/**
 * EVM address schema (0x-prefixed hex, 42 characters).
 * Note: This performs basic format validation. For production validation with checksum verification,
 * use `getAddress()` from `viem` instead.
 */
export const EvmAddressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{40}$/i,
    'Invalid EVM address format (must be 0x followed by 40 hex characters)',
  )
  .transform(val => val.toLowerCase())

/**
 * Solana address schema (Base58, 32-44 characters).
 * Note: This performs basic format validation. For production validation with curve verification,
 * use `PublicKey` from `@solana/web3.js` instead.
 */
export const SolanaAddressSchema = z
  .string()
  .regex(
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    'Invalid Solana address format (must be 32-44 base58 characters)',
  )

/**
 * Cosmos address schema (Bech32 format).
 * Note: This performs basic format validation. For production validation with proper Bech32 decoding,
 * use `fromBech32()` from `@cosmjs/encoding` instead.
 */
export const CosmosAddressSchema = z
  .string()
  .regex(/^[a-z]{1,5}1[a-z0-9]{6,}$/i, 'Invalid Cosmos address format (must be Bech32)')
  .refine(val => val.length >= 20 && val.length <= 45, {
    message: 'Cosmos address must be between 20 and 45 characters',
  })

/**
 * Bitcoin address schema (supports P2PKH, P2SH, and Bech32).
 */
export const BitcoinAddressSchema = z.string().refine(
  val => {
    // Bech32 (starts with bc1)
    if (val.startsWith('bc1')) {
      return /^bc1[a-z0-9]{39,59}$/i.test(val)
    }
    // Base58 addresses (P2PKH/P2SH)
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(val)
  },
  {
    message: 'Invalid Bitcoin address format',
  },
)

/**
 * Flow address schema (0x-prefixed hex, 16 characters).
 */
export const FlowAddressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{16}$/,
    'Invalid Flow address format (must be 0x followed by 16 hex characters)',
  )

/**
 * Starknet address schema (0x-prefixed hex, 66 characters).
 */
export const StarknetAddressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{64}$/,
    'Invalid Starknet address format (must be 0x followed by 64 hex characters)',
  )

/**
 * Algorand address schema (Base32, 58 characters).
 */
export const AlgorandAddressSchema = z
  .string()
  .regex(/^[A-Z2-7]{58}$/, 'Invalid Algorand address format (must be 58 Base32 characters)')

/**
 * Sui address schema (0x-prefixed hex, 66 characters).
 */
export const SuiAddressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{64}$/,
    'Invalid Sui address format (must be 0x followed by 64 hex characters)',
  )

/**
 * Tron address schema (Base58, 34 characters, starts with T).
 */
export const TronAddressSchema = z
  .string()
  .regex(
    /^T[a-km-zA-HJ-NP-Z1-9]{33}$/,
    'Invalid Tron address format (must start with T and be 34 characters)',
  )

/**
 * Address schema that validates based on chain type.
 * Follows RORO pattern (Receive an Object, Return an Object).
 */
export function createAddressSchema({ chainType }: { chainType: ChainType }) {
  switch (chainType) {
    case 'evm':
    case 'spark':
      return EvmAddressSchema
    case 'solana':
      return SolanaAddressSchema
    case 'cosmos':
      return CosmosAddressSchema
    case 'bitcoin':
      return BitcoinAddressSchema
    case 'flow':
      return FlowAddressSchema
    case 'starknet':
      return StarknetAddressSchema
    case 'algorand':
      return AlgorandAddressSchema
    case 'sui':
      return SuiAddressSchema
    case 'tron':
      return TronAddressSchema
    default:
      return z.string().min(1, 'Address is required')
  }
}

/**
 * Type-safe address validation function using zod schemas.
 * Performs basic format validation based on chain type.
 *
 * **Note**: This function performs basic format validation only. For production validation
 * with proper cryptographic verification, use the chain-specific libraries:
 * - **EVM**: `getAddress()` from `viem`
 * - **Solana**: `PublicKey` from `@solana/web3.js`
 * - **Cosmos**: `fromBech32()` from `@cosmjs/encoding`
 *
 * @param params - Validation parameters
 * @param params.address - Address to validate
 * @param params.chainType - Chain type for validation
 * @returns Validated address (normalized for EVM addresses)
 * @throws ZodError if validation fails
 *
 * @example
 * ```ts
 * import { validateAddress } from '@vencura/types/schemas'
 *
 * // Basic format validation
 * const address = validateAddress({
 *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
 *   chainType: 'evm'
 * })
 * ```
 */
export function validateAddress({
  address,
  chainType,
}: {
  address: string
  chainType: ChainType
}): string {
  const schema = createAddressSchema({ chainType })
  return schema.parse(address)
}
