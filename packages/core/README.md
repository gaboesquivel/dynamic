# @vencura/core

TypeScript SDK for the Vencura API. Provides a typed HTTP client that consumes contracts from `@vencura/types` for contract-first, type-safe API interactions.

## Overview

`@vencura/core` is the TypeScript SDK for interacting with the Vencura API. It's built on a **contract-first architecture** where API contracts are defined in `@vencura/types` and consumed by both the SDK and the backend API, ensuring end-to-end type safety.

## Features

- **Contract-first**: Consumes contracts from `@vencura/types` for type safety
- **Type-safe**: Full TypeScript support with inferred types from Zod schemas
- **HTTP client**: Uses `fetchWithTimeout` from `@vencura/lib` for secure API calls
- **Zod validation**: Response validation using Zod schemas from `@vencura/types`

## Installation

This package is part of the monorepo and is automatically available to all apps. No separate installation needed.

## Usage

### Basic Setup

```typescript
import { createVencuraClient } from '@vencura/core'

const client = createVencuraClient({
  baseUrl: 'https://vencura-api.vercel.app',
  headers: {
    Authorization: 'Bearer your-token',
  },
})

// Use typed client methods
const response = await client.hello()
```

### Client Methods

The client provides typed methods for all API endpoints defined in `@vencura/types` contracts. Each method:

- Validates request parameters using Zod schemas
- Makes HTTP requests with proper error handling
- Validates responses using Zod schemas
- Returns fully typed responses

## Architecture

- **Contract-first**: All endpoints are defined in `@vencura/types` contracts
- **Type inference**: Types are inferred from Zod schemas, ensuring runtime and compile-time safety
- **Shared utilities**: Uses `@vencura/lib` for error handling and HTTP utilities

## Related Packages

- **[@vencura/types](../types/README.md)** - Shared API contracts and types (Zod schemas, ts-rest contracts)
- **[@vencura/react](../react/README.md)** - React hooks built on top of `@vencura/core`
- **[@vencura/lib](../lib/README.md)** - Shared utility library

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
- **Type Inference**: Types inferred from Zod schemas (`z.infer<typeof schema>`)
- **Functional Code**: Prefer functional and declarative programming patterns
- **Utility Libraries**: Always leverage `@vencura/lib`, `zod`, and `lodash` instead of custom implementations

See [TypeScript Rules](../../.cursor/rules/base/typescript.mdc) for detailed guidelines.

## License

PROPRIETARY

