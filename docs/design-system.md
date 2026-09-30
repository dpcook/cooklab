# Cook Lab Design System

Brand and design system for **Cook Lab — Decoding Gynecologic Disease**, a research lab at the Ottawa Hospital Research Institute / University of Ottawa led by Dr. David P. Cook. The lab works on single-cell and spatial genomics of ovarian cancer and endometriosis.

This system is the source of truth for color, type, components, data-viz palettes, logos, web pages, slides, posters, reports, and patient/donor-facing materials.

---

## Index

Paths are relative to the repo root.

| File / folder | What it is |
|---|---|
| `README.md` | Repo landing page — brand overview with embedded asset examples. |
| `docs/design-system.md` | This file. Content fundamentals, visual foundations, iconography. |
| `docs/report-style.md` | House style for analysis reports (HTML → PDF). |
| `docs/poster-style.md` | House style for posters, infographics and one-page summaries. |
| `docs/slide-style.md` | House style for slide decks and talks. |
| `docs/website-brief.md` | Full website spec (structure, content, design goals). |
| `docs/fonts.md` | Google Font links (Manrope, Inter, Fraunces). |
| `tokens/colors_and_type.css` | CSS variables — colors, fonts, semantic type styles. Drop into any HTML/site. |
| `tokens/tokens.jsx` | Source-of-truth design tokens: 4 palettes, 2 type pairings, 3 radius modes, dataviz palettes, spacing, shadows. |
| `tokens/primitives.jsx` | Shared React primitives — `<SpecCard>`, `<Swatch>`, `<CookLabMark>`, `<CookLabWordmark>`, `<ArtboardHeader>`. |
| `brand/` | Logos (mark + wordmark, all variants in SVG) and the `index.html` asset previewer. |
| `templates/` | Ready-to-use starting points — `report/`, `letterhead/`, `poster/`. |
| `spec/` | Full design spec on a pan/zoom canvas, plus `preview/` cards (palettes, type, components, brand). |
| `web/index.html` | React JSX components for the lab website (header, hero, project card, paper list, footer). |
| `notion/` | Notion workspace theming (covers, icons, section-icon sets). |
| `SKILL.md` | Agent-skill manifest. Lets Claude Code load this folder as a skill. |

**Sources used to build this system:**
- `docs/website-brief.md` — full website spec.
- Cook Lab Design Spec (interactive canvas with all artboards).
- Original logos and letterhead supplied by David.
- The 2026 Queen's University seminar deck (dark ground, data-driven animation).

---

## Content fundamentals

### Voice
**Confident, ambitious, energetic, peer-to-peer.** Active verbs. First-person plural ("we"). Speaks to medically literate readers without dumbing down.

### Tone rules
- ✅ "We are." / "We do." / "We map." / "We design."
- ❌ "We hope to." / "We aim to." / "We aspire to." / "We are excited to."
- ❌ Hype words: *revolutionary, world-class, cutting-edge, paradigm-shifting* (unless backed by a specific concrete achievement).
- ✅ Use numbers, not adjectives. "142 patients" > "many patients". "7–10 years to diagnosis" > "late diagnosis".
- ✅ One-liner context for non-specialists, then talk like an equal. *"Endometriosis affects 1 in 10 women. The disease has been persistently under-studied …"*
- Questions are framed as **pull-quotes** — italic Manrope display, set off from body.

### Say it once
Supplemental text is the most common way a design goes generic. Each piece of text should carry information the reader needs and cannot already see.
- No labels that repeat the heading or the section the reader is already in.
- No asides that explain the design or the method in passing ("the motion is an interpolation…"). If a caveat matters, it goes in the caption or the methods.
- Slides carry the least text, posters more, reports the most. See the per-document style files.

### Casing
- Headings: sentence case (`Why does chemotherapy stop working?`). A heading states the finding or the question.
- **No uppercase labels above headings.** Section context comes from the heading itself, a running head, or a position indicator (slides).
- Metadata (dates, sources, scope, sample IDs) is set in Inter, sentence case, in the muted text colour.
- Display titles can be lowercase wordmark-style (`cooklab`) or sentence case for editorial moments. Talk and paper titles keep the casing the author gave them.

