"use server";

import { revalidatePath } from "next/cache";
import { searchCards as scryfallSearch, fetchJapaneseName } from "@/lib/scryfall/client";
import { upsertCard, insertWishlistItem } from "@/lib/db/queries";
import { AddToWishlistSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "./types";
import type { NormalizedCard } from "@/lib/scryfall/types";

export async function searchCardsAction(
  query: string
): Promise<NormalizedCard[]> {
  if (!query.trim()) return [];
  return scryfallSearch(query);
}

export async function addToWishlistAction(data: {
  card: NormalizedCard;
  format_tag: string | null;
  condition_min: string | null;
  target_price: number | null;
  priority: number | null;
  notes: string | null;
}): Promise<ActionResult> {
  const parsed = AddToWishlistSchema.safeParse({
    scryfall_id: data.card.scryfall_id,
    format_tag: data.format_tag,
    condition_min: data.condition_min,
    target_price: data.target_price,
    priority: data.priority,
    notes: data.notes,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const name_ja =
      data.card.name_ja ??
      (await fetchJapaneseName(data.card.set_code, data.card.collector_number));

    await upsertCard({ ...data.card, name_ja });

    await insertWishlistItem({
      scryfall_id: parsed.data.scryfall_id,
      format_tag: parsed.data.format_tag,
      condition_min: parsed.data.condition_min,
      target_price: parsed.data.target_price,
      priority: parsed.data.priority,
      notes: parsed.data.notes,
      created_at: Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "不明なエラー" };
  }

  revalidatePath("/");
  return { ok: true };
}
