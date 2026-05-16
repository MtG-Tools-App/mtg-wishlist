import { Suspense } from "react";
import Link from "next/link";
import { getWishlistItems, getFormatCounts, type WishlistRow } from "@/lib/db/queries";
import { FilterTabs } from "@/components/FilterTabs";
import { DeleteButton } from "@/components/DeleteButton";
import { CardHeader } from "@/components/CardHeader";
import { buildWisdomGuildUrlFromRow } from "@/lib/format/wisdomGuild";
import type { ScryfallFinish } from "@/lib/scryfall/types";

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const { format } = await searchParams;
  const [items, counts] = await Promise.all([
    getWishlistItems(format ?? null),
    getFormatCounts(),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Suspense>
        <FilterTabs counts={counts} />
      </Suspense>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <WishlistCard key={item.id} item={item} index={idx} total={items.length} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-text-muted text-sm">ウィッシュリストは空です</p>
      <Link
        href="/add"
        className="px-4 py-2 bg-accent-primary hover:opacity-90 text-cta-text text-sm rounded-[var(--radius-md)] transition-opacity"
      >
        カードを追加する
      </Link>
    </div>
  );
}

// ── State helper ──────────────────────────────────────────────────────────────

type CardState = "normal" | "sold-out" | "unconfirmed";

function getCardState(item: WishlistRow): CardState {
  if (item.latest_price === null) return "unconfirmed";
  if (item.latest_available === 0) return "sold-out";
  return "normal";
}

// ── WishlistCard ──────────────────────────────────────────────────────────────

function WishlistCard({ item, index, total }: { item: WishlistRow; index: number; total: number }) {
  const state = getCardState(item);
  const wgUrl = buildWisdomGuildUrlFromRow(item);
  const barColor = formatBarColor(item.format_tag);

  return (
    <li
      className={`relative border border-border rounded-[var(--radius-lg)] p-3 pl-4 flex gap-3 transition-opacity${
        state === "sold-out" ? " opacity-60" : ""
      }`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-surface) 85%, transparent)",
        backdropFilter: "blur(var(--blur-md))",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {barColor && (
        <span
          aria-hidden
          className="absolute left-0 top-2 bottom-2 w-[4px] rounded-full"
          style={{ backgroundColor: barColor }}
        />
      )}

      <CardHeader
        imageUrl={item.image_url}
        nameEn={item.name_en}
        nameJa={item.name_ja}
        finish={item.finish as ScryfallFinish}
        onSurface
      >
        <p className="text-xs" style={{ color: "var(--color-surface-subtle)" }}>
          {item.set_code.toUpperCase()} #{item.collector_number}
        </p>

        <p className="text-xs" style={{ color: "var(--color-surface-subtle)" }}>
          目標:{" "}
          <span style={{ color: "var(--color-surface-text)" }}>
            {item.target_price != null
              ? `¥${item.target_price.toLocaleString("ja-JP")}`
              : "—"}
          </span>
        </p>

        <div className="flex gap-2 mt-1 flex-wrap items-center">
          <a
            href={wgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-secondary hover:opacity-80 transition-opacity"
          >
            WG ↗
          </a>
          <Link
            href={`/item/${item.id}/edit`}
            className="text-xs px-2 py-0.5 rounded-[var(--radius-sm)] transition-colors"
            style={{
              backgroundColor: "var(--color-glass)",
              backdropFilter: "blur(var(--blur-sm))",
              color: "var(--color-surface-text)",
            }}
          >
            編集
          </Link>
          <DeleteButton id={item.id} name_en={item.name_en} />
        </div>
      </CardHeader>
    </li>
  );
}

function formatBarColor(tag: string | null): string | null {
  if (!tag || tag === "other") return null;
  return `var(--color-${tag})`;
}
