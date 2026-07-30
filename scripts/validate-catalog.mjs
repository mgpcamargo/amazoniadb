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
}

if (issues.length) {
  console.error(`Catalog validation failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}:`);
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`Catalog valid: ${catalog.length} records across ${validCategories.size} approved domains.`);
}
