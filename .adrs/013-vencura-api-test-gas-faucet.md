# ADR 013: Vencura API Test Gas Faucet

## Context

E2E tests for the Vencura API require wallets to have native tokens (ETH for EVM chains) to send transactions. Previously, wallets had to be manually funded with testnet ETH, which was:

- Time-consuming and error-prone
- Required manual intervention for each test run
- Subject to testnet rate limits and network issues
- Slowed down development and CI/CD pipelines

We need an automated solution to fund test wallets with gas tokens without manual intervention.

## Considered Options

### Option A – Local Anvil Blockchain (Chosen)

Use Foundry's Anvil local blockchain for testing, with automatic wallet funding.

**Pros**

- Fast: No network latency, instant transactions
- Reliable: No rate limits or network issues
- Free: Anvil provides pre-funded accounts
- Automated: Wallets funded automatically before tests
- Already available: Foundry is already in the codebase for contract development
- No external dependencies: Works offline, no testnet faucets needed
- Consistent: Same state every test run
- CI/CD friendly: Works in any environment with Foundry installed

**Cons**

- Requires Foundry installation (but already needed for contracts)
- Not testing against real testnets (but Dynamic SDK still uses real APIs)
- Local blockchain state doesn't match testnet exactly

### Option B – Testnet Faucet with Private Key

Read a private key from environment variables and send ETH from a funded testnet account.

**Pros**

- Tests against real testnets
- Can verify testnet-specific behavior
- No additional tooling required

**Cons**

- Slow: Network latency, transaction confirmation times
- Unreliable: Rate limits, network issues, faucet availability
- Requires manual setup: Must fund faucet account periodically
- Cost: Requires maintaining funded testnet accounts
- CI/CD complexity: Need to manage testnet credentials securely
- Rate limits: May hit faucet or RPC rate limits

### Option C – Dynamic Gasless Transactions

Use Dynamic's gasless transaction services (if available).

**Pros**

- No gas funding needed
- Tests real production-like flows

**Cons**

- May not be available for all chains
- Adds dependency on Dynamic's gasless infrastructure
- May have rate limits or costs
- Less control over test environment

### Option D – Mock Transaction Sending

Mock transaction sending in tests.

**Pros**

- Fast and reliable
- No external dependencies

**Cons**

- Doesn't test real transaction flows
- Violates testing philosophy (real APIs, no mocks)
- May miss real-world issues
- Doesn't verify actual blockchain integration

## Decision

We initially chose **Option A: Local Anvil Blockchain** but later migrated to **Option B: Testnet Faucet** as the exclusive approach.

**Why we moved away from local blockchain:**

- **Dynamic SDK limitation**: Dynamic SDK doesn't support localhost chains. The SDK validates chain IDs and rejects localhost/Anvil chain IDs (e.g., 31337), making local testing incompatible with Dynamic SDK integration.
- **Cannot override**: Even with RPC URL overrides pointing to localhost, Dynamic SDK still requires real network IDs that it recognizes (e.g., 421614 for Arbitrum Sepolia).
- **Integration requirement**: Since we use Dynamic SDK for wallet operations, we must use chains that Dynamic SDK supports.

**Current approach: Testnet-only with automated faucet**

- Tests run exclusively against Arbitrum Sepolia testnet (chain ID: 421614)
- Automated gas faucet calculates minimum ETH required and sends only that amount
- Uses `ARB_TESTNET_GAS_FAUCET_KEY` environment variable for funding
- More efficient than fixed amounts - only sends what's needed

**Future considerations:**

- We may explore custom blockchain solutions (e.g., private testnets, custom L2s) to avoid gas costs while maintaining Dynamic SDK compatibility

## Implementation Details

### Architecture

**Gas Faucet Implementation:**

