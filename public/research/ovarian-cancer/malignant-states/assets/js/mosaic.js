// Glass mosaic for the hero: one glass tile per cell of a real Xenium section, on the dark ground.
// Ported from the lab's renderer (~/Desktop/Mosaic video/glass/index.html). Tiles fade in by
// epithelial state (SecA, intermediate, SecB, then the rest); afterwards a few tiles at a time
// catch the light. Static under prefers-reduced-motion; paused off screen.
import { reduced } from './core.js?v=8d8c43bce9';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function hexHsl(h) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(hue * 60 + 360) % 360, s, l];
}
const hsl = (h, s, l, a = 1) => `hsla(${h.toFixed(1)},${(clamp(s) * 100).toFixed(1)}%,${(clamp(l) * 100).toFixed(1)}%,${a.toFixed(3)})`;

// glass families by cell type (the image's colours; data figures use the figure palette)
export const GLASS = {
  'SecA epithelium': ['#F6B93B', '#F9C74F', '#F4A52A', '#FFD166', '#EFA234', '#F7C35C', '#E8A33D'],
  'Intermediate epithelium': ['#F28A30', '#F57C2B', '#EE9A3A', '#E9772A'],
  'SecB epithelium': ['#D9481C', '#C8401A', '#E2542F', '#B83A16', '#CF4A22'],
  'Ciliated epithelium': ['#1FAF9A', '#22C3A8', '#169A88'],
  'Mesothelial': ['#C9A27A', '#B8936D'],
  'Fibroblast': ['#21508F', '#2A62A8', '#1C467D', '#2F6FA0', '#264E8A'],
  'Smooth muscle': ['#3D4FA8', '#4A5BB8', '#34449A'],
  'Pericyte': ['#EDE6DA', '#E2EAF0', '#F2E6DC'],
  'Endothelial': ['#F4F0E6', '#EAF2F6', '#F7EDE4', '#E6EEF7'],
  'T cell': ['#7E57C2', '#9C6ADE'], 'NK cell': ['#8E63D2'], 'B cell': ['#6C45B8'], 'Plasma cell': ['#B05BD6', '#9C4FCB'],
  'Macrophage': ['#3DBB8A', '#2FA578', '#56C99A', '#45B386'],
  'Conventional dendritic cell': ['#D9478F'], 'Plasmacytoid dendritic cell': ['#C04FB0'], 'Neutrophil': ['#F06BA8'], 'Mast cell': ['#D9478F'],
  fill: ['#121A2B', '#152036', '#0F1624', '#18223A', '#111827'],
};
export const GLASS_LEGEND = [
  ['SecA', '#F6B93B'], ['Intermediate', '#F28A30'], ['SecB', '#D9481C'], ['Macrophages', '#3DBB8A'],
  ['Lymphocytes', '#8E63D2'], ['Stroma', '#2A62A8'], ['Vessels', '#EAF2F6'],
];
const PEARL = new Set(['Pericyte', 'Endothelial']);
const ORDER = { 'SecA epithelium': 0, 'Intermediate epithelium': 1, 'SecB epithelium': 2 };
const GROUT = '#151922';
const GROUT_UM = 0.6;

