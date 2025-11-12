# Vencura API

A multichain custodial wallet backend API built with NestJS, Dynamic authentication, and PGLite.

## Overview

Vencura is a backend API that enables users to create and manage custodial wallets across multiple blockchain networks. It provides secure wallet operations including balance queries, message signing, and transaction sending on supported chains including EVM chains (Ethereum, Arbitrum, Base, Polygon, Optimism) and Solana.

## Features

- **Multichain Support**: Create and manage wallets on multiple blockchain networks
  - **EVM Chains**: Ethereum, Arbitrum, Base, Polygon, Optimism, and all viem-supported EVM chains
  - **Solana**: Mainnet, Devnet, and Testnet
  - **Future Support**: Cosmos, Bitcoin, Flow, StarkNet, Algorand, Sui, Spark, Tron
- **Dynamic Authentication**: Secure user authentication using `@dynamic-labs/sdk-api`
- **Dynamic Wallets**: Server-side wallet management using Dynamic SDK
  - `@dynamic-labs-wallet/node-evm` for EVM chains
  - `@dynamic-labs-wallet/node-svm` for Solana
- **Custodial Wallets**: Create and manage wallets on the backend with 2-of-2 threshold signatures
- **Blockchain Operations**:
  - Get wallet balance (chain-agnostic)
  - Sign messages with wallet private keys
  - Send transactions on any supported chain
- **RPC Configuration**: Uses Dynamic's default RPC URLs with optional per-chain overrides
- **Database**: DrizzleORM with PGLite (development) or Cloud SQL Postgres (production)
- **API Documentation**: Interactive Swagger UI at `/api`
- **Security**:
  - AES-256-GCM encryption for private key storage
  - Rate limiting on all endpoints
  - Input validation
  - DDoS protection via Cloudflare
- **Testing**: Comprehensive unit and E2E tests

## Tech Stack

- **Framework**: NestJS
- **Authentication**: Dynamic Labs SDK Client
- **Blockchain**:
  - Viem for EVM chains
  - @solana/web3.js for Solana
  - Dynamic SDK for wallet operations
- **Database**: DrizzleORM with PGLite (development) or Cloud SQL Postgres (production)
- **API Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
DYNAMIC_API_TOKEN=your_dynamic_api_token
ENCRYPTION_KEY=your_encryption_key_32_chars_minimum

# Optional: Per-chain RPC URL overrides
# Format: RPC_URL_<CHAIN_ID>=... or RPC_URL_<DYNAMIC_NETWORK_ID>=...
RPC_URL_421614=https://arbitrum-sepolia.infura.io/v3/your_key
RPC_URL_84532=https://base-sepolia.infura.io/v3/your_key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Backward compatibility: ARBITRUM_SEPOLIA_RPC_URL still works
ARBITRUM_SEPOLIA_RPC_URL=https://arbitrum-sepolia.infura.io/v3/your_key
```

**Required Environment Variables:**

- `DYNAMIC_ENVIRONMENT_ID`: Your Dynamic environment ID from the Dynamic dashboard
- `DYNAMIC_API_TOKEN`: Your Dynamic API token for server-side authentication
- `ENCRYPTION_KEY`: Encryption key for private keys (minimum 32 characters)

**Optional RPC Configuration:**

- `RPC_URL_<CHAIN_ID>`: Custom RPC URL for a specific chain (e.g., `RPC_URL_421614` for Arbitrum Sepolia)
- `RPC_URL_<DYNAMIC_NETWORK_ID>`: Custom RPC URL using Dynamic network ID (e.g., `RPC_URL_solana-mainnet`)
- `SOLANA_RPC_URL`: Custom Solana RPC URL (applies to all Solana networks)
- `ARBITRUM_SEPOLIA_RPC_URL`: Backward compatibility for Arbitrum Sepolia (maps to `RPC_URL_421614`)

**Note**: If no custom RPC URL is provided, Vencura uses Dynamic's default public RPC URLs or viem/Solana defaults. Custom RPCs are only needed for production environments requiring higher reliability or custom networks.

### Running the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

The API will be available at `http://localhost:3000`

### Access Swagger UI

Once the server is running, visit `http://localhost:3000/api` to access the interactive Swagger UI documentation and test the API endpoints.

## Supported Chains

Vencura supports multiple blockchain networks using Dynamic's network ID format:

### EVM Chains

- **Ethereum**: `1` (Mainnet), `11155111` (Sepolia)
- **Arbitrum**: `42161` (One), `421614` (Sepolia)
- **Base**: `8453` (Mainnet), `84532` (Sepolia)
- **Polygon**: `137` (Mainnet), `80002` (Amoy)
- **Optimism**: `10` (Mainnet), `11155420` (Sepolia)
- **All viem-supported EVM chains**: Use the chain ID number

### Solana

- **Mainnet**: `"solana-mainnet"` or `"mainnet-beta"`
- **Devnet**: `"solana-devnet"` or `"devnet"`
- **Testnet**: `"solana-testnet"` or `"testnet"`

