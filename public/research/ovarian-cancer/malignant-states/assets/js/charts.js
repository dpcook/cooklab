// Chart kit for the web article (D3 v7, loaded as a global). Each chart renders into a container,
// redraws when the container is resized, and carries a hover layer.
import { tip, row, fmt } from './core.js?v=b5261aa92c';

const d3 = window.d3;
const T = () => tip();
const INK = '#334155', MUTED = '#64748B', LIGHT = '#CBD5E1', GRID = '#EEF1F5';

function frame(el, spec, draw) {
  el.classList.add('chart');
  const render = (extra = { l: 0, r: 0 }) => {
    const width = Math.max(spec.minWidth || 150, el.clientWidth);
    // a card may fix the chart height (data-ch) so that cards in a row line up
    const box = el.closest('[data-ch]'), chH = box ? +box.dataset.ch : 0;
    const height = typeof spec.height === 'function' ? spec.height(width) : spec.height || chH || Math.round(width * (spec.aspect || 0.62));
    const m = Object.assign({ top: 14, right: 16, bottom: 44, left: 52 }, spec.margin || {});
    m.left += extra.l; m.right += extra.r;
    // replace only this chart's svg, so that legends a panel appended below it survive a redraw
    if (el._svg && el._svg.parentNode === el) el._svg.remove(); else el.innerHTML = '';
    const svg = d3.select(el).insert('svg', ':first-child').attr('width', width).attr('height', height).attr('role', 'img');
    el._svg = svg.node();
    if (spec.alt) svg.attr('aria-label', spec.alt);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    draw({ svg, g, w: width - m.left - m.right, h: height - m.top - m.bottom, m, width, height });
    declutter(svg.node());
    // text that spills past the chart's edges (long axis titles, end tick labels): redraw once with room for it
    if (!extra.done && svg.node().isConnected) {
      const box = svg.node().getBoundingClientRect();
      let l = 0, r = 0;
      for (const t of svg.node().querySelectorAll('text')) {
        if (t.style.display === 'none' || !t.textContent.trim()) continue;
        const b = t.getBoundingClientRect();
        if (!b.width) continue;
        l = Math.max(l, box.left - b.left); r = Math.max(r, b.right - box.right);
      }
      if (l > 0.5 || r > 0.5) render({ l: extra.l + Math.ceil(l) + 2, r: extra.r + Math.ceil(r) + 2, done: true });
    }
  };
  render();
  el._redraw = () => render();   // for a layout that changes the card's height (data-ch)
  let last = el.clientWidth;
  const ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - last) > 4) { last = el.clientWidth; render(); } });
  ro.observe(el);
  return { render, el };
}
function axisLeft(g, y, { label, ticks = 5, fmtv, grid = true, w } = {}) {
  ticks = Math.max(2, Math.min(ticks, Math.floor(Math.abs(y.range()[0] - y.range()[1]) / 34)));
  const a = g.append('g').attr('class', 'axis').call(d3.axisLeft(y).ticks(ticks, fmtv).tickSize(0).tickPadding(8));
  a.select('.domain').remove();
  if (grid) g.insert('g', ':first-child').attr('class', 'grid').selectAll('line').data(y.ticks(ticks)).join('line')
    .attr('x1', 0).attr('x2', w).attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
  if (label) g.append('text').attr('class', 'axis-title').attr('transform', `translate(${-a.node().getBBox().width - 16},${y.range()[0] / 2 + y.range()[1] / 2}) rotate(-90)`).attr('text-anchor', 'middle').text(label);
  return a;
}
function axisBottom(g, x, h, { label, ticks = 6, fmtv, line = true } = {}) {
  ticks = Math.max(2, Math.min(ticks, Math.floor(Math.abs(x.range()[1] - x.range()[0]) / 56)));
  const a = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(ticks, fmtv).tickSizeOuter(0).tickSize(4).tickPadding(6));
  if (!line) a.select('.domain').remove();
  if (label) g.append('text').attr('class', 'axis-title').attr('x', (x.range()[0] + x.range()[1]) / 2).attr('y', h + 36).attr('text-anchor', 'middle').html(label);
  return a;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Tick labels that collide: rotate a bottom axis, then drop every other label until none overlap.
