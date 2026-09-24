import assert from 'node:assert/strict';
import { DatabaseError, PoolClient } from 'pg';
import { createDatabasePool } from './connection';
import { migrate } from './migrate';

async function expectConstraint(
  client: PoolClient,
  operation: () => Promise<unknown>,
  constraint: string,
): Promise<void> {
  await client.query('SAVEPOINT expected_constraint');
  try {
    await operation();
    assert.fail(`Expected constraint ${constraint} to reject the operation`);
  } catch (error) {
    await client.query('ROLLBACK TO SAVEPOINT expected_constraint');
    assert(error instanceof DatabaseError);
    assert.equal(error.constraint, constraint);
  } finally {
    await client.query('RELEASE SAVEPOINT expected_constraint');
  }
}

async function verify(): Promise<void> {
  await migrate();
  const pool = createDatabasePool();
  const client = await pool.connect();

  try {
    const migrations = await client.query<{ count: string }>(
      'SELECT count(*) FROM schema_migrations',
    );
    assert(Number(migrations.rows[0].count) >= 15);

    const requiredIndexes = [
      'products_search_fts_idx',
      'orders_store_queue_idx',
      'inventory_reservations_active_expiry_idx',
      'deliveries_available_idx',
      'outbox_events_pending_idx',
      'background_jobs_runnable_idx',
      'delivery_jobs_available_idx',
      'order_status_history_sequence_idx',
      'voucher_redemptions_buyer_idx',
      'delivery_jobs_driver_idempotency_idx',
      'background_jobs_stale_lock_idx',
      'outbox_events_stale_lock_idx',
      'published_events_feed_idx',
      'order_items_variant_order_idx',
      'stores_logo_storage_key_idx',
      'product_reviews_buyer_history_idx',
    ];
    const indexes = await client.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public' AND indexname = ANY($1::text[])`,
      [requiredIndexes],
    );
    assert.deepEqual(
      indexes.rows.map(({ indexname }) => indexname).sort(),
      requiredIndexes.sort(),
    );

    const moneyColumns = await client.query<{ data_type: string }>(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public'
         AND column_name ~ '(amount|fee_amount)$'`,
    );
    assert(moneyColumns.rows.length > 10);
    assert(moneyColumns.rows.every(({ data_type }) => data_type === 'bigint'));

    await client.query('BEGIN');
    const user = await client.query<{ id: string }>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ('schema-test@burhanpedia.local', 'Schema Test', 'not-a-real-hash')
       RETURNING id`,
    );
    const userId = user.rows[0].id;
    const buyer = await client.query<{ id: string }>(
      'INSERT INTO buyer_profiles (user_id) VALUES ($1) RETURNING id',
      [userId],
    );
    const seller = await client.query<{ id: string }>(
      'INSERT INTO seller_profiles (user_id) VALUES ($1) RETURNING id',
      [userId],
    );
    const store = await client.query<{ id: string }>(
      `INSERT INTO stores (seller_profile_id, slug, name)
       VALUES ($1, 'schema-test', 'Schema Test Store') RETURNING id`,
      [seller.rows[0].id],
    );
    await expectConstraint(
      client,
      () =>
        client.query(
          `UPDATE stores SET logo_url = 'https://example.com/logo.png'
           WHERE id = $1`,
          [store.rows[0].id],
        ),
      'stores_logo_triplet_check',
    );
    const product = await client.query<{ id: string }>(
      `INSERT INTO products (store_id, slug, name)
       VALUES ($1, 'schema-test', 'Schema Test Product') RETURNING id`,
      [store.rows[0].id],
    );
    const variant = await client.query<{ id: string }>(
      `INSERT INTO product_variants (product_id, sku, name, price_amount)
       VALUES ($1, 'SCHEMA-TEST', 'Default', 10000) RETURNING id`,
      [product.rows[0].id],
    );

    await expectConstraint(
      client,
      () =>
        client.query(
          'INSERT INTO inventories (variant_id, on_hand) VALUES ($1, -1)',
          [variant.rows[0].id],
        ),
      'inventories_on_hand_check',
    );

    const wallet = await client.query<{ id: string }>(
      `INSERT INTO wallet_accounts (buyer_profile_id, balance_amount)
       VALUES ($1, 10000) RETURNING id`,
      [buyer.rows[0].id],
    );
    const entry = await client.query<{ id: string }>(
      `INSERT INTO wallet_ledger_entries
       (wallet_account_id, entry_type, amount_delta, balance_after,
        reference_type, reference_id, idempotency_key)
       VALUES ($1, 'TOP_UP', 10000, 10000, 'test', gen_random_uuid(), 'schema-test')
       RETURNING id`,
      [wallet.rows[0].id],
    );
    await client.query('SAVEPOINT ledger_truncate_check');
    await assert.rejects(
      client.query('TRUNCATE wallet_ledger_entries'),
      /immutable/,
    );
    await client.query('ROLLBACK TO SAVEPOINT ledger_truncate_check');
    await client.query('RELEASE SAVEPOINT ledger_truncate_check');
    await assert.rejects(
      client.query(
        'UPDATE wallet_ledger_entries SET amount_delta = 1 WHERE id = $1',
        [entry.rows[0].id],
      ),
      /immutable/,
    );
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    client.release();
    await pool.end();
  }
}

verify()
  .then(() => console.info('Database verification completed'))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
