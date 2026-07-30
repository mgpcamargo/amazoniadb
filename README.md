# AmazoniaDB

AmazoniaDB is a lightweight directory of Amazon socioenvironmental datasets and repositories. It directs people to original publishers rather than mirroring source files.

## Run it


Open `index.html` directly in a browser. The directory works without a build step or server.

For the repository checks, use Node 22 or newer:

```sh
npm run check
```

## Use the data without the site

Every card has a copyable citation and a link to the original publisher. Filters and a single discovered source are shareable in the URL. For programmatic use without JavaScript execution, use the versioned API described in [Data & API](#data--api); it is regenerated automatically from the same source of truth.

## Add a source

Use `submit.html` to prepare a source record without sending information to any external service. It checks the required fields, produces a review-ready record, and can copy or download the result locally.

Add an object to `data/catalog.js`. Every entry should have:

- a stable `id`, clear `title`, and original `provider`;
- one of the six approved `category` values;
- a direct `url` to the publisher's dataset or repository page;
- `coverage`, `formats`, `access`, `kind`, a plain-language `description`, and a `checked` date.

Optionally, an entry can also carry `temporalCoverage`, `spatialResolution`, `license`, and `methodologyUrl` — each shown on the card when present, and each collected (as optional fields) by both `submit.html` and the GitHub issue submission form. When a visible metadata field is added, add its Portuguese and Spanish display text in `data/catalog.i18n.js`; formal license names may intentionally remain canonical. Omit rather than guess when one doesn't apply.

Use only a page controlled by the original publisher. Do not imply a dataset is open, downloadable, or redistributable without checking its terms. Do not add sensitive locations, personal data, or community knowledge that should not be indexed.

Run the catalog check after an edit:

```sh
node scripts/validate-catalog.mjs
```

The expected fields and controlled vocabulary are also documented in `data/catalog.schema.json`.

## Automated source submissions

Five workflows in `.github/workflows/` protect and automate the review-record process:

- `validate-catalog.yml` runs `scripts/validate-catalog.mjs` on every pull request touching `data/catalog.js`, `data/catalog.schema.json`, or the validator itself, and on push to `main`.
- `source-submission.yml` fires when a "New source submission" issue is opened (`.github/ISSUE_TEMPLATE/new-source.yml`). It parses the English, Portuguese, and Spanish source descriptions and visible optional metadata; builds the record and localized display content via `scripts/issue-to-entry.mjs`; regenerates the API mirror; runs the full quality gate; and opens a **draft** pull request if it passes. Nothing merges automatically — a maintainer still reviews the diff. The workflow captures the submitting issue author's GitHub handle as `submittedBy` on the new record.
- `check-links.yml` runs `scripts/check-links.mjs` weekly (and on demand). It flags both dead links and entries whose `checked` date has gone stale (over 180 days), filing or updating one tracking issue and closing it when a recheck is healthy.
- `quality.yml` runs `npm run check` on every pull request and every push to `main`. It checks syntax, catalog fields and duplicate URLs, the API mirror, local public-file references, the six localized entry points, submission fields, translations for every visible catalog field, and placeholder content.
- `deploy-pages.yml` publishes the static site through GitHub Actions after a successful quality gate on `main`, and is called directly after a generated API update. It checks out the current `main` branch, so bot-generated updates are deployed without broad workflow fan-out, instead of relying on the legacy branch builder.

Entries created through the issue workflow retain the submitter's GitHub handle in source control for review provenance. That metadata is not a public quality badge: every proposed source still needs editorial review before merging.

Two one-time repository settings are required before `source-submission.yml` can open pull requests:

1. **Settings → Actions → General → Workflow permissions** — enable "Allow GitHub Actions to create and approve pull requests."
2. The workflow uses the default `GITHUB_TOKEN`, which is enough to open the draft PR, but pull requests it creates won't automatically re-trigger `validate-catalog.yml` as a separate check (GitHub blocks workflow-token-created PRs from triggering other workflows, to prevent recursive runs). This doesn't let bad data through — the catalog is already validated in the same run, before the PR is opened — it just means the PR won't show its own green check unless you swap the default token for a personal access token stored as a secret.

If your default branch isn't `main`, update the `branches:`/`ref:` values in `validate-catalog.yml`, `source-submission.yml`, and `deploy-pages.yml` to match.

## Data & API

`data/catalog.js` is the source of truth, but it's JS, not JSON — meant to be loaded with a `<script>` tag, not parsed by external tools. For anyone who wants the catalog without parsing JS, there's a plain-JSON mirror:

```
https://mgpcamargo.github.io/amazoniadb/api/v1/catalog.json
```

Versioned (`v1/`, not a bare `api/catalog.json`) so the response shape can change later without silently breaking whoever's already reading it — a new version lands at `v2/` alongside it, with `v1/` kept working until it's formally deprecated. See [CHANGELOG.md](CHANGELOG.md) for what's changed.

It's regenerated automatically by `validate-catalog.yml` on every push to `main` that touches the catalog (via `scripts/build-api.mjs`) — never edit `api/v1/catalog.json` by hand, it'll just be overwritten on the next push. Shape:

```json
{
  "apiVersion": 1,
  "generated": "2026-07-28T00:00:00.000Z",
  "count": 45,
  "source": "https://mgpcamargo.github.io/amazoniadb/",
  "recordSchema": "https://mgpcamargo.github.io/amazoniadb/data/catalog.schema.json",
  "license": "...",
  "records": [ /* same shape as data/catalog.schema.json */ ]
}
```

```js
const { records } = await fetch("https://mgpcamargo.github.io/amazoniadb/api/v1/catalog.json").then((r) => r.json());
```

This is a read-only convenience mirror of the index, not a grant of rights to the underlying data — see License below.

## Directory policy

- AmazoniaDB stores catalog metadata and links, not data files.
- Access and reuse rules are determined by each original provider.
- Entries must retain provider attribution and a current review date.
- If a rights holder asks for a listing to be corrected or removed, remove it promptly while the issue is reviewed.

This is an index, not legal advice. For commercial use, bulk use, redistribution, or data derived from Indigenous territories or sensitive species records, consult the relevant provider terms and applicable law.

## License

All rights reserved — see `LICENSE`. This repository is public for transparency and so outside contributors can propose new catalog entries (see `CONTRIBUTING.md`); it isn't an open-source release, and reuse or redistribution of the code or compiled entries elsewhere requires permission.
