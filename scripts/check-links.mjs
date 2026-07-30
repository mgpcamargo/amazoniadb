// Checks every URL in data/catalog.js, and separately flags entries whose
// `checked` date has gone stale. Runs weekly via schedule, or on demand via
// workflow_dispatch. This script only checks links and dates and writes
// results to GITHUB_OUTPUT — .github/workflows/check-links.yml decides what
// to do with that (open or update a GitHub issue).
//
// Note for whoever reads the results: some sites block automated requests
// (403/timeout) even though they work fine in a real browser. Treat this as
// "worth a human look," not "definitely dead."

import { readFile, appendFile } from "node:fs/promises";
import vm from "node:vm";

const catalogUrl = new URL("../data/catalog.js", import.meta.url);
const TIMEOUT_MS = 15000;
const STALE_DAYS = 180;
const CONCURRENCY = 6;
const UA = "Mozilla/5.0 (compatible; AmazoniaDB-LinkChecker/1.0)";

async function request(entry, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(entry.url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": UA }
    });
    await res.body?.cancel();
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function checkOne(entry) {
  // Some providers block or mishandle HEAD requests. GET is the decisive
  // fallback even after a timeout, so give it a fresh abort signal instead
  // of reusing a signal that a failed HEAD may already have cancelled.
  const head = await request(entry, "HEAD");
  let result = head.ok ? head : await request(entry, "GET");
  if (!result.ok && (result.status === null || result.status >= 500)) {
    result = await request(entry, "GET");
  }
  return { id: entry.id, title: entry.title, url: entry.url, ...result };
}

const checkAll = async (entries) => {
  const results = new Array(entries.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await checkOne(entries[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, entries.length) }, worker));
  return results;
};

const source = await readFile(catalogUrl, "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const catalog = context.window.AMAZONIA_CATALOG || [];

const results = await checkAll(catalog);
const broken = results.filter((r) => !r.ok);

const msPerDay = 24 * 60 * 60 * 1000;
const today = new Date();
const stale = catalog
  .map((entry) => {
    const checkedDate = new Date(`${entry.checked}T00:00:00Z`);
    const daysSince = Math.floor((today - checkedDate) / msPerDay);
    return { id: entry.id, title: entry.title, checked: entry.checked, daysSince };
  })
  .filter((r) => Number.isFinite(r.daysSince) && r.daysSince > STALE_DAYS)
  .sort((a, b) => b.daysSince - a.daysSince);

console.log(`Checked ${results.length} links, ${broken.length} came back non-OK.`);
for (const r of results) {
  console.log(`  ${r.ok ? "OK " : "BAD"} ${r.id}: ${r.status ?? r.error}`);
}
console.log(`${stale.length} record(s) haven't been reverified in over ${STALE_DAYS} days.`);
for (const r of stale) {
  console.log(`  STALE ${r.id}: checked ${r.checked} (${r.daysSince} days ago)`);
}

const ghOutput = process.env.GITHUB_OUTPUT;
if (ghOutput) {
  const brokenBody = broken
    .map((r) => `- **${r.title}** (\`${r.id}\`): ${r.url} — ${r.status ? `HTTP ${r.status}` : r.error}`)
    .join("\n");
  const staleBody = stale
    .map((r) => `- **${r.title}** (\`${r.id}\`): last checked ${r.checked} — ${r.daysSince} days ago`)
    .join("\n");
  await appendFile(ghOutput, `broken_count=${broken.length}\n`);
  await appendFile(ghOutput, `broken_body<<EOF\n${brokenBody}\nEOF\n`);
  await appendFile(ghOutput, `stale_count=${stale.length}\n`);
  await appendFile(ghOutput, `stale_body<<EOF\n${staleBody}\nEOF\n`);
}
