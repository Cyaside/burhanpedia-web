import 'dotenv/config';
import { Pool, PoolConfig } from 'pg';

export function databaseUrl(): string {
  const value = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!value) {
    throw new Error('DATABASE_URL or MIGRATION_DATABASE_URL is required');
  }
  return value;
}

export function assertLocalSeedDatabase(connectionString: string): void {
  const { hostname } = new URL(connectionString);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    throw new Error(
      'Development data may only be loaded into a local database',
    );
  }
}

export function createDatabasePool(): Pool {
  const connectionString = databaseUrl();
  const config: PoolConfig = {
    connectionString,
    max: 2,
    connectionTimeoutMillis: 5_000,
    application_name: 'burhanpedia-database-script',
  };
  if (connectionString.includes('sslmode=')) {
    config.ssl = {
      rejectUnauthorized:
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }
  return new Pool(config);
}
