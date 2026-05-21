# Cook Lab Website — Design Brief

Context document for Claude Design. Written to be self-contained — paste the relevant pages in when designing each surface.

---

## 1. Identity

- **Lab name:** Cook Lab *(word and mark together per the existing Design Spec)*
- **Mission (hero copy):** *Decode the biology of gynecologic disease to design new approaches for prevention, detection, and treatment.*
- **Tagline (small, used in footer and secondary moments):** *Decode. Design. Deliver.*
- **Affiliation line:** Ottawa Hospital Research Institute · University of Ottawa
- **PI:** David P. Cook, PhD — Scientist (Cancer Research Program, OHRI); Assistant Professor (Dept. of Cellular & Molecular Medicine, University of Ottawa)
- **Research field:** single-cell and spatial genomics of gynecologic disease (ovarian cancer, endometriosis)
- **Primary audiences, in order:** (1) prospective trainees, (2) scientific collaborators, (3) donors/funders. Copy assumes a medically literate reader.

**Tone:** confident, ambitious, energetic, peer-to-peer. Active verbs. First person plural ("we"). No hedging ("hope to", "aim to", "we aspire") — use "we are" or "we do". No hype words ("revolutionary", "cutting-edge", "world-class") unless there's a specific achievement behind them. Warmth without whimsy.

---

## 2. Visual direction

### 2a. Brand system

Use the existing **Cook Lab Design Spec** as the source of truth for colors, type, components, data-viz palettes, and logos. Summary:

- **Palette (default):** Rust `#C2410C` primary, Navy `#1E3A5F` secondary, off-white `#F0EEE9` background. Alternates: Rust/Teal, Teal Noir (dark mode hero moments), Warm Research.
- **Type:** Manrope (light weights for display) + Inter (body). Fraunces as editorial alternative.
- **Mark:** the three-reading cell/droplet/ovary — don't substitute.
- **Modes:** light and dark, both shipped. Most of the site lives in light; dark mode is a toggle for eye comfort and a few hero/section moments.

### 2b. Signature visual moves — the site's motion language

The website is the right medium to bring the lab's science to life in ways a PDF can't. Lean into this. Design each page assuming real lab data will be used (real UMAPs, real spatial slides, real organoid photos), not stock imagery or generic medical photography.

Six signature moves to draw from:

1. **UMAP ↔ Spatial morph** (homepage hero, disease pages)
   Single cells live in two coordinate systems: a gene-expression UMAP and their actual spatial tissue position (Visium / Xenium X-Y). Scroll-triggered, the points interpolate from one layout to the other — each point colored by cell type. This is the lab's core methodology in a single continuous motion. Use it once as a hero, not as decoration everywhere.

2. **Tissue fluorescence & histology anchors**
   Real multiplex immunofluorescence (e.g., DAPI + PanCK + CD8 + αSMA on ovarian tumor sections) and H&E histology crops as section dividers and hero bands. Treat them as editorial material — sized deliberately, not fill.

3. **Phyllotaxis cell-type spiral** (already in the spec)
   Use consistently for project-page heroes — visually distinctive, doubles as a cell-type legend.

4. **Big-number bands** (disease pages, project pages)
   Real stats: "142 patients", "1.4M cells profiled", "38 Visium slides", "12 Xenium sections". Manrope display at ~56px, mono sub-labels.

5. **Spatial Visium / Xenium grids**
   Hex-grid overlays showing niche identity or gene expression on tissue. Use for project-page figure panels and homepage accents.

6. **Cell-state trajectory paths**
   Curved lines through UMAP space showing state transitions (e.g., how SecA → SecB → Cil states emerge under treatment). Good for the treatment-resistance project page.

**Interaction principles:**
- Scroll-triggered animations, never autoplay.
- Static-first — the page must work without JavaScript and without motion.
- Respect `prefers-reduced-motion`: animations collapse to the end-state.
- Lazy-load heavy visualizations below the fold.

### 2c. Asset library (assume these exist)