const hit = (a, b, pad = 2) => a.x < b.x + b.width + pad && b.x < a.x + a.width + pad && a.y < b.y + b.height + pad && b.y < a.y + a.height + pad;
function collides(texts) {
  const boxes = texts.filter((t) => t.style.display !== 'none').map((t) => t.getBoundingClientRect());
  for (let i = 1; i < boxes.length; i++) if (hit(boxes[i - 1], boxes[i])) return true;
  return false;
}
// Rotate a tick label about the point just below its tick, so that its end sits centred under the tick.
// (Rotating about the tick's own origin swings the label sideways by the tick padding.)
export function rotateTick(t, angle) {
  if (t.dataset.pad == null) t.dataset.pad = parseFloat(t.getAttribute('y')) || 9;
  t.setAttribute('x', 0); t.setAttribute('y', 0);
  t.setAttribute('transform', `translate(0,${+t.dataset.pad - 2}) rotate(${angle})`);
  t.setAttribute('text-anchor', 'end');
  t.setAttribute('dx', '0'); t.setAttribute('dy', '0.35em');
}
export function declutter(svg) {
  if (!svg.isConnected) return;
  for (const ax of svg.querySelectorAll('g.axis')) {
    const texts = [...ax.querySelectorAll('.tick text')];
    if (texts.length < 2 || !collides(texts)) continue;
    const bottom = /translate\(0,\s*[1-9]/.test(ax.getAttribute('transform') || '');
    const categorical = texts.some((t) => !/^[−\-+]?[\d.,]+[%kMµ]*$/.test(t.textContent.trim()));
    if (bottom) {
      // numbers rotate once and then thin out; category names rotate further and are never dropped
      for (const angle of categorical ? [-38, -60, -90] : [-38]) {
        texts.forEach((t) => rotateTick(t, angle));
        if (!collides(texts)) break;
      }
      // push the axis title below the rotated labels and grow the chart to fit
      const low = Math.max(...texts.map((t) => t.getBoundingClientRect().bottom));
      for (const ttl of ax.parentNode.querySelectorAll(':scope > text.axis-title')) {
        const r = ttl.getBoundingClientRect();
        if (r.top > ax.getBoundingClientRect().top && r.top < low + 4) {
          const shift = low + 6 - r.top;
          ttl.setAttribute('y', +ttl.getAttribute('y') + shift);
          svg.setAttribute('height', +svg.getAttribute('height') + shift);
        }
      }
      const over = Math.max(...texts.map((t) => t.getBoundingClientRect().bottom)) - svg.getBoundingClientRect().bottom;
      if (over > 0) svg.setAttribute('height', +svg.getAttribute('height') + over + 4);
      if (!collides(texts) || categorical) continue;
    }
    if (!bottom && categorical) {
      for (let fs = 11; fs >= 9 && collides(texts); fs -= 0.5) texts.forEach((t) => (t.style.fontSize = fs + 'px'));
      continue;
    }
    for (let step = 2; step < texts.length && collides(texts); step++) texts.forEach((t, i) => (t.style.display = i % step ? 'none' : ''));
  }
}
let clipN = 0;
function clip(svg, g, w, h) {
  const id = `clip${++clipN}`;
  svg.append('defs').append('clipPath').attr('id', id).append('rect').attr('x', -2).attr('y', -2).attr('width', w + 4).attr('height', h + 4);
  return g.append('g').attr('clip-path', `url(#${id})`);
}

// ------------------------------------------------------------------ lines (GAM curves, trends)
// spec: {series:[{label, color, x, y, lo?, hi?, dash?, w?, faint?}], x:{label, domain}, y:{label, domain}, refY, labels:'end'|'none'}
export function lines(el, spec) {
  return frame(el, Object.assign({ margin: { right: spec.labels === 'none' ? 16 : 128 } }, spec), ({ svg, g: g0, w, h, m }) => {
    const all = spec.series;
    const xs = all.flatMap((s) => s.x), ys = all.filter((s) => !s.faint || spec.yFromAll).flatMap((s) => [...s.y, ...(s.lo || []), ...(s.hi || [])]);
    const g = g0;
    const x = d3.scaleLinear().domain(spec.x.domain || d3.extent(xs)).range([0, w]);
    const y = d3.scaleLinear().domain(spec.y.domain || d3.extent(ys)).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.y.label, w, ticks: spec.y.ticks || 5 });
    axisBottom(g, x, h, { label: spec.x.label, ticks: spec.x.ticks || 5 });
    if (spec.refY != null) g.append('line').attr('class', 'ref').attr('x1', 0).attr('x2', w).attr('y1', y(spec.refY)).attr('y2', y(spec.refY));
    const line = d3.line().x((d) => x(d[0])).y((d) => y(d[1])).curve(d3.curveMonotoneX);
    const area = d3.area().x((d) => x(d[0])).y0((d) => y(d[1])).y1((d) => y(d[2])).curve(d3.curveMonotoneX);
    const gc = clip(svg, g, w, h);
    for (const s of all) {
      if (s.lo) gc.append('path').attr('d', area(s.x.map((v, i) => [v, s.lo[i], s.hi[i]]))).attr('fill', s.color).attr('opacity', s.bandOpacity ?? 0.14);
    }
    const paths = [];
    for (const s of all) {
      const p = gc.append('path').attr('d', line(s.x.map((v, i) => [v, s.y[i]]))).attr('fill', 'none').attr('stroke', s.color)
        .attr('stroke-width', s.w || (s.faint ? 1 : 2.2)).attr('stroke-dasharray', s.dash || null).attr('opacity', s.faint ? 0.4 : 1)
        .attr('stroke-linecap', 'round');
      paths.push(p);
    }
    // direct labels at line ends, nudged apart
    if (spec.labels !== 'none') {
      const ends = all.filter((s) => !s.faint && s.label).map((s) => ({ s, y: y(s.y[s.y.length - 1]) })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      for (let i = ends.length - 2; i >= 0; i--) if (ends[i + 1].y > h + 4 && ends[i + 1].y - ends[i].y < 14) ends[i].y = ends[i + 1].y - 14;
      for (const e of ends) g.append('text').attr('class', 'lab').attr('x', w + 8).attr('y', e.y).attr('dy', '0.32em').attr('fill', e.s.textColor || e.s.color).style('fill', e.s.textColor || e.s.color).html(e.s.label);
    }
    if (spec.note) g.append('text').attr('class', 'stat').attr('x', 4).attr('y', 4).attr('dy', '0.8em').text(spec.note);
    // crosshair
    const named = all.filter((s) => !s.faint && s.label);
    const cross = g.append('line').attr('y1', 0).attr('y2', h).attr('stroke', INK).attr('stroke-width', 1).attr('opacity', 0);
    const dots = g.selectAll('.hov').data(named).join('circle').attr('r', 4).attr('fill', (s) => s.color).attr('stroke', '#fff').attr('stroke-width', 1.5).attr('opacity', 0);
    g.append('rect').attr('width', w).attr('height', h).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev); const xv = x.invert(px);
        cross.attr('x1', px).attr('x2', px).attr('opacity', 0.25);
        const vals = named.map((s) => { const i = d3.minIndex(s.x, (v) => Math.abs(v - xv)); return { s, i, v: s.y[i] }; });
        dots.attr('cx', (s, k) => x(vals[k].s.x[vals[k].i])).attr('cy', (s, k) => y(vals[k].v)).attr('opacity', 1);
        T().show(`<div class="tt-h">${esc(spec.x.short || spec.x.label || 'x')}: ${xv.toFixed(2)}</div>` + vals.slice().sort((a, b) => b.v - a.v).map((d) => row(`<span class="chip" style="--c:${d.s.color}">${d.s.label}</span>`, d.v.toFixed(2))).join(''), ev.clientX, ev.clientY);
      })
      .on('pointerleave', () => { cross.attr('opacity', 0); dots.attr('opacity', 0); T().hide(); });
  });
}

