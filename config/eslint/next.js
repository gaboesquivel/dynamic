import js from "@eslint/js"
import pluginNext from "@next/eslint-plugin-next"
import eslintConfigPrettier from "eslint-config-prettier"
import pluginImport from "eslint-plugin-import"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

import { config as baseConfig } from "./base.js"

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
      import: pluginImport,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Prefer ternaries over && in JSX
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary"] }],
      // Enforce named exports, except for Next.js pages and layouts
      "import/no-default-export": "error",
    },
  },
  // Allow default exports for Next.js pages and layouts
  {
    files: ["**/app/**/page.tsx", "**/app/**/layout.tsx", "**/pages/**/*.tsx"],
    rules: {
      "import/no-default-export": "off",
    },
  },
  // Allow default exports for config files
  {
    files: ["**/*.config.{js,mjs,ts}", "**/eslint.config.{js,mjs}", "**/postcss.config.{js,mjs}"],
    rules: {
      "import/no-default-export": "off",
    },
  },
]
