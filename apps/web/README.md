# Vencura UI

Frontend application for interacting with the Vencura API - a multichain custodial wallet platform.

## Features

- **Multichain Support**: Create and manage wallets across multiple blockchain networks
  - **EVM Chains**: Ethereum, Arbitrum, Base, Polygon, Optimism, and all viem-supported chains
  - **Solana**: Mainnet, Devnet, and Testnet
- **Dynamic SDK Authentication**: Secure user authentication
- **Wallet Management**: Create wallets on any supported chain
- **Balance Checking**: View balances with chain-specific currency display
- **Message Signing**: Sign messages with wallet private keys
- **Transaction Sending**: Send transactions on any supported chain
- **Token Faucet**: Mint and burn test tokens on Arbitrum Sepolia (DNMC, USDC, USDT)
- **Chain-Aware UI**:
  - Chain selector dropdown for wallet creation
  - Address validation based on chain type (EVM vs Solana)
  - Currency display (ETH, SOL, MATIC, etc.) based on selected chain
  - Network information display

## Tech Stack

- Next.js 16.0.0
- React 19.1.1
- TypeScript
- TanStack Query (with devtools in development mode)
- Dynamic SDK
- Tailwind CSS
- Shadcn/ui components (via `@vencura/ui`)
- react-error-boundary for error handling
- zod-validation-error for better validation error messages

## Design System & Dependencies

This app uses `@vencura/ui` as the centralized design system:

- **UI Components**: Import from `@vencura/ui/components/*`
- **Radix Primitives**: Import from `@vencura/ui/radix`
- **Utilities**: Import from `@vencura/ui/lib/utils`
- **Icons**: Import from `lucide-react` via `@vencura/ui`

**Do NOT install** these design system dependencies directly in this app - they are managed centrally in `@vencura/ui`:

- Any `@radix-ui/react-*` packages
- `class-variance-authority`, `clsx`, `tailwind-merge`

**Do install** these app-level dependencies:

- `next-themes` - Theme provider (configured per app)
- `lucide-react` - If you need icons directly (UI components already include it)

## Mobile-First Design

This app follows **mobile-first responsive design**:

- Base styles target mobile devices (default)
- Enhancements added for larger screens using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- All components are designed mobile-first, then enhanced for desktop

See [Mobile-First Rules](../../.cursor/rules/frontend/mobile-first.mdc) for detailed guidelines and patterns.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/web
pnpm install
```

### Environment Variables

This Next.js app uses environment-specific configuration files following [ADR 014: Environment Strategy](/docs/adrs/014-environment-strategy). Next.js automatically loads environment files in priority order:

1. `.env` (highest priority, sensitive data, never committed, overrides everything)
2. `.env.development` / `.env.staging` / `.env.production` (based on NODE_ENV, committed configs)

**File Structure:**

- `.env` - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- `.env.development` - Development configuration (committed, non-sensitive) - Local development with API at `http://localhost:3077`
- `.env.staging` - Staging configuration (committed, non-sensitive) - Staging environment with testnet API
- `.env.production` - Production configuration (committed, non-sensitive) - Production environment with mainnet API
- `.env-example` - Template for `.env` file (shows required sensitive variables)

**Setup for Local Development:**

```bash
# Copy the example file for sensitive data
cp .env-example .env

# Fill in your actual sensitive values in .env
# NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id

# .env.development is already committed with non-sensitive configs
```

**Required Environment Variables:**

- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`: Your Dynamic environment ID from the [Dynamic Dashboard](https://app.dynamic.xyz/). Required for authentication to work properly.

**Optional Environment Variables:**

- `NEXT_PUBLIC_API_URL`: The URL of the Vencura API backend. Defaults to `http://localhost:3077` if not provided.
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN URL for error tracking (optional, defaults to disabled)
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`: Environment name for Sentry (optional, defaults to `NODE_ENV`)

**Note**: `.env.development`, `.env.staging`, and `.env.production` are committed files with non-sensitive configuration. Sensitive data (like `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`) should be in `.env` file (never committed).

**Getting Your Dynamic Environment ID:**

1. Go to [app.dynamic.xyz](https://app.dynamic.xyz/)
2. Sign up for a free account (if you don't have one)
3. Create a new project or select an existing one
4. Copy the Environment ID from your project settings
5. Add it to your `.env` file as `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`

**Note**: If `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is not set, the app will use a placeholder ID and show warnings in development mode. Authentication will not work properly without a valid environment ID.

See [ADR 014: Environment Strategy](/docs/adrs/014-environment-strategy) for the complete architecture decision and [Environment Rules](../../.cursor/rules/base/environment.mdc) for implementation patterns.

### Running the Application

```bash
# From monorepo root
pnpm dev

# Or from this directory
cd apps/web
pnpm dev
```

The application will be available at `http://localhost:3001` (or the next available port).

## Usage

1. **Sign In**: Use the Dynamic widget to authenticate
2. **Create Wallet**: Select a chain from the dropdown and click "Create Wallet"
3. **View Balance**: Click "Get Balance" to see your wallet balance
4. **Sign Message**: Enter a message and click "Sign" to sign it with your wallet
5. **Send Transaction**: Enter recipient address and amount, then click "Send"
6. **Token Faucet**: Navigate to `/faucet` to mint or burn test tokens (DNMC, USDC, USDT) on Arbitrum Sepolia

