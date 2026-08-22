DROP INDEX products_search_trgm_idx;

CREATE INDEX products_search_fts_idx
  ON products USING gin (
    to_tsvector('simple', name || ' ' || coalesce(description, ''))
  );