### Tagline
> Decode. Design. Deliver.

### Mission line
> Decode the biology of gynecologic disease to design new approaches for prevention, detection, and treatment.

### Emoji
**No emoji.** Anywhere. The brand is research-serious; emoji read as flippant.

### Sample copy patterns
- **Hero**: mission or title in Manrope display, tagline below it, affiliation line in muted Inter.
- **Big-number band**: `142` patients · `1.4M` cells profiled · `38` Visium slides · `12` Xenium sections. Numerals in Manrope light, labels in Inter.
- **Headline with an inline number**: *We receive tissue from **37 of 196** ovarian-tumour surgeries* — the number in rust.
- **Project card**: italic question → sentence-case title → 2-3 sentence overview → funding tag → `Read more →`.

---

## Visual foundations

### Color
Four palette variations, all shipped. The default is **Rust + Navy**.

| Palette | Primary | Secondary | Use |
|---|---|---|---|
| **Rust + Navy** *(default)* | `#C2410C` | `#0F172A` | Default. Identity, web, slides, print. |
| **Rust + Teal** | `#C2410C` | `#0D9488` | Subtle nod to ovarian-cancer awareness teal. |
| **Teal Noir** | `#0D9488` (on near-black) | `#0C0A09` | Hero moments, conference posters. |
| **Warm Research** | `#B95A36` | `#527974` | Warm, editorial — outreach + patient-facing. |

Each palette has a 50–900 numeric scale for primary, secondary, tertiary (background warmth), and neutral. Tokens live in `tokens/tokens.jsx`. CSS vars in `tokens/colors_and_type.css`.

**Backgrounds:** white `#FFFFFF` is the default ground. The warm off-white `#F0EEE9` is reserved for the **Warm Research** outreach palette and editorial surfaces; it is **not** the default page background.

### Dark ground
An option, not a default: a near-black navy for content that should open or divide a piece of work.

| Token | Value | Use |
|---|---|---|
| `--ground-dark` | `#0A1120` (navy-800) | The dark background. Darker than the `#0F172A` used in the 2026 Queen's deck, for more contrast. |
| `--on-dark-text` | `#F8FAFC` | Headings and body text. |
| `--on-dark-muted` | `#94A3B8` | Metadata, affiliations, secondary text (7:1 on the ground). |
| `--on-dark-accent` | `#EB6235` (rust-400) | Accent marks and data highlights. Rust-500 is too dark on this ground. |
| `--on-dark-accent-soft` | `#FABEA0` (rust-200) | Accent text and link hover. |

- **Use it for:** title slides and section-break slides, report cover pages, website hero bands and a few feature sections.
- **Don't use it for:** content slides that carry detailed figures, report body pages, posters (ink cost, and legibility at distance). Keep one ground per page; dark and light sections alternate only on the web.
- **Data on dark:** use lighter category colours so marks separate from the ground: `#BCC9DC`, `#607188`, `#EB6235`, `#2BC09A`, with `#33435E` for background cells. Dim a data image to ~30% opacity when it sits behind a heading.
- Avoid pure black. The Teal Noir palette keeps its warm near-black `#0C0A09`; the Rust + Navy dark ground is `#0A1120`.

### Type
Two pairings, both production-ready:

| Pairing | Display | Body |
|---|---|---|
| **Manrope + Inter** *(default)* | Manrope 300 (light) | Inter |
| **Fraunces + Inter** | Fraunces 400 (serif, editorial) | Inter |

Display type is **light-weight Manrope at large sizes with tight tracking** (`-0.035em`) — it's a signature move; do not bold it. Section headings can step up to Manrope 400–500 at smaller sizes. Body is Inter at 15–16px, line-height 1.5–1.6 (denser in reports and posters; see their style files). Numbers in tables and charts use Inter with `font-variant-numeric: tabular-nums`.

