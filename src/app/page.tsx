import { Suspense } from "react";
import Link from "next/link";
import { getWishlistItems, type WishlistRow } from "@/lib/db/queries";
import { FilterTabs } from "@/components/FilterTabs";
import { DeleteButton } from "@/components/DeleteButton";
import { CardHeader } from "@/components/CardHeader";
import type { ScryfallFinish } from "@/lib/scryfall/types";

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  const { format } = await searchParams;
  const items = await getWishlistItems(format ?? null);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Suspense>
        <FilterTabs />
      </Suspense>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-text-subtle text-sm">ウィッシュリストは空です</p>
      <Link
        href="/add"
        className="px-4 py-2 bg-cta hover:opacity-90 text-cta-text text-sm rounded-md transition-opacity"
      >
        カードを追加する
      </Link>
    </div>
  );
}

// ── State helpers ─────────────────────────────────────────────────────────────

type CardState = "normal" | "sold-out" | "unconfirmed";

function getCardState(item: WishlistRow): CardState {
  if (item.latest_price === null) return "unconfirmed";
  if (item.latest_available === 0) return "sold-out";
  return "normal";
}

// ── WishlistCard ──────────────────────────────────────────────────────────────

function WishlistCard({ item }: { item: WishlistRow }) {
  const state = getCardState(item);
  const wgUrl = `http://whisper.wisdom-guild.net/card/${encodeURIComponent(
    item.name_en.split(" // ")[0]
  )}`;

  return (
    <li
      className={`bg-bg border border-border rounded-lg p-3 flex gap-3 transition-opacity${
        state === "sold-out" ? " opacity-60" : ""
      }`}
    >
      <CardHeader
        imageUrl={item.image_url}
        nameEn={item.name_en}
        nameJa={item.name_ja}
        finish={item.finish as ScryfallFinish}
      >
        <p className="text-text-subtle text-xs">
          {item.set_code.toUpperCase()} #{item.collector_number}
        </p>

        <PriceSection item={item} state={state} />

        <div className="flex gap-2 mt-1 flex-wrap items-center">
          <a
            href={wgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-modern hover:opacity-80 transition-opacity"
          >
            Wisdom Guild ↗
          </a>
          <Link
            href={`/item/${item.id}/edit`}
            className="text-xs px-2 py-0.5 rounded bg-surface hover:bg-border text-text transition-colors"
          >
            編集
          </Link>
          <DeleteButton id={item.id} name_en={item.name_en} />
        </div>
      </CardHeader>
    </li>
  );
}

// ── Price section ─────────────────────────────────────────────────────────────

function PriceSection({ item, state }: { item: WishlistRow; state: CardState }) {
  const targetStr = item.target_price != null ? formatYen(item.target_price) : "—";
  const atTarget =
    item.target_price != null &&
    item.latest_price != null &&
    item.latest_price <= item.target_price;

  if (state === "unconfirmed") {
    return (
      <div className="flex items-center gap-3 text-xs flex-wrap">
        <span className="text-text-subtle">
          目標: <span className="text-text">{targetStr}</span>
        </span>
        <span className="text-text-subtle italic">未確認</span>
      </div>
    );
  }

  if (state === "sold-out") {
    return (
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-text-subtle">
          目標: <span className="text-text">{targetStr}</span>
        </span>
        <span className="text-text-subtle flex items-center gap-1.5 flex-wrap">
          最新:{" "}
          <span className={`line-through ${atTarget ? "text-modern" : "text-text"}`}>
            {formatYen(item.latest_price!)}
          </span>
          <span className="bg-surface border border-border text-text-muted font-medium px-1.5 py-0.5 rounded">
            売り切れ
          </span>
          {item.latest_shop && (
            <span className="text-text-fade">({item.latest_shop})</span>
          )}
        </span>
      </div>
    );
  }

  // Normal
  return (
    <div className="flex items-center gap-3 text-xs flex-wrap">
      <span className="text-text-subtle">
        目標: <span className="text-text">{targetStr}</span>
      </span>
      <span className="text-text-subtle">
        最新:{" "}
        <span className={atTarget ? "text-modern font-semibold" : "text-text"}>
          {formatYen(item.latest_price!)}
        </span>
        {item.latest_shop && (
          <span className="text-text-fade ml-1">({item.latest_shop})</span>
        )}
      </span>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatYen(price: number) {
  return `¥${price.toLocaleString("ja-JP")}`;
}
