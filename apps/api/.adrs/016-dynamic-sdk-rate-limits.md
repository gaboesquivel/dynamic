# ADR 016: Dynamic SDK Rate Limit Handling

## Status

Accepted

## Context

Dynamic SDK has rate limits for its endpoints:

- **SDK endpoints** (`/sdk`): 100 requests per minute per IP, 10,000 requests per minute per project environment
- **Developer endpoints**: 1,500 requests per minute per IP, 3,000 requests per minute per project environment

We use SDK endpoints (`@dynamic-labs-wallet/node-evm`, `@dynamic-labs-wallet/node-svm`), so we need to implement safeguards for **100 req/min per IP** and **10,000 req/min per project environment**.

Without proper rate limit handling, our API can hit 429 (Too Many Requests) errors from Dynamic SDK, causing:

- Failed wallet creation requests
- Failed transaction signing
- Poor user experience
- Test failures

## Decision

We implement a centralized rate limit service with the following approach:

1. **Centralized Rate Limit Service**: A NestJS `@Injectable()` service (`RateLimitService`) that wraps all Dynamic SDK calls with retry logic
2. **Exponential Backoff with Jitter**: Retry delays increase exponentially (baseDelay \* 2^attempt) with random jitter to prevent thundering herd
3. **Retry-After Header Support**: Respects `Retry-After` header from 429 responses if present
4. **Dependency Injection**: Service is injected into wallet clients via NestJS DI, ensuring consistent behavior
5. **Configuration**: Rate limit settings are configurable via environment variables:
   - `DYNAMIC_RATE_LIMIT_MAX_RETRIES` (default: 5)
   - `DYNAMIC_RATE_LIMIT_BASE_DELAY_MS` (default: 1000)
   - `DYNAMIC_RATE_LIMIT_MAX_DELAY_MS` (default: 30000)

## Implementation Details

### Rate Limit Service

The `RateLimitService` provides a `retryWithBackoff()` method that:

- Detects 429 errors via status code or error message
- Retries with exponential backoff and jitter
- Respects `Retry-After` header if present
- Logs retry attempts for monitoring
- Throws error after max retries exhausted

### Wallet Client Integration

All Dynamic SDK calls in wallet clients are wrapped with `retryWithBackoff()`:

- `createWalletAccount()` - Wallet creation
- `signMessage()` - Message signing
- `signTransaction()` - Transaction signing (EVM)
- `signTransaction()` - Transaction signing (Solana)

### Test Helpers

Test helpers are updated to:

- Throttle wallet creation calls (700ms minimum interval = ~85 req/min, well under 100 req/min limit)
- Increase retry attempts from 3 to 5
- Add jitter to backoff delays
- Use `@vencura/lib` utilities (`delay()`, `getErrorMessage()`)
- Use lodash utilities (`isEmpty()`, `isString()`, `isPlainObject()`)

### Error Handling

Error handling uses:

- `@vencura/lib`'s `getErrorMessage()` for consistent error extraction
- Lodash utilities for type checking (`isString()`, `isPlainObject()`, `isEmpty()`)
- Zod schemas for configuration validation

## Consequences

### Positive

- **Resilient**: API automatically retries on rate limit errors
- **Configurable**: Rate limit behavior can be adjusted via environment variables
- **Observable**: Retry attempts are logged for monitoring
- **Consistent**: All Dynamic SDK calls use the same retry logic
- **Test-Friendly**: Test helpers respect rate limits, preventing test failures

### Negative

- **Increased Latency**: Retries add delay to requests that hit rate limits
- **Complexity**: Additional service and retry logic adds complexity
- **Resource Usage**: Retries consume more resources (CPU, memory, network)

### Mitigations

- Exponential backoff limits retry frequency
- Max retry attempts prevent infinite loops
- Jitter prevents synchronized retries from multiple clients
- Configuration allows tuning for different environments

## Library Usage

### @vencura/lib

- `delay()`: Used for retry delays
- `getErrorMessage()`: Used for error message extraction

### lodash

- `isEmpty()`: Check if values are empty
- `isString()`: Type checking for strings
- `isPlainObject()`: Type checking for plain objects

### zod

- Configuration schema validation
- Error details schema validation
- Type inference from schemas

## Test Authentication

Tests use `getTestAuthToken()` helper which uses Dynamic API key directly (bypasses Dynamic auth widget). This is documented in test README.

## References

- Dynamic SDK documentation: https://docs.dynamic.xyz
- Rate limit information from Dynamic SDK documentation
- NestJS dependency injection: https://docs.nestjs.com/providers
