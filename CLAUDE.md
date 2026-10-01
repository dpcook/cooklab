# Cook Lab Website — cooklab.ca

## What this is

The public website for **Cook Lab — Decoding Gynecologic Disease**, a research lab at the Ottawa Hospital Research Institute / University of Ottawa led by Dr. David P. Cook. Single-cell and spatial genomics of ovarian cancer and endometriosis.

This is the **lab website**, not David's personal site (that lives at `~/Projects/dpcook/` → davidcook.ca). The lab site speaks first-person plural ("we") and represents the lab as an institution.

## Current state

Built: Home (dark, glass-mosaic tagline hero), Research hub, People, Publications, Join, plus the ovarian cancer, endometriosis and biobank pages (not yet linked from the hub; "More info soon"). Project pages under `/research/<disease>/<project>` don't exist yet. `public/ovcan_viewer/` is a separate static tool.

## Tech stack

- **Astro 5** + **Tailwind 4** — matches `~/Projects/dpcook/` exactly. Same `@theme` block pattern, same class-based dark mode (`@custom-variant dark (&:where(.dark, .dark *))`), same FOUC-prevention inline script in `BaseLayout`.
- **Astro Content Collections** for `publications`, `people`, `projects` (schema-validated markdown/JSON; pages as `.astro` files).
- **Interactivity:** prefer vanilla `IntersectionObserver` + SVG path interpolation. React islands only for genuinely complex viz (UMAP↔spatial morph, phyllotaxis spiral, hex grids).
- **Dark mode:** class-based on `<html>`, localStorage-persisted, inline script in `<head>` to prevent FOUC. Mirror dpcook's `ThemeToggle.astro`.
- **Accessibility:** WCAG 2.1 AA. `prefers-reduced-motion` respected (animations collapse to end-state). Color contrast verified in both modes.
- **Performance:** lazy-load heavy figures, inline critical CSS, Google Fonts preconnect.

## Hosting

- **Domain:** `cooklab.ca` — registered through Squarespace.
- **DNS:** Squarespace points apex/`www` records at Vercel (same setup as `davidcook.ca` → dpcook.com on Vercel).
- **Host:** Vercel. Static Astro build. No edge runtime needed.
- **Repo:** TBD (GitHub). Vercel auto-deploys on push to `main`.

## Source of truth

| Topic | Where it lives |
|---|---|
| Page structure, copy, voice, design rules | `docs/website-brief.md` (520 lines, real copy not lorem) |
| Pixel-level page mocks | `docs/website-mocks.jsx` (1256 lines — Home, Research Hub, OC, Endo, Biobank, People, Join) |
| Full design system (color, type, spacing, layout) | `docs/design-system.md` |
| Color/font tokens (drop-in CSS) | `docs/colors_and_type.css` — translate to Tailwind `@theme` block |
| Source-of-truth design tokens | `docs/tokens.jsx` (4 palettes, type pairings, dataviz, etc.) |
| React primitive components | `docs/primitives.jsx` |
| Working header/hero/cards/footer reference | `docs/web-ui-kit.html` |
| SVG logos + Word letterheads | `brand/` |
| Brand asset library (canonical) | `~/My Drive/Lab/Branding/` |

**The brand system is authored in Claude Design** (claude.ai/design, project "Lab Branding"). Files in `docs/` and `brand/` are exports — don't edit them as authoritative source. Visual changes (palette, logo, slide templates) happen in Claude Design and re-export.

## Brand quick reference

- **Tagline:** *Decode. Design. Deliver.* (all three words bold; no internal alternation)
- **Mission:** *Decode the biology of gynecologic disease to design new approaches for prevention, detection, and treatment.*
- **Voice:** confident, ambitious, peer-to-peer. Active verbs. First-person plural. Numbers, not adjectives. **No emoji.** Avoid hype words. Avoid "we hope to / aim to / aspire to".
- **Casing:** headings in sentence case, stating the finding or question. **No uppercase labels above headings**; a label either becomes the heading or is dropped. Metadata (dates, venues, funders) in muted Inter, sentence case.
- **Text:** say it once. No labels that repeat the heading, no asides explaining the design or the animation.
- **Default palette:** Rust + Navy — rust `#C2410C` primary, navy `#0F172A` secondary, white `#FFFFFF` background.
- **Rust vs navy:** rust marks what the reader should find first: the hero emphasis, SecB cells, the mark, and links inside running text. Navy carries navigation and actions (the hero button `.btn-navy`, `.arrow-link`, card links, the active nav underline); slate carries categories and metadata (news tags). Hover can turn a title rust.
- **Dark ground:** `#0A1120`. The homepage is dark throughout (`<BaseLayout dark overlayHeader>`: the header floats over the hero and turns solid once the page scrolls). Every other page is white, opening with `PageHeader.astro`. `.dark-band` in `global.css` remains for small dark panels such as the research-page tiles. Accent on dark is rust-400 `#EB6235`, muted text `#94A3B8`. Cells on dark: SecA `#BCC9DC`, SecB `#EB6235`, ciliated `#2BC09A`, other `#33435E`.
- **Type:** Manrope 300 display (tight tracking `-0.035em`) + Inter 15–16px body, also for labels and numbers. **No monospace.** Short names use Manrope 700: the homepage tagline (always bold), the page names in `PageHeader` and the disease names on the Research page. The line under each is Manrope 300 in a lighter colour; accent phrases in it are rust Manrope 600. No italics anywhere: questions (`.question`) are upright Manrope 500.
- **Panels:** only where grouping helps; never left-border accents.
- **Motion:** one ambient loop, the homepage tile shimmer (`TileShimmer.astro`): a few tiles at a time catch the light. Everything else is viewer- or scroll-triggered: the question cards' tiles fade in over the stained section on hover, and the endometriosis timeline draws in. No moving lights or sweeping bands of light; David didn't like either. `prefers-reduced-motion` turns the shimmer off.
- **Mark:** abstract — reads as cell w/ nucleus, scRNA-seq droplet w/ gel bead, or ovary w/ developing follicles. Don't redraw or swap for a generic icon.
- **Iconography:** Lucide stroke-based outline, weight 1.5, `currentColor`. No filled glyphs, no emoji.