// ------------------------------------------------------------------ Kaplan–Meier
// spec: {groups:[{label,color,steps:[[t,s]],censor:[[t,s]],at_risk:[[t,n]]}], xmax, xticks, ylabel, stat}
export function km(el, spec) {
  const nG = spec.groups.length;
  const lw = Math.max(...spec.groups.map((gr) => (gr.short || gr.label).length)) * 6.8 + 30;
  return frame(el, Object.assign({ margin: { top: 12 + 18 * nG, bottom: 56 + 18 * nG, left: Math.max(52, lw), right: 16 } }, spec), ({ g, w, h }) => {
    const x = d3.scaleLinear().domain([0, spec.xmax || 60]).range([0, w]);
    const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel || 'Survival probability', w, ticks: 4, fmtv: '.2f' });
    const xt = spec.xticks || d3.range(0, (spec.xmax || 60) + 1, 12);
    const ax = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickValues(xt).tickSize(4).tickPadding(6).tickSizeOuter(0));
    g.append('text').attr('class', 'axis-title').attr('x', w / 2).attr('y', h + 34).attr('text-anchor', 'middle').text(spec.xlabel || 'Months');
    const step = (pts) => { const p = []; let prev = null; for (const [t, s] of pts) { if (prev != null) p.push([t, prev]); p.push([t, s]); prev = s; } return p; };
    const line = d3.line().x((d) => x(Math.min(d[0], spec.xmax || 60))).y((d) => y(d[1]));
    const curves = [];
    for (const gr of spec.groups) {
      const pts = step(gr.steps.filter((d) => d[0] <= (spec.xmax || 60) + 1e-9));
      const last = pts[pts.length - 1];
      if (last && last[0] < (spec.xmax || 60) && gr.extendTo !== false) pts.push([Math.min(spec.xmax || 60, gr.tEnd ?? spec.xmax ?? 60), last[1]]);
      curves.push({ gr, pts });
      g.append('path').attr('d', line(pts)).attr('fill', 'none').attr('stroke', gr.color).attr('stroke-width', 2.2).attr('stroke-linejoin', 'round');
      g.selectAll(null).data((gr.censor || []).filter((d) => d[0] <= (spec.xmax || 60))).join('line')
        .attr('x1', (d) => x(d[0])).attr('x2', (d) => x(d[0])).attr('y1', (d) => y(d[1]) - 4).attr('y2', (d) => y(d[1]) + 4)
        .attr('stroke', gr.color).attr('stroke-width', 1.4);
    }
    if (spec.stat) g.append('text').attr('class', 'stat').attr('x', 8).attr('y', h - 10).text(spec.stat);
    // legend above the plot
    spec.groups.forEach((gr, k) => {
      const t = g.append('g').attr('transform', `translate(0,${-12 - (nG - 1 - k) * 18})`);
      t.append('line').attr('x1', 0).attr('x2', 16).attr('stroke', gr.color).attr('stroke-width', 2.4);
      const long = `${gr.label}${gr.n ? ` (n = ${gr.n})` : ''}`, short = `${gr.short || gr.label}${gr.n ? ` (n = ${gr.n})` : ''}`;
      const txt = t.append('text').attr('x', 22).attr('class', 'lab').attr('dy', '0.32em').style('fill', gr.textColor || gr.color).text(long);
      if (txt.node().getComputedTextLength && txt.node().isConnected && 22 + txt.node().getComputedTextLength() > w + 10) txt.text(short);
    });
    // numbers at risk
    const top = h + 52;
    g.append('text').attr('x', -20).attr('y', top - 2).attr('text-anchor', 'end').attr('class', 'stat').style('font-weight', 600).text('At risk');
    spec.groups.forEach((gr, k) => {
      const yy = top + 16 + k * 18;
      g.append('text').attr('x', -20).attr('y', yy).attr('text-anchor', 'end').attr('dy', '0.32em').style('fill', gr.textColor || gr.color).style('font-weight', 600).text(gr.short || gr.label);
      g.selectAll(null).data((gr.at_risk || []).filter((d) => d[0] <= (spec.xmax || 60))).join('text')
        .attr('x', (d) => x(d[0])).attr('y', yy).attr('dy', '0.32em').attr('text-anchor', 'middle').text((d) => d[1]);
    });
    // hover: survival at t
    const cross = g.append('line').attr('y1', 0).attr('y2', h).attr('stroke', INK).attr('opacity', 0);
    g.append('rect').attr('width', w).attr('height', h).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev); const t = Math.max(0, x.invert(px));
        cross.attr('x1', px).attr('x2', px).attr('opacity', 0.2);
        const vals = curves.map(({ gr }) => { let s = 1; for (const [tt, ss] of gr.steps) { if (tt <= t) s = ss; else break; } return [gr, s]; });
        T().show(`<div class="tt-h">${t.toFixed(1)} months</div>` + vals.map(([gr, s]) => row(`<span class="chip" style="--c:${gr.color}">${gr.label}</span>`, s.toFixed(2))).join(''), ev.clientX, ev.clientY);
      })
      .on('pointerleave', () => { cross.attr('opacity', 0); T().hide(); });
  });
}

// ------------------------------------------------------------------ forest
// spec: {rows:[{label, hr, lo, hi, p, q, color, shape}], domain:[lo,hi], xlabel, cols:['HR','p','q'], ticks}
export function forest(el, spec) {
  const rows = spec.rows;
  const W0 = el.clientWidth || 500;
  const colW = W0 < 440 ? 38 : 46, ncol = (spec.cols || ['HR', 'p']).length;
  spec = { ...spec, labelW: Math.min(spec.labelW || 150, Math.round(W0 * 0.34)) };
  return frame(el, Object.assign({ height: 40 + rows.length * 34 + 30 + (spec.favours ? 18 : 0), margin: { left: spec.labelW, right: colW * ncol + 8, top: 26, bottom: spec.favours ? 58 : 40 } }, spec), ({ g, w, h }) => {
    const x = d3.scaleLog().domain(spec.domain || [0.1, 4]).range([0, w]);
    const y = d3.scaleBand().domain(rows.map((_, i) => i)).range([0, h]).paddingInner(0.2);
    // thin the ticks until their labels fit without rotating (rotation would push the axis title into the 'favours' line)
    let tv = spec.ticks || [0.25, 0.5, 1, 2];
    while (tv.length > 3 && d3.min(tv.slice(1), (t, i) => x(t) - x(tv[i])) < 26) tv = tv.filter((t, i) => t === 1 || i % 2 === 0);
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickValues(tv).tickFormat(d3.format('~g')).tickSize(4).tickSizeOuter(0));
    g.append('text').attr('class', 'axis-title').attr('x', w / 2).attr('y', h + 34).attr('text-anchor', 'middle').text(spec.xlabel || 'Hazard ratio');
    g.append('line').attr('class', 'ref').attr('x1', x(1)).attr('x2', x(1)).attr('y1', -6).attr('y2', h);
    rows.forEach((r, i) => {
      const yy = y(i) + y.bandwidth() / 2;
      if (r.shade) g.append('rect').attr('x', -spec.labelW).attr('width', Math.max(0, w + spec.labelW + colW * ncol)).attr('y', y(i) - 3).attr('height', y.bandwidth() + 6).attr('fill', '#F6F7F9');
      g.append('text').attr('x', -12).attr('y', yy).attr('dy', '0.32em').attr('text-anchor', 'end').attr('class', 'lab').html(r.label);
      g.append('line').attr('x1', x(r.lo)).attr('x2', x(r.hi)).attr('y1', yy).attr('y2', yy).attr('stroke', r.color || INK).attr('stroke-width', 2).attr('stroke-linecap', 'round');
      if (r.shape === 'triangle') g.append('path').attr('d', d3.symbol(d3.symbolTriangle, 90)()).attr('transform', `translate(${x(r.hr)},${yy})`).attr('fill', r.color || INK).attr('stroke', '#fff').attr('stroke-width', 1.5);
      else g.append('circle').attr('cx', x(r.hr)).attr('cy', yy).attr('r', 6).attr('fill', r.color || INK).attr('stroke', '#fff').attr('stroke-width', 1.5);
      const vals = [r.hr.toFixed(2), r.p != null ? (r.p < 0.001 ? '<.001' : r.p.toFixed(3).replace(/^0/, '')) : '', r.q != null ? (r.q < 0.001 ? '<.001' : r.q.toFixed(3).replace(/^0/, '')) : ''];
      (spec.cols || ['HR', 'p']).forEach((c, k) => g.append('text').attr('x', w + 8 + colW * k + colW / 2).attr('y', yy).attr('dy', '0.32em').attr('text-anchor', 'middle').attr('class', 'stat').text(vals[k]));
      g.append('rect').attr('x', 0).attr('width', w).attr('y', y(i)).attr('height', y.bandwidth()).attr('fill', 'transparent')
        .on('pointermove', (ev) => T().show(`<div class="tt-h">${r.label}</div>${row('HR', `${r.hr.toFixed(2)} (${r.lo.toFixed(2)}–${r.hi.toFixed(2)})`)}${r.p != null ? row('p', r.p < 0.001 ? '< 0.001' : r.p.toFixed(3)) : ''}${r.q != null ? row('q', r.q.toFixed(3)) : ''}${r.n ? row('n', r.n) : ''}`, ev.clientX, ev.clientY))
        .on('pointerleave', () => T().hide());
    });
    (spec.cols || ['HR', 'p']).forEach((c, k) => g.append('text').attr('x', w + 8 + colW * k + colW / 2).attr('y', -12).attr('text-anchor', 'middle').attr('class', 'stat').style('font-weight', 600).text(c));
    if (spec.favours) {
      const short = w < 300;
      g.append('text').attr('x', x(1) - 8).attr('y', h + 52).attr('text-anchor', 'end').attr('class', 'stat').style('fill', MUTED).text(`← ${short ? spec.favours[0].replace('favours ', '') : spec.favours[0]}`);
      g.append('text').attr('x', x(1) + 8).attr('y', h + 52).attr('class', 'stat').style('fill', MUTED).text(`${short ? spec.favours[1].replace('favours ', '') : spec.favours[1]} →`);
    }
  });
}