## Supported Chains

### EVM Chains

- Ethereum (Mainnet, Sepolia)
- Arbitrum (One, Sepolia)
- Base (Mainnet, Sepolia)
- Polygon (Mainnet, Amoy)
- Optimism (Mainnet, Sepolia)
- All other viem-supported EVM chains

### Solana

- Mainnet
- Devnet
- Testnet

## Project Structure

```
vencura-ui/
├── app/              # Next.js app directory
│   ├── page.tsx     # Main page component
│   ├── faucet/      # Token faucet page
│   │   └── page.tsx
│   └── layout.tsx   # Root layout
├── components/       # React components
│   ├── wallet-card.tsx      # Individual wallet card
│   ├── wallet-dashboard.tsx # Wallet management dashboard
│   └── faucet/      # Faucet components
│       ├── faucet-table.tsx
│       └── faucet-dialog.tsx
├── lib/              # Utilities and API client
│   ├── api-client.ts # API client for Vencura backend
│   ├── chains.ts     # Chain configuration and utilities
│   ├── dynamic.ts    # Dynamic SDK setup
│   ├── tokens.ts     # Token configuration (DNMC, USDC, USDT)
│   └── wagmi-config.ts # Wagmi configuration
└── hooks/            # React hooks
```

## API Integration

The frontend communicates with the Vencura API backend. See [Vencura API README](../api/README.md) for backend documentation.

### Recommended: React Hooks with @vencura/react

**[@vencura/react](../../packages/react/README.md)** provides React hooks built on TanStack Query, offering:

- Automatic caching and refetching
- Optimistic updates
- Type-safe hooks for all API operations
- Query key factory for cache management
- End-to-end type safety from API contracts

**Example:**

```tsx
import { useWallets, useCreateWallet } from '@vencura/react'

function WalletsList() {
  const { data: wallets, isLoading } = useWallets()
  const createWallet = useCreateWallet()

  return (
    <div>
      <button onClick={() => createWallet.mutate({ chainId: 421614 })}>Create Wallet</button>
      {wallets?.map(wallet => (
        <div key={wallet.id}>{wallet.address}</div>
      ))}
    </div>
  )
}
```

This is the **recommended approach** for React applications. See [@vencura/react README](../../packages/react/README.md) for complete documentation.

### TypeScript SDK

A fully typed TypeScript SDK (`@vencura/core`) is available for programmatic API interactions. The SDK is auto-generated from the Swagger/OpenAPI specification using a contract-first approach with ts-rest. See [@vencura/core README](../../packages/core/README.md) for usage details.

**Related Packages:**

- [@vencura/core](../../packages/core/README.md) - TypeScript SDK for Vencura API
- [@vencura/types](../../packages/types/README.md) - Shared API contracts and types
- [@vencura/react](../../packages/react/README.md) - React hooks (recommended for React apps)

### Development Tools

**TanStack Query Devtools** are automatically enabled in development mode. The devtools provide:

- Query inspection and debugging
- Cache state visualization
- Performance monitoring
- Query invalidation testing

The devtools are conditionally rendered only when `NODE_ENV === 'development'` and are placed inside the `QueryClientProvider` for proper functionality.

### API Endpoints Used

- `GET /wallets` - Get all user wallets
- `POST /wallets` - Create a new wallet (requires `chainId`)
- `GET /wallets/:id/balance` - Get wallet balance
- `POST /wallets/:id/sign` - Sign a message
- `POST /wallets/:id/send` - Send a transaction

## Development

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Testing

### E2E Tests

E2E tests use Playwright to test the application in a real browser environment.

```bash
# Run e2e tests (builds and starts the app automatically)
pnpm test:e2e

# Run e2e tests with UI mode (interactive)
pnpm test:e2e:ui

# Run e2e tests in debug mode
pnpm test:e2e:debug
```

**E2E Test Coverage:**

- Page loading and rendering
- Unauthenticated state (welcome message)
- Dynamic widget presence
- Responsive design on mobile viewports
- Error handling and console error detection

**Note**: E2E tests require the app to be built. The test runner will automatically build and start the production server before running tests. Tests that require authentication are skipped by default (marked with `test.skip`) and can be enabled when authentication is properly configured.

## Multichain Implementation

The UI supports multiple blockchain networks through:

1. **Chain Configuration** (`lib/chains.ts`): Defines supported chains, their metadata, and validation utilities
2. **Chain Selector**: Dropdown in wallet dashboard to select chain when creating wallets
3. **Chain-Aware Components**: Wallet card adapts based on chain type:
   - Address validation (EVM 0x format vs Solana base58)
   - Currency display (ETH, SOL, MATIC, etc.)
   - Network information display

## Deployment

The Vencura UI is deployed to **Vercel**. See [ADR 008: Frontend Infrastructure](/docs/adrs/008-frontend-infrastructure) for deployment details and architecture decisions.

## License

PROPRIETARY
