import { createHelloClient } from './hello.client'

export interface VencuraClientConfig {
  baseUrl: string
  headers?: Record<string, string>
}

export const createVencuraClient = (config: VencuraClientConfig) => {
  const helloClient = createHelloClient({
    baseUrl: config.baseUrl,
    headers: config.headers,
  })

  return {
    hello: helloClient.hello,
  }
}

export type VencuraClient = ReturnType<typeof createVencuraClient>