- **SVG logos** — full set in `~/Lab/Branding/brand/` (mark + wordmarks in rust/navy/white/black, horizontal + stacked).
- **Data figures** — real scRNA-seq UMAPs, Visium/Xenium spatial grids, cell-type trajectories from the lab's published and unpublished work. Designer should mock these using representative stylized versions; engineer will swap in actual SVGs/WebGL components.
- **Microscopy** — real multiplex immunofluorescence and H&E histology from Ottawa GynePath Biobank samples. Use stylized stand-ins for mocks.
- **Headshots** — to be photographed.

---

## 3. Site structure

```
Home                               (/)
Research hub                       (/research)
├── Ovarian Cancer                 (/research/ovarian-cancer)
│   ├── Treatment resistance       (/research/ovarian-cancer/treatment-resistance)
│   ├── Rare subtypes              (/research/ovarian-cancer/rare-subtypes)
│   └── TROP2-targeted ADCs        (/research/ovarian-cancer/trop2-adcs)
├── Endometriosis                  (/research/endometriosis)
│   ├── Early detection            (/research/endometriosis/early-detection)
│   ├── Novel immunotherapies      (/research/endometriosis/immunotherapies)
│   └── Progression to ovarian     (/research/endometriosis/progression)
└── [Our Approach — section on the hub, not a sub-page]
Biobank                            (/biobank)
People                             (/people)
Publications                       (/publications)
Join                               (/join)
```

**Top nav (5 items):** Home · Research · People · Publications · Join.
Mark/wordmark also links home. Biobank reached from the Research hub. Contact folded into Join.

---

## 4. The six research questions

These are the intellectual spine of the site. Each is the headline of its project page, a card on the homepage (3 of 6 rotate), and appears in the Research hub grouped by disease.

| # | Question | Disease | Project |
|---|---|---|---|
| 1 | *Why do high-grade serous ovarian cancers become resistant to chemotherapy after a strong initial response?* | Ovarian | Treatment resistance |
| 2 | *How does the biology of rare ovarian cancer subtypes differ from high-grade serous disease?* | Ovarian | Rare subtypes |
| 3 | *Why have immunotherapies failed in ovarian cancer?* | Ovarian | TROP2-targeted ADCs (immune-adjacent) |
| 4 | *Can we detect endometriosis earlier?* | Endo | Early detection |
| 5 | *Can developments in cancer therapeutics improve outcomes for women with endometriosis?* | Endo | Novel immunotherapies |
| 6 | *How does endometriosis develop into ovarian cancer?* | Crossover | Progression |

Homepage card copy for each (2-3 sentence framing, same voice throughout):

1. **Why does chemotherapy stop working?**
   Most patients with high-grade serous ovarian cancer respond to first-line platinum chemotherapy — then relapse with disease that no longer responds. We're mapping the cell states that survive treatment and tracking how they re-emerge, looking for the vulnerabilities that could prevent recurrence. *[Explore →]*

2. **How are rare subtypes different?**
   Low-grade serous and clear cell carcinomas together account for roughly 20% of ovarian cancer diagnoses but receive a fraction of the research attention. We're profiling their cellular architecture at single-cell and spatial resolution to find subtype-specific targets. *[Explore →]*

3. **Why have immunotherapies failed?**
   PD-1 blockade transformed outcomes in many cancers, but not ovarian cancer. We're dissecting the immune landscape of HGSC tumors to understand what's missing — and what combinations might work. *[Explore →]*

4. **Can we detect endometriosis earlier?**
   Diagnosis currently takes 7-10 years on average. We're searching for molecular signatures in blood and tissue that could shorten that delay from years to months. *[Explore →]*

5. **Can cancer therapeutics help endometriosis?**
   Endometriosis shares features with cancer — chronic inflammation, tissue invasion, immune evasion. We're testing whether targeted therapies developed for cancer can offer relief where hormonal approaches have fallen short. *[Explore →]*

6. **How does endometriosis become cancer?**
   Women with endometriosis face 2-3× the risk of ovarian cancer. We're tracing the cellular transitions from benign lesion to malignant transformation — catching the process before it progresses. *[Explore →]*

---

## 5. Page specs

Each page includes: purpose, layout, copy scaffold (real, not placeholder), visual prescriptions.

