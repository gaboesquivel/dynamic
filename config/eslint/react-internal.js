import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import pluginImport from "eslint-plugin-import"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

import { config as baseConfig } from "./base.js"

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config} */
export const config = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
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
      // Enforce named exports for React components
      "import/no-default-export": "error",
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
