// Full article: text from article.json, figures redrawn as panel groups beside the paragraphs that
// cite them, citation pop-ups, cross-reference links, supplementary figures, methods, references.
import { el, whenVisible, seg, asset, pageRoot } from './core.js?v=b5261aa92c';
import { chrome, authorLine, lightbox } from './chrome.js?v=b5261aa92c';
import { hero as heroImage } from './hero.js?v=b5261aa92c';
import { epiViewer, atlasViewer, tissueViewer, TISSUE_STEPS } from './viewers.js?v=b5261aa92c';
import { REGISTRY as P, setFigureOpener } from './panels.js?v=b5261aa92c';
import * as X from './panels-extra.js?v=b5261aa92c';

const $ = (s) => document.querySelector(s);

// ------------------------------------------------------------------ figure bands
// Each band holds the panels first cited in one sentence; it is placed right after that sentence and the
// paragraph continues below it. card(letters, columns of 12, title, subtitle, builder, {ch: chart height px})
const card = (letters, w, title, sub, build, o = {}) => ({ letters, w, title, sub, build, ...o });
const stack = (w, cards) => ({ stack: cards, w });
const BANDS = [
  { fig: 1, at: '1a', rows: [[
    card('a', 7, 'The atlas: 1,980,703 cells from 13 studies', 'UMAP; colour by cell type, study, site or treatment', (h) => viewerBox(h, atlasViewer), { ch: 520 }),
    card('b–e', 5, 'Studies in the atlas', 'Cells and patients per study; composition by site, treatment and cell type', X.studyBars)]] },
  { fig: 1, at: '1f', rows: [[
    card('f, h–j', 7, 'Epithelial compartment: 575,366 cells', 'Colour by state, NMF program usage or gene expression', (h) => viewerBox(h, (v, c, k) => epiViewer(v, c, k, { extraModes: [['g2m', 'G2M'], ['ap1', 'AP-1'], ['ifn', 'IFN'], ['emt', 'EMT']] })), { ch: 520 }),
    stack(5, [
      card('g', 0, 'Polarization is the leading axis', 'PC most aligned with polarization, one square per sample (n = 250)', P.pcRank),
      card('k', 0, 'Epithelial states in every study', '% of epithelium', X.studyStates)])]] },
  { fig: 1, at: '1l', rows: [[
    card('l', 6, 'All three states within single clones', 'Copy-number clones (CopyKAT) in three tumours', P.clones, { ch: 230 }),
    card('m', 6, 'Polarization within each clone', 'SecB program usage per clone; dashed: atlas thresholds', X.cloneViolins, { ch: 230 })]] },
  { fig: 2, at: '2a', rows: [[
    card('a', 12, 'Growth programs in SecA, adaptation programs in SecB', 'Inferred activity per state (scaled), by method', X.programsGrid)]] },
  { fig: 2, at: '2c', rows: [[
    card('c', 4, 'State composition by site', 'Treatment-naive samples', P.siteStack, { ch: 290 }),
    card('d', 4, 'Patient-matched sites', 'SecB, % of epithelium (n = 14)', P.siteMatched, { ch: 290 }),
    card('e', 4, 'Before and after chemotherapy', 'SecB, % of epithelium (n = 18)', P.treatMatched, { ch: 290 })]] },
  { fig: 2, at: '2f', rows: [[
    card('f', 5, 'States by molecular subtype', 'Pre-treatment primary tumours (consensusOV)', P.subtypes, { ch: 400 }),
    card('g', 7, 'SecA versus SecB genes', 'Pseudobulk DESeq2; signature genes labelled', P.volcano2g, { ch: 352 })]] },
  { fig: 3, at: '3a', rows: [[
    card('a', 4, 'Eight organoid lines', 'snRNA-seq UMAP, 10,455 cells', X.pdoUmap, { ch: 300 }),
    card('b', 8, 'Organoids lack SecB', 'SecB UCell score per cell; dashed: atlas medians', (h) => P.pdo(h), { ch: 332 })]] },
  { fig: 3, at: '3c', rows: [[
    card('c', 3, 'Days in culture', 'OPTO98', (h) => P.opto(h, { which: 'c' }), { ch: 260 }),
    card('d', 4, 'Cytokines', 'OPTO98, 6 days', (h) => P.opto(h, { which: 'd' }), { ch: 260 }),
    card('e', 5, 'Media', 'OPTO98, 6 days', (h) => P.opto(h, { which: 'e' }), { ch: 260 })]] },
  { fig: 3, at: '3f', rows: [[
    card('f', 7, 'No model reaches the SecB corner', 'Marker score against function score (HIF induction − proliferation)', P.modelScatter, { ch: 400 }),
    card('g, h', 5, 'HIF induction without quiescence', 'Per model; dashed: atlas SecB', X.hifQuiescence, { ch: 440 })]] },
  { fig: 3, at: '3i', rows: [[
    card('i', 4, 'KPCA.B orthotopic tumour', 'scRNA-seq, 20,598 cells', X.kpcaUmap, { ch: 300 }),
    card('j, k', 4, 'Tumour cells', 'Polarization and Krt7, 12,429 cells', X.kpcaEpi, { ch: 300 }),
    card('l', 4, 'Krt7 at the lumen', 'KRT7 immunohistochemistry, day 26', X.ihc)]] },
  { fig: 4, at: '4a', rows: [[
    card('a', 12, 'Composition of every profiled unit', '15 fallopian tubes, 8 whole tumours and 378 TMA patients, ordered by clustering', X.composition4a, { ch: 280 })]] },
  { fig: 4, at: '4b', rows: [[
    card('b, c, h, j', 8, 'WT01, cell by cell', 'Switch layers; zoom in for segmented cells', (h) => tissueBox(h, ['celltype', 'polar', 'vessel', 'hypoxia']), { ch: 470 }),
    stack(4, [
      card('d', 0, 'SecA and SecB segregate', "Bivariate Moran's I", P.moran, { ch: 210 }),
      card('e', 0, 'SecB cells cluster', 'Neighbourhood assignment (BiLISA)', P.bilisa)])]] },
  { fig: 4, at: '4f', rows: [[
    card('f', 4, 'The environment along the axis', 'GAMs, secretory cells of 8 tumours', P.gamEnv, { ch: 270 }),
    card('g', 4, 'Far from vessels', 'Distance to nearest vessel (µm)', X.pairWithTMA('fig4', 'g', 'µm'), { ch: 270 }),
    card('i', 4, 'In sparser tissue', 'Cells per mm² within 50 µm', X.pairWithTMA('fig4', 'i', 'cells / mm²'), { ch: 270 })]] },
  { fig: 5, at: '5a', rows: [[
    card('a', 7, 'Growth programs fall, survival programs rise', 'Cell-intrinsic UCell scores, GAMs over 8 tumours', P.gamEpi, { ch: 330 }),
    card('b', 5, 'SecB nuclei are smaller', 'Nuclear area (µm²)', X.pairWithTMA('fig5', 'b', 'µm²'), { ch: 330 })], [
    card('c, d', 12, 'The programs in tissue', 'WT01 secretory cells; zoom in for segmented cells', (h) => tissueBox(h, ['celltype', 'glycolysis', 'proliferation', 'LDHA', 'nfkb'], 'fig5c'), { ch: 460 })]] },
  { fig: 5, at: '5e', rows: [[
    card('f', 12, 'Macrophages rise and B cells fall with hypoxia', '% of non-epithelial cells within 50 µm against local epithelial hypoxia (z); thin lines: each tumour', P.immune, { ch: 200 })], [
    card('e, g, h', 12, 'One tissue-microarray core', 'TMA-P003: cell types (e), hypoxia (g) and selected cell types (h); box: the SecB-enriched hypoxic region', X.tmaCoreMaps)]] },
  { fig: 5, at: '5i', rows: [[
    card('i', 7, 'Macrophages adopt the SecB program', 'Macrophage-intrinsic program scores against local polarization', P.gamMac, { ch: 300 }),
    card('j', 5, 'Larger macrophages in SecB niches', 'Median macrophage area (µm²)', X.pairWithTMA('fig5', 'j', 'µm²'), { ch: 300 })]] },
  { fig: 6, at: '6a', rows: [[
    card('a–d', 7, 'Visium HD of WT01', '16 µm bins, whole transcriptome', X.visium, { ch: 400 }),
    card('e', 5, 'Macrophages at SecB borders', 'SecB-niche vs distal macrophage bins', P.volcano6e, { ch: 400 })]] },
  { fig: 6, at: '6f', rows: [[
    card('f', 7, 'A hypoxic macrophage state in the atlas', 'Macrophage subtypes (295,296 cells) and the Xenium niche contrast', X.dot6f),
    card('g', 5, 'Hypoxic macrophages sit with SecB cells', 'SecB % of epithelium within 50 µm', X.pairWithTMA('fig6_spatial', 'g', '%'), { ch: 236 })]] },
  { fig: 6, at: '6h', rows: [[
    card('h', 12, 'Cross-platform concordance', 'Standardized effect (colour), % expressing (size), significance (outline)', P.concordance)], [
    card('i', 12, 'The signals in tissue', 'WT02 region (700 µm): macrophage genes in macrophages, epithelial genes in epithelium; other cells grey', X.roi6i)]] },
  { fig: 7, at: '7a', rows: [[
    card('a', 6, 'Overall survival, TMA cohort', 'Lowest vs highest polarization tertile', (h) => P.kmPanel(h, { key: 'a', ylabel: 'Overall survival' }), { ch: 330 }),
    card('b', 6, 'Progression-free survival', 'Lowest vs highest polarization tertile', (h) => P.kmPanel(h, { key: 'b', ylabel: 'Progression-free survival' }), { ch: 330 }),
  ], [
    card('c, d', 12, 'Adjusted hazard ratios', 'Per SD, adjusted for stage, residual disease and age; OS (left) and PFS (right)', X.forestPair('c', 'd'))]] },
  { fig: 7, at: '7f', atEnd: true, rows: [[
    card('f', 12, 'KRT7 and KRT19 protein track polarization', 'Per core: protein (MFI) against mean polarization; E-cadherin, KRT18 and VIM do not', (h) => P.protein(h, { key: 'f' }), { ch: 190 })]] },
  { fig: 7, at: '7g', rows: [[
    card('g', 6, 'Overall survival, TCGA-OV', 'Lowest vs highest polarization tertile', (h) => P.kmPanel(h, { key: 'g', ylabel: 'Overall survival' }), { ch: 330 }),
    card('h', 6, 'Progression-free survival', 'Lowest vs highest polarization tertile', (h) => P.kmPanel(h, { key: 'h', ylabel: 'Progression-free survival' }), { ch: 330 }),
  ], [
    card('i, j', 12, 'Polarization hazard ratios', 'Per SD: unadjusted, then adjusted for epithelial fraction, stage and age; OS (left) and PFS (right)', X.forestPair('i', 'j'))]] },
  { fig: 7, at: '7k', rows: [[
    card('k', 6, 'SecA-polarized tumours', 'ICON7: standard vs bevacizumab', (h) => P.kmPanel(h, { key: 'k', ylabel: 'Progression-free survival' }), { ch: 330 }),
    card('l', 6, 'SecB-polarized tumours', 'ICON7: standard vs bevacizumab', (h) => P.kmPanel(h, { key: 'l', ylabel: 'Progression-free survival' }), { ch: 330 }),
  ], [
    card('m, n', 12, 'Benefit only while bevacizumab is given', 'Bevacizumab hazard ratio for PFS before and after 15 months, adjusted for stage, debulking and age', P.icon7Split)]] },
];
// small single panels that float beside the text, next to the sentence that cites them
const ASIDES = [
  { fig: 2, at: '2b', card: card('b', 0, 'Most SecB cells are in G1', 'Cell-cycle phase, % of cells', P.cellcycle) },
  // after: float in the text that follows the band placed at the same citation
  { fig: 6, at: '6h', after: true, card: card('h', 0, 'Signals in the niche', 'Genes raised in SecB cells and niche macrophages, by role; hover for the evidence', P.nicheDiagram) },
  { fig: 7, at: '7e', card: card('e', 0, 'Transcript and protein agree', 'Per core (n = 157)', (h) => P.protein(h, { key: 'e' }), { ch: 230 }) },
];

