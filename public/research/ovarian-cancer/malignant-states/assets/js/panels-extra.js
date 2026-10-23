// Panels used on the full-article page only.
import { getJSON, el, STATE, CELLTYPE, seg, chips, colorbar, row, tip, fmt, whenVisible, loadPoints, decode, asset } from './core.js?v=b5261aa92c';
import { catViewer } from './viewers.js?v=b5261aa92c';
import { PointViewer } from './gl-points.js?v=b5261aa92c';
import * as C from './charts.js?v=b5261aa92c';
import { REGISTRY as P, pstr } from './panels.js?v=b5261aa92c';

const d3 = window.d3;
const data = (n) => getJSON(`data/${n}.json`);
function fallback(host, fig, e) {
  host.innerHTML = `<div class="placeholder"><div><img src="${asset(`assets/img/fig/fig${fig}_thumb.jpg`)}" alt=""><div>This panel is being redrawn from the study data.</div></div></div>`;
  if (e) console.info(`Figure ${fig} placeholder:`, e);
}
const guard = (fig, fn) => async (host, opt) => { try { await fn(host, opt || {}); } catch (e) { fallback(host, fig, e); } };
function viewerHost(host, aspect = 0.9) {
  host.innerHTML = '';
  const b = host.closest('[data-ch]');
  const ctl = el('div', { class: 'controls' }), v = el('div', { class: 'viewer', style: b ? `height:${b.dataset.ch}px` : `aspect-ratio: 1 / ${aspect}` }), key = el('div', { class: 'legend-row' });
  host.append(ctl, v, key);
  return { ctl, v, key };
}

// ------------------------------------------------------------------ Figure 1
export const studyBars = guard(1, async (host) => {
  const f = await data('fig1');
  host.innerHTML = '';
  const c = el('div'); host.appendChild(c);
  // cells per study, log scale, with patients
  const rows = f.b.studies.map((st, i) => ({ label: st, cells: f.b.cells[i], patients: f.b.patients[i] }));
  const width = () => c.clientWidth || 420;
  const render = () => {
    const w = width(), m = { l: 150, r: 92, t: 6, b: 28 }, bh = 18, h = rows.length * (bh + 6);
    c.innerHTML = '';
    const svg = d3.select(c).append('svg').attr('width', w).attr('height', h + m.t + m.b).classed('chart', true);
    const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);
    const x = d3.scaleLog().domain([1000, d3.max(rows, (r) => r.cells) * 1.2]).range([0, w - m.l - m.r]);
    rows.forEach((r, i) => {
      const y = i * (bh + 6);
      g.append('text').attr('x', -10).attr('y', y + bh / 2).attr('dy', '0.32em').attr('text-anchor', 'end').attr('class', 'lab').style('font-weight', 400).text(r.label);
      g.append('rect').attr('x', 0).attr('y', y).attr('height', bh).attr('width', x(r.cells)).attr('rx', 3).attr('fill', '#64748B')
        .on('pointermove', (e) => tip().show(`<div class="tt-h">${r.label}</div>${row('Cells', fmt.int(r.cells))}${row('Patients', r.patients)}`, e.clientX, e.clientY)).on('pointerleave', () => tip().hide());
      g.append('text').attr('x', x(r.cells) + 6).attr('y', y + bh / 2).attr('dy', '0.32em').attr('class', 'stat').text(`${d3.format('.3~s')(r.cells)} · ${r.patients} pts`);
    });
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(4, '~s').tickSize(4));
    c.classList.add('chart');
  };
  render(); new ResizeObserver(render).observe(c);
  const tabs = el('div', { style: 'margin-top:18px' }); host.appendChild(tabs);
  const out = el('div', { style: 'margin-top:10px' }); host.appendChild(out);
  const sets = [['c', 'Site', null, { Primary: '#64748B', Metastasis: '#B2D0E1', Ascites: '#3B689E', Healthy: '#E2E8F0' }], ['d', 'Treatment', null, { 'Pre-treatment': '#E2E8F0', 'Post-chemo': '#C2410C', Other: '#94A3B8', 'Post-niraparib': '#6E5064', Unknown: '#475569' }], ['e', 'Cell type', null, CELLTYPE]].filter(([k]) => f[k]);
  const show = (k) => {
    const [, , keys, colors] = sets.find((s) => s[0] === k);
    const P2 = f[k];
    const rr = P2.studies.map((st, i) => ({ label: st, values: Object.fromEntries(P2.categories.map((q) => [q, P2.percent[q][i]])) }));
    const kk = keys || P2.categories;
    out.innerHTML = '';
    const cc = el('div'); out.appendChild(cc);
    C.stack100(cc, { rows: rr, keys: kk, colors: Object.fromEntries(kk.map((q, i) => [q, colors[q] || ['#94A3B8', '#CBD5E1', '#64748B'][i % 3]])), orient: 'h', labelW: 150, barH: 18, minLabel: 0.14, pad: 0.22 });
    out.insertAdjacentHTML('beforeend', `<div class="legend-row">${kk.map((q) => `<span class="chip" style="--c:${colors[q] || '#94A3B8'}">${q}</span>`).join('')}</div>`);
  };
  seg(tabs, sets.map(([k, l]) => [k, l]), sets[0][0], show);
  show(sets[0][0]);
});
export const cloneViolins = guard(1, async (host) => {
  const m = (await data('fig1')).m;
  const pc = { 'Patient A': '#94A3B8', 'Patient B': '#5574A3', 'Patient C': '#458F86' };
  const groups = m.clones.map((c) => ({ label: `${c.patient.slice(-1)} · ${c.clone.replace('clone ', '')}`, color: pc[c.patient] || '#94A3B8', q: c.q, kde: c.kde, n: c.n }));
  C.violins(host, { groups, refs: [{ y: m.thresholds.Intermediate, label: 'Int.', color: STATE.Intermediate }, { y: m.thresholds.SecB, label: 'SecB', color: STATE.SecB }], ylabel: 'SecB program usage', ydomain: m.ylim, aspect: 0.62, margin: { left: 52, right: 46, top: 14, bottom: 40 } });
  host.insertAdjacentHTML('beforeend', '<div class="legend-row"><span class="meta">Clone labels: patient · clone. Dashed lines: atlas thresholds for intermediate and SecB cells.</span></div>');
});

