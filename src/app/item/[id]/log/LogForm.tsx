"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logPriceAction } from "@/lib/actions/priceLogs";
import { ErrorMessage } from "@/components/ErrorMessage";

const SHOPS = [
  { value: "hareruya", label: "hareruya" },
  { value: "bigmagic",  label: "bigmagic" },
  { value: "cardrush",  label: "cardrush" },
  { value: "surugaya",  label: "駿河屋" },
  { value: "mercari",   label: "mercari" },
  { value: "other",     label: "other" },
] as const;

const glassInput = {
  backgroundColor: "var(--color-glass)",
  backdropFilter: "blur(var(--blur-md))",
} as const;

export function LogForm({ wishlistItemId }: { wishlistItemId: number }) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [shop, setShop] = useState<string>(SHOPS[0].value);
  const [condition, setCondition] = useState("");
  const [url, setUrl] = useState("");
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) return;

    setError(null);
    startTransition(async () => {
      const result = await logPriceAction({
        wishlist_item_id: wishlistItemId,
        price: priceNum,
        shop,
        condition_actual: condition || null,
        url: url || null,
        available,
      });
      if (result.ok) {
        router.push("/");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-border rounded-[var(--radius-lg)] p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--color-glass)", backdropFilter: "blur(var(--blur-md))" }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-text-muted text-xs">価格</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-subtle text-sm">
              ¥
            </span>
            <input
              type="number"
              min={1}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1000"
              className="w-full border border-border text-text placeholder-text-fade text-sm rounded-[var(--radius-md)] px-2 py-1.5 pl-6 focus:outline-none focus:ring-1 focus:ring-accent-secondary"
              style={glassInput}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-text-muted text-xs">ショップ</span>
          <select
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            className="border border-border text-text text-sm rounded-[var(--radius-md)] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-secondary"
            style={glassInput}
          >
            {SHOPS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-text-muted text-xs">コンディション</span>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="border border-border text-text text-sm rounded-[var(--radius-md)] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-secondary"
            style={glassInput}
          >
            <option value="">— 未指定 —</option>
            <option value="NM">NM</option>
            <option value="EX">EX</option>
            <option value="GD">GD</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <span className="text-text-muted text-xs">URL (任意)</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="border border-border text-text placeholder-text-fade text-sm rounded-[var(--radius-md)] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-secondary"
            style={glassInput}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="w-4 h-4 rounded accent-accent-secondary"
        />
        <span className="text-text text-sm">在庫あり</span>
      </label>

      <ErrorMessage error={error} />

      <button
        type="submit"
        disabled={pending || !price}
        className="self-end px-4 py-2 bg-accent-primary hover:opacity-90 disabled:opacity-50 text-cta-text text-sm rounded-[var(--radius-md)] transition-opacity"
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
