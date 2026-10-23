// Figure panels, redrawn for the web from the exported study data. Each builder takes a container
// and renders one panel; a missing or mismatched data file shows a placeholder with the journal figure.
import { getJSON, STATE, ARM, CELLTYPE, row, tip, fmt, el, seg, reduced, asset } from './core.js?v=b5261aa92c';
import * as C from './charts.js?v=b5261aa92c';

const d3 = window.d3;
let openFigure = () => {};
export function setFigureOpener(fn) { openFigure = fn; }

function placeholder(host, fig, why) {
  host.innerHTML = `<div class="placeholder"><div><img src="${asset(`assets/img/fig/fig${fig}_thumb.jpg`)}" alt=""><div>This panel is being redrawn from the study data.</div><button class="btn line" type="button" style="margin-top:10px">View journal Figure ${fig}</button></div></div>`;
  host.querySelector('button').onclick = () => openFigure([String(fig)]);
  if (why) console.info(`panel placeholder (Figure ${fig}):`, why);
}
const pick = (o, ...keys) => { for (const k of keys) if (o && o[k] != null) return o[k]; return undefined; };
const stateColor = (s) => STATE[s] || STATE[String(s).replace(/ epithelium$/, '')] || CELLTYPE[s] || '#94A3B8';
const curve = (c) => ({ x: c.x, y: c.y, lo: c.lo, hi: c.hi });
export const pstr = (p) => (p == null ? '' : typeof p === 'number' ? fmt.p(p) : `p ${p.op === '<' ? '<' : '='} ${p.value < 0.001 ? (p.value < 1e-4 ? '0.0001' : p.value) : p.value}`);

async function data(name) { return getJSON(`data/${name}.json`); }
function guard(fig, fn) {
  return async (host, opt) => {
    try { await fn(host, opt || {}); } catch (e) { placeholder(host, fig, e); }
  };
}

// ================================================================== Figure 1
export const pcRank = guard(1, async (host) => {
  const f = (await data('fig1')).g;
  const units = [];
  const cols = { 1: STATE.SecB, 2: STATE.Intermediate, 3: STATE.SecA };
  f.rank.forEach((rank, i) => {
    const n = f.tumours[i];
    for (let k = 0; k < n; k++) units.push({ color: cols[rank] || '#CBD5E1', label: `<div class="tt-h">PC${rank}${rank >= 10 ? ' or later' : ''}</div>${n} samples` });
  });
  host.innerHTML = '';
  const u = el('div'); host.appendChild(u);
  C.units(u, { units, size: 11 });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row"><span class="chip" style="--c:${STATE.SecB}">PC1 · ${f.pc1_pct}%</span><span class="chip" style="--c:${STATE.Intermediate}">PC2</span><span class="chip" style="--c:${STATE.SecA}">PC3 (PC1–3 · ${f.pc1to3_pct}%)</span><span class="chip" style="--c:#CBD5E1">PC4 or later</span></div>`);
});

export const clones = guard(1, async (host) => {
  const f = (await data('fig1')).l;
  const rows = f.clones.map((c) => ({ label: `${c.patient.replace('Patient ', '')} · ${c.clone}`, values: c.percent, n: c.n }));
  C.stack100(host, { rows, keys: ['SecA', 'Intermediate', 'SecB'], colors: STATE, orient: 'h', labelW: 84, barH: 24 });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row"><span class="chip" style="--c:${STATE.SecA}">SecA</span><span class="chip" style="--c:${STATE.Intermediate}">Intermediate</span><span class="chip" style="--c:${STATE.SecB}">SecB</span><span class="meta">Patients A–C; % of secretory cells per clone</span></div>`);
});

// ================================================================== Figure 2
export const programs = guard(2, async (host, opt) => {
  const a = (await data('fig2')).a;
  const rows = [];
  for (const r of a.radars) {
    let idx = r.axes.map((_, i) => i);
    if (opt.top) idx = idx.sort((i, j) => Math.abs(r.SecB[j] - r.SecA[j]) - Math.abs(r.SecB[i] - r.SecA[i])).slice(0, opt.top).sort((i, j) => r.SecB[i] - r.SecA[i] - (r.SecB[j] - r.SecA[j]));
    for (const i of idx) rows.push({ group: r.description.replace(/^\w/, (c) => c.toUpperCase()), label: r.axes[i], a: r.SecA[i], b: r.SecB[i] });
  }
  C.dumbbell(host, { rows, aLabel: 'SecA', bLabel: 'SecB', aColor: STATE.SecA, bColor: STATE.SecB, xlabel: 'Scaled activity (z)', labelW: 200 });
});

export const cellcycle = guard(2, async (host) => {
  const b = (await data('fig2')).b;
  const rows = b.states.map((st) => ({ label: st, values: b.percent[st], n: b.n_cells[st] }));
  C.stack100(host, { rows, keys: ['G1', 'S', 'G2M'], colors: { G1: '#E2E8F0', S: '#94A3B8', G2M: '#475569' }, orient: 'h', labelW: 56, barH: 34, pad: 0.35 });
  host.insertAdjacentHTML('beforeend', '<div class="legend-row"><span class="chip" style="--c:#E2E8F0">G1</span><span class="chip" style="--c:#94A3B8">S</span><span class="chip" style="--c:#475569">G2/M</span></div>');
});

export const siteStack = guard(2, async (host, opt) => {
  const c = (await data('fig2')).c;
  const names = { Prim: 'Primary', Asc: 'Ascites', Met: 'Metastasis', Pre: 'Pre-chemo', 'Post-chemo': 'Post-chemo' };
  const bars = opt.all ? c.bars : c.bars.filter((b) => /na/i.test(b.group));
  const rows = bars.map((b) => ({ label: opt.all ? `${names[b.label] || b.label}` : names[b.label] || b.label, values: b.percent, n: `${b.n.samples} samples, ${b.n.patients} patients` }));
  C.stack100(host, { rows, keys: ['SecA', 'Intermediate', 'SecB', 'Ciliated'], colors: STATE, aspect: opt.all ? 0.6 : 0.95, pad: 0.3 });
});

