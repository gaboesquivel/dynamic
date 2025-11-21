import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/node_modules/**', 'src/test/**'],
    },
  },
  resolve: {
    alias: {
      '@vencura/types': resolve(__dirname, '../../packages/types/src/index.ts'),
      '@vencura/types/schemas': resolve(__dirname, '../../packages/types/src/schemas'),
      '@vencura/types/contracts': resolve(__dirname, '../../packages/types/src/contracts'),
      '@vencura/core': resolve(__dirname, '../../packages/core/src'),
    },
  },
})
