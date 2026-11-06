// v8.09 crystal clear — the image-quality tests for the Coates Way machine. Author: Andrew Fisher. Read only: the machine is served
// from a local folder by machine_rig.js and anything it does not have is fetched from the live machine by GET; nothing is ever sent.
//
// From 03_GC500_Delivery_Control, with CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g):
//   ROOT=v8.09_coates_way_machine_DRAFT/work node v8.09_coates_way_machine_DRAFT/evidence/fx_tests.js
//   DEVICE=desktop|phone|both (default both) · SHOTS=<dir> also saves the canvas at each rung · OUT=<file.json> saves the results
//   PRESETS=laptop,balanced,high,ultra (the rungs to step through) · CAPTURE=0 skips the 4K still · W, H, DPR override the viewport
//   QUERY (default ?tune=adapt:0) is added to the page address, e.g. '?tune=adapt:0&fx=aniso:1' to measure without anisotropic filtering
//
// What it checks, on a 1,440 × 900 laptop at device pixel ratio 2 and a 390 × 844 phone at 3:
//   · no page error and no console error from load to the end;
//   · the WebGL canvas is multisampled (antialias on, SAMPLES ≥ 4), and the post stack's target too on the rungs that have one;
//   · every 2D texture the scene samples is mipmapped and filtered at the device's anisotropy (16, or what the chip offers; 8 on a
//     phone), the livery atlas included;
//   · per rung: the renderer's pixel ratio and drawing-buffer size when the camera is still (the screen's own ratio; Ultra at least
//     3840 × 2160 worth of pixels), the post stack, the prints' scale (all redrawn), and the frame time (median of three frames);
//   · the 4K capture is a PNG of exactly 3840 × 2160, and the canvas is back at its own size afterwards;
//   · on the phone: the Laptop rung, prints at their base size, no rim light, the per-pixel detail switched off.
//   · v8.09 review: on the phone only Laptop and Balanced are offered (High and Ultra are not on its Quality button), its prints never go
//     past 1.5×, all the prints together stay inside the budget (on a laptop 40 MP Balanced, 56 MP High, 72 MP Ultra — the full 2×; 20 MP on
//     a phone, or every print at its own size where its own sizes already come to more), and its 4K still is drawn without the post stack.
//   · Codex review fixes (f45961b): Quality Balanced/Laptop round and round leaves the renderer's texture count where it was (CYCLES=0 skips);
//     and back from a hidden tab, Balanced stays Balanced (a small extra page; HIDDEN=0 skips).
//
// The software renderer the rig runs (SwiftShader) draws a frame in seconds, not milliseconds, so the page's animation loop is
// stepped by hand here: every frame measured is a whole frame, and nothing the page does on its own (the adaptive resolution, the
// "drop to Laptop under 24 fps" check) is mistaken for what a real graphics chip would do. Frame times are for comparing rungs and
// builds on the same machine, not for reading as a device's frame rate.
const fs = require('fs'), path = require('path');
const {openMachine} = require('./machine_rig');
const wait = ms => new Promise(r => setTimeout(r, ms));
const ROOT = process.env.ROOT || 'v8.09_coates_way_machine_DRAFT/work';

/* the page's animation loop, by hand: requestAnimationFrame queues instead of scheduling, and __step() runs what is queued */
async function hijack(page) {
  await page.evaluate(() => { if (window.__step) return; window.__rafQ = [];
    window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return window.__rafQ.length; };
    window.__step = () => { const q = window.__rafQ.splice(0), t = performance.now(); for (const cb of q) { try { cb(t); } catch (e) { console.error(e); } } return q.length; }; });
  await page.waitForFunction(() => window.__rafQ.length > 0, null, {timeout: 600000, polling: 200});
}
/* one whole frame, timed to the end of the graphics work */
const frame = page => page.evaluate(() => { const r = window.__cw.renderer, f0 = r.info.render.frame, t0 = performance.now(); window.__step(); r.getContext().finish(); const ms = performance.now() - t0;
  window.__lastFrame = {ms, renders: r.info.render.frame - f0, calls: r.info.render.calls, triangles: r.info.render.triangles}; return ms; });
