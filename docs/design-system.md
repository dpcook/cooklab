# Cook Lab Design System

Brand and design system for **Cook Lab — Decoding Gynecologic Disease**, a research lab at the Ottawa Hospital Research Institute / University of Ottawa led by Dr. David P. Cook. The lab works on single-cell and spatial genomics of ovarian cancer and endometriosis.

This system is the source of truth for color, type, components, data-viz palettes, logos, web pages, slides, posters, and patient/donor-facing materials.

---

## Index

| File / folder | What it is |
|---|---|
| `README.md` | This file. Overview, content fundamentals, visual foundations, iconography. |
| `colors_and_type.css` | CSS variables — colors, fonts, semantic type styles. Drop into any HTML/site. |
| `assets/` | Logos (mark + wordmark, all variants in SVG), letterhead templates. |
| `fonts/` | Google Font links (Manrope, Inter, JetBrains Mono, Fraunces) — see `fonts/README.md`. |
| `preview/` | Cards rendered in the Design System tab — palettes, type, components, brand. |
| `ui_kits/web/` | React JSX components for the lab website (header, hero, project card, paper list, footer). |
| `slides/` | Sample 16:9 slide templates (title, section, content, big-quote, two-column, figure+caption). |
| `tokens.jsx` | Source-of-truth design tokens: 4 palettes, 2 type pairings, 3 radius modes, dataviz palettes, spacing, shadows. |
| `primitives.jsx` | Shared React primitives — `<SpecCard>`, `<Swatch>`, `<CookLabMark>`, `<CookLabWordmark>`, `<ArtboardHeader>`. |
| `Cook Lab Design Spec.html` | The original full design spec on a pan/zoom canvas. |
| `SKILL.md` | Agent-skill manifest. Lets Claude Code load this folder as a skill. |

**Sources used to build this system:**
- `uploads/Website Brief.md` — full website spec.
- Cook Lab Design Spec (interactive canvas with all artboards).
- Original logos and letterhead supplied by David.

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

### Casing
- Section labels: **MONO UPPERCASE** with letter-spacing, in rust. (`OUR APPROACH`, `RESEARCH / OVARIAN CANCER`, `PREPRINT · 2026`.)
- Body headings: sentence case (`Why does chemotherapy stop working?`).
- Display titles can be lowercase wordmark-style (`cooklab`) or sentence-case for editorial moments.

### Tagline
> Decode. Design. Deliver.

### Mission line
> Decode the biology of gynecologic disease to design new approaches for prevention, detection, and treatment.

### Emoji
**No emoji.** Anywhere. The brand is research-serious; emoji read as flippant.

### Sample copy patterns
- **Eyebrow + hero**: `RESEARCH / OVARIAN CANCER` → *Ovarian Cancer* → italic positioning line.
- **Big-number band**: `142` patients · `1.4M` cells profiled · `38` Visium slides · `12` Xenium sections.
- **Project card**: italic question → ALL-CAPS title → 2-3 sentence overview → funding tag → `[Read more →]`.

---

## Visual foundations

### Color
Four palette variations, all shipped. The default is **Rust + Navy**.

| Palette | Primary | Secondary | Use |
|---|---|---|---|
| **Rust + Navy** *(default)* | `#C2410C` | `#0F172A` | Default. Identity, web, slides, print. |
| **Rust + Teal** | `#C2410C` | `#0D9488` | Subtle nod to ovarian-cancer awareness teal. |
| **Teal Noir** | `#0D9488` (on near-black) | `#0C0A09` | Hero moments, dark mode, conference posters. |
| **Warm Research** | `#B95A36` | `#527974` | Warm, editorial — outreach + patient-facing. |

Each palette has a 50–900 numeric scale for primary, secondary, tertiary (background warmth), and neutral. Tokens live in `tokens.jsx`. CSS vars in `colors_and_type.css`.

**Backgrounds:** off-white `#F0EEE9` (warmth, not blue-white) in light mode. Near-black `#0C0A09` in dark mode. Avoid pure white and pure black.

### Type
Two pairings, both production-ready:

| Pairing | Display | Body | Mono |
|---|---|---|---|
| **Manrope + Inter** *(default)* | Manrope 300 (light) | Inter | JetBrains Mono |
| **Fraunces + Inter** | Fraunces 400 (serif, editorial) | Inter | JetBrains Mono |

Display type is **light-weight Manrope at large sizes with tight tracking** (`-0.035em`) — it's a signature move; do not bold it. Body is Inter at 15–16px, line-height 1.5–1.6. Mono labels are 11px UPPERCASE with `0.12em–0.16em` letter-spacing, used for eyebrows and metadata.

### Spacing
8-point base scale: `0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`. Generous whitespace. Page gutters 48–64px desktop. Card padding 24–32px.