### 5.1 Home (/)

**Purpose:** Establish identity and mission in one screen; pull visitors into the research via questions.

**Sections:**

The homepage is intentionally lean — it establishes identity, hooks via questions, surfaces recent work, and gets out of the way. Disease cards, approach cards, and the biobank strip live on the Research page / Biobank page respectively; don't duplicate them here.

1. **Hero**
   - Mark + wordmark (top-left or centered)
   - Small line above mission: `OTTAWA HOSPITAL RESEARCH INSTITUTE · UNIVERSITY OF OTTAWA` (mono, rust, letter-spaced)
   - Mission in Manrope display (~48-56px): *Decode the biology of gynecologic disease to design new approaches for prevention, detection, and treatment.*
   - Tagline small below: *Decode · Design · Deliver.*
   - Visual anchor: the **UMAP ↔ spatial morph** animation sits to the right of the mission (or beneath on mobile). Subtle; not loud.
   - **Layout:** text column should be wider than the visual (not 50/50). Target ~60/40 so the affiliation line doesn't wrap and the mission reads in two lines max.

2. **Questions we're asking**
   - Section label (mono, rust): `QUESTIONS WE'RE ASKING`
   - 3 of the 6 questions shown in a rotating card row (client-side pick on page load, or editorial choice). Each card: question in editorial italic Manrope 22-26px, 2-3 sentence framing (Inter 14px, `textMuted`), `[Explore →]` linking to project page.
   - Below cards: `SEE ALL OUR RESEARCH →` link to Research hub.

3. **Latest**
   - Pattern from the existing `ArtboardLabHome` "Recent" section. 2-3 recent items. Each item: tag (`PREPRINT · 2026` / `NAT GENET · 2025`), title, authors line. Arrow to the paper.
   - `VIEW ALL PUBLICATIONS →` at the top-right.

4. **Footer**
   - Left: mark + wordmark + tagline
   - Middle: OHRI logo · UOttawa logo · key funder logos (CIHR, CCS, CRS)
   - Right: email (`dacook@ohri.ca`), address (OHRI Centre for Cancer Therapeutics, 501 Smyth Rd, Ottawa), any social
   - Bottom line: © 2026 Cook Lab

---

### 5.2 Research hub (/research)

**Purpose:** Give serious visitors a full map of what the lab studies and how. This is where someone decides whether to dig into a specific project or approach.

**Sections:**

1. **Header**
   - Label: `OUR RESEARCH`
   - Mission (slightly longer than home): *"We study gynecologic diseases to understand their fundamental biology and translate discoveries into better prevention, detection, and treatment."*
   - Tagline large: *Decode. Design. Deliver.*

2. **Disease focus areas** (expanded from home)
   - 2 large cards as on home, but with fuller framing (3-4 sentences each) and a lead visual (spatial slide for OC, endometrial histology for endo).
   - Each card clickable → disease page.

3. **Research questions** (full list)
   - Section label: `WHAT WE'RE ASKING`
   - All 6 questions listed, grouped under their disease. Each question links to its project page.
   - Layout: 2 columns (Ovarian Cancer / Endometriosis), questions stacked as editorial italics with a short sub-line ("→ Treatment resistance project").

4. **Our approach** (full treatment)
   - Section label: `OUR APPROACH`
   - Intro line: "We integrate experimental and computational methods to understand disease at unprecedented resolution."
   - 4 cards in a grid (2×2 or 1×4 depending on width). Each with icon, pillar name, 2-3 sentence description:
     - **Single-cell & spatial genomics:** "We profile individual cells to reveal hidden diversity and cell states, and we map how those cells are organized in tissue. Our workflows span scRNA-seq, snPATHO-seq, and Xenium spatial transcriptomics."
     - **Patient-derived disease models:** "We build organoid and primary cell models from patient samples — systems that let us test our findings and evaluate new therapeutics in biology that reflects human disease."
     - **Computational biology:** "We develop and apply methods to extract biological insight from complex data. Cell-state inference, spatial neighborhood analysis, trajectory modeling, and integration across modalities."
     - **Ottawa GynePath Biobank:** "Our research is powered by patient-contributed samples and clinical data. The biobank grounds every project in human biology from the start. [Learn more →]"

