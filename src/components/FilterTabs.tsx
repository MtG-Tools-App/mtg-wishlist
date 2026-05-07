"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { label: "All", value: "" },
  { label: "Premodern", value: "premodern" },
  { label: "Middle School", value: "middle_school" },
  { label: "Other", value: "other" },
] as const;

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
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTab(tab.value)}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            current === tab.value
              ? "bg-indigo-600 text-white"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