/* a frame's cost, timed on a frame that really drew (the page skips a frame that comes inside its own frame budget) */
async function timedFrame(page) { for (let i = 0; i < 4; i++) { await wait(60); const ms = await frame(page); const lf = await page.evaluate(() => window.__lastFrame); if (lf.renders > 0) return {ms, ...lf}; } return {ms: NaN, renders: 0}; }
const state = page => page.evaluate(() => { const c = window.__cw, r = c.renderer, gl = r.getContext(), v = document.getElementById('viewport').getBoundingClientRect();
  return {quality: c.quality, ratio: r.getPixelRatio(), target: c.motion.target, moving: c.motion.moving, buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], css: [Math.round(v.width), Math.round(v.height)],
    composerSamples: c.composerSamples, shadow: c.shadowMapSize, dprScale: c.dprScale, fx: window.__fx ? window.__fx.info : null, label: document.getElementById('quality').textContent}; });
async function setQuality(page, q) {
  for (let i = 0; i < 6; i++) { const now = await page.evaluate(() => window.__cw.quality); if (now === q) return true; await page.evaluate(() => document.getElementById('quality').click()); }
  return page.evaluate(q => window.__cw.quality === q, q);
}
/* frames until the camera has stopped and the still ratio is in force, then until every print is drawn at the rung's scale */
async function settle(page, {max = 14} = {}) {
  let n = 0; for (; n < max; n++) { await frame(page); const s = await state(page); if (n >= 1 && !s.moving && Math.abs(s.ratio - s.target) < .01) break; }
  for (let i = 0; i < 240; i++) { const ok = await page.evaluate(() => !window.__fx || window.__fx.info.prints.done === window.__fx.info.prints.count); if (ok) break; await wait(250); }
  await frame(page); return n + 1;
}
/* the page's own "drop to Laptop under 24 fps" check runs once, six seconds after the first frame; a software renderer always trips it, and on
   Laptop it would also cap the ratio at 2 (lowDpr). Let it fire while on Balanced, so it only puts the rung back to Laptop. */
async function passQualityCheck(page) {
  await setQuality(page, 'balanced'); const t0 = Date.now();
  while (Date.now() - t0 < 30000) { await frame(page); if (Date.now() - t0 > 7500 && await page.evaluate(() => window.__cw.quality) === 'laptop') return true; await wait(1100); }
  return false;
}
async function textures(page, want) {
  return page.evaluate(want => { const r = window.__cw.renderer, max = r.capabilities.getMaxAnisotropy(), need = Math.min(want, max), seen = new Set(), low = [], noMip = [];
    let total = 0, atlas = null;
    const mipF = t => [1008, 1005, 1004, 1007].includes(t.minFilter);   /* LinearMipmapLinear, NearestMipmapLinear, NearestMipmapNearest, LinearMipmapNearest */
    const look = (t, where) => { if (!t || !t.isTexture || seen.has(t)) return; seen.add(t);
      if (t.isRenderTargetTexture || t.isCubeTexture || t.isVideoTexture || t.isDepthTexture || t.isCompressedTexture || t.mapping !== 300) return;
      const img = t.image, w = img && (img.width || 0), h = img && (img.height || 0); if (w < 4 || h < 4 || t.type === 1015 || t.type === 1016) return;
      total++; if (t.isDataTexture && w === 1024 && h === 512) atlas = {mip: mipF(t) && t.generateMipmaps, aniso: t.anisotropy};
      if (!mipF(t) && !t.userData.noMips) noMip.push(where + ' ' + w + 'x' + h);
      else if (t.anisotropy < need) low.push(where + ' ' + w + 'x' + h + ' @' + t.anisotropy); };
    window.__cw.scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { if (!m) continue;
      for (const k in m) look(m[k], (o.name || o.type) + '.' + k); if (m.uniforms) for (const k in m.uniforms) look(m.uniforms[k] && m.uniforms[k].value, (o.name || o.type) + '.u.' + k); } });
    return {total, need, max, low: low.length, lowList: low.slice(0, 12), noMip: noMip.length, noMipList: noMip.slice(0, 12), atlas}; }, want);
}
async function canvasPng(page, file) {
  /* read in the same task as a frame that really drew (the drawing buffer is not kept once the frame is shown) */
  let url = null; for (let i = 0; i < 5 && !url; i++) { await wait(80); url = await page.evaluate(() => { const r = window.__cw.renderer, f0 = r.info.render.frame; window.__step(); return r.info.render.frame > f0 ? r.domElement.toDataURL('image/png') : null; }); }
  if (!url) throw new Error('no frame drawn for the picture');
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
}
async function capture(page) {
  const before = await state(page);
  const [dl] = await Promise.all([page.waitForEvent('download', {timeout: 900000}), page.evaluate(() => document.getElementById('capture').click())]);
  const p = await dl.path(), b = fs.readFileSync(p), png = b.slice(1, 4).toString() === 'PNG';
  if (process.env.SHOTS) fs.writeFileSync(path.join(process.env.SHOTS, `${process.env.TAG || 'run'}_capture4k.png`), b);
  await frame(page); const after = await state(page);
  return {png, width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length, restored: after.buffer.join('x') === before.buffer.join('x'), before: before.buffer, after: after.buffer};
}

