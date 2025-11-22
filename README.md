# Vencura

**The Venmo of wallets** — A custodial wallet platform that makes multichain crypto as simple as sending a text. Built with portability in mind - deploy anywhere without vendor lock-in.

## Features

### Wallet Management
- 🔐 **Custodial Wallets** - Secure 2-of-2 threshold signature wallets managed on the backend
- 🌐 **Multichain Support** - Create and manage wallets across EVM chains (Ethereum, Arbitrum, Base, Polygon, Optimism) and Solana
- 💰 **Balance Checking** - View balances with chain-specific currency display
- ✍️ **Message Signing** - Sign messages with wallet private keys
- 📤 **Transaction Sending** - Send transactions on any supported chain

### Developer Experience
- 🚀 **TypeScript SDK** - Contract-first SDK (`@vencura/core`) with full type safety
- ⚛️ **React Hooks** - TanStack Query-powered hooks (`@vencura/react`) for seamless integration
- 📚 **OpenAPI Documentation** - Interactive Swagger UI with auto-generated SDKs
- 🎨 **UI Components** - Shared Shadcn/ui component library (`@vencura/ui`)

### AI-Powered
- 🤖 **AI Chatbot** - Natural language interface for wallet operations
- 🧠 **AI-Friendly Architecture** - Clean HTTP contracts, Zod-first validation, typed SDKs

### Platform & Infrastructure
- 🚢 **Portable by Default** - Deploy to any containerized platform (Docker, Kubernetes, etc.)
- ⚡ **Fast Development** - Bun runtime, Biome formatting, optimized tooling
- 🧪 **Testing** - Blackbox HTTP API testing with automated local blockchain setup

## Live Deployments

