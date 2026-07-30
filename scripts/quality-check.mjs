// Repository-level checks that are fast, deterministic, and safe to run in
// pull requests. Network verification remains in check-links.mjs because
// publisher sites may rate-limit or block automated traffic.

import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const htmlFiles = [
  "index.html", "candidates.html", "donate.html", "submit.html",
  "pt-br/index.html", "pt-br/candidates.html", "pt-br/donate.html", "pt-br/submit.html",
  "es/index.html", "es/candidates.html", "es/donate.html", "es/submit.html"
];
const homePages = [
  { file: "index.html", app: "app.js", locale: "en" },
  { file: "pt-br/index.html", app: "pt-br/app.js", locale: "pt-BR" },
  { file: "es/index.html", app: "es/app.js", locale: "es" }
];
const requiredCategories = [
  "Forest & biodiversity",
  "Earth, water & climate",
  "Land use & infrastructure",
  "Peoples, territories & culture",
  "Society, health & livelihoods",
  "Governance, rights & safeguards"
];
const errors = [];
const notes = [];

const read = (relativePath) => readFile(new URL(relativePath, root), "utf8");
const fail = (message) => errors.push(message);

const evaluateBrowserData = async () => {
  const context = { window: {} };
  for (const file of ["data/catalog.js", "data/category-presentation.js", "data/catalog.i18n.js", "data/candidates.js"]) {
    vm.runInNewContext(await read(file), context, { filename: file });
  }
  return context.window;
};

const checkLocalReferences = async (file, html) => {
  const attributePattern = /\b(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    const reference = match[1].trim();
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
    try {
      const target = new URL(reference, new URL(file, root));
      if (target.protocol !== "file:") continue;
      await access(fileURLToPath(target));
    } catch {
      fail(`${file}: local reference does not resolve: ${reference}`);
    }
  }
};

const makeElement = () => {
  const listeners = new Map();
  return {
    value: "",
    hidden: false,
    textContent: "",
    innerHTML: "",
    dataset: {},
    style: {},
    classList: { add() {}, remove() {} },
    setAttribute() {},
    addEventListener(type, handler) { listeners.set(type, handler); },
    listener(type) { return listeners.get(type); },
    focus() {},
    scrollIntoView() {},
    querySelector() { return { focus() {}, scrollIntoView() {} }; }
  };
};

const makeLanguageLink = (href) => ({
  ...makeElement(),
  href,
  getAttribute(name) { return name === "href" ? href : null; }
});

const runExplorerSmokeTest = async (page, browserData) => {
  const ids = [
    "domain-nav", "dataset-grid", "empty-state", "result-count", "dataset-count",
    "search", "coverage", "access", "filters", "discover-source", "discovery-result",
    "domain-gap", "catalog", "copy-view-link"
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, makeElement()]));
  const languageLinks = [makeLanguageLink("index.html"), makeLanguageLink("pt-br/index.html")];
  const head = { appendChild() {} };
  const body = { appendChild() {}, removeChild() {} };
  const document = {
    head,
    body,
    activeElement: null,
    getElementById(id) { return elements[id] || makeElement(); },
    querySelectorAll(selector) { return selector === ".lang-switch a" ? languageLinks : []; },
    createElement() { return makeElement(); },
    addEventListener() {},
    execCommand() { return true; }
  };
  const location = {
    origin: "https://mgpcamargo.github.io",
    pathname: `/${page.file}`,
    search: "?source=gbif-species-occurrences&category=Earth%2C%20water%20%26%20climate",
    hash: ""
  };
  const history = {
    replacements: [],
    replaceState(_state, _title, next) {
      this.replacements.push(next);
      const url = new URL(next, location.origin);
      location.pathname = url.pathname;
      location.search = url.search;
      location.hash = url.hash;
    }
  };
  const window = {
    ...browserData,
    location,
    history,
    matchMedia: () => ({ matches: true }),
    setTimeout,
    clearTimeout
  };
  const context = {
    window,
    document,
    navigator: { clipboard: { writeText: async () => {} } },
    URLSearchParams,
    URL,
    Blob,
    setTimeout,
    clearTimeout,
    console
  };
  vm.runInNewContext(await read(page.app), context, { filename: page.app });

  const renderedTiles = (elements["domain-nav"].innerHTML.match(/<button\b/g) || []).length;
  const renderedRecords = (elements["dataset-grid"].innerHTML.match(/<article\b/g) || []).length;
  if (renderedTiles !== 6) fail(`${page.file}: expected six category tiles, rendered ${renderedTiles}.`);
  if (renderedRecords !== 1) fail(`${page.file}: a source URL must override conflicting filters and render exactly one source.`);
  if (!history.replacements.at(-1)?.includes("source=gbif-species-occurrences") || history.replacements.at(-1).includes("category=")) {
    fail(`${page.file}: source URL did not normalize conflicting filter parameters.`);
  }
  if (!languageLinks.every((link) => link.href.includes("?source=gbif-species-occurrences"))) {
    fail(`${page.file}: language links do not preserve the current source view.`);
  }

  const firstTile = { dataset: { category: requiredCategories[0] } };
  elements["domain-nav"].listener("click")?.({ target: { closest: () => firstTile } });
  const filteredRecords = (elements["dataset-grid"].innerHTML.match(/<article\b/g) || []).length;
  const expectedRecords = browserData.AMAZONIA_CATALOG.filter((record) => record.category === requiredCategories[0]).length;
  if (filteredRecords !== expectedRecords) fail(`${page.file}: category filtering rendered ${filteredRecords}, expected ${expectedRecords}.`);
  elements["domain-nav"].listener("click")?.({ target: { closest: () => firstTile } });
  const resetRecords = (elements["dataset-grid"].innerHTML.match(/<article\b/g) || []).length;
  if (resetRecords !== browserData.AMAZONIA_CATALOG.length) fail(`${page.file}: clicking an active category must restore the full catalog.`);
  elements["discover-source"].listener("click")?.();
  const discoveryRecords = (elements["dataset-grid"].innerHTML.match(/<article\b/g) || []).length;
  if (discoveryRecords !== 1 || elements["discovery-result"].hidden) fail(`${page.file}: discovery must focus one verified source.`);
};

