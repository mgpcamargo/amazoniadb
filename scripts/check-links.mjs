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
const UA = "Mozilla/5.0 (compatible; AmazoniaDB-LinkChecker/1.0)";

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

const results = await Promise.all(catalog.map(checkOne));
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