export const siteMatched = guard(2, async (host) => {
  const d = (await data('fig2')).d;
  const st = d.stat.find((x) => x.a === 'Primary' && x.b === 'Ascites');
  C.paired(host, { groups: d.x_labels, colors: [STATE.SecB, STATE.SecB, STATE.SecB], units: d.units.map((u) => ({ id: `Patient ${u.id}`, values: u.values })), ylabel: 'SecB, % of epithelium', medians: true, ydomain: [0, 100], aspect: 1.05, digits: 0, stat: st ? `Prim vs Asc ${fmt.p(st.p)}` : null });
});

export const treatMatched = guard(2, async (host) => {
  const e = (await data('fig2')).e;
  C.paired(host, { groups: e.groups, colors: [STATE.SecB, STATE.SecB], units: e.units.map((u) => ({ id: `Patient ${u.id}`, values: u.values })), ylabel: 'SecB, % of epithelium', medians: true, ydomain: [0, 100], aspect: 1.05, stat: `${e.n_increased} of ${e.n} rose · ${fmt.p(e.stat.p)}`, digits: 0 });
});

export const subtypes = guard(2, async (host) => {
  const f = (await data('fig2')).f;
  C.groupedBox(host, { categories: f.groups.map((s) => ({ label: s.subtype, short: s.subtype.slice(0, 4) + '.', n: s.n, groups: [{ label: 'SecA', color: STATE.SecA, values: s.SecA }, { label: 'SecB', color: STATE.SecB, values: s.SecB }] })), ylabel: '% of epithelium per sample', ydomain: [0, 100], aspect: 0.9 });
});

export const volcano2g = guard(2, async (host, opt) => {
  const g = (await data('fig2')).g;
  const cap = g.display.neg_log10_padj_cap, thrY = -Math.log10(g.thresholds.padj), thrX = g.thresholds.log2fc;
  const genes = [];
  g.genes.forEach((name, i) => {
    const p = g.padj[i], x = g.log2fc[i];
    if (p == null || !Number.isFinite(x)) return;
    const y = -Math.log10(Math.max(p, 1e-300));
    genes.push({ g: name, x: Math.max(-5.9, Math.min(5.9, x)), y, cls: y < thrY || Math.abs(x) < thrX ? 'ns' : x > 0 ? 'up' : 'down' });
  });
  const ctl = el('div', { class: 'controls' }, '<label>Find a gene</label>');
  const inp = el('input', { class: 'gene-input', placeholder: 'e.g. VEGFA', autocomplete: 'off', 'aria-label': 'Find a gene' });
  ctl.appendChild(inp); host.innerHTML = ''; host.appendChild(ctl);
  const c = el('div'); host.appendChild(c);
  C.volcano(c, { genes, colors: { up: STATE.SecB, down: STATE.SecA, ns: '#D5DBE3' }, highlight: [...g.signature.SecA, ...g.signature.SecB], xlabel: 'log₂ fold change (SecA ← → SecB)', ylabel: '−log₁₀ adj. p', ycap: cap, searchInput: inp, aspect: 0.8, xdomain: [-6, 6] });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row"><span class="chip" style="--c:${STATE.SecA}">Higher in SecA (${fmt.int(g.n_de.SecA)})</span><span class="chip" style="--c:${STATE.SecB}">Higher in SecB (${fmt.int(g.n_de.SecB)})</span><span class="meta">adj. p < 0.05, |log₂FC| > 0.5; capped at ${cap}</span></div>`);
});

