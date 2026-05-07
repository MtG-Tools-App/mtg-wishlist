import type { ScryfallCard, ScryfallFinish, NormalizedCard } from "./types";

/**
 * Expands a single Scryfall card object into one NormalizedCard per finish.
 *
 * Lightning Bolt M10 with finishes:["nonfoil","foil"] →
 *   { scryfall_id: "abc:nonfoil", finish: "nonfoil", … }
 *   { scryfall_id: "abc:foil",    finish: "foil",    … }
 */
export function normalizeCard(card: ScryfallCard): NormalizedCard[] {
  const name_en = card.name;

  // printed_name is present only on non-English prints.
  // For double-faced cards, fall back to the front face (index 0).
  const name_ja =
    card.printed_name ??
    card.card_faces?.[0]?.printed_name ??
    null;

  // Single-faced cards expose image_uris at the top level;
  // double-faced cards expose them per face.
  const image_url =
    card.image_uris?.normal ??
    card.card_faces?.[0]?.image_uris?.normal ??
    null;

  const cached_at = Math.floor(Date.now() / 1000);

  const finishes: ScryfallFinish[] =
    card.finishes.length > 0 ? card.finishes : ["nonfoil"];

  const legalities = card.legalities ? JSON.stringify(card.legalities) : null;

  return finishes.map(
    (finish): NormalizedCard => ({
      scryfall_id: `${card.id}:${finish}`,
      name_en,
      name_ja,
      set_code: card.set,
      collector_number: card.collector_number,
      finish,
      image_url,
      oracle_id: card.oracle_id,
      cached_at,
      legalities,
    })
  );
}

/** Extracts the original Scryfall UUID from a synthetic scryfall_id. */
export function extractScryfallUuid(syntheticId: string): string {
  const colonIndex = syntheticId.lastIndexOf(":");
  return colonIndex !== -1 ? syntheticId.slice(0, colonIndex) : syntheticId;
}
