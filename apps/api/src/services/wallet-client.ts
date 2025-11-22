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
  chainType,
}: {
  chainType: ChainType
}) {
  // Use dynamic import for ESM module compatibility
  // This matches the pattern used in dynamic-examples/nodejs-omnibus-sweep
  const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')

  // Temporarily suppress console.error for expected wallet creation errors
  // The Dynamic SDK logs these errors before throwing, but they're expected and handled gracefully:
  // - "Multiple wallets per chain" - wallet already exists for this chain
  // - "Error creating wallet account" - wallet already exists (idempotent behavior)
  const originalConsoleError = console.error
  const suppressedConsoleError = (...args: unknown[]) => {
    // Check if this is an expected wallet creation error log from Dynamic SDK
    const logMessage = String(args.join(' ')).toLowerCase()
    const isDynamicSdkError =
      logMessage.includes('[dynamicwaaswalletclient]') && logMessage.includes('[error]')

    if (isDynamicSdkError) {
      // Suppress errors related to wallet already existing (expected idempotent behavior)
      if (
        logMessage.includes('multiple wallets per chain') ||
        logMessage.includes('multiple wallets') ||
        logMessage.includes('error creating wallet account') ||
        logMessage.includes('dynamicServerInitializeKeyGen')
      ) {
        // Suppress this specific error log - it's expected and handled gracefully
        return
      }
    }
    // For all other errors, use the original console.error
    originalConsoleError(...args)
  }

  try {
    switch (chainType) {
      case 'evm': {
        const client = await getEvmClient()
        // Temporarily override console.error to suppress "Multiple wallets" errors
        console.error = suppressedConsoleError
        try {
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
        } finally {
          // Restore original console.error
          console.error = originalConsoleError
        }
      }
      case 'solana': {
        const client = await getSolanaClient()
        // Temporarily override console.error to suppress "Multiple wallets" errors
        console.error = suppressedConsoleError
        try {
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
        } finally {
          // Restore original console.error
          console.error = originalConsoleError
        }
      }
      default:
        throw new Error(`Unsupported chain type: ${chainType}`)
    }
  } catch (error) {
    // Restore console.error if it was overridden (in case of early return)
    console.error = originalConsoleError

    // Re-throw the error (it will be handled by wallet.service.ts)
    throw error
  }
}