// ------------------------------------------------------------------ paired per-unit dots (slope chart)
// spec: {groups:[...], colors:[...], units:[{id, values:[...]}], ylabel, stat, highlight?}
export function paired(el, spec) {
  return frame(el, Object.assign({ aspect: 0.9, margin: { left: 56, right: 12, top: 26, bottom: 36 } }, spec), ({ g, w, h }) => {
    const x = d3.scalePoint().domain(spec.groups).range([0, w]).padding(0.45);
    const vals = spec.units.flatMap((u) => u.values.filter(Number.isFinite));
    const y = d3.scaleLinear().domain(spec.ydomain || d3.extent(vals)).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel, w, ticks: 5 });
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10)).select('.domain').remove();
    const ln = d3.line().defined((d) => Number.isFinite(d[1])).x((d) => x(d[0])).y((d) => y(d[1]));
    for (const u of spec.units) {
      const pts = spec.groups.map((gname, k) => [gname, u.values[k]]);
      const gu = g.append('g').attr('class', 'unit').style('cursor', 'default');
      gu.append('path').attr('d', ln(pts)).attr('fill', 'none').attr('stroke', u.color || LIGHT).attr('stroke-width', 1.4);
      gu.selectAll('circle').data(pts.filter((d) => Number.isFinite(d[1]))).join('circle').attr('cx', (d) => x(d[0])).attr('cy', (d) => y(d[1])).attr('r', 4.5)
        .attr('fill', (d) => spec.colors[spec.groups.indexOf(d[0])]).attr('stroke', '#fff').attr('stroke-width', 1.5);
      gu.on('pointerenter', function () { d3.select(this).select('path').attr('stroke', INK).attr('stroke-width', 2); d3.select(this).raise(); })
        .on('pointermove', (ev) => T().show(`<div class="tt-h">${u.id}</div>` + spec.groups.map((gname, k) => row(gname, Number.isFinite(u.values[k]) ? (+u.values[k]).toFixed(spec.digits ?? 1) : '–')).join(''), ev.clientX, ev.clientY))
        .on('pointerleave', function () { d3.select(this).select('path').attr('stroke', u.color || LIGHT).attr('stroke-width', 1.4); T().hide(); });
    }
    if (spec.medians) {
      spec.groups.forEach((gname, k) => {
        const md = d3.median(spec.units, (u) => u.values[k]);
        g.append('line').attr('x1', x(gname) - 16).attr('x2', x(gname) + 16).attr('y1', y(md)).attr('y2', y(md)).attr('stroke', INK).attr('stroke-width', 2.2);
      });
    }
    statLines(g, spec.stat, w);
  });
}
function statLines(g, stat, w) {
  if (!stat) return;
  const lines = String(stat).split('\n'), t = g.append('text').attr('class', 'stat').attr('x', w / 2).attr('text-anchor', 'middle');
  lines.forEach((l, i) => t.append('tspan').attr('x', w / 2).attr('y', -10 - 14 * (lines.length - 1 - i)).text(l));
}

// ------------------------------------------------------------------ box + points (many units)
// spec: {groups:[{label, color, values}], ylabel, stat, pairedLines?:false}
export function boxpts(el, spec) {
  return frame(el, Object.assign({ aspect: 0.9, margin: { left: 56, right: 12, top: 26, bottom: 36 } }, spec), ({ g, w, h }) => {
    const x = d3.scaleBand().domain(spec.groups.map((d) => d.label)).range([0, w]).padding(0.35);
    const all = spec.groups.flatMap((d) => d.values || [d.box.whisker_low, d.box.whisker_high]);
    const y = d3.scaleLinear().domain(spec.ydomain || d3.extent(all)).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel, w, ticks: 5 });
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10)).select('.domain').remove();
    const rnd = d3.randomLcg(7);
    for (const gr of spec.groups) {
      const v = (gr.values || []).slice().sort(d3.ascending);
      const B = gr.box;
      const q1 = B ? B.q1 : d3.quantile(v, 0.25), q2 = B ? B.median : d3.quantile(v, 0.5), q3 = B ? B.q3 : d3.quantile(v, 0.75);
      const iqr = q3 - q1, lo = B ? B.whisker_low : d3.min(v.filter((d) => d >= q1 - 1.5 * iqr)), hi = B ? B.whisker_high : d3.max(v.filter((d) => d <= q3 + 1.5 * iqr));
      const cx = x(gr.label) + x.bandwidth() / 2, bw = x.bandwidth();
      if (B) g.append('rect').attr('x', cx - bw * 0.28).attr('width', bw * 0.56).attr('y', y(q3)).attr('height', y(q1) - y(q3)).attr('fill', gr.color).attr('opacity', 0.35).attr('rx', 3);
      g.selectAll(null).data(v).join('circle').attr('cx', () => cx + (rnd() - 0.5) * bw * 0.8).attr('cy', (d) => y(d)).attr('r', 2.2).attr('fill', gr.color).attr('opacity', 0.45);
      g.append('line').attr('x1', cx).attr('x2', cx).attr('y1', y(lo)).attr('y2', y(hi)).attr('stroke', INK);
      g.append('rect').attr('x', cx - bw * 0.28).attr('width', bw * 0.56).attr('y', y(q3)).attr('height', y(q1) - y(q3)).attr('fill', 'rgba(255,255,255,0.75)').attr('stroke', INK).attr('rx', 3);
      g.append('line').attr('x1', cx - bw * 0.28).attr('x2', cx + bw * 0.28).attr('y1', y(q2)).attr('y2', y(q2)).attr('stroke', INK).attr('stroke-width', 2.2);
      g.append('rect').attr('x', x(gr.label)).attr('width', bw).attr('y', 0).attr('height', h).attr('fill', 'transparent')
        .on('pointermove', (ev) => T().show(`<div class="tt-h">${gr.label}</div>${row('n', gr.n ?? v.length)}${row('median', q2.toFixed(spec.digits ?? 1))}${row('IQR', `${q1.toFixed(spec.digits ?? 1)}–${q3.toFixed(spec.digits ?? 1)}`)}`, ev.clientX, ev.clientY))
        .on('pointerleave', () => T().hide());
    }
    statLines(g, spec.stat, w);
  });
}

