# @vencura/lib package

Shared utility library for common operations across the Vencura monorepo. Follows Linux philosophy: small, focused utilities that compose well.

## Key Principles

1. **Small, Focused Utilities**: Each utility does one thing well
2. **Composable**: Utilities can be combined to solve complex problems
3. **No Dependencies**: Prefer native JavaScript/TypeScript when possible
4. **Consistent Patterns**: Multi-parameter utilities use RORO pattern; single-parameter utilities use direct parameters
5. **Type-Safe**: Full TypeScript support with proper types

## Utilities

### Async Utilities

#### `delay`

Delays execution for the specified number of milliseconds.

```typescript
import { delay } from '@vencura/lib'

await delay(1000) // Wait 1 second
```

#### `fetchWithTimeout`

Fetches a resource with a timeout using native AbortController. Addresses security concern LOW-003.

```typescript
import { fetchWithTimeout } from '@vencura/lib'

const response = await fetchWithTimeout({
  url: 'https://api.example.com/data',
  options: { headers: { Authorization: 'Bearer token' } },
  timeoutMs: 5000,
})
```

### Error Utilities

#### `getErrorMessage`

Extracts error message from various error types.

```typescript
import { getErrorMessage } from '@vencura/lib'

const message = getErrorMessage(new Error('Something went wrong'))
// Returns: 'Something went wrong'
```

#### `formatZodError`

Formats a zod error into a user-friendly error message using zod-validation-error.

```typescript
import { formatZodError } from '@vencura/lib'

try {
  schema.parse(data)
} catch (error) {
  if (error instanceof ZodError) {
    const message = formatZodError({ error })
    console.error(message)
  }
}
```

#### `sanitizeErrorMessage`

Sanitizes error messages by removing sensitive information in production.

```typescript
import { sanitizeErrorMessage } from '@vencura/lib'

const safeMessage = sanitizeErrorMessage({
  message: 'Database connection failed: DATABASE_URL=xxx',
  isProduction: true,
})
// Returns: 'Configuration error' in production
```

#### `isZodError`

Type guard to check if an error is a ZodError.

```typescript
import { isZodError } from '@vencura/lib'

if (isZodError(error)) {
  // Handle zod validation error
}
```

### Date Utilities

#### `getDateKey`

Generates a consistent date key in YYYY-MM-DD format.

```typescript
import { getDateKey } from '@vencura/lib'

const key = getDateKey(new Date('2024-01-15'))
// Returns: '2024-01-15'

const today = getDateKey() // Uses today's date
```

### Environment Utilities

#### `validateEnv`

Generic environment variable validation helper using zod. Supports both Next.js pattern (return result) and NestJS pattern (throw on error).

```typescript
// Next.js pattern (return result)
import { validateEnv } from '@vencura/lib'
import { z } from 'zod'

const envSchema = z.object({
  API_URL: z.string().url(),
  PORT: z.string().optional(),
})

const result = validateEnv({ schema: envSchema })
if (result.isValid) {
  console.log(result.data) // Typed env data
} else {
  console.error(result.errors) // Validation errors
}
```

```typescript
// NestJS pattern (throw on error)
import { validateEnv } from '@vencura/lib'
import { z } from 'zod'

const envSchema = z.object({
  API_URL: z.string().url(),
  PORT: z.string().optional(),
})

const env = validateEnv({ schema: envSchema, throwOnError: true })
// env is typed as z.infer<typeof envSchema>
// Throws error if validation fails
```

#### `getEnvHelper`

Helper for Next.js apps that automatically reconstructs env objects using zod schema inference. Eliminates boilerplate of manually reconstructing env objects.

```typescript
import { getEnvHelper } from '@vencura/lib'
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

export function getEnv(): Env {
  return getEnvHelper({ schema: envSchema })
}
// Returns validated env vars, throws in production if validation fails
// Uses zod schema inference - no manual object reconstruction needed
```

### Zod Utilities

#### `formatZodErrors`

Formats zod validation errors into a readable string array.

```typescript
import { formatZodErrors } from '@vencura/lib'

const result = schema.safeParse(data)
if (!result.success) {
  const errors = formatZodErrors(result.error)
  // Returns: ['field1: Required', 'field2: Invalid format']
}
```

## Usage

This package is part of the monorepo and is automatically available to all apps. No separate installation needed.

Import utilities as needed:

```typescript
import { delay, getErrorMessage, getDateKey, getEnvHelper, validateEnv } from '@vencura/lib'
```

## Best Practices

### Environment Validation

**Next.js Apps:**

- Use `getEnvHelper` to eliminate boilerplate of manually reconstructing env objects
- Define zod schema and use `z.infer<typeof schema>` for type inference
- Let zod handle object reconstruction automatically

**NestJS Apps:**

- Use `validateEnv` with `throwOnError: true` for NestJS pattern
- Define zod schema and use `z.infer<typeof schema>` for type inference
- Use `formatZodErrors` from @lib for consistent error formatting

### Error Handling

- Use `getErrorMessage` from @lib for consistent error message extraction
- Use lodash utilities (`isPlainObject`, `isEmpty`) for type checking instead of manual checks
- Use `formatZodError` for user-facing messages, `formatZodErrors` for arrays

### Fetch Calls

- Always use `fetchWithTimeout` for external API calls (addresses security concern LOW-003)
- Use appropriate timeout values based on expected response time
- Default timeout is 5000ms, adjust as needed

## When to Use @vencura/lib vs Other Libraries

- **@vencura/lib**: Use for shared utilities (error handling, delays, date formatting, env validation)
- **lodash**: Use for complex array/object manipulations, functional utilities (debounce, throttle), and type checking (`isPlainObject`, `isEmpty`, `isString`)
- **zod**: Use for schema validation and type inference (always prefer zod for validation)
- **nanoid**: Use directly for unique ID generation (not wrapped in @vencura/lib)
- **Native JavaScript**: Use for simple operations (array.map, Object.keys, etc.)

## License

PROPRIETARY
