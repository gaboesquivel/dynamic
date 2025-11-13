'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import { getBalance, signMessage, sendTransaction, type Wallet } from '@/lib/api-client'
import { getChainByNetworkId, isValidAddress } from '@/lib/chains'

type WalletCardProps = {
  wallet: Wallet
  onRefresh?: () => Promise<void> | void
}

export function WalletCard({ wallet, onRefresh }: WalletCardProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [signedMessage, setSignedMessage] = useState<string | null>(null)
  const [txTo, setTxTo] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleGetBalance = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getBalance(wallet.id)
      setBalance(result.balance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get balance')
    } finally {
      setLoading(false)
    }
  }

  const handleSignMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!message.trim()) {
      setError('Please enter a message to sign')
      return
    }
    setLoading(true)
    setError(null)
    setSignedMessage(null)
    try {
      const result = await signMessage(wallet.id, message.trim())
      setSignedMessage(result.signedMessage)
      // Clear message after successful sign
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message')
    } finally {
      setLoading(false)
    }
  }

  const chainInfo = getChainByNetworkId(wallet.network)
  const currency = chainInfo?.currency || (wallet.chainType === 'solana' ? 'SOL' : 'ETH')

  const handleSendTransaction = async () => {
    if (!txTo.trim() || !txAmount.trim()) {
      setError('Please enter recipient address and amount')
      return
    }
    if (!isValidAddress(txTo.trim(), wallet.chainType)) {
      const addressFormat =
        wallet.chainType === 'solana' ? 'Solana address' : 'Ethereum address (0x...)'
      setError(`Please enter a valid ${addressFormat}`)
      return
    }
    const amount = parseFloat(txAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const result = await sendTransaction(wallet.id, txTo.trim(), amount)
      setTxHash(result.transactionHash)
      setTxTo('')
      setTxAmount('')
      // Refresh balance after transaction
      await handleGetBalance()
      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Wallet Address</h3>
        <p className="text-sm text-muted-foreground font-mono break-all">{wallet.address}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Network: {chainInfo?.name || wallet.network} {chainInfo?.testnet && '(Testnet)'}
        </p>
        {wallet.chainType && (
          <p className="text-xs text-muted-foreground">
            Chain Type: {wallet.chainType.toUpperCase()}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button onClick={handleGetBalance} disabled={loading} size="sm" variant="outline">
            Get Balance
          </Button>
          {balance !== null && (
            <span className="text-sm">
              Balance:{' '}
              <strong>
                {balance} {currency}
              </strong>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <h4 className="font-semibold text-sm">Sign Message</h4>
        <form onSubmit={handleSignMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => {
              setMessage(e.target.value)
              setError(null)
            }}
            placeholder="Enter message to sign"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !message.trim()} size="sm">
            Sign
          </Button>
        </form>
        {signedMessage && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Signed Message:</p>
            <p className="text-xs font-mono break-all bg-muted p-2 rounded">{signedMessage}</p>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <h4 className="font-semibold text-sm">Send Transaction</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={txTo}
            onChange={e => {
              setTxTo(e.target.value)
              setError(null)
            }}
            placeholder={
              wallet.chainType === 'solana'
                ? 'Recipient address (Solana)'
                : 'Recipient address (0x...)'
            }
            className="w-full px-3 py-2 border rounded-md text-sm font-mono"
            disabled={loading}
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.0001"
              value={txAmount}
              onChange={e => setTxAmount(e.target.value)}
              placeholder={`Amount (${currency})`}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              disabled={loading}
            />
            <Button onClick={handleSendTransaction} disabled={loading} size="sm">
              Send
            </Button>
          </div>
          {txHash && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Transaction Hash:</p>
              <p className="text-xs font-mono break-all bg-muted p-2 rounded">{txHash}</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>
      )}
    </div>
  )
}
