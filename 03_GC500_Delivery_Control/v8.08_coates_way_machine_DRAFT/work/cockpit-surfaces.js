/* THE COCKPIT'S SURFACES — v5.81. Andrew Fisher, 23 Sep 2026, on the still from the seat: the wheel, the driver and the
   dashboard did not look right, and the Coates Way steering wheel had to look outstanding — the makeover approved,
   knowing it would change things — with his concept of a carbon dash, a suede rim
   and machined metal. The v5.80 cockpit had the right parts in the right places and the wrong skins: a 64-pixel
   "twill" that read as brown plastic under the garage's warm light, a rim as flat as rubber hose, labels drawn at
   a size the lens blurs. These are the skins, generated here at load — no image file, no download, the same on
   every device — each one sized in real millimetres on the car so a still can be checked against it.

   Every texture that has to exist in the node tests (which have no canvas) is a DataTexture made from numbers; the
   few that carry printed words (labels, the net, the engraved plate) are canvases and are made only where there is
   a document, with a plain material in their place otherwise. */

import {print} from './fx-quality.js';
const TAU = Math.PI * 2;
function lcg(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function tex(T, data, n, {srgb = false} = {}) {
  const t = new T.DataTexture(data, n, n, T.RGBAFormat);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.magFilter = T.LinearFilter; t.minFilter = T.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8; if (srgb) t.colorSpace = T.SRGBColorSpace; t.needsUpdate = true; return t;
}
/* a tangent-space normal map from a tileable height field (wrapped central differences); green is +v, as three.js
   reads a normal map */
function normalMap(T, H, n, strength) {
  const a = new Uint8Array(n * n * 4), at = (x, y) => H[((y + n) % n) * n + ((x + n) % n)];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
    a[i] = Math.round((-dx / l * .5 + .5) * 255); a[i + 1] = Math.round((-dy / l * .5 + .5) * 255); a[i + 2] = Math.round((1 / l * .5 + .5) * 255); a[i + 3] = 255;
  }
  return tex(T, a, n);
}
/* smooth tileable value noise, `cells` lattice cells across the tile */
function valueNoise(n, cells, seed) {
  const r = lcg(seed), g = Array.from({length: cells * cells}, r), out = new Float32Array(n * n);
  const sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const fx = x / n * cells, fy = y / n * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0);
    const v = (i, j) => g[((j % cells) * cells) + (i % cells)];
    const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * tx, b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * tx;
    out[y * n + x] = a + (b - a) * ty;
  }
  return out;
}

/* ---- CARBON TWILL. A 2×2 twill, the weave a race car's dash is laid up in: each tow floats over two and under two,
   and the float steps one tow along at every row, which is what draws the diagonal. 256 px, 16 tows across, so
   one tile is 64 mm and one tow crossing — a twill cell — is 4 mm on the car when the geometry's UVs are metres
   (metricUV, loftGeometry {metric:true}) and the texture repeats TWILL.perMetre times a metre. The tow is a
   rounded ridge with fibres along it and dives at each end of its float; the normal map is made from that same
   height, so the light and the pattern agree. Warp and weft differ a shade in the colour map and run at right
   angles in the anisotropy map — the reason real carbon flickers light-dark as you move round it. ---- */
export const TWILL = Object.freeze({size: 256, tows: 16, cellMetres: .004, get tileMetres() { return this.tows * this.cellMetres; }, get perMetre() { return 1 / (this.tows * this.cellMetres); }});
export function carbonTwill(T) {
  const n = TWILL.size, c = n / TWILL.tows, col = new Uint8Array(n * n * 4), aniso = new Uint8Array(n * n * 4), H = new Float32Array(n * n);
  const r = lcg(26), towShade = Array.from({length: TWILL.tows * TWILL.tows}, () => .92 + .16 * r());
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const cx = Math.floor(x / c), cy = Math.floor(y / c), fx = (x % c + .5) / c, fy = (y % c + .5) / c, k = (cx + cy) & 3, warp = k < 2;
    const along = warp ? (k + fy) / 2 : (k - 2 + fx) / 2, across = warp ? fx : fy;
    const crown = Math.pow(Math.sin(Math.PI * across), .45), dive = Math.pow(Math.sin(Math.PI * along), .3);
    const fibre = .5 + .5 * Math.sin(TAU * (across * 7.5 + (warp ? cx : cy) * .37)) * Math.sin(TAU * (across * 2.1 + .2));
    const h = crown * dive * (.92 + .08 * fibre), i = y * n + x; H[i] = h;
    const shade = towShade[(warp ? cx : cy) * TWILL.tows + (warp ? cy >> 1 : cx >> 1) % TWILL.tows];
    const v = ((warp ? 29 : 24) * (.55 + .45 * h) + fibre * 3) * shade;   /* sRGB 13–32: carbon is near black; its light is in its reflections, and warp and weft differ in those (the anisotropy map) more than in colour */
    col[i * 4] = Math.round(v * .92); col[i * 4 + 1] = Math.round(v * .97); col[i * 4 + 2] = Math.round(v * 1.1); col[i * 4 + 3] = 255;   /* a cool grey: the hall's light is warm and would otherwise make it brown */
    aniso[i * 4] = warp ? 128 : 255; aniso[i * 4 + 1] = warp ? 255 : 128; aniso[i * 4 + 2] = Math.round(255 * (.35 + .65 * crown)); aniso[i * 4 + 3] = 255;
  }
  return {map: tex(T, col, n, {srgb: true}), normalMap: normalMap(T, H, n, 2.2), anisotropyMap: tex(T, aniso, n), perMetre: TWILL.perMetre};
}