const results = [], checks = [];
const check = (dev, name, ok, detail) => { checks.push({dev, name, ok: !!ok, detail}); console.log(`${ok ? 'PASS' : 'FAIL'}  ${dev}  ${name}${detail !== undefined ? '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`); };

async function run(dev) {
  const phone = dev === 'phone', W = +(process.env.W || (phone ? 390 : 1440)), H = +(process.env.H || (phone ? 844 : 900)), dpr = +(process.env.DPR || (phone ? 3 : 2));
  /* ?tune=adapt:0 holds the adaptive resolution off (the page's own measuring switch): a software renderer is always "slow", and the
     test is of what each rung asks for when the frames keep up */
  const m = await openMachine({root: ROOT, W, H, dpr, mobile: phone, query: process.env.QUERY ?? '?tune=adapt:0'});
  /* the page checks its frame rate once, six seconds after its first frame, and a software renderer always fails it: on Laptop that also
     caps the ratio at 2 for good (lowDpr). The moment the car is ready this puts the rung on Balanced, so the check only drops it back to
     Laptop and every rung can then be measured as asked. (A script added to the page, so it runs before the check can; the page is
     loaded again for it.) */
  await m.page.addInitScript(() => { const iv = setInterval(() => { const c = window.__cw; if (c && c.ready) { clearInterval(iv); window.__pickedQuality = c.quality; if (c.quality === 'laptop') document.getElementById('quality').click(); } }, 15); });
  const t0 = Date.now(); await m.page.reload({waitUntil: 'domcontentloaded', timeout: 240000});
  const out = {dev, root: ROOT, W, H, dpr, presets: {}};
  try {
    await m.page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 600000, polling: 500});
    out.readyMs = Date.now() - t0;
    out.picked = await m.page.evaluate(() => window.__pickedQuality || window.__cw.quality);   /* the rung the page picked on load, before the script above moved it */
    const wired = await m.page.evaluate(() => !!window.__fx);
    await setQuality(m.page, 'balanced');   /* before the page's own 6 s check can see Laptop (see passQualityCheck) */
    await hijack(m.page);
    const gl = await m.page.evaluate(() => { const g = window.__cw.renderer.getContext(); return {antialias: g.getContextAttributes().antialias, samples: g.getParameter(g.SAMPLES), webgl2: window.__cw.renderer.capabilities.isWebGL2, maxAniso: window.__cw.renderer.capabilities.getMaxAnisotropy()}; });
    out.gl = gl;
    check(dev, 'antialias: multisampled canvas', gl.antialias && gl.samples >= 4, gl);
    check(dev, 'fx-quality loaded (window.__fx)', wired);
    check(dev, phone ? 'phone starts on Laptop' : 'rung picked on load', phone ? out.picked === 'laptop' : true, out.picked);
    if (phone && wired) {
      const ph = await m.page.evaluate(() => { let rim = false; window.__cw.scene.traverse(o => { if (o.name === 'rim light') rim = true; }); return {rim, detail: window.__fx.info, aniso: window.__fx.info.defaultAnisotropy}; });
      check(dev, 'phone: no rim light, per-pixel detail off, anisotropy 8', !ph.rim && ph.aniso === 8, {rim: ph.rim, aniso: ph.aniso});
    }
    await passQualityCheck(m.page);
    const presets = (process.env.PRESETS || 'laptop,balanced,high,ultra').split(',');
    if (phone && wired) { const qs = await m.page.evaluate(() => window.__fx.info.qualities); check(dev, 'phone: the Quality button offers Laptop and Balanced only', JSON.stringify(qs) === '["laptop","balanced"]', qs); }
    for (const q of presets) {
      const has = await setQuality(m.page, q);
      if (phone && (q === 'high' || q === 'ultra')) { check(dev, `phone: ${q} not offered by the Quality button`, !has, has ? 'offered' : 'not on the ladder'); continue; }
      if (!has) { check(dev, `rung ${q} offered by the Quality button`, false, 'not on the ladder'); continue; }
      const steps = await settle(m.page), s = await state(m.page), times = [];
      let info = null; for (let i = 0; i < 3; i++) { info = await timedFrame(m.page); times.push(info.ms); }
      times.sort((a, b) => a - b);
      const css = s.css, dev0 = dpr, exp = q === 'ultra' ? Math.min(4, Math.max(dev0, Math.sqrt(3840 * 2160 / (css[0] * css[1])))) : Math.min(dev0, 3);
      const p = {quality: s.quality, label: s.label, ratio: +s.ratio.toFixed(3), expected: +exp.toFixed(3), buffer: s.buffer, css, megapixels: +(s.buffer[0] * s.buffer[1] / 1e6).toFixed(2), composerSamples: s.composerSamples, shadow: s.shadow, dprScale: s.dprScale, prints: s.fx && s.fx.prints, frameMs: Math.round(times[1]), drawCalls: info && info.calls, triangles: info && info.triangles, settleFrames: steps};
      out.presets[q] = p;
      check(dev, `${q}: still pixel ratio = ${p.expected} (buffer ${p.buffer.join('x')})`, Math.abs(p.ratio - p.expected) < .02, {ratio: p.ratio, megapixels: p.megapixels});
      if (q === 'ultra') { const need = Math.min(3840 * 2160, css[0] * css[1] * 16); check(dev, `ultra: 3840 x 2160 worth of pixels (or 4x a small screen: ${(need / 1e6).toFixed(2)} MP)`, p.buffer[0] * p.buffer[1] >= need * .98, p.megapixels + ' MP'); }
      if (q !== 'laptop') check(dev, `${q}: post stack multisampled`, p.composerSamples === null || p.composerSamples >= 4, p.composerSamples);
      if (s.fx) { const want = {laptop: 1, balanced: 1.5, high: 2, ultra: 2}[q], pr = s.fx.prints; check(dev, `${q}: prints redrawn at ${want}x, as far as the budget allows (${pr.allowed}x; ${pr.done}/${pr.count}, ${pr.megapixels} MP)`, pr.scale === want && pr.done === pr.count && !pr.failed);
        /* v8.09 follow-up: the budget is set by the rung on a laptop — 40 MP Balanced, 56 MP High, 72 MP Ultra (the full 2×) — and is 20 MP on a phone */
        const wantBudget = phone ? 20 : {laptop: 40, balanced: 40, high: 56, ultra: 72}[q];
        check(dev, `${q}: prints inside the ${wantBudget} MP budget for this setting (or every one at its own size)`, pr.budget === wantBudget && (pr.megapixels <= pr.budget * 1.01 || pr.allowed === 1), `${pr.megapixels} MP at ${pr.allowed}x, budget ${pr.budget} MP`);
        if (q === 'ultra') check(dev, 'ultra: every print at the full 2× its rung asks for', pr.allowed === 2 && pr.done === pr.count, `${pr.allowed}x, ${pr.megapixels} MP`); }
      if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, {recursive: true}); await canvasPng(m.page, path.join(process.env.SHOTS, `${process.env.TAG || 'run'}_${dev}_${q}.png`)); }
      console.log(`      ${dev} ${q}: frame ${p.frameMs} ms (median of 3, software renderer), ${p.megapixels} MP`);
    }
    const tex = await textures(m.page, phone ? 8 : 16);
    out.textures = tex;
    check(dev, `every texture mipmapped (${tex.total} textures)`, tex.noMip === 0, tex.noMipList);
    check(dev, `every texture filtered at ${tex.need}x anisotropy`, tex.low === 0, tex.lowList);
    check(dev, 'livery atlas mipmapped and anisotropic', tex.atlas && tex.atlas.mip && tex.atlas.aniso >= tex.need, tex.atlas);
    /* (Codex review fixes f45961b) Quality round and round: Balanced builds the post stack, Laptop drops it. Dropping it left the passes'
       own targets, noise textures and materials alive (+6 textures on the renderer each Balanced/Laptop pair). After one round to warm
       up, two more rounds must leave the renderer's texture count where it was. Fails on ba9fff7. */
    if (process.env.CYCLES !== '0') {
      const texCount = () => m.page.evaluate(() => window.__cw.renderer.info.memory.textures), counts = [];
      for (let k = 0; k < 3; k++) { await setQuality(m.page, 'balanced'); await settle(m.page, {max: 4}); await setQuality(m.page, 'laptop'); await settle(m.page, {max: 4}); counts.push(await texCount()); }
      out.textureCycles = counts;
      check(dev, 'Quality Balanced/Laptop round and round: the renderer\'s texture count stays put', counts[2] <= counts[0], `after rounds 1-3: ${counts.join(' → ')}`);
    }
    if (process.env.CAPTURE !== '0') {
      const c = await capture(m.page); out.capture = c;
      check(dev, `4K capture is a ${c.width} x ${c.height} PNG`, c.png && c.width === 3840 && c.height === 2160, {bytes: c.bytes});
      check(dev, '4K capture puts the canvas back at its own size', c.restored, {before: c.before, after: c.after});
      const lc = await m.page.evaluate(() => window.__fx && window.__fx.info.lastCapture);
      if (phone) check(dev, 'phone: the 4K still is drawn without the post stack', lc && lc.post === false, lc);
    }
    await frame(m.page);
  } catch (e) { check(dev, 'run completed', false, String(e).slice(0, 300)); }
  out.errors = m.errors.slice();
  check(dev, 'no page or console errors', m.errors.length === 0, m.errors.slice(0, 5));
  results.push(out); await m.close();
}
/* (Codex review fixes f45961b) time in a hidden tab is not slow drawing. The page's one-off "drop to Laptop under 24 fps" check counted
   the hidden seconds as frames not drawn: back on the tab, Balanced fell to Laptop and stayed there. A small fresh page on Balanced whose
   frames are held from the moment it is ready (so the check has not run) and whose clock is the test's: frames 33 ms apart (30 fps, a
   healthy rate, so only the hidden time could trip the check), then 8 s hidden, then three more frames — still Balanced. The software
   renderer's real speed plays no part. document.hidden and the clock are played by the test; the page's own handlers are what run.
   Fails on ba9fff7. */
