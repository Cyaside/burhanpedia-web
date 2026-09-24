-- Reproducible volume seed for demos and performance rehearsals.
-- Run only after the lightweight development seed.

WITH seller_numbers AS (
  SELECT generate_series(1, 25) AS n
)
INSERT INTO users (id, email, name, password_hash, email_verified_at)
SELECT ('60000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'seller' || lpad(n::text, 2, '0') || '@demo.burhanpedia.local',
       'Seller Demo ' || lpad(n::text, 2, '0'),
       '$argon2id$v=19$m=65536,p=4,t=3$suQmAoSiSoo/+vGoxeq0yQ$1z+74owouG/3hq49gHghnjWZsoYCcy0Q2bYGHdnT1Os',
       '2026-07-23T13:00:00Z'
FROM seller_numbers
ON CONFLICT (id) DO NOTHING;

WITH seller_numbers AS (SELECT generate_series(1, 25) AS n)
INSERT INTO user_roles (user_id, role, status)
SELECT ('60000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'SELLER', 'ACTIVE'
FROM seller_numbers
ON CONFLICT (user_id, role) DO NOTHING;

WITH seller_numbers AS (SELECT generate_series(1, 25) AS n)
INSERT INTO seller_profiles (id, user_id)
SELECT ('61000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('60000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
FROM seller_numbers
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;

WITH seller_numbers AS (SELECT generate_series(1, 25) AS n)
INSERT INTO stores (id, seller_profile_id, slug, name, description, status)
SELECT ('62000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('61000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'toko-demo-' || lpad(n::text, 2, '0'),
       (ARRAY[
         'Arunika', 'Bumi', 'Cakrawala', 'Dahayu', 'Elang',
         'Flora', 'Griya', 'Harmoni', 'Indigo', 'Jelita',
         'Karya', 'Langit', 'Mentari', 'Nirmala', 'Oase',
         'Pijar', 'Rona', 'Senja', 'Teras', 'Utama',
         'Vista', 'Warna', 'Xenia', 'Yasa', 'Zamrud'
       ])[n] || ' Mart',
       'Toko demo terverifikasi dengan katalog lintas kategori untuk pengujian Burhanpedia.',
       'ACTIVE'
FROM seller_numbers
ON CONFLICT (id) DO UPDATE SET
  seller_profile_id = EXCLUDED.seller_profile_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'ACTIVE';

WITH product_numbers AS (
  SELECT g AS n,
         ((g - 1) % 25) + 1 AS seller_n,
         ((g - 1) % 5) + 1 AS category_n
  FROM generate_series(1, 295) AS g
)
INSERT INTO products
  (id, store_id, category_id, slug, name, description, status, created_at)
SELECT ('70000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('62000000-0000-4000-8000-' || lpad(seller_n::text, 12, '0'))::uuid,
       ('10000000-0000-4000-8000-' || lpad(category_n::text, 12, '0'))::uuid,
       'produk-demo-' || lpad(n::text, 3, '0'),
       CASE category_n
         WHEN 1 THEN 'Perangkat Elektronik Seri ' || lpad(n::text, 3, '0')
         WHEN 2 THEN 'Fashion Harian Seri ' || lpad(n::text, 3, '0')
         WHEN 3 THEN 'Perlengkapan Rumah Seri ' || lpad(n::text, 3, '0')
         WHEN 4 THEN 'Koleksi Hobi Seri ' || lpad(n::text, 3, '0')
         ELSE 'Perawatan Sehat Seri ' || lpad(n::text, 3, '0')
       END,
       'Produk demo dengan harga, stok, kategori, dan gambar deterministik untuk rehearsal katalog.',
       'ACTIVE',
       '2026-07-01T12:00:00Z'::timestamptz + n * interval '17 minutes'
FROM product_numbers
ON CONFLICT (id) DO UPDATE SET
  store_id = EXCLUDED.store_id,
  category_id = EXCLUDED.category_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'ACTIVE';

WITH product_numbers AS (
  SELECT g AS n, ((g - 1) % 5) + 1 AS category_n
  FROM generate_series(1, 295) AS g
)
INSERT INTO product_variants
  (id, product_id, sku, name, attributes, price_amount, compare_at_amount, status)
SELECT ('71000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('70000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'DEMO-' || lpad(n::text, 4, '0'),
       CASE WHEN n % 3 = 0 THEN 'Premium' ELSE 'Standar' END,
       jsonb_build_object('series', lpad(n::text, 3, '0')),
       49000 + category_n * 75000 + (n % 20) * 12500,
       74000 + category_n * 75000 + (n % 20) * 12500,
       'ACTIVE'
FROM product_numbers
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  attributes = EXCLUDED.attributes,
  price_amount = EXCLUDED.price_amount,
  compare_at_amount = EXCLUDED.compare_at_amount,
  status = 'ACTIVE';

WITH product_numbers AS (SELECT generate_series(1, 295) AS n)
INSERT INTO inventories (variant_id, on_hand, reserved)
SELECT ('71000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       15 + (n % 70), 0
FROM product_numbers
ON CONFLICT (variant_id) DO UPDATE SET
  on_hand = EXCLUDED.on_hand,
  reserved = LEAST(inventories.reserved, EXCLUDED.on_hand);

-- A few catalog products demonstrate a real choice of price, stock, and variant.
WITH product_numbers AS (SELECT generate_series(1, 10) AS n)
INSERT INTO product_variants
  (id, product_id, sku, name, attributes, price_amount, compare_at_amount, status)
SELECT ('71000000-0000-4000-8000-' || lpad((1000 + n)::text, 12, '0'))::uuid,
       ('70000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'DEMO-' || lpad(n::text, 4, '0') || '-PLUS',
       'Paket Plus',
       jsonb_build_object('paket', 'Plus', 'seri', lpad(n::text, 3, '0')),
       99000 + (((n - 1) % 5) + 1) * 75000 + (n % 20) * 12500,
       124000 + (((n - 1) % 5) + 1) * 75000 + (n % 20) * 12500,
       'ACTIVE'
FROM product_numbers
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  attributes = EXCLUDED.attributes,
  price_amount = EXCLUDED.price_amount,
  compare_at_amount = EXCLUDED.compare_at_amount,
  status = 'ACTIVE';

WITH product_numbers AS (SELECT generate_series(1, 10) AS n)
INSERT INTO inventories (variant_id, on_hand, reserved)
SELECT ('71000000-0000-4000-8000-' || lpad((1000 + n)::text, 12, '0'))::uuid,
       8 + n, 0
FROM product_numbers
ON CONFLICT (variant_id) DO UPDATE SET
  on_hand = EXCLUDED.on_hand,
  reserved = LEAST(inventories.reserved, EXCLUDED.on_hand);

WITH product_numbers AS (
  SELECT g AS n, ((g - 1) % 5) + 1 AS category_n
  FROM generate_series(1, 295) AS g
)
INSERT INTO product_images
  (id, product_id, storage_key, public_url, alt_text, position)
SELECT ('72000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('70000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'demo/catalog/product-' || lpad(n::text, 3, '0'),
       (ARRAY[
         'https://images.unsplash.com/photo-1562560017-e008835e92bc?auto=format&fit=crop&w=900&q=82',
         'https://images.unsplash.com/photo-1721152531086-70a0d0bb33f9?auto=format&fit=crop&w=900&q=82',
         'https://images.unsplash.com/photo-1556910602-38f53e68e15d?auto=format&fit=crop&w=900&q=82',
         'https://images.unsplash.com/photo-1771440047898-a83cc89b4fe2?auto=format&fit=crop&w=900&q=82',
         'https://images.unsplash.com/photo-1696861286643-341a8d7a79e9?auto=format&fit=crop&w=900&q=82'
       ])[category_n],
       CASE category_n
         WHEN 1 THEN 'Perangkat elektronik pada katalog demo'
         WHEN 2 THEN 'Produk fashion pada katalog demo'
         WHEN 3 THEN 'Perlengkapan rumah pada katalog demo'
         WHEN 4 THEN 'Peralatan hobi pada katalog demo'
         ELSE 'Produk kesehatan pada katalog demo'
       END,
       0
FROM product_numbers
ON CONFLICT (id) DO UPDATE SET
  public_url = EXCLUDED.public_url,
  alt_text = EXCLUDED.alt_text,
  position = EXCLUDED.position;

WITH buyer_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO users (id, email, name, password_hash, email_verified_at)
SELECT ('63000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'buyer' || lpad(n::text, 2, '0') || '@demo.burhanpedia.local',
       'Buyer Demo ' || lpad(n::text, 2, '0'),
       '$argon2id$v=19$m=65536,p=4,t=3$suQmAoSiSoo/+vGoxeq0yQ$1z+74owouG/3hq49gHghnjWZsoYCcy0Q2bYGHdnT1Os',
       '2026-07-23T13:00:00Z'
FROM buyer_numbers
ON CONFLICT (id) DO NOTHING;

WITH buyer_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO user_roles (user_id, role, status)
SELECT ('63000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'BUYER', 'ACTIVE'
FROM buyer_numbers
ON CONFLICT (user_id, role) DO NOTHING;

WITH buyer_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO buyer_profiles (id, user_id)
SELECT ('63100000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('63000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
FROM buyer_numbers
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;

WITH buyer_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO addresses
  (id, buyer_profile_id, label, recipient_name, phone, line1, city, province, postal_code, is_default)
SELECT ('63200000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('63100000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'Rumah', 'Buyer Demo ' || lpad(n::text, 2, '0'),
       '08123456' || lpad(n::text, 4, '0'),
       'Jalan Demo Burhan No. ' || n, 'Bandung', 'Jawa Barat', '40123', true
FROM buyer_numbers
ON CONFLICT (id) DO UPDATE SET
  recipient_name = EXCLUDED.recipient_name,
  phone = EXCLUDED.phone,
  line1 = EXCLUDED.line1;

WITH buyer_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO wallet_accounts (id, buyer_profile_id, balance_amount)
SELECT ('63300000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('63100000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       5000000
FROM buyer_numbers
ON CONFLICT (id) DO UPDATE SET balance_amount = EXCLUDED.balance_amount;

WITH driver_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO users (id, email, name, password_hash, email_verified_at)
SELECT ('64000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'driver' || lpad(n::text, 2, '0') || '@demo.burhanpedia.local',
       'Driver Demo ' || lpad(n::text, 2, '0'),
       '$argon2id$v=19$m=65536,p=4,t=3$suQmAoSiSoo/+vGoxeq0yQ$1z+74owouG/3hq49gHghnjWZsoYCcy0Q2bYGHdnT1Os',
       '2026-07-23T13:00:00Z'
FROM driver_numbers
ON CONFLICT (id) DO NOTHING;

WITH driver_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO user_roles (user_id, role, status)
SELECT ('64000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'DRIVER', 'ACTIVE'
FROM driver_numbers
ON CONFLICT (user_id, role) DO NOTHING;

WITH driver_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO driver_profiles (id, user_id, is_available)
SELECT ('64100000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('64000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       n % 3 <> 0
FROM driver_numbers
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_available = EXCLUDED.is_available;

WITH driver_numbers AS (SELECT generate_series(1, 29) AS n)
INSERT INTO driver_wallet_accounts (id, driver_profile_id)
SELECT ('64200000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('64100000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
FROM driver_numbers
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name, password_hash, email_verified_at)
VALUES (
  '65000000-0000-4000-8000-000000000001',
  'admin@demo.burhanpedia.local', 'Admin Demo',
  'PENDING_DEMO_ADMIN_CREDENTIAL',
  '2026-07-23T13:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status)
VALUES ('65000000-0000-4000-8000-000000000001', 'ADMIN', 'ACTIVE')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO admin_profiles (id, user_id)
VALUES (
  '65100000-0000-4000-8000-000000000001',
  '65000000-0000-4000-8000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;
