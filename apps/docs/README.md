# Vencura Docs

A documentation site built with Next.js.

## Tech Stack

- Next.js 16.0.0
- React 19.1.1
- TypeScript
- Dynamic SDK
- Tailwind CSS
- Shadcn/ui components (via `@vencura/ui`)

## Design System & Dependencies

This app uses `@vencura/ui` as the centralized design system:

- **UI Components**: Import from `@vencura/ui/components/*`
- **Radix Primitives**: Import from `@vencura/ui/radix`
- **Utilities**: Import from `@vencura/ui/lib/utils`
- **Icons**: Import from `lucide-react` via `@vencura/ui`

**Do NOT install** these design system dependencies directly in this app - they are managed centrally in `@vencura/ui`:

- Any `@radix-ui/react-*` packages
- `class-variance-authority`, `clsx`, `tailwind-merge`

**Do install** these app-level dependencies:

- `next-themes` - Theme provider (configured per app)
- `lucide-react` - If you need icons directly (UI components already include it)

## Mobile-First Design

This app follows **mobile-first responsive design**:

- Base styles target mobile devices (default)
- Enhancements added for larger screens using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- All components are designed mobile-first, then enhanced for desktop

See [Mobile-First Rules](../../.cursor/rules/frontend/mobile-first.mdc) for detailed guidelines.

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm (package manager)
- Dynamic SDK environment ID (see Environment Variables below)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd apps/docs
pnpm install
```

### Running the Application

```bash
# From monorepo root
pnpm dev

# Or from this directory
cd apps/docs
pnpm dev
```

The application will be available at `http://localhost:3002` (or the next available port).

### Environment Variables

This Next.js app uses environment-specific configuration files. Next.js automatically loads environment files in priority order:

1. `.env` (highest priority, sensitive data, never committed, overrides everything)
2. `.env.development` / `.env.staging` / `.env.production` (based on NODE_ENV, committed configs)

**File Structure:**

- `.env` - Sensitive data (API keys, tokens, secrets) - **NEVER COMMIT**
- `.env.development` - Development configuration (committed, non-sensitive)
- `.env.staging` - Staging configuration (committed, non-sensitive)
- `.env.production` - Production configuration (committed, non-sensitive)
- `.env-example` - Template for `.env` file (shows required sensitive variables)

**Setup for Local Development:**

```bash
# Copy the example file for sensitive data
cp .env-example .env

# Fill in your actual sensitive values in .env
# NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id

# .env.development is already committed with non-sensitive configs
```

**Required Environment Variables:**

- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`: Your Dynamic environment ID from the [Dynamic Dashboard](https://app.dynamic.xyz/). Required for authentication to work properly.

**Optional Environment Variables:**

- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN URL for error tracking (optional, defaults to disabled)
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`: Environment name for Sentry (optional, defaults to `NODE_ENV`)

**Environment-Specific Configuration:**

- **Development** (`.env.development` + `.env`): Local development
- **Staging** (`.env.staging` + `.env`): Staging environment
- **Production** (`.env.production` + `.env`): Production environment

**Note**: `.env.development`, `.env.staging`, and `.env.production` are committed files with non-sensitive configuration. Sensitive data (like `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`) should be in `.env` file (never committed).

**Getting Your Dynamic Environment ID:**

1. Go to [app.dynamic.xyz](https://app.dynamic.xyz/)
2. Sign up for a free account (if you don't have one)
3. Create a new project or select an existing one
4. Copy the Environment ID from your project settings
5. Add it to your `.env.local` file as `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`

**Note**: If `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is not set, the app will use a placeholder ID and show warnings in development mode. Authentication will not work properly without a valid environment ID.

See [ADR 014: Environment Strategy](../../.adrs/014-environment-strategy.md) for the complete architecture decision and [Environment Rules](../../.cursor/rules/base/environment.mdc) for implementation patterns.

## Development

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Project Structure

```
docs/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page component
│   └── layout.tsx         # Root layout
├── components/             # React components
├── lib/                    # Utilities
├── hooks/                  # React hooks
└── types/                  # TypeScript type definitions
```

## License

PROPRIETARY
