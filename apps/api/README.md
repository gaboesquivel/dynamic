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
  - Error message sanitization in production using `@vencura/lib`
  - Proper 429 rate limit error handling (Dynamic SDK rate limits are preserved)
  - Swagger UI protected by feature flag (disabled by default)
  - CORS configuration
  - DDoS protection via Cloudflare
- **Testing**: Comprehensive unit and E2E tests with real APIs (no mocks)
- **Portability**: Designed to run on any platform (Vercel, Google Cloud Run, AWS, Railway, etc.)

## Tech Stack

- **Framework**: NestJS (see [ADR 002](/docs/adrs/002-vencura-api-framework))
- **Authentication**: Dynamic Labs SDK Client
- **Validation**: Zod for environment variables and runtime validation (see [@vencura/lib](../../packages/lib/README.md))
- **Utilities**: `@vencura/lib` for error handling, async utilities, and zod utilities
- **Type Checking**: Lodash utilities (`isEmpty`, `isPlainObject`, `isString`) for consistent type checking
- **Blockchain**:
  - Viem for EVM chains (see [ADR 009](/docs/adrs/009-viem-vs-ethers))
  - @solana/web3.js for Solana
  - Dynamic SDK for wallet operations
- **Database**: DrizzleORM with PGLite (development) or Cloud SQL Postgres (production) (see [ADR 011](/docs/adrs/011-vencura-api-orm))
- **API Documentation**: Swagger/OpenAPI (generates `@vencura/core` TypeScript SDK)
- **Infrastructure**: Vercel (see [ADR 007](/docs/adrs/007-vencura-api-infrastructure)) with Google Cloud option (see [ADR 010](/docs/adrs/010-vencura-infra-orchestration))

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
pnpm install
```

### Environment Variables

This API uses environment-specific configuration files following [ADR 014: Environment Strategy](/docs/adrs/014-environment-strategy). Environment files are loaded in priority order:

1. `.env` (highest priority, sensitive data, never committed, overrides everything)
2. `.env.development` / `.env.staging` / `.env.production` / `.env.test` (based on NODE_ENV, committed configs)

**File Structure:**

- `.env` - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- `.env.development` - Development configuration (committed, non-sensitive) - Testnet networks
- `.env.staging` - Staging configuration (committed, non-sensitive) - Testnet networks
- `.env.production` - Production configuration (committed, non-sensitive) - Mainnet networks
- `.env.test` - Test configuration (committed, non-sensitive) - Arbitrum Sepolia testnet (for CI/CD)
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

- **Development** (`.env.development`): Uses testnet networks (Arbitrum Sepolia)
- **Staging** (`.env.staging`): Uses testnet networks
- **Production** (`.env.production`): Uses mainnet networks
- **Test** (`.env.test`): Uses Arbitrum Sepolia testnet for CI/CD

**Note**: We explored local blockchain testing (Anvil) but removed it because Dynamic SDK doesn't support localhost chains. Dynamic SDK requires real network IDs that it recognizes (e.g., 421614 for Arbitrum Sepolia), so we cannot use local chains even with RPC URL overrides. The SDK validates chain IDs and rejects localhost/Anvil chain IDs, making local testing incompatible with Dynamic SDK integration. In the future, we may explore custom blockchain solutions (e.g., private testnets, custom L2s) to avoid gas costs while maintaining Dynamic SDK compatibility.

**Optional RPC Configuration:**

- `RPC_URL_<CHAIN_ID>`: Custom RPC URL for a specific chain (e.g., `RPC_URL_421614` for Arbitrum Sepolia)
- `RPC_URL_<DYNAMIC_NETWORK_ID>`: Custom RPC URL using Dynamic network ID (e.g., `RPC_URL_solana-mainnet`)
- `SOLANA_RPC_URL`: Custom Solana RPC URL (applies to all Solana networks)
- `ARBITRUM_SEPOLIA_RPC_URL`: Backward compatibility for Arbitrum Sepolia (maps to `RPC_URL_421614`)

See [ADR 014: Environment Strategy](/docs/adrs/014-environment-strategy) for the complete architecture decision and [Environment Rules](../../.cursor/rules/base/environment.mdc) for implementation patterns.

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

The API returns different status codes based on whether the wallet was newly created or already existed:

- **201 Created**: Wallet was newly created
- **200 OK**: Wallet already existed (idempotent operation)

Both responses return the same wallet structure:

```json
{
  "id": "wallet-uuid",
  "address": "0x...",
  "network": "421614",
  "chainType": "evm"
}
```

**Idempotent Behavior:**

Wallet creation is idempotent - calling `POST /wallets` multiple times with the same `chainId` will return the existing wallet with status 200 instead of creating a duplicate. This ensures safe retries and prevents duplicate wallet creation.

## Rate Limit Handling

The API automatically handles Dynamic SDK rate limits with retry logic:

### Dynamic SDK Rate Limits

- **SDK endpoints** (`/sdk`): 100 requests per minute per IP, 10,000 requests per minute per project environment
- **Developer endpoints**: 1,500 requests per minute per IP, 3,000 requests per minute per project environment

We use SDK endpoints, so the API implements safeguards for **100 req/min per IP** and **10,000 req/min per project environment**.

### Automatic Retry

All Dynamic SDK calls are automatically retried on 429 (Too Many Requests) errors with:

- **Exponential backoff**: Delays increase exponentially (baseDelay \* 2^attempt)
- **Jitter**: Random 0-1000ms jitter prevents synchronized retries
- **Retry-After header**: Respects `Retry-After` header from 429 responses if present
- **Max retries**: Default 5 retries (configurable)

### Configuration

Rate limit behavior can be configured via environment variables:

- `DYNAMIC_RATE_LIMIT_MAX_RETRIES` (default: 5) - Maximum number of retry attempts
- `DYNAMIC_RATE_LIMIT_BASE_DELAY_MS` (default: 1000) - Base delay in milliseconds for exponential backoff
- `DYNAMIC_RATE_LIMIT_MAX_DELAY_MS` (default: 30000) - Maximum delay cap in milliseconds

### Error Responses

Rate limit errors (429) are automatically retried. If all retries are exhausted, the API returns a 429 error with details:

```json
{
  "message": "Rate limit exceeded after 6 attempts: Dynamic SDK rate limit exceeded",
  "details": {
    "retryAfter": 60
  }
}
```

See [ADR 016](/docs/adrs/016-documentation-framework) for detailed implementation information.

**Error Response (Multiple Wallets):**

If Dynamic SDK returns an error indicating a wallet already exists, the API handles it gracefully and returns the existing wallet with status 200. In rare cases where the existing wallet cannot be determined, a 400 error may be returned with details:

```json
{
  "message": "Multiple wallets per chain not allowed",
  "details": {
    "existingWalletAddress": "0x...",
    "chainId": 421614,
    "dynamicNetworkId": "421614"
  }
}
```

**Note**: The `createTestWallet()` helper in tests treats both 200 and 201 status codes as SUCCESS (expected behavior). This is because wallet existence is the desired outcome, not an error condition.

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

**Example: Mint ERC20 Testing Tokens**

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

## Error Handling

The API returns enhanced error responses with detailed information for debugging and user guidance. All error responses preserve the exact error messages from Dynamic SDK. Error handling leverages `@vencura/lib` utilities for consistent error message extraction and sanitization.

### Global Exception Filter

The API uses a global `SentryExceptionFilter` that:

- Captures all exceptions and normalizes error messages
- Uses `getErrorMessage` from `@vencura/lib` for consistent error extraction
- Uses `sanitizeErrorMessage` from `@vencura/lib` for production error sanitization
- Uses lodash `isEmpty` and `isPlainObject` for type checking
- Reports errors to Sentry (if configured) with safe fields only (no PII)
- Preserves HTTP status codes from exceptions (including 429 rate limits)
- Uses optional logger injection to prevent DI failures

### Error Response Format

All error responses follow this structure:

```json
{
  "message": "Exact error message from Dynamic SDK",
  "details": {
    "existingWalletAddress": "0x...",
    "chainId": 421614,
    "dynamicNetworkId": "421614",
    "transactionHash": "0x..."
  }
}
```

The `details` object is optional and only included when relevant context is available.

### Error Details Fields

- `existingWalletAddress`: Wallet address that already exists (for multiple wallets errors)
- `chainId`: Chain ID or Dynamic network ID where the error occurred
- `dynamicNetworkId`: Dynamic network ID string
- `transactionHash`: Transaction hash (for transaction-related errors)

### Multiple Wallets Per Chain (Idempotent Behavior)

**CRITICAL**: Wallet creation is idempotent. Dynamic SDK does not allow creating multiple wallets per chain with the same API key. When attempting to create a duplicate wallet:

- **If existing wallet can be determined**: API returns status **200 OK** with the existing wallet (idempotent success)
- **If existing wallet cannot be determined**: API returns status **400 Bad Request** with the existing wallet address in the `details` object:

```json
{
  "message": "Multiple wallets per chain not allowed",
  "details": {
    "existingWalletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "chainId": 421614,
    "dynamicNetworkId": "421614"
  }
}
```

**Test Behavior**: In tests, the `createTestWallet()` helper accepts both 200 and 201 status codes as SUCCESS (expected behavior). This is because wallet existence is the desired outcome, not an error condition.

### Error Message Preservation

All error responses preserve the exact error messages from Dynamic SDK, ensuring transparency and easier debugging. Error classification (authentication, rate limit, network, etc.) is handled automatically, but the original Dynamic SDK message is always returned.

### Rate Limit Errors (429)

When Dynamic SDK returns a 429 rate limit error, the API properly classifies and returns it as `429 Too Many Requests` status code. The error classification system checks for:

- HTTP status code 429
- Error messages containing "rate limit", "throttle", "too many", "quota", or "limit exceeded"

Rate limit errors are properly preserved through the error handling chain, ensuring clients receive the correct status code for rate limit scenarios.

## Dynamic SDK Integration

Vencura API uses Dynamic SDK for all wallet operations:

- **Wallet Creation**: Uses `DynamicEvmWalletClient.createWalletAccount()` for EVM chains and `DynamicSvmWalletClient.createWalletAccount()` for Solana
- **Message Signing**: Uses Dynamic SDK's `signMessage()` method with 2-of-2 threshold signatures
- **Transaction Signing**: Uses Dynamic SDK's `signTransaction()` method for both EVM and Solana
- **Wallet Management**: All wallets are created with `ThresholdSignatureScheme.TWO_OF_TWO` for enhanced security

Both EVM and Solana wallet clients authenticate with Dynamic using `DYNAMIC_ENVIRONMENT_ID` and `DYNAMIC_API_TOKEN`, ensuring all wallet operations go through Dynamic's secure infrastructure.

### Data Storage Strategy

We store all wallet and user data in our own database rather than relying on Dynamic SDK metadata. See [ADR 015: Database Storage vs Dynamic SDK Metadata](/docs/adrs/015-database-vs-dynamic-metadata) for the complete architecture decision.

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

### Testing Architecture

**Separate Process Architecture**: Tests run the API server as a separate Node process (similar to Playwright), eliminating Jest module loading issues with Dynamic SDK ESM modules. This approach:

- **No Jest Module Loading**: Jest never loads AppModule or Dynamic SDK, avoiding ESM import resolution issues
- **True E2E**: Tests hit real HTTP endpoints on a running server
- **Simpler Tests**: No NestJS TestingModule setup required
- **Consistent**: Matches Playwright pattern used in other apps
- **Faster**: Server starts once, all tests reuse it
- **More Realistic**: Tests actual production-like server

The test server is automatically started before all tests via Jest's `globalSetup` and stopped after all tests via `globalTeardown`.

### Testing Philosophy

Our testing strategy emphasizes **blackbox testing** using testnet networks for automation. This approach ensures end-to-end validation while maintaining fast, reliable test execution.

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

**Automated Gas Faucet**: Transaction tests use an automated gas faucet infrastructure that funds wallets with minimum ETH required for transactions on Arbitrum Sepolia testnet. The faucet calculates the exact gas needed (with a 20% buffer) and sends only that amount, not the full balance. This eliminates the need for manual wallet funding and makes tests more efficient.

### Running Tests

```bash
# E2E tests on Arbitrum Sepolia testnet
pnpm run test:e2e

