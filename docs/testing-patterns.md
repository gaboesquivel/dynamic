# Testing Patterns

This document outlines recommended test patterns for the Vencura monorepo using Vitest. All tests follow the **blackbox, real-API testing strategy** - tests hit HTTP endpoints only, use real APIs, and avoid mocks for core functionality.

## Testing Philosophy

**CRITICAL**: All tests use real APIs with real API keys. NO MOCKS allowed for core functionality.

- **Blackbox Testing**: Tests only interact with HTTP endpoints, not internal implementation
- **Real APIs**: All tests use real Dynamic SDK endpoints (no mocks)
- **Real Blockchain**: Integration tests use real blockchain RPCs (local Anvil for tests)
- **E2E Focus**: Tests are E2E/integration tests, not unit tests

## Elysia Route Testing (Blackbox)

Use `app.handle()` to simulate HTTP requests for blackbox testing of Elysia routes.

### Basic Route Test

```typescript
import { describe, it, expect } from 'vitest'
import { Elysia } from 'elysia'
import { helloRoute } from '../routes/hello'
import { testRoute } from '../test/utils/elysia'

describe('helloRoute', () => {
  it('should return hello message via HTTP endpoint', async () => {
    // Blackbox test: hit HTTP endpoint, not internal handler
    const response = await testRoute(helloRoute, {
      method: 'GET',
      path: '/hello',
    })
    const data = await response.json()
    
    // Validate response matches contract
    expect(response.status).toBe(200)
    expect(data).toEqual({ message: 'Hello, World!' })
  })
})
```

### Route with Request Body

```typescript
import { describe, it, expect } from 'vitest'
import { createWalletRoute } from '../routes/wallets'
import { testRoute } from '../test/utils/elysia'

describe('createWalletRoute', () => {
  it('should create wallet via HTTP endpoint', async () => {
    const response = await testRoute(createWalletRoute, {
      method: 'POST',
      path: '/wallets',
      body: {
        chainId: 421614,
        userId: 'test-user-123',
      },
    })
    
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('walletId')
    expect(data.chainId).toBe(421614)
  })
})
```

### Route with Headers

```typescript
import { describe, it, expect } from 'vitest'
import { getWalletRoute } from '../routes/wallets'
import { testRoute } from '../test/utils/elysia'

describe('getWalletRoute', () => {
  it('should return wallet with authentication', async () => {
    const response = await testRoute(getWalletRoute, {
      method: 'GET',
      path: '/wallets/wallet-123',
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('address')
  })
})
```

## Zod Schema Validation Testing

Test Zod schemas with valid and invalid data to ensure proper validation.

### Schema Parsing Test

```typescript
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { WalletSchema } from '@vencura/types'

describe('WalletSchema', () => {
  it('should parse valid wallet data', () => {
    const validData = {
      id: 'wallet-123',
      address: '0x1234567890123456789012345678901234567890',
      chainId: 421614,
    }
    
    const result = WalletSchema.parse(validData)
    expect(result.id).toBe('wallet-123')
    expect(result.address).toBe(validData.address)
  })
  
  it('should reject invalid wallet data', () => {
    const invalidData = {
      id: 'wallet-123',
      address: 'invalid-address',
      chainId: 421614,
    }
    
    expect(() => WalletSchema.parse(invalidData)).toThrow()
  })
  
  it('should provide clear error messages', () => {
    const invalidData = {
      id: 'wallet-123',
      address: 'invalid-address',
      chainId: 'not-a-number',
    }
    
    const result = WalletSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2)
    }
  })
})
```

### Schema Transformation Test

```typescript
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const UserSchema = z.object({
  email: z.string().email().transform((val) => val.toLowerCase()),
  name: z.string().min(1),
})

describe('UserSchema', () => {
  it('should transform email to lowercase', () => {
    const result = UserSchema.parse({
      email: 'Test@Example.COM',
      name: 'Test User',
    })
    
    expect(result.email).toBe('test@example.com')
  })
})
```

