// Fetches open issues/PRs labeled `new-source` from the GitHub REST API and
// writes them to data/candidates.js as window.AMAZONIA_CANDIDATES, for the
// public candidates board (candidates.html).
//
// The /issues endpoint returns both plain issues and PRs for a given label;
// an item counts as "in review" if it has a pull_request field (meaning
// source-submission.yml successfully built a draft PR from it) and
// "needs fixing" otherwise (meaning validation failed and no PR exists yet —
// see scripts/issue-to-entry.mjs and scripts/validate-catalog.mjs).
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
  return title.replace(/^\[New source\]:\s*/i, "").trim();
}

function toCandidateRecord(item) {
  return {
    number: item.number,
    title: stripTitlePrefix(item.title || `#${item.number}`),
    submittedBy: item.user?.login || "unknown",
    avatarUrl: item.user?.avatar_url || "",
    status: item.pull_request ? "in-review" : "needs-fixing",
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

  const url = `https://api.github.com/repos/${REPO}/issues?labels=new-source&state=open&per_page=100`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status} for ${url}: ${await res.text()}`);
  }
  return res.json();
}

const items = await fetchLabeledItems();
const candidates = items
  .map(toCandidateRecord)
  .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

const output = `window.AMAZONIA_CANDIDATES = ${JSON.stringify(candidates, null, 2)};\n`;
await writeFile(outUrl, output, "utf8");
console.log(`Wrote ${candidates.length} candidate(s) to data/candidates.js.`);
for (const c of candidates) {
  console.log(`  #${c.number} [${c.status}] "${c.title}" by @${c.submittedBy}`);
}
