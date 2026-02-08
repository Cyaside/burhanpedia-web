// Prisma configuration file to provide datasource URL for CLI (migrations, studio, etc.)
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use process.env here to avoid throwing when DATABASE_URL is missing for commands
    // that don't require a DB connection (e.g. `prisma generate`).
    url: process.env.DATABASE_URL ?? '',
  },
});
