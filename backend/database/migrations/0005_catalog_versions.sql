ALTER TABLE products
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);

CREATE OR REPLACE FUNCTION increment_product_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_increment_version
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION increment_product_version();
