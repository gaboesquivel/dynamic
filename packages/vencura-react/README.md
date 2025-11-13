# @vencura/react

React hooks for Vencura API using TanStack Query. Provides type-safe hooks for interacting with the Vencura custodial wallet API. Built on top of `@vencura/core` using a contract-first approach with ts-rest for end-to-end type safety.

## Installation

```bash
pnpm add @vencura/react @tanstack/react-query
```

## Quick Start

### 1. Setup Provider

Wrap your app with `VencuraProvider` to configure the API client:

```tsx
import { VencuraProvider } from '@vencura/react'

function App() {
  return (
    <VencuraProvider
      baseUrl="https://api.vencura.com"
      headers={{ Authorization: 'Bearer YOUR_TOKEN' }}
    >
      <YourApp />
    </VencuraProvider>
  )
}
```

### 2. Use Hooks

```tsx
import { useWallets, useCreateWallet } from '@vencura/react'

function WalletsList() {
  const { data: wallets, isLoading } = useWallets()
  const createWallet = useCreateWallet()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={() => createWallet.mutate({ chainId: 421614 })}>Create Wallet</button>
      <ul>
        {wallets?.map(wallet => (
          <li key={wallet.id}>{wallet.address}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Provider Configuration

### VencuraProvider Props

| Prop          | Type                     | Description                      | Required |
| ------------- | ------------------------ | -------------------------------- | -------- |
| `baseUrl`     | `string`                 | Base URL for the Vencura API     | No       |
| `headers`     | `Record<string, string>` | Default headers for all requests | No       |
| `queryClient` | `QueryClient`            | Custom QueryClient instance      | No       |
| `children`    | `ReactNode`              | React children                   | Yes      |

### Example with Custom QueryClient

```tsx
import { QueryClient } from '@tanstack/react-query'
import { VencuraProvider } from '@vencura/react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
})

function App() {
  return (
    <VencuraProvider queryClient={queryClient} baseUrl="...">
      <YourApp />
    </VencuraProvider>
  )
}
```

## Hooks

### useWallets

Fetch all wallets for the authenticated user.

```tsx
import { useWallets } from '@vencura/react'

function WalletsList() {
  const { data, isLoading, error } = useWallets({
    staleTime: 5 * 60 * 1000, // Override default options
    refetchOnWindowFocus: true,
  })

  // ...
}
```

**Returns:** `UseQueryResult<Wallet[], Error>`

**Types:** All types are inferred from `@vencura/types` - no manual type definitions needed!

### useCreateWallet

Create a new custodial wallet.

```tsx
import { useCreateWallet } from '@vencura/react'

function CreateWalletButton() {
  const createWallet = useCreateWallet({
    onSuccess: data => {
      console.log('Wallet created:', data.address)
    },
    onError: error => {
      console.error('Failed to create wallet:', error)
    },
  })

  return (
    <button
      onClick={() => createWallet.mutate({ chainId: 421614 })}
      disabled={createWallet.isPending}
    >
      {createWallet.isPending ? 'Creating...' : 'Create Wallet'}
    </button>
  )
}
```

**Returns:** `UseMutationResult<Wallet, Error, CreateWalletInput>`

**Types:** Types are automatically inferred from the contract - `CreateWalletInput` and `Wallet` come from `@vencura/types`.

### useWalletBalance

Fetch balance for a specific wallet.

```tsx
import { useWalletBalance } from '@vencura/react'

