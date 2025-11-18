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
- **API Documentation**: Interactive Swagger UI at `/api` (disabled by default, enable with `ENABLE_SWAGGER_UI=true`)
- **TypeScript SDK**: Auto-generated `@vencura/core` SDK from Swagger/OpenAPI specification
  - See [@vencura/core README](../../packages/core/README.md) for SDK usage
  - See [@vencura/types README](../../packages/types/README.md) for API contracts and types
  - See [@vencura/react README](../../packages/react/README.md) for React hooks integration
- **Security**:
  - AES-256-GCM encryption for private key storage
  - Rate limiting on all endpoints (wallet creation: 10/min, transactions: 20/min, signing: 30/min)
  - Input validation with chain ID validation
  - Security headers (HSTS, X-Frame-Options, CSP, etc.)
  - Request size limits (10kb maximum)
  - Request ID tracing for all requests
  - Error message sanitization in production
  - Swagger UI protected by feature flag (disabled by default)
  - CORS configuration
  - DDoS protection via Cloudflare
- **Testing**: Comprehensive unit and E2E tests with real APIs (no mocks)
- **Portability**: Designed to run on any platform (Vercel, Google Cloud Run, AWS, Railway, etc.)

## Tech Stack

- **Framework**: NestJS (see [ADR 002](../../.adrs/002-vencura-api-framework.md))
- **Authentication**: Dynamic Labs SDK Client
- **Validation**: Zod for environment variables and runtime validation (see [@vencura/lib](../../packages/lib/README.md))
- **Blockchain**:
  - Viem for EVM chains (see [ADR 009](../../.adrs/009-viem-vs-ethers.md))
  - @solana/web3.js for Solana
  - Dynamic SDK for wallet operations
- **Database**: DrizzleORM with PGLite (development) or Cloud SQL Postgres (production) (see [ADR 011](../../.adrs/011-vencura-api-orm.md))
- **API Documentation**: Swagger/OpenAPI (generates `@vencura/core` TypeScript SDK)
- **Infrastructure**: Vercel (see [ADR 007](../../.adrs/007-vencura-api-infrastructure.md)) with Google Cloud option (see [ADR 010](../../.adrs/010-vencura-infra-orchestration.md))

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
pnpm install
```

### Environment Variables

This API uses environment-specific configuration files following [ADR 014: Environment Strategy](../../.adrs/014-environment-strategy.md). Environment files are loaded in priority order:

1. `.env` (highest priority, sensitive data, never committed, overrides everything)
2. `.env.development` / `.env.staging` / `.env.production` / `.env.test` (based on NODE_ENV, committed configs)

**File Structure:**

- `.env` - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- `.env.development` - Development configuration (committed, non-sensitive) - Local Anvil blockchain
- `.env.staging` - Staging configuration (committed, non-sensitive) - Testnet networks
- `.env.production` - Production configuration (committed, non-sensitive) - Mainnet networks
- `.env.test` - Test configuration (committed, non-sensitive) - Local Anvil blockchain (for CI/CD)
- `.env-example` - Template for `.env` file (shows required sensitive variables)

**Setup for Local Development:**

```bash
# Copy the example file for sensitive data
cp .env-example .env

# Fill in your actual sensitive values in .env
# DYNAMIC_ENVIRONMENT_ID=your_environment_id
# DYNAMIC_API_TOKEN=your_api_token
# ENCRYPTION_KEY=your_32_char_encryption_key_minimum

