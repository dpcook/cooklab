// Page chrome shared by the overview and the article: links, nav, authors, citation, footer, lightbox.
import { getJSON, el, navSolidOnScroll, asset } from './core.js?v=b5261aa92c';

export async function chrome({ solidAfter } = {}) {
  const [meta, art] = await Promise.all([getJSON('data/meta.json'), getJSON('data/article.json')]);
  document.querySelectorAll('[data-link]').forEach((a) => {
    const href = meta.links[a.dataset.link];
    if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; } else a.classList.add('hide');
  });
  navSolidOnScroll(document.getElementById('nav'), solidAfter || (() => (document.querySelector('.hero')?.offsetHeight || 400) - 64));
  footer(meta, art);
  citeBox(document.getElementById('cite-box'), meta, art);
  return { meta, art };
}

export function authorLine(art, { affs = false } = {}) {
  return art.authors.map((a) => {
    const mark = a.equal ? '*' : a.corresponding ? '<sup>†</sup>' : '';
    const sup = affs ? `<sup>${a.affs.join(',')}</sup>` : '';
    return `<b>${a.name.replace(/ /g, ' ')}</b>${mark}${sup}`;
  }).join(', ') + `<br><span style="font-size:13px">*Equal contribution · <sup>†</sup>Corresponding author</span>`;
}

function citeText(meta, art) {
  const names = art.authors.map((a) => {
    const parts = a.name.replace(/ /g, ' ').split(' ');
    const last = parts.pop();
    return `${last} ${parts.map((p) => p.replace(/[^A-ZÀ-Ý]/g, '')).join('')}`;
  });
  return `${names.join(', ')}. ${meta.title}. bioRxiv ${meta.year}. doi:${meta.links.doi}`;
}
function bibtex(meta, art) {
  const authors = art.authors.map((a) => { const p = a.name.replace(/ /g, ' ').split(' '); const l = p.pop(); return `${l}, ${p.join(' ')}`; }).join(' and ');
  return `@article{nersesian${meta.year}polarized,\n  title   = {${meta.title}},\n  author  = {${authors}},\n  journal = {bioRxiv},\n  year    = {${meta.year}},\n  doi     = {${meta.links.doi}}\n}`;
}
function citeBox(box, meta, art) {
  if (!box) return;
  box.innerHTML = `<div class="meta" style="margin-bottom:8px">Cite this preprint</div><div>${citeText(meta, art)}</div>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn line" type="button" data-act="copy">Copy citation</button><button class="btn line" type="button" data-act="bib">BibTeX</button></div><pre></pre>`;
  box.querySelector('pre').textContent = bibtex(meta, art);
  box.querySelector('[data-act=copy]').onclick = async (e) => {
    try { await navigator.clipboard.writeText(box.classList.contains('show-bib') ? bibtex(meta, art) : citeText(meta, art)); e.target.textContent = 'Copied'; } catch { e.target.textContent = 'Select and copy'; }
    setTimeout(() => (e.target.textContent = 'Copy citation'), 1600);
  };
  box.querySelector('[data-act=bib]').onclick = () => box.classList.toggle('show-bib');
}

function footer(meta, art) {
  const f = document.getElementById('footer');
  if (!f) return;
  f.innerHTML = `<div class="wrap"><div class="grid">
    <div><img src="${asset('assets/img/brand/cooklab-wordmark-white.svg')}" alt="Cook Lab" style="height:30px"><div class="tagline">Decode. Design. Deliver.</div>
      <p style="margin-top:12px;max-width:30em">Improving outcomes for those with gynecologic disease. Ottawa Hospital Research Institute · University of Ottawa.</p></div>
    <div><h5>This study</h5><ul>
      <li><a href="index.html">Overview</a></li><li><a href="article.html">Full article</a></li>
      <li><a href="${meta.links.biorxiv}" target="_blank" rel="noopener">Preprint on bioRxiv ↗</a></li>
      <li><a href="${meta.links.code}" target="_blank" rel="noopener">Code on GitHub ↗</a></li>
      <li><a href="article.html#supplementary-tables">Supplementary tables</a></li></ul></div>
    <div><h5>Contact</h5><ul><li><a href="mailto:${meta.contact}">${meta.contact}</a></li><li>Cancer Research Program, OHRI<br>501 Smyth Road, Ottawa, ON</li><li><a href="${meta.links.lab}" target="_blank" rel="noopener">cooklab.ca ↗</a></li></ul>
      <p style="margin-top:16px;font-size:12.5px">Funding: ${meta.funding}</p></div>
  </div><div class="base">© ${new Date().getFullYear()} Cook Lab · Figures and text from the preprint, redrawn for the web from the study data.</div></div>`;
}

// ------------------------------------------------------------------ lightbox for journal and supplementary figures
export function lightbox(art, interactive = {}) {
  const lb = document.getElementById('lightbox');
  if (!lb) return () => {};
  let list = [], idx = 0;
  const legendHtml = (fig) => fig.panels.map((p) => `<p class="pl">${p.label ? `<b>(${p.label})</b> ` : ''}${p.html}</p>`).join('');
  const show = () => {
    const it = list[idx];
    const supp = it.startsWith('S');
    const n = supp ? it.slice(1) : it;
    const fig = (supp ? art.supp_figures : art.figures)[n];
    const src = asset(supp ? `assets/img/supp/S${n}.jpg` : `assets/img/fig/fig${n}.jpg`);
    lb.innerHTML = `<button class="close" aria-label="Close">×</button><div class="sheet" role="dialog" aria-modal="true" aria-label="Figure ${it}">
      <div class="img"><img src="${src}" alt="Figure ${it}"></div>
      <div class="side"><div class="meta">${supp ? 'Supplementary figure' : 'Journal figure'} ${supp ? 'S' + n : n}</div><h3>${fig ? fig.title : ''}</h3>${fig ? legendHtml(fig) : ''}
      <div class="nav">${interactive[it] ? '<button class="btn navy" data-i="1">Explore each tumour</button>' : ''}${list.length > 1 ? '<button class="btn line" data-d="-1">← Previous</button><button class="btn line" data-d="1">Next →</button>' : ''}<a class="btn line" href="${src}" target="_blank" rel="noopener">Open image ↗</a></div></div></div>`;
    lb.querySelector('.close').onclick = close;
    lb.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { idx = (idx + +b.dataset.d + list.length) % list.length; show(); }));
    const im = lb.querySelector('.img'); im.onclick = (e) => { if (!im.classList.contains('live')) im.classList.toggle('zoomed'); };
    const ib = lb.querySelector('[data-i]');
    if (ib) ib.onclick = () => {
      const live = im.classList.toggle('live');
      ib.textContent = live ? 'Show the figure' : 'Explore each tumour';
      if (live) { im.innerHTML = '<div class="supp-interactive"><div class="chart"></div></div>'; interactive[it](im.querySelector('.chart'), {}); }
      else im.innerHTML = `<img src="${src}" alt="Figure ${it}">`;
    };
  };
  const close = () => { lb.classList.remove('on'); document.body.style.overflow = ''; };
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && list.length > 1) { idx = (idx + 1) % list.length; show(); }
    if (e.key === 'ArrowLeft' && list.length > 1) { idx = (idx - 1 + list.length) % list.length; show(); }
  });
  return (items, start = 0) => { list = items; idx = start; show(); lb.classList.add('on'); document.body.style.overflow = 'hidden'; lb.querySelector('.close').focus(); };
}
