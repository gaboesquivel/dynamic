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
- Shadcn/ui components (via `@workspace/ui`)
- react-error-boundary for error handling
- zod-validation-error for better validation error messages

## Design System & Dependencies

This app uses `@workspace/ui` as the centralized design system:

- **UI Components**: Import from `@workspace/ui/components/*`
- **Radix Primitives**: Import from `@workspace/ui/radix`
- **Utilities**: Import from `@workspace/ui/lib/utils`
- **Icons**: Import from `lucide-react` via `@workspace/ui`

**Do NOT install** these design system dependencies directly in this app - they are managed centrally in `@workspace/ui`:

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

See [Mobile-First Rules](../../.cursor/rules/frontend/mobile-first.mdc) for detailed guidelines.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/vencura-web
pnpm install
```

### Environment Variables

Create a `.env.local` file in the `apps/vencura-web` directory (you can copy from `.env.example`):

```env
# Dynamic SDK Configuration
# Get your Dynamic environment ID from https://app.dynamic.xyz/
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id

# Vencura API URL
# Default: http://localhost:3000 (for local development)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

**Required Environment Variables:**

- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`: Your Dynamic environment ID from the [Dynamic Dashboard](https://app.dynamic.xyz/). Required for authentication to work properly.

**Optional Environment Variables:**

- `NEXT_PUBLIC_API_URL`: The URL of the Vencura API backend. Defaults to `http://localhost:3000` if not provided.
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN URL for error tracking (optional, defaults to disabled)
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`: Environment name for Sentry (optional, defaults to `NODE_ENV`)

**Getting Your Dynamic Environment ID:**

1. Go to [app.dynamic.xyz](https://app.dynamic.xyz/)
2. Sign up for a free account (if you don't have one)
3. Create a new project or select an existing one
4. Copy the Environment ID from your project settings
5. Add it to your `.env.local` file as `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`

**Note**: If `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is not set, the app will use a placeholder ID and show warnings in development mode. Authentication will not work properly without a valid environment ID.

### Running the Application

```bash
# From monorepo root
pnpm dev

# Or from this directory
cd apps/vencura-ui
pnpm dev
```

The application will be available at `http://localhost:3001` (or the next available port).

## Usage

1. **Sign In**: Use the Dynamic widget to authenticate
2. **Create Wallet**: Select a chain from the dropdown and click "Create Wallet"
3. **View Balance**: Click "Get Balance" to see your wallet balance
4. **Sign Message**: Enter a message and click "Sign" to sign it with your wallet
5. **Send Transaction**: Enter recipient address and amount, then click "Send"

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
│   └── layout.tsx   # Root layout
├── components/       # React components
│   ├── wallet-card.tsx      # Individual wallet card
│   └── wallet-dashboard.tsx # Wallet management dashboard
├── lib/              # Utilities and API client
│   ├── api-client.ts # API client for Vencura backend
│   ├── chains.ts     # Chain configuration and utilities
│   └── dynamic.ts    # Dynamic SDK setup
└── hooks/            # React hooks
```

## API Integration

The frontend communicates with the Vencura API backend. See [Vencura API README](../vencura/README.md) for backend documentation.

### TypeScript SDK

A fully typed TypeScript SDK (`@vencura/core`) is available for interacting with the Vencura API. The SDK is auto-generated from the Swagger/OpenAPI specification. See [@vencura/core README](../../packages/vencura-core/README.md) for usage details.

**Note**: This UI currently uses a custom API client, but you can use `@vencura/core` for type-safe API interactions.

### React Hooks

For React applications, **[@vencura/react](../../packages/vencura-react/README.md)** provides React hooks built on TanStack Query, offering:

- Automatic caching and refetching
- Optimistic updates
- Type-safe hooks for all API operations
- Query key factory for cache management

This is the recommended approach for new React applications.

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

The Vencura UI is deployed to **Vercel**. See [ADR 008](../../.adrs/008-frontend-infrastructure.md) for deployment details.

## License

PROPRIETARY