let ART, META, openFig;

// jump to an element, then re-align while lazily drawn panels above it settle
function jumpTo(target, block = 'start') {
  if (!target) return;
  const go = () => target.scrollIntoView({ behavior: 'auto', block });
  go(); [350, 900, 1700].forEach((t) => setTimeout(go, t));
}

const sizeStyle = (host, aspect) => { const b = host.closest('[data-ch]'); return b ? `height:${b.dataset.ch}px` : `aspect-ratio: 1 / ${aspect}`; };
function viewerBox(host, fn, aspect = 0.85) {
  host.innerHTML = '';
  const ctl = el('div', { class: 'controls' }), v = el('div', { class: 'viewer', style: sizeStyle(host, aspect) }, '<div class="loading">Loading…</div>'), key = el('div', { class: 'legend-row' });
  host.append(ctl, v, key);
  whenVisible(v, () => fn(v, ctl, key, { wheel: 'modifier' }));
}
function tissueBox(host, steps, roi) {
  host.innerHTML = '';
  const ctl = el('div', { class: 'controls' }), v = el('div', { class: 'viewer', style: `${sizeStyle(host, 0.62)}; border:1px solid var(--border)` }, '<div class="loading">Loading WT01…</div>'), key = el('div', { class: 'legend-row', style: 'border:0' });
  host.append(ctl, v, key);
  whenVisible(v, async () => {
    const tv = await tissueViewer(v, key, { wheel: 'modifier' });
    if (!tv) return;
    seg(ctl, steps.map((s) => [s, TISSUE_STEPS[s].label]), steps[0], (s) => tv.set(s));
    if (tv.rois) {
      const z = el('div', { class: 'zoomto' }, '<span>View</span>');
      seg(z, [['home', 'Section'], ['roi', 'Region (c)'], ['cells', 'Cells']], 'home', (m) => (m === 'home' ? tv.home() : m === 'roi' ? tv.zoomRoi(roi || 'fig4c') : tv.zoomCells()));
      ctl.appendChild(z);
    }
    tv.set(steps[0], 0);
  });
}

