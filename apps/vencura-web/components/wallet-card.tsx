'use client'

import { useSetState } from 'react-use'
import { Button } from '@workspace/ui/components/button'
import { useWalletBalance, useSignMessage, useSendTransaction, type Wallet } from '@vencura/react'
import { getChainByNetworkId } from '@/lib/chains'
import { getErrorMessage } from '@/lib/error-utils'
import { signMessageSchema, sendTransactionSchema, validateAddressInput } from '@/lib/validation'

interface WalletCardState {
  message: string
  signedMessage: string | null
  txTo: string
  txAmount: string
  showBalance: boolean
  addressError: string | null
  amountError: string | null
}

export function WalletCard({ wallet }: { wallet: Wallet }) {
  const [state, setState] = useSetState<WalletCardState>({
    message: '',
    signedMessage: null,
    txTo: '',
    txAmount: '',
    showBalance: false,
    addressError: null,
    amountError: null,
  })

  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useWalletBalance(wallet.id, { enabled: state.showBalance })

  const signMessage = useSignMessage(wallet.id, {
    onSuccess: data => {
      setState({ signedMessage: data.signedMessage, message: '' })
    },
  })

  const sendTransaction = useSendTransaction(wallet.id, {
    onSuccess: () => {
      setState({ txTo: '', txAmount: '' })
      refetchBalance()
    },
  })

  const chainInfo = getChainByNetworkId(wallet.network)
  const currency = chainInfo?.currency || (wallet.chainType === 'solana' ? 'SOL' : 'ETH')
  const txHash = sendTransaction.data?.transactionHash || null

  const handleGetBalance = () => {
    setState({ showBalance: true })
    refetchBalance()
  }

  const handleSignMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    const validation = signMessageSchema.safeParse({ message: state.message })
    if (!validation.success) return
    signMessage.mutate(validation.data)
  }

  const handleSendTransaction = () => {
    // Validate address format
    const addressValidation = validateAddressInput({
      address: state.txTo,
      chainType: wallet.chainType,
    })
    if (!addressValidation.valid) {
      setState({ addressError: addressValidation.error || 'Invalid address' })
      return
    }
    setState({ addressError: null })

    // Parse and validate amount
    const amount = parseFloat(state.txAmount)
    const transactionValidation = sendTransactionSchema.safeParse({
      to: state.txTo.trim(),
      amount,
    })
    if (!transactionValidation.success) {
      const error = transactionValidation.error.errors.find(e => e.path[0] === 'amount')
      setState({ amountError: error?.message || 'Invalid amount' })
      return
    }
    setState({ amountError: null })

    sendTransaction.mutate(transactionValidation.data)
  }

  const isLoading = balanceLoading || signMessage.isPending || sendTransaction.isPending
  const error =
    getErrorMessage(signMessage.error) ||
    getErrorMessage(sendTransaction.error) ||
    (balanceData === undefined && state.showBalance ? 'Failed to fetch balance' : null)

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-card">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Wallet</h3>
          {wallet.chainType ? (
            <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md uppercase">
              {wallet.chainType}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground font-mono break-all">{wallet.address}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {chainInfo?.name || wallet.network} {chainInfo?.testnet ? '(Testnet)' : null}
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleGetBalance}
            disabled={isLoading}
            size="sm"
            variant="outline"
            type="button"
          >
            {balanceLoading ? 'Loading...' : 'Get Balance'}
          </Button>
          {balanceData ? (
            <div className="text-sm">
              <span className="text-muted-foreground">Balance: </span>
              <strong className="text-lg">
                {balanceData.balance} {currency}
              </strong>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h4 className="font-semibold text-sm">Sign Message</h4>
        <form onSubmit={handleSignMessage} className="flex gap-2">
          <input
            type="text"
            value={state.message}
            onChange={e => {
              setState({ message: e.target.value })
            }}
            placeholder="Enter message to sign"
            className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !state.message.trim()} size="sm">
            {signMessage.isPending ? 'Signing...' : 'Sign'}
          </Button>
        </form>
        {state.signedMessage ? (
          <div className="mt-2 p-3 bg-muted rounded-md">
            <p className="text-xs font-medium text-muted-foreground mb-1">Signed Message:</p>
            <p className="text-xs font-mono break-all">{state.signedMessage}</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 border-t pt-4">
        <h4 className="font-semibold text-sm">Send Transaction</h4>
        <div className="space-y-2">
          <div className="space-y-1">
            <input
              type="text"
              value={state.txTo}
              onChange={e => {
                setState({ txTo: e.target.value, addressError: null })
              }}
              placeholder={
                wallet.chainType === 'solana'
                  ? 'Recipient address (Solana)'
                  : 'Recipient address (0x...)'
              }
              className={`w-full px-3 py-2 border rounded-md text-sm font-mono bg-background ${
                state.addressError ? 'border-destructive' : ''
              }`}
              disabled={isLoading}
            />
            {state.addressError ? (
              <p className="text-xs text-destructive">{state.addressError}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <input
                type="number"
                step="0.0001"
                value={state.txAmount}
                onChange={e => {
                  setState({ txAmount: e.target.value, amountError: null })
                }}
                placeholder={`Amount (${currency})`}
                className={`w-full px-3 py-2 border rounded-md text-sm bg-background ${
                  state.amountError ? 'border-destructive' : ''
                }`}
                disabled={isLoading}
              />
              {state.amountError ? (
                <p className="text-xs text-destructive">{state.amountError}</p>
              ) : null}
            </div>
            <Button onClick={handleSendTransaction} disabled={isLoading} size="sm">
              {sendTransaction.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
          {txHash ? (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-xs font-medium text-muted-foreground mb-1">Transaction Hash:</p>
              <p className="text-xs font-mono break-all">{txHash}</p>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      ) : null}
    </div>
  )
}
