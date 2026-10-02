/* v8.08 — CRYSTAL CLEAR. Andrew Fisher, 2 Oct 2026: "Make this all 4k crystal clear. Improve every thing on here. 10/10".

   One place for what the picture's sharpness depends on, so the rungs of the Quality button mean the same thing to every
   file that draws something:

   · TEXTURE FILTERING. Every texture made after this module loads filters at 16× anisotropy (8× on a phone; three.js clamps
     it to what the chip offers), and upgradeTextures() walks a finished scene and gives the ones that were made with less, or
     with no mipmaps at all (a DataTexture's default), proper mipmaps and the rung's anisotropy. A floor, a sign or a decal
     seen at a glancing angle stays sharp instead of smearing into its average colour.
   · PRINTS. Every canvas the scene draws words or artwork on (the garage signs, the Life Saving Rules, the values wheel, the
     cockpit's label sheets, the tyre lettering) is drawn through print(): at its own size on load, exactly as before — so the
     page opens no slower — and then, on the Balanced, High and Ultra rungs, drawn again a piece at a time in idle moments at
     1.5× or 2× the pixels, so a 4K frame never magnifies a letter. A phone on the Laptop rung never redraws anything.
   · THE LADDER. The rungs' pixel-ratio caps, shadow-map sizes, environment-capture sizes and multisample counts, and the 4K
     capture (a true 3840 × 2160 still through the same post stack the screen uses).

   Nothing here downloads anything, and nothing here writes anywhere. */
import * as T from './vendor/three.module.js';

const HAS_DOC = typeof document !== 'undefined';
const UA = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
/* a phone or a tablet: by its user agent, or (an iPad says it is a Mac) by a coarse pointer on a touch screen */
const COARSE = (() => { try { return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches && (navigator.maxTouchPoints || 0) > 0; } catch (e) { return false; } })();
export const MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(UA) || COARSE;
/* every texture constructed from here on (three.js reads this default in the Texture constructor) */
/* ?fx=aniso:1,print:1 holds the anisotropy or the print scale at a value, for measuring what each costs (like car-app.js's ?tune=) */
const FIX = {}; try { const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('fx') : null; if (q) q.split(',').forEach(p => { const [k, v] = p.split(':'); if (isFinite(+v)) FIX[k] = +v; }); } catch (e) {}
T.Texture.DEFAULT_ANISOTROPY = FIX.aniso || (MOBILE ? 8 : 16);

/* THE RUNGS. print: the canvas scale; aniso: the anisotropy upgradeTextures() gives; shadow: the key light's map; env: the
   garage cube's face size; samples: the post stack's multisampling; still: the cap on the still pixel ratio (the device's own
   ratio up to this, then the adaptive scale); move: while the camera moves. Ultra also SUPERSAMPLES: whatever the screen,
   the drawing buffer is brought up to 3840 × 2160 worth of pixels (ratioFor below). */
export const TIERS = Object.freeze({
  laptop:   Object.freeze({print: 1,   aniso: MOBILE ? 8 : 16, shadow: 2048, env: 256, samples: 4, still: 3, move: 1}),
  balanced: Object.freeze({print: 1.5, aniso: 16, shadow: 4096, env: 512, samples: 4, still: 3, move: 1.25}),
  high:     Object.freeze({print: 2,   aniso: 16, shadow: 4096, env: 512, samples: 4, still: 3, move: 1.5}),
  ultra:    Object.freeze({print: 2,   aniso: 16, shadow: 4096, env: 512, samples: 4, still: 4, move: 1.5, pixels: 3840 * 2160}),
});
/* v8.08 review: a phone is offered Laptop and Balanced only. High and Ultra (prints at 2×, a 4096 shadow map, a buffer supersampled to
   3840 × 2160) ask more graphics memory than a phone has, and a phone that runs out loses the picture altogether */