---

### 5.3 Disease page — Ovarian Cancer (/research/ovarian-cancer)

**Purpose:** Establish the disease context, the lab's stance, and entry points into the three projects.

**Keep it lean.** Structure is Hero → The challenge → Current projects → Collaborators → Funding. Don't add editorial framing sections ("How we see the disease," "Our perspective," etc.) between these — the hero and challenge already do that work. Visuals get layered in later; don't reach for decorative copy to fill space.

**Sections:**

1. **Hero**
   - Scroll-triggered UMAP ↔ spatial morph OR still hero image (multiplex IF of HGSC tumor).
   - Small label: `RESEARCH / OVARIAN CANCER`
   - Title (Manrope display, 48-64px): *Ovarian Cancer*
   - Positioning one-liner below (Manrope italic, 20-24px): *"The most lethal gynecologic malignancy. We're decoding its complexity to design smarter treatments."*

2. **The challenge**
   - Section label: `THE CHALLENGE`
   - 2 paragraphs:
     - "Ovarian cancer remains the most lethal gynecologic malignancy. Most patients are diagnosed at advanced stage. High-grade serous disease — the most common subtype — responds well to first-line platinum chemotherapy, only to return months later with resistance. Fewer than half of patients survive five years."
     - "Immunotherapies that transformed other cancers have barely moved the needle here. Rare subtypes like low-grade serous and clear cell behave differently but receive a fraction of the research attention. We believe the answers lie in cellular adaptation — how tumor cells change in response to their environment and treatment, and the vulnerabilities these transitions expose."
   - Callout stat: **<50% five-year survival**

3. **Current projects** (3 cards, each with the question as headline)

   **Card 1**
   - Driving question (editorial italic): *"Why does chemotherapy stop working?"*
   - Title: `CELL STATE PLASTICITY AND TREATMENT RESISTANCE`
   - Thumbnail: cell-state trajectory visualization
   - Body: "We've identified distinct cell states that emerge during chemotherapy in HGSC tumors — the SecA, SecB, and ciliated (Cil) epitypes. These states are conserved across patients and enriched after treatment. We're testing whether blocking state transitions can prevent resistance before it develops."
   - Funding tag: `CIHR PROJECT GRANT · 2025–2030`
   - `[Read more →]`

   **Card 2**
   - Driving question: *"How are rare subtypes different?"*
   - Title: `DIVERGENT FEATURES OF RARE OVARIAN CANCER SUBTYPES`
   - Thumbnail: comparative spatial sections
   - Body: "Low-grade serous and clear cell ovarian carcinomas respond poorly to treatments designed for HGSC. We're building single-cell and spatial atlases of these subtypes to identify their unique biology — and the therapies that could target it."
   - Funding tag: `CRS BRIDGING THE GAP · 2024–2027`
   - `[Read more →]`

   **Card 3**
   - Driving question: *"Can targeted therapy overcome resistance?"*
   - Title: `TROP2-TARGETED ANTIBODY-DRUG CONJUGATES`
   - Thumbnail: tumor microenvironment visualization
   - Body: "Chemotherapy pushes HGSC cells toward a state that expresses TROP2. We're testing whether precisely-timed TROP2-targeting ADCs can eliminate these cells before stable resistance develops — and mapping the immune response such therapies provoke."
   - `[Read more →]`

4. **Key collaborators**
   - Logo/name strip. Examples: OvCAN Consortium, CRCHUM (Mes-Masson lab), MSK (Schwartz lab).

5. **Funding**
   - Funder logo/name strip: CIHR, Canadian Cancer Society, Cancer Research Society, OvCAN.

---

### 5.4 Disease page — Endometriosis (/research/endometriosis)

**Purpose:** Same template as ovarian. Different tone — less "established killer" framing, more "under-studied disease with major impact and recent technological openings."

**Sections:**

