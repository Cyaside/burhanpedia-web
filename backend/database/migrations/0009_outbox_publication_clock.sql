CREATE TABLE published_events (
  outbox_event_id UUID PRIMARY KEY REFERENCES outbox_events(id) ON DELETE RESTRICT,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX published_events_feed_idx
  ON published_events (published_at, outbox_event_id);

CREATE OR REPLACE FUNCTION application_now()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN current_setting('app.clock_mode', true) = 'real' THEN now()
    ELSE coalesce(
      (SELECT frozen_at FROM system_clock WHERE singleton),
      now() + make_interval(secs => (SELECT offset_seconds FROM system_clock WHERE singleton))
    )
  END;
$$;
