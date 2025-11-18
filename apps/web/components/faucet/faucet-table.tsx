'use client'

import { FAUCET_TOKENS } from '@/lib/tokens'
import { formatUnits, getAddress } from 'viem'
import { Button } from '@workspace/ui/components/button'
import { FaucetDialog } from './faucet-dialog'
import { useQueryStates } from 'nuqs'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import {
  actionSchema,
  quantitySchema,
  tokenSchema,
  refetchSchema,
  parseOrDefault,
} from '@/lib/faucet-query'

const DEFAULT_BALANCE = '0.00'

function useFaucetStates() {
  return useQueryStates({
    action: {
      defaultValue: undefined,
      parse: parseOrDefault(actionSchema, undefined),
    },
    quantity: {
      defaultValue: '42000',
      clearOnDefault: false,
      parse: parseOrDefault(quantitySchema, '42000'),
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
      parse: parseOrDefault(refetchSchema, false),
    },
  })
}

function TokenRow({ token }: { token: (typeof FAUCET_TOKENS)[number] }) {
  const { user } = useDynamicContext()
  const [, setQueryStates] = useFaucetStates()
  const tokenAddress = getAddress(token.address)

  // Token balance and supply reads are not yet implemented (require generic read endpoint)
  // For now, display placeholder values
  const tokenBalance: bigint | undefined = undefined
  const tokenSupply: bigint | undefined = undefined

  const handleAction = (action: 'mint' | 'burn') => {
    setQueryStates({
      action,
      token: tokenAddress,
      quantity: '42000',
    })
  }

  // Note: Token balance and supply reads will be implemented when generic read endpoint is available
  // The refetch_data mechanism is handled by the dialog component after successful mint/burn

  const balanceValue =
    tokenBalance !== undefined && typeof tokenBalance === 'bigint' && tokenBalance > 0n
      ? formatUnits(tokenBalance, token.decimals)
      : DEFAULT_BALANCE

  const supplyValue =
    tokenSupply !== undefined && typeof tokenSupply === 'bigint'
      ? formatUnits(tokenSupply, token.decimals)
      : DEFAULT_BALANCE

  return (
    <tr className="border-b">
      <td className="px-4 py-2">{token.symbol}</td>
      <td className="px-4 py-2">{token.name}</td>
      <td className="px-4 py-2">{balanceValue}</td>
      <td className="px-4 py-2">{supplyValue}</td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={() => handleAction('mint')} disabled={!user}>
            Mint
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleAction('burn')}
            disabled={!user}
          >
            Burn
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function FaucetTable() {
  return (
    <div className="flex flex-col w-full max-w-4xl items-start gap-4">
      <div className="w-full mt-4 overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Symbol</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Balance</th>
              <th className="px-4 py-2 text-left">Supply</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {FAUCET_TOKENS.map(token => (
              <TokenRow key={token.address} token={token} />
            ))}
          </tbody>
        </table>
      </div>
      <FaucetDialog />
    </div>
  )
}
