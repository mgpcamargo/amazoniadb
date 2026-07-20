import { readFile } from "node:fs/promises";
import vm from "node:vm";

const validCategories = new Set([
  "Forest & biodiversity",
  "Climate, water & air",
  "Land use & infrastructure",
  "Peoples, territories & culture",
  "Society, health & livelihoods",
  "Governance, rights & safeguards"
]);
const validCoverage = new Set(["Pan-Amazon", "Brazil", "Global — subsettable"]);
const validAccess = new Set(["Provider terms apply", "Dataset-specific license", "Publicly available"]);
const validKinds = new Set(["Dataset", "Data portal", "Download", "Explorer"]);
const requiredFields = ["id", "title", "provider", "category", "coverage", "formats", "access", "kind", "description", "url", "checked"];

const source = await readFile(new URL("../data/catalog.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "data/catalog.js" });
const catalog = context.window.AMAZONIA_CATALOG;
const issues = [];

if (!Array.isArray(catalog)) {
  issues.push("catalog.js must assign an array to window.AMAZONIA_CATALOG.");
}

const ids = new Set();
for (const [index, record] of (catalog || []).entries()) {
  const label = `Record ${index + 1}`;
  for (const field of requiredFields) {
    if (!(field in record) || record[field] === "" || record[field] == null) {
      issues.push(`${label}: missing ${field}.`);
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id || "")) issues.push(`${label}: id must be lowercase kebab-case.`);
  if (ids.has(record.id)) issues.push(`${label}: duplicate id ${record.id}.`);
  ids.add(record.id);
  if (!validCategories.has(record.category)) issues.push(`${label}: category is not one of the six approved domains.`);
  if (!validCoverage.has(record.coverage)) issues.push(`${label}: coverage is not in the controlled vocabulary.`);
  if (!validAccess.has(record.access)) issues.push(`${label}: access is not in the controlled vocabulary.`);
  if (!validKinds.has(record.kind)) issues.push(`${label}: kind is not in the controlled vocabulary.`);
  if (!Array.isArray(record.formats) || record.formats.length === 0) issues.push(`${label}: formats must be a non-empty array.`);
  if (!/^https:\/\//.test(record.url || "")) issues.push(`${label}: url must begin with https://.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.checked || "")) issues.push(`${label}: checked must use YYYY-MM-DD.`);
}

if (issues.length) {
  console.error(`Catalog validation failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}:`);
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`Catalog valid: ${catalog.length} records across ${validCategories.size} approved domains.`);
}
