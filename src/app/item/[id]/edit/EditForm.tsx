"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWishlistItemAction } from "@/lib/actions/cards";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { WishlistRow } from "@/lib/db/queries";

const ALL_FORMAT_OPTIONS = [
  { value: "premodern",     label: "Premodern" },
  { value: "middle_school", label: "Middle School" },
  { value: "modern",        label: "Modern" },
  { value: "pauper",        label: "Pauper" },
  { value: "legacy",        label: "Legacy" },
  { value: "other",         label: "その他" },
] as const;

function getFormatOptions(legalities: string | null) {
  if (!legalities) return ALL_FORMAT_OPTIONS;
  try {
    const parsed = JSON.parse(legalities) as Record<string, string>;
    return ALL_FORMAT_OPTIONS.filter((opt) => {
      if (opt.value === "other") return true;
      if (opt.value === "middle_school") return parsed.premodern === "legal";
      return parsed[opt.value] === "legal";
    });
  } catch {
    return ALL_FORMAT_OPTIONS;
  }
}

export function EditForm({ item }: { item: WishlistRow }) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    format_tag: item.format_tag ?? "",
    condition_min: item.condition_min ?? "",
    target_price: item.target_price?.toString() ?? "",
    priority: item.priority?.toString() ?? "3",
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
        priority: formState.priority ? Number(formState.priority) : null,
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
          <span className="text-zinc-400 text-xs">使用フォーマット</span>
          <select
            value={formState.format_tag}
            onChange={(e) =>
              setFormState((s) => ({ ...s, format_tag: e.target.value }))
            }
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          <span className="text-zinc-400 text-xs">最低コンディション</span>
          <select
            value={formState.condition_min}
            onChange={(e) =>
              setFormState((s) => ({ ...s, condition_min: e.target.value }))
            }
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">— 問わない —</option>
            <option value="NM">NM</option>
            <option value="EX">EX</option>
            <option value="GD">GD</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-zinc-400 text-xs">目標価格 (¥)</span>
          <input
            type="number"
            min={0}
            value={formState.target_price}
            onChange={(e) =>
              setFormState((s) => ({ ...s, target_price: e.target.value }))
            }
            placeholder="例: 800"
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-zinc-400 text-xs">優先度</span>
          <select
            value={formState.priority}
            onChange={(e) =>
              setFormState((s) => ({ ...s, priority: e.target.value }))
            }
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}{"☆".repeat(5 - n)} ({n})
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-zinc-400 text-xs">メモ</span>
        <textarea
          value={formState.notes}
          onChange={(e) =>
            setFormState((s) => ({ ...s, notes: e.target.value }))
          }
          rows={2}
          placeholder="自由記入"
          className="bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </label>

      <ErrorMessage error={error} />

      <button
        type="submit"
        disabled={pending}
        className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