- Uses TypeScript/Viem for consistency with API codebase
- `fundWalletWithGas()` function in `test/helpers.ts` uses Viem's `createWalletClient` and `createPublicClient`
- Uses `ARB_TESTNET_GAS_FAUCET_KEY` environment variable (required)
- Calculates minimum ETH required: estimates gas (~65,000 for ERC20 transfer), gets current gas price, adds 20% buffer
- Sends only the calculated minimum amount, not a fixed amount

**Wallet Auto-Funding:**

- `getOrCreateTestWallet()` helper automatically funds wallets on Arbitrum Sepolia
- Only funds EVM chains (Solana support can be added later)
- Funding amount: Calculated dynamically based on current gas prices
- Uses Arbitrum Sepolia RPC (from env or default public RPC)

### Configuration

**Environment Variables:**

- `ARB_TESTNET_GAS_FAUCET_KEY` (required) - Private key for Arbitrum Sepolia gas faucet
- `RPC_URL_<CHAIN_ID>` (optional) - Override RPC URLs. Defaults to public Arbitrum Sepolia RPC

**Test Scripts:**

- `pnpm run test:e2e` - Runs tests on Arbitrum Sepolia testnet
- All test scripts use testnet exclusively

### Integration Points

**Test Setup:**

- `test/setup.ts` - Test environment setup (no Anvil startup)
- `test/helpers.ts` - Contains `fundWalletWithGas()` and updated `getOrCreateTestWallet()`

**RPC Configuration:**

- Tests use Arbitrum Sepolia RPC (from `RPC_URL_421614` env var or default public RPC)
- All tests run against Arbitrum Sepolia testnet (chain ID: 421614)

### Wallet Funding Flow

1. Test creates wallet via Dynamic SDK (real API)
2. `getOrCreateTestWallet()` helper automatically funds wallets
3. `fundWalletWithGas()` calculates minimum ETH required:
   - Estimates gas for ERC20 transfer (~65,000 gas)
   - Gets current gas price from Arbitrum Sepolia
   - Calculates: `(gasLimit * gasPrice) * 1.2` (20% buffer)
4. Sends calculated amount from `ARB_TESTNET_GAS_FAUCET_KEY` account
5. Tests proceed with funded wallet

## Technical Decisions

### Why TypeScript/Viem Instead of Foundry/Cast?

**Decision**: Use TypeScript/Viem for gas faucet implementation, not Foundry/Cast CLI.

**Rationale:**

- API codebase already uses Viem throughout (`createWalletClient`, `createPublicClient`)
- Type-safe, no shelling out to external commands
- Better error handling and integration with Jest
- Consistent with existing codebase patterns
- Foundry scripts remain for contract deployment (one-time), not runtime operations

### Why Testnet-Only?

**Decision**: Use Arbitrum Sepolia testnet exclusively, with automated gas faucet.

**Rationale:**

- **Dynamic SDK requirement**: Dynamic SDK doesn't support localhost chains, so we must use real testnets
- **Real integration testing**: Tests run against actual testnet infrastructure, catching real-world issues
- **Efficient funding**: Faucet calculates minimum ETH required, reducing gas costs
- **Simpler setup**: No need for Foundry/Anvil installation or local blockchain management
- **CI/CD compatible**: Works consistently in any environment with just an RPC endpoint

## Notes

- `ARB_TESTNET_GAS_FAUCET_KEY` must be set with a funded Arbitrum Sepolia account
- Wallets are automatically funded with minimum ETH required (calculated dynamically)
- All tests run against Arbitrum Sepolia testnet (chain ID: 421614)
- Test tokens (DNMC, USDC, USDT) are deployed on Arbitrum Sepolia
- Dynamic SDK integration requires real network IDs, not localhost chains

## Future Enhancements

- Explore custom blockchain solutions (private testnets, custom L2s) to avoid gas costs while maintaining Dynamic SDK compatibility
- Support Solana testnet with automated SOL funding
- Configurable funding amounts per test type
- Token metadata database integration for multichain support
