import 'dotenv/config';
import assert from 'node:assert/strict';
import { PoolClient, QueryResultRow } from 'pg';
import { DatabaseService } from '../../src/database/database.service';
import { CatalogRepository } from '../../src/modules/catalog/infrastructure/catalog.repository';
import { createDatabasePool } from './connection';

interface CapturedQuery {
  sql: string;
  values: unknown[];
}

function planNodes(node: Record<string, unknown>): string[] {
  const label = [node['Node Type'], node['Index Name']]
    .filter(Boolean)
    .join(':');
  const children = Array.isArray(node.Plans) ? node.Plans : [];
  return [
    label,
    ...children.flatMap((child: Record<string, unknown>) => planNodes(child)),
  ];
}

async function benchmark(client: PoolClient, productCount: number) {
  const capture: CapturedQuery[] = [];
  const database = {
    query: <Row extends QueryResultRow>(sql: string, values: unknown[]) => {
      capture.push({ sql, values });
      return client.query<Row>(sql, values);
    },
  } as DatabaseService;
  const catalog = new CatalogRepository(database);
  const cases = [
    { name: 'newest', input: { sort: 'newest' as const } },
    { name: 'price', input: { sort: 'price_asc' as const } },
    { name: 'search', input: { sort: 'newest' as const, q: 'Kamera' } },
    {
      name: 'rare search',
      input: {
        sort: 'newest' as const,
        q: `Kamera Benchmark ${productCount - (productCount % 10)}`,
      },
    },
  ];

  for (const testCase of cases) {
    const input = { ...testCase.input, limit: 25, cursor: null };
    const start = performance.now();
    const rows = await catalog.list(input);
    const elapsedMs = performance.now() - start;
    assert(rows.length > 0, `${testCase.name}: no products found`);
    const query = capture.pop();
    assert(query);
    const plan = await client.query<{
      'QUERY PLAN': Array<Record<string, unknown>>;
    }>(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query.sql}`, query.values);
    const top = plan.rows[0]['QUERY PLAN'][0];
    console.info(
      JSON.stringify({
        case: testCase.name,
        products: productCount,
        rows: rows.length,
        elapsedMs: Math.round(elapsedMs),
        executionMs: top['Execution Time'],
        nodes: planNodes(top.Plan as Record<string, unknown>),
      }),
    );
  }
}

async function main() {
  const productCount = Number(process.env.CATALOG_BENCH_PRODUCTS ?? '100000');
  if (
    !Number.isInteger(productCount) ||
    productCount < 1000 ||
    productCount > 100000
  ) {
    throw new Error('CATALOG_BENCH_PRODUCTS must be between 1000 and 100000');
  }
  const pool = createDatabasePool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO users (email, name, password_hash)
      SELECT 'catalog-bench-' || g || '@burhanpedia.test',
             'Catalog Benchmark ' || g, 'not-a-real-hash'
      FROM generate_series(1, 10000) g
    `);
    await client.query(`
      INSERT INTO seller_profiles (user_id)
      SELECT id FROM (
        SELECT id FROM users WHERE email LIKE 'catalog-bench-%@burhanpedia.test'
        ORDER BY email LIMIT 1000
      ) benchmark_sellers
    `);
    await client.query(`
      INSERT INTO stores (seller_profile_id, slug, name, status)
      SELECT sp.id, 'catalog-bench-' || row_number() OVER (ORDER BY u.email),
             'Catalog Benchmark Store ' || row_number() OVER (ORDER BY u.email),
             'ACTIVE'
      FROM seller_profiles sp JOIN users u ON u.id = sp.user_id
      WHERE u.email LIKE 'catalog-bench-%@burhanpedia.test'
    `);
    await client.query(
      `
      WITH available_stores AS (
        SELECT array_agg(id ORDER BY slug) AS ids FROM stores
        WHERE slug LIKE 'catalog-bench-%'
      )
      INSERT INTO products (store_id, slug, name, description, status)
      SELECT ids[1 + ((g - 1) % array_length(ids, 1))],
             'catalog-bench-product-' || g,
             CASE WHEN g % 10 = 0 THEN 'Kamera' ELSE 'Produk' END || ' Benchmark ' || g,
             'Produk untuk mengukur query katalog', 'ACTIVE'
      FROM generate_series(1, $1::int) g CROSS JOIN available_stores
    `,
      [productCount],
    );
    await client.query(`
      CREATE TEMP TABLE benchmark_products ON COMMIT DROP AS
      SELECT p.id, row_number() OVER (ORDER BY p.id)::bigint AS n
      FROM products p WHERE p.slug LIKE 'catalog-bench-product-%'
    `);
    await client.query(`
      INSERT INTO product_variants (product_id, sku, name, price_amount)
      SELECT p.id, 'BENCH-' || p.n || '-' || v.n,
             'Varian ' || v.n, 10000 + (p.n % 1000) * 100 + v.n
      FROM benchmark_products p CROSS JOIN generate_series(1, 3) v(n)
    `);
    await client.query(`
      INSERT INTO inventories (variant_id, on_hand)
      SELECT v.id, 10 FROM product_variants v
      JOIN benchmark_products p ON p.id = v.product_id
    `);
    await client.query('ANALYZE products');
    await client.query('ANALYZE product_variants');
    await client.query('ANALYZE inventories');
    await benchmark(client, productCount);
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
