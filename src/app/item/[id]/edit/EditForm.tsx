"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWishlistItemAction } from "@/lib/actions/cards";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { WishlistRow } from "@/lib/db/queries";
import { getFormatOptions } from "@/lib/format/formats";

export function EditForm({ item }: { item: WishlistRow }) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    format_tag: item.format_tag ?? "",
    condition_min: item.condition_min ?? "",
    target_price: item.target_price?.toString() ?? "",
    notes: item.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateWishlistItemAction({
        id: item.id,
        format_tag: formState.format_tag || null,
        condition_min: formState.condition_min || null,
        target_price: formState.target_price ? Number(formState.target_price) : null,
        notes: formState.notes || null,
      });
      if (result.ok) {
        router.push("/");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-text-muted text-xs">使用フォーマット</span>
          <select
            value={formState.format_tag}
            onChange={(e) =>
              setFormState((s) => ({ ...s, format_tag: e.target.value }))
            }
            className="bg-bg border border-border text-text text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-modern"
          >
            <option value="">選択してください</option>
            {getFormatOptions(item.legalities).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-text-muted text-xs">最低コンディション</span>
          <select
            value={formState.condition_min}
            onChange={(e) =>
              setFormState((s) => ({ ...s, condition_min: e.target.value }))
            }
            className="bg-bg border border-border text-text text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-modern"
          >
            <option value="">— 問わない —</option>
            <option value="NM">NM</option>
            <option value="EX">EX</option>
            <option value="GD">GD</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-text-muted text-xs">目標価格 (¥)</span>
          <input
            type="number"
            min={0}
            value={formState.target_price}
            onChange={(e) =>
              setFormState((s) => ({ ...s, target_price: e.target.value }))
            }
            placeholder="例: 800"
            className="bg-bg border border-border text-text placeholder-text-fade text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-modern"
          />
        </label>

      </div>

      <label className="flex flex-col gap-1">
        <span className="text-text-muted text-xs">メモ</span>
        <textarea
          value={formState.notes}
          onChange={(e) =>
            setFormState((s) => ({ ...s, notes: e.target.value }))
          }
          rows={2}
          placeholder="自由記入"
          className="bg-bg border border-border text-text placeholder-text-fade text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-modern resize-none"
        />
      </label>

      <ErrorMessage error={error} />

      <button
        type="submit"
        disabled={pending}
        className="self-end px-4 py-2 bg-cta hover:opacity-90 disabled:opacity-50 text-cta-text text-sm rounded-md transition-opacity"
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
