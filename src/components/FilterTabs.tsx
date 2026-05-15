"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FILTER_TABS } from "@/lib/format/formats";

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
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            current === tab.value
              ? "bg-cta text-cta-text"
              : "text-text-muted hover:text-text hover:bg-surface"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
