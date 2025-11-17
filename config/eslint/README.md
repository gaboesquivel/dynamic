# `@workspace/eslint-config`

Shared ESLint configuration for the workspace. Provides consistent linting rules across all packages and apps in the monorepo.

## Available Configurations

### Base Configuration (`@workspace/eslint-config/base`)

Base ESLint configuration for Node.js projects (e.g., NestJS backend, infrastructure code).

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

## Plugins Included

- `@typescript-eslint/eslint-plugin` - TypeScript-specific rules
- `@typescript-eslint/parser` - TypeScript parser
- `eslint-plugin-react` - React-specific rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-turbo` - Turbo monorepo rules
- `eslint-plugin-only-warn` - Converts errors to warnings
- `eslint-config-prettier` - Disables conflicting Prettier rules

## Usage Examples

### NestJS Backend

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
