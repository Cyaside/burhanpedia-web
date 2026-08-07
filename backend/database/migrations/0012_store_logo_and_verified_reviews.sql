ALTER TABLE stores ADD COLUMN logo_storage_key TEXT;

UPDATE stores
SET logo_url = NULL,
    logo_alt_text = NULL;

ALTER TABLE stores DROP CONSTRAINT stores_logo_pair_check;
ALTER TABLE stores
  ADD CONSTRAINT stores_logo_triplet_check CHECK (
    (logo_storage_key IS NULL AND logo_url IS NULL AND logo_alt_text IS NULL)
    OR (
      logo_storage_key IS NOT NULL
      AND logo_url IS NOT NULL
      AND logo_alt_text IS NOT NULL
      AND char_length(logo_storage_key) BETWEEN 1 AND 1024
      AND char_length(logo_url) BETWEEN 1 AND 2048
      AND char_length(logo_alt_text) BETWEEN 1 AND 160
      AND (logo_url LIKE 'https://%' OR logo_url LIKE '/%')
    )
  );

CREATE UNIQUE INDEX stores_logo_storage_key_idx
  ON stores (logo_storage_key)
  WHERE logo_storage_key IS NOT NULL;

ALTER TABLE product_reviews
  DROP CONSTRAINT product_reviews_buyer_product_unique,
  DROP COLUMN title;

ALTER TABLE product_reviews RENAME COLUMN body TO comment;

ALTER TABLE product_reviews
  ADD CONSTRAINT product_reviews_comment_length_check
    CHECK (comment IS NULL OR char_length(comment) BETWEEN 1 AND 2000);

CREATE INDEX product_reviews_buyer_history_idx
  ON product_reviews (buyer_profile_id, created_at DESC, id DESC);

ALTER TABLE products ADD COLUMN rating_sum BIGINT NOT NULL DEFAULT 0;

UPDATE products
SET rating_average = 0,
    rating_count = 0,
    rating_sum = 0;

ALTER TABLE products
  ADD CONSTRAINT products_rating_aggregate_check CHECK (
    (rating_count = 0 AND rating_sum = 0 AND rating_average = 0)
    OR (
      rating_count > 0
      AND rating_sum BETWEEN rating_count AND rating_count * 5::bigint
      AND rating_average = round(rating_sum::numeric / rating_count, 2)
    )
  );

CREATE OR REPLACE FUNCTION validate_verified_product_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_product_id UUID;
  target_buyer_profile_id UUID;
  target_order_status order_status;
  target_buyer_user_id UUID;
  target_seller_user_id UUID;
BEGIN
  SELECT v.product_id, o.buyer_profile_id, o.status, bp.user_id, sp.user_id
  INTO target_product_id, target_buyer_profile_id, target_order_status,
       target_buyer_user_id, target_seller_user_id
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN buyer_profiles bp ON bp.id = o.buyer_profile_id
  JOIN product_variants v ON v.id = oi.variant_id
  JOIN products p ON p.id = v.product_id
  JOIN stores s ON s.id = p.store_id
  JOIN seller_profiles sp ON sp.id = s.seller_profile_id
  WHERE oi.id = NEW.order_item_id;

  IF target_product_id IS NULL
     OR target_product_id <> NEW.product_id
     OR target_buyer_profile_id <> NEW.buyer_profile_id
     OR target_order_status <> 'COMPLETED'
     OR target_buyer_user_id = target_seller_user_id THEN
    RAISE EXCEPTION 'review must belong to a completed verified purchase'
      USING ERRCODE = '23514',
            CONSTRAINT = 'product_reviews_verified_purchase_check';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER product_reviews_validate_verified_purchase
BEFORE INSERT OR UPDATE OF product_id, buyer_profile_id, order_item_id
ON product_reviews
FOR EACH ROW EXECUTE FUNCTION validate_verified_product_review();

CREATE OR REPLACE FUNCTION refresh_product_rating(target_product_id UUID)
RETURNS void
LANGUAGE sql
AS $$
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
$$;

CREATE OR REPLACE FUNCTION sync_product_rating_after_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_product_rating(coalesce(NEW.product_id, OLD.product_id));
  IF TG_OP = 'UPDATE' AND NEW.product_id <> OLD.product_id THEN
    PERFORM refresh_product_rating(OLD.product_id);
  END IF;
  RETURN coalesce(NEW, OLD);
END;
$$;

CREATE TRIGGER product_reviews_sync_rating
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION sync_product_rating_after_review();
