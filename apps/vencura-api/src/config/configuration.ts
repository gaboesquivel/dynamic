export default () => {
  const dynamicEnvironmentId = process.env.DYNAMIC_ENVIRONMENT_ID
  const dynamicApiToken = process.env.DYNAMIC_API_TOKEN
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!dynamicEnvironmentId)
    throw new Error('DYNAMIC_ENVIRONMENT_ID environment variable is required')

  if (!dynamicApiToken) throw new Error('DYNAMIC_API_TOKEN environment variable is required')

  if (!encryptionKey || encryptionKey.length < 32)
    throw new Error(
      'ENCRYPTION_KEY environment variable is required and must be at least 32 characters',
    )

  // Collect all RPC URL overrides from environment variables
  // Format: RPC_URL_<CHAIN_ID>=... or RPC_URL_<DYNAMIC_NETWORK_ID>=...
  const rpcUrls: Record<string, string> = {}

  // Backward compatibility: Support old ARBITRUM_SEPOLIA_RPC_URL
  if (process.env.ARBITRUM_SEPOLIA_RPC_URL) rpcUrls['421614'] = process.env.ARBITRUM_SEPOLIA_RPC_URL

  // Collect all RPC_URL_* environment variables
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('RPC_URL_')) {
      const chainId = key.replace('RPC_URL_', '')
      const rpcUrl = process.env[key]
      if (rpcUrl) rpcUrls[chainId] = rpcUrl
    }
  })

  // Chain-specific RPC URLs (e.g., SOLANA_RPC_URL, COSMOS_RPC_URL)
  const solanaRpcUrl = process.env.SOLANA_RPC_URL
  if (solanaRpcUrl) {
    rpcUrls['solana-mainnet'] = solanaRpcUrl
    rpcUrls['solana-devnet'] = solanaRpcUrl
    rpcUrls['solana-testnet'] = solanaRpcUrl
  }

  return {
    port: parseInt(process.env.PORT || '3077', 10),
    dynamic: {
      environmentId: dynamicEnvironmentId,
      apiToken: dynamicApiToken,
    },
    rpc: rpcUrls,
    encryption: {
      key: encryptionKey,
    },
  }
}
