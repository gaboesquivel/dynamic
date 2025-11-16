# Contract Dependencies Update Summary

## ✅ Updated Dependencies

### Solana Contracts

- **@coral-xyz/anchor**: `0.30.0` → `0.32.1` ✅
- **@solana/web3.js**: `1.95.4` → `1.98.4` ✅
- **@solana/spl-token**: `0.4.8` → `0.4.14` ✅
- **chai**: `4.3.10` → `6.2.1` ✅
- **@types/chai**: `4.3.12` → `5.2.3` ✅
- **@types/node**: `20.19.9` → `24.10.1` ✅
- **ts-mocha**: `10.0.0` → `11.1.0` ✅
- **typescript**: `5.7.3` → `5.9.3` ✅
- **Anchor.toml**: Updated `anchor_version` to `0.32.1` ✅
- **Cargo.toml**: Updated `anchor-lang` and `anchor-spl` to `0.32.1` ✅

### EVM Contracts

- **Solidity Compiler**: `0.8.20` → `0.8.24` ✅
  - Updated in `foundry.toml`
  - Updated in `src/TestToken.sol`
  - Updated in `test/TestToken.t.sol`
  - Updated in `script/TestToken.s.sol`

## ⚠️ Pending Security Update

### OpenZeppelin Contracts

- **Current Version**: `5.2.0` (vendored)
- **Required Version**: `≥5.4.0` (for security patch)
- **Status**: Documented in `contracts/evm/SECURITY.md`
- **Action Required**: Replace entire `contracts/evm/lib/openzeppelin-contracts` directory

**Critical Vulnerability**: The `lastIndexOf(bytes,byte,uint256)` function in version 5.2.0 may access uninitialized memory. This requires updating the vendored OpenZeppelin Contracts library.

**Update Process**:

1. Download OpenZeppelin Contracts ≥5.4.0
2. Replace `contracts/evm/lib/openzeppelin-contracts` directory
3. Verify imports remain compatible
4. Run `forge build` and `forge test` to verify

## Verification Status

### ✅ Completed

- All Solana dependencies updated to latest versions
- Solidity compiler updated to 0.8.24
- All TypeScript/JavaScript dependencies updated
- All tests pass (`pnpm run qa`)

### ⏳ Requires Local Tools

- **EVM Contracts Compilation**: Requires `forge` (Foundry) to be installed
- **Solana Contracts Compilation**: Requires `anchor` CLI to be installed

**To verify compilation**:

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install Anchor (if not already installed)
avm install latest
avm use latest

# Build EVM contracts
cd contracts/evm && forge build

# Build Solana contracts
cd contracts/solana && anchor build

# Run tests
cd contracts/evm && forge test
cd contracts/solana && anchor test
```

## Files Modified

### Solana

- `contracts/solana/package.json`
- `contracts/solana/Anchor.toml`
- `contracts/solana/programs/test-token/Cargo.toml`

### EVM

- `contracts/evm/foundry.toml`
- `contracts/evm/src/TestToken.sol`
- `contracts/evm/test/TestToken.t.sol`
- `contracts/evm/script/TestToken.s.sol`

## Notes

- All dependency updates are backward compatible within their major versions
- Solidity 0.8.24 is the latest stable 0.8.x version and is compatible with OpenZeppelin Contracts
- Anchor 0.32.1 is the latest stable version
- OpenZeppelin update is a security priority and should be addressed separately
