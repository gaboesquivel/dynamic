# API Testing Strategy

## Blackbox Testing Strategy

Our testing strategy emphasizes **blackbox testing** using testnet networks for automation. This approach ensures end-to-end validation while maintaining fast, reliable test execution.

### Core Principles

1. **Blackbox Testing Only**: All API tests are blackbox - they only interact with HTTP endpoints, no unit tests. This ensures we test the complete flow from HTTP request to blockchain transaction.

2. **Testnet-Only Mode**: Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614). We previously explored local blockchain testing (Anvil) but removed it because Dynamic SDK doesn't support localhost chains. Dynamic SDK requires real network IDs that it recognizes, so we cannot use local chains even with RPC URL overrides.

3. **Test Tokens with Open Mint**: Test tokens (USDT, USDC, DNMC) are deployed on Arbitrum Sepolia using the `TestToken` contract with open minting functionality, allowing any wallet to mint tokens as a faucet.

4. **Dynamic SDK Integration**: All transaction signing uses the real Dynamic SDK (no mocks), ensuring we test against actual wallet infrastructure.

### Testing Flow

1. **Use testnet**: All tests run against Arbitrum Sepolia testnet (chain ID: 421614)
2. **Test tokens**: Test tokens (USDT, USDC, DNMC) are deployed on Arbitrum Sepolia with open mint functionality
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

**Token Addresses**: Token addresses use hardcoded addresses on Arbitrum Sepolia (Chain ID: 421614). All test tokens are deployed on the testnet and their addresses are configured in test fixtures.

See [EVM Contracts README](../../../contracts/evm/README.md) for token contract details.

## Test Account Lifecycle Strategy

### Overview

All Dynamic test accounts for EVM flows are created via the Vencura API, which calls the Dynamic SDK. This ensures a single integration point and consistent test behavior.

See [ADR 013: Vencura API Test Gas Faucet](/docs/adrs/013-vencura-api-test-gas-faucet) for the complete architecture decision on automated gas faucet infrastructure.

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
4. **Validate responses** using TS-REST runtime schemas from `walletAPIContract.getBalance.responses[200]`

**Delta-Based Testing Example:**

```typescript
// Get initial balance and validate with TS-REST schema
const balanceBeforeResponse = await request(TEST_SERVER_URL)
  .get(`/wallets/${wallet.id}/balance`)
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200)

const BalanceSchema = walletAPIContract.getBalance.responses[200]
const balanceBefore = BalanceSchema.parse(balanceBeforeResponse.body)

// Perform operation (if applicable)
// ...

// Get balance again and validate
const balanceAfterResponse = await request(TEST_SERVER_URL)
  .get(`/wallets/${wallet.id}/balance`)
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200)

const balanceAfter = BalanceSchema.parse(balanceAfterResponse.body)

// Assert delta (if no operation performed, balance should be same)
expect(balanceAfter.balance).toBe(balanceBefore.balance)
```

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

- `ARB_TESTNET_GAS_FAUCET_KEY` environment variable (optional) - if not set, tests will run without automatic funding
  - If set: Must be a funded Arbitrum Sepolia account private key
  - If not set: Tests will still run, but wallets won't be automatically funded (manual funding may be required)

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

## Rate Limit Handling

Dynamic SDK SDK endpoints have rate limits: **100 requests per minute per IP**, 10,000 requests per minute per project environment. To prevent hitting rate limits during tests:

1. **Serial Test Execution**: Tests run serially (`maxWorkers: 1` in `jest-e2e.json`) to prevent parallel requests
2. **Automatic Throttling**: The `createTestWallet()` helper automatically throttles wallet creation calls (minimum 700ms between calls = ~85 req/min, well under 100 req/min limit)
3. **Retry Logic**: The `createTestWallet()` helper includes retry logic with exponential backoff and jitter for rate limit errors (429):
   - Default: 5 retries (configurable via `maxRetries` parameter)
   - Exponential backoff: baseDelay \* 2^attempt + jitter (0-1000ms random jitter)
   - Max delay cap: 4000ms
4. **Manual Throttling**: For direct API calls, use the `throttleWalletCreation()` helper:

   ```typescript
   import { throttleWalletCreation } from './helpers'

   await throttleWalletCreation()
   const response = await request(TEST_SERVER_URL)
     .post('/wallets')
     .set('Authorization', `Bearer ${authToken}`)
     .send({ chainId })
   ```

5. **Test Authentication**: Tests use `getTestAuthToken()` helper which uses Dynamic API key directly (bypasses Dynamic auth widget). This is documented for clarity.

**CRITICAL**:

- Rate limit errors (429) are automatically retried by the API's `RateLimitService`
- Tests should use `getOrCreateTestWallet()` helper which handles rate limits properly
- Solana tests remain disabled (`.skip`) and are not executed

See [ADR 016](/docs/adrs/016-documentation-framework) for detailed rate limit implementation information.

## Best Practices

1. **Idempotent tests**: Tests should work regardless of account state
2. **Idempotent wallet creation**: Wallet creation tests MUST accept both 200 (existing) and 201 (created) as valid responses
3. **TS-REST runtime schemas**: Always validate API responses using TS-REST contract runtime schemas (e.g., `walletAPIContract.create.responses[201].parse(response.body)`)
4. **Balance deltas**: Always assert deltas, never absolute values
5. **Automated funding**: Wallets are automatically funded with minimum ETH required
6. **Transaction waiting**: Use `waitForTransaction()` helper to allow blockchain confirmation
7. **Account reuse**: Use `getOrCreateTestWallet()` for most tests, `createTestWallet()` only when testing wallet creation
8. **Testnet only**: All tests run against Arbitrum Sepolia testnet - ensure `ARB_TESTNET_GAS_FAUCET_KEY` is set
9. **Use @vencura/lib utilities**: Use `delay`, `getErrorMessage`, and other utilities from `@vencura/lib` for consistency
10. **Use lodash for type checking**: Use `isEmpty`, `isPlainObject`, `isString` from lodash for consistent type checking
11. **Throttle wallet creation**: Always throttle wallet creation calls to prevent Dynamic SDK rate limits

## TS-REST Runtime Schema Validation

All tests should validate API responses using TS-REST runtime schemas from the contract:

```typescript
import { walletAPIContract } from '@vencura/types/api-contracts'

// Validate wallet creation response (both 200 and 201 use same schema)
const WalletSchema = walletAPIContract.create.responses[201]
const validatedWallet = WalletSchema.parse(response.body)

// Validate balance response
const BalanceSchema = walletAPIContract.getBalance.responses[200]
const validatedBalance = BalanceSchema.parse(response.body)

// Validate wallet list response
const WalletsSchema = walletAPIContract.list.responses[200]
const validatedWallets = WalletsSchema.parse(response.body)
```

This ensures tests validate responses using the same schemas as the API contract, providing type safety and consistency.