# .env.development is already committed with non-sensitive configs
```

**Required Environment Variables:**

- `DYNAMIC_ENVIRONMENT_ID`: Your Dynamic environment ID from the Dynamic dashboard
- `DYNAMIC_API_TOKEN`: Your Dynamic API token for server-side authentication
- `ENCRYPTION_KEY`: Encryption key for private keys (minimum 32 characters)

**Environment-Specific Configuration:**

- **Development** (`.env.development`): Uses local Anvil blockchain (`USE_LOCAL_BLOCKCHAIN=true`)
- **Staging** (`.env.staging`): Uses testnet networks (`USE_LOCAL_BLOCKCHAIN=false`)
- **Production** (`.env.production`): Uses mainnet networks (`USE_LOCAL_BLOCKCHAIN=false`)
- **Test** (`.env.test`): Uses local Anvil blockchain for CI/CD (`USE_LOCAL_BLOCKCHAIN=true`)

**Optional RPC Configuration:**

- `RPC_URL_<CHAIN_ID>`: Custom RPC URL for a specific chain (e.g., `RPC_URL_421614` for Arbitrum Sepolia)
- `RPC_URL_<DYNAMIC_NETWORK_ID>`: Custom RPC URL using Dynamic network ID (e.g., `RPC_URL_solana-mainnet`)
- `SOLANA_RPC_URL`: Custom Solana RPC URL (applies to all Solana networks)
- `ARBITRUM_SEPOLIA_RPC_URL`: Backward compatibility for Arbitrum Sepolia (maps to `RPC_URL_421614`)

See [ADR 014: Environment Strategy](../../.adrs/014-environment-strategy.md) for the complete architecture decision and [Environment Rules](../../.cursor/rules/base/environment.mdc) for implementation patterns.

**Optional Error Tracking:**

- `SENTRY_DSN`: Sentry DSN URL for error tracking (optional, defaults to disabled)
- `SENTRY_ENVIRONMENT`: Environment name for Sentry (optional, defaults to `NODE_ENV`)

**Optional Security Configuration:**

- `ENABLE_SWAGGER_UI`: Enable Swagger UI at `/api` endpoint (default: `false` for security). Set to `true` to enable interactive API documentation.
- `CORS_ORIGIN`: Allowed CORS origin (default: `*` for all origins). Set to specific domain for production (e.g., `https://your-frontend-domain.com`).

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

### Token Operations via Generic Transaction Endpoint

The `POST /wallets/:id/send` endpoint supports contract calls via the optional `data` parameter. This allows you to call any contract function, including ERC20 token operations (mint, burn, transfer, etc.), without needing chain-specific endpoints.

**Example: Mint ERC20 Tokens**

```http
POST /wallets/:id/send
Authorization: Bearer <dynamic-auth-token>
Content-Type: application/json

{
  "to": "0x4F28D4eD49E20d064C9052E7Ff4Fd12878aBA09F",
  "amount": 0,
  "data": "0x40c10f19000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0000000000000000000000000000000000000000000000000de0b6b3a7640000"
}
```

**Request Body:**

- `to`: Contract address (token contract for mint/burn operations)
- `amount`: Native token amount (use `0` for pure contract calls)
- `data`: Encoded function call data (hex string)

**Encoding Contract Calls:**

Use `viem` (or similar) to encode function calls:

```typescript
import { encodeFunctionData } from 'viem'
import { testnetTokenAbi } from '@vencura/evm/abis'

// Encode mint function call
const mintData = encodeFunctionData({
  abi: testnetTokenAbi,
  functionName: 'mint',
  args: [recipientAddress, amount], // [address, uint256]
})

// Use with transaction endpoint
await fetch('/wallets/:id/send', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: tokenAddress,
    amount: 0,
    data: mintData,
  }),
})
```

**Benefits:**

- **Multichain**: Works for EVM, Solana (future), and other chains
- **Generic**: No need for chain-specific endpoints (mint, burn, etc.)
- **Type-safe**: Use TypeScript utilities at client layer for encoding/decoding
- **Portable**: No vendor lock-in, works with any backend

**Note**: Token balance and supply reads currently require a generic read endpoint (not yet implemented). For now, use client-side RPC calls or implement a read endpoint if needed.

## Dynamic SDK Integration

Vencura API uses Dynamic SDK for all wallet operations:

- **Wallet Creation**: Uses `DynamicEvmWalletClient.createWalletAccount()` for EVM chains and `DynamicSvmWalletClient.createWalletAccount()` for Solana
- **Message Signing**: Uses Dynamic SDK's `signMessage()` method with 2-of-2 threshold signatures
- **Transaction Signing**: Uses Dynamic SDK's `signTransaction()` method for both EVM and Solana
- **Wallet Management**: All wallets are created with `ThresholdSignatureScheme.TWO_OF_TWO` for enhanced security

Both EVM and Solana wallet clients authenticate with Dynamic using `DYNAMIC_ENVIRONMENT_ID` and `DYNAMIC_API_TOKEN`, ensuring all wallet operations go through Dynamic's secure infrastructure.

### Data Storage Strategy

