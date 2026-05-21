// Website page artboards — Home, Research Hub, Disease pages, Biobank, People, Join.
// Each renders a static full-page mock at 1120-wide "desktop" resolution.
// Signature moves:
//   • Phyllotaxis mark (cell-type spiral)
//   • UMAP ↔ Spatial twin-panel (hints at scroll-triggered morph)
//   • Big-number stat bands
//   • Tissue/histology anchor tiles (stylized)
//   • Question-as-italic-pullquote
//
// All reference the existing Cook Lab design system (theme, fonts, tokens).

// ─────────────────────────────────────────────────────────────────────────
// Shared chrome + widgets
// ─────────────────────────────────────────────────────────────────────────

function WebNav({ theme, active = 'Research' }) {
  const items = ['Research', 'People', 'Publications', 'Join'];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '20px 40px',
      borderBottom: `1px solid ${theme.border}`, gap: 32, flexShrink: 0,
    }}>
      <CookLabWordmark theme={theme} size={15} markSize={20} />
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 28, fontSize: 13, color: theme.textMuted, fontWeight: 500, alignItems: 'center' }}>
        {items.map((l) => (
          <span key={l} style={{
            color: l === active ? theme.text : theme.textMuted,
            position: 'relative', paddingBottom: 3,
            borderBottom: l === active ? `1.5px solid ${theme.primary}` : 'none',
          }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function WebFooter({ theme }) {
  return (
    <div style={{
      padding: '36px 40px 32px', borderTop: `1px solid ${theme.border}`,
      background: theme.dark ? 'transparent' : theme.surfaceAlt,
      flexShrink: 0,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1fr', gap: 32 }}>
        <div>
          <CookLabWordmark theme={theme} size={14} markSize={18} />
          <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 10, fontStyle: 'italic', fontFamily: theme._fonts.display }}>
            Decode · Design · Deliver.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {['OHRI', 'uOttawa', 'CIHR', 'CCS', 'CRS'].map((l) => (
            <div key={l} style={{
              fontSize: 10, color: theme.textFaint, fontFamily: theme._fonts.mono,
              letterSpacing: '0.1em', padding: '6px 10px',
              border: `1px solid ${theme.border}`, borderRadius: 2,
            }}>{l}</div>
          ))}
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: theme.textMuted, lineHeight: 1.6 }}>
          dacook@ohri.ca<br/>
          501 Smyth Rd · Ottawa<br/>
          <span style={{ color: theme.textFaint }}>© 2026 Cook Lab</span>
        </div>
      </div>
    </div>
  );
}

// UMAP ↔ Spatial twin-panel — two coordinate systems, same cells, same colors.
// Hints at the scroll-morph without needing animation in the static mock.
function UmapSpatialTwin({ theme, paletteKey, w = 360, h = 200 }) {
  const dv = DATAVIZ[paletteKey] || DATAVIZ.rustNavy;
  // Deterministic clusters
  const rng = (seed) => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const types = [0, 1, 2, 3, 4];
  const umapClusters = [
    { cx: 0.28, cy: 0.30, rr: 0.12, t: 0 },
    { cx: 0.72, cy: 0.30, rr: 0.10, t: 1 },
    { cx: 0.30, cy: 0.72, rr: 0.11, t: 2 },
    { cx: 0.70, cy: 0.70, rr: 0.09, t: 3 },
    { cx: 0.50, cy: 0.50, rr: 0.07, t: 4 },
  ];
  // Spatial scatter — cells distributed across a tissue boundary
  const r = rng(42);
  const umapPts = [];
  const spatialPts = [];
  umapClusters.forEach((cl) => {
    for (let i = 0; i < 80; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * cl.rr;
      const ux = cl.cx + Math.cos(a) * d, uy = cl.cy + Math.sin(a) * d;
      umapPts.push({ x: ux, y: uy, t: cl.t });
      // Spatial: types stratified into bands + scattered immune/stromal
      let sx, sy;
      if (cl.t === 0) { sx = 0.15 + r() * 0.35; sy = 0.15 + r() * 0.35; }
      else if (cl.t === 1) { sx = 0.55 + r() * 0.4; sy = 0.1 + r() * 0.5; }
      else if (cl.t === 2) { sx = 0.1 + r() * 0.4; sy = 0.55 + r() * 0.4; }
      else if (cl.t === 3) { sx = 0.6 + r() * 0.35; sy = 0.55 + r() * 0.4; }
      else { sx = 0.3 + r() * 0.4; sy = 0.4 + r() * 0.25; }
      spatialPts.push({ x: sx, y: sy, t: cl.t });
    }
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'center', width: '100%' }}>
      <PanelPlot theme={theme} label="UMAP" subLabel="gene expression" w={w/2} h={h} pts={umapPts} colors={dv.categorical} />
      <MorphArrow theme={theme} />
      <PanelPlot theme={theme} label="SPATIAL" subLabel="tissue coordinates" w={w/2} h={h} pts={spatialPts} colors={dv.categorical} showTissue />
    </div>
  );
}

function PanelPlot({ theme, label, subLabel, w, h, pts, colors, showTissue }) {
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: `${w}/${h}`,
      background: theme.dark ? 'rgba(255,255,255,0.02)' : '#fff',
      border: `1px solid ${theme.border}`, borderRadius: 4, overflow: 'hidden',
    }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        {showTissue && (
          <>
            {/* tissue boundary — soft fill */}
            <path d="M 5 20 Q 20 10, 50 18 T 95 25 L 95 85 Q 70 90, 50 80 T 5 78 Z"
              fill={theme.dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)'}
              stroke={theme.border} strokeWidth="0.3" strokeDasharray="1 1" />
          </>
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x * 100} cy={p.y * 100} r="0.9" fill={colors[p.t]} opacity="0.78" />
        ))}
      </svg>
      <div style={{
        position: 'absolute', top: 6, left: 8,
        fontFamily: theme._fonts.mono, fontSize: 9,
        color: theme.textFaint, letterSpacing: '0.1em',
      }}>{label} · <span style={{ opacity: 0.7 }}>{subLabel}</span></div>
    </div>
  );
}

function MorphArrow({ theme }) {
  return (
    <div style={{
      padding: '0 12px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 3, color: theme.textFaint,
    }}>
      <svg width="24" height="10" viewBox="0 0 24 10" fill="none">
        <path d="M1 5 Q 6 1, 12 5 T 23 5" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <path d="M20 2 L23 5 L20 8" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ fontFamily: theme._fonts.mono, fontSize: 8, letterSpacing: '0.1em' }}>MORPH</div>
    </div>
  );
}

