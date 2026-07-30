// Fetches open issues/PRs labeled `new-source` from the GitHub REST API and
// writes them to data/candidates.js as window.AMAZONIA_CANDIDATES, for the
// public candidates board (candidates.html).
//
// The /issues endpoint returns both plain issues and PRs for a given label.
// The public board shows each originating issue exactly once. A source issue
// is "in review" only when an open generated PR explicitly says it came from
// that issue; otherwise it remains "needs fixing". This avoids rendering a
// successful submission twice (once as its issue and once as its PR).
//
// Runs via .github/workflows/update-candidates.yml, on issue/PR activity and
// on a schedule as a safety net. Uses GITHUB_TOKEN when available (5000
// requests/hour) but falls back to an unauthenticated call (60/hour) so this
// can also be run and tested locally without a token.

import { writeFile } from "node:fs/promises";

const REPO = process.env.GITHUB_REPOSITORY || "mgpcamargo/amazoniadb";
const TOKEN = process.env.GITHUB_TOKEN || "";
const outUrl = new URL("../data/candidates.js", import.meta.url);

function stripTitlePrefix(title) {
  return title.replace(/^\[(?:new source|source)\]\s*:?\s*/i, "").trim();
}

function toCandidateRecord(item, sourceIssuesInReview) {
  return {
    number: item.number,
    title: stripTitlePrefix(item.title || `#${item.number}`),
    submittedBy: item.user?.login || "unknown",
    avatarUrl: item.user?.avatar_url || "",
    status: sourceIssuesInReview.has(item.number) ? "in-review" : "needs-fixing",
    url: item.html_url,
    createdAt: (item.created_at || "").slice(0, 10)
  };
}

async function fetchLabeledItems() {
  const headers = {
    "User-Agent": "AmazoniaDB-CandidatesBoard/1.0",
    Accept: "application/vnd.github+json"
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const items = [];
  for (let page = 1; ; page += 1) {
    const url = new URL(`https://api.github.com/repos/${REPO}/issues`);
    url.searchParams.set("labels", "new-source");
    url.searchParams.set("state", "open");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status} for ${url}: ${await res.text()}`);
    }
    const pageItems = await res.json();
    items.push(...pageItems);
    if (pageItems.length < 100) break;
  }
  return items;
}

const items = await fetchLabeledItems();
const sourceIssuesInReview = new Set(
  items
    .filter((item) => item.pull_request)
    .map((item) => (item.body || "").match(/Auto-generated from #(\d+)/i)?.[1])
    .filter(Boolean)
    .map(Number)
);
const candidates = items
  .filter((item) => !item.pull_request)
  .map((item) => toCandidateRecord(item, sourceIssuesInReview))
  .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

const output = `window.AMAZONIA_CANDIDATES = ${JSON.stringify(candidates, null, 2)};\n`;
await writeFile(outUrl, output, "utf8");
console.log(`Wrote ${candidates.length} candidate(s) to data/candidates.js.`);
for (const c of candidates) {
  console.log(`  #${c.number} [${c.status}] "${c.title}" by @${c.submittedBy}`);
}
