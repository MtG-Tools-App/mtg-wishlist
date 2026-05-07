import { getDb, isSqliteClient } from "./client";

type InValue = string | number | bigint | null | boolean;

async function all<T>(sql: string, params: InValue[] = []): Promise<T[]> {
  const db = getDb();
  if (isSqliteClient(db)) {
    return db.prepare(sql).all(...params) as T[];
  }
  const { rows } = await db.execute({ sql, args: params });
  return rows as unknown as T[];
}

async function run(sql: string, params: InValue[] = []): Promise<void> {
  const db = getDb();
  if (isSqliteClient(db)) {
    db.prepare(sql).run(...params);
    return;
  }
  await db.execute({ sql, args: params });
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface WishlistRow {
  id: number;
  scryfall_id: string;
  format_tag: string | null;
  condition_min: string | null;
  target_price: number | null;
  priority: number | null;
  notes: string | null;
  created_at: number;
  name_en: string;
  name_ja: string | null;
  set_code: string;
  finish: string;
  image_url: string | null;
  collector_number: string;
  latest_price: number | null;
  latest_shop: string | null;
  latest_logged_at: number | null;
  latest_available?: number;
}

export interface PriceLogRow {
  id: number;
  wishlist_item_id: number;
  price: number;
  shop: string;
  condition_actual: string | null;
  url: string | null;
  available: number;
  logged_at: number;
}

// ── Queries ──────────────────────────────────────────────────────────────────

const WISHLIST_SELECT = `
  SELECT
    wi.id, wi.scryfall_id, wi.format_tag, wi.condition_min,
    wi.target_price, wi.priority, wi.notes, wi.created_at,
    c.name_en, c.name_ja, c.set_code, c.finish, c.image_url, c.collector_number,
    pl.price      AS latest_price,
    pl.shop       AS latest_shop,
    pl.logged_at  AS latest_logged_at,
    pl.available  AS latest_available
  FROM wishlist_items wi
  JOIN cards c ON wi.scryfall_id = c.scryfall_id
  LEFT JOIN price_logs pl ON pl.id = (
    SELECT id FROM price_logs
    WHERE wishlist_item_id = wi.id
    ORDER BY logged_at DESC, id DESC
    LIMIT 1
  )
`;

export async function getWishlistItems(
  formatTag?: string | null
): Promise<WishlistRow[]> {
  const where = formatTag ? "WHERE wi.format_tag = ?" : "";
  const sql = `
    ${WISHLIST_SELECT}
    ${where}
    ORDER BY
      COALESCE(wi.priority, 0) DESC,
      CASE
        WHEN pl.price IS NOT NULL AND wi.target_price IS NOT NULL
          THEN pl.price - wi.target_price
        ELSE 9999999
      END ASC,
      wi.created_at DESC
  `;
  return all<WishlistRow>(sql, formatTag ? [formatTag] : []);
}

export async function getWishlistItemById(
  id: number
): Promise<WishlistRow | null> {
  const rows = await all<WishlistRow>(
    `${WISHLIST_SELECT} WHERE wi.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getRecentPriceLogs(
  wishlistItemId: number,
  limit = 5
): Promise<PriceLogRow[]> {
  return all<PriceLogRow>(
    `SELECT * FROM price_logs WHERE wishlist_item_id = ?
     ORDER BY logged_at DESC LIMIT ?`,
    [wishlistItemId, limit]
  );
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function upsertCard(card: {
  scryfall_id: string;
  name_en: string;
  name_ja: string | null;
  set_code: string;
  collector_number: string;
  finish: string;
  image_url: string | null;
  oracle_id: string;
  cached_at: number;
  legalities: string | null;
}): Promise<void> {
  await run(
    `INSERT INTO cards
       (scryfall_id, name_en, name_ja, set_code, collector_number, finish, image_url, oracle_id, cached_at, legalities)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(scryfall_id) DO UPDATE SET
       name_ja    = excluded.name_ja,
       legalities = excluded.legalities,
       cached_at  = excluded.cached_at`,
    [
      card.scryfall_id, card.name_en, card.name_ja, card.set_code,
      card.collector_number, card.finish, card.image_url, card.oracle_id,
      card.cached_at, card.legalities,
    ]
  );
}

export async function deleteWishlistItem(id: number): Promise<void> {
  await run(`DELETE FROM wishlist_items WHERE id = ?`, [id]);
}

export async function insertWishlistItem(item: {
  scryfall_id: string;
  format_tag: string | null;
  condition_min: string | null;
  target_price: number | null;
  priority: number | null;
  notes: string | null;
  created_at: number;
}): Promise<void> {
  await run(
    `INSERT INTO wishlist_items
       (scryfall_id, format_tag, condition_min, target_price, priority, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.scryfall_id, item.format_tag, item.condition_min,
      item.target_price, item.priority, item.notes, item.created_at,
    ]
  );
}

export async function insertPriceLog(log: {
  wishlist_item_id: number;
  price: number;
  shop: string;
  condition_actual: string | null;
  url: string | null;
  available: number;
  logged_at: number;
}): Promise<void> {
  await run(
    `INSERT INTO price_logs
       (wishlist_item_id, price, shop, condition_actual, url, available, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      log.wishlist_item_id, log.price, log.shop,
      log.condition_actual, log.url, log.available, log.logged_at,
    ]
  );
}
