/* Parity capture for the idle/sync prototype. Read only (the harness aborts writes).
   Visits every tab with the clock frozen and records each pane's text; drives the clock through fixed instants in both
   modes; counts Save bars (view and simulated edit); re-delivers the same record and checks S and the redraw.
   env: PAGE, MOB=1, OUT=file */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const MOB = process.env.MOB === '1';
 const s = await open({pageFile: process.env.PAGE, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
 const p = s.page, out = {tabs: {}, clock: [], bars: {}, fold: {}};
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
  await sleep(MOB ? 20000 : 9000);
  out.version = await p.evaluate(() => SYNC.db.readVersion821());
  // 1. the clock, driven through fixed instants (in-place updates included) in both modes
  out.clock = await p.evaluate(() => {
   const snap = () => ['#tpod', '#hzcd', '#hzshift', '#tpodSec', '#hzcluster'].map(sel => { const el = document.querySelector(sel); return el ? el.outerHTML : null; });
   const res = []; TPOD.frozen = true; if (TPOD.timer) { clearTimeout(TPOD.timer); TPOD.timer = null; }
   const base = Date.parse('2026-10-18T05:59:57+10:00');
   for (const mode of ['clock', 'countdown', 'clock']) { TPOD.mode = mode;
    for (const dt of [0, 1000, 2000, 3000, 4000, 61000, 3600000, 86400000 * 2, 86400000 * 7]) { tpodPaint(base + dt); res.push([mode, dt, snap()]); } }
   return res; });
  // 2. every tab, clock frozen, pane text
  const tabs = await p.evaluate(() => TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)));
  for (const k of tabs) {
   await p.evaluate(k => go(k), k); await sleep(k === 'plant' || k === 'today' ? (MOB ? 9000 : 5000) : (MOB ? 3000 : 1500));
   out.tabs[k] = await p.evaluate(k => { const pane = document.getElementById('pane-' + k); if (!pane) return null; const c = pane.cloneNode(true); c.querySelectorAll('style,script').forEach(x => x.remove());
    return {text: pane.innerText, full: c.textContent.replace(/\s+/g, ' '), n: pane.getElementsByTagName('*').length, bars: pane.querySelectorAll('.selection1012-controls').length, barsShown: [...pane.querySelectorAll('.selection1012-controls')].filter(b => !b.hidden).length}; }, k);
  }
  out.footer = await p.evaluate(() => (document.getElementById('footR') || {}).textContent.replace(/\d\d:\d\d/g, 'HH:MM'));
  // 3. Save bars under a simulated edit link (nothing is sent: writes are aborted and the service is never asked)
  out.bars = await p.evaluate(async () => {
   window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit';
   if (!window.__fetch0) { window.__fetch0 = window.fetch; const of = window.__fetch0; window.fetch = async (u, o) => { const r = await of(u, o); const url = String(u); if (/\/api\/(version|state)(\?|$)/.test(url) && r.ok) { const j = await r.clone().json(); j.level = 'edit'; return new Response(JSON.stringify(j), {status: 200, headers: {'content-type': 'application/json'}}); } return r; }; }
   document.body.classList.remove('viewonly'); S.operator = 'Andrew Fisher';
   await new Promise(r => setTimeout(r, 5000)); applyCapability && applyCapability();
   const st = []; const count = () => { const b = [...document.querySelectorAll('.selection1012-controls')]; return {n: b.length, shown: b.filter(x => !x.hidden).length, states: b.map(x => x.dataset.selection1012State + ':' + (x.querySelector('[data-selection1012-status]') || {}).textContent).sort().join('|').slice(0, 4000)}; };
   for (const k of ['costs', 'pricing', 'plant', 'today']) { if (!TABS.some(t => t[0] === k)) continue; go(k); await new Promise(r => setTimeout(r, 1500)); render(); await new Promise(r => setTimeout(r, 1500)); st.push([k, count()]); }
   st.push(['flags', {ro: SYNC.readonly, lvl: SYNC.level, cap: capability()}]);
   go('pricing'); await new Promise(r => setTimeout(r, 1500));
   const fld = [...document.querySelectorAll('#pane-pricing input[data-rk],#pane-pricing input[data-ak],#pane-pricing input[data-min]')].find(x => !x.disabled);
   if (fld) { fld.focus(); fld.value = String(fld.value) + '9'; fld.dispatchEvent(new Event('input', {bubbles: true})); await new Promise(r => setTimeout(r, 300)); st.push(['typed', count()]);
    syncFooter(); await new Promise(r => setTimeout(r, 300)); st.push(['typedFooter', count()]);
    fld.blur(); render(); await new Promise(r => setTimeout(r, 1500)); st.push(['typedRender', count(), (document.activeElement || {}).outerHTML ? 1 : 0]);
    const again = [...document.querySelectorAll('#pane-pricing input[data-rk],#pane-pricing input[data-ak],#pane-pricing input[data-min]')].find(x => !x.disabled); st.push(['restoredValue', again && again.value]); }
   openAsset && openAsset((S.added && S.added[0] && S.added[0].key) || 'P01'); await new Promise(r => setTimeout(r, 2000)); st.push(['drawer', count()]);
   syncFooter(); await new Promise(r => setTimeout(r, 300)); st.push(['afterFooter', count()]);
   return st; });
  // 4. the same record delivered again: S unchanged, and does the page redraw?
  out.fold = await p.evaluate(async () => {
   const before = JSON.stringify(S); let redraws = 0; const r0 = window.syncRedraw; window.syncRedraw = function () { redraws++; return r0.apply(this, arguments); };
   let ms = -1; for (let k = 0; k < 40; k++) { const t0 = performance.now(); await SYNC.backend.pull(true); const d = performance.now() - t0; if (d >= 20) { ms = d; break; } await new Promise(r => setTimeout(r, 250)); }
   window.syncRedraw = r0; const after = JSON.stringify(S);
   return {same: before === after, len: after.length, redraws, ms: Math.round(ms), hash: after.length + ':' + [...after].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)}; });
  // 5. the completion glow: rings in folded sections hold still; open the folds and every ring glows
  out.glow = await p.evaluate(async () => { go('plant'); await new Promise(r => setTimeout(r, 4000));
   const st = () => { const r = [...document.querySelectorAll('#pane-plant .complete1008-ring')].map(x => { const a = x.getAnimations().find(a => a.animationName === 'complete1008-glow'); return (x.closest('details:not([open])') ? 'folded' : 'shown') + ':' + (a ? a.playState : 'none'); }); return r.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}); };
   const before = st(); document.querySelectorAll('#pane-plant details.eqrefs:not([open])').forEach(d => d.open = true); await new Promise(r => setTimeout(r, 1500)); const opened = st();
   const op = [...document.querySelectorAll('#pane-plant .complete1008-ring')].map(x => getComputedStyle(x).opacity).slice(0, 3);
   return {before, opened, sample: op}; });
  out.version2 = await p.evaluate(() => SYNC.db.readVersion821());
  out.errors = s.errors; out.blocked = s.counts.blocked;
 } catch (e) { out.err = String(e && e.stack || e).slice(0, 800); }
 fs.writeFileSync(process.env.OUT, JSON.stringify(out));
 console.log(JSON.stringify({out: process.env.OUT, version: out.version, v2: out.version2, tabs: Object.keys(out.tabs).length, fold: out.fold, err: out.err, errors: out.errors}));
 await s.browser.close();
})();
