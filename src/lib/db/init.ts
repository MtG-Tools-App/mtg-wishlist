import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.resolve(process.cwd(), "data", "wishlist.db");
const SCHEMA_PATH = path.resolve(process.cwd(), "src", "lib", "db", "schema.sql");

function main() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const db = new Database(DB_PATH);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(schema);
  db.close();

  console.log(`✓ Database initialized: ${DB_PATH}`);
}

main();