// ------------------------------------------------------------------ 100% stacked bars
// spec: {rows:[{label, values:{k:v}, n?}], keys, colors, orient:'v'|'h', ylabel, showPct:true, minLabel:0.08}
export function stack100(el, spec) {
  const horiz = spec.orient === 'h';
  return frame(el, Object.assign(horiz ? { height: spec.rows.length * (spec.barH || 30) + 40, margin: { left: spec.labelW || 110, right: 12, top: 6, bottom: 30 } }
    : { aspect: 0.8, margin: { left: 48, right: 12, top: 10, bottom: 46 } }, spec), ({ g, w, h }) => {
    const cat = d3.scaleBand().domain(spec.rows.map((r) => r.label)).range(horiz ? [0, h] : [0, w]).padding(spec.pad ?? 0.28);
    const val = d3.scaleLinear().domain([0, 1]).range(horiz ? [0, w] : [h, 0]);
    if (horiz) {
      g.append('g').attr('class', 'axis').call(d3.axisLeft(cat).tickSize(0).tickPadding(10)).select('.domain').remove();
      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(val).ticks(5, '.0%').tickSize(4).tickSizeOuter(0));
    } else {
      axisLeft(g, val, { label: spec.ylabel, w, ticks: 4, fmtv: '.0%' });
      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(cat).tickSize(0).tickPadding(10)).select('.domain').remove();
    }
    for (const r of spec.rows) {
      const tot = spec.keys.reduce((a, k) => a + (r.values[k] || 0), 0) || 1;
      let acc = 0;
      for (const k of spec.keys) {
        const v = (r.values[k] || 0) / tot; if (v <= 0) continue;
        const a0 = acc, a1 = acc + v; acc = a1;
        const rect = horiz
          ? g.append('rect').attr('y', cat(r.label)).attr('height', cat.bandwidth()).attr('x', val(a0) + 1).attr('width', Math.max(0, val(a1) - val(a0) - 2))
          : g.append('rect').attr('x', cat(r.label)).attr('width', cat.bandwidth()).attr('y', val(a1) + 1).attr('height', Math.max(0, val(a0) - val(a1) - 2));
        rect.attr('fill', spec.colors[k]).attr('rx', 2)
          .on('pointermove', (ev) => T().show(`<div class="tt-h">${r.label}</div>` + spec.keys.filter((kk) => r.values[kk]).map((kk) => row(`<span class="chip" style="--c:${spec.colors[kk]}">${kk}</span>`, `${((100 * r.values[kk]) / tot).toFixed(1)}%`)).join('') + (r.n ? row('n', r.n) : ''), ev.clientX, ev.clientY))
          .on('pointerleave', () => T().hide());
        if (spec.showPct !== false && v >= (spec.minLabel ?? 0.08)) {
          const dark = d3.hsl(spec.colors[k]).l < 0.55;
          const t = g.append('text').attr('text-anchor', 'middle').attr('dy', '0.32em').style('fill', dark ? '#fff' : INK).style('font-size', '11px').style('pointer-events', 'none').text(`${Math.round(v * 100)}`);
          if (horiz) t.attr('x', (val(a0) + val(a1)) / 2).attr('y', cat(r.label) + cat.bandwidth() / 2);
          else t.attr('x', cat(r.label) + cat.bandwidth() / 2).attr('y', (val(a0) + val(a1)) / 2);
        }
      }
    }
  });
}

