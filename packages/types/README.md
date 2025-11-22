# @vencura/types

Shared API contracts and types for Vencura. Provides Zod schemas and REST-style contracts that are used across backend, SDK, and frontend for contract-first, type-safe API development.

## Overview

`@vencura/types` is the **single source of truth** for API contracts and types. It defines:

- **Zod schemas** for request/response validation
- **REST contracts** (ts-rest style) for endpoint definitions
- **TypeScript types** inferred from Zod schemas

This contract-first approach ensures type safety across the entire stack: backend API (`apps/api`), TypeScript SDK (`@vencura/core`), and React hooks (`@vencura/react`).

## Features

- **Contract-first**: API contracts defined here are consumed by backend and clients
- **Zod validation**: All schemas use Zod for runtime validation and type inference
- **Type inference**: TypeScript types inferred using `z.infer<typeof schema>`
- **Dual exports**: Supports both ESM and CommonJS

## Installation

This package is part of the monorepo and is automatically available to all apps. No separate installation needed.

## Usage

### Importing Schemas

```typescript
import { HelloResponseSchema, WalletSchema } from '@vencura/types'

// Use for validation
const validated = HelloResponseSchema.parse(data)

// Infer types
type HelloResponse = z.infer<typeof HelloResponseSchema>
```

### Importing Contracts

```typescript
import { helloContract, walletContract } from '@vencura/types'

// Use contract path and method
const response = await fetch(`${baseUrl}${helloContract.path}`, {
  method: helloContract.method,
})
```

### Importing from Subpaths

```typescript
// Import schemas only
import { HelloResponseSchema } from '@vencura/types/schemas'

// Import contracts only
import { helloContract } from '@vencura/types/contracts'
```

## Package Structure

```
types/
├── src/
│   ├── schemas/        # Zod schemas for validation
│   ├── contracts/     # REST contracts (ts-rest style)
│   └── index.ts        # Main exports
└── dist/              # Built output (ESM + CJS)
```

## Architecture

- **Single source of truth**: All API contracts defined here
- **Consumed by**: Backend API (`apps/api`), SDK (`@vencura/core`), React hooks (`@vencura/react`)
- **Zod-first**: All validation uses Zod schemas
- **Type inference**: Types inferred from schemas, no manual type definitions

## Development

```bash
# Build (generates dist/)
bun run build

# Lint
bun run lint

# Test
bun run test

# Test with coverage
bun run test:cov
```

## Adding New Contracts

1. **Define Zod schema** in `src/schemas/`:
   ```typescript
   export const MyRequestSchema = z.object({
     field: z.string(),
   })
   ```

2. **Define contract** in `src/contracts/`:
   ```typescript
   export const myContract = {
     path: '/api/my-endpoint',
     method: 'POST' as const,
   }
   ```

3. **Export** from `src/schemas/index.ts` and `src/contracts/index.ts`

4. **Rebuild**: Run `bun run build` to generate dist files

## Coding Standards

This package follows the monorepo's coding standards:

- **Zod-first**: Always use Zod for schema definitions
- **Type inference**: Use `z.infer<typeof schema>` instead of manual types
- **RORO Pattern**: Multi-parameter functions use Receive Object, Return Object pattern
- **Functional Code**: Prefer functional and declarative programming patterns

See [TypeScript Rules](../../.cursor/rules/base/typescript.mdc) for detailed guidelines.

## Related Packages

- **[@vencura/core](../core/README.md)** - TypeScript SDK (consumes contracts)
- **[@vencura/react](../react/README.md)** - React hooks (consumes contracts)
- **[apps/api](../../apps/api/README.md)** - Backend API (consumes contracts)

## License

PROPRIETARY

