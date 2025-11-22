# Vencura Documentation Site

Fumadocs-based documentation site for high-level architecture, ADRs, deployment strategy, and AI-assisted workflow documentation.

## Overview

This is the **@docs** site - the canonical place for high-level architecture, stack overview, and workflows. It's built with **Fumadocs** (Next.js + MDX) and serves as the central documentation hub for the Vencura monorepo.

## Purpose

The docs site focuses on:

- **High-level architecture**: Monorepo layout, key components, and how they interact
- **Stack & conventions**: Major tech choices (Elysia, Next.js, Fumadocs, bun, Viem/Wagmi, `@vencura/*` packages)
- **ADRs**: Architecture Decision Records documenting key technical decisions
- **Deployment & environments**: Thin-layer Vercel design, environment strategy, Google Cloud/Pulumi options
- **AI-assisted workflow**: How MCP servers, Cursor rules, and v0 are used in development

For app-specific documentation, see individual app READMEs:
- [Vencura API](../../apps/api/README.md)
- [Vencura Next](../../apps/next/README.md)
- [Mathler](../../apps/mathler/README.md)

## Tech Stack

- **Next.js** - React framework
- **Fumadocs** - Documentation framework built on Next.js and MDX
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Bun >= 1.3.2
- Node.js >= 20

### Running Locally

```bash
# From monorepo root
bun run dev

# Or from this directory
cd apps/docs
bun run dev
```

Open http://localhost:3000 with your browser to see the result.

## Content Structure

Documentation content lives in:

- **`content/docs/`** - MDX documentation files
  - `adrs/` - Architecture Decision Records
  - `architecture/` - Architecture overview
  - `deployment/` - Deployment strategy
  - `environment/` - Environment variable patterns
  - `getting-started/` - Quick start guides
  - `mcp-servers/` - MCP server documentation
  - `packages/` - Package documentation
  - `apps/` - Application documentation
- **`source.config.ts`** - Fumadocs configuration (frontmatter schema, etc.)

## Adding Documentation

1. Create or edit MDX files in `content/docs/`
2. Use frontmatter for metadata:
   ```mdx
   ---
   title: "Page Title"
   description: "Page description"
   ---
   ```
3. Content will be automatically indexed and searchable

## Development

```bash
# Development mode
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Type check MDX files
bun run types:check

# Lint
bun run lint
```

## Related Documentation

- [Fumadocs Documentation](https://fumadocs.dev) - Fumadocs framework docs
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Root README](../../README.md) - Monorepo overview and getting started

## License

PROPRIETARY