export const QUALITY_ORDER = Object.freeze(MOBILE ? ['laptop', 'balanced'] : ['laptop', 'balanced', 'high', 'ultra']);
export const tierOf = q => { const t = TIERS[q] || TIERS.laptop; return FIX.aniso || FIX.print ? {...t, aniso: FIX.aniso || t.aniso, print: FIX.print || t.print} : t; };
export const CAPTURE = Object.freeze({width: 3840, height: 2160});

/* the still pixel ratio a rung asks for on this screen: the device's own (never less: a still frame is never blurry), capped
   by the rung; Ultra renders at least 3840 × 2160 worth of pixels however small the CSS viewport, up to 4× */
export function ratioFor(q, {dev = 1, cssW = 1, cssH = 1} = {}) {
  const t = tierOf(q); let r = Math.min(dev, t.still);
  if (t.pixels && cssW > 0 && cssH > 0) r = Math.max(r, Math.min(t.still, Math.sqrt(t.pixels / (cssW * cssH))));
  return r;
}
export const shadowSize = q => tierOf(q).shadow;
export const envSize = q => tierOf(q).env;
export function samplesFor(renderer, q) {
  if (!renderer || !renderer.capabilities || !renderer.capabilities.isWebGL2) return 0;
  let max = 4; try { max = renderer.getContext().getParameter(renderer.getContext().MAX_SAMPLES) || 4; } catch (e) {}
  return Math.max(0, Math.min(max, tierOf(q).samples));
}

/* ---------------------------------------------------------------- prints */
const prints = [];
let scaleNow = 1, maxDim = MOBILE ? 2048 : 4096, pending = null, budgetMs = 6;
/* no print is drawn past about 2.4 million pixels (1550 × 1550; 1.2 million on a phone): a sign or a label gets its full 2×, a sheet
   already drawn big (the Life Saving Rules, the values wheel, the tool wall) only what keeps it under that. All 71 prints come to about
   27 MP at their own size, about 49 MP on Balanced and about 71 MP on High and Ultra (measured: printStats) */
const MAX_PIXELS = MOBILE ? 1.2e6 : 2.4e6;
/* v8.08 review — AND ALL OF THEM TOGETHER INSIDE A BUDGET, set by the rung (a megapixel is 4 MB of canvas, and as much again on the graphics
   card with its mipmaps): on a laptop 40 MP on Balanced, about 56 MP on High, and on Ultra — the setting the person has chosen for the sharpest
   picture — the full 2× (about 72 MP); on a phone 20 MP whatever the rung. Past it the rung's scale is lowered for every print alike until the
   total fits; no print is ever drawn smaller than its own size, so a phone, whose prints already come to more than 20 MP at their own size,
   keeps them there. A phone's prints also never go past 1.5× (setPrintScale). */
const BUDGETS = {laptop: 40e6, balanced: 40e6, high: 56e6, ultra: 72e6}, PHONE_BUDGET = 20e6, PHONE_SCALE = 1.5;
let BUDGET = MOBILE ? PHONE_BUDGET : BUDGETS.laptop;
/* a canvas the size asked for, drawn once, registered so a higher rung can draw it again sharper.
   mode 'logical': draw(g, w, h) works in the base size's coordinates and the context is scaled to the canvas;
   mode 'pixel': draw(g, cw, ch) is given the canvas's own size (a drawing laid out in proportions).
   live: the caller redraws the canvas itself (a screen): drawn at the base size and never registered. */
