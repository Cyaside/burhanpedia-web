ALTER TABLE delivery_jobs
  ADD COLUMN claim_idempotency_key TEXT UNIQUE;

ALTER TABLE deliveries DROP CONSTRAINT deliveries_driver_claim_consistent;
ALTER TABLE deliveries
  ADD CONSTRAINT deliveries_driver_claim_consistent CHECK (
    (status = 'WAITING_FOR_DRIVER' AND driver_profile_id IS NULL AND claimed_at IS NULL) OR
    (status IN ('CLAIMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED')
      AND driver_profile_id IS NOT NULL AND claimed_at IS NOT NULL) OR
    status IN ('OVERDUE', 'RETURNING', 'RETURNED', 'CANCELLED')
  );

CREATE INDEX deliveries_order_status_idx ON deliveries (order_id, status);

ALTER TABLE order_status_history
  ADD COLUMN event_sequence BIGSERIAL NOT NULL;
ALTER TABLE delivery_status_history
  ADD COLUMN event_sequence BIGSERIAL NOT NULL;

CREATE INDEX order_status_history_sequence_idx
  ON order_status_history (order_id, event_sequence);
CREATE INDEX delivery_status_history_sequence_idx
  ON delivery_status_history (delivery_id, event_sequence);
