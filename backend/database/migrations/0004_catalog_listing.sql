ALTER TABLE products
  ADD COLUMN min_price_amount BIGINT CHECK (min_price_amount >= 0);

CREATE OR REPLACE FUNCTION refresh_product_min_price()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  affected_product_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_product_id := OLD.product_id;
  ELSE
    affected_product_id := NEW.product_id;
  END IF;
  UPDATE products
  SET min_price_amount = (
    SELECT min(price_amount)
    FROM product_variants
    WHERE product_id = affected_product_id AND status = 'ACTIVE'
  )
  WHERE id = affected_product_id;

  IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
    UPDATE products
    SET min_price_amount = (
      SELECT min(price_amount)
      FROM product_variants
      WHERE product_id = OLD.product_id AND status = 'ACTIVE'
    )
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER product_variants_refresh_min_price
AFTER INSERT OR UPDATE OF price_amount, status, product_id OR DELETE
ON product_variants
FOR EACH ROW EXECUTE FUNCTION refresh_product_min_price();

UPDATE products p
SET min_price_amount = (
  SELECT min(v.price_amount)
  FROM product_variants v
  WHERE v.product_id = p.id AND v.status = 'ACTIVE'
);

CREATE INDEX products_active_price_idx
  ON products (min_price_amount, id)
  WHERE status = 'ACTIVE' AND min_price_amount IS NOT NULL;

CREATE INDEX products_active_name_idx
  ON products (lower(name), id)
  WHERE status = 'ACTIVE';

CREATE INDEX inventories_available_idx
  ON inventories (variant_id, on_hand, reserved)
  WHERE on_hand > reserved;