// ================================================================== Figure 3
export const pdo = guard(3, async (host, opt) => {
  const b = (await data('fig3')).b;
  C.violins(host, {
    groups: b.groups.map((gr) => ({ label: gr.label, color: gr.origin === 'Ascites' ? '#3B689E' : '#A6D6ED', q: gr.q, kde: gr.kde, n: gr.n, extra: row('Origin', gr.origin) })),
    refs: b.ref_lines.map((r) => ({ y: r.y, label: r.label.replace('Atlas ', 'Atlas '), color: /SecB/.test(r.label) ? STATE.SecB : STATE.Intermediate })),
    ylabel: b.y_label, ydomain: [0, 0.75], aspect: opt.aspect || 0.62, margin: { left: 52, right: 74, top: 14, bottom: 40 },
  });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row"><span class="chip" style="--c:#A6D6ED">From primary tumours</span><span class="chip" style="--c:#3B689E">From ascites</span><span class="meta">Ascites vs primary lines: ${fmt.p(b.stat.p)} (Mann–Whitney, 4 vs 4)</span></div>`);
});
export const opto = guard(3, async (host, opt) => {
  const f = await data('fig3');
  const p = f[opt.which || 'd'];
  C.violins(host, {
    groups: p.groups.map((gr) => ({ label: gr.label, color: gr.label === 'IFNγ' ? '#3B689E' : '#A6D6ED', q: gr.q, kde: gr.kde, n: gr.n })),
    refs: p.ref_lines.map((r) => ({ y: r.y, label: r.label, color: /SecB/.test(r.label) ? STATE.SecB : STATE.Intermediate })),
    ylabel: p.y_label, ydomain: [0, 0.75], aspect: opt.aspect || 0.7, margin: { left: 52, right: 74, top: 14, bottom: 40 },
  });
});
export const modelScatter = guard(3, async (host) => {
  const f = (await data('fig3')).f;
  const groups = [...new Set(f.points.map((p) => p.group))];
  const pal = { 'PDO ascites': '#3B689E', 'PDO primary': '#A6D6ED', 'PDO DepMap': '#6E5064', 'PDO physoxia': '#857157', 'PDO hypoxia': '#C2410C', Organoid: '#92A36F', Spheroid: '#314D33' };
  const c = el('div', { class: 'chart' }); host.innerHTML = ''; host.appendChild(c);
  const ref = f.atlas_reference_medians;
  // custom scatter: shaded SecB region, reference medians
  const render = () => {
    const width = c.clientWidth || 480, height = C.cardHeight(host, Math.round(width * 0.78)), m = { l: 56, r: 16, t: 16, b: 46 };
    c.innerHTML = '';
    const svg = d3.select(c).append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`); const w = width - m.l - m.r, h = height - m.t - m.b;
    const x = d3.scaleLinear().domain(f.x_lim).range([0, w]), y = d3.scaleLinear().domain(f.y_lim).range([h, 0]);
    g.append('rect').attr('x', x(f.region.x[0])).attr('y', y(f.y_lim[1])).attr('width', w - x(f.region.x[0])).attr('height', y(f.region.y[0]) - y(f.y_lim[1])).attr('fill', '#FDE2D1');
    // SecB thresholds as in the published panel: atlas SecB medians of both scores, dashed across the plot
    for (const r of f.ref_lines) {
      const ln = r.axis === 'x' ? g.append('line').attr('x1', x(r.value)).attr('x2', x(r.value)).attr('y1', 0).attr('y2', h)
        : g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(r.value)).attr('y2', y(r.value));
      ln.attr('stroke', STATE.SecB).attr('stroke-width', 1.2).attr('stroke-dasharray', '5 4').attr('opacity', 0.8);
      if (r.axis === 'x') g.append('text').attr('x', x(r.value) - 5).attr('y', h - 6).attr('text-anchor', 'end').attr('class', 'stat').style('fill', STATE.SecB).text(r.label);
      else g.append('text').attr('x', 5).attr('y', y(r.value) - 6).attr('class', 'stat').style('fill', STATE.SecB).text(r.label);
    }
    g.append('text').attr('x', w - 6).attr('y', y(f.y_lim[1]) + 14).attr('text-anchor', 'end').attr('class', 'stat').style('fill', STATE.SecB).text('SecB region');
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickSize(4).tickSizeOuter(0));
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(8)).select('.domain').remove();
    g.append('text').attr('class', 'axis-title').attr('x', w / 2).attr('y', h + 36).attr('text-anchor', 'middle').text('SecB marker score');
    g.append('text').attr('class', 'axis-title').attr('transform', `translate(-40,${h / 2}) rotate(-90)`).attr('text-anchor', 'middle').text('Function: HIF − proliferation (z)');
    // atlas reference medians, as diamonds with haloed labels
    for (const [k, lab, col, tcol] of [['SecA', 'SecA', STATE.SecA, '#B07418'], ['Intermediate', 'Int.', STATE.Intermediate, '#B8501C'], ['SecB', 'SecB', STATE.SecB, STATE.SecB]]) {
      const r = ref[k]; g.append('path').attr('d', d3.symbol(d3.symbolDiamond, 90)()).attr('transform', `translate(${x(r.secB_marker)},${y(r.function)})`).attr('fill', col).attr('stroke', '#fff').attr('stroke-width', 1.2);
      g.append('text').attr('x', x(r.secB_marker) - 9).attr('y', y(r.function)).attr('dy', '0.32em').attr('text-anchor', 'end').attr('class', 'stat')
        .style('fill', tcol).style('font-weight', 600).style('paint-order', 'stroke').attr('stroke', '#fff').attr('stroke-width', 3.5).attr('stroke-linejoin', 'round').text(lab);
    }
    g.selectAll(null).data(f.points).join('circle').attr('cx', (p) => x(p.secB_marker)).attr('cy', (p) => y(p.function)).attr('r', 5).attr('fill', (p) => pal[p.group] || '#94A3B8').attr('stroke', '#fff').attr('stroke-width', 1.4)
      .on('pointermove', (ev, p) => tip().show(`<div class="tt-h">${p.label || p.model || p.group}</div>${row('Dataset', p.dataset)}${row('Marker score', p.secB_marker.toFixed(2))}${row('HIF induction', p.hif?.toFixed(2) ?? '–')}${row('Quiescence', p.quiescence?.toFixed(2) ?? '–')}`, ev.clientX, ev.clientY))
      .on('pointerleave', () => tip().hide());
  };
  render(); new ResizeObserver(render).observe(c);
  host.insertAdjacentHTML('beforeend', `<div class="legend-row">${groups.map((gname) => `<span class="chip" style="--c:${pal[gname]}">${gname}</span>`).join('')}<span class="meta">◆ atlas pseudobulk medians; dashed: atlas SecB median of each score</span></div>`);
});

// ================================================================== Figure 4
export const gamEnv = guard(4, async (host) => {
  const f = (await data('fig4')).f;
  const cols = { 'Distance to vasculature': '#2D4A7A', Hypoxia: '#C8264B', 'Matrix remodeling': '#7B5BA6', 'Cell density': '#8FA6C8' };
  const series = Object.entries(f.curves).map(([label, c]) => ({ label, color: cols[label] || '#64748B', ...curve(c) }));
  const narrow = host.clientWidth < 460;
  const c = el('div'); host.innerHTML = ''; host.appendChild(c);
  C.lines(c, { series, x: { label: 'Focal cell polarization (SecA → SecB)', short: 'Polarization', ticks: narrow ? 3 : 5 }, y: { label: 'Neighbourhood z-score' }, refY: 0, aspect: narrow ? 0.9 : 0.66, labels: narrow ? 'none' : 'end', margin: { right: narrow ? 12 : 150 } });
  if (narrow) host.insertAdjacentHTML('beforeend', `<div class="legend-row">${series.map((x) => `<span class="chip" style="--c:${x.color}">${x.label}</span>`).join('')}</div>`);
});

export const vascWT = guard(4, async (host) => {
  const wt = (await data('fig4')).g.wt;
  C.paired(host, { groups: wt.groups.map((s) => s.replace('Intermediate', 'Int.')), colors: [STATE.SecA, STATE.Intermediate, STATE.SecB], units: wt.units, ylabel: 'µm', stat: pstr(wt.stat.p), aspect: 1.15, digits: 0 });
});
export const vascTMA = guard(4, async (host) => {
  const t = (await data('fig4')).g.tma;
  const vals = (k) => t.units.map((u) => u.values[k]).filter(Number.isFinite);
  C.boxpts(host, { groups: [{ label: 'SecA', color: STATE.SecA, values: vals(0) }, { label: 'SecB', color: STATE.SecB, values: vals(1) }], ylabel: 'µm', stat: pstr(t.stat.p), aspect: 1.15, digits: 0 });
});
export const moran = guard(4, async (host) => {
  const d = (await data('fig4')).d;
  const wt = d.wt.units.map((u) => u.value);
  const tma = d.tma.tma_a_recomputed?.units?.map((u) => u.value ?? u) || [];
  C.boxpts(host, { groups: [{ label: 'Whole (8)', color: '#475569', values: wt }, ...(tma.length ? [{ label: `TMA A (${tma.length})`, color: '#94A3B8', values: tma }] : [])], ylabel: "Bivariate Moran's I", stat: `${d.wt.stat.label} · TMA ${d.tma.stat.label}`, aspect: 1, digits: 3 });
  host.insertAdjacentHTML('beforeend', `<p class="panel-foot">Negative values: SecA and SecB scores segregate. TMA points shown for TMA A (recomputed); the full TMA cohort (n = 334) has median ${d.tma.median.toFixed(3)}.</p>`);
});
export const bilisa = guard(4, async (host) => {
  const e = (await data('fig4')).e;
  const rows = e.groups.map((g) => ({ label: g, values: e.percent[g] }));
  const pal = { 'SecA niche': STATE.SecA, 'Co-localized': '#C9874A', 'SecB niche': STATE.SecB, 'Both low': '#CBD5E1' };
  C.stack100(host, { rows, keys: e.categories, colors: pal, orient: 'h', labelW: 86, barH: 28 });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row">${e.categories.map((k) => `<span class="chip" style="--c:${pal[k]}">${k}</span>`).join('')}</div>`);
});

