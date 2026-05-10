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
  format_tag: "",
  condition_min: "",
  target_price: "",
  priority: "3",
  notes: "",
};

const ALL_FORMAT_OPTIONS = [
  { value: "modern",        label: "Modern" },
  { value: "legacy",        label: "Legacy" },
  { value: "pauper",        label: "Pauper" },
  { value: "premodern",     label: "Premodern" },
  { value: "middle_school", label: "Middle School" },
  { value: "other",         label: "その他" },
] as const;

function getFormatOptions(legalities: string | null) {
  if (!legalities) return ALL_FORMAT_OPTIONS;
  try {
    const parsed = JSON.parse(legalities) as Record<string, string>;
    return ALL_FORMAT_OPTIONS.filter((opt) => {
      if (opt.value === "other") return true;
      // Middle School is a Premodern subset and not a Scryfall format.
      if (opt.value === "middle_school") return parsed.premodern === "legal";
      return parsed[opt.value] === "legal";
    });
  } catch {
    return ALL_FORMAT_OPTIONS;
  }
}

function getDefaultFormatTag(legalities: string | null): string {
  if (!legalities) return "premodern";
  try {
    const parsed = JSON.parse(legalities) as Record<string, string>;
    return parsed.premodern === "legal" ? "premodern" : "other";
  } catch {
    return "premodern";
  }
}

type LangFilter = "all" | "ja" | "en";
type FinishFilter = "all" | "foil" | "nonfoil";

const LANG_OPTIONS: { value: LangFilter; label: string }[] = [
  { value: "all", label: "全言語" },
  { value: "ja", label: "日本語" },
  { value: "en", label: "英語" },
];

const FINISH_OPTIONS: { value: FinishFilter; label: string }[] = [
  { value: "all", label: "全種" },
  { value: "nonfoil", label: "通常" },
  { value: "foil", label: "Foil" },
];

function matchesLang(card: NormalizedCard, filter: LangFilter): boolean {
  if (filter === "all") return true;
  if (filter === "ja") return card.lang === "ja";
  // EN excludes JA explicitly; other foreign languages still pass.
  return card.lang !== "ja";
}

function matchesFinish(card: NormalizedCard, filter: FinishFilter): boolean {
  if (filter === "all") return true;
  if (filter === "foil") return card.finish === "foil" || card.finish === "etched";
  return card.finish === "nonfoil";
}

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
  const [langFilter, setLangFilter] = useState<LangFilter>("all");
  const [finishFilter, setFinishFilter] = useState<FinishFilter>("all");

  const filteredResults = results.filter(
    (c) => matchesLang(c, langFilter) && matchesFinish(c, finishFilter)
  );

  function cycleLang(direction: 1 | -1) {
    const idx = LANG_OPTIONS.findIndex((o) => o.value === langFilter);
    const next = (idx + direction + LANG_OPTIONS.length) % LANG_OPTIONS.length;
    setLangFilter(LANG_OPTIONS[next].value);
  }

  function cycleFinish(direction: 1 | -1) {
    const idx = FINISH_OPTIONS.findIndex((o) => o.value === finishFilter);
    const next = (idx + direction + FINISH_OPTIONS.length) % FINISH_OPTIONS.length;
    setFinishFilter(FINISH_OPTIONS[next].value);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setExpandedId(null);
    startSearch(async () => {
      const cards = await searchCardsAction(query);
      setResults(cards);
      setSearched(true);
    });
  }

  function handleExpand(id: string, legalities: string | null) {
    setExpandedId((prev) => (prev === id ? null : id));
    setFormState({ ...DEFAULT_FORM, format_tag: getDefaultFormatTag(legalities) });
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

      {/* Filters — visible only after a successful search */}
      {results.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <FilterStepper
            current={LANG_OPTIONS.find((o) => o.value === langFilter)!.label}
            onPrev={() => cycleLang(-1)}
            onNext={() => cycleLang(1)}
          />
          <FilterStepper
            current={FINISH_OPTIONS.find((o) => o.value === finishFilter)!.label}
            onPrev={() => cycleFinish(-1)}
            onNext={() => cycleFinish(1)}
          />
        </div>
      )}

      {/* Results */}
      {searched && filteredResults.length === 0 && !searchPending && (
        <p className="text-zinc-500 text-sm text-center py-8">
          カードが見つかりませんでした
        </p>
      )}

      {filteredResults.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filteredResults.map((card) => (
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
                  onClick={() => handleExpand(card.scryfall_id, card.legalities)}
                  className="text-xs shrink-0 px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  {expandedId === card.scryfall_id ? "閉じる" : "このカードを追加"}
                </button>
              </div>

              {/* Inline form */}
              {expandedId === card.scryfall_id && (
                <div className="border-t border-zinc-800 bg-zinc-950 p-3 flex flex-col gap-3">
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
                        {getFormatOptions(card.legalities).map((opt) => (
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

function FilterStepper({
  current,
  onPrev,
  onNext,
}: {
  current: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="inline-flex items-stretch rounded-md border border-zinc-700 overflow-hidden bg-zinc-900">
      <button
        type="button"
        onClick={onPrev}
        className="px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        aria-label="前の選択肢"
      >
        ◀
      </button>
      <span className="px-3 py-1 text-xs text-zinc-200 self-center min-w-[4em] text-center">
        {current}
      </span>
      <button
        type="button"
        onClick={onNext}
        className="px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        aria-label="次の選択肢"
      >
        ▶
      </button>
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
