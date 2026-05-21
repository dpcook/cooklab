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

// Cook Lab wordmark — lowercase, tight tracking, with a small geometric mark.
// The mark: a clean circle with an asymmetric inner orbit — referencing
// single-cell / spatial-genomics (a "cell" with a structural feature inside)
// without being a literal biology illustration.
function CookLabMark({ theme, size = 32, color }) {
  const c = color || theme.primary;
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="16" cy="16" r="14" stroke={c} strokeWidth="1.5" />
      <circle cx="20" cy="13" r="4.5" fill={c} />
      <circle cx="12" cy="19" r="1.5" fill={c} opacity="0.55" />
    </svg>
  );
}

function CookLabWordmark({ theme, size = 22, stacked = false, markSize, color }) {
  const f = theme._fonts?.display || "'Manrope',system-ui,sans-serif";
  const c = color || theme.text;
  const mc = color || theme.primary;
  if (stacked) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, color: c }}>
        <CookLabMark theme={theme} size={markSize || size * 2.2} color={mc} />
        <div style={{ fontFamily: f, fontWeight: 300, fontSize: size, letterSpacing: '-0.03em', lineHeight: 1 }}>
          cook<span style={{ fontWeight: 600 }}>lab</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.max(8, size * 0.4), color: c }}>
      <CookLabMark theme={theme} size={markSize || size * 1.3} color={mc} />
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