1. **Hero**
   - Hero image: endometrial tissue histology or an endometriotic lesion visualization.
   - Label: `RESEARCH / ENDOMETRIOSIS`
   - Title: *Endometriosis*
   - Positioning: *"A chronic inflammatory disease that shapes millions of lives — and a frontier for modern genomics."*

2. **The challenge**
   - "Endometriosis affects roughly 1 in 10 women. It causes severe pain, infertility, and a 2-3-fold elevated risk of ovarian cancer. Diagnosis currently takes 7-10 years on average. Treatments are limited to hormonal suppression or surgery — neither addresses the underlying biology, and neither prevents the small but consequential transition to malignancy."
   - "The disease has been persistently under-studied. Racial and ethnic disparities in pathobiology and outcomes remain poorly characterized. We believe the tools that transformed cancer research — single-cell genomics, spatial profiling, patient-derived models — can close this gap."
   - Callout stats: **1 in 10 women** | **7-10 years to diagnosis**

3. **Current projects** (3 cards)

   **Card 1**
   - Question: *"Can we detect endometriosis earlier?"*
   - Title: `EARLY DETECTION & BIOMARKERS`
   - Body: "Diagnosis today still requires surgery. We're searching for molecular signatures in blood and tissue that enable non-invasive diagnosis — shortening the delay from years to months."
   - Funding tag: `CIHR ENDOMETRIOSIS GRANT · 2025–2030`

   **Card 2**
   - Question: *"Can cancer therapeutics help?"*
   - Title: `NOVEL IMMUNOTHERAPIES (BiTEs / BiKEs)`
   - Body: "Endometriosis shares features with cancer: chronic inflammation, tissue invasion, aberrant immune signaling. We're testing whether bispecific antibody approaches — T-cell and NK-cell engagers — can eliminate lesion-driving cells while sparing healthy tissue."

   **Card 3**
   - Question: *"How does endometriosis become cancer?"*
   - Title: `PROGRESSION TO OVARIAN CANCER`
   - Body: "Clear cell and endometrioid ovarian cancers arise from endometriotic lesions. We're tracing this transition cell-by-cell — identifying the early molecular changes that mark the shift from benign to malignant."

4. **Key collaborators**
   - Dr. Sony Singh (uOttawa / OH), others TBD.

5. **Funding**
   - CIHR.

---

### 5.5 Project page template (/research/<disease>/<project>)

Two treatments:

**(a) Hero project treatment** — for 1-2 flagship projects. Use the full infographic pattern from the existing `ArtboardProjectPage`:
- Driving question as oversized italic hero quote
- Big-number band (patients, cells, samples, sites)
- Figure panel (UMAP + spatial overlay + composition bars)
- Cohort breakdown matrix
- Key findings cards (3, each with a big stat + sentence)
- Program timeline / milestones
- Open datasets table
- Team-on-this-project mini-cards
- Collaborators + funding