// ================================================================== Figure 5
export const gamEpi = guard(5, async (host) => {
  const a = (await data('fig5')).a;
  const up = { Glycolysis: '#C8264B', LDHA: '#E8865A', 'NF-κB': '#7B1A51', TNFA: '#C2410C' };
  const down = { Proliferation: '#2D4A7A', 'DNA damage repair': '#5574A3', 'Epigenetic silencing': '#8FA6C8', 'Oncogenic growth': '#3B689E' };
  const series = a.order.map((k) => ({ label: /^[A-Z0-9]+$/.test(k) ? `<tspan font-style="italic">${k === 'TNFA' ? 'TNF' : k}</tspan>` : k, color: up[k] || down[k] || '#64748B', ...curve(a.curves[k]) }));
  const narrow = host.clientWidth < 520;
  const c = el('div'); host.innerHTML = ''; host.appendChild(c);
  C.lines(c, { series, x: { label: 'Secretory cell polarization (SecA → SecB)', short: 'Polarization', ticks: narrow ? 3 : 5 }, y: { label: 'Cell-intrinsic program score (z)' }, refY: 0, aspect: narrow ? 0.95 : 0.7, labels: narrow ? 'none' : 'end', margin: { right: narrow ? 12 : 150 } });
  if (narrow) host.insertAdjacentHTML('beforeend', `<div class="legend-row">${series.map((x) => `<span class="chip" style="--c:${x.color}">${x.label.replace(/<[^>]+>/g, '')}</span>`).join('')}</div>`);
});
export const immune = guard(5, async (host) => {
  const f = (await data('fig5')).f;
  host.innerHTML = ''; host.style.display = 'grid'; host.style.gap = '14px 18px';
  const n = f.order.length;
  const cols = () => { const w = host.clientWidth; host.style.gridTemplateColumns = `repeat(${w >= 130 * n + 18 * (n - 1) ? n : w >= 420 ? 3 : w >= 300 ? 2 : 1}, minmax(0, 1fr))`; };
  cols(); new ResizeObserver(cols).observe(host);
  for (const name of f.order) {
    const t = f.panels[name];
    const color = CELLTYPE[name] || '#64748B';
    const box = el('div'); host.appendChild(box);
    box.innerHTML = `<div style="font:600 14px/1.3 var(--font-display);color:var(--navy-700)">${name}s</div><div class="meta">${t.label_in_figure} · ${pstr(t.stat?.p)}</div>`;
    const c = el('div'); box.appendChild(c);
    const series = t.per_tissue.map((pt) => ({ label: '', color, faint: true, x: pt.x, y: pt.y }));
    series.push({ label: name, color, x: t.pooled.x, y: t.pooled.y, lo: t.band?.lo, hi: t.band?.hi, w: 2.6 });
    const ymax = Math.max(...t.pooled.y, ...(t.band?.hi || [])) * 1.6;
    C.lines(c, { series, x: { label: 'Hypoxia (z)', short: 'Hypoxia (z)', ticks: 4 }, y: { label: '', ticks: 4, domain: [0, ymax] }, labels: 'none', aspect: 0.95, margin: { left: 34, right: 8, top: 8, bottom: 40 } });
  }
});
export const gamMac = guard(5, async (host) => {
  const i = (await data('fig5')).i;
  const cols = { Chemokine: '#2E8B57', 'NF-κB activated': '#7B5BA6', Glycolytic: '#C8264B', 'Tissue-resident identity': '#8FBC8F' };
  const series = Object.entries(i.curves).map(([label, c]) => ({ label, color: cols[label] || '#64748B', ...curve(c) }));
  const narrow = host.clientWidth < 520;
  const c = el('div'); host.innerHTML = ''; host.appendChild(c);
  C.lines(c, { series, x: { label: 'Local epithelial polarization (SecA → SecB, z)', short: 'Polarization', ticks: narrow ? 3 : 5 }, y: { label: 'Macrophage program score (z)' }, refY: 0, aspect: narrow ? 0.95 : 0.62, labels: narrow ? 'none' : 'end', margin: { right: narrow ? 12 : 165 } });
  if (narrow) host.insertAdjacentHTML('beforeend', `<div class="legend-row">${series.map((x) => `<span class="chip" style="--c:${x.color}">${x.label}</span>`).join('')}</div>`);
});
export const nuclearWT = guard(5, async (host) => {
  const b = (await data('fig5')).b;
  const wt = b.whole_tissue || b.wt;
  C.paired(host, { groups: wt.groups.map((s) => s.replace('Intermediate', 'Int.')), colors: [STATE.SecA, STATE.Intermediate, STATE.SecB], units: wt.units, ylabel: 'Nuclear area (µm²)', stat: wt.stat?.p != null ? pstr(wt.stat.p) : 'p = 0.008', aspect: 1.15 });
});
export const macAreaWT = guard(5, async (host) => {
  const j = (await data('fig5')).j;
  const wt = j.whole_tissue || j.wt;
  C.paired(host, { groups: wt.groups, colors: [STATE.SecA, STATE.SecB], units: wt.units, ylabel: 'Macrophage area (µm²)', stat: wt.stat?.p != null ? pstr(wt.stat.p) : 'p = 0.008', aspect: 1.15 });
});