**No monospace in designed material.** Labels, metadata, codes (`S06`, `OTB_2384`) and numbers are set in Inter. A system monospace is acceptable only for code listings, such as a reproducibility appendix.

### Spacing
8-point base scale: `0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`. Web pages use generous whitespace (gutters 48–64px desktop). Posters and infographics run much tighter; see `poster-style.md`.

### Radii
Three modes — `sharp` / `soft` / `round`. Default is **soft** (8px small / 16px card / 22px modal). Posters and dense print can go **sharp** (4 / 10 / 14) or use 8px panels. Rounded bar ends and rounded panels are fine in charts and reports. Avoid pill-shaped buttons except for chips/tags.

### Borders
Hairlines, low contrast. `rgba(15,23,42,0.10–0.12)` on light, `rgba(255,255,255,0.08)` on dark. Strong border (focus, active selection): `rgba(15,23,42,0.18)`.

### Shadows
A 5-step elevation system, navy-tinted (not pure-black). `xs` for resting cards, `md` for elevated cards, `lg` for modals, `xl` for popovers. Defined in `tokens/tokens.jsx → SHADOWS`. Print documents don't use shadows.

### Backgrounds & imagery
- **Imagery is real lab data**: scRNA-seq UMAPs, Visium / Xenium spatial overlays, multiplex IF, H&E histology. Treat as editorial — sized deliberately, not "fill". Mocks should use stylized stand-ins; real data is swapped at engineering.
- **No stock medical photography.** No abstract DNA helices, no glowing-cell-on-blue, no white-coat pharma stock.
- **No gradients** as backgrounds, except subtle gradient *masks* on data-viz (sequential / diverging palettes only).
- **Histology anchors** as section dividers — desaturated, set wide and short, with a thin rust hairline above and below.

### Panels and cards
Boxes group related content; use them where grouping helps and leave them out where it doesn't.
- **Use panels** in dense documents (infographics, posters, dashboards, report overview pages) to compartmentalize charts, and for cards on the web.
- **Leave them out** where plain sections read better: running report text, slides with a single figure.
- Style: white surface, 1px hairline border, 8px radius in print, 12–16px on the web, `shadow.xs` resting on the web only. Padding 10–12px in print, 24–32px on the web.
- **No left-colour-border accents** (a tired pattern). A panel's heading does the labelling.

### Data visualization
- **Palettes:** 8-colour categorical (no black), 8-step sequential, 7-step diverging (default slate-blue `#1E3A5F` ↔ rust through a white middle). Values in `tokens/tokens.jsx → DATAVIZ`.
- **Stylized marks are part of the brand:** rounded bar ends, unit dots (one dot per case or cell), dumbbells, flows. A chart doesn't have to be plain to be rigorous.
- **Visual summaries are welcome in every document type,** reports included: overview panels, stat rows, comparison graphics, a unit chart on a cover page.
- **Legends:** a separate legend is standard in research documents (manuscripts, posters, reports). Direct labels on the data are an option where they reduce clutter, as on slides. Neither is required.
- Rust marks the category the reader should find first; slate carries the rest. On the dark ground, see the data colours under Dark ground.

