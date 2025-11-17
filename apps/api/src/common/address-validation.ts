import { getAddress } from 'viem'
import { PublicKey } from '@solana/web3.js'
import { fromBech32 } from '@cosmjs/encoding'
import type { ChainType } from '@vencura/types'

/**
 * Validate EVM address using viem's getAddress (per viem rules).
 * Never cast directly as Address type - always use getAddress().
 */
export function validateEvmAddress({ address }: { address: string }): boolean {
  try {
    getAddress(address)
    return true
  } catch {
    return false
  }
}

/**
 * Validate Solana address using PublicKey constructor.
 * Solana addresses are Base58 encoded, typically 32-44 characters.
 */
export function validateSolanaAddress({ address }: { address: string }): boolean {
  try {
    const publicKey = new PublicKey(address)
    return PublicKey.isOnCurve(publicKey)
  } catch {
    return false
  }
}

/**
 * Validate Cosmos address (Bech32 format) using @cosmjs/encoding.
 * Format: {prefix}{separator}{data} where prefix is chain-specific (e.g., "cosmos", "osmo").
 * Standard addresses are 20 bytes (160 bits).
 */
export function validateCosmosAddress({ address }: { address: string }): boolean {
  try {
    const { data } = fromBech32(address)
    // Standard Cosmos addresses are 20 bytes (160 bits)
    return data.length === 20
  } catch {
    return false
  }
}

/**
 * Validate Bitcoin address.
 * Supports P2PKH (starts with 1), P2SH (starts with 3), Bech32 P2WPKH/P2WSH (starts with bc1).
 */
export function validateBitcoinAddress({ address }: { address: string }): boolean {
  // P2PKH: Base58, starts with '1', 26-35 chars
  // P2SH: Base58, starts with '3', 26-35 chars
  // Bech32: starts with 'bc1', 42-62 chars
  if (address.startsWith('bc1')) {
    const bech32Regex = /^bc1[a-z0-9]{39,59}$/i
    return bech32Regex.test(address)
  }
  // Base58 addresses (P2PKH/P2SH)
  const base58Regex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
  return base58Regex.test(address)
}

/**
 * Validate Flow address.
 * Format: 0x-prefixed hex, exactly 16 characters (8 bytes).
 */
export function validateFlowAddress({ address }: { address: string }): boolean {
  const flowRegex = /^0x[a-fA-F0-9]{16}$/
  return flowRegex.test(address)
}

/**
 * Validate Starknet address.
 * Format: 0x-prefixed hex, 66 characters (32 bytes + 2 for 0x).
 */
export function validateStarknetAddress({ address }: { address: string }): boolean {
  const starknetRegex = /^0x[a-fA-F0-9]{64}$/
  return starknetRegex.test(address)
}

/**
 * Validate Algorand address.
 * Format: Base32 encoded, 58 characters.
 */
export function validateAlgorandAddress({ address }: { address: string }): boolean {
  // Algorand addresses are Base32 encoded, exactly 58 characters
  const algorandRegex = /^[A-Z2-7]{58}$/
  return algorandRegex.test(address)
}

/**
 * Validate Sui address.
 * Format: 0x-prefixed hex, 66 characters (32 bytes + 2 for 0x).
 */
export function validateSuiAddress({ address }: { address: string }): boolean {
  const suiRegex = /^0x[a-fA-F0-9]{64}$/
  return suiRegex.test(address)
}

/**
 * Validate Spark address.
 * Format: Similar to EVM (0x-prefixed hex, 40 chars).
 */
export function validateSparkAddress({ address }: { address: string }): boolean {
  // Spark uses EVM-compatible addresses
  return validateEvmAddress({ address })
}

/**
 * Validate Tron address.
 * Format: Base58 encoded, 34 characters, starts with 'T'.
 */
export function validateTronAddress({ address }: { address: string }): boolean {
  // Tron addresses are Base58, start with 'T', exactly 34 characters
  const tronRegex = /^T[a-km-zA-HJ-NP-Z1-9]{33}$/
  return tronRegex.test(address)
}

/**
 * Validate address based on chain type.
 * Follows RORO pattern (Receive an Object, Return an Object).
 */
export function validateAddress({
  address,
  chainType,
}: {
  address: string
  chainType: ChainType
}): boolean {
  switch (chainType) {
    case 'evm':
      return validateEvmAddress({ address })
    case 'solana':
      return validateSolanaAddress({ address })
    case 'cosmos':
      return validateCosmosAddress({ address })
    case 'bitcoin':
      return validateBitcoinAddress({ address })
    case 'flow':
      return validateFlowAddress({ address })
    case 'starknet':
      return validateStarknetAddress({ address })
    case 'algorand':
      return validateAlgorandAddress({ address })
    case 'sui':
      return validateSuiAddress({ address })
    case 'spark':
      return validateSparkAddress({ address })
    case 'tron':
      return validateTronAddress({ address })
    default:
      return false
  }
}