function legendFor(fig, letters) {
  return ART.figures[fig].panels.filter((pp) => pp.panels.some((k) => letters.has(k))).map((pp) => `<p><b>(${pp.label})</b> ${pp.html}</p>`).join('');
}
function makeCard(fig, c, rowCh) {
  const f = el('figure', { class: 'pcard' });
  if (c.w) f.style.gridColumn = `span ${c.w}`;
  if (c.mid) f.style.setProperty('--mid', `span ${c.mid}`);
  const ch = c.ch ?? rowCh;
  for (const k of expandLetters(c.letters)) if (!document.getElementById(`fig${fig}${k}`)) f.insertAdjacentHTML('afterbegin', `<span class="anchor" id="fig${fig}${k}"></span>`);
  f.insertAdjacentHTML('beforeend', `<figcaption><span class="tag">${c.letters}</span><span class="ct">${c.title}</span>${c.sub ? `<span class="cs">${c.sub}</span>` : ''}</figcaption>`);
  const body = el('div', { class: 'pbody' });
  if (ch) body.dataset.ch = ch;
  f.appendChild(body);
  whenVisible(body, () => c.build(body, {}), '600px');
  return f;
}
function makeBand(b) {
  const letters = new Set(b.rows.flat().flatMap((c) => (c.stack || [c]).flatMap((x) => expandLetters(x.letters))));
  const sec = el('section', { class: 'band', id: `band-${b.at}` });
  if (!document.getElementById(`fig${b.fig}`)) sec.insertAdjacentHTML('afterbegin', `<span class="anchor" id="fig${b.fig}"></span>`);
  sec.insertAdjacentHTML('beforeend', `<header class="band-head"><span class="bn">Figure ${b.fig}<b>${rangeLabel([...letters].filter((k) => /^[a-z]$/.test(k)).sort())}</b></span><span class="bt">${ART.figures[b.fig].title}</span>
    <span class="ba"><button type="button" data-act="legend">Legend</button><button type="button" data-act="journal">Journal figure</button></span></header>`);
  for (const row of b.rows) {
    const r = el('div', { class: 'brow' });
    for (const c of row) {
      if (c.stack) {
        const col = el('div', { class: 'bstack' }); col.style.gridColumn = `span ${c.w}`;
        c.stack.forEach((x) => col.appendChild(makeCard(b.fig, x)));
        r.appendChild(col);
      } else r.appendChild(makeCard(b.fig, c, row.ch));
    }
    sec.appendChild(r);
  }
  sec.insertAdjacentHTML('beforeend', `<div class="band-legend" hidden>${legendFor(b.fig, letters)}</div>`);
  sec.querySelector('[data-act=legend]').onclick = (e) => { const l = sec.querySelector('.band-legend'); l.hidden = !l.hidden; e.target.textContent = l.hidden ? 'Legend' : 'Hide legend'; };
  sec.querySelector('[data-act=journal]').onclick = () => openFig([String(b.fig)]);
  return sec;
}
function makeAside(a) {
  const wrap = el('aside', { class: 'pfloat' });
  const c = makeCard(a.fig, a.card);
  c.insertAdjacentHTML('afterbegin', `<span class="fl">Figure ${a.fig}${a.card.letters}</span>`);
  wrap.appendChild(c);
  return wrap;
}

