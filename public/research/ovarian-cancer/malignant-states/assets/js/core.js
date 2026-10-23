// Shared helpers for the web article: palettes, colour maps, data loading, tooltips.

export const STATE = {
  SecA: '#E6A141', Intermediate: '#D9662A', SecB: '#A8350A', Ciliated: '#0E8F84',
};
export const STATE_DARK = { SecA: '#F0B455', Intermediate: '#EE8240', SecB: '#EB6235', Ciliated: '#2BC09A' };
export const ARM = { Standard: '#A3ADBB', Bevacizumab: '#2F5F9E' };

// Cell types (lab_celltypes v1.2, with the web state colours for the epithelial states)
export const CELLTYPE = {
  'SecA epithelium': STATE.SecA, 'Intermediate epithelium': STATE.Intermediate, 'SecB epithelium': STATE.SecB,
  'Ciliated epithelium': STATE.Ciliated, 'Epithelial': STATE.SecA, 'Secretory': '#E6A141', 'Ciliated': STATE.Ciliated,
  'Mesothelial': '#C9B08C', 'Fibroblast': '#DDD5CA', 'Smooth muscle': '#D14E6C', 'Pericyte': '#B87A7A',
  'Endothelial': '#7D4E4E', 'T cell': '#87CEFA', 'T/NK cell': '#87CEFA', 'NK cell': '#56AFC4', 'B cell': '#5665B6',
  'Plasma cell': '#8A5DAF', 'Macrophage': '#8FBC8F', 'Conventional dendritic cell': '#2E8B57', 'DC': '#2E8B57',
  'Plasmacytoid dendritic cell': '#5E9C76', 'Neutrophil': '#6B8E23', 'Mast cell': '#8B9B6B', 'Monocyte': '#A9C79B',
  'Other': '#A0A0A0', 'Unassigned': '#C8CDD4',
};
// short labels for legends
export const SHORT = {
  'SecA epithelium': 'SecA', 'Intermediate epithelium': 'Intermediate', 'SecB epithelium': 'SecB',
  'Ciliated epithelium': 'Ciliated', 'Conventional dendritic cell': 'cDC', 'Plasmacytoid dendritic cell': 'pDC',
};
export const GREY = '#E3E7EC';
export const GREY_DARK = '#243049';

// Muted categorical (Lab muted 12) for studies and other nuisance categories
export const MUTED12 = ['#C2410C', '#3B689E', '#EBD792', '#458F86', '#6E5064', '#A6D6ED', '#92A36F', '#272A4E', '#EEB2B8', '#857157', '#8C8AC7', '#314D33'];
export const SITE = { Primary: '#64748B', Metastasis: '#B2D0E1', Ascites: '#3B689E', Healthy: '#E2E8F0' };

// ---------------------------------------------------------------- colour maps
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function ramp(stops) {
  const c = stops.map(hex);
  return (t) => {
    t = Math.max(0, Math.min(1, t)) * (c.length - 1);
    const i = Math.min(c.length - 2, Math.floor(t)), f = t - i;
    return [0, 1, 2].map((k) => Math.round(c[i][k] + (c[i + 1][k] - c[i][k]) * f));
  };
}
export const MAPS = {
  polar: ['#F7D58C', '#E6A141', '#D9662A', '#A8350A', '#4F1803'],                 // SecA → SecB
  secA: ['#F4EFE6', '#F5D9A6', '#ECB960', '#D99A2B', '#9A6510'],
  secB: ['#F4EFE6', '#F6C2A2', '#E8865A', '#C2410C', '#6E2306'],
  slate: ['#F4F7FB', '#C9D6E8', '#8FA6C8', '#5574A3', '#2D4A7A', '#16213A'],       // distance
  rocket: ['#FAEBDD', '#F6B48F', '#F37651', '#C8264B', '#7B1A51', '#35193E'],      // hypoxia
  viridis: ['#440154', '#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
  mako: ['#DEF5E5', '#60CEAC', '#3497A9', '#395D9C', '#3E356B', '#0B0405'],
  ember: ['#FDF5DF', '#F3C66F', '#E07B2E', '#A8350A', '#5B2A86', '#101934'],
};
export const mapCss = (name) => `linear-gradient(90deg, ${MAPS[name].join(', ')})`;
export const rgbCss = (a) => `rgb(${a[0]},${a[1]},${a[2]})`;

// ---------------------------------------------------------------- data
// Where the site's files are: beside the page in the standalone site, or under an absolute path when the pages are
// served from the lab website (the page sets window.MS_ROOT).
export const ROOT = window.MS_ROOT || '';
// Version of the site's files, written by build/stamp.py. It is added to every script, stylesheet and data URL, so a
// browser never runs an updated page against files it cached before the update.
export const V = 'b5261aa92c';
// a site file's URL: under ROOT, with the version stamp
export const asset = (url) => `${/^([a-z]+:)?\/\//.test(url) || url.startsWith('/') ? url : ROOT + url}${url.includes('?') ? '&' : '?'}v=${V}`;
const cache = new Map();
export function getJSON(url) {
  if (!cache.has(url)) cache.set(url, fetch(asset(url)).then((r) => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); }));
  return cache.get(url);
}

