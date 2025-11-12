// Supported chains configuration
export interface ChainOption {
  chainId: number | string
  name: string
  chainType:
    | 'evm'
    | 'solana'
    | 'cosmos'
    | 'bitcoin'
    | 'flow'
    | 'starknet'
    | 'algorand'
    | 'sui'
    | 'spark'
    | 'tron'
  currency: string
  testnet?: boolean
}

export const SUPPORTED_CHAINS: ChainOption[] = [
  // EVM Chains
  { chainId: 1, name: 'Ethereum Mainnet', chainType: 'evm', currency: 'ETH' },
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    chainType: 'evm',
    currency: 'ETH',
    testnet: true,
  },
  { chainId: 42161, name: 'Arbitrum One', chainType: 'evm', currency: 'ETH' },
  {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    chainType: 'evm',
    currency: 'ETH',
    testnet: true,
  },
  { chainId: 8453, name: 'Base Mainnet', chainType: 'evm', currency: 'ETH' },
  {
    chainId: 84532,
    name: 'Base Sepolia',
    chainType: 'evm',
    currency: 'ETH',
    testnet: true,
  },
  { chainId: 10, name: 'Optimism', chainType: 'evm', currency: 'ETH' },
  {
    chainId: 11155420,
    name: 'Optimism Sepolia',
    chainType: 'evm',
    currency: 'ETH',
    testnet: true,
  },
  { chainId: 137, name: 'Polygon', chainType: 'evm', currency: 'MATIC' },
  {
    chainId: 80002,
    name: 'Polygon Amoy',
    chainType: 'evm',
    currency: 'MATIC',
    testnet: true,
  },
  // Solana
  {
    chainId: 'solana-mainnet',
    name: 'Solana Mainnet',
    chainType: 'solana',
    currency: 'SOL',
  },
  {
    chainId: 'solana-devnet',
    name: 'Solana Devnet',
    chainType: 'solana',
    currency: 'SOL',
    testnet: true,
  },
  {
    chainId: 'solana-testnet',
    name: 'Solana Testnet',
    chainType: 'solana',
    currency: 'SOL',
    testnet: true,
  },
]

export function getChainByNetworkId(networkId: string): ChainOption | undefined {
  return SUPPORTED_CHAINS.find(chain => String(chain.chainId) === networkId)
}

export function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded, typically 32-44 characters
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

export function isValidAddress(address: string, chainType?: string): boolean {
  if (chainType === 'solana') {
    return isValidSolanaAddress(address)
  }
  // Default to EVM validation
  return isValidEVMAddress(address)
}
