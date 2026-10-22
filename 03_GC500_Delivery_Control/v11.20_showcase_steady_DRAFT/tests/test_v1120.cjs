
/* Author: Andrew Fisher. v11.20 checks: the Showcase dialog paints before the 3D circuit is built; the static detail is skipped
   on a device whose base mount is over budget; the warm loop is paced; a phone that never chose opens on the flat circuit
   and a chosen 3D is kept; record unchanged, 0 errors, 0 writes. GET only.
     PAGE=build/GC500_v11.20/GC500_Delivery_Control_hosted.html node tests/test_v1120.cjs        (desktop, CPU x4)
     MOB=1 PAGE=... node tests/test_v1120.cjs                                                     (phone)
     LIVE=1 node tests/test_v1120.cjs */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 500))); };
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 900});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(2500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.20'));
  const d0 = await p.evaluate(() => { try { localStorage.removeItem('gc500.showback'); } catch (e) {} return {module: typeof ShowcaseSteady1120 === 'object', phone: typeof showPhone1120 === 'function' && showPhone1120(), def: showBackPref(), warmText: (document.documentElement.outerHTML.match(/setTimeout\(warm,(\d+)\)/g) || []).join(' ')}; });
  check('module present; warm loop text paces 400 ms and 1500 ms', d0.module && /warm,400/.test(d0.warmText) && /warm,1500/.test(d0.warmText) && !/warm,40\)/.test(d0.warmText) && !/warm,250\)/.test(d0.warmText), d0);
  if (MOB) check('phone never chose: default is the flat circuit', d0.phone === true && d0.def === 'circuit', d0);
  else check('desktop never chose: default stays the 3D circuit at night', d0.phone === false && d0.def === 'circuit3d', d0);
  const cdp = await p.context().newCDPSession(p);
  if (!MOB) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  // a chosen 3D day backdrop, opened: the dialog must be on screen before any mount
  const o = await p.evaluate(() => { try { localStorage.setItem('gc500.showback', 'circuit3d_day'); } catch (e) {}
   const G = window.GC3D, n = {veg: 0, arch: 0, track: 0};
   for (const [k, f] of [['installVegetation781', 'veg'], ['installArchitecture781', 'arch'], ['installTrackDetail781', 'track']]) { const orig = G[k]; if (typeof orig === 'function') G[k] = function () { n[f]++; return orig.apply(this, arguments); }; }
   window.__n = n;
   const t0 = performance.now(); showOpen(); const openMs = performance.now() - t0;
   const sc = document.getElementById('showcase');
   return {pref: showBackPref(), openMs: Math.round(openMs), hiddenAfter: sc.hidden, bodyChars: (document.getElementById('showBody') || {}).innerText ? document.getElementById('showBody').innerText.length : 0, mountedAtOpen: !!(G && G.S), steady: ShowcaseSteady1120.state(), back: sc.getAttribute('data-back')}; });
  check('chosen 3D day is kept as the preference (' + o.pref + ')', o.pref === 'circuit3d_day', o);
  check('showOpen() returns before the 3D is built: under 2 s, dialog shown with a scene, no scene mounted yet, mount deferred', o.openMs < 2000 && !o.hiddenAfter && o.bodyChars > 20 && !o.mountedAtOpen && o.steady.deferred >= 1, o);
  // the mount lands a beat later; wait for it (software WebGL in the harness is slow)
  const mounted = await p.waitForFunction(() => !!(window.GC3D && GC3D.S) || !!(window.GC3D && GC3D.failed), null, {timeout: 120000}).then(() => true).catch(() => false);
  const m = await p.evaluate(() => ({mounted: !!(window.GC3D && GC3D.S), failed: window.GC3D && GC3D.failed, steady: ShowcaseSteady1120.state(), report: (window.GC3D && typeof GC3D.fullLapReport788 === 'function') ? GC3D.fullLapReport788() : null}));
  check('the 3D scene mounts after the dialog (or says why not)', mounted && (m.mounted || m.failed), m);
  if (m.mounted) {
   check('the base mount was timed', typeof m.steady.mountMs === 'number' && m.steady.mountMs > 0, m.steady);
   const over = m.steady.mountMs > m.steady.budgetMs;
   check(over ? 'over budget here: static detail skipped and the report says so' : 'within budget here: static detail kept', over ? (m.steady.detail === 'skipped' && m.report && m.report.limitedByDevice === true && /detail skipped/.test(m.report.detailError || '')) : (m.steady.detail === 'kept' && m.report && !m.report.detailError), {steady: m.steady, report: m.report});
   check('the stands follow the same budget (' + m.steady.stands + ')', m.steady.stands === 'skipped' || m.steady.stands === 'kept', m.steady);
   if (over) { await p.waitForTimeout(12000); const n = await p.evaluate(() => window.__n); check('no static detail installer ran on the over-budget device', n.veg === 0 && n.arch === 0 && n.track === 0, n); }
  }
  console.log('open:', JSON.stringify(o)); console.log('mount:', JSON.stringify({steady: m.steady, report: m.report && {limited: m.report.limitedByDevice, err: m.report.detailError}}));
  // warm pacing, sampled inside the page: the memo grows no faster than one scene per 400 ms (the v11.10 pace was 40 ms)
  const pace = await p.evaluate(() => new Promise(res => { const t = [], seen = new Set(); let last = ShowcaseSmooth1110.size(); const id = setInterval(() => { const n = ShowcaseSmooth1110.size(); if (n !== last) { t.push(performance.now()); last = n; } }, 25); setTimeout(() => { clearInterval(id); const gaps = t.slice(1).map((x, i) => Math.round(x - t[i])); res({fills: t.length, gaps, size: last, total: SHOW_ORDER.length}); }, 9000); }));
  check('warm loop paced: every fill at least 350 ms after the one before, or the deck is already warm', pace.fills <= 1 || Math.min(...pace.gaps) >= 350, pace);
  const st = await p.evaluate(() => ({scene: SHOW.i, open: SHOW.open, chapter: (document.getElementById('showChapter') || {}).textContent || '', body: ((document.getElementById('showBody') || {}).textContent || '').trim().length}));
  check('the deck is on screen: a chapter title and a scene with words', st.open && st.chapter.length > 2 && st.body > 20, st);
  await p.evaluate(() => showClose());
  await p.waitForTimeout(800);
  const c = await p.evaluate(() => ({open: SHOW.open, hidden: document.getElementById('showcase').hidden, pending: ShowcaseSteady1120.state().pending}));
  check('close clears the deferred mount and hides the dialog', !c.open && c.hidden && !c.pending, c);
  if (!MOB) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
  const after = await p.evaluate(() => { try { localStorage.removeItem('gc500.showback'); } catch (e) {} return JSON.stringify(S); });
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1120.json'), JSON.stringify({at: new Date().toISOString(), live, mobile: MOB, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