export function print(w, h, draw, {mode = 'logical', live = false, srgb = true, maxScale = 2, name = ''} = {}) {
  if (!HAS_DOC) return null;
  const c = document.createElement('canvas'), entry = {w, h, draw, mode, canvas: c, texture: null, scale: 0, maxScale, name};
  paint(entry, 1, true);
  const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace;
  t.minFilter = T.LinearMipmapLinearFilter; t.magFilter = T.LinearFilter; t.generateMipmaps = true; t.anisotropy = T.Texture.DEFAULT_ANISOTROPY;
  entry.texture = t; t.userData.print = entry;
  if (!live) { prints.push(entry); if (fitScale(entry, scaleNow) > entry.scale + .01) schedule(); }
  return {texture: t, canvas: c};
}
/* the scale an entry is drawn at on this rung: never past its own cap, never past the largest canvas this device should hold, never under its base size */
function fitRaw(e, k) { return Math.max(1, Math.min(k, e.maxScale, maxDim / Math.max(e.w, e.h), Math.sqrt(MAX_PIXELS / (e.w * e.h)))); }
const totalAt = k => prints.reduce((n, e) => n + e.w * e.h * fitRaw(e, k) ** 2, 0);
let budgetKey = '', budgetK = 1;
/* the largest scale up to k at which every print together stays inside the budget (worked out again when the rung or the prints change) */
function budgetScale(k) { const key = k + '|' + prints.length + '|' + BUDGET; if (key === budgetKey) return budgetK; budgetKey = key;
  if (k <= 1 || totalAt(k) <= BUDGET) return (budgetK = k);
  let lo = 1, hi = k; for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (totalAt(mid) <= BUDGET) lo = mid; else hi = mid; } return (budgetK = lo); }
function fitScale(e, k) { return fitRaw(e, budgetScale(k)); }
/* v8.08 review: with no 2D context (iOS gives none once its canvas memory is spent) a print is skipped as it is — not resized, not cleared —
   and not tried again; a redraw that fails leaves the picture already on the graphics card in place. Returns whether it drew. */
function paint(entry, k, first = false) {
  const c = entry.canvas, cw = Math.max(1, Math.round(entry.w * k)), ch = Math.max(1, Math.round(entry.h * k)), ow = c.width, oh = c.height;
  let g = c.getContext('2d'); if (!g) { entry.failed = true; return false; }
  if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; g = c.getContext('2d'); if (!g) { c.width = ow; c.height = oh; entry.failed = true; return false; } }
  try {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch);
    if (entry.mode === 'logical') { g.setTransform(cw / entry.w, 0, 0, ch / entry.h, 0, 0); entry.draw(g, entry.w, entry.h); }
    else entry.draw(g, cw, ch);
    g.setTransform(1, 0, 0, 1, 0, 0);
  } catch (e) { if (first) throw e; entry.failed = true; try { g.setTransform(1, 0, 0, 1, 0, 0); } catch (e2) {} return false; }
  entry.scale = k; return true;
}
function redraw(entry, k) {
  if (!paint(entry, k)) return;
  const t = entry.texture; if (!t) return;
  /* the GPU copy was allocated at the old size (immutable storage): free it, and the next frame uploads the new one with its mipmaps */
  t.dispose(); t.needsUpdate = true;
}
const idle = cb => (typeof requestIdleCallback === 'function' ? requestIdleCallback(cb, {timeout: 400}) : setTimeout(() => cb({timeRemaining: () => budgetMs}), 40));
function schedule() { if (pending || !HAS_DOC) return; pending = idle(step); }
function step(deadline) {
  pending = null; const t0 = performance.now();
  for (const e of prints) {
    if (e.failed) continue;
    const k = fitScale(e, scaleNow);
    if (Math.abs(e.scale - k) < .01) continue;
    try { redraw(e, k); } catch (err) { e.failed = true; }   /* (one print that throws never stops the others) */
    if (performance.now() - t0 > budgetMs || (deadline && deadline.timeRemaining && deadline.timeRemaining() < 1)) break;
  }
  if (prints.some(e => !e.failed && Math.abs(e.scale - fitScale(e, scaleNow)) >= .01)) schedule();
}
/* the rung changed: prints are drawn again at its scale, a few at a time, when the page is idle */
export const currentPrintScale = () => scaleNow;
export function setPrintScale(k) { scaleNow = Math.max(1, Math.min(MOBILE ? PHONE_SCALE : 2, k || 1)); schedule(); }
/* every print at the current scale, now (the 4K capture wants them all before it draws) */
export function flushPrints() { for (const e of prints) { if (e.failed) continue; const k = fitScale(e, scaleNow); if (Math.abs(e.scale - k) >= .01) { try { redraw(e, k); } catch (err) { e.failed = true; } } } }
export function printStats() {
  let px = 0, done = 0, failed = 0; for (const e of prints) { px += e.canvas.width * e.canvas.height; if (e.failed) failed++; else if (Math.abs(e.scale - fitScale(e, scaleNow)) < .01) done++; }
  return {count: prints.length, scale: scaleNow, allowed: +budgetScale(scaleNow).toFixed(3), budget: BUDGET / 1e6, megapixels: +(px / 1e6).toFixed(2), done, failed, list: prints.map(e => [e.name || '', e.w, e.h, +e.scale.toFixed(2)])};
}

