# Cursor Directory

Configuration and guidelines for AI assistants working with this codebase.

## Structure

### Context (`context/`)

Factual information about the project (not behavioral rules):

- `architecture.md`: High-level architecture
- `backend.md`: Backend architecture and infrastructure
- `frontend.md`: Frontend architecture and tech stack
- `project.md`: Project information and guidelines

### Rules (`rules/`)

Coding standards and best practices organized by domain:

- `base/`: Foundational rules (TypeScript, environment variables, MCP, general patterns)
- `frontend/`: Frontend rules (React, Next.js, mobile-first, ShadcnUI, testing)
- `web3/`: Web3 rules (Cosmos, Solana, Solidity, Viem, Wagmi, Ponder, multichain)
- `backend/`: Backend rules (Elysia, testing)

**Rule guidelines:**

- Focused, actionable, and scoped (~1.5K words max)
- Include frontmatter with `description` and `globs` patterns
- Use clear, direct language with code examples

**Usage:**

```
Please apply the TypeScript rules from .cursor/rules/base/typescript.mdc when refactoring this code.
```

### Prompts (`prompts/`)

Reusable prompt templates:

- `refine-plan.md`: Checklist for refining implementation plans
- `debug-plan.md`: Guidelines for investigating failures and creating fix plans

### MCP Configuration (`mcp.json`)

Model Context Protocol servers for specialized capabilities:

- `shadcn`: UI component management (shadcn/ui)
- `v0`: UI design and generation (v0.dev)
- `github`: Repository management
- `vercel`: Deployment and project management

**Authentication:**

- `shadcn`: Local CLI (no API key)
- `v0`: `V0_API_KEY`
- `github`: `GITHUB_TOKEN`
- `vercel`: `VERCEL_API_TOKEN`

**Package Manager:** All MCP servers use `bunx` for command execution, consistent with the project's package manager choice.

## Documentation

- [MCP Servers Guide](/docs/mcp-servers) - See [MCP Servers Usage Guide](../../apps/docs/content/docs/mcp-servers/index.mdx) for detailed documentation
- [Cursor Rules](https://cursor.com/docs/context/rules)
- [MCP Documentation](https://cursor.com/docs/context/model-context-protocol)