async function hiddenRun() {
  const dev = 'hidden-tab', m = await openMachine({root: ROOT, W: 480, H: 360, dpr: 1, mobile: false, query: process.env.QUERY ?? '?tune=adapt:0'});
  await m.page.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window), realNow = performance.now.bind(performance); window.__rafQ = []; window.__vt = null;
    performance.now = () => window.__vt === null ? realNow() : window.__vt;
    window.requestAnimationFrame = cb => raf(t => { if (window.__cw && window.__cw.ready) window.__rafQ.push(cb); else cb(t); });
    window.__step = () => { const q = window.__rafQ.splice(0), t = performance.now(); for (const cb of q) { try { cb(t); } catch (e) { console.error(e); } } return q.length; };
    let hidden = false; Object.defineProperty(document, 'hidden', {configurable: true, get: () => hidden}); Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => hidden ? 'hidden' : 'visible'});
    window.__setHidden = h => { hidden = h; document.dispatchEvent(new Event('visibilitychange')); }; });
  await m.page.reload({waitUntil: 'domcontentloaded', timeout: 240000});
  const tick = async (ms = 33) => { await m.page.evaluate(ms => { window.__vt += ms; }, ms); await frame(m.page); };
  try {
    await m.page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 600000, polling: 500});
    await setQuality(m.page, 'balanced');
    await m.page.waitForFunction(() => window.__rafQ.length > 0, null, {timeout: 600000, polling: 200});
    await m.page.evaluate(() => { window.__vt = performance.now(); });
    for (let i = 0; i < 3; i++) await tick();
    const before = await m.page.evaluate(() => window.__cw.quality);
    await m.page.evaluate(() => { window.__setHidden(true); window.__vt += 8000; window.__setHidden(false); });
    for (let i = 0; i < 3; i++) await tick();
    const after = await m.page.evaluate(() => ({quality: window.__cw.quality, toast: document.getElementById('toast').textContent}));
    check(dev, 'back from 8 s in a hidden tab: Balanced stays Balanced (hidden time is not counted as slow frames)', before === 'balanced' && after.quality === 'balanced', {before, after: after.quality, toast: after.toast});
  } catch (e) { check(dev, 'run completed', false, String(e).slice(0, 300)); }
  check(dev, 'no page or console errors', m.errors.length === 0, m.errors.slice(0, 5));
  await m.close();
}
(async () => {
  const d = process.env.DEVICE || 'both';
  for (const dev of d === 'both' ? ['desktop', 'phone'] : d === 'none' ? [] : [d]) await run(dev);   /* DEVICE=none: the hidden-tab page only */
  if (process.env.HIDDEN !== '0') await hiddenRun();
  const failed = checks.filter(c => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed (${ROOT})`);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({root: ROOT, at: new Date().toISOString(), checks, results}, null, 1));
  process.exitCode = failed.length ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