# E2E tests in watch mode
pnpm run test:e2e:watch

# E2E tests for CI (with coverage)
pnpm run test:e2e:ci

# Unit tests
pnpm run test

# Test coverage
pnpm run test:cov
```

**Prerequisites for Tests**:

- `ARB_TESTNET_GAS_FAUCET_KEY` environment variable must be set with a funded Arbitrum Sepolia account private key
- Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614)

### Test Setup

E2E tests automatically initialize the database schema and use test environment configuration. Test scripts set `NODE_ENV=test` to enable test mode features.

**Environment Files:**

- `.env.test` - Committed test configuration (non-sensitive defaults)
- `.env` - Sensitive values (DYNAMIC_ENVIRONMENT_ID, DYNAMIC_API_TOKEN, ENCRYPTION_KEY) - **NEVER COMMIT**

**Required Environment Variables (in `.env`):**

- `DYNAMIC_ENVIRONMENT_ID` - Your Dynamic environment ID
- `DYNAMIC_API_TOKEN` - Your Dynamic API token
- `ENCRYPTION_KEY` - Encryption key (32+ characters)

**Required Environment Variables for Tests:**

- `ARB_TESTNET_GAS_FAUCET_KEY` - Private key for Arbitrum Sepolia gas faucet (required for automated wallet funding)

**Optional Environment Variables:**

- `RPC_URL_<CHAIN_ID>` - Override RPC URLs for specific chains (e.g., `RPC_URL_421614` for Arbitrum Sepolia)
- `TEST_AUTH_TOKEN` - Pre-configured JWT token for testing (optional). In test mode (`NODE_ENV=test`), the API key is used directly for authentication.
- `TEST_SERVER_PORT` - Port for test server (default: `3077`). The test server runs on this port during test execution.
- `TEST_SERVER_URL` - Full URL for test server (default: `http://localhost:3077`). Tests use this URL to make HTTP requests.

