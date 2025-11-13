import { initClient } from '@ts-rest/core'
import { walletContract } from '@vencura/types'

export interface VencuraClientConfig {
  /**
   * Base URL for the Vencura API.
   * @example "https://api.vencura.com"
   */
  baseUrl?: string
  /**
   * Default headers to include with all requests.
   * @example { Authorization: "Bearer token" }
   */
  headers?: Record<string, string>
}

/**
 * Creates a Vencura API client using ts-rest contracts.
 * Provides type-safe methods for interacting with the Vencura API.
 *
 * @example
 * ```ts
 * import { createVencuraClient } from '@vencura/core'
 *
 * const client = createVencuraClient({
 *   baseUrl: 'https://api.vencura.com',
 *   headers: { Authorization: 'Bearer token' }
 * })
 *
 * const wallets = await client.wallet.list()
 * ```
 */
export function createVencuraClient(config: VencuraClientConfig = {}) {
  const { baseUrl = '', headers = {} } = config

  const client = initClient(walletContract, {
    baseUrl,
    baseHeaders: headers,
  })

  return {
    wallet: client,
  }
}

export type VencuraClient = ReturnType<typeof createVencuraClient>
