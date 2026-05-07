"use server";

import { revalidatePath } from "next/cache";
import { deleteWishlistItem } from "@/lib/db/queries";
import { DeleteWishlistItemSchema } from "@/lib/validation/schemas";
import type { ActionResult } from "./types";

export async function deleteWishlistItemAction(id: number): Promise<ActionResult> {
  const parsed = DeleteWishlistItemSchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await deleteWishlistItem(parsed.data.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "不明なエラー" };
  }

  revalidatePath("/");
  return { ok: true };
}
