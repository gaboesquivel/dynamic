'use client'

import { useMintToken, useBurnToken, useWallets, useCreateWallet } from '@vencura/react'
import { FAUCET_TOKENS } from '@/lib/tokens'
import { parseUnits, getAddress } from 'viem'
import { useQueryStates } from 'nuqs'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { testnetTokenAbi } from '@vencura/evm/abis'
import { arbitrumSepolia } from 'viem/chains'
import * as React from 'react'

// Zod schemas for URL query parameter parsing
const actionSchema = z.enum(['mint', 'burn']).optional()
const quantitySchema = z.string()
const tokenSchema = z.string().transform(val => getAddress(val))
const refetchSchema = z.string().transform(val => val === 'true')

function useFaucetStates() {
  return useQueryStates({
    action: {
      defaultValue: undefined,
      parse: (value: string) => {
        const result = actionSchema.safeParse(value)
        return result.success ? result.data : undefined
      },
    },
    quantity: {
      defaultValue: '42000',
      clearOnDefault: false,
      parse: (value: string) => {
        const result = quantitySchema.safeParse(value)
        return result.success ? result.data : '42000'
      },
    },
    token: {
      clearOnDefault: false,
      defaultValue: undefined,
      parse: (value: string) => {
        try {
          return tokenSchema.parse(value)
        } catch {
          return undefined
        }
      },
    },
    refetch_data: {
      defaultValue: false,
      parse: (value: string) => {
        const result = refetchSchema.safeParse(value)
        return result.success ? result.data : false
      },
    },
  })
}

export function FaucetDialog() {
  const { user, setShowAuthFlow } = useDynamicContext()
  const [{ action, quantity, token }, setQueryStates] = useFaucetStates()

  // Get or create a wallet for Arbitrum Sepolia
  const { data: wallets = [] } = useWallets()
  const createWallet = useCreateWallet()
  const arbitrumSepoliaWallet = wallets.find(w => w.network === String(arbitrumSepolia.id))

  // Ensure we have a wallet for Arbitrum Sepolia
  React.useEffect(() => {
    if (!arbitrumSepoliaWallet && user && !createWallet.isPending) {
      createWallet.mutate({ chainId: arbitrumSepolia.id })
    }
  }, [arbitrumSepoliaWallet, user, createWallet])

  const tokenConfig = FAUCET_TOKENS.find(t => t.address === token)
  const amount = tokenConfig ? parseUnits(quantity || '0', tokenConfig.decimals) : 0n
  const tokenAddress = tokenConfig?.address

  // Use the custodial wallet address as recipient (mint/burn to self)
  const connectedAddress = arbitrumSepoliaWallet?.address
    ? getAddress(arbitrumSepoliaWallet.address)
    : undefined

  const minter = useMintToken({
    onSuccess: () => {
      setQueryStates({ refetch_data: true })
    },
  })

  const burner = useBurnToken({
    onSuccess: () => {
      setQueryStates({ refetch_data: true })
    },
  })

  const handleClose = () => {
    setQueryStates({
      token: undefined,
      quantity: '42000',
      action: undefined,
      refetch_data: true,
    })
  }

  const handleMint = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!arbitrumSepoliaWallet || !tokenAddress || !connectedAddress) return

    minter.mutate({
      walletId: arbitrumSepoliaWallet.id,
      tokenAddress,
      recipient: connectedAddress,
      amount,
      abi: testnetTokenAbi,
    })
  }

  const handleBurn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!arbitrumSepoliaWallet || !tokenAddress || !connectedAddress) return

    burner.mutate({
      walletId: arbitrumSepoliaWallet.id,
      tokenAddress,
      account: connectedAddress,
      amount,
      abi: testnetTokenAbi,
    })
  }

  const isOpen = action === 'mint' || action === 'burn'
  const isPending = minter.isPending || burner.isPending || createWallet.isPending
  const isCurrentAction = (currentAction: string) => action === currentAction
  const hash = isCurrentAction('mint') ? minter.data?.transactionHash : burner.data?.transactionHash
  const isSuccess = Boolean(hash)
  const failureReason = minter.error || burner.error || createWallet.error

  if (!tokenConfig) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCurrentAction('mint') ? 'Mint' : 'Burn'} {tokenConfig.symbol}
          </DialogTitle>
          <DialogDescription>
            {isSuccess && hash ? (
              <a
                href={`https://sepolia.arbiscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary"
              >
                View transaction: <span className="text-primary">{hash}</span>
              </a>
            ) : (
              `Enter the amount you want to ${isCurrentAction('mint') ? 'mint' : 'burn'}`
            )}
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <div className="flex flex-col gap-2 py-4">
            <div className="flex items-center gap-4">
              <label htmlFor="quantity" className="text-sm font-medium">
                Amount
              </label>
              <input
                id="quantity"
                value={quantity}
                onChange={e => setQueryStates({ quantity: e.target.value })}
                type="number"
                min="1"
                placeholder="Enter amount"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onKeyDown={e => {
                  if (e.key === '.' || e.key === ',') {
                    e.preventDefault()
                  }
                }}
              />
            </div>

            {failureReason ? (
              <p className="text-destructive text-sm text-center">
                {failureReason instanceof Error
                  ? failureReason.message.split('Request Arguments:')[0]
                  : String(failureReason)}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          {isSuccess && hash ? (
            <Button variant="outline" onClick={handleClose} className="h-10 min-w-[150px]">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} className="h-10 min-w-[150px]">
                Cancel
              </Button>
              {user && arbitrumSepoliaWallet && connectedAddress ? (
                <Button
                  onClick={isCurrentAction('mint') ? handleMint : handleBurn}
                  disabled={isPending}
                  className="h-10 min-w-[150px]"
                >
                  {isPending ? 'Processing...' : isCurrentAction('mint') ? 'Mint' : 'Burn'}
                </Button>
              ) : (
                <Button onClick={() => setShowAuthFlow(true)} className="h-10 min-w-[150px]">
                  {isPending ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
