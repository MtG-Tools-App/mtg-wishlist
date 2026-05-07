"use server";

import { revalidatePath } from "next/cache";
import { insertPriceLog } from "@/lib/db/queries";
import { LogPriceSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "./types";

export async function logPriceAction(data: {
  wishlist_item_id: number;
  price: number;
  shop: string;
  condition_actual: string | null;
  url: string | null;
  available: boolean;
}): Promise<ActionResult> {
  const parsed = LogPriceSchema.safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    await insertPriceLog({
      wishlist_item_id: parsed.data.wishlist_item_id,
      price: parsed.data.price,
      shop: parsed.data.shop,
      condition_actual: parsed.data.condition_actual,
      url: parsed.data.url || null,
      available: parsed.data.available ? 1 : 0,
      logged_at: Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "不明なエラー" };
  }

  revalidatePath("/");
  return { ok: true };
}
