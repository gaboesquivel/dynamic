# Contributing to Vencura

Thank you for your interest in contributing to Vencura! This document outlines our project's standards, conventions, and type safety philosophy.

## Type Safety Philosophy: Zod-First Validation Strategy

This project uses a **Zod-first validation strategy** for type safety. We intentionally disable TypeScript ESLint's "unsafe" rules globally because they are incompatible with AI-assisted development and generate excessive noise around unavoidable `any` types.

### Our Safety Model

Our type safety model is **not based on ESLint rules** but on **runtime validation**:

1. **Runtime Validation Over Static Analysis**: We validate data at runtime boundaries where it enters our system using Zod schemas, ensuring type safety through actual data validation rather than type assertions.

2. **Schema-Driven Approach**: All external or untrusted data must be validated using Zod (or equivalent schemas) before being used.

3. **Fully Typed Interfaces**: All internal modules should export fully typed interfaces, DTOs, or schemas to maintain strong type guarantees.

4. **Data Boundary Validation**: Data boundaries (API responses, database reads, webhooks, RPC calls, AI responses) must be validated at the edges using Zod schemas.

### Disabled ESLint Rules

The following TypeScript ESLint rules are intentionally disabled globally:

- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-call`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unsafe-return`
- `@typescript-eslint/no-unsafe-argument`

**Never add inline `eslint-disable` comments for these rules** - they are disabled globally. If you encounter type safety issues, validate data with Zod schemas instead.

### Validation Requirements

All external or untrusted data must be validated using Zod before being used. This includes:

- **API responses**: Validate all API responses with Zod schemas
- **Database reads**: Validate database query results with Zod schemas
- **Webhook payloads**: Validate webhook payloads with Zod schemas
- **RPC calls**: Validate RPC call responses with Zod schemas
- **AI/LLM responses**: Validate AI responses with Zod schemas
- **User input**: Validate user input with Zod schemas
- **Environment variables**: Validate environment variables with Zod schemas (use `validateEnv` from `@vencura/lib`)

### Example: Proper Validation Pattern

```typescript
// ✅ Good: Validate at the boundary
import { z } from 'zod'

const apiResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
})

async function fetchUser(id: string): Promise<{ id: string; name: string }> {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json() // Returns unknown
  const validated = apiResponseSchema.parse(data) // Runtime validation
  return validated // Fully typed, safe to use
}

// ✅ Good: Consumer infers type
const user = await fetchUser('123') // Type inferred from function return type
```

### Guidelines for Contributors and AI-Generated Code

1. **Never add inline `eslint-disable` comments** for unsafe rules - they are disabled globally
2. **Always validate external data** with Zod schemas at data boundaries
3. **Export typed interfaces** from internal modules for type safety
4. **Trust type inference** - let TypeScript infer types from validated data and function return types
5. **Validate, don't assert** - Use Zod's `.parse()` or `.safeParse()` instead of type assertions
6. **Define return types in functions** - Functions should have explicit return types; consumers should infer types

## Code Standards

This project follows strict coding standards enforced through Cursor rules. See the main [README.md](README.md) for an overview of our standards and conventions.

### Key Patterns

- **Mobile-First Design**: All frontend components follow mobile-first responsive design
- **RORO Pattern**: Functions with multiple parameters use Receive Object, Return Object pattern
- **Type Inference**: Always enforce type inference - define return types in functions when needed, never in consumers
- **Functional Code**: Prefer functional and declarative programming patterns

### Cursor Rules

Code standards are defined in [`.cursor/rules/`](.cursor/rules/) organized by domain:

- **Base**: [TypeScript](.cursor/rules/base/typescript.mdc), [Environment](.cursor/rules/base/environment.mdc)
- **Frontend**: [React](.cursor/rules/frontend/react.mdc), [Next.js](.cursor/rules/frontend/nextjs.mdc), [React Hooks](.cursor/rules/frontend/react-hooks.mdc), [Mobile-First](.cursor/rules/frontend/mobile-first.mdc)
- **Backend**: [NestJS](.cursor/rules/backend/nestjs.mdc), [Testing](.cursor/rules/backend/testing.mdc)
- **Web3**: [Viem](.cursor/rules/web3/viem.mdc), [Wagmi](.cursor/rules/web3/wagmi.mdc), [Solana](.cursor/rules/web3/solana.mdc), [Multichain](.cursor/rules/web3/multichain.mdc)

## Development Workflow

1. **Install dependencies**: `pnpm install`
2. **Run quality checks**: `pnpm run qa` (installs, formats, lints, builds, tests)
3. **Run linting**: `pnpm lint`
4. **Run type checking**: `pnpm check-types`
5. **Run tests**: See individual project READMEs for test commands

## Additional Resources

- [ESLint Configuration](config/eslint/README.md) - Details on our ESLint setup and type safety model
- [TypeScript Rules](.cursor/rules/base/typescript.mdc) - Comprehensive TypeScript coding standards
- [Architecture Decision Records](/docs/adrs) - Architectural decisions and rationale

## Questions?

If you have questions about our type safety approach or coding standards, please refer to the documentation above or open an issue for discussion.