### Future Support

- Cosmos, Bitcoin, Flow, StarkNet, Algorand, Sui, Spark, Tron (as Dynamic SDK support becomes available)

## API Endpoints

All endpoints require Bearer token authentication (Dynamic auth token).

### Create Wallet

Create a wallet on any supported chain by providing a chain ID (number for EVM) or Dynamic network ID (string for non-EVM):

**EVM Chain Example:**

```http
POST /wallets
Authorization: Bearer <dynamic-auth-token>
Content-Type: application/json

{
  "chainId": 421614
}
```

**Solana Example:**

```http
POST /wallets
Authorization: Bearer <dynamic-auth-token>
Content-Type: application/json

{
  "chainId": "solana-mainnet"
}
```

**Response:**

```json
{
  "id": "wallet-uuid",
  "address": "0x...",
  "network": "421614",
  "chainType": "evm"
}
```

### Get Balance

```http
GET /wallets/:id/balance
Authorization: Bearer <dynamic-auth-token>
```

**Response:**

```json
{
  "balance": 0.5
}
```

### Sign Message

```http
POST /wallets/:id/sign
Authorization: Bearer <dynamic-auth-token>
Content-Type: application/json

{
  "message": "Hello, World!"
}
```

**Response:**

```json
{
  "signedMessage": "0x..."
}
```

### Send Transaction

```http
POST /wallets/:id/send
Authorization: Bearer <dynamic-auth-token>
Content-Type: application/json

{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "amount": 0.001
}
```

**Response:**

```json
{
  "transactionHash": "0x..."
}
```

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Database

The application supports two database modes:

- **Development/Local**: Uses PGLite, an embedded PostgreSQL database
- **Production/Cloud**: Uses Google Cloud SQL Postgres (managed PostgreSQL)

Database schemas are defined using DrizzleORM and work with both database providers.

### Database Commands

```bash
# Generate migrations
pnpm run db:generate

# Run migrations
pnpm run db:migrate
```

### Environment-Based Database Selection

The application automatically selects the database provider based on the `USE_PGLITE` environment variable:

- `USE_PGLITE=true` or unset: Uses PGLite (embedded database)
- `USE_PGLITE=false`: Uses Cloud SQL Postgres (requires connection configuration)

## Deployment

The Vencura API is deployed to **Vercel** for all environments. Vercel provides excellent support for NestJS applications with reduced cold starts, automatic scaling, and seamless integration with our monorepo.

### Why Vercel?

- **Reduced Cold Starts**: Vercel has significantly improved cold start times for backend APIs, making it a feasible option for production workloads
- **Ephemeral Deployments**: Automatic preview deployments for every PR branch
- **Monorepo Support**: Native support for Turborepo monorepos
- **Zero Configuration**: Automatic builds and deployments from Git
- **Global CDN**: Built-in edge network for optimal performance
- **Environment Variables**: Secure management of secrets and configuration

### Environments

#### Development Environment

- **Deployment**: Automatic on merge to `main` branch
- **Database**: PGLite (embedded database) or external Postgres
- **URL**: Automatically generated by Vercel

#### Production Environment

- **Deployment**: Automatic on merge to `main` branch (production)
- **Database**: External Postgres (recommended for production)
- **URL**: Custom domain or Vercel-provided domain

#### Ephemeral PR Deployments

- **Deployment**: Automatic on PR creation/update
- **Database**: PGLite (embedded database)
- **Lifetime**: Auto-deleted on PR close/merge
- **Purpose**: Preview deployments for PR review
- **URL**: Unique preview URL per PR branch

### Vercel Configuration

The project includes a `vercel.json` configuration file for the NestJS API:

```json
{
  "buildCommand": "pnpm build --filter=vencura",
  "outputDirectory": "apps/vencura/dist",
  "framework": null,
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.js"
    }
  ]
}
```

### Environment Variables

Configure environment variables in the Vercel dashboard or via CLI:

**Required:**

- `DYNAMIC_ENVIRONMENT_ID`: Dynamic environment ID
- `DYNAMIC_API_TOKEN`: Dynamic API token
- `ENCRYPTION_KEY`: Encryption key (32+ characters)

**Optional:**

- `RPC_URL_<CHAIN_ID>`: Custom RPC URLs for specific chains
- `SOLANA_RPC_URL`: Custom Solana RPC URL
- `USE_PGLITE`: Set to `false` to use external Postgres
- `DATABASE_URL`: Postgres connection string (if not using PGLite)

### Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Alternative: Google Cloud Deployment

