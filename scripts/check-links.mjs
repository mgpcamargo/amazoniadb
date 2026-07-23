// Checks every URL in data/catalog.js, and separately flags entries whose
// `checked` date has gone stale (see STALE_DAYS below). Runs weekly via
// schedule, or on demand via workflow_dispatch. This script only checks and
// writes results to GITHUB_OUTPUT — .github/workflows/check-links.yml
// decides what to do with that (open or update a GitHub issue).
//
// Note for whoever reads the results: some sites block automated requests
// (403/timeout) even though they work fine in a real browser. Treat this as
// "worth a human look," not "definitely dead." Same spirit for staleness —
// it's a nudge to re-verify, not a claim that anything is actually wrong.

import { readFile, appendFile } from "node:fs/promises";
import vm from "node:vm";

const catalogUrl = new URL("../data/catalog.js", import.meta.url);
const TIMEOUT_MS = 15000;
const UA = "Mozilla/5.0 (compatible; AmazoniaDB-LinkChecker/1.0)";
const STALE_DAYS = 180; // how long an entry can go unverified before it's flagged

async function checkOne(entry) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(entry.url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": UA }
    });
    // Some servers don't implement HEAD correctly — retry with GET before
    // calling it broken.
    if (!res.ok && (res.status === 405 || res.status === 501 || res.status === 403)) {
      res = await fetch(entry.url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": UA }
      });
    }
    clearTimeout(timer);
    return { id: entry.id, title: entry.title, url: entry.url, ok: res.ok, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { id: entry.id, title: entry.title, url: entry.url, ok: false, status: null, error: err.message };
  }
}

const source = await readFile(catalogUrl, "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const catalog = context.window.AMAZONIA_CATALOG || [];

const daysSince = (isoDate) => {
  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
};

const results = await Promise.all(catalog.map(checkOne));
const broken = results.filter((r) => !r.ok);

const stale = catalog
  .map((entry) => ({ ...entry, ageDays: daysSince(entry.checked) }))
  .filter((entry) => entry.ageDays !== null && entry.ageDays > STALE_DAYS);

console.log(`Checked ${results.length} links, ${broken.length} came back non-OK.`);
for (const r of results) {
  console.log(`  ${r.ok ? "OK " : "BAD"} ${r.id}: ${r.status ?? r.error}`);
}
console.log(`${stale.length} entr${stale.length === 1 ? "y is" : "ies are"} older than ${STALE_DAYS} days since last check.`);

const ghOutput = process.env.GITHUB_OUTPUT;
if (ghOutput) {
  const brokenBody = broken
    .map((r) => `- **${r.title}** (\`${r.id}\`): ${r.url} — ${r.status ? `HTTP ${r.status}` : r.error}`)
    .join("\n");
  const staleBody = stale
    .map((entry) => `- **${entry.title}** (\`${entry.id}\`): last checked ${entry.checked}, ${entry.ageDays} days ago`)
    .join("\n");
  await appendFile(ghOutput, `broken_count=${broken.length}\n`);
  await appendFile(ghOutput, `broken_body<<EOF\n${brokenBody}\nEOF\n`);
  await appendFile(ghOutput, `stale_count=${stale.length}\n`);
  await appendFile(ghOutput, `stale_body<<EOF\n${staleBody}\nEOF\n`);
}
