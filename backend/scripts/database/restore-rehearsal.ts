import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { databaseUrl } from './connection';

const COMPOSE_FILE = 'compose.test.yaml';
const SERVICE = 'postgres';
const SOURCE_DATABASE = 'burhanpedia_test';
const RESTORE_DATABASE = 'burhanpedia_restore_rehearsal';
const DATABASE_USER = 'burhanpedia';
const DUMP_FILE = '/tmp/burhanpedia-restore-rehearsal.dump';

function docker(...args: string[]): string {
  return execFileSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
}

function inPostgres(...command: string[]): string {
  return docker('exec', '-T', SERVICE, ...command);
}

function assertSafeTarget(): void {
  const url = new URL(databaseUrl());
  const localHost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const database = url.pathname.replace(/^\//, '');
  assert.equal(process.env.NODE_ENV, 'test', 'NODE_ENV must be test');
  assert(localHost, 'Restore rehearsal only supports a local database');
  assert.equal(
    database,
    SOURCE_DATABASE,
    `Database must be ${SOURCE_DATABASE}`,
  );
}

function psql(database: string, sql: string): string {
  return inPostgres(
    'psql',
    '--username',
    DATABASE_USER,
    '--dbname',
    database,
    '--no-psqlrc',
    '--tuples-only',
    '--no-align',
    '--set',
    'ON_ERROR_STOP=1',
    '--command',
    sql,
  );
}

function dropRestoreDatabase(): void {
  psql('postgres', `DROP DATABASE IF EXISTS ${RESTORE_DATABASE} WITH (FORCE)`);
}

function main(): void {
  assertSafeTarget();
  try {
    inPostgres('rm', '-f', DUMP_FILE);
    inPostgres(
      'pg_dump',
      '--format=custom',
      '--no-owner',
      '--no-acl',
      '--username',
      DATABASE_USER,
      '--dbname',
      SOURCE_DATABASE,
      '--file',
      DUMP_FILE,
    );
    inPostgres('pg_restore', '--list', DUMP_FILE);
    dropRestoreDatabase();
    psql('postgres', `CREATE DATABASE ${RESTORE_DATABASE}`);
    inPostgres(
      'pg_restore',
      '--exit-on-error',
      '--no-owner',
      '--no-acl',
      '--username',
      DATABASE_USER,
      '--dbname',
      RESTORE_DATABASE,
      DUMP_FILE,
    );

    const result = psql(
      RESTORE_DATABASE,
      `SELECT (SELECT count(*) FROM schema_migrations) || ':' ||
              (SELECT count(*) FROM products) || ':' ||
              (SELECT count(*) FROM users)`,
    );
    const [migrationCount, productCount, userCount] = result
      .split(/\r?\n/)
      .find((line) => /^\d+:\d+:\d+$/.test(line.trim()))!
      .split(':')
      .map(Number);
    assert(migrationCount >= 13, 'Restored migration history is incomplete');
    assert(productCount > 0, 'Restored database has no products');
    assert(userCount > 0, 'Restored database has no users');
    console.info(
      JSON.stringify({
        event: 'database_restore_rehearsal_completed',
        migrations: migrationCount,
        products: productCount,
        users: userCount,
      }),
    );
  } finally {
    dropRestoreDatabase();
    inPostgres('rm', '-f', DUMP_FILE);
  }
}

try {
  main();
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
}