/* ---------------------------------------------------------------- shared shader switches */
/* detail: the paint's flakes and the tyres' grain, worked out per pixel; off on a phone on the Laptop rung (one uniform branch, no
   recompile when the rung changes) */
export const FX_UNIFORMS = {fxDetail: {value: MOBILE ? 0 : 1}};

/* ---------------------------------------------------------------- the rung, applied */
let current = 'laptop', renderer0 = null;
export function setQuality(q, {renderer = renderer0, scene = null} = {}) {
  current = TIERS[q] ? q : 'laptop'; if (renderer) renderer0 = renderer;
  FX_UNIFORMS.fxDetail.value = current === 'laptop' && MOBILE ? 0 : 1;
  BUDGET = MOBILE ? PHONE_BUDGET : BUDGETS[current];
  setPrintScale(tierOf(current).print);
  if (scene) upgradeTextures(scene, {renderer: renderer0, aniso: tierOf(current).aniso});
  return tierOf(current);
}
export const quality = () => current;

/* ---------------------------------------------------------------- every texture in a scene */
const MAPS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'alphaMap', 'emissiveMap', 'aoMap', 'lightMap', 'specularMap', 'displacementMap',
  'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap', 'sheenColorMap', 'sheenRoughnessMap', 'anisotropyMap', 'iridescenceMap', 'iridescenceThicknessMap',
  'transmissionMap', 'thicknessMap', 'specularIntensityMap', 'specularColorMap', 'matcap', 'gradientMap'];
const isPow2 = n => (n & (n - 1)) === 0;
/* mipmaps and anisotropy for everything a scene's materials sample (uniform textures of ShaderMaterials too). A texture made
   without mipmaps — a DataTexture's default, a linear-filtered atlas — gets them (WebGL2 mips any size; WebGL1 only powers of
   two); a texture whose filtering changes is re-uploaded once. Render targets, cube and environment maps, video and float data
   are left alone. Returns how many textures it changed. */
export function upgradeTextures(root, {renderer = renderer0, aniso = tierOf(current).aniso} = {}) {
  const max = renderer && renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : aniso, webgl2 = !renderer || renderer.capabilities.isWebGL2;
  const want = Math.max(1, Math.min(aniso, max || 1)), seen = new Set(); let changed = 0;
  const fix = t => {
    if (!t || !t.isTexture || seen.has(t)) return; seen.add(t);
    if (t.isRenderTargetTexture || t.isCubeTexture || t.isVideoTexture || t.isDepthTexture || t.isCompressedTexture || t.isData3DTexture || t.isDataArrayTexture) return;
    if (t.mapping !== T.UVMapping) return;
    const img = t.image, w = img && (img.width || img.videoWidth), h = img && (img.height || img.videoHeight);
    if (!w || !h || w < 4 || h < 4) return;
    if (t.type === T.FloatType || t.type === T.HalfFloatType) return;
    let dirty = false;
    if (t.magFilter === T.NearestFilter && !t.userData.pixelArt) { t.magFilter = T.LinearFilter; dirty = true; }
    const mips = t.minFilter === T.LinearMipmapLinearFilter || t.minFilter === T.NearestMipmapLinearFilter || t.minFilter === T.LinearMipmapNearestFilter;
    if (!mips && (webgl2 || (isPow2(w) && isPow2(h))) && !t.mipmaps.length && !t.userData.noMips) { t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true; dirty = true; }
    else if (t.minFilter === T.LinearMipmapNearestFilter) { t.minFilter = T.LinearMipmapLinearFilter; dirty = true; }
    if (t.anisotropy < want) { t.anisotropy = want; dirty = true; }
    if (dirty) { if (t.version > 0) { t.dispose(); t.needsUpdate = true; } changed++; }
  };
  root.traverse(o => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      if (!m) continue;
      for (const k of MAPS) fix(m[k]);
      if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u && u.value && u.value.isTexture) fix(u.value);
    }
  });
  return changed;
}

