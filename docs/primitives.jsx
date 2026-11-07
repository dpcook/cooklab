// Primitives used across artboards — Card shell, Swatch, ScaleRow, Mono label, etc.
// All accept a `theme` and render against it (since the canvas may show multiple themes).

function SpecCard({ theme, title, meta, children, style, padding = 28, height }) {
  return (
    <div style={{
      width: '100%', height: height || '100%',
      background: theme.surface,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 18,
      padding,
      display: 'flex', flexDirection: 'column',
      fontFamily: theme._fonts?.body || "'Inter',system-ui,sans-serif",
      overflow: 'hidden',
      ...style,
    }}>
      {(title || meta) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: theme.textMuted, letterSpacing: '0.02em' }}>{title}</div>
          {meta && <div style={{ fontSize: 11, fontFamily: theme._fonts?.mono, color: theme.textFaint, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{meta}</div>}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function Swatch({ color, label, textColor, size = 'md' }) {
  const h = size === 'lg' ? 38 : size === 'sm' ? 18 : 26;
  return (
    <div style={{ flex: 1, height: h, background: color, position: 'relative' }}>
      {label && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: textColor, letterSpacing: '0.04em',
        }}>{label}</div>
      )}
    </div>
  );
}

function ScaleRow({ scale, showHex = false }) {
  const steps = [50,100,200,300,400,500,600,700,800,900];
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      {steps.map((s, i) => (
        <div key={s} style={{ flex: 1, height: 24, background: scale[s], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showHex && <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: i < 5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }}>{s}</span>}
        </div>
      ))}
    </div>
  );
}

function Mono({ children, style, size = 11 }) {
  return <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: size, letterSpacing: '0.02em', ...style }}>{children}</span>;
}

// Cook Lab wordmark — lowercase, tight tracking, with the cluster-graph mark.
// The mark: a cluster graph, five cell states joined by tapered edges, one state (rust) singled out.
// Drawn in a 64-unit box by brand/make_brand.py; these are its shapes. Pass `color` for the one-colour version.
const MARK_EDGES = [
  ['M18.9 37.88L14.1 30.32L11.39 31.77L15.03 39.96Z', false],
  ['M28.54 44.68L38.36 39.2L37.53 37.28L26.8 40.64Z', false],
  ['M42.89 40.25L52.79 51.72L54.3 50.43L44.47 38.89Z', false],
  ['M43.27 33.55L47.87 19.5L44.48 18.57L41.26 33Z', true],
];
const MARK_STATES = [
  [20.6, 45.7, 8, false],
  [47.8, 13.1, 6.4, true],
  [10.2, 26.3, 5.6, false],
  [41.3, 36.8, 3.8, false],
  [55.8, 53.7, 3.6, false],
];

function CookLabMark({ theme, size = 32, color }) {
  const ramp = theme.palette || {};
  const state = color || (theme.dark ? '#E2E8F0' : (ramp.secondary && ramp.secondary[700]) || '#1E2A44');
  const rust = color || theme.primary;
  const edge = color || (theme.dark ? '#64748B' : '#94A3B8');
  const rustEdge = color || (ramp.primary && ramp.primary[300]) || theme.primary;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', flexShrink: 0 }}>
      {MARK_EDGES.map(([d, warm], i) => <path key={i} d={d} fill={warm ? rustEdge : edge} />)}
      {MARK_STATES.map(([x, y, r, isRust], i) => <circle key={i} cx={x} cy={y} r={r} fill={isRust ? rust : state} />)}
    </svg>
  );
}

function CookLabWordmark({ theme, size = 22, stacked = false, markSize, color }) {
  const f = theme._fonts?.display || "'Manrope',system-ui,sans-serif";
  const c = color || theme.text;
  if (stacked) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, color: c }}>
        <CookLabMark theme={theme} size={markSize || size * 1.7} color={color} />
        <div style={{ fontFamily: f, fontWeight: 300, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1 }}>
          cook<span style={{ fontWeight: 600 }}>lab</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.max(8, size * 0.4), color: c }}>
      <CookLabMark theme={theme} size={markSize || size} color={color} />
      <div style={{ fontFamily: f, fontWeight: 300, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1 }}>
        cook<span style={{ fontWeight: 600 }}>lab</span>
      </div>
    </div>
  );
}

// Section header used inside artboard content
function ArtboardHeader({ theme, eyebrow, title, description }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {eyebrow && <Mono style={{ color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{eyebrow}</Mono>}
      <div style={{ fontFamily: theme._fonts?.display, fontWeight: theme._fonts?.displayWeight || 300, fontSize: 34, letterSpacing: theme._fonts?.displayTracking, color: theme.text, marginTop: 4, lineHeight: 1.05 }}>{title}</div>
      {description && <div style={{ fontSize: 14, color: theme.textMuted, marginTop: 10, maxWidth: 580, lineHeight: 1.5 }}>{description}</div>}
    </div>
  );
}

// Decorate theme object with fonts (bound at render time by App)
function bindFonts(theme, typePairing) {
  return { ...theme, _fonts: typePairing, _radius: theme._radius };
}

Object.assign(window, {
  SpecCard, Swatch, ScaleRow, Mono, CookLabMark, CookLabWordmark, ArtboardHeader, bindFonts,
});
