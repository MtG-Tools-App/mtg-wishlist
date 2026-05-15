"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FILTER_TABS } from "@/lib/format/formats";

const ACTIVE_BG: Record<string, string> = {
  "":         "var(--color-other)",
  modern:     "var(--color-modern)",
  legacy:     "var(--color-legacy)",
  pauper:     "var(--color-pauper)",
  premodern:  "var(--color-premodern)",
  other:      "var(--color-other)",
};

const ACTIVE_FG: Record<string, string> = {
  "":         "var(--color-text)",
  modern:     "var(--color-modern-on)",
  legacy:     "var(--color-legacy-on)",
  pauper:     "var(--color-pauper-on)",
  premodern:  "var(--color-premodern-on)",
  other:      "var(--color-other-on)",
};

export function FilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("format") ?? "";

  function handleTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("format", value);
    else params.delete("format");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 mb-4 flex-wrap">
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTab(tab.value)}
          style={
            current === tab.value
              ? { backgroundColor: ACTIVE_BG[tab.value], color: ACTIVE_FG[tab.value] }
              : undefined
          }
          className={
            current === tab.value
              ? "px-3 py-1.5 text-xs rounded-md font-medium"
              : "px-3 py-1.5 text-xs rounded-md font-medium text-text-muted hover:text-text hover:bg-surface transition-colors"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
