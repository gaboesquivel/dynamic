import { z } from 'zod'
import { tool } from 'ai'
import { WalletService } from '../../wallet/wallet.service'

const getWalletsParams = z.object({})
const createWalletParams = z.object({
  chainId: z.union([z.number(), z.string()]).describe('Chain ID or Dynamic network ID'),
})
const getBalanceParams = z.object({
  walletId: z.string().describe('The wallet ID'),
})
const sendTransactionParams = z.object({
  walletId: z.string().describe('The wallet ID'),
  to: z.string().describe('Recipient address'),
  amount: z.number().positive().describe('Amount to send'),
})
const signMessageParams = z.object({
  walletId: z.string().describe('The wallet ID'),
  message: z.string().describe('Message to sign'),
})

export function createWalletTools(walletService: WalletService, userId: string) {
  return {
    getWallets: tool({
      description: 'Get all wallets for the authenticated user',
      parameters: getWalletsParams,
      // @ts-expect-error TS2769 - AI SDK v5 tool() function has type inference issues with execute parameter
      execute: async () => walletService.getUserWallets(userId),
    }),
    createWallet: tool({
      description:
        'Create a new custodial wallet on a specific chain. Provide chainId as a number (e.g., 421614 for Arbitrum Sepolia) or Dynamic network ID string (e.g., "solana-mainnet" for Solana).',
      parameters: createWalletParams,
      // @ts-expect-error TS2769 - AI SDK v5 tool() function has type inference issues with execute parameter
      execute: async ({ chainId }: z.infer<typeof createWalletParams>) =>
        walletService.createWallet(userId, chainId),
    }),
    getBalance: tool({
      description: 'Get the balance of a specific wallet',
      parameters: getBalanceParams,
      // @ts-expect-error TS2769 - AI SDK v5 tool() function has type inference issues with execute parameter
      execute: async ({ walletId }: z.infer<typeof getBalanceParams>) =>
        walletService.getBalance(walletId, userId),
    }),
    sendTransaction: tool({
      description: 'Send a transaction from a wallet to another address',
      parameters: sendTransactionParams,
      // @ts-expect-error TS2769 - AI SDK v5 tool() function has type inference issues with execute parameter
      execute: async ({ walletId, to, amount }: z.infer<typeof sendTransactionParams>) =>
        walletService.sendTransaction(walletId, userId, to, amount),
    }),
    signMessage: tool({
      description: 'Sign a message with a wallet private key',
      parameters: signMessageParams,
      // @ts-expect-error TS2769 - AI SDK v5 tool() function has type inference issues with execute parameter
      execute: async ({ walletId, message }: z.infer<typeof signMessageParams>) =>
        walletService.signMessage(walletId, userId, message),
    }),
  }
}