// ------------------------------------------------------------------ dumbbell (two states per feature)
// spec: {rows:[{label, a, b, group?}], aLabel, bLabel, aColor, bColor, xlabel}
export function dumbbell(el, spec) {
  const groups = [...new Set(spec.rows.map((r) => r.group || ''))];
  const nrow = spec.rows.length + groups.filter(Boolean).length;
  return frame(el, Object.assign({ height: nrow * 26 + 56, margin: { left: spec.labelW || 170, right: 20, top: 24, bottom: 36 } }, spec), ({ g, w, h }) => {
    const ext = d3.extent(spec.rows.flatMap((r) => [r.a, r.b]));
    const x = d3.scaleLinear().domain(spec.domain || [Math.min(0, ext[0]), Math.max(0, ext[1])]).nice().range([0, w]);
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickSize(4).tickSizeOuter(0));
    g.append('text').attr('class', 'axis-title').attr('x', w / 2).attr('y', h + 32).attr('text-anchor', 'middle').text(spec.xlabel || '');
    g.insert('g', ':first-child').attr('class', 'grid').selectAll('line').data(x.ticks(5)).join('line').attr('x1', (d) => x(d)).attr('x2', (d) => x(d)).attr('y1', 0).attr('y2', h);
    if (x.domain()[0] < 0) g.append('line').attr('class', 'ref').attr('x1', x(0)).attr('x2', x(0)).attr('y1', 0).attr('y2', h);
    const step = h / nrow;
    let k = 0;
    for (const gname of groups) {
      if (gname) { g.append('text').attr('x', -spec.labelW + 4 || -166).attr('y', k * step + step / 2).attr('dy', '0.32em').style('font-weight', 600).style('fill', INK).text(gname); k++; }
      for (const r of spec.rows.filter((rr) => (rr.group || '') === gname)) {
        const yy = k * step + step / 2;
        g.append('text').attr('x', -10).attr('y', yy).attr('dy', '0.32em').attr('text-anchor', 'end').attr('class', 'lab').style('font-weight', 400).html(r.label);
        g.append('line').attr('x1', x(r.a)).attr('x2', x(r.b)).attr('y1', yy).attr('y2', yy).attr('stroke', LIGHT).attr('stroke-width', 3).attr('stroke-linecap', 'round');
        g.append('circle').attr('cx', x(r.a)).attr('cy', yy).attr('r', 6).attr('fill', spec.aColor).attr('stroke', '#fff').attr('stroke-width', 1.5);
        g.append('circle').attr('cx', x(r.b)).attr('cy', yy).attr('r', 6).attr('fill', spec.bColor).attr('stroke', '#fff').attr('stroke-width', 1.5);
        g.append('rect').attr('x', -spec.labelW || -170).attr('width', w + (spec.labelW || 170)).attr('y', yy - step / 2).attr('height', step).attr('fill', 'transparent')
          .on('pointermove', (ev) => T().show(`<div class="tt-h">${r.label}</div>${row(`<span class="chip" style="--c:${spec.aColor}">${spec.aLabel}</span>`, r.a.toFixed(2))}${row(`<span class="chip" style="--c:${spec.bColor}">${spec.bLabel}</span>`, r.b.toFixed(2))}${r.src ? row('Source', r.src) : ''}`, ev.clientX, ev.clientY))
          .on('pointerleave', () => T().hide());
        k++;
      }
    }
    // key
    const key = g.append('g').attr('transform', `translate(${-(spec.labelW || 170) + 6},-14)`);
    [[spec.aLabel, spec.aColor], [spec.bLabel, spec.bColor]].forEach(([l, c], i) => {
      const t = key.append('g').attr('transform', `translate(${i * 90},0)`);
      t.append('circle').attr('r', 5).attr('fill', c); t.append('text').attr('x', 10).attr('dy', '0.32em').attr('class', 'lab').text(l);
    });
  });
}

// ------------------------------------------------------------------ violins
// spec: {groups:[{label, color, q:[p5,p25,p50,p75,p95], kde:{x,y}, n}], refs:[{y,label,color}], ylabel, ydomain}
export function violins(el, spec) {
  return frame(el, Object.assign({ aspect: 0.5, margin: { left: 52, right: 70, top: 14, bottom: 40 } }, spec), ({ g, w, h }) => {
    const x = d3.scaleBand().domain(spec.groups.map((d) => d.label)).range([0, w]).padding(0.18);
    const y = d3.scaleLinear().domain(spec.ydomain || [0, d3.max(spec.groups, (d) => d3.max(d.kde.x))]).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel, w, ticks: 5 });
    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10)).select('.domain').remove();
    for (const r of spec.refs || []) {
      g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(r.y)).attr('y2', y(r.y)).attr('stroke', r.color || MUTED).attr('stroke-dasharray', '4 3');
      g.append('text').attr('x', w + 6).attr('y', y(r.y)).attr('dy', '0.32em').attr('class', 'stat').style('fill', r.color || MUTED).text(r.label);
    }
    for (const gr of spec.groups) {
      const cx = x(gr.label) + x.bandwidth() / 2, half = x.bandwidth() / 2;
      const dmax = d3.max(gr.kde.y) || 1;
      const area = d3.area().x0((d) => cx - (d[1] / dmax) * half).x1((d) => cx + (d[1] / dmax) * half).y((d) => y(d[0])).curve(d3.curveBasis);
      g.append('path').attr('d', area(gr.kde.x.map((v, i) => [v, gr.kde.y[i]]))).attr('fill', gr.color).attr('opacity', 0.85);
      const [p5, p25, p50, p75, p95] = gr.q;
      g.append('line').attr('x1', cx).attr('x2', cx).attr('y1', y(p5)).attr('y2', y(p95)).attr('stroke', INK);
      g.append('rect').attr('x', cx - 5).attr('width', 10).attr('y', y(p75)).attr('height', Math.max(1, y(p25) - y(p75))).attr('fill', '#fff').attr('stroke', INK).attr('rx', 2);
      g.append('line').attr('x1', cx - 5).attr('x2', cx + 5).attr('y1', y(p50)).attr('y2', y(p50)).attr('stroke', INK).attr('stroke-width', 2);
      g.append('rect').attr('x', x(gr.label)).attr('width', x.bandwidth()).attr('height', h).attr('fill', 'transparent')
        .on('pointermove', (ev) => T().show(`<div class="tt-h">${gr.label}</div>${gr.n ? row('Cells', fmt.int(gr.n)) : ''}${row('Median', p50.toFixed(3))}${row('IQR', `${p25.toFixed(3)}–${p75.toFixed(3)}`)}${gr.extra || ''}`, ev.clientX, ev.clientY))
        .on('pointerleave', () => T().hide());
    }
  });
}