We store all wallet and user data in our own database rather than relying on Dynamic SDK metadata. See [ADR 015: Database Storage vs Dynamic SDK Metadata](../../.adrs/015-database-vs-dynamic-metadata.md) for the complete architecture decision.

**What We Store in Database:**

- Wallet ID, User ID, Address, Encrypted key shares, Network/chain type, Timestamps
- User ID, Email, Timestamps

**What Dynamic SDK Manages:**

- Client-side key shares (not stored in our DB)
- Threshold signature scheme configuration
- Dynamic's internal wallet metadata and associations
- Wallet state and transaction history (queried via SDK)

**Why Database Instead of Dynamic Metadata:**

- Backend needs direct access to query wallets by user ID
- Dynamic's backend SDK doesn't expose user metadata APIs
- Wallet operations require database lookups for encrypted key retrieval
- User isolation enforced at database level

Dynamic user metadata (via frontend `useUserUpdateRequest()` hook) can be used for frontend-only data like game history or UI preferences, but all backend operations require our database.

## Testing

The API includes comprehensive **blackbox E2E tests** that use the real Dynamic SDK. All tests hit real Dynamic SDK endpoints with real API keys - NO MOCKS are used for core functionality.

### Testing Strategy

Our testing strategy emphasizes **blackbox testing** using local chains for automation. This approach ensures end-to-end validation while maintaining fast, reliable test execution.

#### Blackbox Testing Philosophy

**CRITICAL**: All API tests are blackbox - they only interact with HTTP endpoints, no unit tests. This ensures we test the complete flow from HTTP request to blockchain transaction.

- **No Unit Tests**: All tests hit HTTP endpoints only, verifying complete API functionality
- **Real Dynamic SDK**: All wallet operations and transaction signing use the real Dynamic SDK (no mocks)
- **Real Blockchain RPCs**: Integration tests use real blockchain RPCs (local Anvil or testnet)
- **End-to-End Validation**: Tests verify the complete flow from HTTP request to blockchain transaction

#### Local Chain Automation

We spin up a local Anvil blockchain automatically before tests run to save gas costs and eliminate network dependencies:

- **Anvil starts automatically** before tests run (requires Foundry installation)
- **Wallets are auto-funded** with ETH from Anvil's default account
- **No manual setup required** - just run `pnpm run test:e2e`
- **Fast and reliable** - no network latency or rate limits
- **Point test chains to Anvil** by setting `RPC_URL_<CHAIN_ID>=http://localhost:8545`

#### Token Mocking Strategy

We mock three tokens (USDT, USDC, DNMC) for automated transfer testing:

- **USDT (Mocked)**: Tether USD token mock with 6 decimals
- **USDC (Mocked)**: USD Coin token mock with 6 decimals
- **DNMC**: Dynamic Arcade Token (arcade utility token) with 18 decimals

All three tokens are deployed using the `TestToken` contract with **open minting functionality**, allowing any wallet to mint tokens as a faucet. This enables automated transfer testing without requiring special faucet wallets or manual funding.

**Token Deployment**: Test tokens are automatically deployed to local Anvil before tests run. For testnet testing, tokens are deployed on Arbitrum Sepolia (Chain ID: 421614).

#### Testing Flow

1. **Spin up local chain**: Anvil starts automatically before tests run
2. **Deploy test tokens**: Test tokens (USDT, USDC, DNMC) are automatically deployed to Anvil with open mint functionality
3. **Use Dynamic SDK**: All wallet operations and transaction signing use the real Dynamic SDK
4. **Blackbox test endpoints**: Tests hit HTTP endpoints only, verifying complete end-to-end functionality

#### Dynamic SDK Integration

All transaction signing uses the real Dynamic SDK (no mocks):

- **Wallet Creation**: Uses `DynamicEvmWalletClient.createWalletAccount()` for EVM chains
- **Message Signing**: Uses Dynamic SDK's `signMessage()` method with 2-of-2 threshold signatures
- **Transaction Signing**: Uses Dynamic SDK's `signTransaction()` method for both EVM and Solana
- **Real API Keys**: All tests use actual credentials from environment variables

**Automated Gas Faucet**: Transaction tests use an automated gas faucet infrastructure. By default, tests use a local Anvil blockchain where wallets are automatically funded. This eliminates the need for manual wallet funding and makes tests faster and more reliable. For testnet testing, you can set `USE_LOCAL_BLOCKCHAIN=false` and optionally provide `FAUCET_PRIVATE_KEY` for automated funding.