### Animation
Motion shows the data changing: a build that adds a series, cells moving from expression space to tissue position, a funnel dropping cases. Motion that shows nothing is left out.
- **Keep object identity.** When a view changes, the same cells or cases move to their new positions rather than fading out and in.
- **Viewer-triggered by default:** slide builds, clicks, scroll position on the web.
- **Ambient loops are allowed for one title or hero moment per piece when they show real data,** such as the UMAP ↔ tissue morph on the Queen's title slide. Loops pause when off screen.
- **Staggered timing** (each point starting at a slightly different time) reads better than lockstep interpolation for point clouds.
- **Static-first** — every page and deck has a static state (and a PDF fallback for talks). Respect `prefers-reduced-motion`: animations collapse to the end state.
- **Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)` (standard) and `cubic-bezier(0.16, 1, 0.3, 1)` (decelerate, for entrance). Durations 200ms (micro), 400ms (standard), 800ms (hero), 1.5–3s for point-cloud morphs.

### Hover & press states
- **Buttons:** primary darkens one step on hover (e.g. `primary[500]` → `primary[600]`); subtle 2% scale-down on press (`transform: scale(0.98)`).
- **Cards / list items:** hover lifts shadow one step + border darkens to `borderStrong`. No color shift.
- **Links:** underline appears on hover (start with no underline). Rust color throughout — no blue. On the dark ground, links hover to rust-200.

### Layout rules
- **Asymmetric grids** suit web pages and slides: anchor headlines and big numbers to the left; let imagery bleed right.
- **Web:** gutters never less than 48px desktop; sections separated by ≥80px vertical.
- **Print:** density is set by the document type. Posters and infographics fill the page; don't reserve empty margin columns for captions.
- **One signature visual move per page** — UMAP↔spatial morph, phyllotaxis spiral, big-number band, hex grid. Don't stack them.

### Transparency & blur
Used sparingly. Acceptable: a `rgba(15,23,42,0.04)` card surface on a pale canvas, a dimmed data image behind a heading on the dark ground. Avoid frosted glass / heavy backdrop-blur — feels too consumer-app for a research lab.

---

## Document types

| Type | Ground | Density | Text | Style file |
|---|---|---|---|---|
| Report | White body; optional dark cover | Medium | Most: academic prose, figure legends | `report-style.md` |
| Poster / infographic | White | High; panels | Short headings and captions | `poster-style.md` |
| Slides | White content; dark title and section breaks | Low | Least: claim title, minimal labels | `slide-style.md` |
| Web | White, with dark hero or feature bands | Low–medium | Short | `website-brief.md` |

---

## Iconography

The lab does **not** use a heavy iconography system. Icons are functional, never decorative.

### Approach
- **Stroke-based outline icons**, weight `1.5` to match the mark. Color is `currentColor`.
- Set: **Lucide** (CDN: `https://unpkg.com/lucide@latest`). Linked from CDN — no need to bundle. If a custom icon is needed, hand-draw to match Lucide's geometry: 24×24 viewBox, 1.5 stroke, rounded line caps and joins.
- **No filled / glyph icons.** No emoji. No iOS-style coloured app-icon shapes.
- Icon size is usually 16–20px inline with body text, 24–28px beside card headings, 32–40px in approach pillars (single-cell genomics, organoid models, computational biology, biobank).

### Brand-asset icons
The four logos (mark + 3 wordmarks) live in `brand/`. Always SVG, with text outlined. Available colorways: rust (`#C2410C`), navy (`#1E2A44`), white (reverse on dark), black. Never recolor by hand — use the right file. On the dark ground, use the white wordmark.

### Unicode
Used for arrows (`→`, `↗`), bullets (`·`), and ellipsis. No box-drawing characters.

---

## Quick start (for designers)

1. Copy `tokens/colors_and_type.css` into your HTML head.
2. Import logos from `brand/`.
3. Reference type tokens (`var(--font-display)`, `var(--font-body)`) and color tokens (`var(--color-primary)`, `var(--color-bg)`). For a dark section, add the `dark` class to its container.
4. Read `web/index.html` for ready-made components; `templates/report/report-template.html` for analysis reports.

For full design exploration, see `spec/Cook Lab Design Spec.html` — pan/zoom canvas with every artboard, palette/type/radius tweaks live.

---

## Caveats

- **Real lab data is not mocked here.** UMAP, spatial, and histology visuals in slides and the website kit use stylized stand-ins. Engineering swaps in real figures.
- **Headshots not included.** Team-card photos use blocked silhouettes.
- **Funder/collaborator logos not included.** Use placeholder rectangles labeled `[CIHR]`, `[CRS]`, etc.
- **Templates and the spec canvas predate this revision.** `templates/report/`, `templates/letterhead/`, `web/index.html` and `spec/` still use mono uppercase labels. Follow this file where they disagree.
