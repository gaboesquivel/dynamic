# @vencura/core

TypeScript SDK for the Vencura API, automatically generated from the Swagger/OpenAPI specification.

## Overview

This package provides a fully typed TypeScript client for interacting with the Vencura API. The SDK is automatically generated from the Swagger JSON specification exported by the `apps/vencura` NestJS backend.

## Usage

```typescript
import { Api } from '@vencura/core'

const api = new Api({
  baseURL: 'https://api.vencura.com',
  headers: {
    Authorization: 'Bearer YOUR_JWT_TOKEN',
  },
})

// Use the generated API methods
const wallets = await api.wallets.getWallets()
```

## Development

### Building the SDK

The SDK is generated during the build process:

```bash
pnpm build
```

This will:

1. Build the `apps/vencura` backend (which exports Swagger JSON)
2. Generate the TypeScript SDK from the Swagger JSON
3. Output the generated SDK to `src/`

### Manual Generation

To manually regenerate the SDK:

```bash
pnpm generate-sdk
```

## Dependencies

- `swagger-typescript-api` - SDK generation tool
- Generated SDK uses native `fetch` API for HTTP requests

## Type Safety

All API endpoints, request parameters, and response types are fully typed based on the Swagger specification, providing full TypeScript type safety and IntelliSense support.
