import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { useVencuraClient } from '../context'
import type { SendTransactionResult } from '@vencura/core'
import { SendTransactionResult as SendTransactionResultSchema } from '@vencura/types/schemas'
import { validateResponse } from '../validate'
import { encodeTokenMint, encodeTokenBurn } from '../utils/token-encoding'
import type { Address, Abi } from 'viem'
import { walletsKeys } from './keys'

/**
 * Input for mint token operation.
 */
export interface MintTokenInput {
  walletId: string
  tokenAddress: Address
  recipient: Address
  amount: bigint
  abi: Abi
}

/**
 * Input for burn token operation.
 */
export interface BurnTokenInput {
  walletId: string
  tokenAddress: Address
  account: Address
  amount: bigint
  abi: Abi
}

/**
 * Token balance result.
 */
export interface TokenBalance {
  balance: bigint
}

/**
 * Token supply result.
 */
export interface TokenSupply {
  supply: bigint
}

/**
 * Hook to mint ERC20 tokens via contract call.
 * Encodes the mint function call and uses the generic transaction endpoint.
 *
 * @param options - Optional React Query mutation options
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * import { useMintToken } from '@vencura/react'
 * import { parseUnits } from 'viem'
 * import { testnetTokenAbi } from '@vencura/evm/abis'
 *
 * function MintButton({ walletId, tokenAddress }: Props) {
 *   const mintToken = useMintToken({
 *     onSuccess: (data) => {
 *       console.log('Mint transaction:', data.transactionHash)
 *     },
 *   })
 *
 *   return (
 *     <button
 *       onClick={() =>
 *         mintToken.mutate({
 *           walletId,
 *           tokenAddress,
 *           recipient: '0x...',
 *           amount: parseUnits('1000', 18),
 *           abi: testnetTokenAbi,
 *         })
 *       }
 *     >
 *       Mint Tokens
 *     </button>
 *   )
 * }
 * ```
 */
export function useMintToken(
  options?: UseMutationOptions<SendTransactionResult, Error, MintTokenInput>,
): ReturnType<typeof useMutation<SendTransactionResult, Error, MintTokenInput>> {
  const client = useVencuraClient()
  const queryClient = useQueryClient()
  const { onSuccess: userOnSuccess, ...restOptions } = options || {}

  return useMutation({
    ...restOptions,
    mutationFn: async (input: MintTokenInput): Promise<SendTransactionResult> => {
      const { walletId, tokenAddress, recipient, amount, abi } = input

      // Encode the mint function call
      const data = encodeTokenMint({ recipient, amount, abi })

      // Use generic transaction endpoint
      const transactionInput = {
        to: tokenAddress,
        amount: 0, // No native token transfer, just contract call
        data,
      }

      const result = await client.wallet.sendTransaction({
        params: { id: walletId },
        body: transactionInput,
      })

      if (result.status === 200)
        return validateResponse({
          data: result.body,
          schema: SendTransactionResultSchema,
          errorMessage: 'Invalid mint transaction response',
        })

      throw new Error('Failed to mint tokens')
    },
    onSuccess: (data, variables, context) => {
      // Invalidate wallet balance queries to refresh UI
      queryClient.invalidateQueries({ queryKey: walletsKeys.balance(variables.walletId).queryKey })
      // Call user's onSuccess if provided
      if (userOnSuccess) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(userOnSuccess as any)(data, variables, context)
      }
    },
  })
}

/**
 * Hook to burn ERC20 tokens via contract call.
 * Encodes the burn function call and uses the generic transaction endpoint.
 *
 * @param options - Optional React Query mutation options
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * import { useBurnToken } from '@vencura/react'
 * import { parseUnits } from 'viem'
 * import { testnetTokenAbi } from '@vencura/evm/abis'
 *
 * function BurnButton({ walletId, tokenAddress, accountAddress }: Props) {
 *   const burnToken = useBurnToken({
 *     onSuccess: (data) => {
 *       console.log('Burn transaction:', data.transactionHash)
 *     },
 *   })
 *
 *   return (
 *     <button
 *       onClick={() =>
 *         burnToken.mutate({
 *           walletId,
 *           tokenAddress,
 *           account: accountAddress,
 *           amount: parseUnits('100', 18),
 *           abi: testnetTokenAbi,
 *         })
 *       }
 *     >
 *       Burn Tokens
 *     </button>
 *   )
 * }
 * ```
 */
