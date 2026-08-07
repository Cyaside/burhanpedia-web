ALTER TABLE stores
  ADD COLUMN logo_url TEXT,
  ADD COLUMN logo_alt_text TEXT,
  ADD CONSTRAINT stores_logo_pair_check CHECK (
    (logo_url IS NULL AND logo_alt_text IS NULL)
    OR (
      logo_url IS NOT NULL
      AND logo_alt_text IS NOT NULL
      AND char_length(logo_url) BETWEEN 1 AND 2048
      AND char_length(logo_alt_text) BETWEEN 1 AND 160
      AND (logo_url LIKE 'https://%' OR logo_url LIKE '/%')
    )
  );