**(b) Standard treatment** — for the remaining projects:
- Driving question hero
- Overview (2-3 paragraphs: what's the problem, what we're doing, what we've learned)
- 2-3 findings highlights (each: big stat or visual + 1-2 sentences)
- Team mini-cards
- Collaborators + funding + linked papers/datasets

Flagship candidate for the infographic treatment: **Cell state plasticity and treatment resistance** (CIHR-funded, the most developed project; data density justifies the format).

Copy scaffolds for each of the 6 projects:

1. **Treatment resistance (HGSC)**
   Question: *Why do high-grade serous ovarian cancers become resistant to chemotherapy after a strong initial response?*
   Overview: "High-grade serous ovarian cancer (HGSC) is the most common and lethal form of ovarian cancer. The majority of patients respond to first-line platinum-based chemotherapy — and then relapse. We've shown that HGSC tumors contain conserved malignant cell states — the SecA, SecB, and ciliated (Cil) epitypes — and that these states shift under treatment. The Cil state, in particular, is enriched after chemotherapy and expresses markers including TROP2. Our current work tests whether blocking or redirecting these state transitions can prevent resistance from taking hold."
   Stats to feature: 142 patients · 1.4M cells profiled · 38 Visium slides · 12 Xenium sections (use real numbers when available).

2. **Rare subtypes**
   Question: *How does the biology of rare ovarian cancer subtypes differ from high-grade serous disease?*
   Overview: "Low-grade serous carcinoma (LGSC) and clear cell carcinoma together represent ~20% of ovarian cancer diagnoses but have been studied at a fraction of the depth of HGSC. They respond poorly to HGSC-directed treatments. We're building single-cell and spatial atlases of both subtypes, comparing their cellular architecture, microenvironment, and signaling to HGSC — identifying subtype-specific vulnerabilities we can target."

3. **TROP2-targeted ADCs**
   Question: *Can we target chemotherapy-induced vulnerabilities before resistance develops?*
   Overview: "Chemotherapy pushes HGSC cells toward cell states that express TROP2. A new generation of TROP2-directed antibody-drug conjugates (ADCs) have shown activity in other cancers. We're asking whether precisely-timed ADC dosing — delivered at the window when chemo-induced cell states are transiently vulnerable — can eliminate these cells before stable resistance develops, and how ADC treatment remodels the tumor immune microenvironment."

4. **Early detection (endometriosis)**
   Question: *Can we detect endometriosis earlier?*
   Overview: "Endometriosis diagnosis today requires surgical confirmation, and the average patient waits 7-10 years from symptom onset to diagnosis. We're profiling patient tissue, blood, and urine at single-cell and molecular resolution to identify signatures that distinguish endometriosis from other causes of pelvic pain — building the foundation for a non-invasive test."

5. **Novel immunotherapies (endometriosis)**
   Question: *Can developments in cancer therapeutics improve outcomes for women with endometriosis?*
   Overview: "Bispecific T-cell and NK-cell engagers (BiTEs and BiKEs) have become a powerful new class of cancer immunotherapies. Endometriotic lesions share immunological features with tumors: they are invasive, persistent, and accompanied by dysregulated immune signaling. We're identifying lesion-specific surface markers and designing bispecific engagers that could eliminate lesion cells while sparing normal tissue — a fundamentally new therapeutic approach for a disease treated today with hormones or surgery."

6. **Progression (endometriosis → ovarian cancer)**
   Question: *How does endometriosis develop into ovarian cancer?*
   Overview: "Clear cell and endometrioid ovarian cancers arise from endometriotic lesions. The cellular and molecular events that mark this transition are poorly understood. Using spatial genomics on matched lesion and tumor samples from the Ottawa GynePath Biobank, we're tracing the transition cell-by-cell — identifying the earliest changes that predict malignant transformation, and the windows where intervention might stop the process."

---

### 5.6 Biobank (/biobank)

**Purpose:** Position the Ottawa GynePath Biobank as the lab's research engine. Audience: collaborators considering partnership, donors curious about infrastructure, patients wanting to understand how their contributions are used. **Not a donation pitch** — OHRI handles that separately.

**Sections:**

1. **Hero**
   - Label: `INFRASTRUCTURE`
   - Title: *Ottawa GynePath Biobank*
   - Positioning: *"The engine of our research — powered by patient partnership."*
   - Visual: tissue microarray or a stylized biobank visualization.

2. **Framing paragraph**
   - "The Ottawa GynePath Biobank is a growing repository of tissue, blood, organoids, and clinical data contributed by patients across The Ottawa Hospital. It is the foundation every project in our lab is built on."
   - "Rather than a standalone initiative, the biobank is woven into everything we do: it grounds every hypothesis in human biology from the start, and it supports collaborators across Canada and internationally working on the same questions."

3. **What's in it** (stats panel — big numbers like homepage)
   - Patient cases enrolled (TBD)
   - Tissue, blood, urine samples with paired clinical data
   - Derived organoid lines (TBD)
   - scRNA-seq datasets (TBD)
   - Spatial transcriptomic sections (TBD)
   *(Real numbers TBD from David — leave as placeholders labeled `[stat]` in the mock.)*

4. **How the biobank fuels our research** (3-item list, each links to the relevant project)
   - "Mapping cell-state plasticity across 142 patients." `[Treatment resistance →]`
   - "Identifying protein biomarkers for early endometriosis detection." `[Early detection →]`
   - "Tracing the transition from endometriosis to ovarian cancer." `[Progression →]`

5. **For collaborators**
   - Headline: *Interested in collaborating?*
   - Body: "We actively collaborate with researchers who need high-quality patient samples and paired clinical data. We prioritize projects that complement our own and return insight to the broader research community. To discuss a collaboration, contact us."
   - `[Email David →]`

6. **For patients**
   - Headline: *Interested in contributing?*
   - Body: "Enrollment is coordinated through The Ottawa Hospital's consent and tissue program. Learn more about how the hospital collects and manages biobank samples."
   - `[Learn more at OHRI →]` (external link to OHRI's process)

---

### 5.7 People (/people)

**Purpose:** Personalize the lab; signal scientific depth and mentorship culture to prospective trainees.

**Sections:**

1. **Intro** (1 paragraph)
   "The Cook Lab is a team of postdocs, graduate students, technicians, and undergraduates with backgrounds spanning molecular biology, bioinformatics, and clinical research. We value curiosity, rigor, and collaboration — and we invest in training the next generation of gynecologic disease researchers alongside our own work."
   Closing: "We're always looking for talented people. [Join the lab →]"

2. **Principal Investigator** (larger, feature card)
   - Photo of David Cook
   - `DAVID P. COOK, PhD`
   - Title: Principal Investigator · Assistant Professor
   - Affiliations (two lines):
     - Scientist — Cancer Research Program, Ottawa Hospital Research Institute
     - Assistant Professor — Dept. of Cellular & Molecular Medicine, University of Ottawa
   - 2-sentence bio (David to provide): "David trained at [X], completed his PhD/postdoc in [Y] at [Z]. His research focuses on cellular adaptation in gynecologic disease."
   - Links: `[dpcook.com →]` `[Email →]` `[Google Scholar →]` `[ORCID →]`

3. **Team wall** — uniform 3-column grid. Every member gets the same treatment. **No role-based subgrouping; no project/expertise line.** Generous space for the headshot. Below the image: name and role (role only, no research area).

   Order: active members first, then incoming (same card, role suffixed with *(Incoming)*).

   - Sarah Nersesian — Postdoctoral Fellow
   - John Abou-Hamad — Postdoctoral Fellow
   - Emma Durocher — PhD Student
   - Athena Southworth — MSc Student
   - Hugh Deng — Jr. Research Technician
   - Bhavya Joshi — *[role TBC]*
   - Colin O'Dwyer — *[role TBC]*
   - Judy Sobh — *[role TBC]*
   - Elizabeth Hughes — Postdoctoral Fellow *(Incoming)*
   - Katrina Verey — Undergraduate *(Incoming)*
   - Michelle Sukadil — *(Incoming)*
   - Sara Popovic — *(Incoming)*

4. **Alumni** (simpler format, table or lightweight list)
   - Name · Role while in lab · Current position · Year left
   - To be populated; leave placeholder in mock (`[Alumni section — populated on launch]`).

---

### 5.8 Publications (/publications)

**Purpose:** Scientific credibility. Hand-curated, searchable, highlightable.

**Pattern:** use the existing `ArtboardPaperList` from the design spec. No major redesign needed.

**Features:**
- Header: `PUBLICATIONS` label + headline number (e.g. *Twenty-eight papers.*)
- Filter chips: **All · Peer-reviewed · Preprints · Methods · Reviews**
- Reverse chronological, grouped by year (subheadings: `2026 / 2025 / 2024 / ...`)
- Each entry: year (mono), venue (italic display), title (main), authors (PI bolded), type tag (mono uppercase), DOI/preprint link
- Highlight flag (visual treatment: left rust-border) for featured/flagship papers

**Data authoring:** hand-curated TypeScript or Content Collection. Migrated from David's existing CV/publications list. Paper-by-paper control over what appears and what's highlighted.

---

### 5.9 Join (/join)

**Purpose:** Convert interested trainees into contacts. Set expectations; make the first email easier to write.

**Sections:**

1. **Header**
   - Label: `JOIN THE LAB`
   - Title: *Join us.*
   - Intro paragraph: "We're always excited to hear from talented trainees who share our commitment to understanding and treating gynecologic disease. Our lab is home to people from diverse backgrounds — clinical, computational, experimental — and we prioritize mentorship alongside productivity. Here's how to reach us."

2. **Three tracks** (stacked sections or 3-column)

   **Postdoctoral Fellows**
   "We look for postdocs with strong backgrounds in molecular biology, single-cell or spatial genomics, computational biology, or clinical/translational research. Funded positions are announced here when available; we also welcome inquiries from applicants planning their own fellowship applications (CIHR, CCS, EMBO, HFSP, etc.)."
   *How to apply:* "Email David directly with your CV, a brief statement of research interests, and the names of three references. Tell us which of our research questions most interests you."

   **Graduate Students (PhD / MSc)**
   "We supervise students through the Department of Cellular and Molecular Medicine at the University of Ottawa. Prospective students should apply to the CMM program and list David as a potential supervisor."
   *How to apply:* "Before formally applying, email David with your CV and a short paragraph on why you're interested in our research. Informal inquiries are welcome and encouraged."

   **Undergraduates**
   "We host honors thesis students, summer research trainees (NSERC USRA, OGS), and fourth-year co-op placements. Positions are competitive; we prioritize students with strong academic records and demonstrated interest in gynecologic research or genomics."
   *How to apply:* "Email David in the fall for positions the following academic year."

3. **Contact block**
   - "Dr. David P. Cook — dacook@ohri.ca"
   - "When you reach out, please tell us which of our research questions most interests you, and why. This helps us understand fit before we connect further."
   - Location: "Ottawa Hospital Research Institute · Centre for Cancer Therapeutics · 501 Smyth Road, Ottawa"

---

## 6. Tone directives (for Claude Design's copywriting within mocks)

- First person plural throughout ("we study", "we're developing").
- Active, present tense: decode, map, identify, develop, pursue, test, build, trace.
- Avoid: "hope to", "aim to", "we aspire", "we are excited to".
- Avoid: "revolutionary", "world-class", "cutting-edge" (unless the context genuinely demands it — "state-of-the-art" sparingly).
- Use one-liner context for non-specialists — briefly — then continue at peer-to-peer level. Example: "Endometriosis affects 1 in 10 women" before diving in.
- Questions should feel like pull quotes: italic Manrope display, set off from body.
- Numbers beat adjectives. "142 patients" > "many patients". "7-10 years to diagnosis" > "late diagnosis".

---

## 7. Technical notes (for the implementer, not Claude Design)

*These do not affect the design; including so the designer knows constraints.*

- **Stack:** Astro 5 + Tailwind 4 (matching `~/Projects/dpcook`). Static build.
- **Content:** Astro Content Collections for publications, people, projects (schema-validated markdown or JSON). Pages as `.astro` files.
- **Hosting:** Vercel or Netlify (to match whatever dpcook.com uses — TBC). DNS from Squarespace pointed at the host.
- **Domain:** `cooklab.ca`.
- **Interactivity:** animations via `framer-motion` or vanilla IntersectionObserver + SVG path interpolation. Heavy data visualizations as React islands in Astro.
- **Dark mode:** class-based toggle, localStorage-persisted, inline script to prevent FOUC (matching dpcook.com pattern).
- **Accessibility:** WCAG 2.1 AA target. `prefers-reduced-motion` respected. Color contrast verified in both modes.
- **Performance:** lazy-load heavy figures; inline critical CSS; Google Fonts preconnect.

---

## 8. What's NOT in this brief (intentional)

- **Publication list itself** — will be migrated hand-curated from David's CV at build time.
- **Team member photos and bios** — will be collected from lab members, not mocked here.
- **Real biobank statistics** — TBD; use `[stat]` placeholders in mocks.
- **News/updates page** — homepage strip only for v1.
- **Alumni roster** — to be populated on launch.
- **Exact collaborator logos** — TBC.

---

*Brief prepared to accompany the Cook Lab Design Spec. When designing a new page in Claude Design, paste the relevant page spec (§5.x) plus §2 (Visual direction) as context.*
