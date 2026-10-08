// Author: Andrew Fisher. v8.96: what the Today scene costs, measured the same way on the base chain and on this build: first
// paint and first contentful paint, DOMContentLoaded and load; the time Today takes to open (go('today') to the second frame,
// seven times after a warm-up: median and best); the frame time while the plate is in view (p95 of 90 frames, and again with the
// heaviest sky forced on this build); the pictures fetched for Today (count and bytes); and what five redraws make (observers,
// timers, animations) so a leak would show as a difference between the two pages.
//   PAGE=<page> LABEL=base|v8.96 [MOB=1] [ATLAS896=folder] [OUT=dir] node v8.96_today_scene_DRAFT/tests/timing896.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
const A = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'atlas896.json'), 'utf8'));
(async () => { let s; try {
 const mob = !!process.env.MOB, W = mob ? 390 : 1440, H = mob ? 844 : 900;
 const t0 = Date.now();
 s = await open({pageFile: process.env.PAGE, W, H, mobile: mob, dpr: mob ? 2 : 1}); const p = s.page;
 const loadMs = Date.now() - t0;
 const dir = process.env.ATLAS896 || path.join(__dirname, '..', 'assets');
 for (const c of A.cells) { const f = path.join(dir, c.file); if (fs.existsSync(f)) await p.route(new RegExp('/m/Coates-GC500-2026/' + c.file + '(\\?.*)?$'), r => r.fulfill({status: 200, contentType: c.type, body: fs.readFileSync(f)})); }
 await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof todayWorkHealth840 === 'function' && todayWorkHealth840().ready, null, {timeout: 150000});
 await p.evaluate(shas => {
  if (typeof Scene896 !== 'object') return;
  shas.forEach(sha => { if (typeof DATA.media[sha] === 'string') DATA.media[sha] = DATA.media[sha].split('?')[0] + '?timing896=' + Date.now(); });
  document.getElementById('scene896-atlas')?.remove(); Scene896.mount();
 }, A.cells.map(c => c.sha256));
 await p.waitForTimeout(2500);
 const T = await p.evaluate(async () => {
  const paint = {}; performance.getEntriesByType('paint').forEach(e => { paint[e.name] = Math.round(e.startTime); });
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const frames2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))));
  const settle = ms => new Promise(r => setTimeout(r, ms));
  // Today open time: from another tab, go('today') to the second frame
  go('timeline'); await settle(600); const opens = [];
  for (let k = 0; k < 8; k++) { const a = performance.now(); go('today'); const b = await frames2(); if (k) opens.push(Math.round(b - a)); await settle(250); go('timeline'); await settle(300); }
  go('today'); await settle(500);
  const sorted = opens.slice().sort((x, y) => x - y);
  // frame time with the plate in view
  const main = document.querySelector('main'), plate = document.querySelector('#where885 .w885-gauge') || document.getElementById('where885');
  if (plate) main.scrollTop += plate.getBoundingClientRect().top - main.getBoundingClientRect().top - 10;
  await settle(2600);
  const frames = async n => { const d = []; let last = await new Promise(r => requestAnimationFrame(r)); for (let i = 0; i < n; i++) { const now = await new Promise(r => requestAnimationFrame(r)); d.push(now - last); last = now; } d.sort((x, y) => x - y); return {p50: Math.round(d[Math.floor(n * .5)] * 10) / 10, p95: Math.round(d[Math.floor(n * .95)] * 10) / 10, max: Math.round(d[n - 1] * 10) / 10}; };
  const idle = await frames(90);
  let heavy = null, scene = null;
  if (typeof Scene896 === 'object') { scene = Scene896.report(); const sky = document.querySelector('#where885 .s896-sky'); if (sky) { const was = sky.dataset.kind; sky.dataset.kind = 'storm'; await settle(200); heavy = await frames(90); sky.dataset.kind = was; } }
  // the pictures Today fetched
  const media = performance.getEntriesByType('resource').filter(r => /\/m\/[^/]+\//.test(r.name)).map(r => ({name: new URL(r.name).pathname.split('/').pop(), local: /[?&]timing896=/.test(r.name), bytes: r.decodedBodySize || r.encodedBodySize || r.transferSize || 0, ms: Math.round(r.duration)}));
  const sceneShas = Object.values(JSON.parse(document.getElementById('scene896-script')?.textContent.match(/const ATLAS = (\{[^}]*\})/)?.[1] || '{}'));
  const scenePics = media.filter(m => m.local && sceneShas.includes(m.name.replace(/\.webp$/, '')));
  // five redraws: what they make
  const made = {io: 0, mo: 0, ro: 0, timeouts: 0, intervals: 0};
  const IO = window.IntersectionObserver, MO = window.MutationObserver, RO = window.ResizeObserver, ST = window.setTimeout, SI = window.setInterval;
  window.IntersectionObserver = function (...a) { made.io++; return new IO(...a); }; window.MutationObserver = function (...a) { made.mo++; return new MO(...a); }; if (RO) window.ResizeObserver = function (...a) { made.ro++; return new RO(...a); };
  window.setTimeout = function (...a) { made.timeouts++; return ST.apply(window, a); }; window.setInterval = function (...a) { made.intervals++; return SI.apply(window, a); };
  const anims0 = document.getAnimations().length;
  const redraw = []; for (let k = 0; k < 5; k++) { const a = performance.now(); renderToday(); redraw.push(Math.round(performance.now() - a)); }
  window.IntersectionObserver = IO; window.MutationObserver = MO; if (RO) window.ResizeObserver = RO; window.setTimeout = ST; window.setInterval = SI;
  await settle(300);
  return {paint, dcl: Math.round(nav.domContentLoadedEventEnd || 0), load: Math.round(nav.loadEventEnd || 0), todayOpen: {runs: opens, median: sorted[Math.floor(sorted.length / 2)], best: sorted[0]}, frames: {idle, heavy}, scene,
   media: {count: media.length, bytes: media.reduce((n, m) => n + m.bytes, 0), scenePictures: scenePics.length, sceneBytes: scenePics.reduce((n, m) => n + m.bytes, 0)},
   redraws: {ms: redraw, made, animationsBefore: anims0, animationsAfter: document.getAnimations().length}, scriptBytes: (document.getElementById('scene896-script') || {}).textContent?.length || 0, styleBytes: (document.getElementById('scene896-style') || {}).textContent?.length || 0};
 });
 const label = process.env.LABEL || (T.scene ? 'v8.96' : 'base');
 const out = Object.assign({label, page: path.basename(path.dirname(process.env.PAGE)), pageBytes: fs.statSync(process.env.PAGE).size, viewport: mob ? 'phone' : W + 'x' + H, openToLoadMs: loadMs}, T, {errors: s.errors.length, blocked: s.counts.blocked});
 console.log('TIMING ' + label + ' ' + JSON.stringify(out));
 if (process.env.OUT) { fs.mkdirSync(process.env.OUT, {recursive: true}); const f = path.join(process.env.OUT, 'timing896_' + label + '_' + (mob ? 'phone' : 'laptop') + '_' + Date.now() + '.json'); fs.writeFileSync(f, JSON.stringify(out, null, 1)); }
 if (s.errors.length || s.counts.blocked) process.exitCode = 1;
} finally { if (s) await s.browser.close(); } })().catch(e => { console.error(e); process.exitCode = 2; });
