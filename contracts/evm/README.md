# EVM Contracts

This directory contains EVM smart contracts built with Foundry for testing and faucet purposes.

## Overview

**Foundry** is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools)
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network
- **Chisel**: Fast, utilitarian, and verbose solidity REPL

## Project Structure

```
evm/
├── src/              # Contract source files
│   └── TestToken.sol # Test token contract
├── test/             # Test files
│   └── TestToken.t.sol
├── script/            # Deployment scripts
│   └── TestToken.s.sol
├── lib/              # Dependencies (OpenZeppelin, forge-std)
├── foundry.toml      # Foundry configuration
└── package.json      # Package scripts
```

## Contracts

### TestToken

A test ERC20 token contract designed for testing and faucet purposes. Key features:

- **Open Minting**: Anyone can mint tokens (no access control) - perfect for faucets
- **Open Burning**: Anyone can burn tokens (no access control) - useful for testing
- **Configurable Decimals**: Supports any decimal value (typically 6, 8, or 18)
- **Events**: Emits `Mint` and `Burn` events for tracking
- **OpenZeppelin Based**: Built on battle-tested OpenZeppelin ERC20 implementation

**Important**: This contract is intentionally open for testing. Do not deploy to mainnet without proper access controls.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Rust (for Foundry)
- Node.js >= 20 (for monorepo scripts)

## Installation

Install Foundry dependencies:

```bash
forge install
```

This will install OpenZeppelin Contracts and other dependencies. The `lib/` directory is gitignored to ensure dependencies remain pristine and are installed via Foundry's dependency management.

## Usage

### Build

```bash
forge build
# or
pnpm run contracts:evm:build
```

### Test

```bash
forge test
# or
pnpm run contracts:evm:test
```

Run with verbosity:

```bash
forge test -vvv
```

### Format

```bash
forge fmt
```

### Gas Snapshots

```bash
forge snapshot
```

### Local Development

Start a local Anvil node:

```bash
anvil
# or
pnpm run contracts:evm:deploy:anvil
```

### Deploy

Deploy TestToken to a local network:

```bash
forge script script/TestToken.s.sol:TestTokenScript \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key <your_private_key>
```

Deploy with custom parameters:

```bash
TOKEN_NAME="My Token" \
TOKEN_SYMBOL="MTK" \
TOKEN_MINTER=<address> \
TOKEN_DECIMALS=18 \
forge script script/TestToken.s.sol:TestTokenScript \
  --rpc-url <rpc_url> \
  --broadcast \
  --private-key <your_private_key>
```

### Cast

Interact with deployed contracts:

```bash
cast <subcommand>
```

## Configuration

Foundry configuration is in `foundry.toml`:

- Solidity version: `0.8.24`
- Optimizer: Enabled (200 runs)
- Fuzz tests: 256 runs
- Remappings: OpenZeppelin contracts

## Testing

The test suite includes:

- Basic mint/burn functionality
- Open access control verification (anyone can mint/burn)
- Multiple users minting independently
- Edge cases (zero amounts)
- Fuzz testing for mint/burn amounts
- Event emission verification
- Decimals with different values

## Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org/)

## License

MIT
