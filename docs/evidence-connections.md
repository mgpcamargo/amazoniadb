# Evidence connections: a review-first proposal

## Goal

Let a person move from a research question to a small, explainable set of
compatible sources. The feature should help assemble evidence; it must never
claim that two datasets are scientifically comparable or causally related just
because they share a keyword.

## Keep the six areas as entry points

The six visible areas of knowledge are deliberately broad navigation aids:

1. Forests & biodiversity
2. Earth, water & air
3. Land, fire & change
4. Peoples & territories
5. Health & livelihoods
6. Rights & governance

Each record retains one primary area for a simple first filter. A separate,
controlled tag vocabulary lets it participate in more than one question.

## Proposed metadata

Add these fields only after their vocabularies and editorial rules are agreed:

```js
{
  primaryArea: "Earth, water & climate", // existing canonical category
  themes: ["rivers", "rainfall", "water-quality"],
  places: ["Brazil", "Pan-Amazon"],
  timeProfile: ["historical", "near-real-time"],
  dataModes: ["station", "tabular", "geospatial"],
  methods: ["in-situ-observation"],
  sensitivity: "standard", // standard | community-governed | restricted
  relatedIds: [
    {
      id: "another-record-id",
      relation: "complements",
      reason: "Both provide river observations for Brazil; one adds water quality.",
      reviewed: "2026-07-30"
    }
  ]
}
```

`themes`, `places`, `timeProfile`, `dataModes`, and `methods` are controlled
tags, not free-form labels. `relatedIds` is optional and human-reviewed; its
reason is shown beside every connection.

## Product path

### Phase 1 — tags and transparent filtering

- Add a small controlled vocabulary and tag only sources whose descriptions
  and documentation support it.
- Let visitors combine a primary area with themes, geography, time profile, or
  data mode.
- Show the selected tags and explain that a shared tag is a discovery aid, not
  evidence of compatibility.

### Phase 2 — guided combinations

Offer a question-led picker, for example: “How are fires, rainfall, and
Indigenous territories changing in this region?” It returns a proposed set of
sources, each with a plain-language reason: shared location, complementary
time coverage, or a declared editorial relationship.

The user can remove sources, inspect coverage, access terms, dates, and
methods before exporting the list or its citations.

### Phase 3 — reviewed analysis recipes

Publish versioned, curated recipes only where a qualified reviewer can state
the assumptions and limits. A recipe specifies the inputs, joins or spatial
alignment, time window, exclusions, uncertainty, and a reproducible notebook
or method. It is a documented suggestion, never an automatic conclusion.

## Guardrails

- Do not infer relationships from co-occurring tags alone.
- Never expose precise locations or Indigenous/community knowledge unless its
  governance and consent conditions explicitly allow it.
- Preserve provider terms and source-level licensing in every combination.
- Treat geographical and temporal compatibility as checks a user must see,
  not hidden ranking signals.
- Record the editorial rationale and review date for every explicit link and
  recipe.