/* ---------------------------------------------------------------- the 4K still */
/* A true 3840 × 2160 frame: the drawing buffer is set to it at ratio 1 (multisampled, as the screen is), the post stack (if
   the rung has one) is sized to it, the shadow map redrawn, every print brought to the current rung's scale, one frame drawn
   and copied out, and everything put back before the browser paints. `render(post)` draws the frame (through the composer when post is
   true, else the plain renderer — the caller's own call). v8.08 review: on a phone the still is drawn without the post stack — its
   full-size ambient-occlusion targets on top of a 3840 × 2160 buffer are what makes a phone drop the graphics context — and the composer
   is not resized. Resolves with {blob, width, height, post}. */
let lastCapture = null;
export function capture4K({renderer, camera, composer = null, render, width = CAPTURE.width, height = CAPTURE.height, type = 'image/png', post = !MOBILE}) {
  return new Promise((resolve, reject) => {
    if (!post) composer = null;
    const size = renderer.getSize(new T.Vector2()), ratio = renderer.getPixelRatio(), aspect = camera.aspect, cRatio = composer ? ratio : 0;
    let restored = false;
    const restore = () => { if (restored) return; restored = true;
      renderer.setPixelRatio(ratio); renderer.setSize(size.x, size.y, false);
      if (composer) { composer.setPixelRatio(cRatio); composer.setSize(size.x, size.y); }
      camera.aspect = aspect; camera.updateProjectionMatrix(); if (renderer.shadowMap) renderer.shadowMap.needsUpdate = true; };
    try {
      flushPrints();
      renderer.setPixelRatio(1); renderer.setSize(width, height, false);
      if (composer) { composer.setPixelRatio(1); composer.setSize(width, height); }
      camera.aspect = width / height; camera.updateProjectionMatrix();
      if (renderer.shadowMap) renderer.shadowMap.needsUpdate = true;
      render(!!composer);
      const canvas = renderer.domElement, w = canvas.width, h = canvas.height;
      /* the copy is taken now, synchronously (toBlob snapshots the bitmap when called); the size goes back straight after */
      lastCapture = {width: w, height: h, post: !!composer};
      canvas.toBlob(blob => blob ? resolve({blob, width: w, height: h, post: !!composer}) : reject(new Error('no image')), type);
      restore();
    } catch (e) { restore(); reject(e); }
  });
}
/* the width and height a PNG says it has (for the tests) */
export async function pngSize(blob) { const b = new DataView(await blob.slice(0, 24).arrayBuffer()); return {width: b.getUint32(16), height: b.getUint32(20)}; }

/* for the harness */
export const fxInfo = () => ({quality: current, tier: tierOf(current), prints: printStats(), mobile: MOBILE, defaultAnisotropy: T.Texture.DEFAULT_ANISOTROPY, qualities: QUALITY_ORDER.slice(), lastCapture});
if (typeof window !== 'undefined') window.__fx = {get info() { return fxInfo(); }, flushPrints, printStats, upgradeTextures, setQuality, ratioFor, TIERS, capture4K, pngSize};
