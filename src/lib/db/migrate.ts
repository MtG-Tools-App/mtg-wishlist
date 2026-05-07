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

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  addColumnIfMissing(db, "cards", "legalities", "TEXT");

  db.close();
  console.log("✓ Migration complete");
}

main();
