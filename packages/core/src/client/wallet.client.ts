import {
  createWalletContract,
  sendTransactionContract,
  listWalletsContract,
  balanceContract,
  WalletSchema,
  CreateWalletInputSchema,
  SendTransactionInputSchema,
  SendTransactionResultSchema,
  ListWalletsResponseSchema,
  BalanceInputSchema,
  BalanceSchema,
  type Wallet,
  type CreateWalletInput,
  type SendTransactionInput,
  type SendTransactionResult,
  type ListWalletsResponse,
  type BalanceInput,
  type Balance,
} from '@vencura/types'
import { fetchWithTimeout } from '@vencura/lib'

export const createWalletClient = ({
  baseUrl,
  headers,
}: {
  baseUrl: string
  headers?: Record<string, string>
}) => {
  const createWallet = async (input: CreateWalletInput): Promise<Wallet> => {
    const response = await fetchWithTimeout({
      url: `${baseUrl}${createWalletContract.path}`,
      options: {
        method: createWalletContract.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(CreateWalletInputSchema.parse(input)),
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return WalletSchema.parse(data)
  }

  const listWallets = async (): Promise<ListWalletsResponse> => {
    const response = await fetchWithTimeout({
      url: `${baseUrl}${listWalletsContract.path}`,
      options: {
        method: listWalletsContract.method,
        headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return ListWalletsResponseSchema.parse(data)
  }

  const sendTransaction = async ({
    walletId,
    ...input
  }: SendTransactionInput & { walletId: string }): Promise<SendTransactionResult> => {
    if (!walletId || typeof walletId !== 'string') {
      throw new Error('walletId must be a non-empty string')
    }
    const path = sendTransactionContract.path.replace(':id', encodeURIComponent(walletId))
    const response = await fetchWithTimeout({
      url: `${baseUrl}${path}`,
      options: {
        method: sendTransactionContract.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(SendTransactionInputSchema.parse(input)),
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return SendTransactionResultSchema.parse(data)
  }

  const getBalance = async (input: BalanceInput): Promise<Balance> => {
    const response = await fetchWithTimeout({
      url: `${baseUrl}${balanceContract.path}`,
      options: {
        method: balanceContract.method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(BalanceInputSchema.parse(input)),
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return BalanceSchema.parse(data)
  }

  return {
    createWallet,
    listWallets,
    sendTransaction,
    getBalance,
  }
}