**Database Initialization:**

- Database schema is automatically initialized when tests run (in test mode only)
- Tables are created directly using SQL (no migration files needed for tests)
- Each test suite gets a fresh PGLite database instance
- Schema initialization happens automatically in `DatabaseModule` when `NODE_ENV=test`

**Testnet Setup:**

- Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614)
- Wallets are automatically funded with minimum ETH required for transactions
- The gas faucet calculates gas costs dynamically and sends only the necessary amount
- All test tokens (DNMC, USDC, USDT) are deployed on Arbitrum Sepolia

### Test Structure

- **Blackbox Testing**: Tests only interact with HTTP endpoints, not internal implementation
- **Real Dynamic SDK**: All tests use real Dynamic SDK endpoints (no mocks)
- **Automated**: Tests run without manual intervention
- **Comprehensive Coverage**: Tests cover all wallet endpoints, error cases, and multichain scenarios
- **Error Handling**: Tests handle "multiple wallets per chain" errors as SUCCESS (expected behavior)

### Test Error Handling

**CRITICAL**: Tests treat "multiple wallets per chain" errors as SUCCESS, not failure. This is expected behavior when a wallet already exists for the same API key/chain combination.

- ✅ **SUCCESS**: Wallet creation returns 201 → Test passes
- ✅ **SUCCESS**: Wallet creation returns 400 with "multiple wallets" → Extract existing wallet, test passes
- ❌ **FAILURE**: Wallet creation returns 400 with other error → Test fails
- ❌ **FAILURE**: Wallet creation returns 500 → Test fails

