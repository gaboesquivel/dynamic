'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'
import { createWallet, getWallets, type Wallet } from '@/lib/api-client'
import { WalletCard } from './wallet-card'
import { SUPPORTED_CHAINS } from '@/lib/chains'

export function WalletDashboard() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | string>(421614) // Default to Arbitrum Sepolia

  useEffect(() => {
    const fetchWallets = async () => {
      setLoadingWallets(true)
      setError(null)
      try {
        const userWallets = await getWallets()
        setWallets(userWallets)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load wallets')
      } finally {
        setLoadingWallets(false)
      }
    }
    fetchWallets()
  }, [])

  const handleCreateWallet = async () => {
    setLoading(true)
    setError(null)
    try {
      await createWallet(chainId)
      // Reload wallets after creation
      const userWallets = await getWallets()
      setWallets(userWallets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    // Reload wallets list
    try {
      const userWallets = await getWallets()
      setWallets(userWallets)
    } catch (err) {
      // Silently fail on refresh
      console.error('Failed to refresh wallets:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Create New Wallet</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-1 block">Chain</label>
            <select
              value={String(chainId)}
              onChange={e => {
                const value = e.target.value
                // Try to parse as number, fallback to string
                const parsed = Number(value)
                setChainId(isNaN(parsed) ? value : parsed)
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
              disabled={loading}
            >
              {SUPPORTED_CHAINS.map(chain => (
                <option key={String(chain.chainId)} value={String(chain.chainId)}>
                  {chain.name} {chain.testnet && '(Testnet)'}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreateWallet} disabled={loading}>
            {loading ? 'Creating...' : 'Create Wallet'}
          </Button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Your Wallets</h2>
        {loadingWallets ? (
          <p className="text-muted-foreground">Loading wallets...</p>
        ) : wallets.length === 0 ? (
          <p className="text-muted-foreground">No wallets yet. Create your first wallet above.</p>
        ) : (
          <div className="space-y-4">
            {wallets.map(wallet => (
              <WalletCard key={wallet.id} wallet={wallet} onRefresh={handleRefresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
