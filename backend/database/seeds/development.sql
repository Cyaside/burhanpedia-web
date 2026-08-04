INSERT INTO categories (id, slug, name, sort_order)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'elektronik', 'Elektronik', 10),
  ('10000000-0000-4000-8000-000000000002', 'fashion', 'Fashion', 20),
  ('10000000-0000-4000-8000-000000000003', 'rumah-tangga', 'Rumah Tangga', 30),
  ('10000000-0000-4000-8000-000000000004', 'hobi', 'Hobi & Koleksi', 40),
  ('10000000-0000-4000-8000-000000000005', 'kesehatan', 'Kesehatan', 50)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

INSERT INTO users (id, email, name, password_hash, email_verified_at)
VALUES (
  '20000000-0000-4000-8000-000000000001',
  'demo.seller@burhanpedia.local',
  'Burhanpedia Demo Seller',
  '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg',
  '2026-07-23T13:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  status = 'ACTIVE',
  email_verified_at = EXCLUDED.email_verified_at;

INSERT INTO user_roles (user_id, role, status)
VALUES ('20000000-0000-4000-8000-000000000001', 'SELLER', 'ACTIVE')
ON CONFLICT (user_id, role) DO UPDATE SET status = 'ACTIVE';

INSERT INTO seller_profiles (id, user_id)
VALUES (
  '21000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;

INSERT INTO stores (id, seller_profile_id, slug, name, description, status)
VALUES (
  '22000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  'toko-burhan-pilihan',
  'Toko Burhan Pilihan',
  'Etalase demo berisi kebutuhan pilihan dari beberapa kategori.',
  'ACTIVE'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'ACTIVE';

INSERT INTO products
  (id, store_id, category_id, slug, name, description, status, rating_average, rating_count, created_at)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'headphone-studio-monitor-x1',
    'Headphone Studio Monitor X1',
    'Headphone over-ear untuk mendengarkan musik dan bekerja dengan bantalan yang nyaman.',
    'ACTIVE', 4.80, 128, '2026-07-31T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'paket-fashion-netral',
    'Paket Fashion Netral 3 Pcs',
    'Padu padan pakaian bernuansa netral untuk gaya kasual sehari-hari.',
    'ACTIVE', 4.60, 74, '2026-07-30T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'set-peralatan-masak-enamel',
    'Set Peralatan Masak Enamel',
    'Set peralatan masak untuk dapur rumah dengan desain sederhana dan mudah dirawat.',
    'ACTIVE', 4.90, 96, '2026-07-29T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000004',
    'kamera-compact-classic',
    'Kamera Compact Classic',
    'Kamera compact bergaya klasik untuk dokumentasi perjalanan dan aktivitas kreatif.',
    'ACTIVE', 4.70, 51, '2026-07-28T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000005',
    'paket-perawatan-diri-natural',
    'Paket Perawatan Diri Natural',
    'Rangkaian perawatan diri harian dalam satu paket praktis.',
    'ACTIVE', 4.85, 83, '2026-07-27T12:45:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'ACTIVE',
  rating_average = EXCLUDED.rating_average,
  rating_count = EXCLUDED.rating_count;

INSERT INTO product_variants
  (id, product_id, sku, name, attributes, price_amount, compare_at_amount, status)
VALUES
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'DEMO-AUDIO-X1', 'Hitam', '{"color":"Hitam"}', 899000, 1099000, 'ACTIVE'),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'DEMO-FASHION-3PCS', 'Ukuran M', '{"size":"M"}', 349000, 429000, 'ACTIVE'),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'DEMO-HOME-ENAMEL', 'Set 5 Pcs', '{"set":"5 pcs"}', 579000, 699000, 'ACTIVE'),
  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'DEMO-CAMERA-CLASSIC', 'Hitam', '{"color":"Hitam"}', 4299000, 4699000, 'ACTIVE'),
  ('31000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', 'DEMO-CARE-NATURAL', 'Set Lengkap', '{"set":"3 produk"}', 289000, 329000, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  attributes = EXCLUDED.attributes,
  price_amount = EXCLUDED.price_amount,
  compare_at_amount = EXCLUDED.compare_at_amount,
  status = 'ACTIVE';

INSERT INTO inventories (variant_id, on_hand, reserved)
VALUES
  ('31000000-0000-4000-8000-000000000001', 38, 0),
  ('31000000-0000-4000-8000-000000000002', 52, 0),
  ('31000000-0000-4000-8000-000000000003', 24, 0),
  ('31000000-0000-4000-8000-000000000004', 12, 0),
  ('31000000-0000-4000-8000-000000000005', 41, 0)
ON CONFLICT (variant_id) DO UPDATE SET
  on_hand = EXCLUDED.on_hand,
  reserved = LEAST(inventories.reserved, EXCLUDED.on_hand);

INSERT INTO product_images (id, product_id, storage_key, public_url, alt_text, position)
VALUES
  (
    '32000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'demo/unsplash/headphone-studio-monitor-x1',
    'https://images.unsplash.com/photo-1737885197905-5bb7251b267e?auto=format&fit=crop&w=1200&q=82',
    'Headphone studio berwarna hitam di depan layar komputer', 0
  ),
  (
    '32000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'demo/unsplash/paket-fashion-netral',
    'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?auto=format&fit=crop&w=1200&q=82',
    'Pakaian bernuansa netral tersusun pada rak butik', 0
  ),
  (
    '32000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    'demo/unsplash/set-peralatan-masak-enamel',
    'https://images.unsplash.com/photo-1556910602-38f53e68e15d?auto=format&fit=crop&w=1200&q=82',
    'Set peralatan masak tersusun di rak dapur', 0
  ),
  (
    '32000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000004',
    'demo/unsplash/kamera-compact-classic',
    'https://images.unsplash.com/photo-1674615420480-1a8b651aeb05?auto=format&fit=crop&w=1200&q=82',
    'Kamera compact hitam dengan perlengkapan kreatif di atas meja', 0
  ),
  (
    '32000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000005',
    'demo/unsplash/paket-perawatan-diri-natural',
    'https://images.unsplash.com/photo-1768483018807-bd0b9ab86539?auto=format&fit=crop&w=1200&q=82',
    'Tiga produk perawatan diri tersusun di atas rak', 0
  )
ON CONFLICT (id) DO UPDATE SET
  public_url = EXCLUDED.public_url,
  alt_text = EXCLUDED.alt_text,
  position = EXCLUDED.position;
