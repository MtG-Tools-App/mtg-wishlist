import { searchCards, fetchJapaneseName } from "../src/lib/scryfall/client";
import type { NormalizedCard } from "../src/lib/scryfall/types";

function printCard(card: NormalizedCard, index: number) {
  console.log(`  [${index + 1}] name_en  : ${card.name_en}`);
  console.log(`       name_ja  : ${card.name_ja ?? "(none)"}`);
  console.log(`       set_code : ${card.set_code.toUpperCase()} #${card.collector_number}`);
  console.log(`       finish   : ${card.finish}`);
}

async function main() {
  // ── 1. English search ────────────────────────────────────────────────────
  console.log('── English search: "Lightning Bolt" ─────────────────────────');
  const enResults = await searchCards("Lightning Bolt");
  console.log(`   Total variants: ${enResults.length}`);
  if (enResults[0]) printCard(enResults[0], 0);

  // ── 2. Japanese search ───────────────────────────────────────────────────
  console.log('\n── Japanese search: "稲妻" ──────────────────────────────────');
  const jaResults = await searchCards("稲妻");
  console.log(`   Total variants: ${jaResults.length}`);
  jaResults.slice(0, 3).forEach(printCard);

  // ── 3. fetchJapaneseName (English result without name_ja) ────────────────
  const noJa = enResults.find((c) => c.name_ja === null);
  if (noJa) {
    console.log("\n── fetchJapaneseName fallback ───────────────────────────────");
    console.log(`   ${noJa.set_code.toUpperCase()} #${noJa.collector_number}`);
    const name_ja = await fetchJapaneseName(noJa.set_code, noJa.collector_number);
    console.log(`   name_en : ${noJa.name_en}`);
    console.log(`   name_ja : ${name_ja ?? "(no Japanese print)"}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
