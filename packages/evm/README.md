# @vencura/evm

TypeScript package for EVM token contract ABIs and Node.js utilities.

**Note**: React hooks have been removed. Use [@vencura/react](../react/README.md) hooks instead, which call the Vencura API (single integration point to Dynamic SDK).

## Features

- Type-safe contract ABIs from Foundry build output
- Node.js utilities for backend contract interactions
- Support for multiple networks including Arbitrum Sepolia

## Installation

```bash
pnpm add @vencura/evm
```

## Peer Dependencies

This package requires the following peer dependency (provided by your app):

- `viem` ^2.0.0

## Usage

### ABIs

Use ABIs for encoding contract calls with viem:

```ts
import { testnetTokenAbi } from '@vencura/evm/abis'
import { encodeFunctionData } from 'viem'

// Encode mint function call
const mintData = encodeFunctionData({
  abi: testnetTokenAbi,
  functionName: 'mint',
  args: [recipientAddress, amount],
})

// Use with Vencura API transaction endpoint
await sendTransaction({
  to: tokenAddress,
  amount: 0,
  data: mintData,
})
```

## Package Structure

```
@vencura/evm/
└── /abis # Contract ABIs
    └── testnetTokenAbi # TestToken ABI from Foundry
```

## Exports

- `@vencura/evm/abis` - Contract ABIs

## Supported Contracts

- **TestToken**: ERC20 token with open minting/burning for testing and faucet purposes
  - Deployed on Arbitrum Sepolia
  - See [contracts/evm/README.md](../../contracts/evm/README.md) for deployed addresses

## Related Packages

- [@vencura/react](../react/README.md) - React hooks for Vencura API (recommended for frontend)
- [@vencura/core](../core/README.md) - TypeScript SDK for Vencura API
- [contracts/evm](../../contracts/evm/README.md) - EVM smart contracts source code

## Architecture

This package provides low-level utilities and ABIs. For frontend React applications, use [@vencura/react](../react/README.md) hooks which provide a higher-level API.

## License

PROPRIETARY
