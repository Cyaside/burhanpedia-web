ALTER TABLE delivery_jobs
  DROP CONSTRAINT delivery_jobs_claim_idempotency_key_key;

CREATE UNIQUE INDEX delivery_jobs_driver_idempotency_idx
  ON delivery_jobs (claimed_by, claim_idempotency_key)
  WHERE claim_idempotency_key IS NOT NULL;

CREATE INDEX background_jobs_stale_lock_idx
  ON background_jobs (locked_at, id) WHERE status = 'RUNNING';
CREATE INDEX outbox_events_stale_lock_idx
  ON outbox_events (locked_at, id) WHERE status = 'PROCESSING';
