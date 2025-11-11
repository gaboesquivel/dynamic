import { Module, Global } from '@nestjs/common';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: 'PGLITE',
      useFactory: async () => {
        const client = new PGlite();
        await client.waitReady;
        return client;
      },
    },
    {
      provide: 'DATABASE',
      useFactory: (client: PGlite) => {
        return drizzle(client, { schema });
      },
      inject: ['PGLITE'],
    },
    {
      provide: 'DB_SCHEMA',
      useValue: schema,
    },
  ],
  exports: ['DATABASE', 'DB_SCHEMA', 'PGLITE'],
})
export class DatabaseModule {}
