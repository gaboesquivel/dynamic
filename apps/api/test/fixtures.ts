// Test fixtures and constants for E2E tests

/**
 * Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614).
 * All test wallets and transactions use the Arbitrum Sepolia network.
 */
export const TEST_CHAINS = {
  EVM: {
    /**
     * Arbitrum Sepolia (421614) - Primary testnet for all API tests.
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
 * These are mock tokens deployed on the Arbitrum Sepolia testnet.
 */
export const TEST_TOKEN_ADDRESSES = {
  DNMC: '0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F',
  USDC: '0x6a2fE04d877439a44938D38709698d524BCF5c40',
  USDT: '0x5f036f0B6948d4593364f975b81caBB3206aD994',
} as const

// Token decimals mapping
export const TEST_TOKEN_DECIMALS = {
  DNMC: 18,
  USDC: 6,
  USDT: 6,
} as const
