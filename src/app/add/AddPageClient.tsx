"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchCardsAction, addToWishlistAction } from "@/lib/actions/cards";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { NormalizedCard } from "@/lib/scryfall/types";
import { FORMAT_OPTIONS, getFormatOptions, getDefaultFormatTag } from "@/lib/format/formats";
import { CardHeader } from "@/components/CardHeader";

type FormState = {
  format_tag: string;
  condition_min: string;
  target_price: string;
  notes: string;
};

const DEFAULT_FORM: FormState = {
  format_tag: "",
  condition_min: "",
  target_price: "",
  notes: "",
};


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
            className="flex-1 bg-surface border border-border text-text placeholder-text-subtle text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-modern"
            required
          />
          <button
            type="submit"
            disabled={searchPending}
            className="px-4 py-2 bg-cta hover:opacity-90 disabled:opacity-50 text-cta-text text-sm rounded-md transition-opacity shrink-0"
          >
            {searchPending ? "検索中…" : "検索"}
          </button>
        </form>
        <p className="text-xs text-text-subtle">例: Lightning Bolt または 稲妻</p>
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
        <p className="text-text-subtle text-sm text-center py-8">
          カードが見つかりませんでした
        </p>
      )}

      {filteredResults.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filteredResults.map((card) => (
            <li
              key={card.scryfall_id}
              className="bg-bg border border-border rounded-lg overflow-hidden"
            >
              {/* Card row */}
              <div className="flex gap-3 p-3 items-start">
                <CardHeader
                  imageUrl={card.image_url}
                  nameEn={card.name_en}
                  nameJa={card.name_ja}
                  finish={card.finish}
                >
                  <p className="text-text-subtle text-xs">
                    {card.set_code.toUpperCase()} #{card.collector_number}
                  </p>
                </CardHeader>
                <button
                  onClick={() => handleExpand(card.scryfall_id, card.legalities)}
                  className="text-xs shrink-0 px-2 py-1 rounded border border-border text-text-muted hover:border-modern hover:text-modern transition-colors"
                >
                  {expandedId === card.scryfall_id ? "閉じる" : "このカードを追加"}
                </button>
              </div>

              {/* Inline form */}
              {expandedId === card.scryfall_id && (
                <div className="border-t border-border bg-surface p-3 flex flex-col gap-3">
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
                        {getFormatOptions(card.legalities).map((opt) => (
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

                  <ErrorMessage error={addError} />

                  <button
                    onClick={() => handleAdd(card)}
                    disabled={addPending}
                    className="self-end px-4 py-2 bg-cta hover:opacity-90 disabled:opacity-50 text-cta-text text-sm rounded-md transition-opacity"
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
    <div className="inline-flex items-stretch rounded-md border border-border overflow-hidden bg-bg">
      <button
        type="button"
        onClick={onPrev}
        className="px-2 text-text-muted hover:text-text hover:bg-surface transition-colors"
        aria-label="前の選択肢"
      >
        ◀
      </button>
      <span className="px-3 py-1 text-xs text-text self-center min-w-[4em] text-center">
        {current}
      </span>
      <button
        type="button"
        onClick={onNext}
        className="px-2 text-text-muted hover:text-text hover:bg-surface transition-colors"
        aria-label="次の選択肢"
      >
        ▶
      </button>
    </div>
  );
}
