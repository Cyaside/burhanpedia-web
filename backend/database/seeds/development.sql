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
VALUES
  ('20000000-0000-4000-8000-000000000001', 'nada@burhanpedia.local', 'Nada Lokal', '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg', '2026-07-23T13:00:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'lemari@burhanpedia.local', 'Lemari Sore', '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg', '2026-07-23T13:00:00Z'),
  ('20000000-0000-4000-8000-000000000003', 'dapur@burhanpedia.local', 'Dapur Nusa', '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg', '2026-07-23T13:00:00Z'),
  ('20000000-0000-4000-8000-000000000004', 'kreasi@burhanpedia.local', 'Ruang Kreasi', '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg', '2026-07-23T13:00:00Z'),
  ('20000000-0000-4000-8000-000000000005', 'sehat@burhanpedia.local', 'Sehat Harian', '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg', '2026-07-23T13:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'SELLER', 'ACTIVE'),
  ('20000000-0000-4000-8000-000000000002', 'SELLER', 'ACTIVE'),
  ('20000000-0000-4000-8000-000000000003', 'SELLER', 'ACTIVE'),
  ('20000000-0000-4000-8000-000000000004', 'SELLER', 'ACTIVE'),
  ('20000000-0000-4000-8000-000000000005', 'SELLER', 'ACTIVE')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO seller_profiles (id, user_id)
VALUES
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002'),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003'),
  ('21000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004'),
  ('21000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000005')
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;

INSERT INTO stores
  (id, seller_profile_id, slug, name, description, status)
VALUES
  (
    '22000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001',
    'nada-lokal', 'Nada Lokal', 'Perangkat audio untuk bekerja, bermain, dan menikmati musik.',
    'ACTIVE'
  ),
  (
    '22000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000002',
    'lemari-sore', 'Lemari Sore', 'Pilihan pakaian kasual dengan warna yang mudah dipadukan.',
    'ACTIVE'
  ),
  (
    '22000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000003',
    'dapur-nusa', 'Dapur Nusa', 'Peralatan memasak praktis untuk dapur sehari-hari.',
    'ACTIVE'
  ),
  (
    '22000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000004',
    'ruang-kreasi', 'Ruang Kreasi', 'Perlengkapan hobi dan alat untuk proyek kreatif.',
    'ACTIVE'
  ),
  (
    '22000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000005',
    'sehat-harian', 'Sehat Harian', 'Pilihan perawatan diri untuk rutinitas harian.',
    'ACTIVE'
  )
ON CONFLICT (id) DO UPDATE SET
  seller_profile_id = EXCLUDED.seller_profile_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo_storage_key = NULL,
  logo_url = NULL,
  logo_alt_text = NULL,
  status = 'ACTIVE';

INSERT INTO products
  (id, store_id, category_id, slug, name, description, status, created_at)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'headphone-studio-monitor-x1',
    'Headphone Studio Monitor X1',
    'Headphone over-ear untuk mendengarkan musik dan bekerja dengan bantalan yang nyaman.',
    'ACTIVE', '2026-07-31T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '22000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'paket-fashion-netral',
    'Paket Fashion Netral 3 Pcs',
    'Padu padan pakaian bernuansa netral untuk gaya kasual sehari-hari.',
    'ACTIVE', '2026-07-30T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '22000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'set-peralatan-masak-enamel',
    'Set Peralatan Masak Enamel',
    'Set peralatan masak untuk dapur rumah dengan desain sederhana dan mudah dirawat.',
    'ACTIVE', '2026-07-29T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '22000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004',
    'kamera-compact-classic',
    'Kamera Compact Classic',
    'Kamera compact bergaya klasik untuk dokumentasi perjalanan dan aktivitas kreatif.',
    'ACTIVE', '2026-07-28T12:45:00Z'
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '22000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000005',
    'paket-perawatan-diri-natural',
    'Paket Perawatan Diri Natural',
    'Rangkaian perawatan diri harian dalam satu paket praktis.',
    'ACTIVE', '2026-07-27T12:45:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  store_id = EXCLUDED.store_id,
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'ACTIVE',
  rating_average = 0,
  rating_count = 0,
  rating_sum = 0;

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

INSERT INTO users (id, email, name, password_hash, email_verified_at)
VALUES
  (
    '20000000-0000-4000-8000-000000000010',
    'buyer.demo@burhanpedia.local',
    'Ayu Pembeli',
    '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg',
    '2026-07-23T13:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000011',
    'driver.demo@burhanpedia.local',
    'Bima Pengemudi',
    '$argon2id$v=19$m=19456,p=1,t=2$Nt7fk4tUtkawOb8yiLy/Ww$Gy1HJf6hptjmSRwN7l8Vcqkjo5XXus6jXeef+FuVEOg',
    '2026-07-23T13:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status)
VALUES
  ('20000000-0000-4000-8000-000000000010', 'BUYER', 'ACTIVE'),
  ('20000000-0000-4000-8000-000000000011', 'DRIVER', 'ACTIVE')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO buyer_profiles (id, user_id)
VALUES ('21000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000010')
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;

INSERT INTO driver_profiles (id, user_id, is_available)
VALUES ('21000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000011', false)
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, is_available = false;

INSERT INTO carts (id, buyer_profile_id, status)
VALUES ('40000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000010', 'CHECKED_OUT')
ON CONFLICT (id) DO UPDATE SET status = 'CHECKED_OUT';

INSERT INTO checkout_groups
  (id, buyer_profile_id, cart_id, idempotency_key, subtotal_amount,
   discount_amount, shipping_amount, total_amount, request_fingerprint)
VALUES
  (
    '41000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000010',
    '40000000-0000-4000-8000-000000000001',
    'development-verified-reviews', 6415000, 0, 0, 6415000,
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders
  (id, checkout_group_id, buyer_profile_id, store_id, order_number, status,
   subtotal_amount, discount_amount, shipping_amount, total_amount,
   placed_at, completed_at)
VALUES
  ('42000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000010', '22000000-0000-4000-8000-000000000001', 'BP-DEMO-0001', 'COMPLETED', 899000, 0, 0, 899000, '2026-07-24T12:10:00Z', '2026-07-26T13:20:00Z'),
  ('42000000-0000-4000-8000-000000000002', '41000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000010', '22000000-0000-4000-8000-000000000002', 'BP-DEMO-0002', 'COMPLETED', 349000, 0, 0, 349000, '2026-07-24T12:10:00Z', '2026-07-26T13:25:00Z'),
  ('42000000-0000-4000-8000-000000000003', '41000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000010', '22000000-0000-4000-8000-000000000003', 'BP-DEMO-0003', 'COMPLETED', 579000, 0, 0, 579000, '2026-07-24T12:10:00Z', '2026-07-26T13:31:00Z'),
  ('42000000-0000-4000-8000-000000000004', '41000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000010', '22000000-0000-4000-8000-000000000004', 'BP-DEMO-0004', 'COMPLETED', 4299000, 0, 0, 4299000, '2026-07-24T12:10:00Z', '2026-07-26T13:38:00Z'),
  ('42000000-0000-4000-8000-000000000005', '41000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000010', '22000000-0000-4000-8000-000000000005', 'BP-DEMO-0005', 'COMPLETED', 289000, 0, 0, 289000, '2026-07-24T12:10:00Z', '2026-07-26T13:44:00Z')
ON CONFLICT (id) DO UPDATE SET status = 'COMPLETED', completed_at = EXCLUDED.completed_at;

INSERT INTO order_items
  (id, order_id, variant_id, product_name, variant_name, sku, attributes,
   unit_price_amount, quantity, line_total_amount)
VALUES
  ('43000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', 'Headphone Studio Monitor X1', 'Hitam', 'DEMO-AUDIO-X1', '{"color":"Hitam"}', 899000, 1, 899000),
  ('43000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000002', 'Paket Fashion Netral 3 Pcs', 'Ukuran M', 'DEMO-FASHION-3PCS', '{"size":"M"}', 349000, 1, 349000),
  ('43000000-0000-4000-8000-000000000003', '42000000-0000-4000-8000-000000000003', '31000000-0000-4000-8000-000000000003', 'Set Peralatan Masak Enamel', 'Set 5 Pcs', 'DEMO-HOME-ENAMEL', '{"set":"5 pcs"}', 579000, 1, 579000),
  ('43000000-0000-4000-8000-000000000004', '42000000-0000-4000-8000-000000000004', '31000000-0000-4000-8000-000000000004', 'Kamera Compact Classic', 'Hitam', 'DEMO-CAMERA-CLASSIC', '{"color":"Hitam"}', 4299000, 1, 4299000),
  ('43000000-0000-4000-8000-000000000005', '42000000-0000-4000-8000-000000000005', '31000000-0000-4000-8000-000000000005', 'Paket Perawatan Diri Natural', 'Set Lengkap', 'DEMO-CARE-NATURAL', '{"set":"3 produk"}', 289000, 1, 289000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO deliveries
  (id, order_id, driver_profile_id, method, status, fee_amount,
   pickup_deadline_at, delivery_deadline_at, claimed_at, picked_up_at, delivered_at)
VALUES
  ('44000000-0000-4000-8000-000000000001', '42000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000011', 'REGULAR', 'DELIVERED', 0, '2026-07-25T12:00:00Z', '2026-07-27T12:00:00Z', '2026-07-24T13:00:00Z', '2026-07-25T09:00:00Z', '2026-07-26T13:20:00Z'),
  ('44000000-0000-4000-8000-000000000002', '42000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000011', 'REGULAR', 'DELIVERED', 0, '2026-07-25T12:00:00Z', '2026-07-27T12:00:00Z', '2026-07-24T13:00:00Z', '2026-07-25T09:00:00Z', '2026-07-26T13:25:00Z'),
  ('44000000-0000-4000-8000-000000000003', '42000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000011', 'REGULAR', 'DELIVERED', 0, '2026-07-25T12:00:00Z', '2026-07-27T12:00:00Z', '2026-07-24T13:00:00Z', '2026-07-25T09:00:00Z', '2026-07-26T13:31:00Z'),
  ('44000000-0000-4000-8000-000000000004', '42000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000011', 'REGULAR', 'DELIVERED', 0, '2026-07-25T12:00:00Z', '2026-07-27T12:00:00Z', '2026-07-24T13:00:00Z', '2026-07-25T09:00:00Z', '2026-07-26T13:38:00Z'),
  ('44000000-0000-4000-8000-000000000005', '42000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000011', 'REGULAR', 'DELIVERED', 0, '2026-07-25T12:00:00Z', '2026-07-27T12:00:00Z', '2026-07-24T13:00:00Z', '2026-07-25T09:00:00Z', '2026-07-26T13:44:00Z')
ON CONFLICT (id) DO UPDATE SET status = 'DELIVERED', delivered_at = EXCLUDED.delivered_at;

INSERT INTO product_reviews
  (id, product_id, buyer_profile_id, order_item_id, rating, comment, created_at)
VALUES
  ('45000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000010', '43000000-0000-4000-8000-000000000001', 5, 'Nyaman dipakai bekerja dan suara tetap jelas.', '2026-07-27T13:10:00Z'),
  ('45000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000010', '43000000-0000-4000-8000-000000000002', 4, 'Warna sesuai foto dan bahannya nyaman.', '2026-07-27T13:14:00Z'),
  ('45000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '21000000-0000-4000-8000-000000000010', '43000000-0000-4000-8000-000000000003', 5, 'Set lengkap dan mudah dibersihkan setelah dipakai.', '2026-07-27T13:18:00Z'),
  ('45000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', '21000000-0000-4000-8000-000000000010', '43000000-0000-4000-8000-000000000004', 4, 'Ringkas untuk dibawa dan hasil fotonya konsisten.', '2026-07-27T13:22:00Z'),
  ('45000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', '21000000-0000-4000-8000-000000000010', '43000000-0000-4000-8000-000000000005', 5, 'Paket datang rapi dan produknya nyaman digunakan.', '2026-07-27T13:26:00Z')
ON CONFLICT (order_item_id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment;