// ---- splitting paragraphs at the end of the sentence that cites a panel
function citing(fig, letter) {
  for (const a of document.querySelectorAll('#article a.xref.fig')) {
    for (const part of a.dataset.fig.split(';')) {
      const [code, panels] = part.split(':');
      if (code === String(fig) && (panels || '').includes(letter)) return a;
    }
  }
  return null;
}
const NOT_END = /(e\.g|i\.e|vs|al|approx|Fig|ca)\.$/;
function sentenceEnd(p, from) {
  // join the text after `from` and find the first full stop followed by a new sentence (or the paragraph end)
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  const nodes = []; let node;
  while ((node = walker.nextNode())) if (!from.contains(node) && (from.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)) nodes.push(node);
  let text = '';
  const map = [];
  for (const n of nodes) { for (let i = 0; i < n.textContent.length; i++) map.push([n, i]); text += n.textContent; }
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '.' || NOT_END.test(text.slice(Math.max(0, i - 6), i + 1))) continue;
    const after = text.slice(i + 1);
    if (/^\s+[A-Z(]/.test(after) || !after.trim()) { const [n, off] = map[i]; return { node: n, offset: off + 1 }; }
  }
  return null;
}
function splitAfter(p, at) {
  if (!at) return null;
  const r = document.createRange();
  r.setStart(at.node, at.offset); r.setEndAfter(p.lastChild);
  const rest = r.extractContents();
  if (!rest.textContent.trim()) return null;
  const q = el('p', { class: 'cont' });
  q.appendChild(rest);
  q.firstChild.nodeType === 3 && (q.firstChild.textContent = q.firstChild.textContent.replace(/^\s+/, ''));
  p.after(q);
  return q;
}
function placeFigures() {
  const items = [...BANDS.map((b) => ({ kind: 'band', b })), ...ASIDES.map((a) => ({ kind: 'aside', a }))]
    .map((it) => { const at = it.b ? it.b.at : it.a.at; return { ...it, fig: at.match(/^\d+/)[0], letter: at.slice(-1) }; });
  for (const it of items) {
    const x = citing(it.fig, it.letter);
    if (!x) { console.warn('no citation for', it.fig + it.letter); continue; }
    const p = x.closest('p');
    const cont = it.kind === 'band' && !it.b.atEnd ? splitAfter(p, sentenceEnd(p, x)) : null;
    if (it.kind === 'band') {
      // after this sentence, and after any band already placed there
      let after = p; while (after.nextElementSibling && after.nextElementSibling.classList.contains('band')) after = after.nextElementSibling;
      after.after(makeBand(it.b));
    } else {
      // beside the paragraph that discusses it, or (after) beside the text that follows the band placed there
      let target = p;
      if (it.a.after) { target = p.nextElementSibling; while (target && target.tagName !== 'P') target = target.nextElementSibling; }
      (target || p).prepend(makeAside(it.a));
    }
  }
}
function expandLetters(l) {
  const out = [];
  for (const part of l.split(/\s*,\s*/)) {
    const m = part.match(/^([a-z])\s*–\s*([a-z])$/);
    if (m) for (let c = m[1].charCodeAt(0); c <= m[2].charCodeAt(0); c++) out.push(String.fromCharCode(c)); else out.push(part.trim());
  }
  return out;
}
function rangeLabel(ls) {
  if (!ls.length) return '';
  const runs = []; let s = ls[0], prev = ls[0];
  for (const c of ls.slice(1).concat([null])) {
    if (c && c.charCodeAt(0) === prev.charCodeAt(0) + 1) { prev = c; continue; }
    runs.push(s === prev ? s : prev.charCodeAt(0) === s.charCodeAt(0) + 1 ? `${s},${prev}` : `${s}–${prev}`);
    s = prev = c;
  }
  return runs.join(',');
}