// ================================================================== Figure 6
const NICHE = [
  { group: 'Survival', mac: ['VEGFA'], secb: ['BIRC3', 'NFKB2'], note: 'Higher NF-κB target expression in SecB cells near macrophages' },
  { group: 'Self-protection and immunoregulation', mac: [], secb: ['CD55', 'CD47', 'LGALS9', 'IL32'], note: 'Genes implicated in immune evasion and regulation' },
  { group: 'Glycolysis and lactate', mac: ['LDHA'], secb: ['SLC2A1', 'NDRG1', 'SLC16A3'], note: 'MCT-4 (SLC16A3) exports lactate, which may acidify the niche' },
  { group: 'Adhesion and matrix', mac: ['SPP1', 'CD44', 'CTSL'], secb: ['ICAM1', 'MMP7', 'TGM2', 'TIMP1'], note: 'Genes implicated in adhesion and matrix remodelling' },
];
export const nicheDiagram = async (host) => {
  let h = null;
  try { h = (await data('fig6_spatial')).h; } catch { /* diagram works without evidence */ }
  let groups = NICHE;
  if (h) {
    const notes = Object.fromEntries(NICHE.map((r) => [r.group.split(' ')[0], r.note]));
    groups = h.groups.map((g) => {
      const where = (gn) => h.enriched_cell_type[gn];
      return {
        group: g.label.replace('&', 'and'),
        mac: g.genes.filter((gn) => /macrophage|both/.test(where(gn))),
        secb: g.genes.filter((gn) => /SecB|both/.test(where(gn))),
        note: notes[g.label.split(' ')[0]] || '',
      };
    });
  }
  const ev = (gene) => {
    if (!h) return '';
    const rows = Object.fromEntries(h.rows.map((r) => [r.id, r]));
    return h.cells.filter((c) => c.gene === gene && c.status === 'dot').map((c) => { const r = rows[c.row]; return row(`${r.block === 'Macrophage' ? 'Macrophage' : 'SecB'} · ${r.platform}`, `${c.z > 0 ? '+' : ''}${c.z.toFixed(2)}${c.sig ? ' (sig.)' : ''}`); }).join('') + '<div style="color:var(--muted);margin-top:4px">Standardized effect; positive = higher in the niche</div>';
  };
  host.classList.add('chart');
  host.innerHTML = '';
  if (host.clientWidth < 560) {
    const pill = (g, col) => `<span class="gpill" style="--c:${col}" data-g="${g}"><i>${g}</i></span>`;
    host.innerHTML = `<div class="niche-tab"><span></span><span class="nt-c">Niche macrophage</span><span class="nt-c">SecB cell</span>${groups.map((r) => `<span class="nt-g">${r.group}</span><span class="nt-p">${r.mac.map((g) => pill(g, '#5E9C76')).join('') || '<span class="nt-x">–</span>'}</span><span class="nt-p">${r.secb.map((g) => pill(g, STATE.SecB)).join('')}</span><span class="nt-n">${r.note}</span>`).join('')}</div>`;
    host.querySelectorAll('.gpill').forEach((e) => {
      e.onpointerenter = (pe) => tip().show(`<div class="tt-h"><i>${e.dataset.g}</i></div>${ev(e.dataset.g) || '<span style="color:var(--muted)">See Figure 6h for effect sizes.</span>'}`, pe.clientX, pe.clientY);
      e.onpointerleave = () => tip().hide();
    });
    return;
  }
  const W = 640, rowH = 92, H = 70 + groups.length * rowH;
  const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('role', 'img').attr('aria-label', 'Genes with higher expression in SecB cells and nearby macrophages, grouped by role');
  const macX = 120, secX = 470;
  const head = (x, label, color, sub) => {
    svg.append('rect').attr('x', x - 100).attr('y', 6).attr('width', 200).attr('height', 44).attr('rx', 22).attr('fill', color).attr('opacity', 0.16);
    svg.append('text').attr('x', x).attr('y', 26).attr('text-anchor', 'middle').attr('class', 'lab').style('font-weight', 600).style('fill', color === STATE.SecB ? STATE.SecB : '#2E6B4F').text(label);
    svg.append('text').attr('x', x).attr('y', 42).attr('text-anchor', 'middle').attr('class', 'stat').style('fill', '#64748B').text(sub);
  };
  head(macX, 'Niche macrophage', '#8FBC8F', 'hypoxic, glycolytic');
  head(secX, 'SecB cell', STATE.SecB, 'quiescent, HIF/NF-κB');
  groups.forEach((r, i) => {
    const y0 = 66 + i * rowH;
    svg.append('rect').attr('x', 0).attr('y', y0).attr('width', W).attr('height', rowH - 10).attr('rx', 12).attr('fill', i % 2 ? '#FFFFFF' : '#F6F7F9');
    svg.append('text').attr('x', W / 2 - 25).attr('y', y0 + 18).attr('text-anchor', 'middle').attr('class', 'lab').style('font-weight', 600).style('fill', '#1E2A44').text(r.group);
    svg.append('text').attr('x', W / 2 - 25).attr('y', y0 + rowH - 22).attr('text-anchor', 'middle').attr('class', 'stat').style('fill', '#64748B').style('font-size', '10.5px').text(r.note);
    const pill = (gene, x, y, color) => {
      const gg = svg.append('g').attr('transform', `translate(${x},${y})`).style('cursor', 'default');
      const wpx = gene.length * 7.6 + 18;
      gg.append('rect').attr('x', -wpx / 2).attr('y', -11).attr('width', wpx).attr('height', 22).attr('rx', 11).attr('fill', '#fff').attr('stroke', color).attr('stroke-width', 1.5);
      gg.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').attr('class', 'lab gene').style('font-style', 'italic').style('fill', '#1E2A44').text(gene);
      gg.on('pointermove', (e) => tip().show(`<div class="tt-h"><i>${gene}</i></div><div style="color:var(--muted);margin-bottom:4px">${r.group}</div>${ev(gene) || '<span style="color:var(--muted)">See Figure 6h for effect sizes across Xenium, Visium HD and the atlas.</span>'}`, e.clientX, e.clientY))
        .on('pointerleave', () => tip().hide());
      return wpx;
    };
    const ym = y0 + 46;
    const spread = (genes, cx, color, lo, hi) => {
      const tot = genes.reduce((a, g) => a + g.length * 7.6 + 24, 0) - 6;
      let x = Math.max(lo, Math.min(hi - tot, cx - tot / 2)); const x0 = x;
      for (const g of genes) { const wpx = g.length * 7.6 + 18; pill(g, x + wpx / 2, ym, color); x += wpx + 6; }
      return [x0, x - 6];
    };
    const mR = r.mac.length ? spread(r.mac, macX, '#5E9C76', 6, W / 2 - 40) : null;
    const sL = spread(r.secb, secX, STATE.SecB, W / 2 + 10, W - 6);
    if (mR) { const a = mR[1] + 8, b = sL[0] - 10; if (b - a > 20) svg.append('path').attr('d', `M${a},${ym} C ${a + (b - a) * 0.35},${ym - 14} ${a + (b - a) * 0.65},${ym - 14} ${b},${ym}`).attr('fill', 'none').attr('stroke', '#94A3B8').attr('stroke-width', 1.4).attr('marker-end', 'url(#arr)'); }
  });
  svg.append('defs').append('marker').attr('id', 'arr').attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerWidth', 7).attr('markerHeight', 7).attr('orient', 'auto')
    .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', '#94A3B8');
};

