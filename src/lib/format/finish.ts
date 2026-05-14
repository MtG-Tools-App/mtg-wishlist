export function finishLabel(finish: string): string {
  if (finish === "foil") return "Foil";
  if (finish === "etched") return "Etched";
  return "Non-foil";
}