### Radii
Three modes — `sharp` / `soft` / `round`. Default is **soft** (8px small / 16px card / 22px modal). Posters and editorial print can go **sharp** (4 / 10 / 14). Avoid pill-shaped buttons except for chips/tags.

### Borders
Hairlines, low contrast. `rgba(15,23,42,0.10)` on light, `rgba(255,255,255,0.08)` on dark. Strong border (focus, active selection): `rgba(15,23,42,0.18)`.

### Shadows
A 5-step elevation system, navy-tinted (not pure-black). `xs` for resting cards, `md` for elevated cards, `lg` for modals, `xl` for popovers. Defined in `tokens.jsx → SHADOWS`.

### Backgrounds & imagery
- **Imagery is real lab data**: scRNA-seq UMAPs, Visium / Xenium spatial overlays, multiplex IF, H&E histology. Treat as editorial — sized deliberately, not "fill". Mocks should use stylized stand-ins; real data is swapped at engineering.
- **No stock medical photography.** No abstract DNA helices, no glowing-cell-on-blue, no white-coat pharma stock.
- **No gradients** as backgrounds, except subtle gradient *masks* on data-viz (sequential / diverging palettes only).
- **Histology anchors** as section dividers — desaturated, set wide and short, with a thin rust hairline above and below.

### Animation
- **Scroll-triggered, never autoplay.** No looping background animation.
- **Static-first** — every page works without JS and without motion.
- Respects `prefers-reduced-motion` — animations collapse to end-state.
- **Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)` (standard) and `cubic-bezier(0.16, 1, 0.3, 1)` (decelerate, for entrance). Durations 200ms (micro), 400ms (standard), 800ms (hero).

### Hover & press states
- **Buttons:** primary darkens one step on hover (e.g. `primary[500]` → `primary[600]`); subtle 2% scale-down on press (`transform: scale(0.98)`).
- **Cards / list items:** hover lifts shadow one step + border darkens to `borderStrong`. No color shift.
- **Links:** underline appears on hover (start with no underline). Rust color throughout — no blue.

### Cards
White surface, 1px hairline border, `radius.md` (12–16px), `shadow.xs` resting, `shadow.md` hover. Padding 24–32px. **No left-color-border accents** (a tired pattern). If a card needs categorical color, use a **mono uppercase label** at the top in rust — the label *is* the accent.

### Layout rules
- **Asymmetric grids** preferred over centered. Anchor headlines and big numbers to the left rule; let imagery bleed into the right.
- **Generous whitespace.** Page gutters never less than 48px desktop. Sections separated by ≥80px vertical.
- **One signature visual move per page** — UMAP↔spatial morph, phyllotaxis spiral, big-number band, hex grid. Don't stack them.

### Transparency & blur
Used sparingly. Acceptable: a `rgba(15,23,42,0.04)` card surface on a pale canvas. Avoid frosted glass / heavy backdrop-blur — feels too consumer-app for a research lab.

---

## Iconography

The lab does **not** use a heavy iconography system. Icons are functional, never decorative.

### Approach
- **Stroke-based outline icons**, weight `1.5` to match the mark. Color is `currentColor`.
- Set: **Lucide** (CDN: `https://unpkg.com/lucide@latest`). Linked from CDN — no need to bundle. If a custom icon is needed, hand-draw to match Lucide's geometry: 24×24 viewBox, 1.5 stroke, rounded line caps and joins.
- **No filled / glyph icons.** No emoji. No iOS-style coloured app-icon shapes.
- Icon size is usually 16–20px inline with body text, 24–28px in card eyebrows, 32–40px in approach pillars (single-cell genomics, organoid models, computational biology, biobank).

### Brand-asset icons
The four logos (mark + 3 wordmarks) live in `assets/`. Always SVG, with text outlined. Available colorways: rust (`#C2410C`), navy (`#1E2A44`), white (reverse on dark), black. Never recolor by hand — use the right file.

### Unicode
Used for arrows (`→`, `↗`), bullets (`·`), and ellipsis. No box-drawing characters.

---

## Quick start (for designers)

1. Copy `colors_and_type.css` into your HTML head.
2. Import logos from `assets/`.
3. Reference type tokens (`var(--font-display)`, `var(--font-body)`) and color tokens (`var(--color-primary)`, `var(--color-bg)`).
4. Read `ui_kits/web/index.html` for ready-made components.

For full design exploration, see `Cook Lab Design Spec.html` — pan/zoom canvas with every artboard, palette/type/radius tweaks live.

---

## Caveats

- **Real lab data is not mocked here.** UMAP, spatial, and histology visuals in slides and the website kit use stylized stand-ins. Engineering swaps in real figures.
- **Headshots not included.** Team-card photos use blocked silhouettes.
- **Funder/collaborator logos not included.** Use placeholder rectangles labeled `[CIHR]`, `[CRS]`, etc.