// ------------------------------------------------------------------ Figure 3
export const pdoUmap = guard(3, async (host) => {
  const { ctl, v, key } = viewerHost(host, 0.95);
  let mode = 'model';
  const draw = async () => {
    v.innerHTML = '';
    if (mode === 'model') await catViewer(v, 'data/pdo_umap.json', 'origin', key, { colors: { Primary: '#A6D6ED', Ascites: '#3B689E' }, hover: (pts, i) => row('Line', pts.field.model.categories[pts.cols.model[i]]) + row('SecB score', decode(pts.field.secB, pts.cols.secB[i]).toFixed(3)) });
    else await catViewer(v, 'data/pdo_umap.json', 'model', key, { cont: { field: 'secB', map: 'secB', bar: { title: 'SecB UCell score', map: 'secB', lo: '0', hi: '0.78' } }, hover: (pts, i) => row('SecB score', decode(pts.field.secB, pts.cols.secB[i]).toFixed(3)) });
  };
  seg(ctl, [['model', 'Origin'], ['secB', 'SecB score']], mode, (m) => { mode = m; draw(); });
  draw();
});
export const optoTabs = guard(3, async (host) => {
  const f = await data('fig3');
  host.innerHTML = '';
  const t = el('div', { class: 'tabs-inline' }), c = el('div'); host.append(t, c);
  const show = (k) => { c.innerHTML = ''; const cc = el('div'); c.appendChild(cc); P.opto(cc, { which: k, aspect: 0.36 }); };
  seg(t, [['c', 'Days in culture'], ['d', 'Cytokines'], ['e', 'Media']], 'd', show);
  show('d');
  host.insertAdjacentHTML('beforeend', '<p class="panel-foot">Only IFN-γ (blue) raised SecB expression across the population. Medians are 0 in most conditions: most cells express none of the seven SecB genes.</p>');
});
export const hifQuiescence = guard(3, async (host) => {
  const f = (await data('fig3')).f;
  const pal = { 'PDO ascites': '#3B689E', 'PDO primary': '#A6D6ED', 'PDO DepMap': '#6E5064', 'PDO physoxia': '#857157', 'PDO hypoxia': '#C2410C', Organoid: '#92A36F', Spheroid: '#314D33' };
  const groups = [...new Set(f.points.map((p) => p.group))];
  host.innerHTML = '';
  for (const [k, lab] of [['hif', 'HIF induction'], ['quiescence', 'Quiescence']]) {
    const c = el('div'); host.appendChild(c);
    const render = () => {
      const total = C.cardHeight(host, 350), w = c.clientWidth || 360, h = Math.round(k === 'quiescence' ? total * 0.56 : total * 0.44), m = { l: 48, r: 44, t: 10, b: k === 'quiescence' ? 40 : 20 };
      c.innerHTML = '';
      const svg = d3.select(c).append('svg').attr('width', w).attr('height', h); c.classList.add('chart');
      const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);
      const x = d3.scalePoint().domain(groups).range([0, w - m.l - m.r]).padding(0.5);
      const vals = f.points.map((p) => p[k]).concat([f.atlas_reference_medians.SecB[k]]);
      const y = d3.scaleLinear().domain(d3.extent(vals)).nice().range([h - m.t - m.b, 0]);
      g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(6)).select('.domain').remove();
      g.append('text').attr('class', 'axis-title').attr('transform', `translate(-38,${(h - m.t - m.b) / 2}) rotate(-90)`).attr('text-anchor', 'middle').text(lab);
      const ref = f.atlas_reference_medians.SecB[k];
      g.append('line').attr('x1', 0).attr('x2', w - m.l - m.r).attr('y1', y(ref)).attr('y2', y(ref)).attr('stroke', STATE.SecB).attr('stroke-dasharray', '4 3');
      g.append('text').attr('x', w - m.l - m.r + 4).attr('y', y(ref)).attr('dy', '0.32em').attr('class', 'stat').style('fill', STATE.SecB).text('SecB');
      const rnd = d3.randomLcg(3);
      g.selectAll(null).data(f.points).join('circle').attr('cx', (p) => x(p.group) + (rnd() - 0.5) * 18).attr('cy', (p) => y(p[k])).attr('r', 4).attr('fill', (p) => pal[p.group]).attr('stroke', '#fff')
        .on('pointermove', (e, p) => tip().show(`<div class="tt-h">${p.label || p.model || p.group}</div>${row(lab, p[k].toFixed(2))}`, e.clientX, e.clientY)).on('pointerleave', () => tip().hide());
      if (k === 'quiescence') {
        const short = { 'PDO ascites': 'Ascites PDO', 'PDO primary': 'Primary PDO', 'PDO DepMap': 'DepMap', 'PDO physoxia': 'Physoxia', 'PDO hypoxia': 'Hypoxia', Organoid: 'Organoid', Spheroid: 'Spheroid' };
        const ax = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h - m.t - m.b})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8).tickFormat((d) => short[d] || d));
        ax.select('.domain').remove();
        C.declutter(svg.node());
      }
    };
    render(); new ResizeObserver(render).observe(c);
  }
});
export const kpcaUmap = guard(3, async (host) => {
  const { v, key } = viewerHost(host, 0.95);
  const colors = { Epithelial: STATE.SecA, Macrophage: CELLTYPE.Macrophage, 'T/NK': CELLTYPE['T cell'], Endothelial: CELLTYPE.Endothelial, Neutrophil: CELLTYPE.Neutrophil, Fibroblast: CELLTYPE.Fibroblast, Monocyte: CELLTYPE.Monocyte, Dendritic: CELLTYPE.DC, B: CELLTYPE['B cell'] };
  const meta = await data('kpca_umap');
  const cats = meta.fields.find((f) => f.name === 'celltype').categories;
  await catViewer(v, 'data/kpca_umap.json', 'celltype', key, { colors: Object.fromEntries(cats.map((c) => [c, colors[c] || colors[c.split(' ')[0]] || '#94A3B8'])), pointPx: 2 });
});
export const kpcaEpi = guard(3, async (host) => {
  const { ctl, v, key } = viewerHost(host, 0.95);
  const pts = await loadPoints('data/kpca_epi_umap.json');
  const F = pts.field;
  const pv = new PointViewer(v, pts, { pointPx: 2.2, wheel: 'modifier', onHover: (i) => `${row('Polarization', decode(F.polarization, pts.cols.polarization[i]).toFixed(2))}${row('<i>Krt7</i>', decode(F.Krt7, pts.cols.Krt7[i]).toFixed(2))}` });
  const set = (m) => {
    if (m === 'polarization') { pv.setColor({ type: 'cont', field: 'polarization', map: 'polar' }); colorbar(key, { title: 'Polarization (SecB − SecA)', map: 'polar', lo: `SecA ${F.polarization.range[0].toFixed(2)}`, hi: `SecB +${F.polarization.range[1].toFixed(2)}` }); }
    else { pv.setColor({ type: 'cont', field: 'Krt7', map: 'viridis', zeroGrey: true, grey: '#E6E9EE' }); colorbar(key, { title: '<i>Krt7</i> (log-normalized)', map: 'viridis', lo: '0', hi: F.Krt7.range[1].toFixed(2) }); }
  };
  seg(ctl, [['polarization', 'Polarization'], ['Krt7', '<i>Krt7</i>']], 'polarization', set);
  set('polarization');
});
export const ihc = guard(3, async (host) => {
  const l = (await data('fig3')).l || {};
  const umpx = l.um_per_px || l.um_per_pixel || 0.44;
  host.innerHTML = `<div class="ihc" style="position:relative"><img src="${asset('assets/img/kpca_krt7_ihc.jpg')}" alt="KRT7 immunohistochemistry of a KPCA.B tumour: brown KRT7-positive cells line luminal spaces away from the blue hematoxylin-stained stroma"><div class="sb" style="position:absolute;right:14px;bottom:14px;display:grid;gap:4px;justify-items:end"><div style="height:3px;background:#fff;box-shadow:0 0 2px rgba(0,0,0,.6)"></div><span style="font:600 12px var(--font-body);color:#fff;text-shadow:0 0 3px rgba(0,0,0,.7)">100 µm</span></div></div>`;
  const img = host.querySelector('img');
  const set = () => { const scale = img.clientWidth / img.naturalWidth; host.querySelector('.sb div').style.width = `${(100 / umpx) * scale}px`; };
  img.onload = set; new ResizeObserver(set).observe(img);
});

