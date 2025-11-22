# @vencura/react

React hooks for the Vencura API using TanStack Query. Built on top of `@vencura/core` with contract-first architecture for type-safe data fetching.

## Overview

`@vencura/react` provides React hooks for interacting with the Vencura API. It's built on **TanStack Query** (React Query) and uses `@vencura/core` for API client functionality, ensuring type safety and excellent developer experience.

## Features

- **TanStack Query**: Built on React Query for caching, refetching, and state management
- **Type-safe**: Full TypeScript support with types inferred from `@vencura/types` contracts
- **Contract-first**: Consumes contracts from `@vencura/types` via `@vencura/core`
- **Provider pattern**: `VencuraProvider` wraps your app with QueryClient and API client

## Installation

This package is part of the monorepo and is automatically available to all apps. No separate installation needed.

**Peer Dependencies:**
- `react` ^19.0.0
- `react-dom` ^19.0.0

## Usage

### Setup Provider

```tsx
import { VencuraProvider } from '@vencura/react'

function App() {
  return (
    <VencuraProvider
      baseUrl="https://vencura-api.vercel.app"
      headers={{
        Authorization: 'Bearer your-token',
      }}
    >
      <YourApp />
    </VencuraProvider>
  )
}
```

### Using Hooks

```tsx
import { useHello } from '@vencura/react'

function HelloComponent() {
  const { data, isLoading, error } = useHello()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{data.message}</div>
}
```

### Available Hooks

All hooks are typed based on contracts from `@vencura/types`:

- `useHello()` - Example hello endpoint hook
- `useWallets()` - List all wallets for the authenticated user
- `useCreateWallet()` - Create a new custodial wallet
- `useWalletBalance()` - Get wallet balance
- `useSendTransaction()` - Send a transaction from a wallet

Each hook provides:
- `data` - Typed response data
- `isLoading` - Loading state
- `isError` - Error state
- `error` - Error object
- `refetch()` - Manual refetch function
- Standard TanStack Query options (enabled, refetchInterval, etc.)

### Wallets

**List Wallets Example:**

```tsx
import { useWallets } from '@vencura/react'

function WalletList() {
  const { data: wallets, isLoading, error } = useWallets()

  if (isLoading) return <div>Loading wallets...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>My Wallets</h2>
      {wallets.length === 0 ? (
        <p>No wallets found</p>
      ) : (
        <ul>
          {wallets.map(wallet => (
            <li key={wallet.id}>
              {wallet.address} ({wallet.chainType})
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**Create Wallet Example:**

```tsx
import { useCreateWallet } from '@vencura/react'

function CreateWalletButton() {
  const { mutate: createWallet, isPending } = useCreateWallet()

  const handleCreate = () => {
    createWallet(
      { chainType: 'evm' },
      {
        onSuccess: wallet => {
          console.log('Wallet created:', wallet.address)
        },
        onError: error => {
          console.error('Failed to create wallet:', error)
        },
      },
    )
  }

  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create EVM Wallet'}
    </button>
  )
}
```

## Architecture

- **Built on @vencura/core**: Uses the typed HTTP client from `@vencura/core`
- **TanStack Query**: Leverages React Query for caching, background refetching, and state management
- **Contract-first**: All hooks are typed based on contracts from `@vencura/types`

## Related Packages

- **[@vencura/core](../core/README.md)** - TypeScript SDK (used internally)
- **[@vencura/types](../types/README.md)** - Shared API contracts and types
- **[@tanstack/react-query](https://tanstack.com/query)** - Data fetching library

## Development

```bash
# Lint
bun run lint

# Test
bun run test

# Test with coverage
bun run test:cov
```

## Coding Standards

This package follows the monorepo's coding standards:

- **RORO Pattern**: Multi-parameter functions use Receive Object, Return Object pattern
- **Type Inference**: Types inferred from Zod schemas and contracts
- **Functional Code**: Prefer functional and declarative programming patterns
- **React Hooks**: Follow React hooks patterns (see [React Hooks Rules](../../.cursor/rules/frontend/react-hooks.mdc))

See [TypeScript Rules](../../.cursor/rules/base/typescript.mdc) and [React Hooks Rules](../../.cursor/rules/frontend/react-hooks.mdc) for detailed guidelines.

## License

PROPRIETARY

