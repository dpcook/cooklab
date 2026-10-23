// Overview page: hero mosaic, atlas and tissue viewers, scrollytelling, and the redrawn panels.
import { whenVisible, revealOnScroll } from './core.js?v=b5261aa92c';
import { chrome, authorLine, lightbox } from './chrome.js?v=b5261aa92c';
import { hero as heroImage } from './hero.js?v=b5261aa92c';
import { epiViewer, atlasViewer, tissueViewer } from './viewers.js?v=b5261aa92c';
import { REGISTRY, setFigureOpener } from './panels.js?v=b5261aa92c';

const $ = (s) => document.querySelector(s);

function hero() {
  heroImage($('.hero'));
}

async function main() {
  const { art } = await chrome();
  $('#hero-authors').innerHTML = authorLine(art);
  const open = lightbox(art);
  setFigureOpener(open);
  hero();

  // redrawn panels, built as they near the viewport
  document.querySelectorAll('[data-panel]').forEach((h) => {
    const fn = REGISTRY[h.dataset.panel];
    const opt = { controls: h.dataset.panel === 'kmExplorer' ? $('#km-controls') : null, top: h.dataset.top ? +h.dataset.top : null };
    if (fn) whenVisible(h, () => fn(h, opt));
  });
  whenVisible($('#icon7'), () => REGISTRY.icon7($('#icon7')));
  whenVisible($('#icon7-split'), () => REGISTRY.icon7Split($('#icon7-split')));

  whenVisible($('#epi-viewer'), () => epiViewer($('#epi-viewer'), $('#epi-controls'), $('#epi-key')));
  whenVisible($('#atlas-viewer'), () => atlasViewer($('#atlas-viewer'), $('#atlas-controls'), $('#atlas-key')));
  whenVisible($('#scrolly'), scrolly, '800px');
  revealOnScroll();
  matchRows();
}

// In a two-column row marked data-match, a chart or viewer marked data-fill="min,max" takes the height that makes its
// column end level with the other column, within min–max px. Charts take it as data-ch; viewers as their height.
// In the one-column layout the default sizes return.
function matchRows() {
  for (const row of document.querySelectorAll('[data-match]')) {
    const cols = [...row.children], fills = [...row.querySelectorAll('[data-fill]')];
    if (cols.length !== 2 || !fills.length) continue;
    const own = cols.find((c) => c.contains(fills[0])), other = cols.find((c) => c !== own);
    const isViewer = (f) => f.classList.contains('viewer');
    const size = (f) => (isViewer(f) ? f.offsetHeight : f.dataset.ch ? +f.dataset.ch : f.querySelector('svg')?.getBoundingClientRect().height || 0);
    const redraw = (f) => [f, ...f.querySelectorAll('.chart')].forEach((c) => c._redraw && c._redraw());
    let raf = 0;
    const adjust = () => {
      raf = 0;
      const side = getComputedStyle(row).gridTemplateColumns.trim().split(/\s+/).length > 1;
      // fills sit side by side in their column, so they share one height
      const base = Math.max(...fills.map(size));
      if (!base) return;                          // not drawn yet; the column resizes when it is
      const delta = other.offsetHeight - own.offsetHeight;
      for (const f of fills) {
        const cur = size(f);
        if (!side) {
          if (isViewer(f)) f.style.height = '';
          else if (f.dataset.ch) { delete f.dataset.ch; redraw(f); }
          continue;
        }
        let [lo, hi] = f.dataset.fill.split(',').map(Number);
        if (isViewer(f)) hi = Math.max(lo, Math.min(hi, f.clientWidth * 1.3));   // a map no taller than 1.3× its width
        const next = Math.round(Math.max(lo, Math.min(hi, base + delta)));
        if (Math.abs(next - cur) < 4) continue;
        if (isViewer(f)) f.style.height = `${next}px`;
        else { f.dataset.ch = next; redraw(f); }
      }
    };
    const ro = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(adjust); });
    ro.observe(own); ro.observe(other);
  }
}

async function scrolly() {
  const tv = await tissueViewer($('#tissue-viewer'), $('#tissue-key'));
  if (!tv) return;
  const steps = [...document.querySelectorAll('#scrolly .step')];
  let current = null;
  const go = (name) => {
    if (name === current) return;
    current = name;
    steps.forEach((s) => s.classList.toggle('active', s.dataset.step === name));
    if (name === 'zoom') { tv.set('polar'); tv.zoomCells(); return; }
    if (name === 'hypoxia') tv.prefetchCells();
    tv.set(name === 'hypoxia' ? 'hypoxia_nb' : name);
    if (tv.viewer.fitted !== tv.viewer.home) tv.home();
  };
  // the active step is the last one whose box has passed 55% of the viewport height, read on every scroll frame so
  // that a fast scroll cannot skip a step
  const pick = () => {
    const mid = innerHeight * 0.55;
    let name = steps[0].dataset.step;
    for (const s of steps) if (s.querySelector('.box').getBoundingClientRect().top < mid) name = s.dataset.step;
    go(name);
  };
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; pick(); }); }, { passive: true });
  pick();
}

main();
