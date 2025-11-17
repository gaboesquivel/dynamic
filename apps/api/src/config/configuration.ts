import { z } from 'zod'
import { validateEnv } from './env.schema'

/**
 * Schema for RPC URL configuration.
 * Validates that RPC URLs are valid URLs when provided.
 */
const rpcUrlSchema = z.string().url().optional()

export default () => {
  // Validate required environment variables using zod
  const validatedEnv = validateEnv()

  // Collect all RPC URL overrides from environment variables
  // Format: RPC_URL_<CHAIN_ID>=... or RPC_URL_<DYNAMIC_NETWORK_ID>=...
  const rpcUrls: Record<string, string> = {}

  // Backward compatibility: Support old ARBITRUM_SEPOLIA_RPC_URL
  if (validatedEnv.ARBITRUM_SEPOLIA_RPC_URL) {
    rpcUrls['421614'] = validatedEnv.ARBITRUM_SEPOLIA_RPC_URL
  }

  // Collect all RPC_URL_* environment variables with validation
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('RPC_URL_')) {
      const chainId = key.replace('RPC_URL_', '')
      const rpcUrl = process.env[key]
      if (rpcUrl) {
        // Validate URL format
        const validation = rpcUrlSchema.safeParse(rpcUrl)
        if (validation.success && validation.data) {
          rpcUrls[chainId] = validation.data
        } else {
          console.warn(`Invalid RPC URL format for ${key}: ${rpcUrl}`)
        }
      }
    }
  })

  // Chain-specific RPC URLs (e.g., SOLANA_RPC_URL, COSMOS_RPC_URL)
  if (validatedEnv.SOLANA_RPC_URL) {
    rpcUrls['solana-mainnet'] = validatedEnv.SOLANA_RPC_URL
    rpcUrls['solana-devnet'] = validatedEnv.SOLANA_RPC_URL
    rpcUrls['solana-testnet'] = validatedEnv.SOLANA_RPC_URL
  }

  return {
    port: validatedEnv.PORT ?? 3077,
    dynamic: {
      environmentId: validatedEnv.DYNAMIC_ENVIRONMENT_ID,
      apiToken: validatedEnv.DYNAMIC_API_TOKEN,
    },
    rpc: rpcUrls,
    encryption: {
      key: validatedEnv.ENCRYPTION_KEY,
    },
    ai: {
      openAiKey: validatedEnv.OPEN_AI_KEY,
    },
  }
}
