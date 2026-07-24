// Generates api/catalog.json, a plain-JSON mirror of data/catalog.js, for
// anyone who wants to read the catalog without parsing JS. Regenerated
// automatically by .github/workflows/validate-catalog.yml on every push to
// main that touches the catalog — never edit api/catalog.json by hand,
// it will just be overwritten on the next push.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import vm from "node:vm";

const catalogUrl = new URL("../data/catalog.js", import.meta.url);
const outputUrl = new URL("../api/catalog.json", import.meta.url);

const source = await readFile(catalogUrl, "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const records = context.window.AMAZONIA_CATALOG || [];

const payload = {
  $schema: "https://mgpcamargo.github.io/amazoniadb/data/catalog.schema.json",
  generated: new Date().toISOString(),
  count: records.length,
  source: "https://mgpcamargo.github.io/amazoniadb/",
  license: "All rights reserved on this index. Each record links to its original provider, who holds their own rights over the underlying data — this JSON is a convenience mirror of AmazoniaDB's curated list, not a redistribution of provider data.",
  records
};

await mkdir(new URL("../api/", import.meta.url), { recursive: true });
await writeFile(outputUrl, JSON.stringify(payload, null, 2) + "\n");
console.log(`Wrote api/catalog.json with ${records.length} records.`);
