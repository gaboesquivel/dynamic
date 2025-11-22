import { createHelloClient } from './hello.client'
import { createWalletClient } from './wallet.client'

export interface VencuraClientConfig {
  baseUrl: string
  headers?: Record<string, string>
}

export const createVencuraClient = (config: VencuraClientConfig) => {
  const helloClient = createHelloClient({
    baseUrl: config.baseUrl,
    headers: config.headers,
  })

  const walletClient = createWalletClient({
    baseUrl: config.baseUrl,
    headers: config.headers,
  })

  return {
    hello: helloClient.hello,
    createWallet: walletClient.createWallet,
    listWallets: walletClient.listWallets,
    sendTransaction: walletClient.sendTransaction,
    getBalance: walletClient.getBalance,
  }
}

export type VencuraClient = ReturnType<typeof createVencuraClient>
