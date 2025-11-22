Refine your plan using the checklist below. Update your plan so it explicitly addresses each area. Apply these requirements to maximize quality, reusability, and clarity:

**Note**: This project uses **Biome + ESLint** for linting/formatting (Biome for formatting, ESLint for rule enforcement only) and **Bun** for package management. See [ADR 006: Linters](/docs/adrs/006-linters) and [ADR 005: Package Manager](/docs/adrs/005-package-manager) for details.

## 1. Dependency and Resource Management

- Ensure all dependencies are managed with the appropriate initialization and retrieval methods required by your stack.
- Avoid manual instantiation where the environment expects other patterns (like dependency injection).
- Confirm setup occurs after all needed resources are available and compatible with test harnesses.
- For frontend UI work, ensure all components and Radix primitives come from `@vencura/ui` (e.g., `@vencura/ui/components/*`, `@vencura/ui/radix`) and avoid installing or importing `@radix-ui/react-*` directly in apps.

## 2. Robust Error and Rate Limit Handling

- Prioritize structured approaches to error codes and response types (such as 429 rate limits).
- Retain fallbacks for variations in error messages or response formats.

## 3. Authentication and Environment Context in Testing

- Clearly distinguish between authentication flows in real usage and test scenarios.
- Document all relevant shortcuts or bypasses utilized by the test harness.
- Adjust test expectations to align with these realities.

## 4. Black-Box Test Discipline

- Tests should only interface with the system through public contracts (such as HTTP APIs).
- Prohibit direct access to internals or imported types—assertions must use exported runtime contracts or schemas.
- **Testing Stack**: This project uses **Vitest** for testing with black-box HTTP API testing strategy. See [Backend Testing Rules](../../.cursor/rules/backend/testing.mdc) and [Frontend Testing Rules](../../.cursor/rules/frontend/testing.mdc) for patterns.
- **Real APIs**: Tests use real APIs with real API keys (no mocks for core functionality). See testing rules for exceptions.

## 5. Contract and Response Stability

- Ensure all plan changes are consistent with public contracts, types, and documented interface expectations.
- Where changes are required, update contracts first, then implementations and tests.

## 6. Public Interface Error Consistency (Optional)

- Guarantee any disabled or missing routes return consistent, contract-compliant errors.

## 7. Compatibility and Containment

- Do not alter unrelated configuration, infrastructure, or build/test setup.
- Limit the impact of changes to the intended files and logic only.

## 8. Plan Output Structure

- List exact files and code regions to update.
- Explain briefly why each fix is needed and how to verify it.

## 9. Tooling and Commands

- Use **Bun** for all package management commands (`bun install`, `bun add`, etc.) - see [ADR 005: Package Manager](/docs/adrs/005-package-manager)
- Use **Biome** for formatting (`bun run format`) and **ESLint** for linting (`bun run lint`) - see [ADR 006: Linters](/docs/adrs/006-linters)
- Run quality checks: `bun run qa` (installs, formats, lints, builds, tests)
- All commands should use `bun` or `bunx` (not npm, pnpm, or yarn)
