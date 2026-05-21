// Cook Lab design tokens.
// Four palette variations, two type pairings, two radius modes, light + dark.
// Exposed on window.TOKENS / window.getPalette(name, dark) etc.

const PALETTES = {
  // A — Rust + Navy (reference)
  rustNavy: {
    name: 'Rust + Navy',
    desc: 'The reference palette. Terracotta as primary against deep navy and cool off-whites.',
    primary:   { 50:'#FEF3EE', 100:'#FDE2D1', 200:'#FABEA0', 300:'#F59065', 400:'#EB6235', 500:'#C2410C', 600:'#9C3409', 700:'#7A2A09', 800:'#5C210A', 900:'#3E1806', hex:'#C2410C' },
    secondary: { 50:'#F1F5F9', 100:'#E2E8F0', 200:'#CBD5E1', 300:'#94A3B8', 400:'#64748B', 500:'#334155', 600:'#1E293B', 700:'#0F172A', 800:'#0A1120', 900:'#050813', hex:'#0F172A' },
    tertiary:  { 50:'#FFFFFF', 100:'#FDFEFE', 200:'#F8FAFC', 300:'#F1F5F9', 400:'#E2E8F0', 500:'#CBD5E1', 600:'#94A3B8', 700:'#64748B', 800:'#334155', 900:'#0F172A', hex:'#F8FAFC' },
    neutral:   { 50:'#F1F4F8', 100:'#E0E5EC', 200:'#C1CBD6', 300:'#A3B0BE', 400:'#8794A5', 500:'#64748B', 600:'#4F5E72', 700:'#3B4858', 800:'#2A3340', 900:'#1A2029', hex:'#64748B' },
    accent:    { hex:'#0D9488', name:'Teal (accent)' }, // subtle nod to ovarian teal
  },
  // B — Rust + Teal accent
  rustTeal: {
    name: 'Rust + Teal',
    desc: 'Rust stays primary. Teal gets a larger role as a secondary accent — a quiet nod to ovarian-cancer awareness without being on-the-nose.',
    primary:   { 50:'#FEF3EE', 100:'#FDE2D1', 200:'#FABEA0', 300:'#F59065', 400:'#EB6235', 500:'#C2410C', 600:'#9C3409', 700:'#7A2A09', 800:'#5C210A', 900:'#3E1806', hex:'#C2410C' },
    secondary: { 50:'#ECFDF5', 100:'#D1FAE8', 200:'#A2F1D5', 300:'#5EDDB9', 400:'#2BC09A', 500:'#0D9488', 600:'#0B7A70', 700:'#0A5F58', 800:'#0A4541', 900:'#08302D', hex:'#0D9488' },
    tertiary:  { 50:'#FFFFFF', 100:'#FDFEFE', 200:'#F7FBFA', 300:'#EDF5F2', 400:'#D6E4DF', 500:'#B3C6C0', 600:'#879A94', 700:'#5D6F69', 800:'#394843', 900:'#161F1C', hex:'#F7FBFA' },
    neutral:   { 50:'#F2F5F4', 100:'#E2E7E5', 200:'#C6CFCC', 300:'#A8B4B0', 400:'#8A9893', 500:'#667671', 600:'#4F5D58', 700:'#3B4641', 800:'#28312D', 900:'#171C1A', hex:'#667671' },
    accent:    { hex:'#0F172A', name:'Navy (accent)' },
  },
  // C — Teal primary on near-black (dark hero)
  tealNoir: {
    name: 'Teal Noir',
    desc: 'Teal leads, on near-black. Best for hero moments, conference posters, and the lab\'s dark-mode surfaces.',
    primary:   { 50:'#ECFDF5', 100:'#D1FAE8', 200:'#A2F1D5', 300:'#5EDDB9', 400:'#2BC09A', 500:'#0D9488', 600:'#0B7A70', 700:'#0A5F58', 800:'#0A4541', 900:'#08302D', hex:'#0D9488' },
    secondary: { 50:'#F5F5F4', 100:'#E7E5E4', 200:'#D6D3D1', 300:'#A8A29E', 400:'#78716C', 500:'#57534E', 600:'#44403C', 700:'#292524', 800:'#1C1917', 900:'#0C0A09', hex:'#0C0A09' },
    tertiary:  { 50:'#FAFAF9', 100:'#F5F5F4', 200:'#E7E5E4', 300:'#D6D3D1', 400:'#A8A29E', 500:'#78716C', 600:'#57534E', 700:'#44403C', 800:'#292524', 900:'#0C0A09', hex:'#FAFAF9' },
    neutral:   { 50:'#F5F5F4', 100:'#E7E5E4', 200:'#D6D3D1', 300:'#A8A29E', 400:'#78716C', 500:'#57534E', 600:'#44403C', 700:'#292524', 800:'#1C1917', 900:'#0C0A09', hex:'#57534E' },
    accent:    { hex:'#F97316', name:'Amber (accent)' },
  },
  // D — Terracotta + muted teal (warm research)
  warmResearch: {
    name: 'Warm Research',
    desc: 'Softer terracotta with a muted dusty-teal pair. Reads as warm, approachable, editorial — suited to outreach and patient-facing materials.',
    primary:   { 50:'#FDF4EF', 100:'#FAE6D9', 200:'#F2C9AD', 300:'#E7A47C', 400:'#D87F55', 500:'#B95A36', 600:'#9A4726', 700:'#78371E', 800:'#582818', 900:'#3B1B10', hex:'#B95A36' },
    secondary: { 50:'#F2F6F5', 100:'#DFE9E7', 200:'#BCD0CC', 300:'#93B4AE', 400:'#6F9690', 500:'#527974', 600:'#425F5B', 700:'#344A46', 800:'#233331', 900:'#131D1B', hex:'#527974' },
    tertiary:  { 50:'#FDFBF7', 100:'#F7F1E6', 200:'#ECE2CC', 300:'#D9C9A9', 400:'#BFAB85', 500:'#9D8A64', 600:'#7A6B4D', 700:'#5A4F39', 800:'#3C3426', 900:'#211D15', hex:'#FDFBF7' },
    neutral:   { 50:'#F3F1ED', 100:'#E3DFD7', 200:'#C7C0B2', 300:'#A9A08D', 400:'#8D8370', 500:'#6F6656', 600:'#574F43', 700:'#413B31', 800:'#2B2721', 900:'#171410', hex:'#6F6656' },
    accent:    { hex:'#B95A36', name:'Terracotta' },
  },
};

