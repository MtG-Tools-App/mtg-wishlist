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
 * Japanese queries use a two-step lookup so English-only special prints
 * (Borderless, Old-Frame, Showcase, etc. that lack a JA release) are not
 * filtered out by `lang:ja`: first resolve the oracle_id from a JA search,
 * then return every printing for that oracle.
 */
export async function searchCards(query: string): Promise<NormalizedCard[]> {
  if (containsJapanese(query)) return searchByJapaneseName(query);
  return searchAllPrintings(query);
}

async function searchByJapaneseName(query: string): Promise<NormalizedCard[]> {
  // Step 1: find oracle_ids whose JA print matches the query.
  const jaUrl = `${BASE_URL}/cards/search?q=${encodeURIComponent(`lang:ja ${query}`)}&unique=cards&page_size=20`;
  const jaRes = await rateLimitedFetch(jaUrl);
  if (jaRes.status === 404) return [];
  await assertOk(jaRes, `searchByJapaneseName.find("${query}")`);

  const jaBody: ScryfallSearchResponse = await jaRes.json();
  const oracleIds = Array.from(new Set(jaBody.data.map((c) => c.oracle_id)));
  if (oracleIds.length === 0) return [];

  // Step 2: fetch every printing for those oracles, regardless of language.
  const orQuery = oracleIds.map((id) => `oracleid:${id}`).join(" or ");
  return searchAllPrintings(`(${orQuery})`, 100);
}

async function searchAllPrintings(
  scryfallQuery: string,
  pageSize = 50
): Promise<NormalizedCard[]> {
  // unique=prints: one row per printing so every set/frame variant is visible.
  // include_variations=true: surfaces art variants (e.g. Dragonscale Foil).
  const url =
    `${BASE_URL}/cards/search?q=${encodeURIComponent(scryfallQuery)}` +
    `&unique=prints&include_variations=true&order=released&dir=asc&page_size=${pageSize}`;
  const res = await rateLimitedFetch(url);

  if (res.status === 404) return [];
  await assertOk(res, `searchAllPrintings("${scryfallQuery}")`);

  const body: ScryfallSearchResponse = await res.json();
  return body.data.slice(0, pageSize).flatMap(normalizeCard);
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
