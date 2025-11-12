import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // PGLite doesn't require traditional connection strings
    // This is just for drizzle-kit compatibility
    url: 'pglite://./data',
  },
})