const TYPE_PAIRINGS = {
  manropeInter: {
    name: 'Manrope + Inter',
    display: "'Manrope', system-ui, sans-serif",
    body:    "'Inter', system-ui, sans-serif",
    mono:    "'JetBrains Mono', ui-monospace, monospace",
    displayWeight: 300,  // lightweight Manrope — user said they like this
    displayTracking: '-0.035em',
  },
  fraunceInter: {
    name: 'Fraunces + Inter',
    display: "'Fraunces', Georgia, serif",
    body:    "'Inter', system-ui, sans-serif",
    mono:    "'JetBrains Mono', ui-monospace, monospace",
    displayWeight: 400,
    displayTracking: '-0.02em',
  },
};

// Theme = palette + light/dark → surface / text colors
function makeTheme(paletteName, dark) {
  const p = PALETTES[paletteName];
  if (!p) return makeTheme('rustNavy', dark);
  if (dark) {
    return {
      palette: p,
      name: p.name,
      dark: true,
      // Surfaces
      bg:            p.secondary[900] || '#0A0A0A',
      surface:       p.secondary[800] || '#1A1A1A',
      surfaceAlt:    p.secondary[700] || '#242424',
      elevated:      p.secondary[700] || '#2A2A2A',
      border:        'rgba(255,255,255,0.08)',
      borderStrong:  'rgba(255,255,255,0.16)',
      // Text
      text:          '#F5F5F4',
      textMuted:     'rgba(245,245,244,0.72)',
      textFaint:     'rgba(245,245,244,0.48)',
      // Brand roles
      primary:       p.primary[400],
      primaryHover:  p.primary[300],
      primarySoft:   p.primary[900],
      onPrimary:     '#FFFFFF',
      secondary:     p.secondary[200],
      onSecondary:   p.secondary[900],
      // Semantic
      success: '#10B981',
      warning: '#F59E0B',
      danger:  '#EF4444',
      info:    '#3B82F6',
    };
  }
  return {
    palette: p,
    name: p.name,
    dark: false,
    bg:            p.tertiary[50] || '#FFFFFF',
    surface:       '#FFFFFF',
    surfaceAlt:    p.tertiary[200],
    elevated:      '#FFFFFF',
    border:        'rgba(15,23,42,0.10)',
    borderStrong:  'rgba(15,23,42,0.18)',
    text:          p.secondary[700] || '#0F172A',
    textMuted:     'rgba(15,23,42,0.64)',
    textFaint:     'rgba(15,23,42,0.42)',
    primary:       p.primary[500],
    primaryHover:  p.primary[600],
    primarySoft:   p.primary[50],
    onPrimary:     '#FFFFFF',
    secondary:     p.secondary[700],
    onSecondary:   '#FFFFFF',
    success: '#10B981',
    warning: '#B45309',
    danger:  '#B91C1C',
    info:    '#1D4ED8',
  };
}

