# Vencura API

Elysia backend API for multichain custodial wallet management. Provides REST endpoints for wallet operations, transaction signing, and balance queries across EVM and Solana chains.

## Overview

The Vencura API is built with **Elysia**, a fast, functional, Zod-first web framework. It integrates with the Dynamic SDK for wallet management and transaction signing, providing a unified API for multichain operations.

## Tech Stack

- **Elysia** - Fast, functional web framework with native Zod validation
- **Bun** - Runtime and package manager
- **Dynamic SDK** - Multichain wallet infrastructure (`@dynamic-labs-wallet/node`)
- **Drizzle ORM** - Type-safe database queries
- **PGLite** - Embedded PostgreSQL for development/testing
- **Vitest** - Testing framework

## Architecture

- **Contract-first**: Routes consume contracts from `@vencura/types` for type safety
- **Zod validation**: Request/response validation using Zod schemas
- **OpenAPI**: Auto-generated Swagger documentation via `@elysiajs/swagger`
- **Blackbox testing**: E2E tests hit HTTP endpoints only (see [Testing](#testing))

## Getting Started

### Prerequisites

- Bun >= 1.3.2
- Node.js >= 20
- Dynamic SDK environment ID and API token

### Installation

```bash
# From monorepo root
bun install

# Or from this directory
cd apps/api
bun install
```

### Running Locally

```bash
# Development mode (from monorepo root)
bun run dev:local  # Starts Anvil + API

# Or from this directory
bun run dev
```

The API will be available at `http://localhost:3077` (or configured port).

### Environment Variables

This app uses environment-specific configuration files. See [Environment Strategy](/docs/adrs/014-environment-strategy) for the complete pattern.

**File Structure:**
- `.env` - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- `.env.development` - Development configuration (committed, non-sensitive) - Local Anvil blockchain
- `.env.staging` - Staging configuration (committed, non-sensitive) - Testnet networks
- `.env.production` - Production configuration (committed, non-sensitive) - Mainnet networks
- `.env.test` - Test configuration (committed, non-sensitive) - Local Anvil blockchain

**Setup for Local Development:**

```bash
# Copy the example file for sensitive data
cp .env-example .env

# Fill in your actual sensitive values in .env
# DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
# DYNAMIC_API_TOKEN=your_dynamic_api_token
```

**Using Environment Variables in Code:**

This app exports a validated environment configuration object (`zEnv`) from `src/lib/env.ts`. Always import and use `zEnv` instead of accessing `process.env` directly:

```typescript
import { zEnv } from '@/lib/env'

// Use zEnv instead of process.env
const envId = zEnv.DYNAMIC_ENVIRONMENT_ID
```

The `zEnv` object is validated at module load using Zod schemas and `validateEnvOrThrow` from `@vencura/lib`. Validation fails fast if required variables are missing.

See [Environment Rules](../../.cursor/rules/base/environment.mdc) for implementation patterns.

## Development

```bash
# Development mode
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Lint
bun run lint
```

## Testing

### E2E Tests

The API uses a **blackbox testing strategy** with testnet networks:

```bash
# Run E2E tests (requires Foundry for Anvil)
bun run test:e2e
```

**Testing Strategy:**
- **Testnet-based**: Tests run against Arbitrum Sepolia testnet (Dynamic SDK doesn't support localhost chains)
- **Automated gas funding**: Wallets are auto-funded with minimum ETH using `ARB_TESTNET_GAS_FAUCET_KEY`
- **Test tokens**: Uses deployed test tokens (USDT, USDC, DNMC) on Arbitrum Sepolia
- **Blackbox testing**: All tests hit HTTP endpoints only, ensuring end-to-end validation
- **Dynamic SDK integration**: All transaction signing uses the real Dynamic SDK (no mocks)
- **Balance endpoint tests**: `src/routes/balance.spec.ts` tests the `/wallets/balance` endpoint which requires `chainId`, `chainType`, and authentication. Supports both native token and ERC20 token balance queries.

See [API Test Documentation](./test/README.md) for complete testing strategy details.

## API Documentation

Interactive OpenAPI/Swagger documentation is available at `/api` when running the server.

**Production**: [https://vencura-api.vercel.app/api](https://vencura-api.vercel.app/api)  
**Staging**: [https://vencura-api-dev.vercel.app/api](https://vencura-api-dev.vercel.app/api)

## Utility Libraries

This app leverages shared utility libraries:

- **@vencura/lib**: Error handling (`getErrorMessage`, `formatZodError`), async utilities (`fetchWithTimeout`, `delay`), env validation (`validateEnvOrThrow`)
- **@vencura/types**: Shared API contracts and Zod schemas
- **zod**: Schema validation and type inference
- **lodash**: Array/object operations, type checking

See [@vencura/lib README](../../packages/lib/README.md) for complete utility documentation.

## Database

The API uses **PGLite** (embedded PostgreSQL) for local development and testing. Database schema is initialized automatically on first access.

### Tables

- **`key_shares`**: Stores encrypted server-side key shares for wallet signing operations. Keyed by `(user_id, address, chain_type)`.
- **`token_metadata`**: Caches ERC20 token metadata (name, symbol, decimals) to avoid repeated on-chain queries. Keyed by `(address, chain_id)`.

### Token Metadata Caching

Token metadata is automatically cached in the database to improve performance:

1. **First request**: Token metadata is fetched from the blockchain via viem `readContract` calls
2. **Caching**: Metadata is stored in `token_metadata` table
3. **Subsequent requests**: Metadata is retrieved from database cache (no on-chain calls)

**Seeded tokens**: The database is automatically seeded with testnet token metadata on initialization:
- **USDC** (`0x6a2fE04d877439a44938D38709698d524BCF5c40`) on Arbitrum Sepolia (chain ID: 421614)
- **USDT** (`0x5f036f0B6948d4593364f975b81caBB3206aD994`) on Arbitrum Sepolia (chain ID: 421614)
- **DNMC** (`0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F`) on Arbitrum Sepolia (chain ID: 421614)

## Project Structure

```
api/
├── src/
│   ├── index.ts          # Elysia app entry point
│   ├── routes/           # Route handlers (wallet, balance, hello, etc.)
│   ├── lib/              # Utilities (env, errors, etc.)
│   ├── services/         # Business logic services
│   │   ├── balance.service.ts      # Balance retrieval logic
│   │   ├── token-metadata.service.ts  # Token metadata caching
│   │   └── wallet.service.ts      # Wallet creation logic
│   └── db/               # Database schema and migrations
│       └── schema.ts     # Drizzle ORM schema definitions
├── test/                 # E2E tests
└── package.json
```

## Related Documentation

- [Elysia Rules](../../.cursor/rules/backend/elysia.mdc) - Elysia development patterns
- [Testing Rules](../../.cursor/rules/backend/testing.mdc) - Testing patterns
- [TypeScript Rules](../../.cursor/rules/base/typescript.mdc) - Type safety patterns
- [Environment Rules](../../.cursor/rules/base/environment.mdc) - Environment variable patterns
- [Documentation Site](/docs) - High-level architecture and ADRs

## License

PROPRIETARY