// ------------------------------------------------------------------ Figure 4–6 helpers
export const pairWithTMA = (file, key, unit) => guard(+file.match(/\d/)[0], async (host) => {
  const d = (await data(file))[key];
  const wt = d.wt || d.whole_tissue;
  const tma = d.tma;
  host.innerHTML = ''; host.style.display = 'grid'; host.style.gridTemplateColumns = tma && host.clientWidth >= 340 ? '1fr 1fr' : '1fr'; host.style.gap = '16px';
  const a = el('div'), b = el('div'); host.append(a, b);
  const nG = wt.groups.length;
  const cols = nG === 3 ? [STATE.SecA, STATE.Intermediate, STATE.SecB] : /Res|resident/i.test(wt.groups[0]) ? ['#8FBC8F', '#2E6B4F'] : [STATE.SecA, STATE.SecB];
  const digits = /mm²/.test(unit) ? 0 : 1;
  C.paired(a, { groups: wt.groups.map((s) => s.replace('Intermediate', 'Int.').replace(' niche', '').replace('Resident-high', 'Resident').replace('Hypoxic-high', 'Hypoxic')), colors: cols, units: wt.units, ylabel: unit, stat: `${wt.units.length} tumours\n${pstr(wt.stat?.p)}`, aspect: 1, digits, margin: { left: 50, right: 8, top: 36, bottom: 32 } });
  if (tma) {
    const vals = (i) => tma.units.map((u) => u.values[i]).filter(Number.isFinite);
    const groupsT = tma.groups || [wt.groups[0], wt.groups[nG - 1]];
    const boxes = tma.box ? Object.values(tma.box) : null;
    C.boxpts(b, { groups: groupsT.map((g, i) => ({ label: g.replace(' niche', '').replace('Resident-high', 'Resident').replace('Hypoxic-high', 'Hypoxic'), color: cols[i === 0 ? 0 : cols.length - 1], ...(boxes ? { box: boxes[i], n: tma.n } : { values: vals(i) }) })), ylabel: '', stat: `${tma.n} TMA patients\n${pstr(tma.stat?.p)}`, aspect: 1, digits, margin: { left: 40, right: 8, top: 36, bottom: 32 } });
  }
});
export const forestPair = (k1, k2) => async (host) => {
  host.innerHTML = ''; host.style.display = 'grid'; host.style.gridTemplateColumns = 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))'; host.style.gap = '8px 24px';
  for (const k of [k1, k2]) { const c = el('div'); host.appendChild(c); await P.forestPanel(c, { key: k }); }
};
export const composition4a = guard(4, async (host) => {
  const a = (await data('fig4')).a;
  const units = a.units, types = a.categories;
  const typeCol = { FTE: '#0E8F84', WT: '#475569', TMA: '#CBD5E1' };
  host.innerHTML = '';
  const c = el('div'); host.appendChild(c);
  const render = () => {
    const w = c.clientWidth || 900, dh = 50, h = C.cardHeight(host, 300), m = { l: 44, r: 8, t: 4, b: 18 };
    c.innerHTML = ''; c.classList.add('chart');
    const svg = d3.select(c).append('svg').attr('width', w).attr('height', h + dh);
    const iw = w - m.l - m.r, ih = h - m.t - m.b - 14;
    const x = (i) => (i / units.length) * iw, bw = iw / units.length;
    // dendrogram
    const gd = svg.append('g').attr('transform', `translate(${m.l},2)`);
    const hmax = d3.max(a.dendrogram.links, (l) => l[4]) || 1;
    const yy = (hh) => dh - 4 - (hh / hmax) * (dh - 8);
    for (const [xl, xr, hl, hr, ht] of a.dendrogram.links) {
      gd.append('path').attr('d', `M${x(xl + 0.5)},${yy(hl)}V${yy(ht)}H${x(xr + 0.5)}V${yy(hr)}`).attr('fill', 'none').attr('stroke', '#94A3B8').attr('stroke-width', 0.7);
    }
    const g = svg.append('g').attr('transform', `translate(${m.l},${dh + m.t})`);
    const y = d3.scaleLinear().domain([0, 100]).range([ih, 0]);
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(4).tickFormat((v) => v + '%').tickSize(0).tickPadding(6)).select('.domain').remove();
    units.forEach((u, i) => {
      let acc = 0;
      const tot = d3.sum(u.comp) || 100;
      types.forEach((t, k) => {
        const v = (100 * u.comp[k]) / tot; if (!v) return;
        g.append('rect').attr('x', x(i)).attr('width', bw + 0.4).attr('y', y(acc + v)).attr('height', y(acc) - y(acc + v)).attr('fill', CELLTYPE[t] || '#94A3B8');
        acc += v;
      });
      g.append('rect').attr('x', x(i)).attr('width', bw + 0.4).attr('y', ih + 5).attr('height', 9).attr('fill', typeCol[u.type] || '#CBD5E1');
    });
    g.append('rect').attr('width', iw).attr('height', ih + 14).attr('fill', 'transparent').on('pointermove', (e) => {
      const [px] = d3.pointer(e); const i = Math.min(units.length - 1, Math.max(0, Math.floor(px / bw))); const u = units[i];
      const tot = d3.sum(u.comp) || 100;
      tip().show(`<div class="tt-h">${u.id || ''} ${a.tissue_types[u.type].split(' (')[0]}</div>${types.map((t, k) => [t, (100 * u.comp[k]) / tot]).filter(([, v]) => v > 3).sort((p, q) => q[1] - p[1]).map(([t, v]) => row(`<span class="chip" style="--c:${CELLTYPE[t]}">${t.replace(' epithelium', '')}</span>`, `${v.toFixed(0)}%`)).join('')}`, e.clientX, e.clientY);
    }).on('pointerleave', () => tip().hide());
  };
  render(); new ResizeObserver(render).observe(c);
  host.insertAdjacentHTML('beforeend', `<div class="legend-row">${types.map((t) => `<span class="chip" style="--c:${CELLTYPE[t] || '#94A3B8'}">${t.replace(' epithelium', '').replace('Conventional dendritic cell', 'cDC').replace('Plasmacytoid dendritic cell', 'pDC')}</span>`).join('')}</div><div class="legend-row" style="border:0;padding-top:0">${Object.entries(a.tissue_types).map(([k, v]) => `<span class="chip" style="--c:${typeCol[k]}">${v}</span>`).join('')}</div>`);
});
export const tmaCore = guard(5, async (host) => {
  const { ctl, v, key } = viewerHost(host, 0.6);
  const pts = await loadPoints('data/tissue/TMA-P003.json');
  const F = pts.field, cats = F.celltype.categories;
  const colors = Object.fromEntries(cats.map((c) => [c, CELLTYPE[c] || '#94A3B8']));
  const pv = new PointViewer(v, pts, { cellUm: 9, wheel: 'modifier', onHover: (i) => `<div class="tt-h">${cats[pts.cols.celltype[i]]}</div>${F.hypoxia ? row('Hypoxia', decode(F.hypoxia, pts.cols.hypoxia[i]).toFixed(3)) : ''}` });
  pv.setSegmentation('data/tissue/TMA-P003_seg/index.json').catch(() => {});
  const opts = [['all', 'Cell types'], ['hypoxia', 'Hypoxia'], ['SecB epithelium', 'SecB'], ['Macrophage', 'Macrophages'], ['T cell', 'T cells'], ['B cell', 'B cells'], ['Plasma cell', 'Plasma cells']].filter(([k]) => k === 'all' || k === 'hypoxia' ? (k !== 'hypoxia' || F.hypoxia) : cats.includes(k));
  const set = (k) => {
    if (k === 'all') { pv.setColor({ type: 'cat', field: 'celltype', colors }); chips(key, cats.map((c) => [c.replace(' epithelium', ''), colors[c]])); }
    else if (k === 'hypoxia') { pv.setColor({ type: 'cont', field: 'hypoxia', map: 'rocket' }); colorbar(key, { title: 'Hypoxia (UCell)', map: 'rocket', lo: F.hypoxia.range[0].toFixed(2), hi: F.hypoxia.range[1].toFixed(2) }); }
    else { pv.setColor({ type: 'cat', field: 'celltype', colors, show: new Set([k]), grey: '#E3E7EC' }); chips(key, [[k, colors[k]]]); }
  };
  seg(ctl, opts, 'all', set); set('all');
});
export const visium = guard(6, async (host) => {
  const { ctl, v, key } = viewerHost(host, 0.82);
  const pts = await loadPoints('data/visiumhd_WT01.json');
  const F = pts.field, cats = F.class.categories;
  const colors = { 'SecA-high epithelium': STATE.SecA, 'SecB-high epithelium': STATE.SecB, 'Other epithelium': '#F1E6D6', 'SecB-niche macrophage': '#2E6B4F', 'Other macrophage': '#A9CFA9', Other: '#ECEFF3' };
  const pv = new PointViewer(v, pts, { cellUm: 16, square: true, wheel: 'modifier', onHover: (i) => `<div class="tt-h">${cats[pts.cols.class[i]]}</div>${row('Polarization', decode(F.polarization, pts.cols.polarization[i]).toFixed(2))}${row('<i>CA9</i>', decode(F.CA9, pts.cols.CA9[i]).toFixed(2))}` });
  const roi = pts.meta.roi; const rb = roi && [roi.x0, roi.y0, roi.x1, roi.y1];
  const set = (k) => {
    if (k === 'class') { pv.setColor({ type: 'cat', field: 'class', colors, show: new Set(['SecA-high epithelium', 'SecB-high epithelium', 'Other epithelium']) }); chips(key, [['SecA-high', STATE.SecA], ['SecB-high', STATE.SecB], ['Other epithelium', '#F1E6D6']]); }
    else if (k === 'mac') { pv.setColor({ type: 'cat', field: 'class', colors, show: new Set(['SecB-niche macrophage', 'Other macrophage', 'SecB-high epithelium']) }); chips(key, [['Macrophage, SecB niche', '#2E6B4F'], ['Macrophage, other', '#A9CFA9'], ['SecB-high epithelium', STATE.SecB]]); }
    else { pv.setColor({ type: 'cont', field: 'CA9', map: 'rocket', zeroGrey: true, grey: '#F1F3F6' }); colorbar(key, { title: '<i>CA9</i> (log1p CP10k, 3 × 3-bin mean)', map: 'rocket', lo: '0', hi: F.CA9.range[1].toFixed(2) }); }
  };
  seg(ctl, [['class', 'SecA / SecB bins (a, b)'], ['ca9', '<i>CA9</i> (c)'], ['mac', 'Macrophages (d)']], 'class', set);
  if (rb) { const b = el('button', { class: 'btn line', type: 'button', style: 'padding:8px 12px' }, 'Zoom to region'); b.onclick = () => pv.fit(rb, 1200); ctl.appendChild(b); const r = el('button', { class: 'btn line', type: 'button', style: 'padding:8px 12px' }, 'Whole section'); r.onclick = () => pv.fit(pv.home, 900); ctl.appendChild(r); }
  set('class');
});
export const dot6f = guard(6, async (host) => {
  const f = (await data('fig6_visium')).f;
  const genes = f.genes, rows = f.rows, xr = f.xenium_row;
  const c = el('div', { style: 'overflow-x:auto' }); host.innerHTML = ''; host.appendChild(c);
  const render = () => {
    const w = Math.max(c.clientWidth || 520, 120 + genes.length * 24), cell = Math.min(34, (w - 120) / genes.length), m = { l: 110, t: 8, b: 64 };
    const h = (rows.length + 1) * cell + 14;
    c.innerHTML = ''; c.classList.add('chart');
    const svg = d3.select(c).append('svg').attr('width', w).attr('height', h + m.t + m.b);
    const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);
    const seq = d3.scaleSequential(d3.interpolateRgbBasis(['#F4F7FB', '#C9D6E8', '#8FA6C8', '#5574A3', '#2D4A7A', '#16213A'])).domain([0, 1]);
    const div = d3.scaleLinear().domain([-1.5, 0, 1.5]).range(['#244877', '#F7F6F5', '#9C3409']).clamp(true);
    rows.forEach((r, i) => {
      const y = i * cell + cell / 2;
      g.append('text').attr('x', -10).attr('y', y).attr('dy', '0.32em').attr('text-anchor', 'end').attr('class', 'lab').style('font-weight', r.highlight ? 600 : 400).style('fill', r.highlight ? STATE.SecB : '#334155').text(r.label);
      r.values.forEach((v, j) => {
        g.append('circle').attr('cx', j * cell + cell / 2).attr('cy', y).attr('r', Math.max(1, Math.sqrt(v.pct / 100) * (cell / 2 - 1))).attr('fill', seq(v.scaled))
          .on('pointermove', (e) => tip().show(`<div class="tt-h"><i>${v.gene}</i> · ${r.label}</div>${row('Mean (log1p CP10k)', v.mean.toFixed(2))}${row('% expressing', v.pct.toFixed(0) + '%')}${row('Cells', fmt.int(r.n_cells))}`, e.clientX, e.clientY)).on('pointerleave', () => tip().hide());
      });
    });
    const y = rows.length * cell + 14 + cell / 2;
    g.append('line').attr('x1', -100).attr('x2', genes.length * cell).attr('y1', y - cell / 2 - 7).attr('y2', y - cell / 2 - 7).attr('stroke', '#CBD5E1');
    g.append('text').attr('x', -10).attr('y', y).attr('dy', '0.32em').attr('text-anchor', 'end').attr('class', 'lab').text('Xenium niche');
    xr.values.forEach((v, j) => {
      if (!v.available) { g.append('text').attr('x', j * cell + cell / 2).attr('y', y).attr('dy', '0.32em').attr('text-anchor', 'middle').attr('class', 'stat').text('–'); return; }
      g.append('circle').attr('cx', j * cell + cell / 2).attr('cy', y).attr('r', (cell / 2 - 2) * Math.sqrt(0.2 + 0.8 * v.frac_sections_agree)).attr('fill', div(v.log2fc)).attr('stroke', v.p_lt_005 ? '#334155' : 'none').attr('stroke-width', 1.2)
        .on('pointermove', (e) => tip().show(`<div class="tt-h"><i>${v.gene}</i> · Xenium SecB niche vs control</div>${row('log₂ fold change', (v.log2fc_clipped ? '≥ ' : '') + v.log2fc.toFixed(2))}${row('Sections agreeing', `${v.n_sections_agree_of_8} of 8`)}${row('p < 0.05', v.p_lt_005 ? 'yes' : 'no')}`, e.clientX, e.clientY)).on('pointerleave', () => tip().hide());
    });
    genes.forEach((gn, j) => g.append('text').attr('transform', `translate(${j * cell + cell / 2},${y + cell / 2 + 6}) rotate(-45)`).attr('text-anchor', 'end').attr('class', 'lab').style('font-style', 'italic').style('font-weight', 400).text(gn));
  };
  render(); new ResizeObserver(render).observe(c);
  host.insertAdjacentHTML('beforeend', `<div class="legend-row"><span class="meta">Atlas rows: colour = scaled mean expression (light → dark), size = % expressing. Xenium row: colour = log₂ fold change (blue down, rust up), size = sections agreeing, outline = p < 0.05.</span></div>`);
});
export const roi6i = guard(6, async (host) => {
  const R = await data('tissue/WT02_roi6i');
  const { x0, y0, x1, y1 } = R.roi;
  const cells = R.cells, n = cells.poly.length, cats = R.categories;
  const ramp = window.d3.interpolateRgbBasis(['#FAEBDD', '#F6B48F', '#F37651', '#C8264B', '#7B1A51', '#35193E']);
  host.innerHTML = '';
  host.style.display = 'grid'; host.style.gridTemplateColumns = host.clientWidth < 620 ? '1fr' : 'minmax(0, 2fr) minmax(0, 3fr)'; host.style.gap = '20px';
  const big = el('div'), grid = el('div', { style: 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 10px;align-content:start' });
  host.append(big, grid);
  const draw = (cv, colorOf) => {
    const size = cv.clientWidth, d = Math.min(2, devicePixelRatio || 1);
    cv.width = cv.height = Math.round(size * d);
    const g = cv.getContext('2d'), k = (size * d) / (x1 - x0);
    g.setTransform(k, 0, 0, -k, -x0 * k, y1 * k);           // printed orientation: y up
    g.lineWidth = 0.5; g.strokeStyle = '#fff';
    for (let i = 0; i < n; i++) {
      const v = cells.poly[i]; g.beginPath(); g.moveTo(v[0], v[1]);
      for (let j = 2; j < v.length; j += 2) g.lineTo(v[j], v[j + 1]);
      g.closePath(); g.fillStyle = colorOf(i); g.fill(); g.stroke();
    }
  };
  const mk = (parent, title) => {
    const w = el('div'); w.innerHTML = `<div style="font:500 12.5px/1.3 var(--font-body);color:var(--navy-700);margin-bottom:4px">${title}</div>`;
    const cv = el('canvas', { style: 'width:100%;aspect-ratio:1;border-radius:8px;background:#fff;border:1px solid var(--border)' });
    w.appendChild(cv); parent.appendChild(w); return cv;
  };
  const ctCanvas = mk(big, 'Cell types (700 µm)');
  const ctLegend = (`<div class="legend-row" style="flex:1 1 420px;border:0;padding:0;margin:0">${[...new Set(cells.celltype)].sort((a, b) => a - b).map((c) => `<span class="chip" style="--c:${CELLTYPE[cats[c]] || '#94A3B8'}">${cats[c].replace(' epithelium', '').replace('Conventional dendritic cell', 'cDC').replace('Plasmacytoid dendritic cell', 'pDC')}</span>`).join('')}</div>`);
  const geneCanvases = [];
  for (const [label, test] of [['In macrophages', (gn) => R.focal_celltypes[gn].length === 1], ['In epithelium', (gn) => R.focal_celltypes[gn].length > 1]]) {
    grid.insertAdjacentHTML('beforeend', `<div style="grid-column:1/-1;font:600 13px/1.2 var(--font-display);color:var(--navy-700);margin-top:4px">${label}</div>`);
    for (const gname of R.genes.filter(test)) geneCanvases.push([gname, mk(grid, `<i>${gname}</i>${gname === 'SLC16A3' ? ' (MCT-4)' : ''}`)]);
  }
  const render = () => {
    draw(ctCanvas, (i) => CELLTYPE[cats[cells.celltype[i]]] || '#94A3B8');
    for (const [gname, cv] of geneCanvases) {
      const focal = new Set(R.focal_celltypes[gname].map((c) => cats.indexOf(c)));
      const [lo, hi] = R.figure_ranges[gname], vals = cells[gname];
      draw(cv, (i) => (focal.has(cells.celltype[i]) ? ramp(Math.max(0, Math.min(1, (vals[i] - lo) / (hi - lo)))) : '#E9ECF0'));
    }
  };
  render(); new ResizeObserver(() => { clearTimeout(host._t); host._t = setTimeout(render, 150); }).observe(host);
  // one legend row beneath both columns: cell types, then the expression scale
  host.insertAdjacentHTML('beforeend', `<div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:12px 28px;align-items:flex-end;border-top:1px solid var(--border);padding-top:10px">${ctLegend}<div class="colorbar" style="width:220px"><div class="t">Expression in focal cells (log1p CP10k, 2nd–98th percentile)</div><div class="bar" style="background:linear-gradient(90deg,#FAEBDD,#F6B48F,#F37651,#C8264B,#7B1A51,#35193E)"></div><div class="ends"><span>low</span><span>high</span></div></div></div>`);
});

// ------------------------------------------------------------------ Figures S16–S18: per-tumour curves
const WT_COLORS = ['#C2410C', '#4870A5', '#E0BC69', '#4F9B9A', '#75525F', '#8FB4CF', '#758B6A', '#222A51'];   // Lab muted 8
export const perTumour = (fig) => guard(+(fig === 'S16' ? 4 : 5), async (host) => {
  const S = (await data('figS16_18'))[fig];
  host.innerHTML = '';
  const ctl = el('div', { class: 'controls' }), chart = el('div'), foot = el('div');
  host.append(ctl, chart, foot);
  const sel = el('select', { class: 'gene-select', 'aria-label': 'Feature' });
  sel.innerHTML = S.panels.map((p, i) => `<option value="${i}">${p.letter} · ${p.feature}</option>`).join('');
  ctl.insertAdjacentHTML('beforeend', '<label>Feature</label>'); ctl.appendChild(sel);
  const draw = () => {
    const p = S.panels[+sel.value];
    const series = p.per_tissue.map((t, k) => ({ label: t.id, color: WT_COLORS[+t.id.slice(2) - 1] || WT_COLORS[k], x: t.x, y: t.y, w: 1.6, dash: /chemo/i.test(t.treatment) ? '5 4' : null }));
    series.push({ label: 'All tumours', color: '#475569', ...p.pooled, w: 3.4, bandOpacity: 0.16 });
    chart.innerHTML = '';
    const c = el('div'); chart.appendChild(c);
    C.lines(c, { series, x: { label: S.x_label, short: 'Polarization', ticks: 5 }, y: { label: S.y_label, ticks: 5 }, refY: 0, aspect: 0.5, labels: 'none', margin: { right: 16 }, yFromAll: true });
    const st = p.stat || {};
    foot.innerHTML = `<div class="legend-row">${p.per_tissue.map((t) => `<span class="chip" style="--c:${WT_COLORS[+t.id.slice(2) - 1]}">${t.id}${/chemo/i.test(t.treatment) ? ' (post-chemo, dashed)' : ''}</span>`).join('')}<span class="chip" style="--c:#475569">All tumours, thick line (band: 95% CI)</span></div>
      <p class="panel-foot">${st.n_tissues_same_direction_as_pooled != null ? `${st.n_tissues_same_direction_as_pooled} of ${p.per_tissue.length} tumours ${st.direction === 'fall' ? 'fall' : 'rise'} with the pooled curve; ` : ''}top vs bottom 20% of polarization within each tumour, paired Wilcoxon ${st.p != null ? (typeof st.p === 'number' ? fmt.p(st.p) : pstr(st.p)) : ''}. Curves span the 1st–99th percentile of polarization.</p>`;
  };
  sel.onchange = draw;
  draw();
});


// ------------------------------------------------------------------ Figure 1k: epithelial states per study
export const studyStates = guard(1, async (host) => {
  const k = (await data('fig1')).k;
  const keys = ['SecA', 'Intermediate', 'SecB', 'Ciliated'];
  const rows = k.studies.map((st, i) => ({ label: st, values: Object.fromEntries(keys.map((q) => [q, k.percent[q][i]])) }));
  host.innerHTML = '';
  const c = el('div'); host.appendChild(c);
  C.stack100(c, { rows, keys, colors: STATE, orient: 'h', labelW: 130, barH: 18, minLabel: 0.16, pad: 0.2 });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row">${keys.map((q) => `<span class="chip" style="--c:${STATE[q]}">${q}</span>`).join('')}</div>`);
});

// ------------------------------------------------------------------ Figure 2a: one small dumbbell plot per method
export const programsGrid = guard(2, async (host) => {
  const a = (await data('fig2')).a;
  host.innerHTML = '';
  // four, two or one per row, never three plus an orphan
  const cols = host.clientWidth >= 1000 ? 4 : host.clientWidth >= 500 ? 2 : 1;
  host.style.display = 'grid'; host.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`; host.style.gap = '8px 20px';
  for (const r of a.radars) {
    const box = el('div'); host.appendChild(box);
    box.innerHTML = `<div style="font:600 13px/1.3 var(--font-display);color:var(--navy-700);margin-bottom:2px">${r.description.replace(/^\w/, (x) => x.toUpperCase())}</div>`;
    const c = el('div'); box.appendChild(c);
    const rows = r.axes.map((ax, i) => ({ label: ax, a: r.SecA[i], b: r.SecB[i] }));
    C.dumbbell(c, { rows, aLabel: 'SecA', bLabel: 'SecB', aColor: STATE.SecA, bColor: STATE.SecB, xlabel: 'z', labelW: 132, domain: [-2, 2], height: rows.length * 26 + 56 });
  }
});

// ------------------------------------------------------------------ Figure 5e,g,h: a TMA core drawn as segmented cells
async function loadSeg(name) {
  const idx = await data(`tissue/${name}_seg/index`);
  const tiles = await Promise.all(idx.tiles.map(async (t) => {
    const buf = await (await fetch(asset(`data/tissue/${name}_seg/${t.file}`))).arrayBuffer();
    const n = t.n, pad = idx.pad_um, span = idx.tile_um + 2 * pad;
    const id = new Uint32Array(buf, 0, n), nverts = new Uint8Array(buf, 4 * n, n), q = new Uint16Array(buf, 4 * n + Math.ceil(n / 4) * 4, 2 * t.nv);
    const cells = []; let o = 0;
    for (let c = 0; c < n; c++) {
      const v = new Float32Array(2 * nverts[c]);
      for (let j = 0; j < 2 * nverts[c]; j += 2) { v[j] = t.x0 - pad + (q[o + j] / 65535) * span; v[j + 1] = t.y0 - pad + (q[o + j + 1] / 65535) * span; }
      cells.push({ i: id[c], v }); o += 2 * nverts[c];
    }
    return cells;
  }));
  return tiles.flat();
}
export const tmaCoreMaps = guard(5, async (host) => {
  const [pts, cells, rois] = await Promise.all([loadPoints('data/tissue/TMA-P003.json'), loadSeg('TMA-P003'), data('tissue/TMA-P003_rois')]);
  const F = pts.field, cats = F.celltype.categories, ct = pts.cols.celltype;
  const box = rois.rois.find((r) => r.id === 'fig5g');
  const [x0, y0, x1, y1] = pts.meta.bbox;
  const hyp = d3.interpolateRgbBasis(['#FAEBDD', '#F6B48F', '#F37651', '#C8264B', '#7B1A51', '#35193E']);
  const hq = pts.cols.hypoxia, lo = 0.48, hi = 0.84;
  const hv = (i) => decode(F.hypoxia, hq[i]);
  const highlights = ['SecB epithelium', 'Macrophage', 'T cell', 'NK cell', 'B cell', 'Plasma cell'];
  const counts = Object.fromEntries(highlights.map((h) => [h, 0]));
  for (let i = 0; i < pts.n; i++) { const c = cats[ct[i]]; if (c in counts) counts[c]++; }
  host.innerHTML = `<div class="core-grid"><div class="core-main"><div class="mini-h">Cell types</div><canvas data-m="ct"></canvas></div>
    <div class="core-main"><div class="mini-h">Hypoxia (UCell)</div><canvas data-m="hyp"></canvas></div>
    <div class="core-minis">${highlights.map((h) => `<div><div class="mini-h" style="color:${CELLTYPE[h]}">${h.replace(' epithelium', '')} <span>(${counts[h]})</span></div><canvas data-m="${h}"></canvas></div>`).join('')}</div></div>
    <div class="legend-row">${cats.filter((c) => [...ct].some((q) => cats[q] === c)).map((c) => `<span class="chip" style="--c:${CELLTYPE[c]}">${c.replace(' epithelium', '').replace('Conventional dendritic cell', 'cDC').replace('Plasmacytoid dendritic cell', 'pDC')}</span>`).join('')}
    <span class="colorbar" style="width:150px;display:inline-grid"><span class="bar" style="background:linear-gradient(90deg,#FAEBDD,#F6B48F,#F37651,#C8264B,#7B1A51,#35193E)"></span><span class="ends"><span>hypoxia ${lo}</span><span>${hi}</span></span></span></div>`;
  const colorFor = (mode, i) => {
    const c = cats[ct[i]];
    if (mode === 'ct') return CELLTYPE[c] || '#94A3B8';
    if (mode === 'hyp') return hyp(Math.max(0, Math.min(1, (hv(i) - lo) / (hi - lo))));
    return c === mode ? CELLTYPE[c] : '#E3E7EC';
  };
  const draw = () => {
    for (const cv of host.querySelectorAll('canvas')) {
      const w = cv.clientWidth, d = Math.min(2, devicePixelRatio || 1);
      if (!w) continue;
      const k = w / (x1 - x0), h = Math.round((y1 - y0) * k);
      cv.style.height = h + 'px'; cv.width = Math.round(w * d); cv.height = Math.round(h * d);
      const g = cv.getContext('2d');
      g.setTransform(k * d, 0, 0, k * d, -x0 * k * d, -y0 * k * d);
      g.lineWidth = Math.max(0.4, 0.9 / k); g.strokeStyle = '#fff'; g.lineJoin = 'round';
      const mode = cv.dataset.m;
      for (const c of cells) {
        const v = c.v; g.beginPath(); g.moveTo(v[0], v[1]);
        for (let j = 2; j < v.length; j += 2) g.lineTo(v[j], v[j + 1]);
        g.closePath(); g.fillStyle = colorFor(mode, c.i); g.fill(); if (w > 160) g.stroke();
      }
      if (box && mode !== 'ct') { g.setLineDash([6 / k, 4 / k]); g.lineWidth = 1.4 / k; g.strokeStyle = '#334155'; g.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0); g.setLineDash([]); }
    }
  };
  draw();
  let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(draw, 120); }).observe(host);
});
