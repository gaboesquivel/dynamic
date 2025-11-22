# Elysia Template

Elysia template/example app for reference and experimentation. This template mirrors the patterns and architecture used in the production Vencura API (`@api`).

## Overview

This is a minimal Elysia application template that demonstrates basic patterns and can be used as a starting point for new Elysia-based services. It follows the same architectural patterns as the production API, including contract-first design, Zod validation, black-box testing, and environment variable management.

## Tech Stack

- **Elysia** - Fast, functional web framework with native Zod validation
- **Bun** - Runtime and package manager
- **Zod** - Schema validation
- **Vitest** - Testing framework

## Architecture

- **Contract-first**: Routes consume contracts from `@vencura/types` for type safety
- **Zod validation**: Request/response validation using Zod schemas
- **Blackbox testing**: E2E tests hit HTTP endpoints only (see [Testing](#testing))
- **Environment validation**: Uses `validateEnvOrThrow` from `@vencura/lib` for fail-fast config validation

## Getting Started

### Prerequisites

- Bun >= 1.3.2
- Node.js >= 20

### Installation

```bash
# From monorepo root
bun install

# Or from this directory
cd apps/elysia
bun install
```

### Running Locally

```bash
# Development mode
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

The server will be available at `http://localhost:3077` (or configured port).

### Environment Variables

This app uses environment-specific configuration files. See [Environment Strategy](/docs/adrs/014-environment-strategy) for the complete pattern.

**File Structure:**
- `.env` - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- `.env.development` - Development configuration (committed, non-sensitive)
- `.env.staging` - Staging configuration (committed, non-sensitive)
- `.env.production` - Production configuration (committed, non-sensitive)
- `.env.test` - Test configuration (committed, non-sensitive)

**Setup for Local Development:**

```bash
# Copy the example file for sensitive data
cp .env-example .env

# Fill in your actual sensitive values in .env
# PORT=3077
```

**Using Environment Variables in Code:**

This app exports a validated environment configuration object (`zEnv`) from `src/lib/env.ts`. Always import and use `zEnv` instead of accessing `process.env` directly:

```typescript
import { zEnv } from '@/lib/env'

// Use zEnv instead of process.env
const port = zEnv.PORT
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

### Unit Tests

```bash
# Run unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:cov
```

**Testing Strategy:**
- **Blackbox testing**: All tests hit HTTP endpoints only, ensuring end-to-end validation
- **Contract-based**: Tests validate responses match contracts from `@vencura/types`
- **Vitest**: Uses Vitest with the same configuration patterns as the production API

See [Testing Rules](../../.cursor/rules/backend/testing.mdc) for Elysia testing patterns.

## Project Structure

```
elysia/
├── src/
│   ├── index.ts          # Elysia app entry point
│   ├── routes/           # Route handlers (hello, etc.)
│   ├── lib/              # Utilities (env, load-env)
│   └── test/             # Test utilities and setup
└── package.json
```

## Related Documentation

- [Elysia Rules](../../.cursor/rules/backend/elysia.mdc) - Elysia development patterns
- [Testing Rules](../../.cursor/rules/backend/testing.mdc) - Testing patterns
- [TypeScript Rules](../../.cursor/rules/base/typescript.mdc) - Type safety patterns
- [Environment Rules](../../.cursor/rules/base/environment.mdc) - Environment variable patterns
- [Vencura API](../../apps/api/README.md) - Production Elysia API implementation
- [Documentation Site](/docs) - High-level architecture and ADRs

## License

PROPRIETARY

