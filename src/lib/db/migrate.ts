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

function migrateMiddleSchoolToPremodern(db: Database.Database) {
  const row = db
    .prepare("SELECT COUNT(*) AS cnt FROM wishlist_items WHERE format_tag = 'middle_school'")
    .get() as { cnt: number };
  if (row.cnt === 0) {
    console.log("— No middle_school rows to migrate (skipped)");
    return;
  }
  const info = db
    .prepare("UPDATE wishlist_items SET format_tag = 'premodern' WHERE format_tag = 'middle_school'")
    .run();
  console.log(`✓ Renamed ${info.changes} middle_school rows → premodern`);
}

function dropPriorityColumn(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(wishlist_items)").all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "priority")) {
    console.log("— priority column already absent (skipped)");
    return;
  }
  db.exec(`
    BEGIN TRANSACTION;
    DROP INDEX IF EXISTS idx_wishlist_format_priority;
    ALTER TABLE wishlist_items DROP COLUMN priority;
    CREATE INDEX IF NOT EXISTS idx_wishlist_format ON wishlist_items (format_tag);
    COMMIT;
  `);
  console.log("✓ Dropped wishlist_items.priority column");
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  addColumnIfMissing(db, "cards", "legalities", "TEXT");
  dropFormatTagCheck(db);
  migrateMiddleSchoolToPremodern(db);
  dropPriorityColumn(db);

  db.close();
  console.log("✓ Migration complete");
}

main();
