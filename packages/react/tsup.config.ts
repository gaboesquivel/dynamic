import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/provider.tsx',
      'src/hooks/use-wallets.ts',
      'src/hooks/use-tokens.ts',
      'src/hooks/keys.ts',
    ],
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/esm',
    outExtension() {
      return {
        js: '.mjs',
      }
    },
    esbuildOptions(options) {
      options.outbase = 'src'
    },
    external: ['react', 'react-dom', 'viem'],
  },
  {
    entry: [
      'src/index.ts',
      'src/provider.tsx',
      'src/hooks/use-wallets.ts',
      'src/hooks/use-tokens.ts',
      'src/hooks/keys.ts',
    ],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: true,
    outDir: 'dist/cjs',
    outExtension() {
      return {
        js: '.cjs',
      }
    },
    esbuildOptions(options) {
      options.outbase = 'src'
    },
    external: ['react', 'react-dom', 'viem'],
  },
  {
    entry: [
      'src/index.ts',
      'src/provider.tsx',
      'src/hooks/use-wallets.ts',
      'src/hooks/use-tokens.ts',
      'src/hooks/keys.ts',
    ],
    dts: {
      only: true,
    },
    outDir: 'dist/types',
    esbuildOptions(options) {
      options.outbase = 'src'
    },
    external: ['react', 'react-dom', 'viem'],
  },
])
