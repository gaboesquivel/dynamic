import { z } from 'zod'
import { tool } from 'ai'
import { WalletService } from '../../wallet/wallet.service'

export function createWalletTools(walletService: WalletService, userId: string) {
  return {
    // @ts-expect-error - AI SDK v5 type definitions have issues with tool function
    getWallets: tool({
      description: 'Get all wallets for the authenticated user',
      parameters: z.object({}),
      execute: async () => walletService.getUserWallets(userId),
    }),
    // @ts-expect-error - AI SDK v5 type definitions have issues with tool function
    createWallet: tool({
      description:
        'Create a new custodial wallet on a specific chain. Provide chainId as a number (e.g., 421614 for Arbitrum Sepolia) or Dynamic network ID string (e.g., "solana-mainnet" for Solana).',
      parameters: z.object({
        chainId: z.union([z.number(), z.string()]).describe('Chain ID or Dynamic network ID'),
      }),
      execute: async ({ chainId }: { chainId: number | string }) =>
        walletService.createWallet(userId, chainId),
    }),
    // @ts-expect-error - AI SDK v5 type definitions have issues with tool function
    getBalance: tool({
      description: 'Get the balance of a specific wallet',
      parameters: z.object({
        walletId: z.string().describe('The wallet ID'),
      }),
      execute: async ({ walletId }: { walletId: string }) =>
        walletService.getBalance(walletId, userId),
    }),
    // @ts-expect-error - AI SDK v5 type definitions have issues with tool function
    sendTransaction: tool({
      description: 'Send a transaction from a wallet to another address',
      parameters: z.object({
        walletId: z.string().describe('The wallet ID'),
        to: z.string().describe('Recipient address'),
        amount: z.number().positive().describe('Amount to send'),
      }),
      execute: async ({ walletId, to, amount }: { walletId: string; to: string; amount: number }) =>
        walletService.sendTransaction(walletId, userId, to, amount),
    }),
    // @ts-expect-error - AI SDK v5 type definitions have issues with tool function
    signMessage: tool({
      description: 'Sign a message with a wallet private key',
      parameters: z.object({
        walletId: z.string().describe('The wallet ID'),
        message: z.string().describe('Message to sign'),
      }),
      execute: async ({ walletId, message }: { walletId: string; message: string }) =>
        walletService.signMessage(walletId, userId, message),
    }),
  }
}
