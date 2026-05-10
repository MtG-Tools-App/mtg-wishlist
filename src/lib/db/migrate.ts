import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.resolve(process.cwd(), "data", "wishlist.db");

function addColumnIfMissing(db: Database.Database, table: string, column: string, definition: string) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✓ Added column: ${table}.${column}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("duplicate column name")) {
      console.log(`— Already exists: ${table}.${column} (skipped)`);
    } else {
      throw e;
    }
  }
}

function dropFormatTagCheck(db: Database.Database) {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='wishlist_items'")
    .get() as { sql: string } | undefined;
  if (!row) return;
  if (!row.sql.includes("format_tag") || !row.sql.includes("CHECK (format_tag")) {
    console.log("— wishlist_items.format_tag CHECK already dropped (skipped)");
    return;
  }

  console.log("Dropping wishlist_items.format_tag CHECK constraint…");
  db.exec(`
    BEGIN TRANSACTION;
    CREATE TABLE wishlist_items_new (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      scryfall_id    TEXT    NOT NULL REFERENCES cards(scryfall_id),
      format_tag     TEXT,
      condition_min  TEXT    CHECK (condition_min IN ('NM', 'EX', 'GD')),
      target_price   INTEGER,
      priority       INTEGER CHECK (priority BETWEEN 1 AND 5),
      notes          TEXT,
      created_at     INTEGER NOT NULL
    );
    INSERT INTO wishlist_items_new (id, scryfall_id, format_tag, condition_min, target_price, priority, notes, created_at)
      SELECT id, scryfall_id, format_tag, condition_min, target_price, priority, notes, created_at FROM wishlist_items;
    DROP TABLE wishlist_items;
    ALTER TABLE wishlist_items_new RENAME TO wishlist_items;
    CREATE INDEX IF NOT EXISTS idx_wishlist_format_priority ON wishlist_items (format_tag, priority);
    COMMIT;
  `);
  console.log("✓ format_tag CHECK constraint removed");
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  addColumnIfMissing(db, "cards", "legalities", "TEXT");
  dropFormatTagCheck(db);

  db.close();
  console.log("✓ Migration complete");
}

main();
