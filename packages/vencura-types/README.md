# @vencura/types

Shared API contracts and types for Vencura. This package provides:

- **Zod schemas** for runtime validation and type inference
- **ts-rest contracts** for end-to-end type safety across backend, SDK, and frontend

## Installation

```bash
pnpm add @vencura/types
```

## Usage

### Importing Schemas

```ts
import { Wallet, CreateWalletInput, WalletBalance } from '@vencura/types'
```

### Importing Contracts

```ts
import { walletContract } from '@vencura/types'
```

## Architecture

This package uses a contract-first approach where:

1. **Schemas** define the shape of data using Zod
2. **Contracts** define API endpoints using ts-rest
3. Types are automatically inferred from schemas, ensuring consistency across the stack

## Related Packages

- `@vencura/core` - TypeScript SDK using these types
- `apps/vencura-api` - NestJS backend implementing these contracts
- `@vencura/react` - React hooks using these types
