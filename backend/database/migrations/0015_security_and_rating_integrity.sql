-- Keep ledger history append-only even for statement-level TRUNCATE.
CREATE TRIGGER wallet_ledger_no_truncate
BEFORE TRUNCATE ON wallet_ledger_entries
FOR EACH STATEMENT EXECUTE FUNCTION prevent_wallet_ledger_mutation();

CREATE TRIGGER driver_wallet_entries_no_truncate
BEFORE TRUNCATE ON driver_wallet_entries
FOR EACH STATEMENT EXECUTE FUNCTION prevent_wallet_ledger_mutation();

-- Resolve names in trusted schemas, including when a connection changes its search path.
ALTER FUNCTION set_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION prevent_wallet_ledger_mutation() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION application_now() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION refresh_product_min_price() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION increment_product_version() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION validate_verified_product_review() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION refresh_product_rating(UUID) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION sync_product_rating_after_review() SET search_path = pg_catalog, public, pg_temp;

-- Lock the product before recomputing so concurrent reviews cannot overwrite a newer aggregate.
CREATE OR REPLACE FUNCTION refresh_product_rating(target_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  PERFORM 1 FROM products WHERE id = target_product_id FOR UPDATE;
  UPDATE products p
  SET rating_sum = aggregate.rating_sum,
      rating_count = aggregate.rating_count,
      rating_average = CASE
        WHEN aggregate.rating_count = 0 THEN 0
        ELSE round(aggregate.rating_sum::numeric / aggregate.rating_count, 2)
      END
  FROM (
    SELECT coalesce(sum(rating), 0)::bigint AS rating_sum,
           count(*)::integer AS rating_count
    FROM product_reviews
    WHERE product_id = target_product_id
  ) aggregate
  WHERE p.id = target_product_id;
END;
$$;

-- Migration 0012 reset aggregate columns but retained historical reviews.
UPDATE products p
SET rating_sum = aggregate.rating_sum,
    rating_count = aggregate.rating_count,
    rating_average = round(aggregate.rating_sum::numeric / aggregate.rating_count, 2)
FROM (
  SELECT product_id, sum(rating)::bigint AS rating_sum,
         count(*)::integer AS rating_count
  FROM product_reviews
  GROUP BY product_id
) aggregate
WHERE p.id = aggregate.product_id;
