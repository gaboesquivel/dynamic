import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/schemas/index.ts', 'src/api-contracts/index.ts'],
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
  },
  {
    entry: ['src/index.ts', 'src/schemas/index.ts', 'src/api-contracts/index.ts'],
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
  },
  {
    entry: ['src/index.ts', 'src/schemas/index.ts', 'src/api-contracts/index.ts'],
    dts: {
      only: true,
    },
    outDir: 'dist/types',
    esbuildOptions(options) {
      options.outbase = 'src'
    },
  },
])