For production workloads requiring more control, security, and extensibility, we're working on a Google Cloud deployment option using Pulumi and GitHub Actions. See [Google Cloud Deployment Option](../../docs/google-cloud-deployment.md) for details.

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   └── decorators/
├── wallet/            # Wallet module
│   ├── wallet.service.ts
│   ├── wallet.controller.ts
│   └── dto/
├── database/          # Database module
│   ├── database.module.ts
│   └── schema/
├── common/            # Shared services
│   └── encryption.service.ts
├── config/            # Configuration
│   └── configuration.ts
└── main.ts           # Application entry point
```

## Wallet Security

Vencura implements a comprehensive two-layer security model for custodial wallet protection. For detailed security documentation, see [SECURITY.md](./SECURITY.md).

### Two-Layer Security Model

#### Layer 1: Dynamic Authentication

All API requests require a valid Dynamic Labs JWT token:

1. **Client Authentication**: Client obtains JWT token from Dynamic Labs
2. **Token Verification**: Server fetches Dynamic's public key and verifies JWT signature using RS256
3. **User Identification**: User ID extracted from token's `sub` claim
4. **User Isolation**: All wallet operations are scoped to the authenticated user ID

This layer ensures that only authenticated users can access the API and that users can only access their own wallets.

#### Layer 2: Application-Level Encryption

Private keys are encrypted before storage in the database:

1. **Wallet Creation**: When a wallet is created, Dynamic SDK generates a 2-of-2 threshold signature wallet
2. **Key Share Extraction**: External server key shares are extracted (array of strings)
3. **Encryption**: Key shares are JSON stringified and encrypted using AES-256-GCM
4. **Storage**: Encrypted data stored in `private_key_encrypted` database column
5. **Decryption**: Keys are decrypted in-memory only when needed for signing/transactions

### Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Scrypt with salt from encryption key
- **Storage Format**: `iv:authTag:encrypted` (all hex-encoded)
- **Key Management**: Encryption key stored in Google Cloud Secret Manager, never in code
- **In-Memory Only**: Private keys decrypted only when needed, never logged or persisted

### User Isolation

All wallet operations enforce strict user isolation:

- **Database Queries**: Every query includes `userId` filter to ensure users can only access their own wallets
- **Authorization Checks**: Wallet ownership verified before any operation (balance, sign, send)
- **Error Messages**: Generic error messages prevent information leakage about other users' wallets

Example from the codebase:

```typescript
// All wallet queries include user isolation
const [wallet] = await this.db
  .select()
  .from(schema.wallets)
  .where(
    and(
      eq(schema.wallets.id, walletId),
      eq(schema.wallets.userId, userId), // User isolation enforced
    ),
  )
  .limit(1)
```

### Key Management

- **Encryption Key**: Stored in Google Cloud Secret Manager as `vencura-{env}-encryption-key`
- **Access Control**: Only Cloud Run service account can access encryption key
- **Key Rotation**: Supported via Secret Manager versions (see SECURITY.md for rotation procedure)
- **Minimum Length**: Encryption key must be at least 32 characters (enforced by application)

### Security Properties

- **Authenticated Encryption**: AES-256-GCM provides both confidentiality and authenticity
- **Nonce Reuse Protection**: Random IV prevents nonce reuse attacks
- **Tamper Detection**: Authentication tag detects any modification of encrypted data
- **Defense in Depth**: Multiple layers of security (auth + encryption + network isolation)

### How It Works

**Wallet Creation Flow:**

```
1. User authenticates with Dynamic Labs → Receives JWT token
2. User calls POST /wallets with JWT token
3. Server verifies JWT token → Extracts user ID
4. Dynamic SDK generates 2-of-2 threshold wallet
5. External server key shares extracted → ["0x...", "0x..."]
6. Key shares JSON stringified → '["0x...", "0x..."]'
7. EncryptionService encrypts JSON string → "iv:authTag:encrypted"
8. Encrypted data stored in database
9. Wallet address returned to user (private key never exposed)
```

**Wallet Usage Flow (Sign Transaction):**

```
1. User calls POST /wallets/:id/send with JWT token
2. Server verifies JWT token → Extracts user ID
3. Server queries database with walletId AND userId (user isolation)
4. Encrypted key shares retrieved from database
5. EncryptionService decrypts → JSON string
6. JSON parsed → Key shares array
7. Key shares used with Dynamic SDK to sign transaction
8. Transaction sent to blockchain
9. Memory cleared (decrypted keys never persisted)
```

## Security Considerations

- Private keys are encrypted using AES-256-GCM before storage
- All API endpoints require Dynamic authentication
- Users can only access their own wallets
- Encryption key should be kept secure and never committed to version control
- **Rate Limiting**: Implemented with endpoint-specific limits (wallet creation: 10/min, transactions: 20/min, signing: 30/min)
- **Input Validation**: Ethereum addresses are validated for proper format
- **DDoS Protection**: Cloudflare provides DDoS protection in front of the service
- For comprehensive security documentation, see [SECURITY.md](./SECURITY.md)
- For security review findings and remediation status, see [SECURITY_REVIEW.md](./SECURITY_REVIEW.md)

## Architecture Decisions

- **PGLite**: Chosen for lightweight, embedded database that doesn't require external PostgreSQL server
- **Viem**: Modern TypeScript-first library for Ethereum interactions
- **DrizzleORM**: Type-safe ORM with excellent TypeScript support
- **Dynamic SDK**: Provides secure authentication and user management

## License

PROPRIETARY