/* ---- SUEDE (the rim's alcantara and the seat's cloth). A fine nap: three octaves of noise, the finest a fibre's
   width at the rim's scale, as a colour lift of a few per cent and as the bump the sheen catches. ---- */
export function suede(T, seed = 7) {
  const n = 256, a = valueNoise(n, 64, seed), b = valueNoise(n, 16, seed + 1), c = valueNoise(n, 4, seed + 2), col = new Uint8Array(n * n * 4), bump = new Uint8Array(n * n * 4);
  for (let i = 0; i < n * n; i++) {
    const v = .55 * a[i] + .3 * b[i] + .15 * c[i];
    col[i * 4] = col[i * 4 + 1] = col[i * 4 + 2] = Math.round(200 + 55 * v); col[i * 4 + 3] = 255;
    bump[i * 4] = bump[i * 4 + 1] = bump[i * 4 + 2] = Math.round(255 * (.7 * a[i] + .3 * b[i])); bump[i * 4 + 3] = 255;
  }
  return {map: tex(T, col, n, {srgb: true}), bumpMap: tex(T, bump, n)};
}

/* ---- BRUSHED AND MACHINED METAL. Streaks along u: each row its own depth, varying slowly along it — on a flat
   plate that is a brushed finish, and on a lathe profile (u round the part) it is the turning marks. Used as the
   roughness map (three reads green, and MULTIPLIES the material's roughness by it — so it sits between .72 and 1 and
   the material's own roughness is the finish; the first cut, .22–.44, turned a satin .34 into chrome) and as a bump. ---- */
export function brushed(T, seed = 11) {
  const n = 256, r = lcg(seed), rows = Array.from({length: n}, r), slow = valueNoise(n, 8, seed + 3), rough = new Uint8Array(n * n * 4), bump = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, line = rows[y] * .7 + rows[(y + 1) % n] * .3, v = .55 * line + .3 * slow[i] + .15 * r();
    rough[i * 4] = rough[i * 4 + 1] = rough[i * 4 + 2] = Math.round(255 * (.72 + .28 * v)); rough[i * 4 + 3] = 255;
    bump[i * 4] = bump[i * 4 + 1] = bump[i * 4 + 2] = Math.round(255 * line); bump[i * 4 + 3] = 255;
  }
  return {roughnessMap: tex(T, rough, n), bumpMap: tex(T, bump, n)};
}

/* ---- WEBBING. The harness's belt: a tight plain weave, 64 px to 16 mm of belt, orange by the material's colour. ---- */
export function webbing(T) {
  const n = 64, col = new Uint8Array(n * n * 4), H = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const over = ((x >> 2) + (y >> 1)) & 1, f = over ? Math.sin(Math.PI * ((x & 3) + .5) / 4) : Math.sin(Math.PI * ((y & 1) + .5) / 2);
    const i = y * n + x; H[i] = f * (over ? 1 : .7);
    const v = Math.round(190 + 65 * H[i]); col[i * 4] = col[i * 4 + 1] = col[i * 4 + 2] = v; col[i * 4 + 3] = 255;
  }
  return {map: tex(T, col, n, {srgb: true}), normalMap: normalMap(T, H, n, 1.2)};
}

/* ---- UVs IN METRES. A texture repeated N times a metre is then the same size on every face of every part: the
   twill's 4 mm on the dash, the console and the gauge pod alike. metricUV projects each vertex along its normal's
   strongest axis — exact on a box, whose faces have their own vertices; scaleUV turns a cylinder's or a lathe's
   0..1 into metres round and along it. ---- */
export function metricUV(g) {
  const p = g.attributes.position, nrm = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    let u, v; if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); } else if (ay >= az) { u = p.getX(i); v = p.getZ(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  g.setAttribute('uv', new p.constructor(uv, 2)); return g;
}
export function scaleUV(g, su, sv) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); uv.needsUpdate = true; return g; }
/* the metres a UV unit spans on a mesh, measured over its triangles (tests/engine.test.mjs holds the twill to 4 mm with it) */
export function uvMetres(g) {
  const p = g.attributes.position, uv = g.attributes.uv, ix = g.index; let sw = 0, su = 0; const n = ix ? ix.count : p.count, at = k => ix ? ix.getX(k) : k;
  for (let k = 0; k < n; k += 3) for (let e = 0; e < 3; e++) {
    const a = at(k + e), b = at(k + (e + 1) % 3), dw = Math.hypot(p.getX(a) - p.getX(b), p.getY(a) - p.getY(b), p.getZ(a) - p.getZ(b)), du = Math.hypot(uv.getX(a) - uv.getX(b), uv.getY(a) - uv.getY(b));
    if (dw > 1e-6 && du > 1e-9) { sw += dw; su += du; }
  }
  return su > 0 ? sw / su : 0;
}

/* ---- PRINTED THINGS, where there is a document: a canvas the size asked for, drawn once ---- */
/* v8.08 — a print (fx-quality.js): the drawing is laid out in proportions of the canvas it is given, so on the Balanced, High and Ultra
   rungs it is drawn again at 1.5× or 2× the pixels in an idle moment and the labels, the gauge faces and the plates stay crisp in a 4K
   frame. `live`: the caller redraws the canvas itself (the driver's display, the radio's window) — drawn once at the size given and
   left to the caller, as before. */
export function canvasTexture(T, w, h, draw, {srgb = true, repeat = false, live = false, maxScale = 2} = {}) {
  if (typeof document === 'undefined') return null;
  const p = print(w, h, draw, {mode: 'pixel', srgb, live, maxScale});
  if (repeat) p.texture.wrapS = p.texture.wrapT = T.RepeatWrapping;
  return p;
}
