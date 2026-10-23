// WebGL2 point viewer for embeddings and tissue maps: pan, zoom, hover, colour transitions,
// and real cell outlines drawn over the points at high zoom.
import { ramp, MAPS, GREY, tip, reduced, asset } from './core.js?v=8d8c43bce9';

const VS = `#version 300 es
in vec2 a_pos; in vec4 a_colA; in vec4 a_colB;
uniform vec2 u_center; uniform float u_scale; uniform vec2 u_view; uniform float u_size; uniform float u_mix; uniform float u_yflip;
out vec4 v_col;
void main() {
  vec2 p = (a_pos - u_center) * u_scale;
  gl_Position = vec4(p.x / (u_view.x * 0.5), -u_yflip * p.y / (u_view.y * 0.5), 0.0, 1.0);
  v_col = mix(a_colA, a_colB, u_mix);
  gl_PointSize = u_size;
}`;
const FS = `#version 300 es
precision mediump float;
in vec4 v_col; uniform float u_soft; uniform float u_square; out vec4 o;
void main() {
  if (v_col.a < 0.004) discard;
  vec2 c = gl_PointCoord * 2.0 - 1.0; float r = u_square > 0.5 ? max(abs(c.x), abs(c.y)) : dot(c, c);
  if (r > 1.0) discard;
  float a = u_square > 0.5 ? 1.0 : 1.0 - smoothstep(1.0 - u_soft, 1.0, r);
  o = vec4(v_col.rgb * v_col.a * a, v_col.a * a);
}`;

function shader(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function hex4(h, a = 255) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]; }

