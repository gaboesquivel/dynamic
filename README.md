# Vencura

Vencura is a custodial wallet platform - the Venmo of wallets. A full-stack monorepo featuring a multichain custodial wallet API and Mathler game.

## Structure

```
dynamic/
├── apps/
│   ├── vencura/          # NestJS backend API (multichain custodial wallet platform)
│   ├── vencura-ui/       # Next.js frontend for Vencura API (multichain support)
│   └── mathler/          # Next.js Mathler game (Wordle with numbers)
├── packages/
│   ├── vencura-core/     # TypeScript SDK for Vencura API (auto-generated)
│   ├── vencura-react/    # React hooks for Vencura API using TanStack Query
│   ├── ui/               # Shared Shadcn/ui component library
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
└── infra/
    └── vencura/          # Pulumi infrastructure for Vencura API
```

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Shadcn/ui, Tailwind CSS, Radix UI
- **Authentication**: Dynamic SDK
- **Linting**: ESLint + Prettier
- **Deployment**: Vercel (frontend apps and Vencura backend API)
- **Infrastructure**: Pulumi (TypeScript) for GCP resources (see [Google Cloud Deployment Option](./docs/google-cloud-deployment.md))

## Projects

- **[Vencura API](./apps/vencura/README.md)** - NestJS backend for multichain custodial wallet management (EVM chains + Solana)
- **[Vencura UI](./apps/vencura-ui/README.md)** - Next.js frontend for Vencura API with multichain support
- **[Mathler](./apps/mathler/README.md)** - Next.js Mathler game with Dynamic SDK
- **[@vencura/core](./packages/vencura-core/README.md)** - TypeScript SDK for Vencura API (auto-generated from Swagger/OpenAPI)
- **[@vencura/react](./packages/vencura-react/README.md)** - React hooks for Vencura API using TanStack Query
- **[UI Package](./packages/ui/README.md)** - Shared Shadcn/ui component library

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
```

## Architecture Decisions

See [ADRs](./.adrs/) for detailed architecture decision records:

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

## Todo

### Vencura API (Backend)

- [x] Integrate Dynamic SDK for authentication
- [x] Implement wallet creation endpoint
- [x] Implement `getBalance()` endpoint
- [x] Implement `signMessage()` endpoint
- [x] Implement `sendTransaction()` endpoint
- [x] Add security considerations and documentation
- [x] Write unit tests
- [ ] Write integration tests
- [x] Add API documentation
- [x] **Multichain support** - Support for EVM chains (Ethereum, Arbitrum, Base, Polygon, Optimism) and Solana
- [x] **Chain-agnostic architecture** - Wallet client factory pattern for multiple blockchain types
- [x] **Dynamic network ID support** - Uses Dynamic SDK's network ID format

### Vencura UI (Frontend)

- [x] Integrate Dynamic SDK for authentication
- [x] Build wallet creation UI
- [x] Build balance display component
- [x] Build message signing interface
- [x] Build transaction sending interface
- [x] Add error handling and loading states
- [x] Implement responsive design
- [x] **Multichain support** - Chain selector for creating wallets on different networks
- [x] **Chain-aware UI** - Currency display and address validation based on chain type

### Mathler (Frontend)

- [ ] Integrate Dynamic SDK for authentication
- [ ] Implement game logic with order of operations
- [ ] Implement color-coded feedback (green/yellow/grey)
- [ ] Store user history in Dynamic metadata
- [ ] Implement daily puzzle system
- [ ] Add crypto-related feature (NFT minting, token rewards, etc.)
- [ ] Add keyboard and mouse controls
- [ ] Polish UI/UX design

### Shared

- [x] Document security considerations (see [Vencura SECURITY.md](./apps/vencura/SECURITY.md))
- [x] Add deployment configuration (Vercel for all apps)
- [x] Review architecture documentation
