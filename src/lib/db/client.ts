import path from "path";

export type DbClient =
  | import("better-sqlite3").Database
  | import("@libsql/client").Client;

// Narrow helpers — callers can use these to branch on client type
export function isSqliteClient(
  db: DbClient
): db is import("better-sqlite3").Database {
  return "prepare" in db && typeof (db as { prepare: unknown }).prepare === "function";
}

export function isLibsqlClient(
  db: DbClient
): db is import("@libsql/client").Client {
  return "execute" in db && !isSqliteClient(db);
}

let _client: DbClient | null = null;

export function getDb(): DbClient {
  if (_client) return _client;

  if (process.env.DATABASE_URL) {
    const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
    _client = createClient({
      url: process.env.DATABASE_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  } else {
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    const dbPath = path.resolve(process.cwd(), "data", "wishlist.db");
    _client = new Database(dbPath);
    // Enable WAL mode for better concurrent read performance
    (_client as import("better-sqlite3").Database).pragma("journal_mode = WAL");
    (_client as import("better-sqlite3").Database).pragma("foreign_keys = ON");
  }

  return _client;
}

/** Call only in tests or CLI scripts — resets the singleton. */
export function resetDb(): void {
  if (_client && isSqliteClient(_client)) {
    _client.close();
  }
  _client = null;
}
