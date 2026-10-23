// Point-cloud viewers used on both pages: atlas UMAP, epithelial UMAP, tissue maps, model UMAPs.
import { loadPoints, getJSON, decode, CELLTYPE, SHORT, STATE, MUTED12, SITE, GREY, seg, chips, colorbar, row, ramp, MAPS } from './core.js?v=b5261aa92c';
import { PointViewer } from './gl-points.js?v=b5261aa92c';

const catColors = (cats, map, fallback = MUTED12) => Object.fromEntries(cats.map((c, i) => [c, map[c] || fallback[i % fallback.length]]));
function failed(host, e) { host.innerHTML = `<div class="loading">Data not available yet (${e.message.split(':')[0]}).</div>`; console.warn(e); }
const legendFor = (cats, colors) => cats.map((c) => [SHORT[c] || c, colors[c]]);

// ------------------------------------------------------------------ epithelial UMAP (Fig 1f,h,i,j)
export async function epiViewer(host, controls, key, opt = {}) {
  let pts;
  try { pts = await loadPoints('data/epi_umap.json'); } catch (e) { return failed(host, e); }
  host.innerHTML = '';
  const F = pts.field;
  const stateCats = F.state.categories;
  const stateColors = catColors(stateCats, STATE);
  const genes = pts.meta.fields.filter((f) => /^[A-Z][A-Z0-9]+$/.test(f.name) && f.range).map((f) => f.name);
  const v = new PointViewer(host, pts, {
    pointPx: 1.6, wheel: opt.wheel || 'modifier',
    onHover: (i) => {
      const st = stateCats[pts.cols.state[i]];
      let extra = '';
      if (mode === 'gene') extra = row(`<i>${gene}</i>`, decode(F[gene], pts.cols[gene][i]).toFixed(2));
      else if (mode !== 'state' && F[mode]) extra = row(F[mode].label || mode, decode(F[mode], pts.cols[mode][i]).toFixed(3));
      return `<div class="tt-h"><span class="chip" style="--c:${stateColors[st]}">${st}</span></div>${extra}${F.site ? row('Site', F.site.categories[pts.cols.site[i]]) : ''}`;
    },
  });
  let mode = opt.mode || 'state', gene = opt.gene || 'KRT7';
  const apply = () => {
    if (mode === 'state') { v.setColor({ type: 'cat', field: 'state', colors: stateColors, frontLast: ['SecB', 'Ciliated'] }); chips(key, legendFor(stateCats, stateColors)); }
    else if (mode === 'gene') { v.setColor({ type: 'cont', field: gene, map: 'viridis', zeroGrey: true, grey: '#E6E9EE' }); colorbar(key, { title: `<i>${gene}</i> expression (log-normalized)`, map: 'viridis', lo: '0', hi: F[gene].range[1].toFixed(1) }); }
    else { const m = mode === 'secA' ? 'secA' : mode === 'secB' ? 'secB' : 'mako'; v.setColor({ type: 'cont', field: mode, map: m, grey: '#E6E9EE', lo: 6 }); colorbar(key, { title: F[mode].label || mode, map: m, lo: 'low', hi: 'high' }); }
  };
  const modes = [['state', 'State'], ['secA', 'SecA program'], ['secB', 'SecB program']].filter(([m]) => m === 'state' || F[m]);
  if (opt.extraModes) for (const m of opt.extraModes) if (F[m[0]]) modes.push(m);
  modes.push(['gene', 'Gene']);
  seg(controls, modes, mode, (m) => { mode = m; sel.style.display = m === 'gene' ? '' : 'none'; apply(); });
  const sel = document.createElement('select'); sel.className = 'gene-select'; sel.setAttribute('aria-label', 'Gene');
  sel.innerHTML = genes.map((g) => `<option ${g === gene ? 'selected' : ''}>${g}</option>`).join('');
  sel.style.display = mode === 'gene' ? '' : 'none';
  sel.onchange = () => { gene = sel.value; apply(); };
  controls.appendChild(sel);
  apply();
  return v;
}