The `createTestWallet()` helper automatically extracts the existing wallet address from error details and returns the existing wallet, ensuring tests pass when wallets already exist.

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
- ✅ **sendTransaction()**: Tests use real transactions on Arbitrum Sepolia testnet with automated gas funding (minimum ETH required)

All tests verify that:

- Wallets are created through Dynamic SDK (not local key generation)
- Address formats match expected chain-specific formats
- Signatures are valid and created via Dynamic SDK
- User isolation is enforced (users can only access their own wallets)
- Error handling works correctly for invalid inputs

### Test Environment Features

**Automatic Database Initialization:**

- Database schema is automatically created when `NODE_ENV=test`
- No manual migration steps required for tests
- Each test suite gets a fresh database instance
- Schema initialization uses SQL directly (simpler than migrations for tests)

**Test Authentication Bypass:**

For automated testing in test mode (`NODE_ENV=test`):

1. **API Key Authentication (Recommended)**: When `NODE_ENV=test`, tests automatically use `DYNAMIC_API_TOKEN` directly for authentication. No JWT generation needed.
2. **Set TEST_AUTH_TOKEN** (Optional): You can still set `TEST_AUTH_TOKEN` if you want to use a specific JWT token instead of the API key.

**How it works:**

- Test scripts automatically set `NODE_ENV=test` (see `package.json` test scripts)
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
- **Google Cloud Run**: Enhanced security and control (see [Google Cloud Deployment Option](/docs/google-cloud))
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

- [Vercel Portability Strategy](/docs/vercel-portability) - Comprehensive portability guide

### Alternative: Google Cloud Deployment

For production workloads requiring more control, security, and extensibility, we're working on a Google Cloud deployment option using Pulumi and GitHub Actions. See [Google Cloud Deployment Option](/docs/google-cloud) for details.

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
