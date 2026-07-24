# Contributing a source

AmazoniaDB is a directory, not a mirror. A useful contribution is a trustworthy path from a research question to the original publisher.

Don't know where to start? `SOURCES-TO-VERIFY.md` lists real institutions we haven't added yet — pick one, verify it, submit it.

The `submit.html` page can create a locally stored candidate record. It is an aid for preparing a submission, not an automatic publishing channel.

Submitted through the issue form? Track it on the [candidates board](candidates.html) — it shows "in review" once a draft pull request opens, or "needs fixing" if validation caught a problem first. If yours is merged, your GitHub handle is credited on the card automatically; nothing to do on your end for that.

Not sure if something belongs, or want to talk through a source before submitting it? Use [Discussions](../../discussions) rather than opening an issue — it keeps the issue tracker focused on actual submissions and link reports.

## Two ways to submit

- **Open a pull request** with your entry added to `data/catalog.js` directly (see the record format below). `validate-catalog.yml` runs automatically on the PR.
- **Open a "New source submission" issue** using the issue form. This runs the same validation and opens a draft pull request for you automatically — a maintainer still reviews and merges it. Use `submit.html` first if you want to draft and sanity-check your fields before filling in either path.

## Before adding a record

1. Confirm the link goes to the original publisher, repository, or official data portal.
2. Check the page is still available and record the date in `checked` as `YYYY-MM-DD`.
3. Read the source’s access, attribution, licensing, and redistribution conditions.
4. Select the single most useful one of the six categories.
5. Write a brief description of what the source contains—not what you infer from it.

## Geographic scope

Default to the Brazilian Amazon — that's where open, well-documented portals are easiest to verify. `Peru`, `Colombia`, `Bolivia`, and `Ecuador` are available as `coverage` values for a well-verified country-specific source outside Brazil. Use `Pan-Amazon` or `Global — subsettable` only when a source is genuinely the best option for its topic and no comparable country-specific source exists (e.g. a network that only operates at basin scale, like RAISG). A well-verified single-country entry beats a thinner multi-country one added just for coverage.

## Do not add

- copied files, download mirrors, or unauthorised API endpoints;
- data that reveals sensitive species locations, personal information, or restricted cultural knowledge;
- links that obscure the original provider or require users to bypass access controls;
- a claim that a source is “open” when its terms are unclear.

## Review standard

Each source should be reproducible from its card alone: a reader can identify the publisher, the coverage, data form, access note, and source page. When conditions are unclear, use `Provider terms apply` rather than guessing.