// Phyllotaxis mark — reusable at various sizes
function PhyllotaxisMark({ theme, paletteKey, size = 120, pointCount = 140 }) {
  const dv = DATAVIZ[paletteKey] || DATAVIZ.rustNavy;
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size, display: 'block' }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={theme.border} strokeWidth="0.3" />
      {Array.from({ length: pointCount }).map((_, k) => {
        const a = (k * 137.5) * Math.PI / 180;
        const r = 3 + (k * (42 / pointCount));
        const x = 50 + Math.cos(a) * r;
        const y = 50 + Math.sin(a) * r;
        return <circle key={k} cx={x} cy={y} r="0.95" fill={dv.categorical[k % 6]} opacity="0.82" />;
      })}
      <circle cx="50" cy="50" r="3" fill={theme.primary} />
    </svg>
  );
}

// Stylized histology tile — editorial anchor, not a real image.
function HistologyTile({ theme, kind = 'ovarian', style }) {
  // Paint a layered, stippled SVG suggesting either multiplex IF or H&E.
  const rng = (seed) => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const r = rng(kind === 'ovarian' ? 101 : 202);
  const stains = kind === 'ovarian'
    ? ['#C2410C', '#0D9488', '#5EDDB9', '#0F172A']   // pseudo-IF: PanCK, CD8, αSMA, DAPI
    : ['#6A3A5E', '#E8A0B8', '#4A2840', '#B06090'];  // pseudo H&E / endometrial
  const bg = kind === 'ovarian' ? '#0A1120' : '#2A1520';
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 4,
      background: bg, ...style,
    }}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice"
           style={{ width: '100%', height: '100%', display: 'block' }}>
        {/* background wash */}
        <defs>
          <radialGradient id={`hg-${kind}`} cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor={stains[3]} stopOpacity="0.45" />
            <stop offset="100%" stopColor={bg} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="60" fill={`url(#hg-${kind})`} />
        {/* Stipples: many small dots in stain colors */}
        {Array.from({ length: 280 }).map((_, i) => {
          const x = r() * 100, y = r() * 60;
          const sz = 0.3 + r() * 1.2;
          const c = stains[Math.floor(r() * stains.length)];
          const o = 0.25 + r() * 0.5;
          return <circle key={i} cx={x} cy={y} r={sz} fill={c} opacity={o} />;
        })}
        {/* Glandular blobs */}
        {Array.from({ length: 5 }).map((_, i) => (
          <ellipse key={i} cx={15 + i * 18} cy={20 + (i % 2) * 20} rx={6 + r() * 4} ry={3 + r() * 2}
                   fill={stains[0]} opacity="0.25" />
        ))}
      </svg>
    </div>
  );
}

// Stat cell used in big-number bands
function StatCell({ theme, k, v, d, align = 'left' }) {
  return (
    <div style={{ textAlign: align }}>
      <div style={{
        fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
        fontSize: 52, color: theme.text, letterSpacing: '-0.04em', lineHeight: 0.95,
      }}>{k}</div>
      <Mono size={10} style={{ color: theme.textMuted, marginTop: 8, display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{v}</Mono>
      {d && <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 3 }}>{d}</div>}
    </div>
  );
}

// Question pull-quote — italic Manrope display with left rust rule
function QuestionPull({ theme, children, size = 26 }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 2, background: theme.primary, flexShrink: 0, alignSelf: 'stretch', marginTop: 4, marginBottom: 4 }} />
      <div style={{
        fontFamily: theme._fonts.display, fontStyle: 'italic', fontWeight: 400,
        fontSize: size, letterSpacing: '-0.02em', lineHeight: 1.2,
        color: theme.text,
      }}>{children}</div>
    </div>
  );
}

// Eyebrow label — mono uppercase rust
function Eye({ theme, children, color }) {
  return (
    <Mono size={10} style={{
      color: color || theme.primary,
      letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500,
    }}>{children}</Mono>
  );
}

function SiteButton({ theme, children, kind = 'primary' }) {
  if (kind === 'primary') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: theme.primary, color: theme.onPrimary,
        padding: '11px 18px', borderRadius: theme._radius.sm,
        fontSize: 13, fontWeight: 500,
      }}>{children}</span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      color: theme.text, padding: '11px 18px',
      border: `1px solid ${theme.borderStrong}`, borderRadius: theme._radius.sm,
      fontSize: 13, fontWeight: 500,
    }}>{children}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 1. HOME — /
// ─────────────────────────────────────────────────────────────────────────