// ------------------------------------------------------------------ volcano (canvas points + SVG labels)
// spec: {genes:[{g, x, y, cls}], colors:{cls: color}, highlight:[genes], xlabel, ylabel, ycap, search:true}
export function volcano(el, spec) {
  return frame(el, Object.assign({ aspect: 0.72, margin: { left: 52, right: 16, top: 12, bottom: 44 } }, spec), ({ svg, g, w, h, m, width, height }) => {
    const genes = spec.genes;
    const x = d3.scaleLinear().domain(spec.xdomain || d3.extent(genes, (d) => d.x)).nice().range([0, w]);
    const y = d3.scaleLinear().domain([0, spec.ycap || d3.max(genes, (d) => d.y)]).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel, w, ticks: 5 });
    axisBottom(g, x, h, { label: spec.xlabel });
    const fo = g.append('foreignObject').attr('width', w).attr('height', h);
    const cv = document.createElement('canvas'); const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    fo.node().appendChild(cv);
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const ordered = genes.slice().sort((a, b) => (a.cls === 'ns') - (b.cls === 'ns')).reverse();
    for (const d of ordered) {
      c.fillStyle = spec.colors[d.cls] || '#CBD5E1'; c.globalAlpha = d.cls === 'ns' ? 0.5 : 0.75;
      c.beginPath(); c.arc(x(d.x), y(Math.min(d.y, spec.ycap || Infinity)), d.cls === 'ns' ? 1.6 : 2.2, 0, 7); c.fill();
    }
    const hl = genes.filter((d) => (spec.highlight || []).includes(d.g));
    const lab = g.append('g');
    const place = (list) => {
      lab.selectAll('*').remove();
      const pts = list.map((d) => ({ d, px: x(d.x), py: y(Math.min(d.y, spec.ycap || Infinity)) }));
      for (const p of pts) lab.append('circle').attr('cx', p.px).attr('cy', p.py).attr('r', 5).attr('fill', spec.colors[p.d.cls] || INK).attr('stroke', INK).attr('stroke-width', 1.2);
      // labels to the outer side of each point, spread apart vertically within each side
      for (const side of [-1, 1]) {
        const grp = pts.filter((p) => (p.d.x >= 0 ? 1 : -1) === side).sort((a, b) => a.py - b.py);
        let last = -Infinity;
        for (const p of grp) { p.ly = Math.max(p.py, last + 13); last = p.ly; }
        for (let i = grp.length - 1, lim = h - 4; i >= 0; i--) { if (grp[i].ly > lim) grp[i].ly = lim; lim = grp[i].ly - 13; }
        for (const p of grp) {
          const est = p.d.g.length * 6.6;
          const lx = side > 0 ? Math.min(w - est - 2, p.px + 26) : Math.max(est + 8, p.px - 26);
          lab.append('line').attr('x1', p.px + side * 5).attr('y1', p.py).attr('x2', lx - side * 2).attr('y2', p.ly).attr('stroke', '#94A3B8').attr('stroke-width', 0.8);
          lab.append('text').attr('x', lx).attr('y', p.ly).attr('dy', '0.32em').attr('text-anchor', side > 0 ? 'start' : 'end').attr('class', 'lab gene').style('font-style', 'italic').text(p.d.g);
        }
      }
    };
    place(hl);
    if (spec.ycap) g.append('text').attr('class', 'stat').attr('x', 4).attr('y', y(spec.ycap) - 4).style('fill', MUTED).text(`capped at ${spec.ycap}`);
    // hover nearest gene
    const qt = d3.quadtree(genes, (d) => x(d.x), (d) => y(Math.min(d.y, spec.ycap || Infinity)));
    g.append('rect').attr('width', w).attr('height', h).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px, py] = d3.pointer(ev); const d = qt.find(px, py, 14);
        if (d) T().show(`<div class="tt-h"><i>${d.g}</i></div>${row('log₂ fold change', d.x.toFixed(2))}${row('−log₁₀ adj. p', d.y.toFixed(1))}${d.note ? row('', d.note) : ''}`, ev.clientX, ev.clientY); else T().hide();
      })
      .on('pointerleave', () => T().hide());
    if (spec.searchInput) spec.searchInput.oninput = (e) => {
      const v = e.target.value.trim().toUpperCase();
      const hit = v ? genes.filter((d) => d.g.toUpperCase() === v) : [];
      place(hit.length ? [...hl, ...hit] : hl);
    };
  });
}

// ------------------------------------------------------------------ scatter with fit
// spec: {points:[[x,y]], color, xlabel, ylabel, stat, fit:true}
export function scatter(el, spec) {
  return frame(el, Object.assign({ aspect: 0.85, margin: { left: 52, right: 12, top: 22, bottom: 44 } }, spec), ({ g, w, h }) => {
    const x = d3.scaleLinear().domain(spec.xdomain || d3.extent(spec.points, (d) => d[0])).nice().range([0, w]);
    const y = d3.scaleLinear().domain(spec.ydomain || d3.extent(spec.points, (d) => d[1])).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel, w, ticks: 5 });
    axisBottom(g, x, h, { label: spec.xlabel, ticks: 5 });
    g.selectAll(null).data(spec.points).join('circle').attr('cx', (d) => x(d[0])).attr('cy', (d) => y(d[1])).attr('r', 3.2).attr('fill', spec.color || MUTED).attr('opacity', 0.55);
    if (spec.fit !== false) {
      const xs = spec.points.map((d) => d[0]), ys = spec.points.map((d) => d[1]);
      const mx = d3.mean(xs), my = d3.mean(ys);
      const b = d3.sum(xs, (v, i) => (v - mx) * (ys[i] - my)) / d3.sum(xs, (v) => (v - mx) ** 2), a = my - b * mx;
      const [x0, x1] = x.domain();
      g.append('line').attr('x1', x(x0)).attr('x2', x(x1)).attr('y1', y(a + b * x0)).attr('y2', y(a + b * x1)).attr('stroke', spec.lineColor || spec.color || INK).attr('stroke-width', 2);
    }
    if (spec.stat) g.append('text').attr('class', 'stat').attr('x', 4).attr('y', -6).text(spec.stat);
  });
}

// ------------------------------------------------------------------ unit chart (one square per unit)
// spec: {units:[{key, color, label}], cols, size, legend}
export const cardHeight = (el, fallback) => { const b = el.closest('[data-ch]'); return b ? +b.dataset.ch : fallback; };
export function units(el, spec) {
  el.classList.add('chart');
  const render = () => {
    const width = el.clientWidth, s = spec.size || 12, gap = 3;
    const cols = Math.max(10, Math.floor((width + gap) / (s + gap)));
    const rows = Math.ceil(spec.units.length / cols);
    if (el._svg && el._svg.parentNode === el) el._svg.remove(); else el.innerHTML = '';
    const svg = d3.select(el).insert('svg', ':first-child').attr('width', width).attr('height', rows * (s + gap));
    el._svg = svg.node();
    svg.selectAll('rect').data(spec.units).join('rect').attr('x', (d, i) => (i % cols) * (s + gap)).attr('y', (d, i) => Math.floor(i / cols) * (s + gap))
      .attr('width', s).attr('height', s).attr('rx', 2.5).attr('fill', (d) => d.color)
      .on('pointermove', (ev, d) => d.label && T().show(d.label, ev.clientX, ev.clientY)).on('pointerleave', () => T().hide());
  };
  render();
  new ResizeObserver(render).observe(el);
}