export const concordance = guard(6, async (host) => {
  const h = (await data('fig6_spatial')).h;
  const cells = {};
  for (const c of h.cells) cells[`${c.row}|${c.gene}`] = c.status === 'dot' ? { v: c.z, pct: c.pct / 100, sig: c.sig } : c.status === 'secb_carryover' ? { x: true } : null;
  const rowLabel = (r) => `${r.block === 'Macrophage' ? 'Macrophage' : /contact/i.test(r.comparison) || /contact/i.test(r.block) ? 'SecB, touching mac.' : 'SecB'} · ${r.platform}`;
  C.dotmatrix(host, { rows: h.rows.map((r) => ({ key: r.id, label: rowLabel(r) })), cols: h.genes.map((g) => ({ key: g, label: g, shade: h.enriched_cell_type[g] === 'macrophage' })), cells, vmax: 2, labelW: 190, rowH: 28 });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row"><span class="meta">Colour: standardized effect (blue lower, rust higher in the niche); size: % expressing; outline: significant; ×: transcripts from adjacent SecB epithelium; shaded columns: enriched in macrophages. Groups: ${h.groups.map((g) => g.label).join(' · ')}.</span></div>`);
});
export const macNeighbours = guard(6, async (host) => {
  const g = (await data('fig6_spatial')).g;
  const wt = g.whole_tissue || g.wt;
  C.paired(host, { groups: wt.groups, colors: ['#8FBC8F', '#2E6B4F'], units: wt.units, ylabel: 'SecB within 50 µm (% of epithelium)', stat: wt.stat?.p ? fmt.p(wt.stat.p) : null, aspect: 1.15 });
});
export const volcano6e = guard(6, async (host) => {
  const e = (await data('fig6_visium')).e;
  const genes = e.genes.filter((d) => d.drawn !== false).map((d) => ({ g: d.gene, x: d.log2fc, y: d.y, cls: d.cls === 'Not significant' ? 'ns' : d.cls, note: d.cls }));
  const pal = { 'Macrophage-derived, up in SecB niche': '#2E6B4F', 'Macrophage-derived, up in distal': '#8FBC8F', 'SecB epithelial carry-over': '#E9C2AE', Stromal: '#CFC6B6', ns: '#DCE1E8' };
  C.volcano(host, { genes, colors: pal, highlight: e.genes.filter((d) => d.label).map((d) => d.gene), xlabel: 'log₂ fold change, content-adjusted (distal ← → SecB niche)', ylabel: '−log₁₀ adj. p', ycap: e.y_clip, aspect: 0.8 });
  host.insertAdjacentHTML('beforeend', `<div class="legend-row">${Object.entries(pal).filter(([k]) => k !== 'ns').map(([k, c]) => `<span class="chip" style="--c:${c}">${k}</span>`).join('')}</div>`);
});

// ================================================================== Figure 7
function kmGroups(p, colorOf) {
  return p.groups.map((gr) => ({ ...gr, label: (gr.long_label || gr.label).split(' (')[0].replace('Carboplatin-paclitaxel', 'Standard'), color: colorOf(gr.label), textColor: colorOf(gr.label, true), short: gr.label }));
}
const stateOf = (label, text) => (/SecB/i.test(label) ? (text ? STATE.SecB : STATE.SecB) : /SecA/i.test(label) ? (text ? '#B07418' : STATE.SecA) : '#64748B');
const armOf = (dark) => (label, text) => (/bev/i.test(label) ? (dark ? '#7FB0E6' : ARM.Bevacizumab) : (text ? '#64748B' : ARM.Standard));

