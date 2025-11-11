# Vencura API

A custodial wallet backend API built with NestJS, Dynamic authentication, Viem, and PGLite.

## Overview

Vencura is a backend API that enables users to create and manage custodial Ethereum wallets. It provides secure wallet operations including balance queries, message signing, and transaction sending on the Arbitrum Sepolia testnet.

## Features

- **Dynamic Authentication**: Secure user authentication using `@dynamic-labs/sdk-api`
- **Dynamic Wallets**: Server-side wallet management using `@dynamic-labs-wallet/node-evm`
- **Custodial Wallets**: Create and manage Ethereum wallets on the backend
- **Blockchain Operations**:
  - Get wallet balance
  - Sign messages with wallet private keys
  - Send transactions on Arbitrum Sepolia testnet
- **Database**: PGLite with DrizzleORM for lightweight, embedded database
- **API Documentation**: Interactive Swagger UI at `/api`
- **Security**: AES-256-GCM encryption for private key storage
- **Testing**: Comprehensive unit and E2E tests

## Tech Stack

- **Framework**: NestJS
- **Authentication**: Dynamic Labs SDK Client
- **Blockchain**: Viem
- **Database**: PGLite with DrizzleORM
- **API Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
DYNAMIC_API_TOKEN=your_dynamic_api_token
ARBITRUM_SEPOLIA_RPC_URL=https://arbitrum-sepolia.infura.io/v3/91de7ed3c17344cc95f8ea31bf6b3adf
ENCRYPTION_KEY=your_encryption_key_32_chars_minimum
```

**Required Environment Variables:**

- `DYNAMIC_ENVIRONMENT_ID`: Your Dynamic environment ID from the Dynamic dashboard
- `DYNAMIC_API_TOKEN`: Your Dynamic API token for server-side authentication
- `ARBITRUM_SEPOLIA_RPC_URL`: RPC endpoint for Arbitrum Sepolia testnet (default provided)
- `ENCRYPTION_KEY`: Encryption key for private keys (minimum 32 characters)

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

## API Endpoints

All endpoints require Bearer token authentication (Dynamic auth token).

### Create Wallet

```http
POST /wallets
Authorization: Bearer <dynamic-auth-token>
Content-Type: application/json

{
  "network": "arbitrum-sepolia"
}
```

**Response:**

```json
{
  "id": "wallet-uuid",
  "address": "0x...",
  "network": "arbitrum-sepolia"
}
```

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

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Database

The application uses PGLite, an embedded PostgreSQL database. Database schemas are defined using DrizzleORM.

### Database Commands

```bash
# Generate migrations
pnpm run db:generate

# Run migrations
pnpm run db:migrate
```

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

## Security Considerations

- Private keys are encrypted using AES-256-GCM before storage
- All API endpoints require Dynamic authentication
- Users can only access their own wallets
- Encryption key should be kept secure and never committed to version control

## Architecture Decisions

- **PGLite**: Chosen for lightweight, embedded database that doesn't require external PostgreSQL server
- **Viem**: Modern TypeScript-first library for Ethereum interactions
- **DrizzleORM**: Type-safe ORM with excellent TypeScript support
- **Dynamic SDK**: Provides secure authentication and user management

## License

PROPRIETARY
