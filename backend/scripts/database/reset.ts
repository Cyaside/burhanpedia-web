import { databaseUrl, createDatabasePool } from './connection';
import { migrate } from './migrate';
import { seed } from './seed';

function assertResetAllowed(): void {
  const url = new URL(databaseUrl());
  const localHost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const safeEnvironment = ['development', 'test'].includes(
    process.env.NODE_ENV ?? 'development',
  );
  if (
    !localHost ||
    !safeEnvironment ||
    process.env.ALLOW_DATABASE_RESET !== 'true'
  ) {
    throw new Error(
      'Database reset requires a local development/test database and ALLOW_DATABASE_RESET=true',
    );
  }
}

export async function reset(): Promise<void> {
  assertResetAllowed();
  const pool = createDatabasePool();
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  } finally {
    await pool.end();
  }
  await migrate();
  await seed();
}

if (require.main === module) {
  reset().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
