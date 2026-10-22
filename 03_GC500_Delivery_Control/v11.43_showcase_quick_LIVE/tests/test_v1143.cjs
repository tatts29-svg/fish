/* Author: Andrew Fisher. v11.43 checks (desktop at 4x CPU, phone unthrottled): a never-chosen device opens the Showcase on the
   3D circuit and its build time is kept; when that time was over budget the next opening starts on the flat circuit with the
   "3D circuit" button, which brings the 3D back for that opening; a device within budget keeps the 3D default and no button;
   a chosen 3D day on a slow device opens flat and the button returns the chosen day; the choice is never changed by the
   fallback; record unchanged, no errors, no writes. GET only.
     PAGE=build/GC500_v11.43/GC500_Delivery_Control_hosted.html node tests/test_v1143.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 const cdp = MOB ? null : await p.context().newCDPSession(p);
 const openShow = () => p.evaluate(() => { showOpen(); const el = document.getElementById('showcase'); const b = document.getElementById('show3d1143'); return {back: el.getAttribute('data-back'), sel: (document.getElementById('showBackdrop') || {}).value, btn: b ? {hidden: b.hidden, text: b.textContent, title: b.title} : null, q: ShowcaseQuick1143.state(), pref: localStorage.getItem('gc500.showback')}; });
 const closeShow = () => p.evaluate(() => { showClose(); return {want: ShowcaseQuick1143.state().want3d, hidden: document.getElementById('showcase').hidden}; });
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.ShowcaseQuick1143 && window.ShowcaseSteady1120, null, {timeout: 180000});
  await p.waitForTimeout(800);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.43'));
  await p.evaluate(() => { localStorage.removeItem('gc500.showback'); localStorage.removeItem('gc500.show3d.mount'); });
  if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  const o1 = await openShow();
  check('never chosen, nothing remembered: the Showcase opens on the 3D circuit at night, no button', /^circuit3d/.test(o1.back) && o1.sel === 'circuit3d' && (!o1.btn || o1.btn.hidden) && o1.q.applied === null, o1);
  const m1 = await p.evaluate(() => new Promise(res => { const t0 = Date.now(); (function w(){ const st = ShowcaseSteady1120.state(); const l = ShowcaseQuick1143.last(); if ((st.mountMs != null && l) || (window.GC3D && GC3D.failed) || Date.now() - t0 > 60000) res({mountMs: st.mountMs, kept: l, failed: !!(window.GC3D && GC3D.failed), pending: st.pending}); else setTimeout(w, 300); })(); }));
  const built = !!(m1.kept && m1.mountMs != null);
  check('the base circuit’s build time on this device is kept in local storage once it has built (or the device says it cannot)', built ? (m1.kept.ms >= m1.mountMs * 0.9 && m1.kept.ms > 0) : m1.failed, m1);
  if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
  const c1 = await closeShow();
  check('closing the Showcase hides it', c1.hidden === true && c1.want === false, c1);
  const slowHere = built && m1.kept.ms > 1500;
  const o2 = await openShow();
  check(slowHere ? 'this device was slow (over 1.5 s): the next opening starts on the flat circuit with the "3D circuit · N s here" button, the choice untouched' : 'this device was within budget (or could not build): the next opening keeps the 3D circuit, no button',
   slowHere ? (o2.back === 'circuit' && o2.sel === 'circuit' && o2.btn && !o2.btn.hidden && /^3D circuit · \d+(\.\d)? s here$/.test(o2.btn.text) && o2.q.applied === 'circuit3d' && o2.pref === null) : (/^circuit3d/.test(o2.back) && (!o2.btn || o2.btn.hidden)), {o2, slowHere, kept: m1.kept});
  if (slowHere) {
   const o3 = await p.evaluate(() => new Promise(res => { document.getElementById('show3d1143').click(); setTimeout(() => res({back: document.getElementById('showcase').getAttribute('data-back'), sel: document.getElementById('showBackdrop').value, want: ShowcaseQuick1143.state().want3d, btn: document.getElementById('show3d1143').hidden, deferred: ShowcaseSteady1120.state().deferred, pending: ShowcaseSteady1120.state().pending}), 700); }));
   check('pressing "3D circuit" brings the 3D circuit back for this opening (the build deferred past the paint as v11.20 does), the button hides', /^circuit3d/.test(o3.back) && o3.sel === 'circuit3d' && o3.want && o3.btn && (o3.deferred >= 1 || o3.pending), o3);
   await p.waitForFunction(() => !!(window.GC3D && (GC3D.S || GC3D.failed)), null, {timeout: 90000}).catch(() => null); /* the 3D builds on the main thread; a screenshot waits for it */
   await p.waitForTimeout(600);
   try { await p.screenshot({path: path.join(out, 'showcase_3d_pressed_' + tag + '.png'), fullPage: false, timeout: 60000}); } catch (e) { console.log('screenshot skipped: ' + String(e.message).slice(0, 80)); }
  }
  await closeShow();
  await p.evaluate(() => { localStorage.setItem('gc500.show3d.mount', JSON.stringify({ms: 500, at: new Date().toISOString()})); });
  const o4 = await openShow();
  check('a remembered build within budget (0.5 s): the 3D circuit at night opens as before, no button', /^circuit3d/.test(o4.back) && (!o4.btn || o4.btn.hidden) && o4.q.applied === null, o4);
  await closeShow();
  await p.evaluate(() => { localStorage.setItem('gc500.showback', 'circuit3d_day'); localStorage.setItem('gc500.show3d.mount', JSON.stringify({ms: 9000, at: new Date().toISOString()})); });
  const o5 = await openShow();
  check('a chosen 3D day on a device that took 9 s: opens on the flat circuit with the button, the choice kept', o5.back === 'circuit' && o5.btn && !o5.btn.hidden && /9\.0 s here/.test(o5.btn.text) && o5.q.applied === 'circuit3d_day' && o5.pref === 'circuit3d_day', o5);
  await p.waitForTimeout(500);
  try { await p.screenshot({path: path.join(out, 'showcase_flat_with_button_' + tag + '.png'), fullPage: false, timeout: 60000}); } catch (e) { console.log('screenshot skipped: ' + String(e.message).slice(0, 80)); }
  const o6 = await p.evaluate(() => new Promise(res => { document.getElementById('show3d1143').click(); setTimeout(() => res({back: document.getElementById('showcase').getAttribute('data-back'), sel: document.getElementById('showBackdrop').value, pref: localStorage.getItem('gc500.showback')}), 700); }));
  check('the button returns the chosen 3D day, the choice still kept', o6.back === 'circuit3d_day' && o6.sel === 'circuit3d_day' && o6.pref === 'circuit3d_day', o6);
  await closeShow();
  await p.evaluate(() => { localStorage.removeItem('gc500.showback'); localStorage.setItem('gc500.show3d.mount', JSON.stringify({ms: 9000, at: new Date().toISOString()})); });
  const o7 = await openShow();
  const o8 = await p.evaluate(() => new Promise(res => { const sel = document.getElementById('showBackdrop'); sel.value = 'circuit3d'; sel.onchange(); setTimeout(() => res({back: document.getElementById('showcase').getAttribute('data-back'), sel: sel.value, pref: localStorage.getItem('gc500.showback'), want: ShowcaseQuick1143.state().want3d}), 700); }));
  check('choosing a 3D look from the backdrop list during a flat opening is honoured at once (not snapped back), and stored as the choice as before', o7.back === 'circuit' && o8.back === 'circuit3d' && o8.sel === 'circuit3d' && o8.pref === 'circuit3d' && o8.want, {o7: {back: o7.back}, o8});
  await closeShow();
  await p.evaluate(() => { localStorage.removeItem('gc500.showback'); localStorage.removeItem('gc500.show3d.mount'); });
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1143.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
