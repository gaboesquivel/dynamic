import type { Api } from '@vencura/core'

/**
 * Fetcher function for getting all wallets.
 * @param client - Vencura API client instance
 * @returns Promise resolving to array of wallets
 */
export const fetchWallets = (client: Api<unknown>) =>
  client.wallets
    .walletControllerGetWallets()
    .then((r: Awaited<ReturnType<typeof client.wallets.walletControllerGetWallets>>) => r.data)

/**
 * Fetcher function for getting wallet balance.
 * @param client - Vencura API client instance
 * @param id - Wallet ID
 * @returns Promise resolving to wallet balance
 */
export const fetchBalance = (client: Api<unknown>, id: string) =>
  client.wallets
    .walletControllerGetBalance({ id })
    .then((r: Awaited<ReturnType<typeof client.wallets.walletControllerGetBalance>>) => r.data)

/**
 * Fetcher function for creating a wallet.
 * @param client - Vencura API client instance
 * @param dto - Create wallet DTO
 * @returns Promise resolving to created wallet
 */
export const createWallet = (
  client: Api<unknown>,
  dto: Parameters<Api<unknown>['wallets']['walletControllerCreateWallet']>[0],
) =>
  client.wallets
    .walletControllerCreateWallet(dto)
    .then((r: Awaited<ReturnType<typeof client.wallets.walletControllerCreateWallet>>) => r.data)

/**
 * Fetcher function for signing a message.
 * @param client - Vencura API client instance
 * @param id - Wallet ID
 * @param dto - Sign message DTO
 * @returns Promise resolving to signed message response
 */
export const signMessage = (
  client: Api<unknown>,
  id: string,
  dto: Parameters<Api<unknown>['wallets']['walletControllerSignMessage']>[1],
) =>
  client.wallets
    .walletControllerSignMessage({ id }, dto)
    .then((r: Awaited<ReturnType<typeof client.wallets.walletControllerSignMessage>>) => r.data)

/**
 * Fetcher function for sending a transaction.
 * @param client - Vencura API client instance
 * @param id - Wallet ID
 * @param dto - Send transaction DTO
 * @returns Promise resolving to transaction hash response
 */
export const sendTransaction = (
  client: Api<unknown>,
  id: string,
  dto: Parameters<Api<unknown>['wallets']['walletControllerSendTransaction']>[1],
) =>
  client.wallets
    .walletControllerSendTransaction({ id }, dto)
    .then((r: Awaited<ReturnType<typeof client.wallets.walletControllerSendTransaction>>) => r.data)
