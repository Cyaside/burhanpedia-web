import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PoolClient } from 'pg';
import { createDatabasePool } from './connection';

const MIGRATION_FILE = /^\d{4}_[a-z0-9_]+\.sql$/;
const MIGRATIONS_DIRECTORY = resolve(__dirname, '../../database/migrations');
const LOCK_NAME = 'burhanpedia:schema-migrations';

interface AppliedMigrationRow {
  filename: string;
  checksum: string;
}

function checksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function ensureMigrationTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function appliedMigrations(
  client: PoolClient,
): Promise<Map<string, string>> {
  const result = await client.query<AppliedMigrationRow>(
    'SELECT filename, checksum FROM schema_migrations ORDER BY filename',
  );
  return new Map(result.rows.map((row) => [row.filename, row.checksum]));
}

export async function migrate(): Promise<void> {
  const pool = createDatabasePool();
  const client = await pool.connect();
  try {
    await ensureMigrationTable(client);
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [LOCK_NAME]);
    const applied = await appliedMigrations(client);
    const files = (await readdir(MIGRATIONS_DIRECTORY))
      .filter((file) => MIGRATION_FILE.test(file))
      .sort();

    for (const filename of files) {
      const sql = await readFile(
        resolve(MIGRATIONS_DIRECTORY, filename),
        'utf8',
      );
      const fileChecksum = checksum(sql);
      const recordedChecksum = applied.get(filename);
      if (recordedChecksum && recordedChecksum !== fileChecksum) {
        throw new Error(`Applied migration was modified: ${filename}`);
      }
      if (recordedChecksum) continue;

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [filename, fileChecksum],
        );
        await client.query('COMMIT');
        console.info(`Applied ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client
      .query('SELECT pg_advisory_unlock(hashtext($1))', [LOCK_NAME])
      .catch(() => undefined);
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
