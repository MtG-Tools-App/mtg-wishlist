CREATE TABLE IF NOT EXISTS cards (
  scryfall_id      TEXT    PRIMARY KEY,
  name_en          TEXT    NOT NULL,
  name_ja          TEXT,
  set_code         TEXT    NOT NULL,
  collector_number TEXT    NOT NULL,
  finish           TEXT    NOT NULL CHECK (finish IN ('nonfoil', 'foil', 'etched')),
  image_url        TEXT,
  oracle_id        TEXT    NOT NULL,
  cached_at        INTEGER NOT NULL,
  legalities       TEXT
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  scryfall_id    TEXT    NOT NULL REFERENCES cards(scryfall_id),
  format_tag     TEXT,
  condition_min  TEXT    CHECK (condition_min IN ('NM', 'EX', 'GD')),
  target_price   INTEGER,
  notes          TEXT,
  created_at     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS price_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  wishlist_item_id INTEGER NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
  price            INTEGER NOT NULL,
  shop             TEXT    NOT NULL,
  condition_actual TEXT,
  url              TEXT,
  available        INTEGER NOT NULL DEFAULT 1,
  logged_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wishlist_format
  ON wishlist_items (format_tag);

CREATE INDEX IF NOT EXISTS idx_price_logs_item_time
  ON price_logs (wishlist_item_id, logged_at DESC);
