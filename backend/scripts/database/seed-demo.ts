import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDatabasePool } from './connection';
import { seed } from './seed';

const DEMO_SEED_FILE = resolve(__dirname, '../../database/seeds/demo.sql');

async function seedDemo(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to load demo data into production');
  }
  await seed();
  const pool = createDatabasePool();
  try {
    await pool.query(await readFile(DEMO_SEED_FILE, 'utf8'));
    console.info('Demo seed completed');
  } finally {
    await pool.end();
  }
}

seedDemo().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
