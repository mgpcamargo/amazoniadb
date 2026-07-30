# V2: icon-first AmazoniaDB explorer

## Decision

Keep the existing six taxonomy keys in the catalog and redesign the way people
enter them. The image reference is useful because it offers clear visual
starting points, not because its broad divisions should become AmazoniaDB's
data model. The current taxonomy already covers environmental, territorial,
social, and governance evidence without forcing every source into a vague
catch-all.

This approach protects existing records, filters, URLs, issue forms, and the
three localized versions of the site while making the first screen much easier
to scan.

## Home-page structure

1. **Quiet introduction.** One sentence: AmazoniaDB is a curated directory
   that sends visitors to the original source, not a data-hosting platform.
   Place search and one clear "Explore the catalog" action here.
2. **Six visual starting points.** A responsive grid of exactly six text-led
   icon cards. Each card shows a purpose-built SVG, a plain-language label, a
   current source count, and a one-line example of the kinds of questions it
   can help answer.
3. **Discovery, grounded in the catalog.** A "Discover a source" control can
   select one real, verified record. Do not yet offer a random connection
   between two records: the catalog has no editorial relationship graph, so it
   would imply meaning that has not been reviewed.
4. **The filtered catalog.** Selecting a tile scrolls to the existing catalog,
   applies the filter, updates the shareable URL, and preserves the existing
   citation, access, and report-link functions.
5. **Trust and contribution strip.** A short explanation of verification,
   original-provider links, how to suggest a source, and optional support.

## The six entry points

| Catalog key (unchanged) | V2 public label | Icon language | Example question |
| --- | --- | --- | --- |
| Forest & biodiversity | Forests & biodiversity | Leaf / canopy | Where can I find species and ecosystem evidence? |
| Earth, water & climate | Earth, water & air | River / cloud | What describes climate, water, or atmospheric change? |
| Land use & infrastructure | Land, fire & change | Terrain / route | Where are land conversion and infrastructure data? |
| Peoples, territories & culture | Peoples & territories | Community / boundary | What sources represent territories and cultural context? |
| Society, health & livelihoods | Health & livelihoods | Home / hands | Which data explain everyday conditions and livelihoods? |
| Governance, rights & safeguards | Rights & governance | Shield / scales | Where are legal, policy, and safeguards sources? |

The icons must be an original, consistent SVG family: a shared 24px grid,
single stroke width, round line ends, limited forest / river / earth palette,
and visible text labels. Avoid emoji, stock-icon mixtures, or generated
pictograms. Colour supplements meaning; it never carries it alone.

## Interaction and data rules

- A tile maps to the existing category value rather than a translated string.
  The label, description, icon, and colour live in one category-presentation
  object that each locale reads from.
- Filter state continues to live in the URL. A tile is therefore linkable,
  keyboard-operable, and compatible with the current copy-view-link behavior.
- "Discover a source" selects from the entire verified catalog, clears ordinary
  filters, and explains the source's category and coverage. It must not
  fabricate a thematic connection.
- A future "Explore connections" feature requires explicit, reviewed fields
  such as `themes`, `geographies`, and `relatedIds`, with a visible reason for
  every suggested relationship. See `docs/evidence-connections.md` for the
  proposed metadata, product path, and safety rules.
- Continue linking out to publishers. Do not mirror source files, override
  licenses, or expose sensitive locations simply to make the interface feel
  richer.

## Visual direction

The working design should feel light, editorial, and dependable: an off-white
surface, restrained green accents, generous space, high-contrast type, and
cards that are calm rather than gamified. Logo work is intentionally deferred:
the eventual identity should start from the supplied canopy image and be
cleaned without inventing a replacement concept. It should remain a brand
element, not an illustration competing with the catalog.

The reference's playful, icon-forward readability is retained. Its arbitrary
domain names, heavy outlined panels, and unverified random-pair mechanic are
not carried over.

## Delivery sequence and status

### V2.0 — information architecture and trust — implemented

1. Add a shared category-presentation map with icon, public label,
   description, and colour token for English, Portuguese, and Spanish.
2. Build the six accessible category cards on the three home pages and connect
   them to the existing filters and URL state.
3. Add the verified one-record discovery control and a focused result state.
4. Keep the current compact branding in place until the supplied logo image has
   been cleaned and approved as a separate, focused task.
5. Test keyboard navigation, reduced motion, narrow screens, dark theme, and
   untranslated-record fallback.

Implementation notes: `data/category-presentation.js` is the single source
for the six category icons and localized copy. Each home page preserves its
locale, exposes exactly six tiles, lets an active tile toggle off, and carries
filter or discovery URLs between languages. The quality gate runs a browserless
behavior smoke test for all three locales. Complete Portuguese and Spanish
descriptions are required rather than treated as a silent fallback.

### V2.1 — evidence connections and catalog health — next

1. Define reviewed relationship metadata before exposing dataset-to-dataset
   connections.
2. Add transparent connection reasons and an editorial review check for every
   relationship.
3. Prioritize additions from Colombia, Bolivia, Ecuador, Peru, and
   underrepresented domains; the current catalog is materially Brazil-heavy.
4. Keep Portuguese and Spanish translations complete for every newly added visible metadata field.

## Success measures

- Visitors reach a relevant filtered result in one category selection or one
  search.
- Every tile is understandable without its colour or icon.
- Outbound clicks, citations, and high-quality suggestions increase without
  increasing misleading claims about access or reuse.
- The six categories remain stable enough that researchers, public-interest
  organizations, and policy users can learn them over time.
