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

**Current Deployment**: All applications (UI + API) are currently deployed on **Vercel**. We are NOT splitting the architecture now - everything stays on Vercel to leverage its unparalleled shipping and distribution capabilities. See [Vercel Portability Strategy](./docs/vercel-portability-strategy.md) for details.

**For custodial wallet security**: Google Cloud + Pulumi provides enhanced control and security over sensitive financial data, making it a potential option for future production workloads requiring strict data governance. This is documented as a future option ONLY if production security requirements demand it. See [ADR 007](./.adrs/007-vencura-api-infrastructure.md) and [ADR 010](./.adrs/010-vencura-infra-orchestration.md) for detailed infrastructure decisions.

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

### Cursor Rules

Code standards are defined in [`.cursor/rules/`](.cursor/rules/) organized by domain:

- **Base**: [TypeScript](./.cursor/rules/base/typescript.mdc), [General](./.cursor/rules/base/general.mdc)
- **Frontend**: [React](./.cursor/rules/frontend/react.mdc), [Next.js](./.cursor/rules/frontend/nextjs.mdc), [React Hooks](./.cursor/rules/frontend/react-hooks.mdc), [ShadcnUI](./.cursor/rules/frontend/shadcnui.mdc), [Stack](./.cursor/rules/frontend/stack.mdc)
- **Backend**: [NestJS](./.cursor/rules/backend/nestjs.mdc)
- **Web3**: [Viem](./.cursor/rules/web3/viem.mdc), [Wagmi](./.cursor/rules/web3/wagmi.mdc), [Solana](./.cursor/rules/web3/solana.mdc), [Multichain](./.cursor/rules/web3/multichain.mdc), [Solidity](./.cursor/rules/web3/solidity.mdc), [Ponder](./.cursor/rules/web3/ponder.mdc), [Cosmos](./.cursor/rules/web3/cosmos.mdc)

See [`.cursor/README.md`](.cursor/README.md) for more information on rules and MCP configuration.

### Architecture Decisions

Architectural decisions are documented in [Architecture Decision Records (ADRs)](./.adrs/):

- [001: Monorepo vs Standalone](./.adrs/001-monorepo-vs-standalone.md)
- [002: Vencura API Framework](./.adrs/002-vencura-api-framework.md)
- [003: Frontend Apps Framework](./.adrs/003-frontend-apps-framework.md)
- [004: Design System](./.adrs/004-design-system.md)
- [005: Package Manager](./.adrs/005-package-manager.md)
- [006: Linters](./.adrs/006-linters.md)
- [007: Vencura API Infrastructure](./.adrs/007-vencura-api-infrastructure.md)
- [008: Frontend Infrastructure](./.adrs/008-frontend-infrastructure.md)
- [009: Viem vs Ethers](./.adrs/009-viem-vs-ethers.md)
- [010: Vencura Infrastructure Orchestration](./.adrs/010-vencura-infra-orchestration.md)
- [011: Vencura API ORM Selection](./.adrs/011-vencura-api-orm.md)

## AI-Assisted Development

This project leverages AI tools throughout the development workflow:

- **[v0.dev](https://v0.dev)**: UI component generation via MCP integration (configured in [`.cursor/mcp.json`](.cursor/mcp.json))
- **Cursor Rules**: Automated code standards enforcement (see [Standards & Conventions](#standards--conventions))
- **Composer 1 Agent**: Planning and building workflow for complex features
- **Sourcery.ai**: Automated code reviews and quality checks
- **MCP Servers**: Enhanced AI capabilities via Model Context Protocol (see [MCP Servers Guide](./docs/mcp-servers.md))

See [`.cursor/README.md`](.cursor/README.md) for MCP server configuration details and [MCP Servers Guide](./docs/mcp-servers.md) for usage documentation.

## Projects

### Applications

- **[Vencura API](./apps/api/README.md)** - NestJS backend for multichain custodial wallet management
- **[Vencura Web](./apps/web/README.md)** - Next.js frontend for Vencura API
- **[Mathler](./apps/mathler/README.md)** - Next.js Mathler game

### Packages

- **[@vencura/core](./packages/core/README.md)** - TypeScript SDK (auto-generated)
- **[@vencura/react](./packages/react/README.md)** - React hooks with TanStack Query
- **[@vencura/ai](./packages/ai/README.md)** - AI chatbot component and SDK for wallet operations
- **[UI Package](./packages/ui/README.md)** - Shared Shadcn/ui components

### Contracts

- **[EVM Contracts](./contracts/evm/README.md)** - Foundry-based test token contracts for EVM chains
- **[Solana Contracts](./contracts/solana/README.md)** - Anchor-based test token programs for Solana

### Live Deployments

- **[API Swagger Interface](https://vencura-api.vercel.app/api)**: Interactive OpenAPI documentation for the Vencura API.
- **[Vencura Wallet UI](https://vencura-web.vercel.app)**: Web application for accessing and managing the Vencura multichain custodial wallet.
- **[Mathler Game Example](https://vencura-mathler.vercel.app)**: Mathler game demo built with Next.js.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all apps in development mode
pnpm dev

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
```

For project-specific setup, see individual project READMEs linked in [Projects](#projects).

## Contracts

This monorepo includes smart contracts for both EVM and Solana chains:

- **EVM Contracts** (`contracts/evm/`): Built with Foundry, includes TestToken contract for testing and faucet purposes
  - **Deployed on Arbitrum Sepolia**: DNMC (Dynamic Arcade Token), Mocked USDC, and Mocked USDT tokens
  - See [EVM Contracts README](./contracts/evm/README.md) for deployment addresses and block explorer links
- **Solana Contracts** (`contracts/solana/`): Built with Anchor framework, includes TestToken program matching EVM functionality

Both implementations provide open minting/burning functionality for testing environments. See the respective README files for detailed documentation.
