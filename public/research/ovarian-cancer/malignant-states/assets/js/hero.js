// Hero: WT01's stained section, toned to slate on the dark ground (build/hero2/make_region.py), and the same cells as
// glass tiles (build/hero2/render_tiles.py), which fade in over it, each in place, while the pointer is over the hero
// or focus is inside it (on touch screens, once the hero is in view): the SecA, intermediate and SecB cells first, then
// the other cells. Only segmented cells are drawn; empty space keeps the stain. Leaving the hero fades them out.
// The same sprite fade as the lab homepage's question cards (cooklab QuestionTiles.astro).
import { getJSON, reduced, asset } from './core.js?v=b5261aa92c';

// when each group starts to appear, as a share of the fade; each tile takes WIN to fade in
const STARTS = [[0, 0.45], [0.25, 0.68]];
const WIN = 0.28;
const SIZES = [900, 1200, 1600];

export function hero(root) {
  const wrap = root.querySelector('.mosaic-wrap');
  if (!wrap) return;
  const he = wrap.querySelector('img'), cv = wrap.querySelector('canvas');
  const show = () => wrap.classList.add('in');
  (he.decode ? he.decode() : Promise.resolve()).then(show, show);
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let img = null, atlas = null, sprites = [], W = 1600, H = 1600;
  let p = 0, target = 0, raf = 0, prev = 0, ready = false, loading = null;

  const load = () => loading || (loading = (async () => {
    const need = Math.max(wrap.clientWidth, wrap.clientHeight) * Math.min(2, devicePixelRatio || 1);
    const px = SIZES.find((s) => s >= need) || SIZES[SIZES.length - 1];
    const [data, im] = await Promise.all([
      getJSON('data/hero_tiles.json'),
      new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = asset(`assets/img/hero-tiles-${px}.webp`); }),
    ]);
    img = im;
    const k = im.naturalWidth / data.w;                 // outlines are in pixels of the 1600 px image
    W = im.naturalWidth; H = im.naturalHeight;
    // cut each tile out of the finished mosaic into a sprite atlas
    const AW = 1024;
    let x = 0, y = 0, rowH = 0;
    const boxes = data.tiles.map(([cx0, cy0, r0, g, poly]) => {
      const cx = cx0 * k, cy = cy0 * k, r = r0 * k;
      const grow = 1 + 1.2 / Math.max(2, r);
      const pts = [];
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let j = 0; j < poly.length; j += 2) {
        const px2 = cx + (poly[j] * k - cx) * grow, py2 = cy + (poly[j + 1] * k - cy) * grow;
        pts.push(px2, py2);
        x0 = Math.min(x0, px2); y0 = Math.min(y0, py2); x1 = Math.max(x1, px2); y1 = Math.max(y1, py2);
      }
      const bx = Math.floor(x0) - 1, by = Math.floor(y0) - 1, bw = Math.ceil(x1) - bx + 2, bh = Math.ceil(y1) - by + 2;
      if (x + bw > AW) { x = 0; y += rowH + 1; rowH = 0; }
      const [a, b] = STARTS[Math.min(g, STARTS.length - 1)];
      const box = { ax: x, ay: y, bx, by, bw, bh, pts, s: a + Math.random() * (b - a) };
      x += bw + 1;
      rowH = Math.max(rowH, bh);
      return box;
    });
    atlas = document.createElement('canvas');
    atlas.width = AW; atlas.height = y + rowH + 1;
    const a = atlas.getContext('2d');
    for (const s of boxes) {
      a.save();
      a.beginPath();
      for (let j = 0; j < s.pts.length; j += 2) {
        const px2 = s.pts[j] - s.bx + s.ax, py2 = s.pts[j + 1] - s.by + s.ay;
        if (j) a.lineTo(px2, py2); else a.moveTo(px2, py2);
      }
      a.closePath();
      a.clip();
      a.drawImage(im, s.bx, s.by, s.bw, s.bh, s.ax, s.ay, s.bw, s.bh);
      a.restore();
    }
    sprites = boxes.sort((m, n) => m.s - n.s);
    ready = true;
    resize();
    kick();
  })().catch((e) => console.warn('hero tiles', e)));

  // the canvas covers the wrap as the image does (object-fit: cover, centred)
  const resize = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(wrap.clientWidth * d);
    cv.height = Math.round(wrap.clientHeight * d);
    draw();
  };

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (!ready || p <= 0) return;
    const sc = Math.max(cv.width / W, cv.height / H), ox = (cv.width - W * sc) / 2, oy = (cv.height - H * sc) / 2;
    if (p >= 1) { ctx.drawImage(img, ox, oy, W * sc, H * sc); return; }
    ctx.setTransform(sc, 0, 0, sc, ox, oy);
    for (const s of sprites) {
      const a = Math.min(1, (p - s.s) / WIN);
      if (a <= 0) break;
      ctx.globalAlpha = a * a * (3 - 2 * a);           // smooth fade, no movement
      ctx.drawImage(atlas, s.ax, s.ay, s.bw, s.bh, s.bx, s.by, s.bw, s.bh);
    }
    // the grout and the last details settle in at the end
    const q = Math.max(0, (p - 0.86) / 0.14);
    if (q > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = q;
      ctx.drawImage(img, ox, oy, W * sc, H * sc);
    }
  };

  const step = (now) => {
    const dt = Math.min(0.05, prev ? (now - prev) / 1000 : 0);
    prev = now;
    const rate = target > p ? 1 / 1.6 : 1 / 0.7;      // 1.6 s to fade in, 0.7 s to fade out
    p = target > p ? Math.min(target, p + dt * rate) : Math.max(target, p - dt * rate);
    draw();
    if (p !== target) raf = requestAnimationFrame(step);
    else { raf = 0; prev = 0; }
  };
  const kick = () => {
    if (!ready) return;
    if (reduced()) { p = target; draw(); return; }
    if (!raf && p !== target) raf = requestAnimationFrame(step);
  };
  const go = (on) => { target = on ? 1 : 0; load(); kick(); };

  // any pointer movement over the hero shows the tiles, also when the pointer was already there as the page loaded
  root.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && target !== 1) go(true); });
  root.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') go(false); });
  root.addEventListener('focusin', () => go(true));
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) go(false); });
  new ResizeObserver(() => ready && resize()).observe(wrap);
  // fetch the tiles once the stain is showing, so the first hover has them ready
  const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 400));
  he.complete ? idle(() => load()) : he.addEventListener('load', () => idle(() => load()), { once: true });
  // touch screens have no hover: lay the tiles down once the hero is in view
  if (matchMedia('(hover: none)').matches) {
    new IntersectionObserver((es) => { if (es[0].isIntersecting) go(true); }, { threshold: 0.4 }).observe(wrap);
  }
}