export function useBurnToken(
  options?: UseMutationOptions<SendTransactionResult, Error, BurnTokenInput>,
): ReturnType<typeof useMutation<SendTransactionResult, Error, BurnTokenInput>> {
  const client = useVencuraClient()
  const queryClient = useQueryClient()
  const { onSuccess: userOnSuccess, ...restOptions } = options || {}

  return useMutation({
    ...restOptions,
    mutationFn: async (input: BurnTokenInput): Promise<SendTransactionResult> => {
      const { walletId, tokenAddress, account, amount, abi } = input

      // Encode the burn function call
      const data = encodeTokenBurn({ account, amount, abi })

      // Use generic transaction endpoint
      const transactionInput = {
        to: tokenAddress,
        amount: 0, // No native token transfer, just contract call
        data,
      }

      const result = await client.wallet.sendTransaction({
        params: { id: walletId },
        body: transactionInput,
      })

      if (result.status === 200)
        return validateResponse({
          data: result.body,
          schema: SendTransactionResultSchema,
          errorMessage: 'Invalid burn transaction response',
        })

      throw new Error('Failed to burn tokens')
    },
    onSuccess: (data, variables, context) => {
      // Invalidate wallet balance queries to refresh UI
      queryClient.invalidateQueries({ queryKey: walletsKeys.balance(variables.walletId).queryKey })
      // Call user's onSuccess if provided
      if (userOnSuccess) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(userOnSuccess as any)(data, variables, context)
      }
    },
  })
}

/**
 * Hook to get ERC20 token balance.
 * Note: This currently requires a generic read endpoint or RPC access.
 * For now, this is a placeholder that will need backend support or client-side RPC calls.
 *
 * @param params - Token balance parameters
 * @param params.walletId - Wallet ID
 * @param params.tokenAddress - Token contract address
 * @param options - Optional React Query options
 * @returns Query result with token balance
 *
 * @example
 * ```tsx
 * import { useTokenBalance } from '@vencura/react'
 *
 * function TokenBalance({ walletId, tokenAddress }: Props) {
 *   const { data, isLoading } = useTokenBalance({ walletId, tokenAddress })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return <div>Balance: {data?.balance.toString()}</div>
 * }
 * ```
 */
export function useTokenBalance(
  { walletId, tokenAddress }: { walletId: string; tokenAddress: Address },
  options?: Omit<UseQueryOptions<TokenBalance, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery<TokenBalance, Error>> {
  // TODO: Implement when generic read endpoint is available
  // For now, this is a placeholder that will need backend support
  return useQuery({
    queryKey: ['token-balance', walletId, tokenAddress],
    queryFn: async (): Promise<TokenBalance> => {
      throw new Error('Token balance read not yet implemented. Requires generic read endpoint.')
    },
    enabled: false, // Disabled until backend support is added
    ...options,
  })
}

/**
 * Hook to get ERC20 token total supply.
 * Note: This currently requires a generic read endpoint or RPC access.
 * For now, this is a placeholder that will need backend support or client-side RPC calls.
 *
 * @param params - Token supply parameters
 * @param params.tokenAddress - Token contract address
 * @param params.chainId - Chain ID
 * @param options - Optional React Query options
 * @returns Query result with token supply
 *
 * @example
 * ```tsx
 * import { useTokenSupply } from '@vencura/react'
 *
 * function TokenSupply({ tokenAddress, chainId }: Props) {
 *   const { data, isLoading } = useTokenSupply({ tokenAddress, chainId })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return <div>Supply: {data?.supply.toString()}</div>
 * }
 * ```
 */
export function useTokenSupply(
  { tokenAddress, chainId }: { tokenAddress: Address; chainId: number },
  options?: Omit<UseQueryOptions<TokenSupply, Error>, 'queryKey' | 'queryFn'>,
): ReturnType<typeof useQuery<TokenSupply, Error>> {
  // TODO: Implement when generic read endpoint is available
  // For now, this is a placeholder that will need backend support
  return useQuery({
    queryKey: ['token-supply', tokenAddress, chainId],
    queryFn: async (): Promise<TokenSupply> => {
      throw new Error('Token supply read not yet implemented. Requires generic read endpoint.')
    },
    enabled: false, // Disabled until backend support is added
    ...options,
  })
}