// Point sets: <name>.json describes fields; <name>.bin holds the arrays (see build/DATA_SPEC.md)
export async function loadPoints(url) {
  if (cache.has('pts:' + url)) return cache.get('pts:' + url);
  const p = (async () => {
    const meta = await getJSON(url);
    const base = url.slice(0, url.lastIndexOf('/') + 1);
    const buf = await (await fetch(asset(base + meta.bin))).arrayBuffer();
    const n = meta.n, cols = {};
    let off = 0;
    for (const f of meta.fields) {
      const T = f.type === 'u16' ? Uint16Array : f.type === 'f32' ? Float32Array : Uint8Array;
      cols[f.name] = new T(buf, off, n);
      off += n * T.BYTES_PER_ELEMENT;
      off = Math.ceil(off / 4) * 4;
    }
    const [x0, y0, x1, y1] = meta.bbox;
    const X = new Float32Array(n), Y = new Float32Array(n);
    const qx = cols.x, qy = cols.y, sx = (x1 - x0) / 65535, sy = (y1 - y0) / 65535;
    for (let i = 0; i < n; i++) { X[i] = x0 + qx[i] * sx; Y[i] = y0 + qy[i] * sy; }
    const field = Object.fromEntries(meta.fields.map((f) => [f.name, f]));
    return { meta, n, X, Y, cols, field };
  })();
  cache.set('pts:' + url, p);
  return p;
}
// value of a u8 continuous field
export function decode(f, q) { return q === 255 ? NaN : f.range[0] + (q / 254) * (f.range[1] - f.range[0]); }

// ---------------------------------------------------------------- formatting
export const fmt = {
  int: (v) => Math.round(v).toLocaleString('en-US'),
  p: (p) => (p < 0.001 ? 'p < 0.001' : `p = ${p < 0.01 ? p.toFixed(3) : p.toFixed(p < 0.1 ? 3 : 2)}`),
  pct: (v, d = 0) => `${(v * (v <= 1 ? 100 : 1)).toFixed(d)}%`,
  num: (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '–'),
};
export function italicGenes(s) {
  return s.replace(/\b([A-Z][A-Z0-9]{1,}[0-9A-Z-]*)\b/g, (m) => (GENE_SET.has(m) ? `<i>${m}</i>` : m));
}
export const GENE_SET = new Set(('MECOM SOX17 FBXO21 PBX1 LGR5 LPAR3 RCN2 KRT17 LCN2 TACSTD2 KRT7 KRT19 SLPI PRSS22 FOXJ1 CAPS PAX8 WFDC2 MKI67 ' +
  'VEGFA CTSL CD44 ICAM1 CD55 CD47 IL32 MMP7 SLC16A3 LGALS9 BIRC3 NFKBIA LDHA ENO1 PGK1 ALDOA CXCL10 CXCL11 A2M C1QC SPP1 MMP9 ' +
  'CA9 TIMP1 TGM2 HIF1A SLC2A1 NDRG1 Krt7 KRT18 VIM TNFA TOP2A PCNA').split(' '));

// ---------------------------------------------------------------- tooltip
let tipEl;
// the element that holds this site's pages and styles: <body> on its own, a wrapper inside the lab website
export const pageRoot = () => document.querySelector('.ms') || document.body;
export function tip() {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tooltip'; pageRoot().appendChild(tipEl); }
  return {
    show(html, x, y) {
      tipEl.innerHTML = html; tipEl.classList.add('on');
      const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      let lx = x + 14, ly = y + 14;
      if (lx + w > innerWidth - 8) lx = x - w - 14;
      if (ly + h > innerHeight - 8) ly = y - h - 14;
      tipEl.style.left = lx + 'px'; tipEl.style.top = ly + 'px';
    },
    hide() { tipEl.classList.remove('on'); },
  };
}
export const row = (k, v) => `<div class="tt-r"><span>${k}</span><span>${v}</span></div>`;

// ---------------------------------------------------------------- misc
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function el(tag, attrs = {}, html = '') {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v);
  }
  if (html) e.innerHTML = html;
  return e;
}
export function seg(container, options, value, onChange) {
  const s = el('div', { class: 'seg', role: 'group' });
  for (const [v, label] of options) {
    const b = el('button', { type: 'button', 'aria-pressed': String(v === value) }, label);
    b.onclick = () => { s.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); onChange(v); };
    s.appendChild(b);
  }
  container.appendChild(s);
  return s;
}
export function chips(container, items) {
  container.innerHTML = items.map(([label, color]) => `<span class="chip" style="--c:${color}">${label}</span>`).join('');
}
export function colorbar(container, { title, map, lo, hi }) {
  container.innerHTML = `<div class="colorbar"><div class="t">${title}</div><div class="bar" style="background:${mapCss(map)}"></div><div class="ends"><span>${lo}</span><span>${hi}</span></div></div>`;
}
// run fn once when the element first nears the viewport
export function whenVisible(elm, fn, margin = '400px') {
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: margin });
  io.observe(elm);
}
export function revealOnScroll(root = document) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  root.querySelectorAll('.reveal').forEach((e) => io.observe(e));
}
export function navSolidOnScroll(nav, threshold) {
  if (!nav) return;
  const bar = nav.querySelector('.progress');
  const f = () => {
    nav.classList.toggle('solid', scrollY > (typeof threshold === 'function' ? threshold() : threshold));
    if (bar) bar.style.width = `${(100 * scrollY) / Math.max(1, document.documentElement.scrollHeight - innerHeight)}%`;
  };
  addEventListener('scroll', f, { passive: true }); f();
}
