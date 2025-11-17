# @vencura/types

Shared API contracts and types for Vencura. This package provides:

- **Zod schemas** for runtime validation and type inference
- **ts-rest contracts** for end-to-end type safety across backend, SDK, and frontend

## Installation

```bash
pnpm add @vencura/types
```

## Usage

### Importing Schemas

```ts
import { Wallet, CreateWalletInput, WalletBalance } from '@vencura/types'
```

### Address Validation

For runtime address validation, use the proper libraries for each chain type:

```ts
// EVM addresses - use viem's getAddress
import { getAddress } from 'viem'

const validatedEvmAddress = getAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')

// Solana addresses - use @solana/web3.js PublicKey
import { PublicKey } from '@solana/web3.js'

const solanaPublicKey = new PublicKey('YourSolanaAddress')
if (!PublicKey.isOnCurve(solanaPublicKey)) {
  throw new Error('Invalid Solana address')
}

// Cosmos addresses - use @cosmjs/encoding for Bech32 validation
import { fromBech32 } from '@cosmjs/encoding'

try {
  const { prefix, data } = fromBech32(address)
  // Validate prefix matches expected chain (e.g., 'cosmos', 'osmo', 'juno')
  // Validate data length (should be 20 bytes for standard addresses)
  const isValid = data.length === 20
} catch {
  throw new Error('Invalid Cosmos Bech32 address')
}
```

### Using validateAddress from @vencura/types

This package provides a `validateAddress` function for basic format validation:

```ts
import { validateAddress } from '@vencura/types/schemas'

// Basic format validation (lightweight, no external dependencies)
const address = validateAddress({
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  chainType: 'evm',
})
```

**Note**: The `validateAddress` function performs basic format validation only. For production validation with proper cryptographic verification, always use the chain-specific libraries shown above.

The zod address schemas in this package are lightweight and dependency-free, making them suitable for type inference and basic format validation. For production validation, always use the chain-specific libraries (viem for EVM, @solana/web3.js for Solana, @cosmjs/encoding for Cosmos, etc.).

### Importing API Contracts

```ts
import { walletAPIContract } from '@vencura/types'
// Or import from the specific export path
import { walletAPIContract } from '@vencura/types/api-contracts'
```

## Architecture

This package uses a contract-first approach where:

1. **Schemas** define the shape of data using Zod for runtime validation and type inference
2. **Address Schemas** provide basic format validation and type inference (for production validation, use chain-specific libraries)
3. **API Contracts** define API endpoints using ts-rest (not to be confused with blockchain smart contracts)
4. Types are automatically inferred from schemas, ensuring consistency across the stack

### Available Schemas

- **Wallet Schemas**: `Wallet`, `CreateWalletInput`, `WalletBalance`, `SignMessageInput`, `SignMessageResult`, `SendTransactionInput`, `SendTransactionResult`
- **Address Schemas**: `EvmAddressSchema`, `SolanaAddressSchema`, `CosmosAddressSchema`, `BitcoinAddressSchema`, `FlowAddressSchema`, `StarknetAddressSchema`, `AlgorandAddressSchema`, `SuiAddressSchema`, `TronAddressSchema` (for type inference and basic format validation)

**Note**: For production address validation, use the proper chain-specific libraries:

- **EVM**: `getAddress()` from `viem`
- **Solana**: `PublicKey` from `@solana/web3.js`
- **Cosmos**: `fromBech32()` from `@cosmjs/encoding`

## Related Packages

- `@vencura/core` - TypeScript SDK using these types
- `apps/api` - NestJS backend implementing these API contracts
- `@vencura/react` - React hooks using these types
