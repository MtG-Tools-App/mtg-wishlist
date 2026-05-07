import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.resolve(process.cwd(), "data", "wishlist.db");
const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

const NOW = Math.floor(Date.now() / 1000);

// ── Idempotent cleanup ────────────────────────────────────────────────────────
// ON DELETE CASCADE removes price_logs when wishlist_items are deleted.
db.transaction(() => {
  db.prepare("DELETE FROM wishlist_items WHERE scryfall_id LIKE 'demo-%'").run();
  db.prepare("DELETE FROM cards        WHERE scryfall_id LIKE 'demo-%'").run();
})();

// ── Cards ─────────────────────────────────────────────────────────────────────
const insertCard = db.prepare(`
  INSERT INTO cards
    (scryfall_id, name_en, name_ja, set_code, collector_number, finish, image_url, oracle_id, cached_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const CARDS = [
  ["demo-bolt:nonfoil",   "Lightning Bolt", "稲妻",       "lea", "161", "nonfoil", null, "demo-oracle-bolt"],
  ["demo-serra:foil",     "Serra Angel",    "セラの天使", "lea", "28",  "foil",    null, "demo-oracle-serra"],
  ["demo-ritual:nonfoil", "Dark Ritual",    "暗黒の儀式", "lea", "100", "nonfoil", null, "demo-oracle-ritual"],
] as const;

for (const c of CARDS) {
  insertCard.run(...c, NOW);
}

// ── Wishlist items ────────────────────────────────────────────────────────────
const insertWI = db.prepare(`
  INSERT INTO wishlist_items
    (scryfall_id, format_tag, condition_min, target_price, priority, notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// 1. 通常: priority 5, target ¥1000, latest price ¥900 (in stock)
const id1 = insertWI.run(
  "demo-bolt:nonfoil", "premodern", "NM", 1000, 5, "目標価格以下で購入チャンス", NOW - 300
).lastInsertRowid;

// 2. 売り切れ: priority 3, target ¥5000, latest price ¥6500 (out of stock)
const id2 = insertWI.run(
  "demo-serra:foil", "premodern", "EX", 5000, 3, null, NOW - 200
).lastInsertRowid;

// 3. 未確認: priority 1, target ¥200, no price_log
insertWI.run(
  "demo-ritual:nonfoil", "middle_school", null, 200, 1, null, NOW - 100
);

// ── Price logs ────────────────────────────────────────────────────────────────
const insertPL = db.prepare(`
  INSERT INTO price_logs
    (wishlist_item_id, price, shop, condition_actual, url, available, logged_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertPL.run(id1, 900,  "hareruya", "NM", null, 1, NOW - 250); // 通常 — at target
insertPL.run(id2, 6500, "bigmagic", "EX", null, 0, NOW - 150); // 売り切れ

db.close();

console.log("✓ Demo data seeded:");
console.log("  [通常]   Lightning Bolt  — ¥900 / target ¥1000 (available)");
console.log("  [売り切れ] Serra Angel (Foil) — ¥6500 / target ¥5000 (unavailable)");
console.log("  [未確認] Dark Ritual    — no price log yet");