// 8-category data-viz palettes keyed by theme. Categorical palettes chosen for:
// - starts with the brand primary (so a single-series plot still reads on-brand)
// - reasonable perceptual separation
// - colorblind-aware ordering (1st vs 2nd distinguishable for deuteranopia)
const DATAVIZ = {
  rustNavy: {
    categorical: ['#C2410C', '#0F172A', '#0D9488', '#A16207', '#7C3AED', '#64748B', '#DC2626', '#0369A1'],
    sequential: ['#FEF3EE','#FDE2D1','#FABEA0','#F59065','#EB6235','#C2410C','#9C3409','#7A2A09'],
    diverging:  ['#0F172A','#334155','#94A3B8','#F8FAFC','#FABEA0','#EB6235','#C2410C'],
  },
  rustTeal: {
    categorical: ['#C2410C', '#0D9488', '#1E293B', '#A16207', '#7C3AED', '#667671', '#DC2626', '#0369A1'],
    sequential: ['#ECFDF5','#D1FAE8','#A2F1D5','#5EDDB9','#2BC09A','#0D9488','#0B7A70','#0A5F58'],
    diverging:  ['#0D9488','#5EDDB9','#A2F1D5','#F7FBFA','#FABEA0','#EB6235','#C2410C'],
  },
  tealNoir: {
    categorical: ['#0D9488', '#F97316', '#E7E5E4', '#A8A29E', '#5EDDB9', '#FBBF24', '#EC4899', '#60A5FA'],
    sequential: ['#ECFDF5','#D1FAE8','#A2F1D5','#5EDDB9','#2BC09A','#0D9488','#0B7A70','#0A5F58'],
    diverging:  ['#F97316','#FDBA74','#FED7AA','#F5F5F4','#A2F1D5','#2BC09A','#0D9488'],
  },
  warmResearch: {
    categorical: ['#B95A36', '#527974', '#6F6656', '#9D8A64', '#78371E', '#93B4AE', '#C7C0B2', '#344A46'],
    sequential: ['#FDF4EF','#FAE6D9','#F2C9AD','#E7A47C','#D87F55','#B95A36','#9A4726','#78371E'],
    diverging:  ['#527974','#93B4AE','#DFE9E7','#FDFBF7','#F2C9AD','#D87F55','#B95A36'],
  },
};

const RADIUS_MODES = {
  sharp:  { xs:2,  sm:4,  md:6,  lg:10, xl:14, pill:999 },
  soft:   { xs:4,  sm:8,  md:12, lg:16, xl:22, pill:999 },
  round:  { xs:8,  sm:12, md:18, lg:24, xl:32, pill:999 },
};

const SPACING = [0,2,4,6,8,12,16,20,24,32,40,48,64,80,96,128];
const SHADOWS = {
  none: 'none',
  xs:  '0 1px 2px rgba(15,23,42,0.04)',
  sm:  '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  md:  '0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
  lg:  '0 12px 32px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.06)',
  xl:  '0 24px 64px rgba(15,23,42,0.14), 0 8px 16px rgba(15,23,42,0.08)',
};

Object.assign(window, { PALETTES, TYPE_PAIRINGS, DATAVIZ, RADIUS_MODES, SPACING, SHADOWS, makeTheme });
