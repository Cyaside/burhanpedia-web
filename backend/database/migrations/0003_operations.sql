CREATE TYPE delivery_method AS ENUM ('INSTANT', 'NEXT_DAY', 'REGULAR');
CREATE TYPE delivery_status AS ENUM (
  'WAITING_FOR_DRIVER', 'CLAIMED', 'PICKED_UP', 'IN_TRANSIT',
  'DELIVERED', 'FAILED', 'OVERDUE', 'RETURNING', 'RETURNED', 'CANCELLED'
);
CREATE TYPE outbox_status AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD');
CREATE TYPE job_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'DEAD');
CREATE TYPE upload_status AS ENUM ('PENDING', 'READY', 'REJECTED', 'DELETED');

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  driver_profile_id UUID REFERENCES driver_profiles(id) ON DELETE RESTRICT,
  method delivery_method NOT NULL,
  status delivery_status NOT NULL DEFAULT 'WAITING_FOR_DRIVER',
  fee_amount BIGINT NOT NULL CHECK (fee_amount >= 0),
  pickup_deadline_at TIMESTAMPTZ NOT NULL,
  delivery_deadline_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT deliveries_deadline_order CHECK (delivery_deadline_at > pickup_deadline_at),
  CONSTRAINT deliveries_driver_claim_consistent CHECK (
    (status = 'WAITING_FOR_DRIVER' AND driver_profile_id IS NULL AND claimed_at IS NULL) OR
    (status <> 'WAITING_FOR_DRIVER' AND status <> 'CANCELLED' AND driver_profile_id IS NOT NULL) OR
    (status = 'CANCELLED')
  )
);

CREATE INDEX deliveries_available_idx
  ON deliveries (method, pickup_deadline_at, id)
  WHERE status = 'WAITING_FOR_DRIVER';
CREATE INDEX deliveries_driver_queue_idx
  ON deliveries (driver_profile_id, status, delivery_deadline_at, id)
  WHERE driver_profile_id IS NOT NULL;
CREATE INDEX deliveries_overdue_idx
  ON deliveries (delivery_deadline_at, id)
  WHERE status IN ('CLAIMED', 'PICKED_UP', 'IN_TRANSIT');
CREATE TRIGGER deliveries_set_updated_at
BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE RESTRICT,
  from_status delivery_status,
  to_status delivery_status NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX delivery_status_history_delivery_idx
  ON delivery_status_history (delivery_id, occurred_at, id);

CREATE TABLE driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE RESTRICT,
  delivery_id UUID NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'IDR',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX driver_earnings_history_idx
  ON driver_earnings (driver_profile_id, earned_at DESC, id DESC);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status outbox_status NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX outbox_events_pending_idx
  ON outbox_events (available_at, created_at, id)
  WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX outbox_events_aggregate_idx
  ON outbox_events (aggregate_type, aggregate_id, created_at, id);

CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  deduplication_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  status job_status NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts > 0),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT background_jobs_attempts_valid CHECK (attempts <= max_attempts)
);

CREATE INDEX background_jobs_runnable_idx
  ON background_jobs (run_at, created_at, id)
  WHERE status IN ('PENDING', 'FAILED');
CREATE TRIGGER background_jobs_set_updated_at
BEFORE UPDATE ON background_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE dead_letter_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('OUTBOX', 'JOB')),
  source_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  final_error TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dead_letter_source_unique UNIQUE (source_kind, source_id)
);

CREATE INDEX dead_letter_events_failed_idx
  ON dead_letter_events (failed_at DESC, id DESC);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  request_id UUID,
  ip_hash CHAR(64),
  user_agent TEXT,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_resource_idx
  ON audit_logs (resource_type, resource_id, created_at DESC, id DESC);
CREATE INDEX audit_logs_actor_idx
  ON audit_logs (actor_user_id, created_at DESC, id DESC)
  WHERE actor_user_id IS NOT NULL;
CREATE INDEX audit_logs_request_idx
  ON audit_logs (request_id) WHERE request_id IS NOT NULL;

CREATE TABLE stored_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0),
  checksum_sha256 CHAR(64) NOT NULL,
  status upload_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX stored_objects_pending_expiry_idx
  ON stored_objects (expires_at, id)
  WHERE status = 'PENDING';
CREATE TRIGGER stored_objects_set_updated_at
BEFORE UPDATE ON stored_objects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  buyer_profile_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  order_item_id UUID NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT product_reviews_buyer_product_unique UNIQUE (buyer_profile_id, product_id)
);

CREATE INDEX product_reviews_product_idx
  ON product_reviews (product_id, created_at DESC, id DESC);
CREATE TRIGGER product_reviews_set_updated_at
BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE system_clock (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  frozen_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO system_clock (singleton) VALUES (true);

CREATE OR REPLACE FUNCTION application_now()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce((SELECT frozen_at FROM system_clock WHERE singleton), now());
$$;
