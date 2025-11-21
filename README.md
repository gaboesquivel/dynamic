# Vencura

Vencura is a custodial wallet platform - the Venmo of wallets. A full-stack monorepo featuring a multichain custodial wallet API, AI-powered chatbot, and Mathler game. Built with portability in mind - deploy anywhere without vendor lock-in.

## Architecture

This monorepo follows a modular architecture with clear separation between applications, shared packages, and infrastructure. **Built with portability in mind - deploy anywhere without vendor lock-in.**

### Portable by Default

**Critical architectural principle**: Our stack is designed for portability and runs on any Linux distribution:

- **Default approach**: Avoid vendor-specific features to maintain portability
- **Pragmatic exceptions**: Can leverage vendor features (e.g., Vercel edge functions, optimizations) when scaling/performance needs justify from product/business perspective
- **Platform-agnostic**: Can be deployed to any containerized platform (Docker, Kubernetes, etc.)
- **Vercel as convenience**: Vercel is chosen for rapid deployment and excellent developer experience, not as a requirement
- **All core components** can be migrated to any platform without code changes

**Current Deployment**: All applications (UI + API) are currently deployed on **Vercel**. We are NOT splitting the architecture now - everything stays on Vercel to leverage its unparalleled shipping and distribution capabilities. See [Vercel Portability Strategy](/docs/vercel-portability) for details.

**For custodial wallet security**: Google Cloud + Pulumi provides enhanced control and security over sensitive financial data, making it a potential option for future production workloads requiring strict data governance. This is documented as a future option ONLY if production security requirements demand it. See [ADR 007](/docs/adrs/007-vencura-api-infrastructure) and [ADR 010](/docs/adrs/010-vencura-infra-orchestration) for detailed infrastructure decisions.

### Architecture Structure

```
dynamic/
├── apps/              # Applications
│   ├── api/           # NestJS backend API (multichain custodial wallet platform)
│   ├── web/           # Next.js frontend for Vencura API (multichain support)
│   ├── docs/          # Documentation site
│   └── mathler/       # Next.js Mathler game (Wordle with numbers)
├── packages/          # Shared packages
│   ├── core/          # TypeScript SDK for Vencura API (auto-generated)
│   ├── react/         # React hooks for Vencura API using TanStack Query
│   ├── ai/            # AI chatbot component and SDK
│   ├── types/         # Shared API contracts and types
│   ├── ui/            # Shared Shadcn/ui component library
│   └── lib/           # Shared utility library (@vencura/lib)
├── config/            # Shared configurations
│   ├── eslint/        # Shared ESLint configuration
│   └── typescript/    # Shared TypeScript configuration
├── contracts/         # Smart contracts
│   ├── evm/           # EVM contracts (Foundry)
│   └── solana/        # Solana programs (Anchor)
└── infra/             # Infrastructure as Code
    └── vencura/       # Pulumi infrastructure for Vencura API
```

**Applications** (`apps/`) are deployable services with their own dependencies and configurations. **Packages** (`packages/`) provide shared code and utilities consumed by applications. **Config** (`config/`) contains shared configuration packages for ESLint and TypeScript. **Infrastructure** (`infra/`) contains infrastructure-as-code definitions using Pulumi.

See individual project READMEs for detailed documentation:

- **[Vencura API](./apps/api/README.md)** - Backend API documentation
- **[Vencura Web](./apps/web/README.md)** - Frontend application documentation
- **[Mathler](./apps/mathler/README.md)** - Mathler game documentation
- **[EVM Contracts](./contracts/evm/README.md)** - EVM smart contracts (Foundry)
- **[Solana Contracts](./contracts/solana/README.md)** - Solana programs (Anchor)
- **[Infrastructure](./infra/README.md)** - Infrastructure setup and deployment

## Standards & Conventions

This project follows strict coding standards enforced through Cursor rules and documented in Architecture Decision Records (ADRs).

### Key Patterns

- **Mobile-First Design**: All frontend components follow mobile-first responsive design. See [Mobile-First Rules](.cursor/rules/frontend/mobile-first.mdc) for guidelines.
- **RORO Pattern**: Functions with multiple parameters use Receive Object, Return Object pattern. Single-parameter functions use direct parameters. See [TypeScript Rules](.cursor/rules/base/typescript.mdc).
- **Type Inference**: Always enforce type inference - define return types in functions when needed, never in consumers. See [TypeScript Rules](.cursor/rules/base/typescript.mdc).
- **Functional Code**: Prefer functional and declarative programming patterns. See [TypeScript Rules](.cursor/rules/base/typescript.mdc).

### Cursor Rules

Code standards are defined in [`.cursor/rules/`](.cursor/rules/) organized by domain:

- **Base**: [TypeScript](.cursor/rules/base/typescript.mdc), [Environment](.cursor/rules/base/environment.mdc), [General](.cursor/rules/base/general.mdc)
- **Frontend**: [React](.cursor/rules/frontend/react.mdc), [Next.js](.cursor/rules/frontend/nextjs.mdc), [React Hooks](.cursor/rules/frontend/react-hooks.mdc), [Mobile-First](.cursor/rules/frontend/mobile-first.mdc), [ShadcnUI](.cursor/rules/frontend/shadcnui.mdc), [Stack](.cursor/rules/frontend/stack.mdc)
- **Backend**: [NestJS](.cursor/rules/backend/nestjs.mdc), [Testing](.cursor/rules/backend/testing.mdc)
- **Web3**: [Viem](.cursor/rules/web3/viem.mdc), [Wagmi](.cursor/rules/web3/wagmi.mdc), [Solana](.cursor/rules/web3/solana.mdc), [Multichain](.cursor/rules/web3/multichain.mdc), [Solidity](.cursor/rules/web3/solidity.mdc), [Ponder](.cursor/rules/web3/ponder.mdc), [Cosmos](.cursor/rules/web3/cosmos.mdc)

See [`.cursor/README.md`](.cursor/README.md) for more information on rules and MCP configuration.

### Architecture Decisions

Architectural decisions are documented in [Architecture Decision Records (ADRs)](/docs/adrs):

- [001: Monorepo vs Standalone](/docs/adrs/001-monorepo-vs-standalone)
- [002: Vencura API Framework](/docs/adrs/002-vencura-api-framework)
- [003: Frontend Apps Framework](/docs/adrs/003-frontend-apps-framework)
- [004: Design System](/docs/adrs/004-design-system)
- [005: Package Manager](/docs/adrs/005-package-manager)
- [006: Linters](/docs/adrs/006-linters)
- [007: Vencura API Infrastructure](/docs/adrs/007-vencura-api-infrastructure)
- [008: Frontend Infrastructure](/docs/adrs/008-frontend-infrastructure)
- [009: Viem vs Ethers](/docs/adrs/009-viem-vs-ethers)
- [010: Vencura Infrastructure Orchestration](/docs/adrs/010-vencura-infra-orchestration)
- [011: Vencura API ORM Selection](/docs/adrs/011-vencura-api-orm)
- [012: Vencura AI Architecture](/docs/adrs/012-vencura-ai-architecture)
- [013: Vencura API Test Gas Faucet](/docs/adrs/013-vencura-api-test-gas-faucet)
- [014: Environment Strategy](/docs/adrs/014-environment-strategy)
- [015: Database Storage vs Dynamic SDK Metadata](/docs/adrs/015-database-vs-dynamic-metadata)
- [016: Documentation Framework Migration to Fumadocs](/docs/adrs/016-documentation-framework)

## AI-Assisted Development

This project leverages AI tools throughout the development workflow:

- **[Development Workflow](.cursor/workflow.md)**: Guidelines for using AI effectively in large, full-stack TypeScript codebases
- **[v0.dev](https://v0.dev)**: UI component generation via MCP integration (configured in [`.cursor/mcp.json`](.cursor/mcp.json))
- **Cursor Rules**: Automated code standards enforcement (see [Standards & Conventions](#standards--conventions))
- **MCP Servers**: Enhanced AI capabilities via Model Context Protocol (see [`.cursor/README.md`](.cursor/README.md))

See [`.cursor/README.md`](.cursor/README.md) for MCP server configuration details and [`.cursor/workflow.md`](.cursor/workflow.md) for AI-assisted development workflow guidelines.

## Projects

### Applications

- **[Vencura API](./apps/api/README.md)** - NestJS backend for multichain custodial wallet management
- **[Vencura Web](./apps/web/README.md)** - Next.js frontend for Vencura API
- **[Mathler](./apps/mathler/README.md)** - Next.js Mathler game

### Packages

- **[@vencura/core](./packages/core/README.md)** - TypeScript SDK for Vencura API (contract-first with ts-rest)
- **[@vencura/react](./packages/react/README.md)** - React hooks with TanStack Query for Vencura API
- **[@vencura/types](./packages/types/README.md)** - Shared API contracts and types (Zod schemas, ts-rest contracts)
- **[@vencura/ai](./packages/ai/README.md)** - AI chatbot component and SDK for wallet operations
- **[@vencura/evm](./packages/evm/README.md)** - EVM token contract ABIs and utilities
- **[@vencura/lib](./packages/lib/README.md)** - Shared utility library (error handling, async utilities, env validation)
- **[@vencura/tools](./packages/tools/README.md)** - Development tools enabled by feature flags
- **[@vencura/ui](./packages/ui/README.md)** - Shared Shadcn/ui component library

### Contracts

- **[EVM Contracts](./contracts/evm/README.md)** - Foundry-based test token contracts for EVM chains
- **[Solana Contracts](./contracts/solana/README.md)** - Anchor-based test token programs for Solana

### Live Deployments

#### Production (main branch)

- **[API Swagger Interface](https://vencura-api.vercel.app/api)**: Interactive OpenAPI documentation for the Vencura API.
- **[Vencura Wallet UI](https://vencura-web.vercel.app)**: Web application for accessing and managing the Vencura multichain custodial wallet.
- **[Mathler Game Example](https://vencura-mathler.vercel.app)**: Mathler game demo built with Next.js.

#### Staging (develop branch)

- **[API Swagger Interface (Staging)](https://vencura-api-dev.vercel.app/api)**: Interactive OpenAPI documentation for the Vencura API staging environment.
- **[Vencura Wallet UI (Staging)](https://vencura-web-dev.vercel.app)**: Web application for accessing and managing the Vencura multichain custodial wallet staging environment.
- **[Mathler Game Example (Staging)](https://vencura-mathler-dev.vercel.app)**: Mathler game demo staging environment built with Next.js.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all apps in development mode (with local Anvil blockchain)
pnpm dev:local

# Run all apps in staging mode (with testnets)
pnpm dev:staging

# Build all apps
pnpm build

# Lint all packages and infrastructure
pnpm lint

# Type check all packages and infrastructure
pnpm check-types

# Run quality checks (install, format, lint, build, test)
pnpm run qa

# Build contracts
pnpm run contracts:evm:build      # Build EVM contracts
pnpm run contracts:solana:build  # Build Solana programs

# Test contracts
pnpm run contracts:evm:test       # Test EVM contracts
pnpm run contracts:solana:test    # Test Solana programs

# Test API (requires Foundry for Anvil local blockchain)
cd apps/api && pnpm run test:e2e  # E2E tests with automated gas faucet
```

### Testing Strategy

The API uses a **blackbox testing strategy** with local chains for automation:

- **Local Chain Automation**: Anvil spins up automatically before tests to save gas costs
- **Token Mocking**: Test tokens (USDT, USDC, DNMC) are automatically deployed with open mint functionality
- **Dynamic SDK Integration**: All transaction signing uses the real Dynamic SDK (no mocks)
- **Blackbox Testing**: All tests hit HTTP endpoints only, ensuring end-to-end validation

See [API Test Documentation](./apps/api/test/README.md) for complete testing strategy details.

### Environment Setup

This monorepo uses environment-specific configuration files following a unified strategy. See [ADR 014: Environment Strategy](/docs/adrs/014-environment-strategy) for the complete architecture decision and [Environment Rules](.cursor/rules/base/environment.mdc) for implementation patterns.

**Quick Start:**

1. Copy example env files for each app:
   ```bash
   cp apps/api/.env-example apps/api/.env
   cp apps/web/.env-example apps/web/.env
   ```
2. Fill in your values (Dynamic environment ID, API token, etc.) in `.env` files
3. Start local development: `pnpm dev:local`

**Environment Files:**

All apps use the same environment file structure:

- **`.env`** - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- **`.env.development`** - Development configuration (committed, non-sensitive) - Local Anvil blockchain
- **`.env.staging`** - Staging configuration (committed, non-sensitive) - Testnet networks
- **`.env.production`** - Production configuration (committed, non-sensitive) - Mainnet networks
- **`.env.test`** - Test configuration (committed, non-sensitive) - Local Anvil blockchain (for CI/CD)

**Loading Priority:**

1. `.env` (highest priority, sensitive data, never committed)
2. `.env.<NODE_ENV>` (development/staging/production/test based on NODE_ENV)
3. `.env` fallback (lowest priority)

For project-specific setup, see individual project READMEs:

- [Vencura API](./apps/api/README.md#environment-variables)
- [Vencura Web](./apps/web/README.md#environment-variables)
- [Mathler](./apps/mathler/README.md#environment-variables)

### Deployment and Branching

This monorepo uses **GitHub Flow** with `develop` as the primary development branch. All systems follow a consistent deployment strategy:

- **Branching**: `develop` → `main` workflow with feature branches and hotfixes
- **Deployments**: All systems (`api`, `web`, `mathler`) deploy to Vercel by default
- **Vercel**: No-lock approach - code remains portable, excellent DX
- **Google Cloud**: Available as alternative via Pulumi for enhanced security
- **Hybrid**: Documented as future option for production security requirements

See [Deployment and Branching Strategy](/docs/deployment) for comprehensive documentation on:

- Branching strategy and workflows
- Deployment targets (Vercel, Google Cloud)
- Environment configuration
- CI/CD integration
- Hybrid deployment options

## Contracts

This monorepo includes smart contracts for both EVM and Solana chains:

- **EVM Contracts** (`contracts/evm/`): Built with Foundry, includes TestToken contract for testing and faucet purposes
  - **Deployed on Arbitrum Sepolia**: DNMC (Dynamic Arcade Token), Mocked USDC, and Mocked USDT tokens
  - See [EVM Contracts README](./contracts/evm/README.md) for deployment addresses and block explorer links
- **Solana Contracts** (`contracts/solana/`): Built with Anchor framework, includes TestToken program matching EVM functionality

Both implementations provide open minting/burning functionality for testing environments. See the respective README files for detailed documentation.
