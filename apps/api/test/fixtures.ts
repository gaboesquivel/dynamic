// Test fixtures and constants for E2E tests

export const TEST_CHAINS = {
  EVM: {
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
