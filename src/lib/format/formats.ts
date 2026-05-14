export const FORMAT_OPTIONS = [
  { value: "modern",    label: "Modern" },
  { value: "legacy",    label: "Legacy" },
  { value: "pauper",    label: "Pauper" },
  { value: "premodern", label: "Premodern" },
  { value: "other",     label: "Other" },
] as const;

export const FILTER_TABS = [
  { label: "All",       value: "" },
  { label: "Modern",    value: "modern" },
  { label: "Legacy",    value: "legacy" },
  { label: "Pauper",    value: "pauper" },
  { label: "Premodern", value: "premodern" },
  { label: "Other",     value: "other" },
] as const;

const LABEL_MAP: Record<string, string> = {
  modern: "Modern",
  legacy: "Legacy",
  pauper: "Pauper",
  premodern: "Premodern",
  other: "Other",
};

export function formatLabel(tag: string): string {
  return LABEL_MAP[tag] ?? "Other";
}

export function getFormatOptions(legalities: string | null) {
  if (!legalities) return FORMAT_OPTIONS;
  try {
    const parsed = JSON.parse(legalities) as Record<string, string>;
    return FORMAT_OPTIONS.filter((opt) => {
      if (opt.value === "other") return true;
      return parsed[opt.value] === "legal";
    });
  } catch {
    return FORMAT_OPTIONS;
  }
}

export function getDefaultFormatTag(legalities: string | null): string {
  if (!legalities) return "";
  try {
    const parsed = JSON.parse(legalities) as Record<string, string>;
    for (const opt of FORMAT_OPTIONS) {
      if (opt.value === "other") continue;
      if (parsed[opt.value] === "legal") return opt.value;
    }
    return "other";
  } catch {
    return "";
  }
}