for (const file of htmlFiles) {
  const html = await read(file);
  await checkLocalReferences(file, html);
  if (/AMAZONIADB_GOATCOUNTER_CODE|href=["']#["']|\[platform\]/i.test(html)) {
    fail(`${file}: contains a public placeholder.`);
  }
  if (/goatcounter\.com\/count/i.test(html)) fail(`${file}: contains the unused placeholder analytics script.`);
}

for (const page of homePages) {
  const html = await read(page.file);
  for (const id of ["domain-nav", "discover-source", "dataset-grid"]) {
    if (!new RegExp(`id=["']${id}["']`).test(html)) fail(`${page.file}: missing #${id}.`);
  }
  const prefix = page.file.includes("/") ? "../" : "";
  const categoryIndex = html.indexOf(`src="${prefix}data/category-presentation.js"`);
  const catalogIndex = html.indexOf(`src="${prefix}data/catalog.js"`);
  const appIndex = html.indexOf(`src="${page.app.replace(/^.*\//, "")}"`);
  if (!(categoryIndex >= 0 && categoryIndex < catalogIndex && catalogIndex < appIndex)) {
    fail(`${page.file}: category presentation, catalog, and app scripts must load in that order.`);
  }
}

for (const [file, expectedScript] of [
  ["submit.html", "submit.js"], ["pt-br/submit.html", "../submit.js"], ["es/submit.html", "../submit.js"]
]) {
  const html = await read(file);
  for (const name of ["temporalCoverage", "spatialResolution", "license", "methodologyUrl"]) {
    if (!new RegExp(`name=["']${name}["']`).test(html)) fail(`${file}: missing optional ${name} input.`);
  }
  if (!html.includes(`src="${expectedScript}"`)) fail(`${file}: does not load ${expectedScript}.`);
}

for (const [file, expectedScript] of [
  ["candidates.html", "candidates.js"], ["pt-br/candidates.html", "../candidates.js"], ["es/candidates.html", "../candidates.js"]
]) {
  if (!(await read(file)).includes(`src="${expectedScript}"`)) fail(`${file}: does not load ${expectedScript}.`);
}

const sourceIssueTemplate = await read(".github/ISSUE_TEMPLATE/new-source.yml");
for (const id of ["description_pt_br", "description_es", "spatial_resolution_pt_br", "spatial_resolution_es"]) {
  if (!sourceIssueTemplate.includes(`id: ${id}`)) fail(`new-source issue template: missing ${id}.`);
}
const sourceWorkflow = await read(".github/workflows/source-submission.yml");
for (const command of ["node scripts/build-api.mjs", "npm run check"]) {
  if (!sourceWorkflow.includes(command)) fail(`source-submission workflow: missing ${command}.`);
}

const sitemap = await read("sitemap.xml");
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapLocations = [
  "https://mgpcamargo.github.io/amazoniadb/",
  "https://mgpcamargo.github.io/amazoniadb/pt-br/",
  "https://mgpcamargo.github.io/amazoniadb/es/",
  ...["submit.html", "candidates.html", "donate.html"].flatMap((page) => [
    `https://mgpcamargo.github.io/amazoniadb/${page}`,
    `https://mgpcamargo.github.io/amazoniadb/pt-br/${page}`,
    `https://mgpcamargo.github.io/amazoniadb/es/${page}`
  ])
];
for (const location of expectedSitemapLocations) {
  if (!sitemapLocations.includes(location)) fail(`sitemap.xml: missing ${location}.`);
}
if (new Set(sitemapLocations).size !== sitemapLocations.length) fail("sitemap.xml: contains duplicate <loc> entries.");
if (!(await read("robots.txt")).includes("Sitemap: https://mgpcamargo.github.io/amazoniadb/sitemap.xml")) fail("robots.txt: sitemap declaration is missing or incorrect.");

const browserData = await evaluateBrowserData();
const catalog = browserData.AMAZONIA_CATALOG;
const presentation = browserData.AMAZONIA_CATEGORY_PRESENTATION;
const translations = browserData.AMAZONIA_CATALOG_I18N;
const candidates = browserData.AMAZONIA_CANDIDATES;
if (!Array.isArray(catalog) || !catalog.length) fail("data/catalog.js did not load a non-empty catalog.");
if (!Array.isArray(candidates)) fail("data/candidates.js did not load an array.");
if (!presentation || Object.keys(presentation).length !== 6) fail("data/category-presentation.js must define exactly six categories.");
if (JSON.stringify(Object.keys(presentation || {})) !== JSON.stringify(requiredCategories)) fail("category presentation keys must match the six catalog categories in order.");
for (const [key, item] of Object.entries(presentation || {})) {
  if (!item.icon?.includes("<svg") || !item.id) fail(`${key}: presentation needs an inline SVG icon and stable visual id.`);
  for (const locale of ["en", "pt-BR", "es"]) {
    if (!item.locales?.[locale]?.label || !item.locales?.[locale]?.note) fail(`${key}: missing ${locale} presentation copy.`);
  }
}

for (const locale of ["pt-BR", "es"]) {
  const translatedDescriptions = translations?.[locale]?.descriptions || {};
  const catalogIds = new Set(catalog.map((record) => record.id));
  const missing = catalog.filter((record) => !translatedDescriptions[record.id]).map((record) => record.id);
  const unusedDescriptions = Object.keys(translatedDescriptions).filter((id) => !catalogIds.has(id));
  if (missing.length) fail(`data/catalog.i18n.js: ${locale} is missing descriptions for ${missing.join(", ")}.`);
  if (unusedDescriptions.length) fail(`data/catalog.i18n.js: ${locale} has unused descriptions for ${unusedDescriptions.join(", ")}.`);
  const resolutions = new Set(catalog.map((record) => record.spatialResolution).filter(Boolean));
  const translatedResolutions = translations?.[locale]?.spatialResolution || {};
  const missingResolutions = [...resolutions].filter((resolution) => !translatedResolutions[resolution]);
  const unusedResolutions = Object.keys(translatedResolutions).filter((resolution) => !resolutions.has(resolution));
  if (missingResolutions.length) fail(`data/catalog.i18n.js: ${locale} is missing spatial-resolution translations for ${missingResolutions.join(", ")}.`);
  if (unusedResolutions.length) fail(`data/catalog.i18n.js: ${locale} has unused spatial-resolution translations for ${unusedResolutions.join(", ")}.`);
}

const api = JSON.parse(await read("api/v1/catalog.json"));
if (api.apiVersion !== 1) fail("api/v1/catalog.json: apiVersion must be 1.");
if (api.$schema) fail("api/v1/catalog.json: record schema must not be used as an API-envelope $schema.");
if (api.recordSchema !== "https://mgpcamargo.github.io/amazoniadb/data/catalog.schema.json") fail("api/v1/catalog.json: recordSchema is missing or incorrect.");
if (api.count !== catalog.length || !Array.isArray(api.records) || api.records.length !== catalog.length) fail("api/v1/catalog.json: count and records must match data/catalog.js.");
if (JSON.stringify(api.records?.map((record) => record.id)) !== JSON.stringify(catalog.map((record) => record.id))) fail("api/v1/catalog.json: record order or ids do not match data/catalog.js.");

await Promise.all(homePages.map((page) => runExplorerSmokeTest(page, browserData)));

if (errors.length) {
  console.error(`Quality check failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  notes.push(`${catalog.length} catalog records`, "six localized category tiles", "twelve public HTML pages", "API mirror aligned");
  console.log(`Quality check passed: ${notes.join("; ")}.`);
}
