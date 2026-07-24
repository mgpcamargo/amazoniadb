// Regenerates data/catalog.json from data/catalog.js.
//
// catalog.js exists for the site itself (loaded as a plain <script> tag, no
// build step). catalog.json exists so anyone — a research script, a notebook,
// `curl` — can pull the whole directory with a single GET, no JS execution
// required: https://mgpcamargo.github.io/amazoniadb/data/catalog.json
//
// Run this after any edit to data/catalog.js:
//   node scripts/build-catalog-json.mjs
//
// If this project ever wants that guarantee enforced rather than just
// requested, wiring a call to this script into validate-catalog.yml (failing
// the check if catalog.json is out of date) would close the loop.

import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../data/catalog.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "data/catalog.js" });
const catalog = context.window.AMAZONIA_CATALOG;

if (!Array.isArray(catalog)) {
  throw new Error("catalog.js must assign an array to window.AMAZONIA_CATALOG.");
}

const outUrl = new URL("../data/catalog.json", import.meta.url);
await writeFile(outUrl, JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log(`Wrote data/catalog.json (${catalog.length} records).`);
