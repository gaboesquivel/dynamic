/**
 * Token deployment script for local Anvil blockchain.
 *
 * Automatically deploys test tokens (USDT, USDC, DNMC) to local Anvil before tests run.
 * Checks if tokens are already deployed and only deploys if missing.
 */

import { execSync } from 'child_process'
import { resolve } from 'path'
import { createPublicClient, http, type Address } from 'viem'
import { foundry } from 'viem/chains'
import { delay } from '@vencura/lib'

const ANVIL_RPC_URL = 'http://localhost:8545'
const ANVIL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' // Anvil's default account

interface TokenConfig {
  name: string
  symbol: string
  decimals: number
  scriptPath: string
}

const TOKEN_CONFIGS: Record<string, TokenConfig> = {
  DNMC: {
    name: 'Dynamic Arcade Token',
    symbol: 'DNMC',
    decimals: 18,
    scriptPath: 'script/DNMC.s.sol:DNMCScript',
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    scriptPath: 'script/USDC.s.sol:USDCScript',
  },
  USDT: {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    scriptPath: 'script/USDT.s.sol:USDTScript',
  },
}

// Store deployed addresses
const deployedAddresses: Record<string, Address> = {}

/**
 * Check if a contract exists at the given address by checking if it has code.
 */
async function contractExists(address: Address, rpcUrl: string): Promise<boolean> {
  try {
    const client = createPublicClient({
      chain: foundry,
      transport: http(rpcUrl),
    })

    const code = await client.getBytecode({ address })
    return code !== undefined && code !== '0x'
  } catch {
    return false
  }
}

/**
 * Deploy a token using Foundry script.
 */
function deployToken(
  tokenKey: string,
  config: TokenConfig,
  rpcUrl: string,
  privateKey: string,
): Address | null {
  try {
    // Resolve contracts directory relative to this file
    const contractsDir = resolve(__dirname, '../../../contracts/evm')

    console.log(`Deploying ${tokenKey} (${config.symbol}) to local Anvil...`)

    // Run forge script to deploy token
    const command = `cd ${contractsDir} && forge script ${config.scriptPath} --rpc-url ${rpcUrl} --broadcast --private-key ${privateKey} --json`

    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
    })

    // Parse forge output to extract deployed address
    // Forge outputs JSON with deployment information
    const lines = output.split('\n')
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        if (json.deployedAddresses && Object.keys(json.deployedAddresses).length > 0) {
          const addresses = Object.values(json.deployedAddresses) as string[]
          if (addresses.length > 0) {
            const address = addresses[addresses.length - 1] as Address
            console.log(`✓ ${tokenKey} deployed at: ${address}`)
            return address
          }
        }
      } catch {
        // Not JSON, continue
      }
    }

    // Fallback: try to extract address from console.log output
    const addressMatch = output.match(/deployed at: (0x[a-fA-F0-9]{40})/i)
    if (addressMatch) {
      const address = addressMatch[1] as Address
      console.log(`✓ ${tokenKey} deployed at: ${address}`)
      return address
    }

    console.warn(`Could not extract deployed address for ${tokenKey} from forge output`)
    return null
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Failed to deploy ${tokenKey}: ${errorMessage}`)
    return null
  }
}

/**
 * Get or deploy a token, checking if it already exists first.
 */
async function getOrDeployToken(
  tokenKey: string,
  config: TokenConfig,
  rpcUrl: string,
  privateKey: string,
): Promise<Address | null> {
  // Check if we already have the address stored
  if (deployedAddresses[tokenKey]) {
    const exists = await contractExists(deployedAddresses[tokenKey], rpcUrl)
    if (exists) {
      console.log(`✓ ${tokenKey} already deployed at: ${deployedAddresses[tokenKey]}`)
      return deployedAddresses[tokenKey]
    }
  }

  // Deploy the token
  const address = deployToken(tokenKey, config, rpcUrl, privateKey)
  if (address) {
    deployedAddresses[tokenKey] = address
    // Wait a bit for the deployment to be confirmed
    await delay(500)
  }

  return address
}

/**
 * Deploy all test tokens to local Anvil.
 * Returns a map of token symbols to deployed addresses.
 */
export async function deployTestTokens(): Promise<Record<string, Address>> {
  // Only deploy if using local blockchain
  if (process.env.USE_LOCAL_BLOCKCHAIN === 'false') {
    console.log('Skipping token deployment (not using local blockchain)')
    return {}
  }

  const rpcUrl = process.env.RPC_URL_421614 || ANVIL_RPC_URL

  // Check if Anvil is running
  try {
    const client = createPublicClient({
      chain: foundry,
      transport: http(rpcUrl),
    })
    await client.getBlockNumber()
  } catch {
    console.warn('Anvil is not running. Token deployment will be skipped.')
    return {}
  }

  console.log('Deploying test tokens to local Anvil...')

  const addresses: Record<string, Address> = {}

  for (const [tokenKey, config] of Object.entries(TOKEN_CONFIGS)) {
    const address = await getOrDeployToken(tokenKey, config, rpcUrl, ANVIL_PRIVATE_KEY)
    if (address) {
      addresses[tokenKey] = address
    }
  }

  if (Object.keys(addresses).length > 0) {
    console.log('✓ Test tokens deployed successfully')
  } else {
    console.warn('⚠ No tokens were deployed')
  }

  return addresses
}

/**
 * Get deployed token addresses.
 * Returns addresses from deployment or empty object if not deployed.
 */
export function getDeployedTokenAddresses(): Record<string, Address> {
  return { ...deployedAddresses }
}