function WalletBalance({ walletId }: { walletId: string }) {
  const { data, isLoading } = useWalletBalance(walletId, {
    enabled: !!walletId, // Only fetch when walletId exists
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) return <div>Loading balance...</div>

  return <div>Balance: {data?.balance} ETH</div>
}
```

**Parameters:**

- `id: string` - Wallet ID
- `options?: UseQueryOptions` - Optional React Query options

**Returns:** `UseQueryResult<WalletBalance, Error>`

### useSignMessage

Sign a message with a wallet's private key.

```tsx
import { useSignMessage } from '@vencura/react'

function SignButton({ walletId }: { walletId: string }) {
  const signMessage = useSignMessage(walletId, {
    onSuccess: data => {
      console.log('Signed message:', data.signedMessage)
    },
  })

  return (
    <button
      onClick={() => signMessage.mutate({ message: 'Hello, World!' })}
      disabled={signMessage.isPending}
    >
      Sign Message
    </button>
  )
}
```

**Parameters:**

- `id: string` - Wallet ID
- `options?: UseMutationOptions` - Optional React Query mutation options

**Returns:** `UseMutationResult<SignMessageResult, Error, SignMessageInput>`

### useSendTransaction

Send a transaction from a wallet.

```tsx
import { useSendTransaction } from '@vencura/react'

function SendButton({ walletId }: { walletId: string }) {
  const sendTransaction = useSendTransaction(walletId, {
    onSuccess: data => {
      console.log('Transaction hash:', data.transactionHash)
    },
  })

  return (
    <button
      onClick={() =>
        sendTransaction.mutate({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          amount: 0.001,
        })
      }
      disabled={sendTransaction.isPending}
    >
      Send Transaction
    </button>
  )
}
```

**Parameters:**

- `id: string` - Wallet ID
- `options?: UseMutationOptions` - Optional React Query mutation options

**Returns:** `UseMutationResult<SendTransactionResult, Error, SendTransactionInput>`

## Query Key Factory

The `wallets` query key factory provides centralized, type-safe query keys for cache management.

### Usage

```tsx
import { walletsKeys } from '@vencura/react/hooks/keys'
// Or use the re-exported 'wallets' for backward compatibility
import { wallets } from '@vencura/react'
import { useQueryClient } from '@tanstack/react-query'
npm
function InvalidateWallets() {
  const queryClient = useQueryClient()

  // Invalidate all wallet queries
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: walletsKeys._def })
  }

  // Invalidate specific wallet balance
  const invalidateBalance = (walletId: string) => {
    queryClient.invalidateQueries({ queryKey: walletsKeys.balance(walletId).queryKey })
  }

  // Prefetch wallet balance
  const prefetchBalance = (walletId: string) => {
    queryClient.prefetchQuery({
      queryKey: walletsKeys.balance(walletId).queryKey,
      queryFn: async () => {
        // Your prefetch logic
      },
    })
  }

  return (
    <div>
      <button onClick={invalidateAll}>Invalidate All</button>
      <button onClick={() => invalidateBalance('wallet-123')}>Invalidate Balance</button>
    </div>
  )
}
```

### Available Query Keys

- `walletsKeys.all` - Query key for all wallets
- `walletsKeys.balance(id)` - Query key for wallet balance

**Note**: For backward compatibility, `wallets` is also exported as an alias to `walletsKeys`.

## Type Exports

All types from `@vencura/types` are re-exported for convenience:

```tsx
import type {
  Wallet,
  CreateWalletInput,
  WalletBalance,
  SignMessageInput,
  SignMessageResult,
  SendTransactionInput,
  SendTransactionResult,
} from '@vencura/react'
```

For complete type definitions, see [@vencura/types](../vencura-types/README.md) and [@vencura/core](../vencura-core/README.md).

## Architecture

This package uses a contract-first approach:

1. **Contracts** (`@vencura/types`) define API endpoints with Zod schemas
2. **Core Client** (`@vencura/core`) provides type-safe client using ts-rest
3. **React Hooks** (`@vencura/react`) wrap the client with TanStack Query

This ensures:

- **Full type inference** - No manual type definitions needed
- **End-to-end type safety** - Types shared across backend, SDK, and frontend
- **Clean API** - `client.wallet.list()` instead of `client.wallets.walletControllerGetWallets()`

## Advanced Usage

### Custom Query Options

All hooks accept full `UseQueryOptions` or `UseMutationOptions` parameters, allowing you to override defaults:

```tsx
const { data } = useWallets({
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  retry: 5,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
})
```

### Dependent Queries

```tsx
function WalletDetails({ walletId }: { walletId: string }) {
  const { data: wallets } = useWallets()
  const { data: balance } = useWalletBalance(walletId, {
    enabled: !!walletId && !!wallets, // Only fetch when walletId and wallets exist
  })

  // ...
}
```

### Optimistic Updates

```tsx
import { walletsKeys } from '@vencura/react/hooks/keys'

const createWallet = useCreateWallet({
  onMutate: async newWallet => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: walletsKeys._def })

    // Snapshot previous value
    const previous = queryClient.getQueryData(walletsKeys.all.queryKey)

    // Optimistically update
    queryClient.setQueryData(walletsKeys.all.queryKey, old => [
      ...(old || []),
      { id: 'temp', ...newWallet },
    ])

    return { previous }
  },
  onError: (err, newWallet, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(walletsKeys.all.queryKey, context.previous)
    }
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: walletsKeys._def })
  },
})
```

## Related Packages

- [@vencura/core](../vencura-core/README.md) - TypeScript SDK for Vencura API
