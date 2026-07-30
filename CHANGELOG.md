# Changelog

All notable changes to AmazoniaDB are documented here. Loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — v1.4

### Added
- Public candidates board (`candidates.html`, all locales) showing pending community submissions — "in review" once a draft PR opens, "needs fixing" if schema validation caught a problem first
- Contributor provenance — entries submitted through the issue pipeline retain the submitter's GitHub handle for review history
- Weekly freshness check flagging entries not re-verified in 180+ days, alongside the existing dead-link check
- Public API mirror at `api/v1/catalog.json`, auto-regenerated on every push to `main` that touches the catalog
- Donate page (`donate.html`, all locales) with a plain explanation of what support covers; no funding route is published until it is verified
- Dark mode, every page, every locale — no flash of the wrong theme on load, follows OS preference until a visitor picks explicitly
- "Report link" button on every catalog card — a pre-filled email, no GitHub account required
- Shareable filtered-view links, per-card citation button, `DataCatalog`/`Dataset` structured data for search engines, and a prompt naming whichever domain has the fewest sources
- `.gitignore` and a PR template with an actual review checklist, after a full repo zip, patch files, and a joke entry all ended up committed to `main` at different points
- Catalog grew from 13 to 46 entries; one outdated source was subsequently removed when its publisher endpoint no longer met the directory's secure-link policy
- V2 icon-first entry points in English, Portuguese, and Spanish: six accessible category cards, contextual counts, an honest one-source discovery control, reduced-motion behavior, and shareable URLs
- A repository quality gate (`npm run check` and `quality.yml`) covering syntax, catalog integrity, API synchronization, static references, localized explorer behavior, translations, forms, and placeholder content

### Changed
- `coverage` expanded beyond Brazil / Pan-Amazon / Global to include Peru, Colombia, Bolivia, and Ecuador as explicit values
- Category renamed: "Climate, water & air" → "Earth, water & climate"
- API path versioned: `api/catalog.json` → `api/v1/catalog.json`, before it had real external consumers to break
- API envelope now exposes `recordSchema` rather than incorrectly declaring the per-record schema as its own `$schema`

### Removed
- The tier-badge system ("Community-submitted, schema-valid" vs. "Editorially reviewed" labels on every card) — dropped as not a meaningful contributor incentive
- 4 catalog entries that were single-study academic outputs (a single drone survey, a fixed-date research dataset) rather than ongoing institutional sources
- Placeholder analytics and donation calls-to-action until real, reviewed services are configured

### Fixed
- `scripts/validate-catalog.mjs` had a stale category name after the rename above, silently failing CI on real entries
- Dark mode: the header background was hardcoded rather than tokenized, so it never switched themes — made the wordmark nearly unreadable against itself
- Duplicate API-mirror implementation (a second, uncoordinated `data/catalog.json` + `scripts/build-catalog-json.mjs`) consolidated onto the one CI actually enforces

## [1.2.3] and earlier

Initial launch through incremental fixes: repo structure, GitHub Pages deployment, the six-domain taxonomy, and the first curated entries. Not reconstructed here in full detail — see git history predating this file.
