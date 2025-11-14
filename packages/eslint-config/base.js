import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import onlyWarn from "eslint-plugin-only-warn"
import turboPlugin from "eslint-plugin-turbo"
import tseslint from "typescript-eslint"

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      // Allow single-line if statements without brackets
      curly: "off",
      "@typescript-eslint/brace-style": "off",
      // Enforce no semicolons
      "semi": ["error", "never"],
      // Enforce arrow function expressions when possible
      "arrow-body-style": ["error", "as-needed", { requireReturnForObjectLiteral: false }],
      // Prefer interfaces over types for object definitions
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
]
