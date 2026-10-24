/* Author: Andrew Fisher. v10.79 check (read-only, every write aborted).
   1. Static, BASE (live v10.78) against PAGE: in the servicing tracker data and crew card the SPARE reference is gone,
      WC05 has one more line (1 x FWF, 0164), PG01/PG03/PG05/PG29 and WC85 carry their pins, and every other reference,
      task and plan is byte for byte the same; the FWF total is unchanged (the spare moved, it did not go).
   2. Browser, PAGE: on the record 0164 is on WC05 and spares are empty; the five placed positions equal the card's pins and
      are what the page navigates to; footer v10.79; no page errors.
   BASE=... PAGE=... [MOB=1] [LIVE=1] node test_v1079.cjs */
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
const grab = (t, k) => { const i = t.indexOf('var ' + k + '='); if (i < 0 || t.indexOf('var ' + k + '=', i + 1) >= 0) throw new Error(k + ' not found once');
  const s = i + k.length + 5, e = t.indexOf('\n', s); return JSON.parse(t.slice(s, e).replace(/;\s*$/, '')); };
const refsOf = d => { const m = {}; (function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (typeof o.ref === 'string' && Array.isArray(o.lines)) m[o.ref] = o; Object.values(o).forEach(walk); } })(d); return m; };
const TOUCHED = ['SPARE', 'WC05', 'PG01', 'PG03', 'PG05', 'PG29', 'WC85'];
const strip = d => JSON.stringify((function walk(o) {   /* the spare dropped, the six other touched references blanked; everything else as it is */
  if (Array.isArray(o)) return o.filter(x => !(x && x.ref === 'SPARE' && Array.isArray(x.lines))).map(walk);
  if (o && typeof o === 'object') { if (Array.isArray(o.lines) && TOUCHED.includes(o.ref)) return '(' + o.ref + ')'; return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walk(v)])); }
  return o; })(d));
const PINS = {PG01: [-27.986807, 153.428013], PG03: [-27.986807, 153.428013], PG05: [-27.986807, 153.428013], PG29: [-27.986807, 153.428013], WC85: [-27.938636, 153.426477]};
(async () => {
  const fails = [], MOB = !!process.env.MOB;
  const B = fs.readFileSync(process.env.BASE, 'utf8'), P = fs.readFileSync(process.env.PAGE, 'utf8');
  const out = {};
  for (const k of ['SVC1067_DATA', 'SVC1067_CARD']) {
    const b = grab(B, k), p = grab(P, k), rb = refsOf(b), rp = refsOf(p);
    if (strip(b) !== strip(p)) fails.push(k + ': something other than the seven touched references changed');
    if (rp.SPARE) fails.push(k + ': SPARE is still there');
    for (const r of TOUCHED.slice(1)) { const x = JSON.parse(JSON.stringify(rp[r])), y = JSON.parse(JSON.stringify(rb[r]));
      if (r === 'WC05') { const add = x.lines.pop(); if (!add || add.id !== 'WC05-FWF' || add.kind !== 'fwf' || add.qty !== 1 || add.label !== '1 × FWF' || (k === 'SVC1067_CARD' && JSON.stringify(add.nos) !== '["0164"]')) fails.push(k + ' WC05 FWF line: ' + JSON.stringify(add)); }
      else if (k === 'SVC1067_CARD') { if (JSON.stringify(x.pin) !== JSON.stringify(PINS[r])) fails.push(k + ' ' + r + ' pin ' + JSON.stringify(x.pin)); x.pin = null; }
      if (JSON.stringify(x) !== JSON.stringify(y)) fails.push(k + ' ' + r + ': more changed than intended'); }
    const sum = r => Object.values(r).reduce((a, x) => a + x.lines.filter(y => y.kind === 'fwf').reduce((s, y) => s + (y.qty || 0), 0), 0);
    out[k] = {refsBefore: Object.keys(rb).length, refsAfter: Object.keys(rp).length, fwfBefore: sum(rb), fwfAfter: sum(rp)};
    if (out[k].refsAfter !== out[k].refsBefore - 1 || out[k].fwfAfter !== out[k].fwfBefore) fails.push(k + ' totals: ' + JSON.stringify(out[k]));
  }
  const pf = process.env.LIVE ? {} : {pageFile: process.env.PAGE};
  const s = await open(MOB ? {...pf, W: 390, H: 844, dpr: 2, mobile: true} : {...pf, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && typeof allAssets === 'function', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const r = await p.evaluate(PINS => {
    const wc05 = gcUnits925(assetOf('WC05')).map(u => (u.owner || '') + ':' + String(u.assetNo || u.nativeId || ''));
    const pos = Object.fromEntries(Object.keys(PINS).map(k => { const P = dpPos(assetOf(k)), pl = (S.places || {})[k] || {}; return [k, {kind: P.kind, lat: P.lat, lon: P.lon, placed: [pl.lat, pl.lon]}]; }));
    return {wc05, spares: Object.values(S.spares || {}).map(x => x.no), pos, foot: ((document.getElementById('footL') || {}).textContent || '').trim()};
  }, PINS);
  if (!r.wc05.includes('event-portables:0164')) fails.push('record: 0164 is not on WC05 ' + JSON.stringify(r.wc05));
  if (r.spares.length) fails.push('record: spares not empty ' + JSON.stringify(r.spares));
  for (const [k, ll] of Object.entries(PINS)) { const x = r.pos[k]; if (!x || x.kind !== 'placed' || x.lat !== ll[0] || x.lon !== ll[1] || x.placed[0] !== ll[0] || x.placed[1] !== ll[1]) fails.push(k + ' position on the page: ' + JSON.stringify(x)); }
  if (!/v10\.79$/.test(r.foot)) fails.push('footer ' + r.foot.slice(-10));
  if (errs.length) fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', live: !!process.env.LIVE, pass: !fails.length, fails, tracker: out, wc05: r.wc05, pos: r.pos}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
