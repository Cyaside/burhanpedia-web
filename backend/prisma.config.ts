// Prisma configuration file to provide datasource URL for CLI (migrations, studio, etc.)
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma v7 no longer supports `url`/`directUrl` in `schema.prisma`.
    // Use this config to control which connection string the Prisma CLI uses.
    //
    // Recommended pattern:
    // - `DATABASE_URL`            -> pooled/pgbouncer URL for runtime (serverless-friendly)
    // - `PRISMA_MIGRATE_DATABASE_URL` -> direct URL for migrations (no pgbouncer)
    url: process.env.PRISMA_MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL ?? '',
  },
});
