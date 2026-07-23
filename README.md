# AmazoniaDB

AmazoniaDB is a lightweight directory of Amazon socioenvironmental datasets and repositories. It directs people to original publishers rather than mirroring source files.

## Run it


Open `index.html` directly in a browser. The directory works without a build step or server.

## Add a source

Use `submit.html` to prepare a candidate record without sending information to any external service. It checks the required fields, produces a review-ready record, and can copy or download the result locally.

Add an object to `data/catalog.js`. Every entry should have:

- a stable `id`, clear `title`, and original `provider`;
- one of the six approved `category` values;
- a direct `url` to the publisher's dataset or repository page;
- `coverage`, `formats`, `access`, `kind`, a plain-language `description`, and a `checked` date.

Use only a page controlled by the original publisher. Do not imply a dataset is open, downloadable, or redistributable without checking its terms. Do not add sensitive locations, personal data, or community knowledge that should not be indexed.

Run the catalog check after an edit:

```sh
node scripts/validate-catalog.mjs
```

The expected fields and controlled vocabulary are also documented in `data/catalog.schema.json`.

## Automated source submissions

Four workflows in `.github/workflows/` automate the review-record process:

- `validate-catalog.yml` runs `scripts/validate-catalog.mjs` on every pull request touching `data/catalog.js`, `data/catalog.schema.json`, or the validator itself, and on push to `main`.
- `source-submission.yml` fires when a "New source submission" issue is opened (`.github/ISSUE_TEMPLATE/new-source.yml`). It parses the form, builds a record via `scripts/issue-to-entry.mjs`, validates it, and opens a **draft** pull request if it passes. Nothing merges automatically — a maintainer still reviews the diff. It also captures the submitting issue author's GitHub handle as `submittedBy` on the new record.
- `check-links.yml` runs `scripts/check-links.mjs` weekly (and on demand). It flags both dead links and entries whose `checked` date has gone stale (over 180 days), filing or updating a single tracking issue.
- `update-candidates.yml` keeps `data/candidates.js` current for the public [candidates board](candidates.html) — a live feed of pending submissions, shown as "in review" (has an open draft PR) or "needs fixing" (validation failed, no PR yet). It runs on issue/PR activity and at least every six hours regardless.

Every catalog entry carries an implicit **verification tier**, visible on its card: entries with `submittedBy` set are tagged "Community-submitted, schema-valid" with a credit line linking to the contributor; entries without it — the original curated set, or anything a maintainer adds by hand — are tagged "Editorially reviewed." There's no separate tier field to maintain; it's derived from whether `submittedBy` is present.

Two one-time repository settings are required before `source-submission.yml` can open pull requests:

1. **Settings → Actions → General → Workflow permissions** — enable "Allow GitHub Actions to create and approve pull requests."
2. The workflow uses the default `GITHUB_TOKEN`, which is enough to open the draft PR, but pull requests it creates won't automatically re-trigger `validate-catalog.yml` as a separate check (GitHub blocks workflow-token-created PRs from triggering other workflows, to prevent recursive runs). This doesn't let bad data through — the catalog is already validated in the same run, before the PR is opened — it just means the PR won't show its own green check unless you swap the default token for a personal access token stored as a secret.

If your default branch isn't `main`, update the `branches:` filter in `validate-catalog.yml`, and the `ref:` in `update-candidates.yml`, to match.

## Directory policy

- AmazoniaDB stores catalog metadata and links, not data files.
- Access and reuse rules are determined by each original provider.
- Entries must retain provider attribution and a current review date.
- If a rights holder asks for a listing to be corrected or removed, remove it promptly while the issue is reviewed.

This is an index, not legal advice. For commercial use, bulk use, redistribution, or data derived from Indigenous territories or sensitive species records, consult the relevant provider terms and applicable law.

## License

All rights reserved — see `LICENSE`. This repository is public for transparency and so outside contributors can propose new catalog entries (see `CONTRIBUTING.md`); it isn't an open-source release, and reuse or redistribution of the code or compiled entries elsewhere requires permission.
