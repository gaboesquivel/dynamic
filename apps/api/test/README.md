# API Testing Strategy

## Blackbox Testing Strategy

Our testing strategy emphasizes **blackbox testing** using local chains for automation. This approach ensures end-to-end validation while maintaining fast, reliable test execution.

### Core Principles

1. **Blackbox Testing Only**: All API tests are blackbox - they only interact with HTTP endpoints, no unit tests. This ensures we test the complete flow from HTTP request to blockchain transaction.

2. **Local Chain Automation**: We spin up a local Anvil blockchain automatically before tests run to save gas costs and eliminate network dependencies.

3. **Test Tokens with Open Mint**: We deploy test tokens (USDT, USDC, DNMC) using the `TestToken` contract with open minting functionality, allowing any wallet to mint tokens as a faucet.

4. **Dynamic SDK Integration**: All transaction signing uses the real Dynamic SDK (no mocks), ensuring we test against actual wallet infrastructure.

### Testing Flow

1. **Spin up local chain**: Anvil starts automatically before tests run
2. **Deploy test tokens**: Test tokens (USDT, USDC, DNMC) are automatically deployed to Anvil with open mint functionality
3. **Use Dynamic SDK**: All wallet operations and transaction signing use the real Dynamic SDK
4. **Blackbox test endpoints**: Tests hit HTTP endpoints only, verifying complete end-to-end functionality

### Token Mocking Strategy

We mock three tokens for automated transfer testing:

- **USDT (Mocked)**: Tether USD token mock with 6 decimals
- **USDC (Mocked)**: USD Coin token mock with 6 decimals
- **DNMC**: Dynamic Arcade Token (arcade utility token) with 18 decimals

All three tokens are deployed using the `TestToken` contract which provides:

- **Open Minting**: Anyone can call `mint()` to create tokens (perfect for faucets)
- **Open Burning**: Anyone can call `burn()` to destroy tokens (useful for testing)
- **Standard ERC20 Interface**: Full compatibility with standard token operations

**Token Minting Flow**: Tests automatically mint tokens via the API transaction endpoint using the `mintTestTokenViaFaucet()` helper. The helper:
- Creates or reuses a test wallet via Dynamic SDK
- Encodes the `mint()` function call
- Sends the transaction via the API `/wallets/:id/send` endpoint
- Returns the transaction hash for verification

**Token Transfer Testing**: Tests verify token transfers by:
- Minting tokens to a test wallet
- Transferring tokens to another address via the API transaction endpoint
- Verifying transaction success and hash format

**Token Addresses**: Token addresses are automatically detected based on environment:
- **Local Chain**: Tokens are deployed to Anvil and addresses are stored after deployment
- **Testnet**: Tokens use hardcoded addresses on Arbitrum Sepolia (Chain ID: 421614)

See [EVM Contracts README](../../../contracts/evm/README.md) for token contract details.

## Test Account Lifecycle Strategy

### Overview

All Dynamic test accounts for EVM flows are created via the Vencura API, which calls the Dynamic SDK. This ensures a single integration point and consistent test behavior.

See [ADR 013: Vencura API Test Gas Faucet](../../.adrs/013-vencura-api-test-gas-faucet.md) for the complete architecture decision on automated gas faucet infrastructure.

## Test Architecture

### Separate Process Architecture

Tests run the API server as a separate Node process, eliminating Jest module loading issues with Dynamic SDK ESM modules. This approach provides several benefits:

- **No Jest Module Loading**: Jest never loads AppModule or Dynamic SDK, avoiding ESM import resolution issues
- **True E2E**: Tests hit real HTTP endpoints on a running server
- **Simpler Tests**: No NestJS TestingModule setup required
- **Consistent**: Matches Playwright pattern used in other apps
- **Faster**: Server starts once, all tests reuse it
- **More Realistic**: Tests actual production-like server

### Server Startup/Teardown

The test server is automatically managed via Jest's global setup/teardown hooks:

1. **Global Setup** (`setup-server.ts`): Builds the app, starts the server process, waits for health check
2. **Global Teardown** (`teardown-server.ts`): Kills the server process after all tests complete

The server runs on `TEST_SERVER_PORT` (default: 3077) and tests use `TEST_SERVER_URL` (default: `http://localhost:3077`) to make HTTP requests.

### Test Helper Functions

All test helper functions now use `baseUrl` instead of `app` parameter:

```typescript
// Before:
const wallet = await createTestWallet({
  app,
  authToken,
  chainId: 421614,
})

// After:
const wallet = await createTestWallet({
  baseUrl: TEST_SERVER_URL, // Optional, defaults to TEST_SERVER_URL env var
  authToken,
  chainId: 421614,
})
```

Helper functions automatically use `TEST_SERVER_URL` environment variable or default to `http://localhost:3077` if not provided.

## Account Creation

- **Test accounts are created via API**: Use `getOrCreateTestWallet()` helper which reuses existing wallets or creates new ones
- **Accounts persist across test runs**: Test accounts are NOT deleted after tests complete
- **Account reuse**: Tests reuse existing wallets when available, reducing gas costs
- **Automated gas funding**: Wallets are automatically funded with minimum ETH required for transactions on Arbitrum Sepolia testnet

## Balance Assertions

Since accounts persist and may have existing balances, tests should:

1. **Read initial balance** before operations using `getInitialBalance()` helper
2. **Assert balance deltas** instead of absolute values using `assertBalanceDelta()` helper
3. **Use tolerance** for floating-point comparisons (default: 0.0001)

### Example

```typescript
// Get initial balance before operation
const initialBalance = await getInitialBalance({ baseUrl: TEST_SERVER_URL, authToken, walletId })

// Perform operation (e.g., send transaction)
await sendTransaction(...)

// Assert balance changed by expected delta
await assertBalanceDelta({
  baseUrl: TEST_SERVER_URL,
  authToken,
  walletId,
  expectedDelta: -0.0001, // Expected change
  initialBalance,
})
```

## Token Operations

- **Token minting**: Use `mintTestTokenViaFaucet()` helper which uses the API transaction endpoint to call the open mint function on test tokens
- **Open mint function**: TestToken contracts have an open mint function, so any wallet can call it (no special faucet wallet needed)
- **Token balance reads**: Currently require a generic read endpoint (not yet implemented)
- **Test tokens**: Use testnet ERC-20 tokens (e.g., DNMC on Arbitrum Sepolia)

## Test Environment Setup

### Database Initialization

- **Automatic Schema Creation**: Database schema is automatically initialized when tests run
- **Test Mode Detection**: Schema initialization happens automatically when `NODE_ENV=test`
- **Fresh Database Per Suite**: Each test suite gets a fresh PGLite database instance
- **No Migrations Required**: Tests use direct SQL table creation (simpler than migrations for test environment)
- **Implementation**: Schema initialization is handled in `DatabaseModule` - no manual setup needed

### Test Account Authentication

- **Test Mode Bypass**: When `NODE_ENV=test`, tests use `DYNAMIC_API_TOKEN` directly for authentication
- **API Key Authentication**: The `AuthGuard` accepts API key as authentication in test mode, eliminating the need for JWT generation
- **Test User**: A consistent test user (`test-user-${environmentId}`) is created/used for all tests, allowing wallet reuse across test runs
- **Auth Helper**: `getTestAuthToken()` returns the API key directly in test mode
- **No Network Calls**: Test authentication doesn't require any external API calls, making tests faster and more reliable
- **Automatic**: Test scripts automatically set `NODE_ENV=test` (configured in `package.json`)

## Automated Gas Faucet

Tests use an automated gas faucet infrastructure to fund wallets with minimum ETH required for transactions on Arbitrum Sepolia testnet. The faucet calculates the exact gas needed (with a 20% buffer) and sends only that amount, not the full balance. This eliminates the need for manual wallet funding and makes tests more efficient.

### Testnet-Only Mode

Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614):

- **Tests use real testnet**: All tests run against Arbitrum Sepolia, not local blockchain
- **Automated funding**: Wallets are automatically funded with minimum ETH required
- **Gas calculation**: Faucet calculates gas costs dynamically based on current network conditions
- **Efficient**: Only sends the minimum amount needed, not a fixed amount

**Prerequisites:**

- `ARB_TESTNET_GAS_FAUCET_KEY` environment variable must be set with a funded Arbitrum Sepolia account private key

**Configuration:**

```env
ARB_TESTNET_GAS_FAUCET_KEY=your_arbitrum_sepolia_faucet_private_key_here
RPC_URL_421614=https://sepolia-rollup.arbitrum.io/rpc  # Optional, defaults to public RPC
```

**Why No Local Blockchain?**

We explored local blockchain testing (Anvil) but removed it because Dynamic SDK doesn't support localhost chains. Dynamic SDK requires real network IDs that it recognizes (e.g., 421614 for Arbitrum Sepolia), so we cannot use local chains even with RPC URL overrides. The SDK validates chain IDs and rejects localhost/Anvil chain IDs, making local testing incompatible with Dynamic SDK integration.

In the future, we may explore custom blockchain solutions (e.g., private testnets, custom L2s) to avoid gas costs while maintaining Dynamic SDK compatibility.

### How It Works

1. **Wallet Creation**: Test creates wallet via Dynamic SDK (real API)
2. **Gas Calculation**: `fundWalletWithGas()` calculates minimum ETH required:
   - Estimates gas for ERC20 transfer (~65,000 gas)
   - Gets current gas price from Arbitrum Sepolia
   - Calculates: `(gasLimit * gasPrice) * 1.2` (20% buffer)
3. **Auto-Funding**: Sends only the calculated minimum amount from `ARB_TESTNET_GAS_FAUCET_KEY` account
4. **Tests Proceed**: Wallets are ready for transaction tests with sufficient but minimal funding

### Account Reuse

Wallets are reused across test runs:

- `getOrCreateTestWallet()` checks for existing wallets first
- Only creates new wallets if none exist for the requested chain
- Existing wallets are re-funded automatically with minimum ETH required
- This reduces gas costs and test execution time

## Best Practices

1. **Idempotent tests**: Tests should work regardless of account state
2. **Balance deltas**: Always assert deltas, never absolute values
3. **Automated funding**: Wallets are automatically funded with minimum ETH required
4. **Transaction waiting**: Use `waitForTransaction()` helper to allow blockchain confirmation
5. **Account reuse**: Use `getOrCreateTestWallet()` for most tests, `createTestWallet()` only when testing wallet creation
6. **Testnet only**: All tests run against Arbitrum Sepolia testnet - ensure `ARB_TESTNET_GAS_FAUCET_KEY` is set