// ------------------------------------------------------------------ dot matrix (genes × comparisons)
// spec: {cols:[{key,label,group}], rows:[{key,label,group}], cells:{`${row}|${col}`: {v, pct, sig, x}}, map, vmax}
export function dotmatrix(el, spec) {
  const rowH = spec.rowH || 26;
  el.style.overflowX = 'auto';
  spec = { ...spec, minWidth: spec.minWidth || (spec.labelW || 150) + spec.cols.length * 24 + 20 };
  return frame(el, Object.assign({ height: spec.rows.length * rowH + 88, margin: { left: spec.labelW || 150, right: 16, top: 16, bottom: 70 } }, spec), ({ g, w, h }) => {
    const x = d3.scaleBand().domain(spec.cols.map((c) => c.key)).range([0, w]).padding(0.05);
    const y = d3.scaleBand().domain(spec.rows.map((r) => r.key)).range([0, h]).padding(0.05);
    const col = d3.scaleLinear().domain([-spec.vmax, 0, spec.vmax]).range(['#244877', '#F7F6F5', '#9C3409']).clamp(true);
    const rmax = Math.min(x.bandwidth(), y.bandwidth()) / 2 - 1;
    // column groups shading
    let prev = null;
    spec.cols.forEach((c, i) => { if (c.shade) g.append('rect').attr('x', x(c.key)).attr('y', 0).attr('width', x.bandwidth()).attr('height', h).attr('fill', '#F6F2EC'); });
    for (const r of spec.rows) for (const c of spec.cols) {
      const d = spec.cells[`${r.key}|${c.key}`]; if (!d) continue;
      const cx = x(c.key) + x.bandwidth() / 2, cy = y(r.key) + y.bandwidth() / 2;
      if (d.x) { g.append('text').attr('x', cx).attr('y', cy).attr('dy', '0.35em').attr('text-anchor', 'middle').style('fill', MUTED).text('×'); continue; }
      g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', Math.max(1.5, Math.sqrt(Math.max(0, d.pct ?? 1)) * rmax)).attr('fill', col(d.v))
        .attr('stroke', d.sig ? INK : 'none').attr('stroke-width', 1.2)
        .on('pointermove', (ev) => T().show(`<div class="tt-h"><i>${c.label}</i> · ${r.label}</div>${row('Standardized effect', d.v.toFixed(2))}${d.pct != null ? row('% expressing', `${Math.round(d.pct * 100)}%`) : ''}${row('Significant', d.sig ? 'yes' : 'no')}`, ev.clientX, ev.clientY))
        .on('pointerleave', () => T().hide());
    }
    g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickFormat((k) => spec.rows.find((r) => r.key === k).label).tickSize(0).tickPadding(8)).select('.domain').remove();
    const ax = g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickFormat((k) => spec.cols.find((c) => c.key === k).label).tickSize(0).tickPadding(6));
    ax.select('.domain').remove();
    ax.selectAll('text').style('font-style', 'italic').each(function () { rotateTick(this, -45); });
  });
}

// ------------------------------------------------------------------ grouped boxes (categories × groups)
// spec: {categories:[{label, groups:[{label, color, values}]}], ylabel, ydomain}
export function groupedBox(el, spec) {
  return frame(el, Object.assign({ aspect: 0.75, margin: { left: 52, right: 8, top: 14, bottom: 52 } }, spec), ({ g, w, h }) => {
    const x0 = d3.scaleBand().domain(spec.categories.map((c) => c.label)).range([0, w]).paddingInner(0.18);
    const gl = spec.categories[0].groups.map((d) => d.label);
    const x1 = d3.scaleBand().domain(gl).range([0, x0.bandwidth()]).padding(0.12);
    const y = d3.scaleLinear().domain(spec.ydomain || [0, d3.max(spec.categories.flatMap((c) => c.groups.flatMap((d) => d.values)))]).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel, w, ticks: 5 });
    const rnd = d3.randomLcg(5);
    for (const c of spec.categories) {
      const gx = x0(c.label);
      const fits = c.label.length * 7.2 < x0.bandwidth();
      g.append('text').attr('x', gx + x0.bandwidth() / 2).attr('y', h + 32).attr('text-anchor', 'middle').attr('class', 'lab').text(fits || !c.short ? c.label : c.short).append('title').text(c.label);
      if (c.n != null) g.append('text').attr('x', gx + x0.bandwidth() / 2).attr('y', h + 46).attr('text-anchor', 'middle').attr('class', 'stat').style('fill', MUTED).text(`n = ${c.n}`);
      for (const d of c.groups) {
        const v = d.values.slice().sort(d3.ascending);
        const cx = gx + x1(d.label) + x1.bandwidth() / 2, bw = x1.bandwidth();
        const q1 = d3.quantile(v, 0.25), q2 = d3.quantile(v, 0.5), q3 = d3.quantile(v, 0.75);
        g.selectAll(null).data(v).join('circle').attr('cx', () => cx + (rnd() - 0.5) * bw * 0.7).attr('cy', (t) => y(t)).attr('r', 2.2).attr('fill', d.color).attr('opacity', 0.55);
        g.append('rect').attr('x', cx - bw * 0.36).attr('width', bw * 0.72).attr('y', y(q3)).attr('height', Math.max(1, y(q1) - y(q3))).attr('fill', 'rgba(255,255,255,0.6)').attr('stroke', INK).attr('rx', 3);
        g.append('line').attr('x1', cx - bw * 0.36).attr('x2', cx + bw * 0.36).attr('y1', y(q2)).attr('y2', y(q2)).attr('stroke', INK).attr('stroke-width', 2.2);
        g.append('text').attr('x', cx).attr('y', h + 14).attr('text-anchor', 'middle').attr('class', 'stat').style('fill', d.color === '#E6A141' ? '#B07418' : d.color).style('font-size', '10.5px').text(d.label);
        g.append('rect').attr('x', cx - bw / 2).attr('width', bw).attr('height', h).attr('fill', 'transparent')
          .on('pointermove', (ev) => T().show(`<div class="tt-h">${c.label} · ${d.label}</div>${row('Samples', v.length)}${row('Median', `${q2.toFixed(1)}%`)}${row('IQR', `${q1.toFixed(1)}–${q3.toFixed(1)}%`)}`, ev.clientX, ev.clientY))
          .on('pointerleave', () => T().hide());
      }
    }
  });
}

// ------------------------------------------------------------------ scatter with several series, each with its own fit
export function scatterMulti(el, spec) {
  return frame(el, Object.assign({ aspect: 0.85, margin: { left: 52, right: 12, top: 12, bottom: 44 } }, spec), ({ g, w, h }) => {
    const all = spec.series.flatMap((s) => s.points);
    const x = d3.scaleLinear().domain(d3.extent(all, (d) => d[0])).nice().range([0, w]);
    const y = d3.scaleLinear().domain(d3.extent(all, (d) => d[1])).nice().range([h, 0]);
    axisLeft(g, y, { label: spec.ylabel, w, ticks: 5 });
    axisBottom(g, x, h, { label: spec.xlabel, ticks: 5 });
    for (const s of spec.series) {
      g.append('g').selectAll('circle').data(s.points).join('circle').attr('cx', (d) => x(d[0])).attr('cy', (d) => y(d[1])).attr('r', 3).attr('fill', s.color).attr('opacity', 0.5);
      const xs = s.points.map((d) => d[0]), ys = s.points.map((d) => d[1]), mx = d3.mean(xs), my = d3.mean(ys);
      const b = d3.sum(xs, (v, i) => (v - mx) * (ys[i] - my)) / d3.sum(xs, (v) => (v - mx) ** 2), a = my - b * mx;
      const [x0, x1] = d3.extent(xs);
      g.append('line').attr('x1', x(x0)).attr('x2', x(x1)).attr('y1', y(a + b * x0)).attr('y2', y(a + b * x1)).attr('stroke', s.color).attr('stroke-width', 2);
    }
  });
}