// ------------------------------------------------------------------ atlas UMAP (Fig 1a)
export async function atlasViewer(host, controls, key, opt = {}) {
  let pts;
  try { pts = await loadPoints('data/atlas_umap.json'); } catch (e) { return failed(host, e); }
  host.innerHTML = '';
  const F = pts.field;
  const palettes = {
    celltype: catColors(F.celltype.categories, CELLTYPE),
    study: catColors(F.study?.categories || [], {}),
    site: catColors(F.site?.categories || [], SITE, ['#64748B', '#B2D0E1', '#3B689E', '#E2E8F0', '#CBD5E1']),
    treatment: catColors(F.treatment?.categories || [], { 'Pre-treatment': '#CBD5E1', 'Post-chemo': '#C2410C', 'Post-niraparib': '#6E5064', Other: '#94A3B8', Unknown: '#475569' }),
  };
  let mode = 'celltype';
  const v = new PointViewer(host, pts, {
    pointPx: 1.4, wheel: opt.wheel || 'modifier',
    onHover: (i) => `<div class="tt-h">${F.celltype.categories[pts.cols.celltype[i]]}</div>` + ['study', 'site', 'treatment'].filter((k) => F[k]).map((k) => row(k[0].toUpperCase() + k.slice(1), F[k].categories[pts.cols[k][i]])).join(''),
  });
  const apply = () => { v.setColor({ type: 'cat', field: mode, colors: palettes[mode] }); chips(key, legendFor(F[mode].categories, palettes[mode])); };
  seg(controls, [['celltype', 'Cell type'], ['study', 'Study'], ['site', 'Site'], ['treatment', 'Treatment']].filter(([k]) => F[k]), mode, (m) => { mode = m; apply(); });
  apply();
  return v;
}