### Production
- 🌐 **[Vencura Wallet UI](https://vencura-web.vercel.app)** - Web application for managing multichain custodial wallets
- 📡 **[API Swagger Interface](https://vencura-api.vercel.app/api)** - Interactive OpenAPI documentation
- 📖 **[Documentation Site](https://vencura-docs.vercel.app)** - Architecture, ADRs, and developer guides
- 🎮 **[Mathler Game](https://vencura-mathler.vercel.app)** - Mathler game demo

### Staging
- 🌐 **[Vencura Wallet UI (Staging)](https://vencura-web-git-develop.vercel.app)**
- 📡 **[API Swagger Interface (Staging)](https://vencura-api-dev.vercel.app/api)**
- 🎮 **[Mathler Game (Staging)](https://vencura-mathler-dev.vercel.app)**

## Getting Started

```bash
# Install dependencies
bun install

# Run all apps in development mode (with local Anvil blockchain)
bun run dev:local

# Run all apps in staging mode (with testnets)
bun run dev:staging

# Build all apps
bun run build

# Run quality checks (install, format, lint, build, test)
bun run qa
```

### Quick Setup

1. Copy example env files:
   ```bash
   cp apps/api/.env-example apps/api/.env
   cp apps/web/.env-example apps/web/.env
   ```
2. Fill in your values (Dynamic environment ID, API token, etc.)
3. Start local development: `bun run dev:local`

See [Getting Started Guide](/docs/getting-started) and [Environment Strategy](/docs/environment) for detailed setup instructions.

## Architecture

This monorepo follows a modular architecture with clear separation between applications, shared packages, and infrastructure. **Built with portability in mind - deploy anywhere without vendor lock-in.**

### Structure

```
dynamic/
├── apps/              # Applications
│   ├── api/           # Elysia backend API (multichain custodial wallet platform)
│   ├── web/           # Next.js frontend for Vencura API
│   ├── docs/          # Documentation site (Fumadocs)
│   ├── mathler/       # Next.js Mathler game
│   └── elysia/        # Elysia template/example app
├── packages/          # Shared packages
│   ├── core/          # TypeScript SDK for Vencura API (contract-first)
│   ├── react/         # React hooks for Vencura API using TanStack Query
│   ├── types/         # Shared API contracts and types (Zod schemas, ts-rest contracts)
│   ├── ui/            # Shared Shadcn/ui component library
│   ├── lib/           # Shared utility library (@vencura/lib)
│   ├── evm/           # EVM token contract ABIs and utilities
│   └── tools/         # Development tools enabled by feature flags
├── contracts/         # Smart contracts
│   ├── evm/           # EVM contracts (Foundry)
│   └── solana/        # Solana programs (Anchor)
└── infra/             # Infrastructure as Code
    └── vencura/       # Pulumi infrastructure for Vencura API
```

### Portable by Default

**Critical architectural principle**: Our stack is designed for portability and runs on any Linux distribution:

- **Default approach**: Avoid vendor-specific features to maintain portability
- **Pragmatic exceptions**: Can leverage vendor features (e.g., Vercel edge functions) when scaling/performance needs justify
- **Platform-agnostic**: Can be deployed to any containerized platform (Docker, Kubernetes, etc.)
- **Vercel as convenience**: Vercel is chosen for rapid deployment and excellent developer experience, not as a requirement

**Current Deployment**: All applications (UI + API) are currently deployed on **Vercel**. See [Vercel Portability Strategy](/docs/vercel-portability) for details.

For comprehensive architecture documentation, see the [Architecture Guide](/docs/architecture).

## Projects

### Applications
- **[Vencura API](./apps/api/README.md)** - Elysia backend for multichain custodial wallet management
- **[Vencura Web](./apps/web/README.md)** - Next.js frontend for Vencura API
- **[Documentation Site](./apps/docs/README.md)** - Fumadocs-based documentation site
- **[Mathler](./apps/mathler/README.md)** - Next.js Mathler game

### Packages
- **[@vencura/core](./packages/core/README.md)** - TypeScript SDK for Vencura API (contract-first)
- **[@vencura/react](./packages/react/README.md)** - React hooks with TanStack Query for Vencura API
- **[@vencura/types](./packages/types/README.md)** - Shared API contracts and types (Zod schemas, ts-rest contracts)
- **[@vencura/evm](./packages/evm/README.md)** - EVM token contract ABIs and utilities
- **[@vencura/lib](./packages/lib/README.md)** - Shared utility library (error handling, async utilities, env validation)
- **[@vencura/tools](./packages/tools/README.md)** - Development tools enabled by feature flags
- **[@vencura/ui](./packages/ui/README.md)** - Shared Shadcn/ui component library

### Contracts
- **[EVM Contracts](./contracts/evm/README.md)** - Foundry-based test token contracts for EVM chains
- **[Solana Contracts](./contracts/solana/README.md)** - Anchor-based test token programs for Solana

## Standards & Conventions

This project follows strict coding standards enforced through Cursor rules and documented in Architecture Decision Records (ADRs).

### Tooling
- **Package Manager**: Bun (see [ADR 005: Package Manager](/docs/adrs/005-package-manager))
- **Linting & Formatting**: Biome + ESLint (see [ADR 006: Linters](/docs/adrs/006-linters))
- **Testing**: Vitest with blackbox HTTP API testing strategy (see [Testing Patterns](/docs/tooling/testing-patterns))

### Key Patterns
- **Mobile-First Design**: All frontend components follow mobile-first responsive design. See [Mobile-First Rules](.cursor/rules/frontend/mobile-first.mdc)
- **RORO Pattern**: Functions with multiple parameters use Receive Object, Return Object pattern. See [TypeScript Rules](.cursor/rules/base/typescript.mdc)
- **Type Inference**: Always enforce type inference - define return types in functions when needed, never in consumers
- **Functional Code**: Prefer functional and declarative programming patterns
- **Utility Libraries**: Always leverage `@vencura/lib`, `zod`, and `lodash` instead of custom implementations

### Cursor Rules

Code standards are defined in [`.cursor/rules/`](.cursor/rules/) organized by domain:

- **Base**: [TypeScript](.cursor/rules/base/typescript.mdc), [Environment](.cursor/rules/base/environment.mdc), [General](.cursor/rules/base/general.mdc)
- **Frontend**: [React](.cursor/rules/frontend/react.mdc), [Next.js](.cursor/rules/frontend/nextjs.mdc), [React Hooks](.cursor/rules/frontend/react-hooks.mdc), [Mobile-First](.cursor/rules/frontend/mobile-first.mdc), [ShadcnUI](.cursor/rules/frontend/shadcnui.mdc), [Stack](.cursor/rules/frontend/stack.mdc)
- **Backend**: [Elysia](.cursor/rules/backend/elysia.mdc), [Testing](.cursor/rules/backend/testing.mdc)
- **Web3**: [Viem](.cursor/rules/web3/viem.mdc), [Wagmi](.cursor/rules/web3/wagmi.mdc), [Solana](.cursor/rules/web3/solana.mdc), [Multichain](.cursor/rules/web3/multichain.mdc), [Solidity](.cursor/rules/web3/solidity.mdc), [Ponder](.cursor/rules/web3/ponder.mdc), [Cosmos](.cursor/rules/web3/cosmos.mdc)

See [`.cursor/README.md`](.cursor/README.md) for more information on rules and MCP configuration.

### Architecture Decisions

Architectural decisions are documented in [Architecture Decision Records (ADRs)](/docs/adrs). See the [ADRs index](/docs/adrs) for the complete list.

## AI-Assisted Development

This project leverages AI tools throughout the development workflow. See [MCP Servers Guide](/docs/mcp-servers) for the complete AI-assisted development workflow and [ADR 012: Vencura AI Architecture](/docs/adrs/012-vencura-ai-architecture) for architecture patterns.

**Key tools:**

- **[MCP Servers](/docs/mcp-servers)**: Model Context Protocol servers for enhanced AI capabilities (Shadcn, v0, GitHub, Vercel)
- **[v0.dev](https://v0.dev)**: UI component generation via MCP integration (configured in [`.cursor/mcp.json`](.cursor/mcp.json))
- **Cursor Rules**: Automated code standards enforcement (see [`.cursor/README.md`](.cursor/README.md))
- **[Development Workflow](.cursor/workflow.md)**: Guidelines for using AI effectively in large, full-stack TypeScript codebases

## Documentation

For comprehensive documentation, see the [Documentation Site](https://vencura-docs.vercel.app):

- **[Getting Started](/docs/getting-started)** - Quick start guide
- **[Architecture](/docs/architecture)** - Monorepo architecture overview
- **[Environment Strategy](/docs/environment)** - Environment variable configuration
- **[Deployment](/docs/deployment)** - Deployment and branching strategy
- **[Tooling](/docs/tooling)** - Development tools and stack
- **[MCP Servers](/docs/mcp-servers)** - Model Context Protocol servers guide
- **[ADRs](/docs/adrs)** - Architecture Decision Records

For app-specific documentation, see individual app READMEs in the monorepo.
