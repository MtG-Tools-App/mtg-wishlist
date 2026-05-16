"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FILTER_TABS } from "@/lib/format/formats";
import type { FormatCount } from "@/lib/db/queries";

const ACTIVE_STYLE: Record<string, React.CSSProperties> = {
  "":         { backgroundColor: "var(--color-glass-strong)", color: "var(--color-text)", fontWeight: 700 },
  modern:     { backgroundColor: "color-mix(in srgb, var(--color-modern) 80%, transparent)", color: "var(--color-text)" },
  legacy:     { backgroundColor: "color-mix(in srgb, var(--color-legacy) 80%, transparent)", color: "var(--color-text)" },
  pauper:     { backgroundColor: "var(--color-pauper)", color: "var(--color-text)" },
  premodern:  { backgroundColor: "color-mix(in srgb, var(--color-premodern) 80%, transparent)", color: "var(--color-text)" },
  other:      { backgroundColor: "var(--color-other)", color: "var(--color-text)" },
};

export function FilterTabs({ counts }: { counts: FormatCount[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("format") ?? "";

  const total = counts.reduce((sum, c) => sum + c.count, 0);

  const countMap: Record<string, number> = {};
  for (const { format_tag, count } of counts) {
    const key = format_tag ?? "other";
    countMap[key] = (countMap[key] ?? 0) + count;
  }

  const visibleTabs = FILTER_TABS.filter((tab) => {
    if (tab.value === "") return total > 0;
    return (countMap[tab.value] ?? 0) > 0;
  });

  function handleTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("format", value);
    else params.delete("format");
    router.push(`/?${params.toString()}`);
  }

  if (visibleTabs.length === 0) return null;

  return (
    <div className="flex gap-1 mb-4 flex-wrap">
      {visibleTabs.map((tab) => {
        const active = current === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => handleTab(tab.value)}
            style={
              active
                ? { ...ACTIVE_STYLE[tab.value], backdropFilter: "blur(var(--blur-md))" }
                : undefined
            }
            className={
              active
                ? "px-3 py-1.5 text-xs rounded-[var(--radius-full)] font-medium transition-colors"
                : "px-3 py-1.5 text-xs rounded-[var(--radius-full)] font-medium text-text-muted hover:bg-glass hover:text-text transition-colors duration-[150ms]"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