// ------------------------------------------------------------------ tissue map (Fig 4b–j, 5c–d)
export const TISSUE_STEPS = {
  celltype: { label: 'Cell type' },
  polar: { label: 'Polarization', field: 'polarization', map: 'polar', title: 'Polarization (SecB − SecA)', lo: 'SecA', hi: 'SecB' },
  vessel: { label: 'Distance to vessels', field: 'vasc_dist', map: 'slate', title: 'Distance to nearest vessel', unit: 'µm' },
  hypoxia: { label: 'Hypoxia', field: 'hypoxia', map: 'rocket', title: 'Hypoxia (UCell)' },
  hypoxia_nb: { label: 'Neighbourhood hypoxia', field: 'hypoxia_nb', map: 'rocket', title: 'Neighbourhood hypoxia (mean within 50 µm)' },
  glycolysis: { label: 'Glycolysis', field: 'glycolysis', map: 'rocket', title: 'Glycolysis (UCell)', secretoryOnly: true },
  proliferation: { label: 'Proliferation', field: 'proliferation', map: 'mako', title: 'Proliferation (UCell)', secretoryOnly: true },
  LDHA: { label: '<i>LDHA</i>', field: 'LDHA', map: 'viridis', title: '<i>LDHA</i> expression', secretoryOnly: true },
  nfkb: { label: 'NF-κB', field: 'nfkb', map: 'rocket', title: 'NF-κB (UCell)', secretoryOnly: true },
};
export async function tissueViewer(host, key, opt = {}) {
  const code = opt.code || 'WT01';
  let pts;
  try { pts = await loadPoints(`data/tissue/${code}.json`); } catch (e) { failed(host, e); return null; }
  host.innerHTML = '';
  const F = pts.field, cats = F.celltype.categories;
  const colors = catColors(cats, CELLTYPE);
  const secretory = cats.filter((c) => /^(SecA|Intermediate|SecB)/.test(c));
  const v = new PointViewer(host, pts, {
    cellUm: 9, wheel: opt.wheel || 'modifier',
    onHover: (i) => {
      const c = cats[pts.cols.celltype[i]];
      const s = TISSUE_STEPS[step];
      let extra = '';
      if (s && s.field && F[s.field]) { const val = decode(F[s.field], pts.cols[s.field][i]); if (Number.isFinite(val)) extra = row(s.title.replace(/<[^>]+>/g, ''), s.unit ? `${val.toFixed(0)} ${s.unit}` : val.toFixed(3)); }
      return `<div class="tt-h"><span class="chip" style="--c:${colors[c]}">${c}</span></div>${extra}`;
    },
  });
  let step = 'celltype';
  // real cell outlines in the ROI
  let rois = null;
  try {
    const R = await getJSON(`data/tissue/${code}_rois.json`);
    rois = Object.fromEntries((R.rois || []).map((r) => [r.id, [r.x0, r.y0, r.x1, r.y1]]));
  } catch { /* optional */ }
  // segmented cell outlines replace the dots when zoomed in
  if (opt.polygons !== false) v.setSegmentation(`data/tissue/${code}_seg/index.json`).catch((e) => console.warn(e));
  const set = (name, ms = 700) => {
    step = name;
    const s = TISSUE_STEPS[name];
    if (!s.field || !F[s.field]) {
      v.setColor({ type: 'cat', field: 'celltype', colors, frontLast: secretory }, ms);
      chips(key, legendFor(cats, colors).filter(([l]) => l !== 'Unassigned'));
      return;
    }
    const only = s.secretoryOnly || s.field === 'polarization' ? { field: 'celltype', cats: s.secretoryOnly ? [...secretory, ...cats.filter((c) => /^Ciliated/.test(c))] : secretory } : null;
    const f0 = F[s.field];
    const q = (val) => Math.round(((val - f0.range[0]) / (f0.range[1] - f0.range[0])) * 254);
    let lo = 0, hi = 254;
    const fr = s.field === 'polarization' && f0.thresholds ? null : f0.figure_range;
    if (fr) { lo = q(fr[0]); hi = q(fr[1]); }
    if (s.field === 'polarization' && f0.thresholds) {
      const a = f0.thresholds.SecA_max, b = f0.thresholds.SecB_min, span = (b - a) / 0.3;
      lo = q(a - 0.42 * span); hi = q(a + 0.58 * span);
    }
    v.setColor({ type: 'cont', field: s.field, map: s.map, only, grey: '#E9ECF0', lo, hi }, ms);
    const f = F[s.field];
    const r = f.figure_range && s.field !== 'polarization' ? f.figure_range : f.range;
    colorbar(key, { title: s.title, map: s.map, lo: s.lo || (s.unit ? `${r[0].toFixed(0)} ${s.unit}` : r[0].toFixed(2)), hi: s.hi || (s.unit ? `${r[1].toFixed(0)} ${s.unit}+` : r[1].toFixed(2)) });
    if (only) key.insertAdjacentHTML('beforeend', '<span class="meta">Secretory cells only; other cells grey</span>');
  };
  set('celltype', 0);
  // a window of up to 340 µm centred on the SecB-rich lumen of the Fig 4c region; on a small map it narrows so that
  // cells are still drawn about 15 px wide, with their outlines
  const cellsBox = () => {
    const r = rois?.fig4c; if (!r) return null;
    const cx = r[0] + 643, cy = r[1] + 650, half = Math.min(170, (Math.min(v.w, v.h) * (1 - 2 * v.opt.pad)) / 3);
    return [cx - half, cy - half, cx + half, cy + half];
  };
  // the area in view when the outlines start to appear on the way in (1 px per µm), whose tiles are loaded ahead
  const arrivalBox = () => {
    const b = cellsBox(); if (!b) return [0, 0, 0, 0];
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, R = Math.max(v.w, v.h) / 2 + 40;
    return [cx - R, cy - R, cx + R, cy + R];
  };
  return {
    viewer: v, set, rois, pts, home: () => v.fit(v.home, 1100), zoomRoi: (name = 'fig4c') => rois && rois[name] && v.fit(rois[name], 1600),
    prefetchCells: () => v.prefetchSeg(arrivalBox()),
    zoomCells: () => { const b = cellsBox(); if (b) { v.prefetchSeg(arrivalBox()); v.fit(b, 2200); } },
  };
}
function normalizePolys(P) {
  // parallel arrays: {categories, cells: {celltype: [...], polarization: [...], poly: [[x0,y0,...], ...]}}
  const c = P.cells;
  return c.poly.map((v, i) => {
    const o = { celltype: P.categories[c.celltype[i]], polarization: c.polarization[i], v };
    let cx = 0, cy = 0; const n = o.v.length / 2;
    for (let k = 0; k < o.v.length; k += 2) { cx += o.v[k] / n; cy += o.v[k + 1] / n; }
    o.cx = cx; o.cy = cy;
    return o;
  });
}

// ------------------------------------------------------------------ generic categorical UMAP (PDO, KPCA)
export async function catViewer(host, url, field, key, opt = {}) {
  let pts;
  try { pts = await loadPoints(url); } catch (e) { return failed(host, e); }
  host.innerHTML = '';
  const F = pts.field;
  const colors = opt.colors || catColors(F[field].categories, CELLTYPE);
  const v = new PointViewer(host, pts, { pointPx: opt.pointPx || 2.4, wheel: 'modifier', onHover: (i) => `<div class="tt-h">${F[field].categories[pts.cols[field][i]]}</div>` + (opt.hover ? opt.hover(pts, i) : '') });
  if (opt.cont) { v.setColor({ type: 'cont', field: opt.cont.field, map: opt.cont.map, zeroGrey: opt.cont.zeroGrey, grey: '#E6E9EE' }, 0); colorbar(key, opt.cont.bar); }
  else { v.setColor({ type: 'cat', field, colors }, 0); chips(key, legendFor(F[field].categories, colors)); }
  return v;
}