export const kmExplorer = guard(7, async (host, opt) => {
  const f = await data('fig7');
  const sets = { 'tma-os': ['a', 'Overall survival'], 'tma-pfs': ['b', 'Progression-free survival'], 'tcga-os': ['g', 'Overall survival'], 'tcga-pfs': ['h', 'Progression-free survival'] };
  let cohort = 'tma', end = 'os';
  const chart = el('div'); host.innerHTML = ''; host.appendChild(chart);
  const draw = () => {
    const [k, ylab] = sets[`${cohort}-${end}`]; const p = f[k];
    C.km(chart, { groups: kmGroups(p, stateOf), xmax: p.x_max || 60, xticks: p.x_ticks, ylabel: ylab, stat: `log-rank ${fmt.p(p.stat.p)}`, aspect: 0.66 });
  };
  const ctl = opt.controls || host;
  const wrap = el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' });
  seg(wrap, [['tma', 'Our TMA cohort (n = 104)'], ['tcga', 'TCGA-OV (n = 314)']], cohort, (v) => { cohort = v; draw(); });
  seg(wrap, [['os', 'Overall'], ['pfs', 'Progression-free']], end, (v) => { end = v; draw(); });
  (opt.controls ? ctl.appendChild(wrap) : host.prepend(wrap));
  draw();
});
export const kmPanel = guard(7, async (host, opt) => {
  const p = (await data('fig7'))[opt.key];
  const colorOf = /^[kl]$/.test(opt.key) ? armOf(opt.dark) : stateOf;
  C.km(host, { groups: kmGroups(p, colorOf), xmax: p.x_max || 60, xticks: p.x_ticks, ylabel: opt.ylabel || p.y_label || 'Survival probability', stat: `log-rank ${fmt.p(p.stat.p)}`, aspect: opt.aspect || 0.72 });
});
export const icon7 = guard(7, async (host) => {
  const f = await data('fig7');
  host.innerHTML = '';
  for (const [k, title] of [['k', 'SecA-polarized tumours'], ['l', 'SecB-polarized tumours']]) {
    const p = f[k], hr = p.adjusted_hr;
    const box = el('div', { class: 'card', style: 'background:#fff' });
    box.innerHTML = `<div class="panel-head"><p class="h" style="color:${k === 'l' ? STATE.SecB : '#B07418'}">${title}</p><p class="s">n = ${p.n} · bevacizumab HR ${hr.HR.toFixed(2)} (${hr.lo.toFixed(2)}–${hr.hi.toFixed(2)}), ${fmt.p(hr.p)} · progression-free survival</p></div>`;
    const c = el('div'); box.appendChild(c); host.appendChild(box);
    C.km(c, { groups: kmGroups(p, armOf(false)), xmax: p.x_max || 42, xticks: p.x_ticks || [0, 12, 24, 36], ylabel: 'Progression-free', stat: `log-rank ${fmt.p(p.stat.p)}`, aspect: 0.7 });
  }
});
export const icon7Split = guard(7, async (host, opt) => {
  const f = await data('fig7');
  const groups = [['m', 'SecB-polarized tumours', STATE.SecB], ['n', 'SecA-polarized tumours', STATE.SecA]].map(([k, title, col]) => ({ title, rows: f[k].rows.map((r) => ({ label: r.label.replace('mo', 'months').replace('-', '–').replace(/^>\s*/, 'After '), hr: r.HR ?? r.hr, lo: r.lo, hi: r.hi, p: r.p, q: r.q, color: col, shape: r.shape || 'circle' })) }));
  host.innerHTML = '';
  // side by side when there is room (m: SecB, n: SecA), stacked otherwise
  host.style.display = 'grid'; host.style.gridTemplateColumns = 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))'; host.style.gap = '8px 24px';
  for (const gr of groups) {
    const box = el('div'); host.appendChild(box);
    box.innerHTML = `<div style="font:600 13px/1.3 var(--font-display);color:${gr.rows[0].color === STATE.SecA ? '#B07418' : STATE.SecB}">${gr.title}</div>`;
    const c = el('div'); box.appendChild(c);
    C.forest(c, { rows: gr.rows, domain: [0.08, 3], ticks: [0.1, 0.25, 0.5, 1, 2], xlabel: 'Bevacizumab hazard ratio (PFS)', cols: ['HR', 'p'], labelW: 120, favours: ['favours bevacizumab', 'favours standard'] });
  }
});
export const forestPanel = guard(7, async (host, opt) => {
  const p = (await data('fig7'))[opt.key];
  const rows = p.rows.map((r) => ({ ...r, hr: r.HR ?? r.hr, color: stateOf(r.group || r.label) === '#64748B' ? '#475569' : stateOf(r.group || r.label), shade: /^Polarization/.test(r.label) && opt.key >= 'i' }));
  const lo = Math.min(...rows.map((r) => r.lo)), hi = Math.max(...rows.map((r) => r.hi));
  C.forest(host, { rows, domain: [Math.min(0.4, lo * 0.9), Math.max(2.5, hi * 1.1)], ticks: p.x_ticks || [0.5, 1, 2], xlabel: (p.x_label || 'Hazard ratio per SD').replace(/ - /, ' · '), cols: rows.some((r) => r.q != null) ? ['HR', 'p', 'q'] : ['HR', 'p'], labelW: 170 });
});
export const protein = guard(7, async (host, opt) => {
  const f = (await data('fig7'))[opt.key || 'f'];
  host.innerHTML = '';
  if (opt.key === 'e') {
    // both markers on one plot, as in the paper
    const cols = { KRT7: STATE.SecB, KRT19: '#3B689E' };
    const series = f.groups.map((g) => ({ label: g.label, color: cols[g.label] || '#64748B', points: g.x.map((x, i) => [x, g.y[i]]), r: g.pearson_r }));
    const c = el('div'); host.appendChild(c);
    C.scatterMulti(c, { series, xlabel: 'Xenium transcript (mean log counts)', ylabel: 'Protein (MFI)', margin: { left: 52, right: 10, top: 10, bottom: 40 } });
    host.insertAdjacentHTML('beforeend', `<div class="legend-row">${series.map((s2) => `<span class="chip" style="--c:${s2.color}">${s2.label} · r = ${s2.r.toFixed(2)}</span>`).join('')}</div>`);
    return;
  }
  const list = f.panels;
  host.style.display = 'grid'; host.style.gridTemplateColumns = `repeat(auto-fit, minmax(min(100%, ${host.clientWidth > 600 ? 130 : 150}px), 1fr))`; host.style.gap = '6px 14px';
  for (const mk of list) {
    const box = el('div'); host.appendChild(box);
    const strong = /KRT7|KRT19/.test(mk.label);
    box.innerHTML = `<div style="font:600 13px/1.3 var(--font-display);color:var(--navy-700)">${mk.label} <span style="font:400 12px var(--font-body);color:var(--muted)">r = ${mk.pearson_r.toFixed(2)}</span></div>`;
    const c = el('div'); box.appendChild(c);
    C.scatter(c, { points: mk.x.map((x, i) => [x, mk.y[i]]), color: strong ? STATE.SecB : '#94A3B8', lineColor: strong ? STATE.SecB : '#64748B', xlabel: 'Polarization', ylabel: '', margin: { left: 40, right: 6, top: 8, bottom: 38 } });
  }
});

