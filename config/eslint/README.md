# `@workspace/eslint-config`

Shared ESLint configuration for the workspace. Provides consistent linting rules across all packages and apps in the monorepo.

## Available Configurations

### Base Configuration (`@workspace/eslint-config/base`)

Base ESLint configuration for Node.js projects (e.g., Elysia backend, infrastructure code).

**Usage:**

```js
// eslint.config.js
import baseConfig from '@workspace/eslint-config/base'

export default [...baseConfig]
```

**Includes:**

- TypeScript ESLint parser and plugin
- ESLint recommended rules
- Prettier integration
- Turbo plugin for monorepo support

### Next.js Configuration (`@workspace/eslint-config/next-js`)

ESLint configuration for Next.js applications.

**Usage:**

```js
// eslint.config.js
import nextConfig from '@workspace/eslint-config/next-js'

export default [...nextConfig]
```

**Includes:**

- All base configuration
- Next.js specific rules
- React and React Hooks plugins
- TypeScript support

### React Internal Configuration (`@workspace/eslint-config/react-internal`)

ESLint configuration for React libraries and internal packages.

**Usage:**

```js
// eslint.config.js
import reactConfig from '@workspace/eslint-config/react-internal'

export default [...reactConfig]
```

**Includes:**

- All base configuration
- React and React Hooks plugins
- TypeScript support
- Optimized for library development

## Installation

This package is part of the monorepo and is automatically available to all packages and apps. No separate installation needed.

## Features

- **TypeScript Support**: Full TypeScript linting with type-aware rules
- **Prettier Integration**: Prevents conflicts between ESLint and Prettier
- **React Support**: React and React Hooks linting rules
- **Next.js Support**: Next.js specific linting rules
- **Turbo Support**: Monorepo-aware linting with Turbo plugin
- **Modern ESLint**: Uses ESLint 9+ flat config format

## Type Safety Model: Zod-First Validation Strategy

This project uses a **Zod-first validation strategy** instead of relying on TypeScript ESLint's "unsafe" rules for type safety. The following TypeScript ESLint rules are intentionally disabled globally:

- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-call`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unsafe-return`
- `@typescript-eslint/no-unsafe-argument`

### Why These Rules Are Disabled

These rules are disabled because:

1. **AI-Assisted Development**: They are incompatible with AI-assisted development workflows and generate excessive noise around unavoidable `any` types that occur when working with external APIs, libraries, and frameworks.

2. **Runtime Validation Over Static Analysis**: Our safety model is based on **runtime validation** (Zod schemas), not static ESLint rules. We validate data at runtime boundaries where it enters our system, ensuring type safety through actual data validation rather than type assertions.

3. **Reduced Noise**: These rules create false positives and require numerous inline disables, cluttering code without providing meaningful safety guarantees.

### Our Type Safety Approach

Instead of relying on ESLint's unsafe rules, we enforce type safety through:

1. **Zod Schema Validation**: All external or untrusted data must be validated using Zod (or equivalent schemas) before being used. This includes:
   - API responses
   - Database reads
   - Webhook payloads
   - RPC calls
   - AI/LLM responses
   - User input
   - Environment variables

2. **Fully Typed Interfaces**: All internal modules should export fully typed interfaces, DTOs, or schemas to maintain strong type guarantees. Consumers can rely on type inference from these well-defined boundaries.

3. **Data Boundary Validation**: Data boundaries (where external data enters the system) must be validated at the edges using Zod schemas. Once validated, data flows through the system with full type safety.

4. **Type Inference**: We prefer type inference over explicit type annotations in consumer code. Functions define return types; consumers infer types from function return values.

### Example: Proper Validation Pattern

```typescript
// ✅ Good: Validate at the boundary
import { z } from 'zod'
import { fetchWithTimeout } from '@vencura/lib'

const apiResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
})

async function fetchUser(id: string) {
  const response = await fetchWithTimeout({
    url: `/api/users/${id}`,
    options: { method: 'GET' },
  })
  const data = await response.json() // Returns unknown
  const validated = apiResponseSchema.parse(data) // Runtime validation
  return validated // Fully typed, safe to use
}

// ✅ Good: Consumer infers type
const user = await fetchUser('123') // Type: { id: string; name: string }
```

### Guidelines for Contributors

- **Never add inline `eslint-disable` comments** for unsafe rules - they are disabled globally
- **Always validate external data** with Zod schemas at data boundaries
- **Export typed interfaces** from internal modules for type safety
- **Trust type inference** - let TypeScript infer types from validated data and function return types
- **Validate, don't assert** - Use Zod's `.parse()` or `.safeParse()` instead of type assertions
- **Use utility libraries**: Always leverage `@vencura/lib` (error handling, delays, fetch with timeout), `zod` (validation), and `lodash` (array/object operations, type checking) instead of custom implementations

For more details, see:

- [TypeScript Rules](../../.cursor/rules/base/typescript.mdc) - Type safety patterns and guidelines
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Project contribution guidelines

## Plugins Included

- `@typescript-eslint/eslint-plugin` - TypeScript-specific rules
- `@typescript-eslint/parser` - TypeScript parser
- `eslint-plugin-react` - React-specific rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-turbo` - Turbo monorepo rules
- `eslint-plugin-only-warn` - Converts errors to warnings
- `eslint-config-prettier` - Disables conflicting Prettier rules

## Usage Examples

### Elysia Backend

```js
// apps/vencura/eslint.config.mjs
import baseConfig from '@workspace/eslint-config/base'

export default [...baseConfig]
```

### Next.js App

```js
// apps/web/eslint.config.js
import nextConfig from '@workspace/eslint-config/next-js'

export default [...nextConfig]
```

### React Library

```js
// packages/ui/eslint.config.js
import reactConfig from '@workspace/eslint-config/react-internal'

export default [...reactConfig]
```

## License

PROPRIETARY
