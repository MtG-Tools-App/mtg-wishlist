import type { WishlistRow } from "@/lib/db/queries";

const LANG_LABEL: Record<string, string> = {
  en: "英語",
  ja: "日本語",
};

interface WgUrlInput {
  name_en: string;
  set_code: string;
  finish: string;
  // TODO: Option b — add cards.lang column and re-fetch on existing rows so lang can be surfaced here
  lang?: string | null;
  condition_min: string | null;
}

export function buildWisdomGuildUrl(item: WgUrlInput): string {
  const base = `http://wonder.wisdom-guild.net/price/${encodeURIComponent(item.name_en.split(" // ")[0])}/`;
  const params = new URLSearchParams();

  params.append("set[]", item.set_code.toUpperCase());

  if (item.finish === "foil" || item.finish === "etched") {
    params.append("quality[]", "foil");
  }

  if (item.lang && LANG_LABEL[item.lang]) {
    params.append("lang[]", LANG_LABEL[item.lang]);
  }

  if (item.condition_min) {
    params.set("state_code", item.condition_min);
  }

  params.set("stock_gt", "1");

  return `${base}?${params.toString()}`;
}

// Convenience overload accepting WishlistRow directly
export function buildWisdomGuildUrlFromRow(row: WishlistRow): string {
  return buildWisdomGuildUrl({
    name_en: row.name_en,
    set_code: row.set_code,
    finish: row.finish,
    lang: null,
    condition_min: row.condition_min,
  });
}
