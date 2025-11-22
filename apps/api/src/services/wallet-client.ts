import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm'
import type { DynamicSolanaWalletClient } from '@dynamic-labs-wallet/node-svm'
import { type ChainType } from '@vencura/lib'
import { zEnv } from '../lib/env'

let evmClient: DynamicEvmWalletClient | null = null
let solanaClient: DynamicSolanaWalletClient | null = null

/**
 * Reset clients (useful for testing)
 */
export function resetClients(): void {
  evmClient = null
  solanaClient = null
}

/**
 * Get singleton EVM wallet client.
 * CRITICAL: Must not recreate on every request - Dynamic SDK instantiation is expensive.
 * Matches NestJS pattern: dynamic import for ESM compatibility, authenticate after instantiation.
 */
export async function getEvmClient(): Promise<DynamicEvmWalletClient> {
  if (!evmClient) {
    // Use dynamic import for ESM module compatibility
    // Dynamic SDK packages are ESM-only - dynamic import() works from CommonJS
    // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
    const module = await import('@dynamic-labs-wallet/node-evm')
    const DynamicEvmWalletClientClass = module.DynamicEvmWalletClient
    evmClient = new DynamicEvmWalletClientClass({ environmentId: zEnv.DYNAMIC_ENVIRONMENT_ID })
    await evmClient.authenticateApiToken(zEnv.DYNAMIC_API_TOKEN)
  }
  return evmClient
}

/**
 * Get singleton Solana wallet client.
 * CRITICAL: Must not recreate on every request - Dynamic SDK instantiation is expensive.
 * Matches NestJS pattern: dynamic import for ESM compatibility, authenticate after instantiation.
 */
export async function getSolanaClient(): Promise<DynamicSolanaWalletClient> {
  if (!solanaClient) {
    // Use dynamic import for ESM module compatibility
    // Dynamic SDK packages are ESM-only - dynamic import() works from CommonJS
    // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
    const module = await import('@dynamic-labs-wallet/node-svm')
    const DynamicSolanaWalletClientClass = module.DynamicSolanaWalletClient
    solanaClient = new DynamicSolanaWalletClientClass({
      environmentId: zEnv.DYNAMIC_ENVIRONMENT_ID,
    })
    await solanaClient.authenticateApiToken(zEnv.DYNAMIC_API_TOKEN)
  }
  return solanaClient
}

/**
 * Create wallet using appropriate client based on chain type.
 * Matches NestJS pattern: uses ThresholdSignatureScheme.TWO_OF_TWO and backUpToClientShareService: false.
 */
export async function createWallet({
  userId,
  chainType,
}: {
  userId: string
  chainType: ChainType
}) {
  // Use dynamic import for ESM module compatibility
  // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
  const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')

  switch (chainType) {
    case 'evm': {
      const client = await getEvmClient()
      // Leverage Dynamic SDK return type directly - no unnecessary mapping
      // Matches NestJS pattern: thresholdSignatureScheme and backUpToClientShareService
      const result = await client.createWalletAccount({
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
        backUpToClientShareService: false,
      })
      return {
        accountAddress: result.accountAddress,
        externalServerKeyShares: result.externalServerKeyShares,
      }
    }
    case 'solana': {
      const client = await getSolanaClient()
      // Leverage Dynamic SDK return type directly - no unnecessary mapping
      // Matches NestJS pattern: thresholdSignatureScheme and backUpToClientShareService
      const result = await client.createWalletAccount({
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
        backUpToClientShareService: false,
      })
      return {
        accountAddress: result.accountAddress,
        externalServerKeyShares: result.externalServerKeyShares,
      }
    }
    default:
      throw new Error(`Unsupported chain type: ${chainType}`)
  }
}
