'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import { useWallets, useCreateWallet } from '@vencura/react'
import { WalletCard } from './wallet-card'
import { SUPPORTED_CHAINS } from '@/lib/chains'
import { getErrorMessage } from '@/lib/error-utils'

export function WalletDashboard() {
  const [chainId, setChainId] = useState<number | string>(421614) // Default to Arbitrum Sepolia
  const { data: wallets = [], isLoading: loadingWallets, error: walletsError } = useWallets()
  const createWallet = useCreateWallet({
    onSuccess: () => {
      // React Query will automatically refetch wallets
    },
  })

  const handleCreateWallet = () => {
    createWallet.mutate({ chainId })
  }

  const error = getErrorMessage(walletsError) || getErrorMessage(createWallet.error) || null

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Create New Wallet</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Chain</label>
            <select
              value={String(chainId)}
              onChange={e => {
                const value = e.target.value
                const parsed = Number(value)
                setChainId(isNaN(parsed) ? value : parsed)
              }}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              disabled={createWallet.isPending}
            >
              {SUPPORTED_CHAINS.filter(
                chain => chain.chainType === 'evm' || chain.chainType === 'solana',
              ).map(chain => (
                <option key={String(chain.chainId)} value={String(chain.chainId)}>
                  {chain.name} {chain.testnet && '(Testnet)'}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreateWallet} disabled={createWallet.isPending}>
            {createWallet.isPending ? 'Creating...' : 'Create Wallet'}
          </Button>
        </div>
        {error && (
          <div className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Your Wallets</h2>
        {loadingWallets ? (
          <div className="text-muted-foreground py-4">Loading wallets...</div>
        ) : wallets.length === 0 ? (
          <div className="text-muted-foreground py-4">
            No wallets yet. Create your first wallet above.
          </div>
        ) : (
          <div className="space-y-4">
            {wallets.map(wallet => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