// ================================================================== schematic: a papilla in cross-section
export function papilla(host, opt = {}) {
  host.classList.add('chart');
  host.innerHTML = `<div class="panel-head"><p class="h">How the gradient is laid out</p><p class="s">Schematic of a papilla in cross-section, drawn from the tissue maps</p></div>`;
  const W = 520, H = 360, cx = 190, cy = 180;
  // narrow: the drawing alone, with a legend below in place of the callouts, which would shrink below legible size
  const narrow = host.clientWidth < 440;
  if (!host._papillaRO) {
    host._papillaRO = new ResizeObserver(() => { if ((host.clientWidth < 440) !== host._papillaNarrow) papilla(host, { still: true }); });
    host._papillaRO.observe(host);
  }
  host._papillaNarrow = narrow;
  const still = reduced() || opt.still;
  const svg = d3.select(host).append('svg').attr('viewBox', narrow ? `0 12 392 ${H - 22}` : `0 0 ${W} ${H}`).attr('width', '100%').attr('role', 'img')
    .attr('aria-label', 'A papilla: blood vessel at the centre, stroma around it, SecA cells on the stroma, intermediate cells, then SecB cells at the lumen, where hypoxia is highest and macrophages gather');
  const rnd = d3.randomLcg(11);
  const pts = [];
  const R0 = 26, R1 = 70, R2 = 158;     // vessel, stroma, epithelium outer edge
  for (let i = 0; i < 1900; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (R2 + 60);
    const wob = 1 + 0.07 * Math.sin(3 * a) + 0.05 * Math.cos(5 * a + 1);
    pts.push([cx + Math.cos(a) * r * wob * 1.12, cy + Math.sin(a) * r * wob * 0.92, r, a]);
  }
  const vor = d3.Delaunay.from(pts).voronoi([0, 0, W, H]);
  const kind = (p) => {
    const r = p[2];
    if (r > R2 + 3) return null;          // lumen: shapes the outer cells, not drawn
    if (r < R0) return 'vessel';
    if (r < R1) return rnd() < 0.08 ? 'B cell' : 'stroma';
    const t = (r - R1) / (R2 - R1) + (rnd() - 0.5) * 0.22;
    if (t > 0.72 && rnd() < 0.2) return 'Macrophage';
    return t < 0.42 ? 'SecA' : t < 0.68 ? 'Intermediate' : 'SecB';
  };
  const fill = { vessel: '#7D4E4E', stroma: '#DDD5CA', 'B cell': '#5665B6', Macrophage: '#8FBC8F', SecA: STATE.SecA, Intermediate: STATE.Intermediate, SecB: STATE.SecB };
  const order = { vessel: 0, stroma: 0.5, 'B cell': 0.55, SecA: 1, Intermediate: 2, SecB: 3, Macrophage: 3.2 };
  const cells = svg.append('g');
  pts.forEach((p, i) => {
    const k = kind(p);
    if (!k) return;
    cells.append('path').attr('d', vor.renderCell(i)).attr('fill', fill[k]).attr('stroke', '#fff').attr('stroke-width', 1.2)
      .attr('opacity', still ? 1 : 0).attr('data-o', order[k]);
  });
  // hypoxia ring, shown after the build
  const defs = svg.append('defs');
  const rg = defs.append('radialGradient').attr('id', 'hyp').attr('cx', cx / W).attr('cy', cy / H).attr('r', 0.5);
  rg.append('stop').attr('offset', '0%').attr('stop-color', '#35193E').attr('stop-opacity', 0);
  rg.append('stop').attr('offset', '55%').attr('stop-color', '#35193E').attr('stop-opacity', 0);
  rg.append('stop').attr('offset', '100%').attr('stop-color', '#35193E').attr('stop-opacity', 0.0);
  // annotations
  const ann = svg.append('g').attr('opacity', still ? 1 : 0);
  if (narrow) {
    host.insertAdjacentHTML('beforeend', `<div class="legend-row">${[['Blood vessel', fill.vessel], ['Stroma', fill.stroma], ['B cells', fill['B cell']], ['SecA', fill.SecA], ['Intermediate', fill.Intermediate], ['SecB', fill.SecB], ['Macrophages', fill.Macrophage]].map(([l, c]) => `<span class="chip" style="--c:${c}">${l}</span>`).join('')}</div>
      <p class="panel-foot">From the vessel at the centre outward, distance and hypoxia rise: SecA cells sit near the vessel and SecB cells toward the lumen, where macrophages join them.</p>`);
  }
  const note = (x1, y1, x2, y2, text, color = '#334155', anchor = 'start') => {
    ann.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2).attr('stroke', '#94A3B8');
    ann.append('circle').attr('cx', x1).attr('cy', y1).attr('r', 2.5).attr('fill', '#334155');
    ann.append('text').attr('x', x2 + (anchor === 'start' ? 6 : -6)).attr('y', y2).attr('dy', '0.32em').attr('text-anchor', anchor).attr('class', 'lab').style('fill', color).text(text);
  };
  if (!narrow) {
    note(cx, cy, 375, 28, 'Blood vessel', '#7D4E4E');
    note(cx + 52, cy - 22, 375, 62, 'Stroma and B cells', '#334155');
    note(cx + 100, cy - 52, 375, 96, 'SecA cells, near the vessel', '#B07418');
    note(cx + 150, cy + 30, 375, 230, 'SecB cells, toward the lumen', STATE.SecB);
    note(cx + 152, cy + 78, 375, 262, 'Macrophages join them', '#2E6B4F');
  }
  defs.append('marker').attr('id', 'pa').attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto').append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', '#334155');
  // distance axis
  if (!narrow) {
    const ax = ann.append('g').attr('transform', `translate(${cx},${H - 22})`);
    ax.append('line').attr('x1', 0).attr('x2', R2 * 1.12).attr('stroke', '#334155').attr('marker-end', 'url(#pa)');
    ax.append('text').attr('x', 0).attr('y', 16).attr('class', 'stat').text('Distance from vessel, hypoxia →');
  }
  if (still) return;
  const io = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    cells.selectAll('path').transition().delay(function () { return +this.dataset.o * 450 + Math.random() * 300; }).duration(500).attr('opacity', 1);
    ann.transition().delay(2000).duration(600).attr('opacity', 1);
  }, { threshold: 0.35 });
  io.observe(host);
}

export const REGISTRY = {
  pcRank, clones, programs, cellcycle, siteStack, siteMatched, treatMatched, subtypes, volcano2g,
  pdo, opto, modelScatter, gamEnv, vascWT, vascTMA, moran, bilisa, gamEpi, immune, gamMac, nuclearWT,
  macAreaWT, nicheDiagram, concordance, macNeighbours, volcano6e, kmExplorer, kmPanel, icon7, icon7Split, forestPanel,
  protein, papilla: async (h) => papilla(h),
};
