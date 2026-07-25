CREATE TYPE cart_status AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED');
CREATE TYPE ledger_entry_type AS ENUM ('TOP_UP', 'PAYMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE promotion_kind AS ENUM ('FIXED', 'PERCENTAGE', 'FREE_SHIPPING');
CREATE TYPE order_status AS ENUM (
  'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_FOR_DELIVERY',
  'IN_DELIVERY', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED'
);
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  status cart_status NOT NULL DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX carts_one_active_per_buyer_idx
  ON carts (buyer_profile_id) WHERE status = 'ACTIVE';
CREATE TRIGGER carts_set_updated_at
BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_variant_unique UNIQUE (cart_id, variant_id)
);

CREATE INDEX cart_items_cart_idx ON cart_items (cart_id, created_at, id);
CREATE TRIGGER cart_items_set_updated_at
BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id UUID NOT NULL UNIQUE REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  currency CHAR(3) NOT NULL DEFAULT 'IDR' CHECK (currency = upper(currency)),
  balance_amount BIGINT NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER wallet_accounts_set_updated_at
BEFORE UPDATE ON wallet_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE wallet_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_account_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE RESTRICT,
  entry_type ledger_entry_type NOT NULL,
  amount_delta BIGINT NOT NULL CHECK (amount_delta <> 0),
  balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wallet_ledger_idempotency_unique UNIQUE (wallet_account_id, idempotency_key)
);

CREATE INDEX wallet_ledger_history_idx
  ON wallet_ledger_entries (wallet_account_id, created_at DESC, id DESC);
CREATE INDEX wallet_ledger_reference_idx
  ON wallet_ledger_entries (reference_type, reference_id);

CREATE OR REPLACE FUNCTION prevent_wallet_ledger_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'wallet ledger entries are immutable';
END;
$$;

CREATE TRIGGER wallet_ledger_no_update
BEFORE UPDATE OR DELETE ON wallet_ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_wallet_ledger_mutation();

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  kind promotion_kind NOT NULL,
  value_amount BIGINT,
  value_percent NUMERIC(5,2),
  maximum_discount_amount BIGINT,
  minimum_subtotal_amount BIGINT NOT NULL DEFAULT 0 CHECK (minimum_subtotal_amount >= 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  per_buyer_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_buyer_limit > 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promotions_code_normalized CHECK (code = upper(btrim(code))),
  CONSTRAINT promotions_code_unique UNIQUE (code),
  CONSTRAINT promotions_window_valid CHECK (ends_at > starts_at),
  CONSTRAINT promotions_usage_valid CHECK (usage_limit IS NULL OR usage_count <= usage_limit),
  CONSTRAINT promotions_value_valid CHECK (
    (kind = 'FIXED' AND value_amount > 0 AND value_percent IS NULL) OR
    (kind = 'PERCENTAGE' AND value_percent > 0 AND value_percent <= 100 AND value_amount IS NULL) OR
    (kind = 'FREE_SHIPPING' AND value_amount IS NULL AND value_percent IS NULL)
  )
);

CREATE INDEX promotions_active_window_idx
  ON promotions (starts_at, ends_at) WHERE is_active;
CREATE INDEX promotions_store_active_idx
  ON promotions (store_id, ends_at) WHERE is_active;
CREATE TRIGGER promotions_set_updated_at
BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE checkout_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  subtotal_amount BIGINT NOT NULL CHECK (subtotal_amount >= 0),
  discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_amount BIGINT NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
  request_fingerprint CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT checkout_group_idempotency_unique UNIQUE (buyer_profile_id, idempotency_key),
  CONSTRAINT checkout_group_total_valid CHECK (
    total_amount = subtotal_amount - discount_amount + shipping_amount
    AND discount_amount <= subtotal_amount
  )
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_group_id UUID NOT NULL REFERENCES checkout_groups(id) ON DELETE RESTRICT,
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  subtotal_amount BIGINT NOT NULL CHECK (subtotal_amount >= 0),
  discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_amount BIGINT NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_group_store_unique UNIQUE (checkout_group_id, store_id),
  CONSTRAINT orders_total_valid CHECK (
    total_amount = subtotal_amount - discount_amount + shipping_amount
    AND discount_amount <= subtotal_amount
  )
);

CREATE INDEX orders_buyer_history_idx
  ON orders (buyer_profile_id, placed_at DESC, id DESC);
CREATE INDEX orders_store_queue_idx
  ON orders (store_id, status, placed_at, id);
CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  unit_price_amount BIGINT NOT NULL CHECK (unit_price_amount >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_amount BIGINT NOT NULL CHECK (line_total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT order_items_variant_unique UNIQUE (order_id, variant_id),
  CONSTRAINT order_items_total_valid CHECK (line_total_amount = unit_price_amount * quantity)
);

CREATE INDEX order_items_order_idx ON order_items (order_id, id);

CREATE TABLE order_addresses (
  order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE RESTRICT,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  from_status order_status,
  to_status order_status NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX order_status_history_order_idx
  ON order_status_history (order_id, created_at, id);

CREATE TABLE promotion_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  discount_amount BIGINT NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX promotion_redemptions_buyer_idx
  ON promotion_redemptions (promotion_id, buyer_profile_id, created_at DESC);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_group_id UUID NOT NULL UNIQUE REFERENCES checkout_groups(id) ON DELETE RESTRICT,
  wallet_account_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE RESTRICT,
  status payment_status NOT NULL DEFAULT 'PENDING',
  amount BIGINT NOT NULL CHECK (amount > 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  failure_code TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT refunds_order_unique UNIQUE (payment_id, order_id)
);

CREATE TABLE inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status reservation_status NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_reservation_expiry_valid CHECK (expires_at > created_at)
);

CREATE INDEX inventory_reservations_active_expiry_idx
  ON inventory_reservations (expires_at, id) WHERE status = 'ACTIVE';
CREATE INDEX inventory_reservations_variant_idx
  ON inventory_reservations (variant_id, status, created_at);
CREATE TRIGGER inventory_reservations_set_updated_at
BEFORE UPDATE ON inventory_reservations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
