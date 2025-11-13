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

- Next.js 15
- React 19
- TypeScript
- Dynamic SDK
- Tailwind CSS
- Shadcn/ui components

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/vencura-ui
pnpm install
```

### Environment Variables

Create a `.env.local` file in the `apps/vencura-ui` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

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
