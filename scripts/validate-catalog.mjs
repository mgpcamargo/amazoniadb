import { readFile } from "node:fs/promises";
import vm from "node:vm";

const validCategories = new Set([
  "Forest & biodiversity",
  "Earth, water & climate",
  "Land use & infrastructure",
  "Peoples, territories & culture",
  "Society, health & livelihoods",
  "Governance, rights & safeguards"
]);
const validCoverage = new Set(["Pan-Amazon", "Brazil", "Peru", "Colombia", "Bolivia", "Ecuador", "Global — subsettable"]);
const validAccess = new Set(["Provider terms apply", "Dataset-specific license", "Publicly available"]);
const validKinds = new Set(["Dataset", "Data portal", "Download", "Explorer"]);
const requiredFields = ["id", "title", "provider", "category", "coverage", "formats", "access", "kind", "description", "url", "checked"];
const githubHandlePattern = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;
const currentDate = new Date().toISOString().slice(0, 10);

const normalizeHttpsUrl = (value) => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    return url.href.endsWith("/") ? url.href.slice(0, -1) : url.href;
  } catch {
    return null;
  }
};

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

const isHttpUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const source = await readFile(new URL("../data/catalog.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "data/catalog.js" });
const catalog = context.window.AMAZONIA_CATALOG;
const issues = [];

const tagFacets = ["topics", "modes", "time", "roles"];
const tagPresentationSource = await readFile(new URL("../data/tag-presentation.js", import.meta.url), "utf8");
const tagPresentationContext = { window: {} };
vm.runInNewContext(tagPresentationSource, tagPresentationContext, { filename: "data/tag-presentation.js" });
const tagPresentation = tagPresentationContext.window.AMAZONIA_TAG_PRESENTATION;
const tagVocabulary = tagPresentation?.vocabulary;
const tagValues = {};

for (const facet of tagFacets) {
  const entries = tagVocabulary?.[facet];
  if (!entries || typeof entries !== "object" || Array.isArray(entries) || !Object.keys(entries).length) {
    issues.push(`data/tag-presentation.js: ${facet} must expose a non-empty controlled vocabulary.`);
    tagValues[facet] = new Set();
    continue;
  }
  tagValues[facet] = new Set(Object.keys(entries));
  for (const [tag, labels] of Object.entries(entries)) {
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(tag)) {
      issues.push(`data/tag-presentation.js: ${facet} tag ${tag} must be lowercase kebab-case.`);
    }
    for (const locale of ["en", "pt-BR", "es"]) {
      if (typeof labels?.[locale] !== "string" || !labels[locale].trim()) {
        issues.push(`data/tag-presentation.js: ${facet}.${tag} is missing a ${locale} label.`);
      }
    }
  }
}

const catalogSchema = JSON.parse(await readFile(new URL("../data/catalog.schema.json", import.meta.url), "utf8"));
for (const facet of tagFacets) {
  const schemaValues = catalogSchema.properties?.tags?.properties?.[facet]?.items?.enum;
  if (!Array.isArray(schemaValues) || JSON.stringify(schemaValues) !== JSON.stringify([...tagValues[facet]])) {
    issues.push(`data/catalog.schema.json: ${facet} enum must match data/tag-presentation.js.`);
  }
}

if (!Array.isArray(catalog)) {
  issues.push("catalog.js must assign an array to window.AMAZONIA_CATALOG.");
}

const ids = new Set();
const urls = new Map();
for (const [index, record] of (catalog || []).entries()) {
  const label = `Record ${index + 1}`;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    issues.push(`${label}: record must be an object.`);
    continue;
  }
  for (const field of requiredFields) {
    if (!(field in record) || record[field] == null || (typeof record[field] === "string" && !record[field].trim())) {
      issues.push(`${label}: missing ${field}.`);
    }
  }
  for (const field of ["id", "title", "provider", "category", "coverage", "access", "kind", "description", "url", "checked"]) {
    if (field in record && typeof record[field] !== "string") issues.push(`${label}: ${field} must be a string.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id || "")) issues.push(`${label}: id must be lowercase kebab-case.`);
  if (ids.has(record.id)) issues.push(`${label}: duplicate id ${record.id}.`);
  ids.add(record.id);
  if (!validCategories.has(record.category)) issues.push(`${label}: category is not one of the six approved domains.`);
  if (!validCoverage.has(record.coverage)) issues.push(`${label}: coverage is not in the controlled vocabulary.`);
  if (!validAccess.has(record.access)) issues.push(`${label}: access is not in the controlled vocabulary.`);
  if (!validKinds.has(record.kind)) issues.push(`${label}: kind is not in the controlled vocabulary.`);
  if (!Array.isArray(record.formats) || record.formats.length === 0) {
    issues.push(`${label}: formats must be a non-empty array.`);
  } else if (record.formats.some((format) => typeof format !== "string" || !format.trim())) {
    issues.push(`${label}: every format must be a non-empty string.`);
  }
  const normalizedUrl = normalizeHttpsUrl(record.url);
  if (!normalizedUrl) {
    issues.push(`${label}: url must be a valid https:// URL.`);
  } else if (urls.has(normalizedUrl)) {
    issues.push(`${label}: duplicate url (also used by ${urls.get(normalizedUrl)}).`);
  } else {
    urls.set(normalizedUrl, record.id || label);
  }
  if (!isValidDate(record.checked)) {
    issues.push(`${label}: checked must be a real YYYY-MM-DD date.`);
  } else if (record.checked > currentDate) {
    issues.push(`${label}: checked cannot be in the future.`);
  }
  if (record.submittedBy != null && !githubHandlePattern.test(record.submittedBy)) {
    issues.push(`${label}: submittedBy is not a well-formed GitHub handle.`);
  }
  for (const field of ["temporalCoverage", "spatialResolution", "license"]) {
    if (record[field] != null && (typeof record[field] !== "string" || !record[field].trim())) {
      issues.push(`${label}: ${field} must be a non-empty string when present.`);
    }
  }
  if (record.methodologyUrl != null && !isHttpUrl(record.methodologyUrl)) {
    issues.push(`${label}: methodologyUrl must be a valid http:// or https:// URL.`);
  }
  if (record.tags != null) {
    if (!record.tags || typeof record.tags !== "object" || Array.isArray(record.tags)) {
      issues.push(`${label}: tags must be an object when present.`);
    } else {
      const unexpectedFacets = Object.keys(record.tags).filter((facet) => !tagFacets.includes(facet));
      if (unexpectedFacets.length) {
        issues.push(`${label}: tags has unsupported facet(s): ${unexpectedFacets.join(", ")}.`);
      }
      for (const facet of tagFacets) {
        const values = record.tags[facet];
        if (!Array.isArray(values) || !values.length) {
          issues.push(`${label}: tags.${facet} must be a non-empty array when tags are present.`);
          continue;
        }
        if (values.some((value) => typeof value !== "string" || !tagValues[facet].has(value))) {
          issues.push(`${label}: tags.${facet} contains a value outside the controlled vocabulary.`);
        }
        if (new Set(values).size !== values.length) {
          issues.push(`${label}: tags.${facet} must not repeat a value.`);
        }
      }
    }
  }
}

if (issues.length) {
  console.error(`Catalog validation failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}:`);
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`Catalog valid: ${catalog.length} records across ${validCategories.size} approved domains.`);
}
