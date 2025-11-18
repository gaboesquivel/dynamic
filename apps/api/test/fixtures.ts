// Test fixtures and constants for E2E tests

/**
 * IMPORTANT: Local Blockchain Testing Strategy
 *
 * When testing with local blockchain (Anvil), use Arbitrum Sepolia (421614) as the chain ID.
 * Dynamic SDK doesn't support localhost chains, so we use Arbitrum Sepolia chain ID for
 * wallet operations while RPC URLs point to localhost:8545 for actual transactions.
 *
 * Configuration:
 * - Set USE_LOCAL_BLOCKCHAIN=true (default)
 * - Set RPC_URL_421614=http://localhost:8545 to route Arbitrum Sepolia transactions to Anvil
 * - The WalletService automatically maps local chain IDs (31337) to 421614
 *
 * This allows us to:
 * - Test wallet signing functionality using Dynamic SDK (requires supported chain ID)
 * - Execute transactions on local Anvil blockchain (via localhost RPC)
 * - Reuse wallets across test runs (consistent test user per environment)
 */
export const TEST_CHAINS = {
  EVM: {
    /**
     * Arbitrum Sepolia (421614) - Use this for local blockchain testing.
     * Set RPC_URL_421614=http://localhost:8545 to route to Anvil.
     */
    ARBITRUM_SEPOLIA: 421614,
    BASE_SEPOLIA: 84532,
    ETHEREUM_SEPOLIA: 11155111,
    OPTIMISM_SEPOLIA: 11155420,
    POLYGON_AMOY: 80002,
  },
  SOLANA: {
    MAINNET: 'solana-mainnet',
    DEVNET: 'solana-devnet',
    TESTNET: 'solana-testnet',
  },
} as const

export const TEST_ADDRESSES = {
  EVM: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  SOLANA: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
} as const

export const TEST_MESSAGES = {
  SIMPLE: 'Hello, World!',
  EMPTY: '',
  LONG: 'A'.repeat(1000),
  SPECIAL_CHARS: 'Test message with special chars: !@#$%^&*()',
} as const

export const generateTestEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.vencura.com`

export const generateTestWalletId = () =>
  `wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`

/**
 * Test token addresses deployed on Arbitrum Sepolia (Chain ID: 421614).
 *
 * For local testing, tokens are automatically deployed to Anvil and addresses
 * are resolved dynamically. When using local blockchain, transactions will go
 * to localhost:8545 but the chain ID remains 421614 for Dynamic SDK compatibility.
 *
 * Token address resolution:
 * - Local chain: Addresses are obtained from token deployment script
 * - Testnet: Uses hardcoded addresses on Arbitrum Sepolia
 */
const TESTNET_TOKEN_ADDRESSES = {
  DNMC: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
  USDC: '0x6a2fE04d877439a44938D38709698d524BCF5c40',
  USDT: '0x5f036f0B6948d4593364f975b81caBB3206aD994',
} as const

/**
 * Get test token addresses, resolving local vs testnet automatically.
 * For local blockchain, uses deployed addresses from setup-tokens.
 * For testnet, uses hardcoded Arbitrum Sepolia addresses.
 */
export function getTestTokenAddresses(): Record<string, `0x${string}`> {
  // Check if using local blockchain
  const useLocalBlockchain = process.env.USE_LOCAL_BLOCKCHAIN !== 'false'

  if (useLocalBlockchain) {
    // Try to get deployed addresses from setup-tokens
    try {
      // Dynamic import to avoid circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getDeployedTokenAddresses } = require('./setup-tokens')
      const deployed = getDeployedTokenAddresses()

      // If we have deployed addresses, use them
      if (Object.keys(deployed).length > 0) {
        return deployed as Record<string, `0x${string}`>
      }
    } catch {
      // If setup-tokens hasn't run yet or failed, fall back to testnet addresses
      // This can happen if tokens haven't been deployed yet
    }
  }

  // Default to testnet addresses
  return TESTNET_TOKEN_ADDRESSES as Record<string, `0x${string}`>
}

/**
 * Test token addresses (backward compatibility).
 * Use getTestTokenAddresses() for dynamic resolution.
 */
export const TEST_TOKEN_ADDRESSES = getTestTokenAddresses()

// Token decimals mapping
export const TEST_TOKEN_DECIMALS = {
  DNMC: 18,
  USDC: 6,
  USDT: 6,
} as const
