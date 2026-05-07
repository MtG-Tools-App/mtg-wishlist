"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchCardsAction, addToWishlistAction } from "@/lib/actions/cards";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { NormalizedCard } from "@/lib/scryfall/types";

type FormState = {
  format_tag: string;
  condition_min: string;
  target_price: string;
  priority: string;
  notes: string;
};

const DEFAULT_FORM: FormState = {
  format_tag: "premodern",
  condition_min: "",
  target_price: "",
  priority: "3",
  notes: "",
};

export function AddPageClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedCard[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [searchPending, startSearch] = useTransition();
  const [addPending, startAdd] = useTransition();
  const [searched, setSearched] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setExpandedId(null);
    startSearch(async () => {
      const cards = await searchCardsAction(query);
      setResults(cards);
      setSearched(true);
    });
  }

  function handleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
    setFormState(DEFAULT_FORM);
    setAddError(null);
  }

  function handleAdd(card: NormalizedCard) {
    setAddError(null);
    startAdd(async () => {
      const result = await addToWishlistAction({
        card,
        format_tag: formState.format_tag || null,
        condition_min: formState.condition_min || null,
        target_price: formState.target_price ? Number(formState.target_price) : null,
        priority: formState.priority ? Number(formState.priority) : null,
        notes: formState.notes || null,
      });
      if (result.ok) {
        router.push("/");
      } else {
        setAddError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search form */}
      <div className="flex flex-col gap-1">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="カード名(英語または日本語)"
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={searchPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-md transition-colors shrink-0"
          >
            {searchPending ? "検索中…" : "検索"}
          </button>
        </form>
        <p className="text-xs text-zinc-500">例: Lightning Bolt または 稲妻</p>
      </div>

      {/* Results */}
      {searched && results.length === 0 && !searchPending && (
        <p className="text-zinc-500 text-sm text-center py-8">
          カードが見つかりませんでした
        </p>
      )}

      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((card) => (
            <li
              key={card.scryfall_id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
            >
              {/* Card row */}
              <div className="flex gap-3 p-3 items-start">
                {card.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.image_url}
                    alt={card.name_en}
                    width={50}
                    height={70}
                    className="rounded shrink-0 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-[50px] h-[70px] bg-zinc-800 rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-zinc-100 text-sm font-medium leading-tight">
                      {card.name_en}
                    </span>
                    <FinishBadge finish={card.finish} />
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {card.set_code.toUpperCase()} #{card.collector_number}
                  </p>
                </div>
                <button
                  onClick={() => handleExpand(card.scryfall_id)}
                  className="text-xs shrink-0 px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  {expandedId === card.scryfall_id ? "閉じる" : "このカードを追加"}
                </button>
              </div>

              {/* Inline form */}
              {expandedId === card.scryfall_id && (
                <div className="border-t border-zinc-800 bg-zinc-950 p-3 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-zinc-400 text-xs">フォーマット</span>
                      <select
                        value={formState.format_tag}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, format_tag: e.target.value }))
                        }
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">— なし —</option>
                        <option value="premodern">Premodern</option>
                        <option value="middle_school">Middle School</option>
                        <option value="other">Other</option>
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

                    <label className="flex flex-col gap-1">
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

                  <ErrorMessage error={addError} />

                  <button
                    onClick={() => handleAdd(card)}
                    disabled={addPending}
                    className="self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
                  >
                    {addPending ? "追加中…" : "追加"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FinishBadge({ finish }: { finish: string }) {
  if (finish === "foil") {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white font-medium shrink-0">
        Foil
      </span>
    );
  }
  if (finish === "etched") {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-indigo-300 text-indigo-900 font-medium shrink-0">
        Etched
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">
      通常
    </span>
  );
}
