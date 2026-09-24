import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertLocalSeedDatabase,
  createDatabasePool,
  databaseUrl,
} from './connection';

const SEED_FILE = resolve(__dirname, '../../database/seeds/development.sql');

export async function seed(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PRODUCTION_SEED !== 'true'
  ) {
    throw new Error('Refusing to seed a production database');
  }
  if (process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    assertLocalSeedDatabase(databaseUrl());
  }
  const pool = createDatabasePool();
  try {
    const sql = await readFile(SEED_FILE, 'utf8');
    await pool.query(sql);
    console.info('Development seed completed');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
