CREATE INDEX stores_active_name_idx
  ON stores (lower(name), id)
  WHERE status = 'ACTIVE';
