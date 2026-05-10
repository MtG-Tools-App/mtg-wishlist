import type {
  ScryfallCard,
  ScryfallSearchResponse,
  ScryfallError,
  NormalizedCard,
} from "./types";
import { normalizeCard, extractScryfallUuid } from "./normalize";

const BASE_URL = "https://api.scryfall.com";
const HEADERS: HeadersInit = {
  "User-Agent": "MtG-Price-Wishlist/0.1",
  Accept: "application/json",
};

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Scryfall asks clients to add 50–100 ms between requests.
const RATE_LIMIT_MS = 100;
let lastRequestAt = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const wait = RATE_LIMIT_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
  return fetch(url, { headers: HEADERS });
}

async function assertOk(res: Response, context: string): Promise<void> {
  if (!res.ok) {
    let detail = "";
    try {
      const err: ScryfallError = await res.json();
      detail = err.details;
    } catch {
      /* ignore parse error */
    }
    throw new Error(`Scryfall ${context} — ${res.status}: ${detail}`);
  }
}

// ── Japanese detection ───────────────────────────────────────────────────────

const JAPANESE_REGEX = /[぀-ゟ゠-ヿ一-鿿]/;
function containsJapanese(s: string): boolean {
  return JAPANESE_REGEX.test(s);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Searches cards by query string.
 *
 * When the query contains Japanese characters, prepends `lang:ja` so Scryfall
 * returns the Japanese prints with printed_name populated.
 * Returns up to 20 Scryfall card objects, each expanded per finish.
 * Returns an empty array when Scryfall responds with 404 (no results).
 */
export async function searchCards(query: string): Promise<NormalizedCard[]> {
  const scryfallQuery = containsJapanese(query) ? `lang:ja ${query}` : query;
  // unique=prints: return one row per printing so all expansions/sets are visible
  // (default unique=cards collapses to one printing per oracle_id).
  // order=released&dir=asc: oldest printing first.
  const url = `${BASE_URL}/cards/search?q=${encodeURIComponent(scryfallQuery)}&unique=prints&order=released&dir=asc&page_size=20`;
  const res = await rateLimitedFetch(url);

  if (res.status === 404) return [];
  await assertOk(res, `search("${query}")`);

  const body: ScryfallSearchResponse = await res.json();
  // Scryfall may return more than 20 on some queries; enforce our cap.
  return body.data.slice(0, 20).flatMap(normalizeCard);
}

/**
 * Fetches the Japanese printed_name for a specific printing.
 *
 * Uses /cards/{set}/{collector_number}/ja — returns null when no Japanese
 * print exists (404) so callers never need to handle a "not found" error.
 */
export async function fetchJapaneseName(
  set_code: string,
  collector_number: string
): Promise<string | null> {
  const url = `${BASE_URL}/cards/${encodeURIComponent(set_code)}/${encodeURIComponent(collector_number)}/ja`;
  const res = await rateLimitedFetch(url);

  if (res.status === 404) return null;
  await assertOk(res, `fetchJapaneseName("${set_code}/${collector_number}")`);

  const card: ScryfallCard = await res.json();

  // Double-faced cards expose printed_name per face; fall back to card-level field.
  return (
    card.printed_name ??
    card.card_faces?.find((f) => f.printed_name)?.printed_name ??
    null
  );
}

/**
 * Fetches a single card by its Scryfall UUID (or a synthetic `{uuid}:{finish}` key).
 *
 * Returns all finish variants for that printing.
 */
export async function getCardById(scryfallId: string): Promise<NormalizedCard[]> {
  const uuid = extractScryfallUuid(scryfallId);
  const url = `${BASE_URL}/cards/${uuid}`;
  const res = await rateLimitedFetch(url);

  await assertOk(res, `getCardById("${uuid}")`);

  const card: ScryfallCard = await res.json();
  return normalizeCard(card);
}