// ------------------------------------------------------------------ text
const fixLead = (h) => h.replace(/^<i>([^<]{3,80}?\.)\s*<\/i>\s*/, '<span class="lead">$1</span> ').replace(/^([A-Z][^.<]{2,60}\.)\s(?=[A-Z])/, (m, a) => (/^(Lead contact|Materials availability|Data and code availability|Human Tissues|Patient-derived organoids \(PDOs\)|Mice)\.$/.test(a) ? `<span class="lead">${a}</span> ` : m));

function render() {
  const main = $('#article');
  const toc = $('#toc');
  const tocItems = [['abstract', 'Abstract', false]];
  main.insertAdjacentHTML('beforeend', `<h2 id="abstract">Abstract</h2><div class="abstract"><p>${ART.abstract}</p></div>`);
  for (const s of ART.sections) {
    if (['acknowledgements', 'funding-statement'].includes(s.id)) continue;
    main.insertAdjacentHTML('beforeend', `<h2 id="${s.id}">${s.title}</h2>`);
    tocItems.push([s.id, s.title, false]);
    for (const b of s.blocks) {
      if (b.type === 'h3') { main.insertAdjacentHTML('beforeend', `<h3 id="${b.id}">${b.html}</h3>`); tocItems.push([b.id, b.html, true]); continue; }
      main.insertAdjacentHTML('beforeend', `<p>${b.html}</p>`);
    }
  }
  placeFigures();
  // methods
  main.insertAdjacentHTML('beforeend', '<h2 id="methods">Methods</h2>');
  tocItems.push(['methods', 'Methods', false]);
  const meth = el('div', { class: 'methods' });
  for (const s of ART.methods.filter((m) => m.blocks.length)) {
    const d = el('details', { id: `m-${s.id}` });
    d.innerHTML = `<summary>${s.title.replace(/^Methods /, '')}</summary>` + s.blocks.map((b) => (b.type === 'h3' ? `<h4>${b.html}</h4>` : /^Declaration of generative AI/.test(b.html) ? `<h4>${b.html}</h4>` : `<p>${fixLead(b.html)}</p>`)).join('');
    meth.appendChild(d);
  }
  main.appendChild(meth);
  // acknowledgements and funding
  for (const s of ART.sections.filter((x) => ['acknowledgements', 'funding-statement'].includes(x.id))) {
    main.insertAdjacentHTML('beforeend', `<h3 id="${s.id}">${s.title.replace('Funding Statement', 'Funding')}</h3>` + s.blocks.map((b) => `<p>${b.html}</p>`).join(''));
  }
  // supplementary figures
  main.insertAdjacentHTML('beforeend', '<h2 id="supplementary-figures">Supplementary figures</h2>');
  tocItems.push(['supplementary-figures', 'Supplementary figures', false]);
  const grid = el('div', { class: 'supp-grid wide' });
  Object.entries(ART.supp_figures).forEach(([n, f]) => {
    const b = el('button', { type: 'button', id: `figS${n}` }, `<img loading="lazy" src="${asset(`assets/img/supp/S${n}_thumb.jpg`)}" alt=""><span class="n">Figure S${n}</span><span class="d">${f.title}</span>`);
    b.onclick = () => openFig(Object.keys(ART.supp_figures).map((k) => `S${k}`), +n - 1);
    grid.appendChild(b);
  });
  main.appendChild(grid);
  // supplementary tables: described here, downloaded from the preprint's supplementary material on bioRxiv
  main.insertAdjacentHTML('beforeend', '<h2 id="supplementary-tables">Supplementary tables</h2>');
  tocItems.push(['supplementary-tables', 'Supplementary tables', false]);
  main.insertAdjacentHTML('beforeend', `<p>The tables are spreadsheets in the preprint's supplementary material on <a href="${META.links.biorxiv}" target="_blank" rel="noopener">bioRxiv</a>.</p>`);
  main.insertAdjacentHTML('beforeend', `<ul class="tables-list wide">${ART.tables.map((t) => `<li id="tabS${t.n}"><span class="n">Table S${t.n}</span><span><b style="font-weight:500;color:var(--navy-700)">${t.title}.</b> <span class="meta">${t.html.slice(0, 220)}${t.html.length > 220 ? '…' : ''}</span></span></li>`).join('')}</ul>`);
  // references
  main.insertAdjacentHTML('beforeend', '<h2 id="references">References</h2>');
  tocItems.push(['references', 'References', false]);
  main.insertAdjacentHTML('beforeend', `<ol class="refs">${ART.references.map((r) => `<li id="ref-${r.n}"><span class="n">${r.n}.</span><span>${r.text.replace(/\s*doi:?\S+$/i, '')} ${r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${r.doi ? 'doi.org/' + r.doi : 'link'} ↗</a>` : ''}</span></li>`).join('')}</ol>`);

  toc.innerHTML = '<div class="t">Contents</div>' + tocItems.map(([id, t, sub]) => `<a href="#${id}" class="${sub ? 'sub' : ''}" data-id="${id}">${t.replace(/<[^>]+>/g, '')}</a>`).join('')
    + '<hr><div class="t">Figures</div>' + Object.keys(ART.figures).map((n) => `<a href="#fig${n}" class="sub">Figure ${n}</a>`).join('');
  spy(tocItems.map(([id]) => id));
}

function spy(ids) {
  // the current section is the last heading above 30% of the viewport height
  const links = new Map([...document.querySelectorAll('#toc a[data-id]')].map((a) => [a.dataset.id, a]));
  const heads = ids.map((id) => document.getElementById(id)).filter(Boolean);
  let raf = 0, current = null;
  const update = () => {
    raf = 0;
    const line = innerHeight * 0.3;
    let on = heads[0];
    for (const h of heads) { if (h.getBoundingClientRect().top <= line) on = h; else break; }
    if (on && on.id !== current) { current = on.id; links.forEach((a) => a.classList.remove('on')); links.get(current)?.classList.add('on'); }
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

// ------------------------------------------------------------------ interactions: citations and cross-references
function interactions() {
  let pop = null;
  const close = () => { pop?.remove(); pop = null; };
  document.addEventListener('click', (e) => {
    const c = e.target.closest('sup.cite');
    if (c) {
      e.preventDefault(); close();
      const refs = c.dataset.refs.split(',').map(Number);
      pop = el('div', { class: 'popover', role: 'dialog' });
      pop.innerHTML = refs.map((n) => { const r = ART.references[n - 1]; return `<div class="ref"><span class="n">${n}</span>${r.text.replace(/\s*doi:?\S+$/i, '')}${r.url ? `<div style="margin-top:4px"><a href="${r.url}" target="_blank" rel="noopener">Open ↗</a> · <a href="#ref-${n}" data-jump="${n}">In references</a></div>` : ''}</div>`; }).join('');
      pageRoot().appendChild(pop);
      const r = c.getBoundingClientRect();
      pop.style.left = `${Math.min(innerWidth - pop.offsetWidth - 16, Math.max(16, r.left + scrollX - 40))}px`;
      pop.style.top = `${r.bottom + scrollY + 8}px`;
      return;
    }
    const j = e.target.closest('[data-jump]');
    if (j) { close(); const li = document.getElementById(`ref-${j.dataset.jump}`); li.classList.add('hl'); setTimeout(() => li.classList.remove('hl'), 2400); return; }
    if (pop && !e.target.closest('.popover')) close();
    const x = e.target.closest('a.xref');
    if (!x) return;
    e.preventDefault();
    if (x.dataset.tab) { jumpTo(document.getElementById(`tabS${x.dataset.tab.split(';')[0].replace('S', '')}`), 'center'); return; }
    const items = x.dataset.fig.split(';').map((s) => s.split(':'));
    const [code, panels] = items[0];
    if (code.startsWith('S')) { openFig(items.filter(([c]) => c.startsWith('S')).map(([c]) => c)); return; }
    const target = document.getElementById(`fig${code}${(panels || '')[0] || ''}`) || document.getElementById(`fig${code}`);
    if (target) {
      const p = target.closest('.pcard') || target.closest('.band');
      jumpTo(p || target, 'center');
      if (p) setTimeout(() => { p.classList.remove('flash'); void p.offsetWidth; p.classList.add('flash'); }, 1800);
    } else openFig([code]);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

// contents: a rail on wide screens, a drawer otherwise; collapsed unless the window is very wide
function contents() {
  const btn = $('#toc-toggle'), body = pageRoot();
  // into the paper bar on the lab website, else beside the logo in this site's own nav
  const slot = $('.ms-bar .ms-slot');
  if (slot) slot.append(btn); else $('#nav .mark').after(btn);
  let open;
  try { const v = localStorage.getItem('toc-open'); open = v === null ? innerWidth >= 1680 : v === '1'; } catch { open = innerWidth >= 1680; }
  const apply = () => {
    body.classList.toggle('toc-open', open);
    body.classList.toggle('toc-rail', innerWidth >= 1460);
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('span').textContent = open ? 'Hide contents' : 'Contents';
  };
  btn.onclick = () => { open = !open; try { localStorage.setItem('toc-open', open ? '1' : '0'); } catch { /* private mode */ } apply(); };
  $('#toc').addEventListener('click', (e) => { if (e.target.closest('a') && !body.classList.contains('toc-rail')) { open = false; apply(); } });
  addEventListener('resize', apply);
  apply();
}
async function main() {
  const { meta, art } = await chrome();
  ART = art; META = meta;
  $('#art-title').textContent = art.title;
  $('#hero-authors').innerHTML = authorLine(art, { affs: true });
  $('#affs').innerHTML = art.affiliations.map((a) => `<li>${a.text}</li>`).join('');
  openFig = lightbox(art, { S16: X.perTumour('S16'), S17: X.perTumour('S17'), S18: X.perTumour('S18') });
  setFigureOpener(openFig);
  heroImage($('.hero'));
  render();
  contents();
  // supplementary mentions get their own style
  document.querySelectorAll('a.xref.fig').forEach((a) => { if (/^S/.test(a.dataset.fig)) a.classList.add('supp'); });
  interactions();
  if (location.hash) setTimeout(() => jumpTo(document.getElementById(location.hash.slice(1))), 300);
  // contents links re-align too
  document.getElementById('toc').addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); jumpTo(document.getElementById(a.getAttribute('href').slice(1)));
  });
}
main();
