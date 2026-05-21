# Cook Lab Website — cooklab.ca

## What this is

The public website for **Cook Lab — Decoding Gynecologic Disease**, a research lab at the Ottawa Hospital Research Institute / University of Ottawa led by Dr. David P. Cook. Single-cell and spatial genomics of ovarian cancer and endometriosis.

This is the **lab website**, not David's personal site (that lives at `~/Projects/dpcook/` → davidcook.ca). The lab site speaks first-person plural ("we") and represents the lab as an institution.

## Current state

Greenfield. No `src/` yet. `docs/` and `brand/` hold the design context; everything else is TBD.

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
- **Casing:** section labels in MONO UPPERCASE rust with `0.12–0.16em` letter-spacing (`OUR APPROACH`, `RESEARCH / OVARIAN CANCER`); body headings sentence case.
- **Default palette:** Rust + Navy — rust `#C2410C` primary, navy `#0F172A` secondary, off-white `#F0EEE9` background.
- **Type:** Manrope 300 display (tight tracking `-0.035em` — never bold) + Inter 15–16px body + JetBrains Mono 11px UPPERCASE eyebrows.
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
- Real lab data (UMAPs, spatial slides, histology) gets swapped in at engineering time; mocks use stylized SVG stand-ins from `website-mocks.jsx` (`UmapSpatialTwin`, `PhyllotaxisMark`, `HistologyTile`, `TMAGrid`, `PanelPlot`).
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
