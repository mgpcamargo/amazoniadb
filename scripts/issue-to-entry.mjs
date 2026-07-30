// Reads the parsed issue-form JSON (stefanbuck/github-issue-parser's
// `jsonString` output, passed in via the ISSUEFORM_JSON env var), builds a
// catalog entry from it, and appends it to data/catalog.js together with the
// required Portuguese and Spanish display translations.
//
// Also reads SUBMITTED_BY (source-submission.yml passes in
// github.event.issue.user.login) and embeds it as record.submittedBy for
// review provenance. It is deliberately not presented as a public quality
// tier: every submission still needs editorial review.
//
// Runs inside .github/workflows/source-submission.yml, immediately before the
// API build, quality gate, and create-pull-request step — if this script exits
// non-zero, no PR is opened.
//
// Reuses the same slugify/serialization approach as submit.js so entries
// added via the issue form look identical to ones added via submit.html.

import { readFile, writeFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const toFileUrl = (envPath, fallback) => envPath ? pathToFileURL(resolve(envPath)) : fallback;
const catalogUrl = toFileUrl(process.env.CATALOG_PATH, new URL("../data/catalog.js", import.meta.url));
const i18nUrl = toFileUrl(process.env.I18N_PATH, new URL("../data/catalog.i18n.js", import.meta.url));

const slugify = (value) =>
  value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);

// Optional fields are appended only when present, in this order. Listed
// separately from the required lines below so adding another optional
// field later is a one-line change here, not a hand-placed comma.
const OPTIONAL_RECORD_KEYS = ["temporalCoverage", "spatialResolution", "license", "methodologyUrl", "submittedBy"];

const toCatalogObject = (record) => {
  const requiredLines = [
    `    id: ${JSON.stringify(record.id)}`,
    `    title: ${JSON.stringify(record.title)}`,
    `    provider: ${JSON.stringify(record.provider)}`,
    `    category: ${JSON.stringify(record.category)}`,
    `    coverage: ${JSON.stringify(record.coverage)}`,
    `    formats: ${JSON.stringify(record.formats)}`,
    `    access: ${JSON.stringify(record.access)}`,
    `    kind: ${JSON.stringify(record.kind)}`,
    `    description: ${JSON.stringify(record.description)}`,
    `    url: ${JSON.stringify(record.url)}`,
    `    checked: ${JSON.stringify(record.checked)}`
  ];
  const optionalLines = OPTIONAL_RECORD_KEYS
    .filter((key) => record[key])
    .map((key) => `    ${key}: ${JSON.stringify(record[key])}`);
  return `  {\n${[...requiredLines, ...optionalLines].join(",\n")}\n  }`;
};

const findObjectEnd = (source, start) => {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("Could not find the end of an i18n object.");
};

const insertI18nEntry = (source, locale, section, key, value) => {
  const localeStart = source.indexOf(`  ${JSON.stringify(locale)}: {`);
  if (localeStart < 0) throw new Error(`Could not find ${locale} translations.`);
  const sectionStart = source.indexOf(`    ${section}: {`, localeStart);
  if (sectionStart < 0) throw new Error(`Could not find ${locale}.${section}.`);
  const objectStart = source.indexOf("{", sectionStart);
  const objectEnd = findObjectEnd(source, objectStart);
  const content = source.slice(objectStart + 1, objectEnd).trim();
  const beforeEnd = source.slice(0, objectEnd).replace(/\s*$/, "");
  const insertion = `${content ? "," : ""}\n      ${JSON.stringify(key)}: ${JSON.stringify(value)}`;
  return `${beforeEnd}${insertion}\n    ${source.slice(objectEnd)}`;
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
const localizedDescriptions = {
  "pt-BR": (fields.description_pt_br || "").trim(),
  es: (fields.description_es || "").trim()
};
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
const missingDescriptions = Object.entries(localizedDescriptions)
  .filter(([, value]) => !value)
  .map(([locale]) => locale);
if (missingDescriptions.length) {
  console.error("Missing required localized description(s):", missingDescriptions.join(", "));
  process.exit(1);
}

// Optional enrichment fields. Read after the required-field check above on
// purpose: attaching them to `record` any earlier would make a blank
// optional field fail as though it were a missing required one.
const temporalCoverage = (fields.temporal_coverage || "").trim();
if (temporalCoverage) record.temporalCoverage = temporalCoverage;
const spatialResolution = (fields.spatial_resolution || "").trim();
const localizedSpatialResolution = {
  "pt-BR": (fields.spatial_resolution_pt_br || "").trim(),
  es: (fields.spatial_resolution_es || "").trim()
};
if (spatialResolution) {
  const missingSpatialTranslations = Object.entries(localizedSpatialResolution)
    .filter(([, value]) => !value)
    .map(([locale]) => locale);
  if (missingSpatialTranslations.length) {
    console.error("A spatial resolution needs translations for:", missingSpatialTranslations.join(", "));
    process.exit(1);
  }
  record.spatialResolution = spatialResolution;
} else if (Object.values(localizedSpatialResolution).some(Boolean)) {
  console.error("Spatial-resolution translations were provided without a source spatial resolution.");
  process.exit(1);
}
const methodologyUrl = (fields.methodology_url || "").trim();
if (methodologyUrl) record.methodologyUrl = methodologyUrl;
const license = (fields.license || "").trim();
if (license) record.license = license;

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

const i18nSource = await readFile(i18nUrl, "utf8");
const i18nContext = { window: {} };
vm.runInNewContext(i18nSource, i18nContext);
const i18n = i18nContext.window.AMAZONIA_CATALOG_I18N;
if (!i18n?.["pt-BR"]?.descriptions || !i18n?.es?.descriptions) {
  console.error("data/catalog.i18n.js does not expose the expected localized description maps.");
  process.exit(1);
}

let i18nOutput = i18nSource;
for (const locale of ["pt-BR", "es"]) {
  if (i18n[locale].descriptions[record.id]) {
    console.error(`A ${locale} description already exists for ${record.id}.`);
    process.exit(1);
  }
  if (spatialResolution) {
    const existingResolution = i18n[locale].spatialResolution?.[spatialResolution];
    if (existingResolution && existingResolution !== localizedSpatialResolution[locale]) {
      console.error(`The ${locale} translation for ${spatialResolution} conflicts with the existing catalog translation.`);
      process.exit(1);
    }
    if (!existingResolution) {
      i18nOutput = insertI18nEntry(i18nOutput, locale, "spatialResolution", spatialResolution, localizedSpatialResolution[locale]);
    }
  }
  i18nOutput = insertI18nEntry(i18nOutput, locale, "descriptions", record.id, localizedDescriptions[locale]);
}

try {
  vm.runInNewContext(output, { window: {} });
  vm.runInNewContext(i18nOutput, { window: {} });
} catch (error) {
  console.error("Generated catalog or translation output is invalid:", error.message);
  process.exit(1);
}

if (process.env.DRY_RUN === "1") {
  console.log(`Validated "${record.title}" as ${record.id} without writing files.`);
} else {
  await Promise.all([
    writeFile(catalogUrl, output, "utf8"),
    writeFile(i18nUrl, i18nOutput, "utf8")
  ]);
  console.log(`Added "${record.title}" as ${record.id}.`);
}

const ghOutput = process.env.GITHUB_OUTPUT;
if (ghOutput) {
  await appendFile(ghOutput, `title=${record.title}\nslug=${record.id}\n`);
}
