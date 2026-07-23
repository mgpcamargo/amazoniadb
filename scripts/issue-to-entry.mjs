// Reads the parsed issue-form JSON (stefanbuck/github-issue-parser's
// `jsonString` output, passed in via the ISSUEFORM_JSON env var), builds a
// catalog entry from it, and appends it to data/catalog.js.
//
// Also reads SUBMITTED_BY (source-submission.yml passes in
// github.event.issue.user.login) and embeds it as record.submittedBy. Its
// presence is what marks a card as community-submitted rather than
// editorially reviewed on the front end, and drives the card's credit line.
//
// Runs inside .github/workflows/source-submission.yml, immediately before
// validate-catalog.mjs and create-pull-request — if this script exits
// non-zero, no PR is opened.
//
// Reuses the same slugify/serialization approach as submit.js so entries
// added via the issue form look identical to ones added via submit.html.

import { readFile, writeFile, appendFile } from "node:fs/promises";
import vm from "node:vm";

const catalogUrl = new URL("../data/catalog.js", import.meta.url);

const slugify = (value) =>
  value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);

const toCatalogObject = (record) => {
  const lines = [
    `    id: ${JSON.stringify(record.id)},`,
    `    title: ${JSON.stringify(record.title)},`,
    `    provider: ${JSON.stringify(record.provider)},`,
    `    category: ${JSON.stringify(record.category)},`,
    `    coverage: ${JSON.stringify(record.coverage)},`,
    `    formats: ${JSON.stringify(record.formats)},`,
    `    access: ${JSON.stringify(record.access)},`,
    `    kind: ${JSON.stringify(record.kind)},`,
    `    description: ${JSON.stringify(record.description)},`,
    `    url: ${JSON.stringify(record.url)},`,
    `    checked: ${JSON.stringify(record.checked)}${record.submittedBy ? "," : ""}`
  ];
  if (record.submittedBy) lines.push(`    submittedBy: ${JSON.stringify(record.submittedBy)}`);
  return `  {\n${lines.join("\n")}\n  }`;
};

const raw = process.env.ISSUEFORM_JSON;
if (!raw) {
  console.error("ISSUEFORM_JSON was not set — nothing to build.");
  process.exit(1);
}

let fields;
try {
  fields = JSON.parse(raw);
} catch (err) {
  console.error("ISSUEFORM_JSON was not valid JSON:", err.message);
  process.exit(1);
}

const title = (fields.title || "").trim();
const record = {
  id: slugify(title),
  title,
  provider: (fields.provider || "").trim(),
  category: (fields.category || "").trim(),
  coverage: (fields.coverage || "").trim(),
  formats: (fields.formats || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  access: (fields.access || "").trim(),
  kind: (fields.kind || "").trim(),
  description: (fields.description || "").trim(),
  url: (fields.url || "").trim(),
  checked: new Date().toISOString().slice(0, 10)
};

const missing = Object.entries(record)
  .filter(([key, value]) => key !== "formats" && !value)
  .map(([key]) => key);
if (missing.length) {
  console.error("Missing required field(s):", missing.join(", "));
  process.exit(1);
}
if (!record.formats.length) {
  console.error("Data forms field parsed to an empty list.");
  process.exit(1);
}

const submittedBy = (process.env.SUBMITTED_BY || "").trim();
if (submittedBy) record.submittedBy = submittedBy;

const source = await readFile(catalogUrl, "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const existing = context.window.AMAZONIA_CATALOG || [];

if (existing.some((entry) => entry.id === record.id)) {
  record.id = `${record.id}-${existing.length + 1}`;
}

const all = [...existing, record];
const output = `window.AMAZONIA_CATALOG = [\n${all.map(toCatalogObject).join(",\n")}\n];\n`;

await writeFile(catalogUrl, output, "utf8");
console.log(`Added "${record.title}" as ${record.id}.`);

const ghOutput = process.env.GITHUB_OUTPUT;
if (ghOutput) {
  await appendFile(ghOutput, `title=${record.title}\nslug=${record.id}\n`);
}
