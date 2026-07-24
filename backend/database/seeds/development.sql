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
