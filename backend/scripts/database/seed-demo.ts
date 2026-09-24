import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as argon2 from 'argon2';
import type { PoolClient } from 'pg';
import {
  assertLocalSeedDatabase,
  createDatabasePool,
  databaseUrl,
} from './connection';
import { seed } from './seed';

const DEMO_SEED_FILE = resolve(__dirname, '../../database/seeds/demo.sql');
const LEGACY_SHARED_DEMO_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$suQmAoSiSoo/+vGoxeq0yQ$1z+74owouG/3hq49gHghnjWZsoYCcy0Q2bYGHdnT1Os';

export async function seedDemo(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to load demo data into production');
  }
  assertLocalSeedDatabase(databaseUrl());
  await seed();
  const pool = createDatabasePool();
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(await readFile(DEMO_SEED_FILE, 'utf8'));
    const pendingAdmin = await client.query<{ id: string }>(
      `SELECT admin.id
       FROM users admin
       WHERE admin.id = $1
         AND (admin.password_hash = $2
              OR admin.password_hash = $3)`,
      [
        '65000000-0000-4000-8000-000000000001',
        'PENDING_DEMO_ADMIN_CREDENTIAL',
        LEGACY_SHARED_DEMO_HASH,
      ],
    );
    let adminPassword: string | undefined;
    if (pendingAdmin.rowCount) {
      adminPassword = randomBytes(24).toString('base64url');
      const passwordHash = await argon2.hash(adminPassword, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      });
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
        passwordHash,
        pendingAdmin.rows[0].id,
      ]);
    }
    await client.query('COMMIT');
    console.info('Demo seed completed');
    if (adminPassword && process.env.CI !== 'true') {
      console.info(`Demo administrator: admin@demo.burhanpedia.local`);
      console.info(`One-time password: ${adminPassword}`);
    }
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDemo().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
