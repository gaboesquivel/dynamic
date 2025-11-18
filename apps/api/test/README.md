# Test Account Lifecycle Strategy

## Overview

All Dynamic test accounts for EVM flows are created via the Vencura API, which calls the Dynamic SDK. This ensures a single integration point and consistent test behavior.

See [ADR 013: Vencura API Test Gas Faucet](../../.adrs/013-vencura-api-test-gas-faucet.md) for the complete architecture decision on automated gas faucet infrastructure.

## Account Creation

- **Test accounts are created via API**: Use `getOrCreateTestWallet()` helper which reuses existing wallets or creates new ones
- **Accounts persist across test runs**: Test accounts are NOT deleted after tests complete
- **Account reuse**: Tests reuse existing wallets when available, reducing gas costs
- **Automated gas funding**: Wallets are automatically funded with ETH when using local Anvil blockchain (default)

## Balance Assertions

Since accounts persist and may have existing balances, tests should:

1. **Read initial balance** before operations using `getInitialBalance()` helper
2. **Assert balance deltas** instead of absolute values using `assertBalanceDelta()` helper
3. **Use tolerance** for floating-point comparisons (default: 0.0001)

### Example

```typescript
// Get initial balance before operation
const initialBalance = await getInitialBalance({ app, authToken, walletId })

// Perform operation (e.g., send transaction)
await sendTransaction(...)

// Assert balance changed by expected delta
await assertBalanceDelta({
  app,
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

## Test Account Authentication

- **Test Mode Bypass**: When `NODE_ENV=test`, tests use `DYNAMIC_API_TOKEN` directly for authentication
- **API Key Authentication**: The `AuthGuard` accepts API key as authentication in test mode, eliminating the need for JWT generation
- **Test User**: A consistent test user (`test-user-${environmentId}`) is created/used for all tests, allowing wallet reuse across test runs
- **Auth Helper**: `getTestAuthToken()` returns the API key directly in test mode
- **No Network Calls**: Test authentication doesn't require any external API calls, making tests faster and more reliable

## Automated Gas Faucet

Tests use an automated gas faucet infrastructure to fund wallets with native tokens (ETH for EVM chains). This eliminates the need for manual wallet funding and makes tests faster and more reliable.

### Local Blockchain Mode (Default)

By default, tests use a local Anvil blockchain where wallets are automatically funded:

- **Anvil starts automatically** before tests run (requires Foundry installation)
- **Wallets are auto-funded** with 1 ETH from Anvil's default account
- **No manual setup required** - just run `pnpm run test:e2e`
- **Fast and reliable** - no network latency or rate limits
- **Point test chains to Anvil** by setting `RPC_URL_<CHAIN_ID>=http://localhost:8545`

**Prerequisites:**

- Install [Foundry](https://book.getfoundry.sh/getting-started/installation) to get Anvil
- Anvil will start automatically when tests run

**Configuration:**

```env
USE_LOCAL_BLOCKCHAIN=true  # Default, enables Anvil
RPC_URL_421614=http://localhost:8545  # Point Arbitrum Sepolia to Anvil
```

**Important**: Use Arbitrum Sepolia (421614) as the chain ID for local testing. Dynamic SDK doesn't support localhost chains, so:

- Use chain ID `421614` (Arbitrum Sepolia) for wallet operations
- Set `RPC_URL_421614=http://localhost:8545` to route transactions to Anvil
- The WalletService automatically maps local chain IDs (like 31337) to 421614 for Dynamic SDK compatibility
- This allows testing wallet signing functionality locally while using a chain ID Dynamic supports

### Testnet Mode (Optional)

For testnet testing, you can disable local blockchain and optionally use a faucet:

**Without Automated Faucet:**

- Set `USE_LOCAL_BLOCKCHAIN=false`
- Manually fund wallets using testnet faucets
- Tests will fail if wallets don't have sufficient balance

**With Automated Faucet:**

- Set `USE_LOCAL_BLOCKCHAIN=false`
- Set `FAUCET_PRIVATE_KEY` to a testnet account with ETH
- Wallets will be automatically funded from the faucet account

**Configuration:**

```env
USE_LOCAL_BLOCKCHAIN=false
FAUCET_PRIVATE_KEY=your_testnet_faucet_private_key_here
```

### How It Works

1. **Wallet Creation**: Test creates wallet via Dynamic SDK (real API)
2. **Auto-Funding**: `getOrCreateTestWallet()` helper automatically funds wallets:
   - Local mode: Uses Anvil's default account (well-known private key)
   - Testnet mode: Uses `FAUCET_PRIVATE_KEY` if provided
3. **Funding Amount**: Default is 1 ETH (configurable in `fundWalletWithGas()`)
4. **Tests Proceed**: Wallets are ready for transaction tests

### Account Reuse

Wallets are reused across test runs:

- `getOrCreateTestWallet()` checks for existing wallets first
- Only creates new wallets if none exist for the requested chain
- Existing wallets are re-funded automatically if using local blockchain
- This reduces gas costs and test execution time

## Best Practices

1. **Idempotent tests**: Tests should work regardless of account state
2. **Balance deltas**: Always assert deltas, never absolute values
3. **Automated funding**: Wallets are automatically funded when using local blockchain (default)
4. **Transaction waiting**: Use `waitForTransaction()` helper to allow blockchain confirmation
5. **Account reuse**: Use `getOrCreateTestWallet()` for most tests, `createTestWallet()` only when testing wallet creation
6. **Local blockchain**: Install Foundry for Anvil support - tests will warn if Anvil is unavailable
7. **Testnet mode**: Set `USE_LOCAL_BLOCKCHAIN=false` for testnet testing (may require manual funding)