export class PointViewer {
  constructor(host, pts, opt = {}) {
    this.host = host; this.pts = pts;
    this.opt = Object.assign({ coords: pts.meta.coords || 'umap', cellUm: 9, pointPx: 2.2, wheel: 'always', background: null, pad: 0.04 }, opt);
    this.tissue = this.opt.coords === 'um';
    host.classList.add('viewer');
    host.__viewer = this;
    this.canvas = document.createElement('canvas');
    this.overlay = document.createElement('canvas');
    this.overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    host.append(this.canvas, this.overlay);
    const gl = (this.gl = this.canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true, alpha: true }));
    if (!gl) { host.innerHTML = '<div class="loading">This viewer needs WebGL2.</div>'; return; }
    const prog = (this.prog = gl.createProgram());
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);
    this.u = Object.fromEntries(['u_center', 'u_scale', 'u_view', 'u_size', 'u_mix', 'u_yflip', 'u_soft', 'u_square'].map((k) => [k, gl.getUniformLocation(prog, k)]));
    const n = pts.n;
    const pos = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { pos[2 * i] = pts.X[i]; pos[2 * i + 1] = pts.Y[i]; }
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    const bind = (name, data, size, type, norm) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, type, norm, 0, 0);
      return b;
    };
    this.colA = new Uint8Array(n * 4); this.colB = new Uint8Array(n * 4);
    bind('a_pos', pos, 2, gl.FLOAT, false);
    this.bufA = bind('a_colA', this.colA, 4, gl.UNSIGNED_BYTE, true);
    this.bufB = bind('a_colB', this.colB, 4, gl.UNSIGNED_BYTE, true);
    this.ibuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
    this.order = new Uint32Array(n); for (let i = 0; i < n; i++) this.order[i] = i;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.order, gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.mix = 1; this.limit = n;
    // view: centre in data units and pixels per unit
    const [x0, y0, x1, y1] = pts.meta.bbox;
    this.home = [x0, y0, x1, y1];
    this.cx = (x0 + x1) / 2; this.cy = (y0 + y1) / 2; this.k = 1;
    this.buildGrid();
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    this.resize(); this.fit(this.home, 0);
    this.interact();
    this.ui();
  }

  // ------------------------------------------------------------ view
  resize() {
    const r = this.host.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height); this.dpr = d;
    for (const c of [this.canvas, this.overlay]) { c.width = Math.round(this.w * d); c.height = Math.round(this.h * d); c.style.width = this.w + 'px'; c.style.height = this.h + 'px'; }
    // a zoom in flight keeps its course (a legend changing height below the map must not cut it short) and refits at the end
    if (this.flying) { this.resizedInFlight = true; this.draw(); return; }
    if (this.fitted) this.fit(this.fitted, 0); else this.draw();
  }
  fitScale(b) {
    const pad = 1 - 2 * this.opt.pad;
    return Math.min((this.w * pad) / (b[2] - b[0]), (this.h * pad) / (b[3] - b[1]));
  }
  fit(b, ms = 900) {
    this.fitted = b;
    return this.animateTo((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, this.fitScale(b), ms);
  }
  animateTo(cx, cy, k, ms = 900) {
    if (reduced()) ms = 0;
    const a = { cx: this.cx, cy: this.cy, k: this.k };
    cancelAnimationFrame(this.flyRaf);
    if (!ms) { this.flying = false; this.cx = cx; this.cy = cy; this.k = k; this.draw(); return Promise.resolve(); }
    this.flying = true; this.resizedInFlight = false;
    // van Wijk–Nuij path (d3.interpolateZoom): the target stays in view through large zooms
    const zi = window.d3?.interpolateZoom ? window.d3.interpolateZoom([a.cx, a.cy, this.w / a.k], [cx, cy, this.w / k]) : null;
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        const t = ease(Math.max(0, Math.min(1, (now - t0) / ms)));
        if (zi) { const [x, y, w] = zi(t); this.cx = x; this.cy = y; this.k = this.w / w; }
        else {
          this.k = Math.exp(Math.log(a.k) + (Math.log(k) - Math.log(a.k)) * t);
          this.cx = a.cx + (cx - a.cx) * t; this.cy = a.cy + (cy - a.cy) * t;
        }
        this.draw();
        if (t < 1) { this.flyRaf = requestAnimationFrame(step); return; }
        this.flying = false;
        if (this.resizedInFlight && this.fitted) this.fit(this.fitted, 0);
        res();
      };
      this.flyRaf = requestAnimationFrame(step);
    });
  }
  toData(px, py) { return [this.cx + (px - this.w / 2) / this.k, this.cy + (this.tissue ? 1 : -1) * (py - this.h / 2) / this.k]; }
  toScreen(x, y) { return [this.w / 2 + (x - this.cx) * this.k, this.h / 2 + (this.tissue ? 1 : -1) * (y - this.cy) * this.k]; }

  // ------------------------------------------------------------ colour
  // spec: {type:'cat', field, colors:{category: hex}, show?: Set(categories), grey?}
  //       {type:'cont', field, map, lo?, hi? (0..254 in quantized units), only?: {field, cats:Set}, grey?, zeroGrey?}
  setColor(spec, ms = 600) {
    const pts = this.pts, n = pts.n, out = this.colB;
    const grey = hex4(spec.grey || GREY, spec.greyAlpha ?? 255);
    // draw order: a layer key per point (0 = grey background), then a counting sort
    const key = new Uint16Array(n);
    let nk;
    if (spec.type === 'cat') {
      const f = pts.field[spec.field], q = pts.cols[spec.field];
      const lut = f.categories.map((c) => (spec.show && !spec.show.has(c) ? null : spec.colors[c] ? hex4(spec.colors[c], spec.alpha ?? 255) : null));
      const last = new Set((spec.frontLast || []).map((c) => f.categories.indexOf(c)));
      for (let i = 0; i < n; i++) {
        const c = lut[q[i]];
        out.set(c || grey, 4 * i);
        key[i] = c ? (last.has(q[i]) ? 2 : 1) : 0;
      }
      nk = 3;
    } else {
      const q = this.pts.cols[spec.field];
      const fn = ramp(MAPS[spec.map] || spec.map);
      const lo = spec.lo ?? 0, hi = spec.hi ?? 254;
      const lut = new Array(256);
      for (let v = 0; v < 255; v++) lut[v] = [...fn((v - lo) / Math.max(1, hi - lo)), spec.alpha ?? 255];
      const only = spec.only ? { q: pts.cols[spec.only.field], set: new Set(spec.only.cats.map((c) => pts.field[spec.only.field].categories.indexOf(c))) } : null;
      for (let i = 0; i < n; i++) {
        const v = q[i];
        const masked = v === 255 || (only && !only.set.has(only.q[i])) || (spec.zeroGrey && v <= (spec.zeroAt ?? 0));
        if (masked) { out.set(grey, 4 * i); key[i] = 0; } else { out.set(lut[v], 4 * i); key[i] = 1 + v; }
      }
      nk = 256;
    }
    this.sortOrder(key, nk);
    this.spec = spec;
    this.transition(ms);
  }
  sortOrder(key, nk) {
    const start = new Uint32Array(nk + 1);
    for (let i = 0; i < key.length; i++) start[key[i] + 1]++;
    for (let k = 0; k < nk; k++) start[k + 1] += start[k];
    for (let i = 0; i < key.length; i++) this.order[start[key[i]]++] = i;
    const gl = this.gl; gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.order, gl.DYNAMIC_DRAW);
  }
  transition(ms) {
    const gl = this.gl;
    if (reduced() || !this.colored) ms = 0;
    // current displayed colours become A
    if (this.colored && this.mix > 0 && ms) {
      const cur = new Uint8Array(this.colA.length);
      const m = this.mix;
      for (let i = 0; i < cur.length; i++) cur[i] = this.colA[i] + (this.colPrev[i] - this.colA[i]) * m;
      this.colA.set(cur);
    }
    this.colPrev = this.colB.slice();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufB); gl.bufferData(gl.ARRAY_BUFFER, this.colB, gl.DYNAMIC_DRAW);
    if (!ms) { this.colA.set(this.colB); }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufA); gl.bufferData(gl.ARRAY_BUFFER, this.colA, gl.DYNAMIC_DRAW);
    this.colored = true; this.colSerial = (this.colSerial || 0) + 1;
    this.segWarm();
    cancelAnimationFrame(this.mixRaf);
    if (!ms) { this.mix = 1; this.draw(); return; }
    const t0 = performance.now();
    const step = (now) => { this.mix = ease(Math.min(1, (now - t0) / ms)); this.draw(); if (this.mix < 1) this.mixRaf = requestAnimationFrame(step); };
    this.mix = 0; this.mixRaf = requestAnimationFrame(step);
  }

  // ------------------------------------------------------------ draw
  pointSize() {
    if (this.tissue) {
      if (this.opt.square) return Math.max(1.1, this.opt.cellUm * this.k * 0.96) * this.dpr;
      // cell outlines take over when zoomed in, once the tiles in view have loaded
      const shrink = this.seg && !this.segMissing ? 1 - 0.85 * this.segAlpha() : 1;
      return Math.max(1.1, Math.min(48, this.opt.cellUm * this.k * shrink)) * this.dpr;
    }
    const z = this.k / this.fitScale(this.home);
    return Math.max(1, Math.min(14, this.opt.pointPx * Math.pow(z, 0.55))) * this.dpr;
  }
  draw() {
    if (!this.gl) return;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this._draw());
  }
  _draw() {
    const gl = this.gl, u = this.u;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog); gl.bindVertexArray(this.vao);
    gl.uniform2f(u.u_center, this.cx, this.cy);
    gl.uniform1f(u.u_scale, this.k * this.dpr);
    gl.uniform2f(u.u_view, this.canvas.width, this.canvas.height);
    const size = this.pointSize();
    gl.uniform1f(u.u_size, size);
    gl.uniform1f(u.u_soft, size > 4 ? 0.18 : 0.5);
    gl.uniform1f(u.u_square, this.opt.square && size > 5 ? 1 : 0);
    gl.uniform1f(u.u_mix, this.mix);
    gl.uniform1f(u.u_yflip, this.tissue ? 1 : -1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuf);
    gl.drawElements(gl.POINTS, Math.min(this.limit, this.pts.n), gl.UNSIGNED_INT, 0);
    this.drawOverlay();
    this.updateScale();
  }

  // cell outlines over the points when zoomed in
  setPolygons(polys, colorOf) { this.polys = polys; this.polyColor = colorOf; this.draw(); }

  // Segmentation in map tiles (build/exports/spatial/11_seg_tiles.py): each tile holds the outlines of the cells whose
  // centroid falls in it, indexed by point, so an outline takes the colour of its point in every layer.
  async setSegmentation(indexUrl) {
    const idx = await (await fetch(asset(indexUrl))).json();
    this.seg = { base: indexUrl.slice(0, indexUrl.lastIndexOf('/') + 1), meta: idx, tiles: new Map(), loading: 0 };
    this.draw();
  }
  segAlpha() { return Math.max(0, Math.min(1, (this.k - 1.0) / 0.35)); }
  segTile(t) {
    const S = this.seg, key = t.file;
    if (S.tiles.has(key)) return S.tiles.get(key);
    if (S.loading > 6) return null;
    S.tiles.set(key, null); S.loading++;
    fetch(asset(S.base + t.file)).then((r) => r.arrayBuffer()).then((buf) => {
      const n = t.n, nv = t.nv, pad = S.meta.pad_um, span = S.meta.tile_um + 2 * pad;
      const id = new Uint32Array(buf, 0, n);
      const nverts = new Uint8Array(buf, 4 * n, n);
      const q = new Uint16Array(buf, 4 * n + Math.ceil(n / 4) * 4, 2 * nv);
      const xy = new Float32Array(2 * nv), x0 = t.x0 - pad, y0 = t.y0 - pad;
      for (let i = 0; i < nv; i++) { xy[2 * i] = x0 + (q[2 * i] / 65535) * span; xy[2 * i + 1] = y0 + (q[2 * i + 1] / 65535) * span; }
      S.tiles.set(key, { id, nverts, xy }); S.loading--; this.draw(); this.segWarm();
    }).catch(() => { S.loading--; });
    return null;
  }
  // load the tiles under a box ahead of a zoom, so the outlines are ready when it lands
  prefetchSeg(b) {
    if (!this.seg) return;
    for (const t of this.seg.meta.tiles) if (!(t.x1 < b[0] || t.x0 > b[2] || t.y1 < b[1] || t.y0 > b[3])) this.segTile(t);
  }
  // A tile's outlines as Path2D objects in data units: one for all strokes, built once, and one per fill colour of the
  // current colouring. The previous colouring's fills are kept so that a colour change can crossfade.
  segPaths(T) {
    const xy = T.xy;
    if (!T.outline) {
      const p = new Path2D(); let o = 0;
      for (let c = 0; c < T.id.length; c++) {
        const nv = T.nverts[c];
        p.moveTo(xy[o], xy[o + 1]); for (let j = 1; j < nv; j++) p.lineTo(xy[o + 2 * j], xy[o + 2 * j + 1]); p.closePath();
        o += 2 * nv;
      }
      T.outline = p;
    }
    if (T.ver === this.colSerial) return T;
    if (T.byCol) { T.old = T.byCol; T.oldVer = T.ver; }
    const B = this.colB, byCol = new Map();
    let o = 0;
    for (let c = 0; c < T.id.length; c++) {
      const nv = T.nverts[c], k4 = 4 * T.id[c];
      if (B[k4 + 3] === 0) { o += 2 * nv; continue; }
      const col = `rgb(${B[k4]},${B[k4 + 1]},${B[k4 + 2]})`;
      let p = byCol.get(col);
      if (!p) byCol.set(col, (p = new Path2D()));
      p.moveTo(xy[o], xy[o + 1]); for (let j = 1; j < nv; j++) p.lineTo(xy[o + 2 * j], xy[o + 2 * j + 1]); p.closePath();
      o += 2 * nv;
    }
    T.byCol = byCol; T.ver = this.colSerial;
    return T;
  }
  // build the paths of loaded tiles in idle time, one tile per callback, so that a zoom does not stall on them
  segWarm() {
    const S = this.seg;
    if (!S || this.warming) return;
    const T = [...S.tiles.values()].find((x) => x && x.ver !== this.colSerial);
    if (!T) return;
    this.warming = true;
    const run = () => { this.warming = false; this.segPaths(T); this.segWarm(); };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 250 }); else setTimeout(run, 30);
  }
  drawSegmentation(g, a) {
    const S = this.seg, d = this.dpr;
    const [vx0, vy0] = this.toData(0, 0), [vx1, vy1] = this.toData(this.w, this.h);
    g.setTransform(d * this.k, 0, 0, d * this.k, d * (this.w / 2 - this.cx * this.k), d * (this.h / 2 - this.cy * this.k));
    g.lineJoin = 'round'; g.lineWidth = Math.min(0.8, 1.2 / this.k); g.strokeStyle = 'rgba(255,255,255,0.9)';
    let missing = 0, built = 0;
    for (const t of S.meta.tiles) {
      if (t.x1 < vx0 - 30 || t.x0 > vx1 + 30 || t.y1 < vy0 - 30 || t.y0 > vy1 + 30) continue;
      const T = this.segTile(t);
      if (!T) { missing++; continue; }
      if (T.ver !== this.colSerial) {
        if (built) { missing++; continue; }      // at most one tile built per frame; the rest follow on the next frames
        built++; this.segPaths(T);
      }
      const fade = this.mix < 1 && T.old && T.oldVer === this.colSerial - 1;
      if (fade) { g.globalAlpha = a; for (const [col, p] of T.old) { g.fillStyle = col; g.fill(p); } }
      g.globalAlpha = fade ? a * this.mix : a;
      for (const [col, p] of T.byCol) { g.fillStyle = col; g.fill(p); }
      g.globalAlpha = a; g.stroke(T.outline);
    }
    g.globalAlpha = 1;
    if (missing !== this.segMissing || (missing && built)) { this.segMissing = missing; this.draw(); }
  }
  drawOverlay() {
    const g = this.overlay.getContext('2d'), d = this.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.overlay.width, this.overlay.height);
    if (this.overlayHook) this.overlayHook(g, this);
    if (this.seg && this.tissue) { const a = this.segAlpha(); if (a > 0) this.drawSegmentation(g, a); return; }
    if (!this.polys || !this.tissue) return;
    const a = Math.max(0, Math.min(1, (this.k - 1.2) / 1.2));
    if (a <= 0) return;
    const [vx0, vy0] = this.toData(0, 0), [vx1, vy1] = this.toData(this.w, this.h);
    g.setTransform(d * this.k, 0, 0, d * this.k, d * (this.w / 2 - this.cx * this.k), d * (this.h / 2 - this.cy * this.k));
    g.globalAlpha = a; g.lineJoin = 'round';
    g.lineWidth = 0.6;
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    for (const p of this.polys) {
      if (p.cx < vx0 - 20 || p.cx > vx1 + 20 || p.cy < vy0 - 20 || p.cy > vy1 + 20) continue;
      const v = p.v;
      g.beginPath(); g.moveTo(v[0], v[1]);
      for (let k = 2; k < v.length; k += 2) g.lineTo(v[k], v[k + 1]);
      g.closePath();
      g.fillStyle = this.polyColor(p); g.fill(); g.stroke();
    }
    g.globalAlpha = 1;
  }

  // ------------------------------------------------------------ picking
  buildGrid() {
    const [x0, y0, x1, y1] = this.home, G = 256;
    const gx = (x1 - x0) / G || 1, gy = (y1 - y0) / G || 1;
    const count = new Uint32Array(G * G + 1);
    const cell = new Uint32Array(this.pts.n);
    for (let i = 0; i < this.pts.n; i++) {
      const c = Math.min(G - 1, ((this.pts.X[i] - x0) / gx) | 0) + G * Math.min(G - 1, ((this.pts.Y[i] - y0) / gy) | 0);
      cell[i] = c; count[c + 1]++;
    }
    for (let c = 0; c < G * G; c++) count[c + 1] += count[c];
    const fill = count.slice(0, G * G), idx = new Uint32Array(this.pts.n);
    for (let i = 0; i < this.pts.n; i++) idx[fill[cell[i]]++] = i;
    this.grid = { G, gx, gy, x0, y0, start: count, idx };
  }
  nearest(x, y, rad = 6) {
    const { G, gx, gy, x0, y0, start, idx } = this.grid;
    const cx0 = Math.max(0, ((x - rad - x0) / gx) | 0), cx1 = Math.min(G - 1, ((x + rad - x0) / gx) | 0);
    const cy0 = Math.max(0, ((y - rad - y0) / gy) | 0), cy1 = Math.min(G - 1, ((y + rad - y0) / gy) | 0);
    let best = -1, bd = rad * rad;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const c = cx + G * cy;
      for (let k = start[c]; k < start[c + 1]; k++) {
        const i = idx[k], dx = this.pts.X[i] - x, dy = this.pts.Y[i] - y, dd = dx * dx + dy * dy;
        if (dd < bd) { bd = dd; best = i; }
      }
    }
    return best;
  }
  colorOf(i) { const a = this.colA, b = this.colB, m = this.mix, k = 4 * i; return `rgb(${a[k] + (b[k] - a[k]) * m | 0},${a[k + 1] + (b[k + 1] - a[k + 1]) * m | 0},${a[k + 2] + (b[k + 2] - a[k + 2]) * m | 0})`; }
  pick(px, py) {
    const [x, y] = this.toData(px, py);
    const { G, gx, gy, x0, y0, start, idx } = this.grid;
    const rad = Math.max(this.tissue ? this.opt.cellUm * 0.8 : 0, 8 / this.k);
    const cx0 = Math.max(0, ((x - rad - x0) / gx) | 0), cx1 = Math.min(G - 1, ((x + rad - x0) / gx) | 0);
    const cy0 = Math.max(0, ((y - rad - y0) / gy) | 0), cy1 = Math.min(G - 1, ((y + rad - y0) / gy) | 0);
    let best = -1, bd = rad * rad;
    const lim = this.limit;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const c = cx + G * cy;
      for (let k = start[c]; k < start[c + 1]; k++) {
        const i = idx[k];
        if (lim < this.pts.n && i >= lim) continue;
        const dx = this.pts.X[i] - x, dy = this.pts.Y[i] - y, dd = dx * dx + dy * dy;
        if (dd < bd && this.colB[4 * i + 3] > 0) { bd = dd; best = i; }
      }
    }
    return best;
  }

  // ------------------------------------------------------------ interaction
  interact() {
    const c = this.overlay.parentElement;
    const ptrs = new Map();
    let last = null, pinch = null, moved = false;
    const T = tip();
    const onControl = (e) => e.target.closest && e.target.closest('.zoom-ctl, button, select, a, input');
    c.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || onControl(e)) return;
      c.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]); moved = false;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: this.k }; }
      last = [e.offsetX, e.offsetY]; T.hide();
    });
    c.addEventListener('pointermove', (e) => {
      if (ptrs.has(e.pointerId)) {
        ptrs.set(e.pointerId, [e.offsetX, e.offsetY]);
        if (ptrs.size === 2 && pinch) {
          const [a, b] = [...ptrs.values()];
          const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          this.zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (pinch.k * d) / pinch.d / this.k);
        } else if (last) {
          const dx = e.offsetX - last[0], dy = e.offsetY - last[1];
          if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
          this.cx -= dx / this.k; this.cy -= (this.tissue ? 1 : -1) * dy / this.k; this.fitted = null; this.draw();
          last = [e.offsetX, e.offsetY];
        }
        return;
      }
      if (onControl(e)) { T.hide(); return; }
      if (this.opt.onHover) {
        const i = this.pick(e.offsetX, e.offsetY);
        if (i >= 0) { const h = this.opt.onHover(i); if (h) T.show(h, e.clientX, e.clientY); else T.hide(); }
        else T.hide();
      }
    });
    const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) last = null; };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', () => T.hide());
    c.addEventListener('dblclick', (e) => { if (!onControl(e)) this.zoomAt(e.offsetX, e.offsetY, 2, 350); });
    c.addEventListener('wheel', (e) => {
      if (onControl(e)) return;
      if (this.opt.wheel === 'modifier' && !(e.ctrlKey || e.metaKey)) { this.hint(); return; }
      e.preventDefault();
      this.zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0018)));
    }, { passive: false });
  }
  zoomAt(px, py, f, ms = 0) {
    const kmin = this.fitScale(this.home) * 0.6, kmax = this.tissue ? 30 : this.fitScale(this.home) * 60;
    const k = Math.max(kmin, Math.min(kmax, this.k * f));
    const [x, y] = this.toData(px, py);
    const cx = x - (px - this.w / 2) / k, cy = y - (this.tissue ? 1 : -1) * (py - this.h / 2) / k;
    this.fitted = null;
    if (ms) return this.animateTo(cx, cy, k, ms);
    this.k = k; this.cx = cx; this.cy = cy; this.draw();
  }
  hint() {
    if (!this.hintEl) { this.hintEl = document.createElement('div'); this.hintEl.className = 'note'; this.hintEl.style.cssText += ';top:12px;bottom:auto;left:50%;right:auto;transform:translateX(-50%);background:rgba(255,255,255,.92);padding:6px 10px;border-radius:8px;'; this.host.appendChild(this.hintEl); }
    this.hintEl.textContent = `Hold ${/Mac/.test(navigator.platform) ? '⌘' : 'Ctrl'} and scroll to zoom`;
    this.hintEl.style.opacity = 1; clearTimeout(this.hintT); this.hintT = setTimeout(() => (this.hintEl.style.opacity = 0), 1200);
  }
  ui() {
    const z = document.createElement('div'); z.className = 'zoom-ctl';
    const btn = (label, title, fn) => { const b = document.createElement('button'); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = label; b.onclick = fn; z.appendChild(b); };
    const svg = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    btn(svg('<path d="M12 5v14M5 12h14"/>'), 'Zoom in', () => this.zoomAt(this.w / 2, this.h / 2, 1.8, 300));
    btn(svg('<path d="M5 12h14"/>'), 'Zoom out', () => this.zoomAt(this.w / 2, this.h / 2, 1 / 1.8, 300));
    btn(svg('<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>'), 'Reset view', () => this.fit(this.home, 600));
    this.host.appendChild(z);
    if (this.tissue) {
      this.hud = document.createElement('div'); this.hud.className = 'hud';
      this.hud.innerHTML = '<div class="scalebar"></div><div class="scalebar-l"></div>';
      this.host.appendChild(this.hud);
    }
  }
  updateScale() {
    if (!this.hud) return;
    const target = 110 / this.k; // µm in ~110 px
    const nice = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find((v) => v >= target * 0.6) || 5000;
    this.hud.firstChild.style.width = nice * this.k + 'px';
    this.hud.lastChild.textContent = nice >= 1000 ? `${nice / 1000} mm` : `${nice} µm`;
  }
  destroy() { this.ro.disconnect(); cancelAnimationFrame(this.raf); }
}