## React Hooks Testing (Real APIs)

Test React hooks with real API calls via TanStack Query. Never mock API calls or TanStack Query.

### Basic Hook Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWallets } from './use-wallets'

describe('useWallets', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  it('should fetch wallets from real API', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useWallets(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})
```

### Hook with Parameters

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWallet } from './use-wallet'

describe('useWallet', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  it('should fetch specific wallet from real API', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useWallet('wallet-123'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(result.current.data?.id).toBe('wallet-123')
  })
})
```

## Core Client Function Testing

Test core client functions against real endpoints (local or testnet). Use real API keys from environment variables.

### API Client Test

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import { createVencuraClient } from '@vencura/core'

describe('VencuraClient', () => {
  let client: ReturnType<typeof createVencuraClient>

  beforeAll(() => {
    // Use real API key from environment
    const apiKey = process.env.VENCURA_API_KEY
    if (!apiKey) {
      throw new Error('VENCURA_API_KEY environment variable required')
    }
    client = createVencuraClient({
      apiKey,
      baseUrl: process.env.VENCURA_API_URL || 'http://localhost:3077',
    })
  })

  it('should create wallet via real API', async () => {
    const result = await client.wallets.create({
      chainId: 421614,
      userId: 'test-user-123',
    })
    
    expect(result).toHaveProperty('walletId')
    expect(result.chainId).toBe(421614)
  })

  it('should handle API errors correctly', async () => {
    await expect(
      client.wallets.create({
        chainId: 999999, // Invalid chain ID
        userId: 'test-user-123',
      }),
    ).rejects.toThrow()
  })
})
```

### Error Handling Test

```typescript
import { describe, it, expect } from 'vitest'
import { createVencuraClient } from '@vencura/core'

describe('VencuraClient error handling', () => {
  it('should validate response with Zod schema', async () => {
    const client = createVencuraClient({
      apiKey: 'test-key',
      baseUrl: 'http://localhost:3077',
    })

    // Mock fetch to return invalid data
    const originalFetch = global.fetch
    global.fetch = async () => {
      return new Response(JSON.stringify({ invalid: 'data' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await expect(client.wallets.get('wallet-123')).rejects.toThrow()

    global.fetch = originalFetch
  })
})
```

## Component Testing (Real APIs)

Test React components with real API calls. Only mock UI-specific things (window, localStorage).

### Component with Real API

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletList } from './wallet-list'

describe('WalletList', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  it('should fetch and display wallets from real API', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <WalletList />
      </QueryClientProvider>,
    )

    // Wait for real API call to complete
    const wallets = await screen.findAllByRole('listitem')
    expect(wallets.length).toBeGreaterThan(0)
  })
})
```

## Best Practices

1. **Use Real APIs**: Always prefer real API calls over mocks
2. **Blackbox Testing**: Test HTTP endpoints only, not internal implementation
3. **Wait for Async**: Use `waitFor` and `findBy` queries for async operations
4. **Test Error States**: Include tests for error handling
5. **Test Loading States**: Verify loading indicators work correctly
6. **Isolation**: Each test should be independent
7. **Clean Up**: Reset query client between tests
8. **Environment Variables**: Use real API keys from environment variables
9. **Documentation**: Add comments explaining what each test verifies

## Mocking Guidelines

### When to Mock

- **UI-Only Tests**: Mock APIs for pure rendering tests (performance)
- **Window APIs**: Mock `window`, `localStorage`, `sessionStorage`
- **Timers**: Mock `setTimeout`, `setInterval` for time-dependent tests

### When NOT to Mock

- **API Calls**: Never mock API calls in integration tests
- **TanStack Query**: Never mock TanStack Query hooks
- **Authentication**: Never mock authentication in integration tests
- **Data Fetching**: Never mock data fetching hooks
- **Blockchain RPCs**: Never mock blockchain RPC calls

## Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:cov
```