export class Mosaic {
  constructor(canvas, data, opt = {}) {
    this.cv = canvas; this.D = data;
    // umAcross: µm of tissue across the right-hand area; area: fraction of the width the tissue occupies
    this.opt = Object.assign({ umAcross: 700, area: 0.5, focus: null, intro: 3.2 }, opt);
    this.LA = Math.atan2(-0.78, -0.62); this.LX = Math.cos(this.LA); this.LY = Math.sin(this.LA);
    this.textures();
    this.make();
    this.ro = new ResizeObserver(() => { clearTimeout(this.rt); this.rt = setTimeout(() => this.layout(), 120); });
    this.ro.observe(canvas);
    this.io = new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) this.loop(); });
    this.io.observe(canvas);
    this.layout();
  }

  textures() {
    const ctx = this.cv.getContext('2d'), rn = rng(5);
    const smooth = (n, blur) => {
      const lo = document.createElement('canvas'); lo.width = lo.height = n;
      const lc = lo.getContext('2d'), ld = lc.createImageData(n, n);
      for (let k = 0; k < ld.data.length; k += 4) { const v = 40 + rn() * 175; ld.data[k] = ld.data[k + 1] = ld.data[k + 2] = v; ld.data[k + 3] = 255; }
      lc.putImageData(ld, 0, 0);
      const mo = document.createElement('canvas'); mo.width = mo.height = 256;
      const mc = mo.getContext('2d'); mc.filter = `blur(${blur}px)`;
      for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) mc.drawImage(lo, dx, dy, 256, 256);
      return mo;
    };
    this.cloudImg = smooth(24, 3); this.mottleImg = smooth(10, 14);
    this.noise = document.createElement('canvas'); this.noise.width = this.noise.height = 256;
    const nc = this.noise.getContext('2d'), id = nc.createImageData(256, 256);
    for (let k = 0; k < id.data.length; k += 4) { const v = 90 + rn() * 120; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; }
    nc.putImageData(id, 0, 0);
  }

  make() {
    const r = rng(23), GJ = rng(91), D = this.D;
    const tile = (lab, verts, cx, cy) => {
      let ax = 0;
      for (let k = 0; k < verts.length; k += 2) { const j = (k + 2) % verts.length; ax += verts[k] * verts[j + 1] - verts[j] * verts[k + 1]; }
      const area = Math.abs(ax) / 2, req = Math.sqrt(area / Math.PI) || 1;
      const f = clamp(1 - (GROUT_UM / req) * (0.85 + 0.3 * r()), 0.6, 0.94);
      const path = new Path2D();
      for (let k = 0; k < verts.length; k += 2) (k ? path.lineTo : path.moveTo).call(path, verts[k] * f, verts[k + 1] * f);
      path.closePath();
      const fam = GLASS[lab] || ['#64748B'];
      const [h, s, l] = hexHsl(fam[(r() * fam.length) | 0]);
      const tilt = (r() - 0.5) * 0.9;
      return {
        lab, cx, cy, path, r: req * f, v: verts.map((c) => c * f),
        h: h + (r() - 0.5) * 10, s: s + (r() - 0.5) * 0.14, l: l + (r() - 0.5) * 0.12,
        la: this.LA + tilt, rot: (r() - 0.5) * 0.12, spec: (0.25 + 1.1 * r() * r()) * this.sheen(cx, cy),
        mo: [r() * 256, r() * 256], pearl: PEARL.has(lab), sj: [(r() - 0.5) * 0.3, (r() - 0.5) * 0.3],
        gj: [(GJ() - 0.5) * 0.5, (GJ() - 0.5) * 0.5], delay: r(),
      };
    };
    const labels = D.labels;
    this.tiles = D.cells.map(([li, cx, cy, v]) => tile(labels[li], v, cx, cy));
    for (const poly of D.fill || []) {
      let cx = 0, cy = 0; const n = poly.length / 2;
      for (let k = 0; k < poly.length; k += 2) { cx += poly[k] / n; cy += poly[k + 1] / n; }
      this.tiles.push(tile('fill', poly.map((c, k) => c - (k % 2 ? cy : cx)), cx, cy));
    }
    // intro order: background and stroma, then SecA, intermediate, SecB, then immune and vessels
    const I = this.opt.intro;
    for (const t of this.tiles) {
      const o = ORDER[t.lab];
      const win = t.lab === 'fill' ? [0, 0.5] : o === 0 ? [0.35, 0.62] : o === 1 ? [0.55, 0.78] : o === 2 ? [0.7, 0.95] : [0.2, 0.9];
      t.start = I * (win[0] + t.delay * (win[1] - win[0]));
    }
    this.tiles.sort((a, b) => a.start - b.start);
    this.cellTiles = this.tiles.filter((t) => t.lab !== 'fill');
  }
  sheen(x, y) {
    const DW = this.D.width, DH = this.D.height;
    const u = ((x - DW / 2) * 0.70 + (y - DH / 2) * -0.71) / Math.max(DW, DH);
    return 0.18 + 1.25 * Math.exp(-Math.pow((u + 0.08) / 0.17, 2));
  }

  layout() {
    const r = this.cv.getBoundingClientRect(), d = this.opt.pixels ? 1 : Math.min(devicePixelRatio || 1, r.width < 900 ? 1.25 : 1.5);
    const W = this.opt.pixels ? this.opt.pixels[0] : Math.round(r.width * d), H = this.opt.pixels ? this.opt.pixels[1] : Math.round(r.height * d);
    if (!W || !H || (W === this.W && H === this.H && this.bakeS)) return;
    this.W = W; this.H = H;
    this.cv.width = this.W; this.cv.height = this.H;
    // the tissue fills the right-hand area; tiles thin out toward its left edge and the foot
    const narrow = !this.opt.dissolve && this.W / this.H < 1.1;
    const areaW = this.W * (narrow || this.opt.dissolve ? 1 : this.opt.area);
    const k = Math.max(areaW / this.opt.umAcross, this.H / this.D.height, areaW / this.D.width);
    this.k = k;
    const [fx, fy] = this.opt.focus || [this.D.width / 2, this.D.height / 2];
    this.ox = this.W - areaW / 2 - fx * k;
    this.oy = this.H / 2 - fy * k;
    this.ox = Math.min(this.W - areaW, Math.max(this.W - this.D.width * k, this.ox));
    this.oy = Math.min(0, Math.max(this.H - this.D.height * k, this.oy));
    if (this.opt.dissolve) { this.ox = Math.min(0, Math.max(this.W - this.D.width * k, this.W / 2 - fx * k)); }
    const x0 = narrow ? -1 : this.W * (1 - this.opt.area) + 0.03 * this.W, x1 = narrow ? 0 : this.W * (1 - this.opt.area) + 0.2 * this.W;
    const rk = rng(77), ss = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
    for (const t of this.tiles) {
      const X = this.ox + t.cx * k, Y = this.oy + t.cy * k;
      const fy = (this.opt.fadeTo ? this.opt.fadeTo() : 0.6 * this.H / d) * d;
      const D = this.opt.dissolve;
      const p = D ? (D.x ? ss(D.x[0] * this.W, D.x[1] * this.W, X) : 1) * (D.y ? ss(D.y[0] * this.H, D.y[1] * this.H, Y) : 1)
        : narrow ? ss(fy, fy - 0.3 * this.H, Y) : ss(x0, x1, X) * ss(this.H * 0.98, this.H * 0.74, Y);
      t.keep = rk() < p;
    }
    const mk = () => { const c = document.createElement('canvas'); c.width = this.W; c.height = this.H; return c; };
    this.bakeS = mk(); this.bakeT = mk(); this.air = mk(); this.glow = mk();
    this.baked = 0; this.t0 = null; this.glints = [];
    this.MOTTLE = this.bakeT.getContext('2d').createPattern(this.mottleImg, 'repeat');
    this.CLOUD = this.bakeT.getContext('2d').createPattern(this.cloudImg, 'repeat');
    if (reduced()) { this.bakeAll(); this.compose(); return; }
    this.loop();
  }

  // ---- one tile (as in the original renderer)
  shadow(g, t, X, Y, k) {
    g.setTransform(k, 0, 0, k, X - 20000, Y); g.rotate(t.rot);
    const off = 0.55 * k, blur = 1.1 * k;
    g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = blur;
    g.shadowOffsetX = -this.LX * off + 20000; g.shadowOffsetY = -this.LY * off;
    g.fillStyle = '#000'; g.fill(t.path);
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0;
  }
  innerShade(g, t, k, color, blurUm, ox, oy) {
    if (!t.ring) { t.ring = new Path2D(); t.ring.rect(-t.r * 8, -t.r * 8, t.r * 16, t.r * 16); t.ring.addPath(t.path); }
    g.shadowColor = color; g.shadowBlur = blurUm * k; g.shadowOffsetX = ox * k; g.shadowOffsetY = oy * k;
    g.fillStyle = color; g.fill(t.ring, 'evenodd');
    g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0;
  }
  body(g, t, X, Y, k, alpha = 1, extraSpec = 0) {
    g.setTransform(k, 0, 0, k, X, Y); g.rotate(t.rot);
    const la = t.la - t.rot, lx = Math.cos(la), ly = Math.sin(la), r = t.r;
    const wx = Math.cos(t.la), wy = Math.sin(t.la);
    const { h, s, l } = t, R = r * 2.4, sp = Math.min(1.6, t.spec + extraSpec);
    g.save(); g.clip(t.path); g.globalAlpha = alpha;
    const gc = t.gj[0] * r;
    const gr = g.createLinearGradient(lx * (r * 1.1 + gc), ly * (r * 1.1 + gc), -lx * (r * 1.1 - gc), -ly * (r * 1.1 - gc));
    if (t.pearl) {
      gr.addColorStop(0, hsl(40, 0.6, 0.96)); gr.addColorStop(0.45, hsl(h, s, l)); gr.addColorStop(0.75, hsl(320, 0.35, 0.84)); gr.addColorStop(1, hsl(200, 0.45, 0.74));
    } else {
      gr.addColorStop(0, hsl(h + 6, s - 0.04, Math.min(0.92, l + 0.15))); gr.addColorStop(0.5, hsl(h, s, l)); gr.addColorStop(1, hsl(h - 8, s + 0.08, l - 0.16));
    }
    g.fillStyle = gr; g.fillRect(-R, -R, 2 * R, 2 * R);
    const fx = -lx * r * 0.55, fy = -ly * r * 0.55;
    const fg = g.createRadialGradient(fx, fy, 0, fx, fy, r * 0.7);
    fg.addColorStop(0, hsl(h + 4, s, Math.min(0.9, l + 0.22), 0.22)); fg.addColorStop(1, hsl(h, s, l, 0));
    g.fillStyle = fg; g.fillRect(-R, -R, 2 * R, 2 * R);
    const mk = 0.35 + 0.65 * clamp(l / 0.6);
    g.globalCompositeOperation = 'soft-light';
    this.MOTTLE.setTransform(new DOMMatrix().translate(t.mo[1], t.mo[0]).scale(0.14));
    g.globalAlpha = alpha * 0.28 * mk; g.fillStyle = this.MOTTLE; g.fillRect(-R, -R, 2 * R, 2 * R);
    this.CLOUD.setTransform(new DOMMatrix().translate(t.mo[0], t.mo[1]).scale(0.13));
    g.globalAlpha = alpha * 0.32 * mk; g.fillStyle = this.CLOUD; g.fillRect(-R, -R, 2 * R, 2 * R);
    g.globalAlpha = alpha; g.globalCompositeOperation = 'source-over';
    this.innerShade(g, t, k, hsl(h, s + 0.1, l * 0.22, 0.55), 1.7, 0, 0);
    this.innerShade(g, t, k, hsl(h - 6, s + 0.1, l * 0.3, 0.5), 1.6, wx * 0.55, wy * 0.55);
    g.globalCompositeOperation = 'screen';
    this.innerShade(g, t, k, hsl(h + 8, s * 0.5, 0.92, clamp(0.25 + 0.3 * sp)), 1.4, -wx * 0.5, -wy * 0.5);
    const sx = lx * r * 0.45 + t.sj[0] * r, sy = ly * r * 0.45 + t.sj[1] * r;
    const sg = g.createRadialGradient(sx, sy, 0, sx, sy, r * 0.75);
    sg.addColorStop(0, `rgba(255,252,245,${(0.2 * sp).toFixed(3)})`); sg.addColorStop(1, 'rgba(255,252,245,0)');
    g.fillStyle = sg; g.fillRect(-R, -R, 2 * R, 2 * R);
    if (sp > 0.45) {
      g.save(); g.translate(sx, sy); g.rotate(la + Math.PI / 2); g.scale(1, 0.3);
      const hg = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.32);
      hg.addColorStop(0, `rgba(255,255,255,${clamp((0.85 * (sp - 0.45)) / 0.7).toFixed(3)})`);
      hg.addColorStop(0.5, `rgba(255,255,255,${clamp((0.35 * (sp - 0.45)) / 0.7).toFixed(3)})`);
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = hg; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore();
    }
    g.globalCompositeOperation = 'source-over'; g.restore();
  }
  onScreen(t) {
    if (!t.keep) return false;
    const X = this.ox + t.cx * this.k, Y = this.oy + t.cy * this.k, rr = t.r * this.k * 1.5 + 4;
    return X > -rr && X < this.W + rr && Y > -rr && Y < this.H + rr;
  }
  bakeUpTo(time) {
    const gs = this.bakeS.getContext('2d'), gt = this.bakeT.getContext('2d'), k = this.k;
    while (this.baked < this.tiles.length && this.tiles[this.baked].start + 0.6 <= time) {
      const t = this.tiles[this.baked++];
      if (!this.onScreen(t)) continue;
      this.shadow(gs, t, this.ox + t.cx * k, this.oy + t.cy * k, k);
      this.body(gt, t, this.ox + t.cx * k, this.oy + t.cy * k, k);
    }
  }
  bakeAll() { this.bakeUpTo(Infinity); window.__mosaicDone = performance.now(); }
  // outlines of kept epithelial tiles in canvas pixels, for the shimmer overlay
  exportGlints(n = 2400) {
    const r = rng(5), out = [], k = this.k;
    const pool = this.cellTiles.filter((t) => t.keep && /epithelium$/.test(t.lab) && this.onScreen(t));
    for (const t of pool) {
      if (r() > n / pool.length) continue;
      const X = this.ox + t.cx * k, Y = this.oy + t.cy * k;
      const c = Math.cos(t.rot), s = Math.sin(t.rot), v = [];
      for (let i = 0; i < t.v.length; i += 2) v.push(Math.round((X + (c * t.v[i] - s * t.v[i + 1]) * k) * 2) / 2, Math.round((Y + (s * t.v[i] + c * t.v[i + 1]) * k) * 2) / 2);
      out.push([Math.round(X), Math.round(Y), Math.round(t.r * k * 10) / 10, v]);
    }
    return { width: this.W, height: this.H, tiles: out };
  }

  compose() {
    const g = this.cv.getContext('2d'), W = this.W, H = this.H;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = GROUT; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.10; g.globalCompositeOperation = 'overlay';
    g.fillStyle = g.createPattern(this.noise, 'repeat'); g.fillRect(0, 0, W, H);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.drawImage(this.bakeS, 0, 0); g.drawImage(this.bakeT, 0, 0); g.drawImage(this.air, 0, 0); g.drawImage(this.glow, 0, 0);
    // light from the upper left, falling off toward the lower right
    g.globalCompositeOperation = 'soft-light';
    const lg = g.createRadialGradient(W * 0.38, H * 0.08, 0, W * 0.38, H * 0.08, W * 1.1);
    lg.addColorStop(0, 'rgba(255,245,230,0.5)'); lg.addColorStop(0.55, 'rgba(128,128,128,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
  }

  loop() {
    if (this.running || !this.W) return;
    this.running = true;
    const frame = (now) => {
      if (!this.visible && this.t0 != null && this.baked >= this.tiles.length) { this.running = false; return; }
      if (this.t0 == null) this.t0 = now;
      const t = (now - this.t0) / 1000;
      this.bakeUpTo(t);
      // tiles fading in
      const ga = this.air.getContext('2d'); ga.setTransform(1, 0, 0, 1, 0, 0); ga.clearRect(0, 0, this.W, this.H);
      for (let n = this.baked; n < this.tiles.length && this.tiles[n].start < t; n++) {
        const tl = this.tiles[n];
        if (!this.onScreen(tl)) continue;
        this.body(ga, tl, this.ox + tl.cx * this.k, this.oy + tl.cy * this.k, this.k, clamp((t - tl.start) / 0.6));
      }
      // after the intro, a few tiles at a time catch the light
      const gg = this.glow.getContext('2d'); gg.setTransform(1, 0, 0, 1, 0, 0); gg.clearRect(0, 0, this.W, this.H);
      if (this.baked >= this.tiles.length) {
        if (!this.nextGlint || t > this.nextGlint) {
          const pick = this.cellTiles[(Math.random() * this.cellTiles.length) | 0];
          if (this.onScreen(pick)) this.glints.push({ t: pick, s: t });
          this.nextGlint = t + 0.07 + Math.random() * 0.12;
        }
        this.glints = this.glints.filter((gl) => t - gl.s < 1.6);
        for (const gl of this.glints) {
          const p = (t - gl.s) / 1.6, a = Math.sin(Math.PI * p);
          this.body(gg, gl.t, this.ox + gl.t.cx * this.k, this.oy + gl.t.cy * this.k, this.k, a * 0.9, 0.9);
        }
      }
      this.compose();
      if (this.baked >= this.tiles.length && !window.__mosaicDone) window.__mosaicDone = performance.now();
      if (this.visible || this.baked < this.tiles.length) requestAnimationFrame(frame); else this.running = false;
    };
    requestAnimationFrame(frame);
  }
}
