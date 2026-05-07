import { Suspense } from "react";
import Link from "next/link";
import { getWishlistItems, type WishlistRow } from "@/lib/db/queries";
import { FilterTabs } from "@/components/FilterTabs";
import { DeleteButton } from "@/components/DeleteButton";

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
      <p className="text-zinc-500 text-sm">ウィッシュリストは空です</p>
      <Link
        href="/add"
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md transition-colors"
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
      className={`bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex gap-3 transition-opacity${
        state === "sold-out" ? " opacity-60" : ""
      }`}
    >
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name_en}
          width={50}
          height={70}
          className="rounded shrink-0 object-cover self-start"
          loading="lazy"
        />
      ) : (
        <div className="w-[50px] h-[70px] bg-zinc-800 rounded shrink-0 flex items-center justify-center text-zinc-600 text-xs">
          N/A
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Card name */}
        <div>
          <p className="text-zinc-100 text-sm font-medium leading-tight truncate">
            {item.name_en}
          </p>
          {item.name_ja && (
            <p className="text-zinc-400 text-xs leading-tight">{item.name_ja}</p>
          )}
        </div>

        {/* Meta */}
        <p className="text-zinc-500 text-xs">
          {item.set_code.toUpperCase()} · {finishLabel(item.finish)}
          {item.priority != null && (
            <span className="ml-2 text-zinc-400">{stars(item.priority)}</span>
          )}
          {item.format_tag && (
            <span className="ml-2 text-zinc-600">{formatLabel(item.format_tag)}</span>
          )}
        </p>

        {/* Price section — 3 states */}
        <PriceSection item={item} state={state} />

        {/* Actions */}
        <div className="flex gap-2 mt-0.5 flex-wrap items-center">
          <a
            href={wgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Wisdom Guild ↗
          </a>
          <Link
            href={`/item/${item.id}/log`}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              state === "unconfirmed"
                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-indigo-600 ring-1 ring-indigo-200/40"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            価格を記録
          </Link>
          <DeleteButton id={item.id} name_en={item.name_en} />
        </div>
      </div>
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
        <span className="text-zinc-500">
          目標: <span className="text-zinc-300">{targetStr}</span>
        </span>
        <span className="text-zinc-500 italic">未確認</span>
      </div>
    );
  }

  if (state === "sold-out") {
    return (
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-zinc-500">
          目標: <span className="text-zinc-300">{targetStr}</span>
        </span>
        <span className="text-zinc-500 flex items-center gap-1.5 flex-wrap">
          最新:{" "}
          <span
            className={`line-through ${atTarget ? "text-indigo-400" : "text-zinc-300"}`}
          >
            {formatYen(item.latest_price!)}
          </span>
          <span className="bg-zinc-200 text-zinc-600 font-medium px-1.5 py-0.5 rounded">
            売り切れ
          </span>
          {item.latest_shop && (
            <span className="text-zinc-600">({item.latest_shop})</span>
          )}
        </span>
      </div>
    );
  }

  // Normal
  return (
    <div className="flex items-center gap-3 text-xs flex-wrap">
      <span className="text-zinc-500">
        目標: <span className="text-zinc-300">{targetStr}</span>
      </span>
      <span className="text-zinc-500">
        最新:{" "}
        <span className={atTarget ? "text-indigo-400 font-semibold" : "text-zinc-300"}>
          {formatYen(item.latest_price!)}
        </span>
        {item.latest_shop && (
          <span className="text-zinc-600 ml-1">({item.latest_shop})</span>
        )}
      </span>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatYen(price: number) {
  return `¥${price.toLocaleString("ja-JP")}`;
}

function finishLabel(finish: string) {
  return finish === "foil" ? "Foil" : finish === "etched" ? "Etched" : "Non-foil";
}

function stars(priority: number) {
  return "★".repeat(priority) + "☆".repeat(Math.max(0, 5 - priority));
}

function formatLabel(tag: string) {
  if (tag === "premodern") return "Premodern";
  if (tag === "middle_school") return "Middle School";
  return "Other";
}
