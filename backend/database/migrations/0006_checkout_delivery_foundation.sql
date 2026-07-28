CREATE TYPE order_status_v2 AS ENUM (
  'PACKING', 'AWAITING_DRIVER', 'DRIVER_ASSIGNED', 'IN_TRANSIT',
  'DELIVERED', 'COMPLETED', 'CANCELED', 'RETURNED', 'REFUNDED'
);

ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE order_status_v2 USING (
  CASE status::text
    WHEN 'PENDING_PAYMENT' THEN 'PACKING'
    WHEN 'PAID' THEN 'PACKING'
    WHEN 'PROCESSING' THEN 'PACKING'
    WHEN 'READY_FOR_DELIVERY' THEN 'AWAITING_DRIVER'
    WHEN 'IN_DELIVERY' THEN 'IN_TRANSIT'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    WHEN 'CANCELLED' THEN 'CANCELED'
    WHEN 'RETURNED' THEN 'RETURNED'
    WHEN 'REFUNDED' THEN 'REFUNDED'
  END::order_status_v2
);
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'PACKING';

ALTER TABLE order_status_history
  ALTER COLUMN from_status TYPE order_status_v2 USING (
    CASE from_status::text
      WHEN 'PENDING_PAYMENT' THEN 'PACKING'
      WHEN 'PAID' THEN 'PACKING'
      WHEN 'PROCESSING' THEN 'PACKING'
      WHEN 'READY_FOR_DELIVERY' THEN 'AWAITING_DRIVER'
      WHEN 'IN_DELIVERY' THEN 'IN_TRANSIT'
      WHEN 'COMPLETED' THEN 'COMPLETED'
      WHEN 'CANCELLED' THEN 'CANCELED'
      WHEN 'RETURNED' THEN 'RETURNED'
      WHEN 'REFUNDED' THEN 'REFUNDED'
    END::order_status_v2
  ),
  ALTER COLUMN to_status TYPE order_status_v2 USING (
    CASE to_status::text
      WHEN 'PENDING_PAYMENT' THEN 'PACKING'
      WHEN 'PAID' THEN 'PACKING'
      WHEN 'PROCESSING' THEN 'PACKING'
      WHEN 'READY_FOR_DELIVERY' THEN 'AWAITING_DRIVER'
      WHEN 'IN_DELIVERY' THEN 'IN_TRANSIT'
      WHEN 'COMPLETED' THEN 'COMPLETED'
      WHEN 'CANCELLED' THEN 'CANCELED'
      WHEN 'RETURNED' THEN 'RETURNED'
      WHEN 'REFUNDED' THEN 'REFUNDED'
    END::order_status_v2
  );

DROP TYPE order_status;
ALTER TYPE order_status_v2 RENAME TO order_status;

ALTER TABLE promotions
  ADD COLUMN value_basis_points INTEGER,
  ADD CONSTRAINT promotions_basis_points_valid
    CHECK (value_basis_points IS NULL OR value_basis_points BETWEEN 1 AND 10000);

UPDATE promotions
SET value_basis_points = round(value_percent * 100)::integer
WHERE kind = 'PERCENTAGE';

ALTER TABLE promotions DROP CONSTRAINT promotions_value_valid;
ALTER TABLE promotions
  ADD CONSTRAINT promotions_value_valid CHECK (
    (kind = 'FIXED' AND value_amount > 0 AND value_basis_points IS NULL) OR
    (kind = 'PERCENTAGE' AND value_basis_points BETWEEN 1 AND 10000 AND value_amount IS NULL) OR
    (kind = 'FREE_SHIPPING' AND value_amount IS NULL AND value_basis_points IS NULL)
  );

CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  quota INTEGER CHECK (quota IS NULL OR quota > 0),
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  per_buyer_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_buyer_limit > 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vouchers_code_normalized CHECK (code = upper(btrim(code))),
  CONSTRAINT vouchers_code_unique UNIQUE (code),
  CONSTRAINT vouchers_window_valid CHECK (ends_at > starts_at),
  CONSTRAINT vouchers_quota_valid CHECK (quota IS NULL OR redemption_count <= quota)
);

CREATE INDEX vouchers_active_window_idx
  ON vouchers (starts_at, ends_at) WHERE is_active;
CREATE TRIGGER vouchers_set_updated_at
BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE checkout_groups
  ADD COLUMN voucher_id UUID REFERENCES vouchers(id) ON DELETE RESTRICT;

CREATE TABLE voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE RESTRICT,
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  checkout_group_id UUID NOT NULL UNIQUE REFERENCES checkout_groups(id) ON DELETE RESTRICT,
  discount_amount BIGINT NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX voucher_redemptions_buyer_idx
  ON voucher_redemptions (voucher_id, buyer_profile_id, created_at DESC);

CREATE TYPE delivery_job_status AS ENUM ('AVAILABLE', 'CLAIMED', 'COMPLETED', 'CANCELED');

CREATE TABLE delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  delivery_id UUID NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE RESTRICT,
  status delivery_job_status NOT NULL DEFAULT 'AVAILABLE',
  claimed_by UUID REFERENCES driver_profiles(id) ON DELETE RESTRICT,
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT delivery_jobs_claim_valid CHECK (
    (status = 'AVAILABLE' AND claimed_by IS NULL AND claimed_at IS NULL) OR
    (status IN ('CLAIMED', 'COMPLETED') AND claimed_by IS NOT NULL AND claimed_at IS NOT NULL) OR
    status = 'CANCELED'
  )
);

CREATE INDEX delivery_jobs_available_idx
  ON delivery_jobs (created_at, id) WHERE status = 'AVAILABLE';
CREATE INDEX delivery_jobs_driver_idx
  ON delivery_jobs (claimed_by, status, updated_at DESC, id DESC)
  WHERE claimed_by IS NOT NULL;
CREATE TRIGGER delivery_jobs_set_updated_at
BEFORE UPDATE ON delivery_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE driver_wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL UNIQUE REFERENCES driver_profiles(id) ON DELETE RESTRICT,
  balance_amount BIGINT NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER driver_wallet_accounts_set_updated_at
BEFORE UPDATE ON driver_wallet_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE driver_wallet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_account_id UUID NOT NULL REFERENCES driver_wallet_accounts(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
  delivery_id UUID NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX driver_wallet_entries_history_idx
  ON driver_wallet_entries (wallet_account_id, created_at DESC, id DESC);

CREATE TRIGGER driver_wallet_entries_no_update
BEFORE UPDATE OR DELETE ON driver_wallet_entries
FOR EACH ROW EXECUTE FUNCTION prevent_wallet_ledger_mutation();

ALTER TABLE driver_earnings
  ADD COLUMN wallet_entry_id UUID UNIQUE REFERENCES driver_wallet_entries(id) ON DELETE RESTRICT;

ALTER TABLE system_clock
  ADD COLUMN offset_seconds BIGINT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION application_now()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    (SELECT frozen_at FROM system_clock WHERE singleton),
    now() + make_interval(secs => (SELECT offset_seconds FROM system_clock WHERE singleton))
  );
$$;

CREATE INDEX orders_overdue_scan_idx
  ON orders (status, updated_at, id)
  WHERE status IN ('AWAITING_DRIVER', 'DRIVER_ASSIGNED', 'IN_TRANSIT');