function ArtboardWebHome({ theme, paletteKey }) {
  const questions = [
    {
      q: 'Why does chemotherapy stop working?',
      body: 'Most patients with high-grade serous ovarian cancer respond to first-line platinum chemotherapy — then relapse with disease that no longer responds. We\'re mapping the cell states that survive treatment and tracking how they re-emerge.',
      cta: 'Treatment resistance',
    },
    {
      q: 'Can we detect endometriosis earlier?',
      body: 'Diagnosis currently takes 7-10 years on average. We\'re searching for molecular signatures in blood and tissue that could shorten that delay from years to months.',
      cta: 'Early detection',
    },
    {
      q: 'How does endometriosis become cancer?',
      body: 'Women with endometriosis face 2-3× the risk of ovarian cancer. We\'re tracing the cellular transitions from benign lesion to malignant transformation — catching the process before it progresses.',
      cta: 'Progression',
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: theme.bg, color: theme.text, fontFamily: theme._fonts.body, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <WebNav theme={theme} active="Research" />

      {/* ── Hero */}
      <div style={{ padding: '64px 40px 56px', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <Eye theme={theme}>Ottawa Hospital Research Institute · University of Ottawa</Eye>
          <div style={{
            fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
            fontSize: 52, letterSpacing: theme._fonts.displayTracking,
            lineHeight: 1.02, color: theme.text, marginTop: 18, maxWidth: 620,
          }}>
            Decode the biology of gynecologic disease to design new approaches for{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: theme.primary }}>prevention, detection, and treatment</em>.
          </div>
          <div style={{ fontSize: 13, color: theme.textFaint, marginTop: 18, fontFamily: theme._fonts.display, fontStyle: 'italic', letterSpacing: '0.02em' }}>
            Decode · Design · Deliver.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <SiteButton theme={theme}>Explore our research →</SiteButton>
            <SiteButton theme={theme} kind="ghost">Join the lab</SiteButton>
          </div>
        </div>
        {/* UMAP ↔ Spatial twin panel — the signature move */}
        <div>
          <UmapSpatialTwin theme={theme} paletteKey={paletteKey} />
          <div style={{ fontSize: 10, color: theme.textFaint, fontFamily: theme._fonts.mono, letterSpacing: '0.08em', marginTop: 10, textAlign: 'center' }}>
            ↑ SCROLL TO WATCH CELLS FIND THEIR PLACE IN TISSUE
          </div>
        </div>
      </div>

      {/* ── Questions */}
      <div style={{ padding: '40px 40px 48px', borderTop: `1px solid ${theme.border}`, background: theme.surfaceAlt }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
          <Eye theme={theme}>Questions we're asking</Eye>
          <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.1em' }}>SEE ALL OUR RESEARCH →</Mono>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {questions.map((q, i) => (
            <div key={i} style={{
              background: theme.bg, padding: 24, borderRadius: theme._radius.md,
              border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', minHeight: 220,
            }}>
              <div style={{
                fontFamily: theme._fonts.display, fontStyle: 'italic', fontWeight: 400,
                fontSize: 22, letterSpacing: '-0.015em', lineHeight: 1.2, color: theme.text,
              }}>{q.q}</div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 14, lineHeight: 1.5, flex: 1 }}>{q.body}</div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, color: theme.primary, fontSize: 12, fontWeight: 500 }}>
                <span>{q.cta}</span><span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Disease focus — two tiles with histology anchors */}
      <div style={{ padding: '56px 40px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { label: 'OVARIAN CANCER', stat: 'Fewer than half of patients survive five years.', body: 'The deadliest gynecologic cancer. Complex cellular ecosystems adapt rapidly under treatment; we\'re mapping them at cellular and spatial resolution to find new ways to intervene.', tile: 'ovarian' },
            { label: 'ENDOMETRIOSIS', stat: 'Affects roughly 1 in 10 women.', body: 'A chronic inflammatory disease causing years of pain, infertility, and elevated cancer risk — persistently under-studied. We\'re applying the tools that transformed cancer research.', tile: 'endo' },
          ].map((d) => (
            <div key={d.label} style={{
              borderRadius: theme._radius.md, overflow: 'hidden',
              border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column',
              background: theme.surface,
            }}>
              <HistologyTile theme={theme} kind={d.tile === 'ovarian' ? 'ovarian' : 'endo'} style={{ height: 120 }} />
              <div style={{ padding: 24 }}>
                <Eye theme={theme}>{d.label}</Eye>
                <div style={{
                  fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
                  fontSize: 26, letterSpacing: '-0.025em', lineHeight: 1.1, color: theme.text,
                  marginTop: 10,
                }}>{d.stat}</div>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 12, lineHeight: 1.55 }}>{d.body}</div>
                <div style={{ marginTop: 16, color: theme.primary, fontSize: 12, fontWeight: 500 }}>Explore →</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Our approach (condensed) */}
      <div style={{ padding: '36px 40px 48px', borderTop: `1px solid ${theme.border}` }}>
        <Eye theme={theme}>Our approach</Eye>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 20 }}>
          {[
            { n: '01', t: 'Single-cell & spatial genomics', b: 'scRNA-seq, snPATHO-seq, Xenium. Profiling individual cells and tracking them in tissue context.' },
            { n: '02', t: 'Patient-derived models', b: 'Organoids and primary cell models that reflect real human biology.' },
            { n: '03', t: 'Computational biology', b: 'Cell-state inference, spatial neighborhood analysis, trajectories.' },
            { n: '04', t: 'Ottawa GynePath Biobank', b: 'A growing patient-sample repository that grounds every project in real biology.' },
          ].map((p) => (
            <div key={p.n}>
              <Mono size={10} style={{ color: theme.primary, letterSpacing: '0.12em' }}>{p.n}</Mono>
              <div style={{
                fontFamily: theme._fonts.display, fontSize: 15, fontWeight: 500,
                color: theme.text, marginTop: 6, letterSpacing: '-0.01em',
              }}>{p.t}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6, lineHeight: 1.5 }}>{p.b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Latest papers strip */}
      <div style={{ padding: '36px 40px 48px', borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <Eye theme={theme}>Latest</Eye>
          <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.1em' }}>VIEW ALL PUBLICATIONS →</Mono>
        </div>
        {[
          { tag: 'PREPRINT · 2026', title: 'Spatial tumor ecosystems in high-grade serous ovarian carcinoma', meta: 'Nguyen, Patel, Cook' },
          { tag: 'NATURE GENETICS · 2025', title: 'Origins of fallopian tube secretory cells in early HGSC', meta: 'Patel, Liu, Cook' },
        ].map((p, i) => (
          <div key={i} style={{ padding: '16px 0', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Mono size={9} style={{ color: theme.primary, letterSpacing: '0.1em' }}>{p.tag}</Mono>
              <div style={{ fontFamily: theme._fonts.display, fontSize: 16, fontWeight: 500, color: theme.text, marginTop: 4, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{p.title}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{p.meta}</div>
            </div>
            <div style={{ color: theme.textFaint, fontSize: 16 }}>→</div>
          </div>
        ))}
      </div>

      <WebFooter theme={theme} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2. RESEARCH HUB — /research
// ─────────────────────────────────────────────────────────────────────────

function ArtboardWebResearchHub({ theme, paletteKey }) {
  const questions = {
    ovarian: [
      { q: 'Why do high-grade serous ovarian cancers become resistant to chemotherapy after a strong initial response?', p: 'Treatment resistance' },
      { q: 'How does the biology of rare ovarian cancer subtypes differ from high-grade serous disease?', p: 'Rare subtypes' },
      { q: 'Why have immunotherapies failed in ovarian cancer?', p: 'TROP2-targeted ADCs' },
    ],
    endo: [
      { q: 'Can we detect endometriosis earlier?', p: 'Early detection' },
      { q: 'Can developments in cancer therapeutics improve outcomes for women with endometriosis?', p: 'Novel immunotherapies' },
      { q: 'How does endometriosis develop into ovarian cancer?', p: 'Progression' },
    ],
  };

  return (
    <div style={{ width: '100%', height: '100%', background: theme.bg, color: theme.text, fontFamily: theme._fonts.body, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <WebNav theme={theme} active="Research" />

      {/* ── Header */}
      <div style={{ padding: '56px 40px 40px' }}>
        <Eye theme={theme}>Our research</Eye>
        <div style={{
          fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
          fontSize: 42, letterSpacing: theme._fonts.displayTracking, lineHeight: 1.05,
          color: theme.text, marginTop: 14, maxWidth: 820,
        }}>
          We study gynecologic diseases to understand their fundamental biology and translate discoveries into{' '}
          <em style={{ fontStyle: 'italic', color: theme.primary, fontWeight: 400 }}>better prevention, detection, and treatment</em>.
        </div>
        <div style={{
          display: 'flex', gap: 32, marginTop: 22, fontFamily: theme._fonts.display,
          fontStyle: 'italic', color: theme.textFaint, fontSize: 16,
        }}>
          <span>Decode.</span><span>Design.</span><span>Deliver.</span>
        </div>
      </div>

      {/* ── Disease focus — two full cards with visuals */}
      <div style={{ padding: '0 40px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { label: 'OVARIAN CANCER', t: 'The most lethal gynecologic malignancy.', b: 'High-grade serous disease responds to first-line chemotherapy — only to return with resistance. Immunotherapies that transformed other cancers have barely moved the needle here. We believe the answers lie in cellular adaptation.', stat: '<50%', statLabel: 'FIVE-YEAR SURVIVAL', tile: 'ovarian' },
            { label: 'ENDOMETRIOSIS', t: 'Chronic, under-studied, high-impact.', b: 'Affects roughly 1 in 10 women. Causes severe pain, infertility, and a 2-3× elevated risk of ovarian cancer. The disease has been persistently under-studied — the tools that transformed cancer research can close this gap.', stat: '1 in 10', statLabel: 'WOMEN AFFECTED', tile: 'endo' },
          ].map((d) => (
            <div key={d.label} style={{
              borderRadius: theme._radius.md, overflow: 'hidden',
              border: `1px solid ${theme.border}`,
              background: theme.surface, display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ position: 'relative' }}>
                <HistologyTile theme={theme} kind={d.tile} style={{ height: 150 }} />
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                  padding: '4px 10px', borderRadius: 2,
                }}>
                  <Mono size={9} style={{ color: '#fff', letterSpacing: '0.12em' }}>{d.label}</Mono>
                </div>
              </div>
              <div style={{ padding: 26 }}>
                <div style={{
                  fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
                  fontSize: 26, color: theme.text, letterSpacing: '-0.025em', lineHeight: 1.1,
                }}>{d.t}</div>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 14, lineHeight: 1.55 }}>{d.b}</div>
                <div style={{ marginTop: 18, padding: '14px 0 0', borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <div style={{
                    fontFamily: theme._fonts.display, fontSize: 32, fontWeight: theme._fonts.displayWeight,
                    color: theme.primary, letterSpacing: '-0.03em', lineHeight: 1,
                  }}>{d.stat}</div>
                  <Mono size={9} style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>{d.statLabel}</Mono>
                  <div style={{ flex: 1 }} />
                  <span style={{ color: theme.primary, fontSize: 12, fontWeight: 500 }}>Explore →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Our approach full grid */}
      <div style={{ padding: '40px 40px 48px', background: theme.surfaceAlt }}>
        <Eye theme={theme}>Our approach</Eye>
        <div style={{ fontSize: 14, color: theme.textMuted, marginTop: 8, maxWidth: 600 }}>
          We integrate experimental and computational methods to understand disease at unprecedented resolution.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 24 }}>
          {[
            { n: '01', t: 'Single-cell & spatial genomics', b: 'We profile individual cells to reveal hidden diversity and cell states, and we map how those cells are organized in tissue. scRNA-seq, snPATHO-seq, and Xenium.' },
            { n: '02', t: 'Patient-derived disease models', b: 'We build organoid and primary cell models from patient samples — systems that reflect human biology and let us test findings and therapeutics.' },
            { n: '03', t: 'Computational biology', b: 'Cell-state inference, spatial neighborhood analysis, trajectory modeling, and integration across modalities.' },
            { n: '04', t: 'Ottawa GynePath Biobank', b: 'Our research is powered by patient-contributed samples and clinical data — grounding every project in human biology from the start.' },
          ].map((p) => (
            <div key={p.n} style={{ background: theme.bg, padding: 20, borderRadius: theme._radius.sm, border: `1px solid ${theme.border}` }}>
              <Mono size={10} style={{ color: theme.primary, letterSpacing: '0.12em' }}>{p.n}</Mono>
              <div style={{
                fontFamily: theme._fonts.display, fontSize: 16, fontWeight: 500,
                color: theme.text, marginTop: 6, letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>{p.t}</div>
              <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 8, lineHeight: 1.5 }}>{p.b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Research questions full list */}
      <div style={{ padding: '48px 40px' }}>
        <Eye theme={theme}>What we're asking</Eye>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 22 }}>
          {[
            { title: 'OVARIAN CANCER', qs: questions.ovarian },
            { title: 'ENDOMETRIOSIS',  qs: questions.endo },
          ].map((g) => (
            <div key={g.title}>
              <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.12em' }}>{g.title}</Mono>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {g.qs.map((item, i) => (
                  <div key={i} style={{ padding: '14px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.border}` }}>
                    <QuestionPull theme={theme} size={18}>{item.q}</QuestionPull>
                    <div style={{ fontSize: 11, color: theme.primary, marginTop: 8, marginLeft: 16, letterSpacing: '0.04em' }}>→ {item.p}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <WebFooter theme={theme} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3. DISEASE — Ovarian Cancer  (/research/ovarian-cancer)
// ─────────────────────────────────────────────────────────────────────────

function ArtboardWebDiseaseOC({ theme, paletteKey }) {
  const projects = [
    {
      q: 'Why does chemotherapy stop working?',
      title: 'Cell state plasticity and treatment resistance',
      body: 'We\'ve identified distinct cell states that emerge during chemotherapy in HGSC — the SecA, SecB, and ciliated (Cil) epitypes. These states are conserved across patients and enriched after treatment. We\'re testing whether blocking state transitions can prevent resistance.',
      funding: 'CIHR PROJECT GRANT · 2025–2030',
    },
    {
      q: 'How are rare subtypes different?',
      title: 'Divergent features of rare ovarian cancer subtypes',
      body: 'Low-grade serous and clear cell carcinomas respond poorly to treatments designed for HGSC. We\'re building single-cell and spatial atlases of these subtypes to identify their unique biology — and the therapies that could target it.',
      funding: 'CRS BRIDGING THE GAP · 2024–2027',
    },
    {
      q: 'Can targeted therapy overcome resistance?',
      title: 'TROP2-targeted antibody-drug conjugates',
      body: 'Chemotherapy pushes HGSC cells toward a state that expresses TROP2. We\'re testing whether precisely-timed TROP2-targeting ADCs can eliminate these cells before stable resistance develops — and mapping the immune response such therapies provoke.',
      funding: 'OVCAN CONSORTIUM · 2024–',
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: theme.bg, color: theme.text, fontFamily: theme._fonts.body, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <WebNav theme={theme} active="Research" />

      {/* ── Hero with full-bleed histology top band */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <HistologyTile theme={theme} kind="ovarian" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(10,17,32,0.35) 0%, ${theme.bg} 100%)` }} />
        <div style={{ position: 'relative', padding: '72px 40px 48px' }}>
          <Mono size={10} style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Research / Ovarian Cancer</Mono>
          <div style={{
            fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
            fontSize: 64, letterSpacing: '-0.04em', lineHeight: 0.98,
            color: '#fff', marginTop: 16,
          }}>Ovarian Cancer.</div>
          <div style={{
            fontFamily: theme._fonts.display, fontStyle: 'italic', fontWeight: 400,
            fontSize: 22, letterSpacing: '-0.01em', lineHeight: 1.3,
            color: 'rgba(255,255,255,0.88)', marginTop: 18, maxWidth: 640,
          }}>
            The most lethal gynecologic malignancy. We're decoding its complexity to design smarter treatments.
          </div>
        </div>
      </div>

      {/* ── The challenge — two-column + stat callout */}
      <div style={{ padding: '48px 40px 40px', display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div>
          <Eye theme={theme}>The challenge</Eye>
          <div style={{ marginTop: 16, fontSize: 14.5, color: theme.text, lineHeight: 1.65 }}>
            <p style={{ margin: 0 }}>
              Ovarian cancer remains the most lethal gynecologic malignancy. Most patients are diagnosed at advanced stage. High-grade serous disease — the most common subtype — responds well to first-line platinum chemotherapy, only to return months later with resistance. Fewer than half of patients survive five years.
            </p>
            <p style={{ marginTop: 14, marginBottom: 0, color: theme.textMuted }}>
              Immunotherapies that transformed other cancers have barely moved the needle here. Rare subtypes like low-grade serous and clear cell behave differently but receive a fraction of the research attention. We believe the answers lie in cellular adaptation — how tumor cells change in response to their environment and treatment, and the vulnerabilities these transitions expose.
            </p>
          </div>
        </div>
        <div style={{
          background: theme.surfaceAlt, borderRadius: theme._radius.md,
          padding: 26, borderLeft: `2px solid ${theme.primary}`,
        }}>
          <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.1em' }}>KEY STAT</Mono>
          <div style={{
            fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
            fontSize: 56, color: theme.primary, letterSpacing: '-0.04em', lineHeight: 0.95, marginTop: 8,
          }}>&lt;50%</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 8, lineHeight: 1.5 }}>
            five-year survival for advanced-stage HGSC — essentially unchanged in three decades.
          </div>
        </div>
      </div>

      {/* ── Signature move: UMAP ↔ spatial band */}
      <div style={{ padding: '28px 40px 44px', background: theme.surfaceAlt }}>
        <Eye theme={theme}>How we see the disease</Eye>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 36, alignItems: 'center', marginTop: 18 }}>
          <div style={{
            fontFamily: theme._fonts.display, fontSize: 22, fontWeight: 500,
            color: theme.text, letterSpacing: '-0.02em', lineHeight: 1.3,
          }}>
            Same cells, two coordinate systems — gene expression <em style={{ fontStyle: 'italic', color: theme.primary }}>and</em> tissue position. We track how cells reorganize under treatment.
          </div>
          <UmapSpatialTwin theme={theme} paletteKey={paletteKey} />
        </div>
      </div>

      {/* ── Current projects */}
      <div style={{ padding: '48px 40px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
          <Eye theme={theme}>Current projects</Eye>
          <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.1em' }}>03 ACTIVE</Mono>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {projects.map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '140px 1fr 1fr 40px', gap: 24,
              padding: 24, border: `1px solid ${theme.border}`, borderRadius: theme._radius.md,
              background: theme.surface, alignItems: 'center',
            }}>
              <Mono size={11} style={{ color: theme.primary, letterSpacing: '0.1em' }}>PROJECT 0{i + 1}</Mono>
              <div>
                <QuestionPull theme={theme} size={18}>{p.q}</QuestionPull>
                <div style={{ marginTop: 10, marginLeft: 16, fontSize: 11, fontWeight: 500, color: theme.text, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: theme._fonts.mono }}>{p.title}</div>
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: theme.textMuted, lineHeight: 1.55 }}>{p.body}</div>
                <div style={{ marginTop: 10, display: 'inline-block', padding: '3px 8px', borderRadius: 2, background: theme.primarySoft, color: theme.primary, fontSize: 9, fontFamily: theme._fonts.mono, letterSpacing: '0.08em' }}>{p.funding}</div>
              </div>
              <div style={{ color: theme.textFaint, fontSize: 18, textAlign: 'right' }}>→</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Collaborators & funding */}
      <div style={{ padding: '36px 40px 40px', borderTop: `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          <Eye theme={theme}>Key collaborators</Eye>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {['OvCAN Consortium', 'CRCHUM · Mes-Masson', 'MSK · Schwartz', 'DFCI · Konstantinopoulos'].map((l) => (
              <div key={l} style={{
                padding: '7px 12px', fontSize: 12, color: theme.textMuted,
                background: theme.surfaceAlt, borderRadius: theme._radius.sm,
                border: `1px solid ${theme.border}`,
              }}>{l}</div>
            ))}
          </div>
        </div>
        <div>
          <Eye theme={theme}>Funding</Eye>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {['CIHR', 'Canadian Cancer Society', 'Cancer Research Society', 'OvCAN'].map((l) => (
              <div key={l} style={{
                padding: '7px 12px', fontSize: 12, color: theme.textMuted,
                background: 'transparent', borderRadius: theme._radius.sm,
                border: `1px solid ${theme.borderStrong}`,
              }}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      <WebFooter theme={theme} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 4. DISEASE — Endometriosis  (/research/endometriosis)
// ─────────────────────────────────────────────────────────────────────────

function ArtboardWebDiseaseEndo({ theme, paletteKey }) {
  const projects = [
    {
      q: 'Can we detect endometriosis earlier?',
      title: 'Early detection & biomarkers',
      body: 'Diagnosis today still requires surgery. We\'re searching for molecular signatures in blood and tissue that enable non-invasive diagnosis — shortening the delay from years to months.',
      funding: 'CIHR ENDOMETRIOSIS GRANT · 2025–2030',
    },
    {
      q: 'Can cancer therapeutics help?',
      title: 'Novel immunotherapies (BiTEs / BiKEs)',
      body: 'Endometriosis shares features with cancer: chronic inflammation, tissue invasion, aberrant immune signaling. We\'re testing whether bispecific antibody approaches can eliminate lesion-driving cells while sparing healthy tissue.',
      funding: 'CIHR PROJECT · 2024–',
    },
    {
      q: 'How does endometriosis become cancer?',
      title: 'Progression to ovarian cancer',
      body: 'Clear cell and endometrioid ovarian cancers arise from endometriotic lesions. We\'re tracing this transition cell-by-cell — identifying the early molecular changes that mark the shift from benign to malignant.',
      funding: 'OHRI CATALYST · 2025–',
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: theme.bg, color: theme.text, fontFamily: theme._fonts.body, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <WebNav theme={theme} active="Research" />

      {/* ── Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <HistologyTile theme={theme} kind="endo" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(42,21,32,0.4) 0%, ${theme.bg} 100%)` }} />
        <div style={{ position: 'relative', padding: '72px 40px 48px' }}>
          <Mono size={10} style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Research / Endometriosis</Mono>
          <div style={{
            fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
            fontSize: 64, letterSpacing: '-0.04em', lineHeight: 0.98,
            color: '#fff', marginTop: 16,
          }}>Endometriosis.</div>
          <div style={{
            fontFamily: theme._fonts.display, fontStyle: 'italic', fontWeight: 400,
            fontSize: 22, letterSpacing: '-0.01em', lineHeight: 1.3,
            color: 'rgba(255,255,255,0.88)', marginTop: 18, maxWidth: 700,
          }}>
            A chronic inflammatory disease that shapes millions of lives — and a frontier for modern genomics.
          </div>
        </div>
      </div>

      {/* ── The challenge + stat callouts */}
      <div style={{ padding: '48px 40px 44px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 40, alignItems: 'flex-start' }}>
        <div>
          <Eye theme={theme}>The challenge</Eye>
          <div style={{ marginTop: 16, fontSize: 14.5, color: theme.text, lineHeight: 1.65 }}>
            <p style={{ margin: 0 }}>
              Endometriosis affects roughly 1 in 10 women. It causes severe pain, infertility, and a 2-3-fold elevated risk of ovarian cancer. Diagnosis currently takes 7-10 years on average. Treatments are limited to hormonal suppression or surgery — neither addresses the underlying biology, and neither prevents the small but consequential transition to malignancy.
            </p>
            <p style={{ marginTop: 14, marginBottom: 0, color: theme.textMuted }}>
              The disease has been persistently under-studied. Racial and ethnic disparities in pathobiology and outcomes remain poorly characterized. We believe the tools that transformed cancer research — single-cell genomics, spatial profiling, patient-derived models — can close this gap.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { k: '1 in 10', v: 'WOMEN AFFECTED' },
            { k: '7–10 yr', v: 'AVG TIME TO DIAGNOSIS' },
            { k: '2–3×', v: 'ELEVATED CANCER RISK' },
          ].map((s) => (
            <div key={s.v} style={{
              background: theme.surfaceAlt, borderRadius: theme._radius.sm,
              padding: '16px 20px', borderLeft: `2px solid ${theme.primary}`,
              display: 'flex', alignItems: 'baseline', gap: 16,
            }}>
              <div style={{
                fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
                fontSize: 32, color: theme.primary, letterSpacing: '-0.03em', lineHeight: 1,
                minWidth: 90,
              }}>{s.k}</div>
              <Mono size={10} style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>{s.v}</Mono>
            </div>
          ))}
        </div>
      </div>

      {/* ── Current projects */}
      <div style={{ padding: '36px 40px 36px', background: theme.surfaceAlt }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
          <Eye theme={theme}>Current projects</Eye>
          <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.1em' }}>03 ACTIVE</Mono>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {projects.map((p, i) => (
            <div key={i} style={{
              background: theme.bg, padding: 22,
              border: `1px solid ${theme.border}`, borderRadius: theme._radius.md,
              display: 'flex', flexDirection: 'column',
            }}>
              <Mono size={10} style={{ color: theme.primary, letterSpacing: '0.1em' }}>PROJECT 0{i + 1}</Mono>
              <div style={{
                fontFamily: theme._fonts.display, fontStyle: 'italic', fontWeight: 400,
                fontSize: 20, letterSpacing: '-0.015em', lineHeight: 1.2, color: theme.text, marginTop: 10,
              }}>{p.q}</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: theme.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: theme._fonts.mono, marginTop: 10 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 12, lineHeight: 1.55, flex: 1 }}>{p.body}</div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ padding: '3px 8px', borderRadius: 2, background: theme.primarySoft, color: theme.primary, fontSize: 9, fontFamily: theme._fonts.mono, letterSpacing: '0.08em' }}>{p.funding}</div>
                <span style={{ color: theme.primary, fontSize: 12 }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Collaborators & funding */}
      <div style={{ padding: '36px 40px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          <Eye theme={theme}>Key collaborators</Eye>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {['Dr. Sony Singh · uOttawa', 'OHRI Minimally Invasive Gyne', 'World Endometriosis Research Fdn.'].map((l) => (
              <div key={l} style={{
                padding: '7px 12px', fontSize: 12, color: theme.textMuted,
                background: theme.surfaceAlt, borderRadius: theme._radius.sm,
                border: `1px solid ${theme.border}`,
              }}>{l}</div>
            ))}
          </div>
        </div>
        <div>
          <Eye theme={theme}>Funding</Eye>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {['CIHR', 'Endometriosis Foundation', 'OHRI Catalyst'].map((l) => (
              <div key={l} style={{
                padding: '7px 12px', fontSize: 12, color: theme.textMuted,
                background: 'transparent', borderRadius: theme._radius.sm,
                border: `1px solid ${theme.borderStrong}`,
              }}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      <WebFooter theme={theme} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 5. BIOBANK — /biobank
// ─────────────────────────────────────────────────────────────────────────

function ArtboardWebBiobank({ theme, paletteKey }) {
  return (
    <div style={{ width: '100%', height: '100%', background: theme.bg, color: theme.text, fontFamily: theme._fonts.body, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <WebNav theme={theme} active="Research" />

      {/* ── Hero — TMA style grid as visual */}
      <div style={{ padding: '56px 40px 48px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <Eye theme={theme}>Infrastructure</Eye>
          <div style={{
            fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
            fontSize: 52, letterSpacing: theme._fonts.displayTracking, lineHeight: 1.02,
            color: theme.text, marginTop: 14,
          }}>Ottawa GynePath Biobank.</div>
          <div style={{
            fontFamily: theme._fonts.display, fontStyle: 'italic', fontWeight: 400,
            fontSize: 20, color: theme.textMuted, marginTop: 16, lineHeight: 1.35, maxWidth: 480,
          }}>
            The engine of our research — powered by patient partnership.
          </div>
        </div>
        <TMAGrid theme={theme} paletteKey={paletteKey} />
      </div>

      {/* ── Framing */}
      <div style={{ padding: '0 40px 48px', maxWidth: 820 }}>
        <div style={{ fontSize: 15, color: theme.text, lineHeight: 1.65 }}>
          The Ottawa GynePath Biobank is a growing repository of tissue, blood, organoids, and clinical data contributed by patients across The Ottawa Hospital. It is the foundation every project in our lab is built on.
        </div>
        <div style={{ fontSize: 14, color: theme.textMuted, marginTop: 14, lineHeight: 1.65 }}>
          Rather than a standalone initiative, the biobank is woven into everything we do: it grounds every hypothesis in human biology from the start, and it supports collaborators across Canada and internationally working on the same questions.
        </div>
      </div>

      {/* ── What's in it — big number band */}
      <div style={{ padding: '40px 40px', borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, background: theme.surfaceAlt }}>
        <Eye theme={theme}>What's in it</Eye>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24, marginTop: 24, alignItems: 'baseline' }}>
          {[
            { k: '840+', v: 'patient cases enrolled', d: '+40 Q1 2026' },
            { k: '3,200', v: 'tissue, blood, urine samples', d: 'paired clinical data' },
            { k: '48',   v: 'organoid lines derived',     d: 'viable + characterized' },
            { k: '142',  v: 'scRNA-seq datasets',         d: '~10K cells / sample' },
            { k: '50',   v: 'Visium + Xenium sections',  d: 'spatial transcriptomics' },
          ].map((s) => <StatCell key={s.v} theme={theme} {...s} />)}
        </div>
      </div>

      {/* ── How the biobank fuels our research */}
      <div style={{ padding: '44px 40px 36px' }}>
        <Eye theme={theme}>How the biobank fuels our research</Eye>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { t: 'Mapping cell-state plasticity across 142 patients.', link: 'Treatment resistance' },
            { t: 'Identifying protein biomarkers for early endometriosis detection.', link: 'Early detection' },
            { t: 'Tracing the transition from endometriosis to ovarian cancer.', link: 'Progression' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 16,
              padding: '16px 20px', borderRadius: theme._radius.sm,
              border: `1px solid ${theme.border}`, alignItems: 'center',
            }}>
              <Mono size={11} style={{ color: theme.primary, letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>0{i + 1}</Mono>
              <div style={{
                fontFamily: theme._fonts.display, fontSize: 18, fontWeight: 500,
                color: theme.text, letterSpacing: '-0.015em',
              }}>{r.t}</div>
              <div style={{ color: theme.primary, fontSize: 12, fontWeight: 500 }}>{r.link} →</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── For collaborators / For patients */}
      <div style={{ padding: '28px 40px 44px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {[
          { h: 'Interested in collaborating?', b: 'We actively collaborate with researchers who need high-quality patient samples and paired clinical data. We prioritize projects that complement our own and return insight to the broader research community.', cta: 'Email David →' },
          { h: 'Interested in contributing?', b: 'Enrollment is coordinated through The Ottawa Hospital\'s consent and tissue program. Learn more about how the hospital collects and manages biobank samples.', cta: 'Learn more at OHRI →' },
        ].map((c) => (
          <div key={c.h} style={{
            background: theme.surfaceAlt, padding: 28, borderRadius: theme._radius.md,
            border: `1px solid ${theme.border}`,
          }}>
            <div style={{
              fontFamily: theme._fonts.display, fontSize: 22, fontWeight: 500,
              color: theme.text, letterSpacing: '-0.02em',
            }}>{c.h}</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 12, lineHeight: 1.6 }}>{c.b}</div>
            <div style={{ marginTop: 16, color: theme.primary, fontSize: 13, fontWeight: 500 }}>{c.cta}</div>
          </div>
        ))}
      </div>

      <WebFooter theme={theme} />
    </div>
  );
}

// Tissue microarray grid — visual metaphor for biobank
function TMAGrid({ theme, paletteKey }) {
  const dv = DATAVIZ[paletteKey] || DATAVIZ.rustNavy;
  const cols = 8, rows = 6;
  const rng = (seed) => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const r = rng(77);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8,
      padding: 20, background: theme.surface, borderRadius: theme._radius.md,
      border: `1px solid ${theme.border}`, aspectRatio: `${cols}/${rows}`,
    }}>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const stain = dv.categorical[i % 6];
        const o = 0.55 + r() * 0.45;
        return (
          <div key={i} style={{
            borderRadius: '50%', background: stain, opacity: o,
            boxShadow: `inset 0 0 4px rgba(0,0,0,0.35)`, aspectRatio: '1',
          }} />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 6. PEOPLE — /people
// ─────────────────────────────────────────────────────────────────────────

function ArtboardWebPeople({ theme, paletteKey }) {
  const team = {
    'Postdoctoral Fellows': [
      { n: 'Sarah Nersesian', r: 'Immune landscape of HGSC', c: 0 },
      { n: 'John Abou-Hamad', r: 'Spatial genomics of the tumor microenvironment', c: 1 },
      { n: 'Elizabeth Hughes', r: 'Ovarian cancer organoids', incoming: true, c: 2 },
    ],
    'PhD Students': [
      { n: 'Emma Durocher', r: 'Endometriosis pathobiology', c: 3 },
    ],
    'MSc Students': [
      { n: 'Athena Southworth', r: 'ADCs in ovarian cancer', c: 4 },
    ],
    'Research Staff': [
      { n: 'Hugh Deng', r: 'Lab operations · organoid culture', c: 5 },
    ],
    'Incoming': [
      { n: 'Katrina Verey', r: 'Undergraduate', c: 0 },
      { n: 'Michelle Sukadil', r: 'TBC', c: 1 },
      { n: 'Sara Popovic', r: 'TBC', c: 2 },
    ],
  };
  const dv = DATAVIZ[paletteKey] || DATAVIZ.rustNavy;

  return (
    <div style={{ width: '100%', height: '100%', background: theme.bg, color: theme.text, fontFamily: theme._fonts.body, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <WebNav theme={theme} active="People" />

      {/* ── Intro */}
      <div style={{ padding: '56px 40px 40px', maxWidth: 820 }}>
        <Eye theme={theme}>People</Eye>
        <div style={{
          fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
          fontSize: 44, letterSpacing: theme._fonts.displayTracking, lineHeight: 1.04,
          color: theme.text, marginTop: 14,
        }}>
          A team of postdocs, students, and technicians building the next generation of{' '}
          <em style={{ fontStyle: 'italic', color: theme.primary, fontWeight: 400 }}>gynecologic disease research</em>.
        </div>
        <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 16, lineHeight: 1.6 }}>
          We value curiosity, rigor, and collaboration — and we invest in training alongside our own work. We're always looking for talented people.{' '}
          <span style={{ color: theme.primary }}>Join the lab →</span>
        </div>
      </div>

      {/* ── PI feature card */}
      <div style={{ padding: '0 40px 40px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 32,
          padding: 32, background: theme.surfaceAlt, borderRadius: theme._radius.lg,
          border: `1px solid ${theme.border}`, alignItems: 'flex-start',
        }}>
          {/* PI avatar using phyllotaxis mark as stand-in */}
          <div style={{
            width: 180, height: 180, borderRadius: theme._radius.md, overflow: 'hidden',
            background: theme.dark ? theme.palette.secondary[800] : theme.palette.secondary[700],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PhyllotaxisMark theme={theme} paletteKey={paletteKey} size={140} pointCount={180} />
          </div>
          <div>
            <Mono size={10} style={{ color: theme.primary, letterSpacing: '0.16em' }}>PRINCIPAL INVESTIGATOR</Mono>
            <div style={{
              fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
              fontSize: 36, color: theme.text, letterSpacing: '-0.03em', marginTop: 8, lineHeight: 1,
            }}>David P. Cook, <span style={{ fontStyle: 'italic', fontWeight: 400 }}>PhD</span></div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 14, lineHeight: 1.6 }}>
              Scientist — Cancer Research Program, Ottawa Hospital Research Institute<br/>
              Assistant Professor — Dept. of Cellular & Molecular Medicine, University of Ottawa
            </div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 16, lineHeight: 1.6, maxWidth: 560 }}>
              David trained in molecular biology and completed his postdoctoral work in single-cell genomics. His research focuses on cellular adaptation in gynecologic disease — with a particular interest in how tumor cells reshape under treatment.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['dpcook.com', 'Email', 'Scholar', 'ORCID'].map((l) => (
              <div key={l} style={{
                padding: '8px 14px', fontSize: 12, color: theme.text,
                border: `1px solid ${theme.borderStrong}`, borderRadius: theme._radius.sm,
                textAlign: 'center', minWidth: 100,
              }}>{l} →</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Team grid by role */}
      <div style={{ padding: '20px 40px 48px' }}>
        {Object.entries(team).map(([group, members]) => (
          <div key={group} style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'baseline',
              borderTop: `1px solid ${theme.border}`, paddingTop: 18, marginBottom: 18,
              justifyContent: 'space-between',
            }}>
              <Mono size={10} style={{ color: theme.primary, letterSpacing: '0.14em' }}>{group.toUpperCase()}</Mono>
              <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.1em' }}>{String(members.length).padStart(2, '0')}</Mono>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {members.map((m) => (
                <div key={m.n} style={{
                  padding: 16, background: theme.surface,
                  border: `1px solid ${theme.border}`, borderRadius: theme._radius.md,
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: theme._radius.sm,
                    background: dv.categorical[m.c], flexShrink: 0, opacity: 0.85,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: theme._fonts.display, fontSize: 14, fontWeight: 600, color: '#fff',
                    letterSpacing: '-0.02em',
                  }}>{m.n.split(' ').map((p) => p[0]).join('')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, letterSpacing: '-0.01em' }}>
                      {m.n} {m.incoming && <span style={{ fontSize: 9, color: theme.primary, fontFamily: theme._fonts.mono, marginLeft: 4, letterSpacing: '0.08em' }}>· INCOMING</span>}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3, lineHeight: 1.4 }}>{m.r}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <WebFooter theme={theme} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 7. JOIN — /join
// ─────────────────────────────────────────────────────────────────────────

function ArtboardWebJoin({ theme, paletteKey }) {
  const tracks = [
    {
      title: 'Postdoctoral Fellows',
      body: 'We look for postdocs with strong backgrounds in molecular biology, single-cell or spatial genomics, computational biology, or clinical/translational research. Funded positions are announced here when available; we also welcome inquiries from applicants planning their own fellowship applications (CIHR, CCS, EMBO, HFSP).',
      apply: 'Email David directly with your CV, a brief statement of research interests, and the names of three references. Tell us which of our research questions most interests you.',
    },
    {
      title: 'Graduate Students (PhD / MSc)',
      body: 'We supervise students through the Department of Cellular and Molecular Medicine at the University of Ottawa. Prospective students should apply to the CMM program and list David as a potential supervisor.',
      apply: 'Before formally applying, email David with your CV and a short paragraph on why you\'re interested in our research. Informal inquiries are welcome and encouraged.',
    },
    {
      title: 'Undergraduates',
      body: 'We host honors thesis students, summer research trainees (NSERC USRA, OGS), and fourth-year co-op placements. Positions are competitive; we prioritize students with strong academic records and demonstrated interest in gynecologic research or genomics.',
      apply: 'Email David in the fall for positions the following academic year.',
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: theme.bg, color: theme.text, fontFamily: theme._fonts.body, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <WebNav theme={theme} active="Join" />

      {/* ── Hero */}
      <div style={{ padding: '64px 40px 48px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <Eye theme={theme}>Join the lab</Eye>
          <div style={{
            fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
            fontSize: 76, letterSpacing: '-0.04em', lineHeight: 0.95,
            color: theme.text, marginTop: 14,
          }}>Join us.</div>
          <div style={{ fontSize: 14, color: theme.textMuted, marginTop: 20, lineHeight: 1.65, maxWidth: 540 }}>
            We're always excited to hear from talented trainees who share our commitment to understanding and treating gynecologic disease. Our lab is home to people from diverse backgrounds — clinical, computational, experimental — and we prioritize mentorship alongside productivity.
          </div>
        </div>
        <PhyllotaxisMark theme={theme} paletteKey={paletteKey} size={240} pointCount={220} />
      </div>

      {/* ── Tracks */}
      <div style={{ padding: '40px 40px 40px', borderTop: `1px solid ${theme.border}` }}>
        <Eye theme={theme}>How to reach us</Eye>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column' }}>
          {tracks.map((t, i) => (
            <div key={t.title} style={{
              display: 'grid', gridTemplateColumns: '60px 1.1fr 1.4fr', gap: 28,
              padding: '26px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.border}`,
              alignItems: 'flex-start',
            }}>
              <Mono size={12} style={{ color: theme.primary, letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>0{i + 1}</Mono>
              <div>
                <div style={{
                  fontFamily: theme._fonts.display, fontSize: 22, fontWeight: 500,
                  color: theme.text, letterSpacing: '-0.02em', lineHeight: 1.15,
                }}>{t.title}</div>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 12, lineHeight: 1.6 }}>{t.body}</div>
              </div>
              <div style={{
                background: theme.surfaceAlt, padding: 18,
                border: `1px solid ${theme.border}`, borderRadius: theme._radius.sm,
                borderLeft: `2px solid ${theme.primary}`,
              }}>
                <Mono size={9} style={{ color: theme.primary, letterSpacing: '0.12em' }}>HOW TO APPLY</Mono>
                <div style={{ fontSize: 12.5, color: theme.text, marginTop: 8, lineHeight: 1.55 }}>{t.apply}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contact block */}
      <div style={{ padding: '36px 40px 48px', background: theme.surfaceAlt, borderTop: `1px solid ${theme.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <Eye theme={theme}>Contact</Eye>
            <div style={{
              fontFamily: theme._fonts.display, fontWeight: theme._fonts.displayWeight,
              fontSize: 32, color: theme.text, letterSpacing: '-0.03em', marginTop: 12,
            }}>Dr. David P. Cook</div>
            <div style={{
              fontFamily: theme._fonts.mono, fontSize: 14,
              color: theme.primary, marginTop: 8, letterSpacing: '0.02em',
            }}>dacook@ohri.ca</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 14, lineHeight: 1.6, maxWidth: 480 }}>
              When you reach out, please tell us which of our research questions most interests you, and why. This helps us understand fit before we connect further.
            </div>
          </div>
          <div style={{
            background: theme.bg, padding: 20, borderRadius: theme._radius.md,
            border: `1px solid ${theme.border}`,
          }}>
            <Mono size={10} style={{ color: theme.textFaint, letterSpacing: '0.1em' }}>LOCATION</Mono>
            <div style={{ fontSize: 13.5, color: theme.text, marginTop: 10, lineHeight: 1.6 }}>
              Ottawa Hospital Research Institute<br/>
              Centre for Cancer Therapeutics<br/>
              501 Smyth Road<br/>
              Ottawa, ON
            </div>
          </div>
        </div>
      </div>

      <WebFooter theme={theme} />
    </div>
  );
}

Object.assign(window, {
  // Chrome
  WebNav, WebFooter,
  // Visuals
  UmapSpatialTwin, PhyllotaxisMark, HistologyTile, TMAGrid,
  StatCell, QuestionPull, Eye, SiteButton,
  // Pages
  ArtboardWebHome, ArtboardWebResearchHub,
  ArtboardWebDiseaseOC, ArtboardWebDiseaseEndo,
  ArtboardWebBiobank, ArtboardWebPeople, ArtboardWebJoin,
});
