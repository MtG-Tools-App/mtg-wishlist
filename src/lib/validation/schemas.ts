import { z } from "zod";

export const AddToWishlistSchema = z.object({
  scryfall_id: z.string().min(1),
  format_tag: z.enum(["premodern", "modern", "pauper", "legacy", "other"]).nullable(),
  condition_min: z.enum(["NM", "EX", "GD"]).nullable(),
  target_price: z.number().int().nonnegative().nullable(),
  notes: z.string().max(500).nullable(),
});

export const DeleteWishlistItemSchema = z.object({
  id: z.number().int().positive(),
});

export const UpdateWishlistItemSchema = z.object({
  id: z.number().int().positive(),
  format_tag: z.enum(["premodern", "modern", "pauper", "legacy", "other"]).nullable(),
  condition_min: z.enum(["NM", "EX", "GD"]).nullable(),
  target_price: z.number().int().nonnegative().nullable(),
  notes: z.string().max(500).nullable(),
});

export const LogPriceSchema = z.object({
  wishlist_item_id: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  shop: z.enum(["hareruya", "bigmagic", "cardrush", "surugaya", "mercari", "other"]),
  condition_actual: z.enum(["NM", "EX", "GD"]).nullable(),
  url: z.string().url().nullable().or(z.literal("")),
  available: z.boolean(),
});
