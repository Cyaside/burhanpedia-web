import assert from 'node:assert/strict';
import { createDatabasePool } from './connection';

async function verifyDemo(): Promise<void> {
  const pool = createDatabasePool();
  try {
    const result = await pool.query<{
      sellers: string;
      stores: string;
      buyers: string;
      drivers: string;
      admins: string;
      products: string;
      variants: string;
      images: string;
    }>(`SELECT
      (SELECT count(*) FROM users
       WHERE email LIKE 'seller%@demo.burhanpedia.local'
          OR id::text LIKE '20000000-0000-4000-8000-00000000000_')::text AS sellers,
      (SELECT count(*) FROM stores
       WHERE slug LIKE 'toko-demo-%'
          OR id::text LIKE '22000000-0000-4000-8000-00000000000_')::text AS stores,
      (SELECT count(*) FROM users
       WHERE email LIKE 'buyer%@demo.burhanpedia.local'
          OR email = 'buyer.demo@burhanpedia.local')::text AS buyers,
      (SELECT count(*) FROM users
       WHERE email LIKE 'driver%@demo.burhanpedia.local'
          OR email = 'driver.demo@burhanpedia.local')::text AS drivers,
      (SELECT count(*) FROM users
       WHERE email = 'admin@demo.burhanpedia.local')::text AS admins,
      (SELECT count(*) FROM products
       WHERE slug LIKE 'produk-demo-%'
          OR id::text LIKE '30000000-0000-4000-8000-00000000000_')::text AS products,
      (SELECT count(*) FROM product_variants
       WHERE sku LIKE 'DEMO-%')::text AS variants,
      (SELECT count(*) FROM product_images
       WHERE storage_key LIKE 'demo/%')::text AS images`);
    const counts = result.rows[0];
    assert.equal(counts.sellers, '30');
    assert.equal(counts.stores, '30');
    assert.equal(counts.buyers, '30');
    assert.equal(counts.drivers, '30');
    assert.equal(counts.admins, '1');
    assert.equal(counts.products, '300');
    assert.equal(counts.variants, '310');
    assert.equal(counts.images, '300');
    console.info('Demo dataset verified', counts);
  } finally {
    await pool.end();
  }
}

verifyDemo().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
