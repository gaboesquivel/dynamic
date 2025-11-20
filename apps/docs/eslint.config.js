import { config as baseConfig } from '@workspace/eslint-config/base'

export default [
  ...baseConfig,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
]