## Site structure

```
/                              Home
/research                      Research hub
/research/ovarian-cancer       Disease page
/research/ovarian-cancer/<project>
/research/endometriosis        Disease page
/research/endometriosis/<project>
/biobank                       Ottawa GynePath Biobank
/people                        Wall — PI full-width on top, members in 3-column grid
/publications                  Hand-curated from David's CV at build
/join                          Trainee recruitment + contact
```

Top nav (5 items): **Home · Research · People · Publications · Join.**

## What's deliberately out of scope for v1

(From the brief — these are content gaps, not design questions.)
- Real publication list — migrated from David's CV at build time.
- Team headshots and bios — collected from members on launch.
- Real biobank stats — `[stat]` placeholders.
- News/updates page — homepage strip only.
- Alumni roster — populated on launch.
- Funder/collaborator logos — placeholder rectangles.
- Project page template (§5.5) — brief specifies structure but no artboard mock; design alongside first project.

## Conventions

- Mirror `~/Projects/dpcook/` patterns where possible: `BaseLayout.astro`, `Header.astro`, `Footer.astro`, `ThemeToggle.astro`, `src/styles/global.css` `@theme` block, content collections in `src/content/`.
- Translate `docs/colors_and_type.css` variables 1:1 into the Tailwind `@theme` block. Replace dpcook's orange/blue/neutral with rust/navy/warm.
- Mocks in `docs/website-mocks.jsx` are pixel-level intent — match the visual output, not the React structure. Astro components, plain HTML+CSS where possible, React islands only when needed.
- Real lab data drives the visuals. The glass-mosaic images in `public/mosaic/` are Xenium sections from the HGSC cohort, rendered one tile per cell, coloured by cell type. The renderer and region scripts live in `~/Desktop/Mosaic video/glass/`; its `SPEC.md` explains them.
  - `home-hero.webp`: 1.2 × 0.7 mm of SP24_24824, mirrored so the tissue sits on the right. `home-shimmer.json` holds the same tiles' outlines for the shimmer.
  - `header-*-{800,1600,2400}.jpg`: one set per inside page, rendered at 4 px/µm on a pale floor (`?ground=clear&pale=1`), thinned toward the left so the tiles fade into white, then flattened onto white. They are saved as JPEGs without chroma subsampling: lossy WebP's half-resolution colour frayed the tile edges against white. `PageHeader` serves them with `srcset`.
  - `q-*-he.webp`, `q-*-tiles.webp`, `q-*.json`: the homepage question cards (`QuestionTiles.astro`). Each is a 300 × 167 µm window of a deck region with real cell outlines and 2 px/µm H&E. The toned H&E shows at rest. On hover (or once in view on touch screens) the tiles fade in over it, each in place: the question's cell types first, then the other cells, then the background. No drop or other movement; David didn't like it.
  - `card-ovarian-he-*.jpg`: the ovarian card on the Research page, the H&E of OTB_2384_roi06 toned to slate on white. The coloured tiles are kept for the homepage and the page headers, so they don't appear everywhere.
  - Research page layout: each disease card carries its own three questions; the two cards share one row grid (`grid-template-rows: subgrid`), so their questions line up. No statistic on the cards. The four approach pillars sit in one row.
  - Endometriosis tissue is EAOC-2 (Xenium, graph clusters; sources in `~/My Drive/Lab/Branding/assets/README.md`). It appears on the homepage card (`q-endo-*`) and the Research card (`card-endometriosis-he-*`), and `header-endometriosis-*` is ready for that page's header. The page header itself still shows `DiagnosisTimeline` (with `light`).
  - The research-page tile still draws `src/data/embeddings.csv` through `CellPlot.astro`.
  - `HeroMorph.astro` and `public/data/morph.bin`, the earlier UMAP ↔ tissue homepage animation, are no longer used.
  - Use real data or an honest data graphic rather than decorative stand-ins.
- `docs/website-mocks.jsx`, `docs/web-ui-kit.html` and `docs/primitives.jsx` predate the September 2026 brand revision and still use mono uppercase labels; follow `docs/design-system.md` where they disagree.
- Don't add features the brief doesn't ask for (no blog, no search, no comments). Build the spec, then iterate.

## Re-syncing brand from Claude Design

When the design system updates:
1. Open Claude Design → Lab Branding project.
2. Export the bundle.
3. From the new bundle's `project/`:
   - Copy `colors_and_type.css`, `tokens.jsx`, `primitives.jsx`, `website.jsx` (→ `docs/website-mocks.jsx`), `README.md` (→ `docs/design-system.md`), `ui_kits/web/index.html` (→ `docs/web-ui-kit.html`) into `docs/`.
   - Copy SVGs and DOCX letterheads into `brand/`.
4. Re-translate any token changes into `src/styles/global.css`.
5. The canonical asset library is `~/My Drive/Lab/Branding/`; this repo is a working copy.