### Running Tests

```bash
# E2E tests with local Anvil blockchain (default, fastest)
pnpm run test:e2e

# E2E tests in watch mode
pnpm run test:e2e:watch

# E2E tests for CI (with coverage)
pnpm run test:e2e:ci

# E2E tests on testnet (requires manual funding or FAUCET_PRIVATE_KEY)
pnpm run test:e2e:testnet

# Unit tests
pnpm run test

# Test coverage
pnpm run test:cov
```

**Prerequisites for Local Blockchain Tests**:

- [Foundry](https://book.getfoundry.sh/getting-started/installation) must be installed
- Anvil will start automatically before tests run
- Wallets are automatically funded with ETH from Anvil's default account

### Test Setup

E2E tests require the following environment variables in `.env`:

**Required:**

- `DYNAMIC_ENVIRONMENT_ID` - Your Dynamic environment ID
- `DYNAMIC_API_TOKEN` - Your Dynamic API token
- `ENCRYPTION_KEY` - Encryption key (32+ characters)

**Optional:**

- `USE_LOCAL_BLOCKCHAIN` - Use local Anvil blockchain (default: `true`). Set to `false` to use testnet.
- `FAUCET_PRIVATE_KEY` - Private key for testnet faucet (only needed if `USE_LOCAL_BLOCKCHAIN=false` and you want automated funding)
- `RPC_URL_<CHAIN_ID>` - Override RPC URLs for specific chains. For local testing, set `RPC_URL_421614=http://localhost:8545` to point Arbitrum Sepolia to Anvil.
- `TEST_AUTH_TOKEN` - Pre-configured JWT token for testing (optional). In test mode (`NODE_ENV=test`), the API key is used directly for authentication.

**Local Blockchain Setup:**

- Install [Foundry](https://book.getfoundry.sh/getting-started/installation) to get Anvil
- Anvil starts automatically before tests run
- Wallets are automatically funded with ETH (no manual funding needed)
- **Important**: Use Arbitrum Sepolia (421614) as the chain ID for local testing. Dynamic SDK doesn't support localhost chains, so we use Arbitrum Sepolia chain ID while RPC URLs point to localhost:8545
- Point Arbitrum Sepolia to Anvil by setting `RPC_URL_421614=http://localhost:8545`
- The WalletService automatically maps local chain IDs (like 31337) to Arbitrum Sepolia (421614) for Dynamic SDK compatibility

### Test Structure

- **Blackbox Testing**: Tests only interact with HTTP endpoints, not internal implementation
- **Real Dynamic SDK**: All tests use real Dynamic SDK endpoints (no mocks)
- **Automated**: Tests run without manual intervention
- **Comprehensive Coverage**: Tests cover all wallet endpoints, error cases, and multichain scenarios

### Test Files

- `test/wallet.e2e-spec.ts` - Main wallet endpoint tests (uses real Dynamic SDK)
- `test/wallet-transactions.e2e-spec.ts` - Transaction sending tests (uses real transactions on testnets)
- `test/wallet-edge-cases.e2e-spec.ts` - Edge case and error handling tests (uses real Dynamic SDK)
- `test/wallet-multichain.e2e-spec.ts` - Multichain wallet creation tests (uses real Dynamic SDK)
- `test/app.e2e-spec.ts` - Basic health check tests

### Test Coverage

The test suite covers all requirements from the backend specification:

- ✅ **Wallet Creation**: Tests verify wallets are created via Dynamic SDK for both EVM and Solana chains
- ✅ **getBalance()**: Tests verify balance queries work correctly for all supported chains
- ✅ **signMessage()**: Tests verify message signing works via Dynamic SDK for both chain types
- ✅ **sendTransaction()**: Tests use real transactions with automated gas funding (local Anvil) or testnet (with optional faucet)

All tests verify that:

- Wallets are created through Dynamic SDK (not local key generation)
- Address formats match expected chain-specific formats
- Signatures are valid and created via Dynamic SDK
- User isolation is enforced (users can only access their own wallets)
- Error handling works correctly for invalid inputs

### Getting a Test Auth Token

For automated testing in test mode (`NODE_ENV=test`):

1. **API Key Authentication (Recommended)**: When `NODE_ENV=test`, tests automatically use `DYNAMIC_API_TOKEN` directly for authentication. No JWT generation needed.
2. **Set TEST_AUTH_TOKEN** (Optional): You can still set `TEST_AUTH_TOKEN` if you want to use a specific JWT token instead of the API key.

**How it works:**

- In test mode, `getTestAuthToken()` returns `DYNAMIC_API_TOKEN` directly
- The `AuthGuard` accepts API key as authentication when `NODE_ENV=test`
- A consistent test user (`test-user-${environmentId}`) is created/used for all tests
- This eliminates the need for complex JWT generation and makes tests faster and more reliable

**Note**: In non-test environments (production/staging), JWT tokens are still required for authentication.

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
- `ENABLE_SWAGGER_UI`: Enable Swagger UI at `/api` (default: `false` for security)
- `CORS_ORIGIN`: Allowed CORS origin (default: `*` for all origins)

### Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Portability

The Vencura API is designed to be **portable by default** and can run on any platform:

- **Vercel**: Current deployment platform (convenience, not requirement)
- **Google Cloud Run**: Enhanced security and control (see [Google Cloud Deployment Option](../../docs/google-cloud-deployment.md))
- **AWS Lambda/ECS**: Standard serverless or container deployment
- **Railway/Render/Fly.io**: Simple platform deployments
- **Self-hosted Docker**: Run anywhere with Docker

**Key Principles:**

- ✅ All core features work on any platform
- ✅ No Vercel-specific code in application
- ✅ Standard Dockerfile for containerization
- ✅ Standard environment variables
- ✅ Standard database connections

For detailed portability documentation, see:

- [Vercel Portability Strategy](../../docs/vercel-portability-strategy.md) - Comprehensive portability guide
- [Vercel Optimizations](../../docs/vercel-optimizations.md) - Vercel-specific features and alternatives

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

## Security

Vencura implements a comprehensive two-layer security model for custodial wallet protection. For detailed security documentation, see [SECURITY.md](./SECURITY.md).

### Security Features

- **Authentication**: Dynamic Labs JWT token verification with RS256 signature validation
- **Encryption**: AES-256-GCM encryption for private key storage
- **Rate Limiting**: Endpoint-specific limits (wallet creation: 10/min, transactions: 20/min, signing: 30/min)
- **Input Validation**: Chain ID validation, address format validation
- **Security Headers**: HSTS, X-Frame-Options, CSP, and other security headers via Helmet.js
- **Request Size Limits**: Maximum 10kb payload size to prevent DoS attacks
- **Request ID Tracing**: All requests include X-Request-ID header for tracing and debugging
- **Error Sanitization**: Error messages sanitized in production to prevent information leakage
- **Swagger UI Protection**: Swagger UI disabled by default (enable with `ENABLE_SWAGGER_UI=true`)
- **CORS Configuration**: Configurable CORS origin (default: `*` for development)
- **DDoS Protection**: Cloudflare provides DDoS protection in front of the service
- **User Isolation**: All wallet operations enforce strict user isolation at database level

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

For comprehensive security documentation, see [SECURITY.md](./SECURITY.md). For security review findings and remediation status, see [SECURITY_REVIEW.md](./SECURITY_REVIEW.md).

## Architecture Decisions

- **PGLite**: Chosen for lightweight, embedded database that doesn't require external PostgreSQL server
- **Viem**: Modern TypeScript-first library for Ethereum interactions
- **DrizzleORM**: Type-safe ORM with excellent TypeScript support
- **Dynamic SDK**: Provides secure authentication and user management

## Future Work

### Enhanced Testing Infrastructure

Transaction sending tests now use real transactions on testnets. Future enhancements may include:

1. **Enhanced Token Support**:
   - ERC20 token transfer support in the API (currently only native token transfers are supported)
   - SPL token operations on Solana
   - Token balance queries for ERC20/SPL tokens

2. **Automated Faucet Infrastructure**:
   - Automated faucet API endpoints for funding test wallets
   - Rate limiting and security controls
   - Support for both native tokens (SOL, ETH) and test tokens (SPL, ERC20)

3. **Advanced Test Scenarios**:
   - Multi-token transaction tests
   - Batch transaction tests
   - Gas optimization tests
   - Cross-chain bridge tests (when supported)

## License

PROPRIETARY
