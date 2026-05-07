// ── Scryfall API response shapes ────────────────────────────────────────────

export type ScryfallFinish = "nonfoil" | "foil" | "etched";

export interface ScryfallImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ScryfallCardFace {
  name: string;
  /** Localized printed name (present on non-English prints) */
  printed_name?: string;
  image_uris?: ScryfallImageUris;
}

/**
 * Subset of the Scryfall Card object we actually use.
 * https://scryfall.com/docs/api/cards
 */
export interface ScryfallCard {
  /** Scryfall UUID — unique per printing, not per finish */
  id: string;
  oracle_id: string;
  name: string;
  /** Localized printed name; only present for non-English prints */
  printed_name?: string;
  /** ISO 639-1 language code */
  lang: string;
  /** Short set code (e.g. "m10") */
  set: string;
  set_name: string;
  collector_number: string;
  /** All available finish variants for this printing */
  finishes: ScryfallFinish[];
  /** Present for single-faced cards */
  image_uris?: ScryfallImageUris;
  /** Present for double-faced / multi-faced cards */
  card_faces?: ScryfallCardFace[];
  /** Format legality map, e.g. { premodern: "legal", legacy: "not_legal" } */
  legalities: Record<string, string>;
}

export interface ScryfallSearchResponse {
  object: "list";
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}

export interface ScryfallError {
  object: "error";
  code: string;
  status: number;
  details: string;
}

// ── Normalized shape matching the `cards` table ──────────────────────────────

/**
 * One row in the `cards` table.
 *
 * `scryfall_id` uses the synthetic key `{uuid}:{finish}` so that foil and
 * nonfoil variants of the same Scryfall printing become distinct rows while
 * the original UUID can always be recovered by splitting on ":".
 */
export interface NormalizedCard {
  /** `{scryfall_uuid}:{finish}` — unique per (printing × finish) */
  scryfall_id: string;
  name_en: string;
  name_ja: string | null;
  set_code: string;
  collector_number: string;
  finish: ScryfallFinish;
  image_url: string | null;
  oracle_id: string;
  cached_at: number;
  /** JSON-serialized legalities map; null for legacy rows without this data */
  legalities: string | null;
}
