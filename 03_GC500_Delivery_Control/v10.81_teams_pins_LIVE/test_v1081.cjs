/* Author: Andrew Fisher. v10.81 check (read-only, every write aborted).
   1. Static, BASE (live v10.80) against PAGE: the crew card differs only in the pins of BJR01, T0162, SVP01 and T0176; the
      tracker data (SVC1067_DATA) is byte for byte the same.
   2. Browser, PAGE: on the record the four are placed exactly at those pins and navigate there; footer v10.81; no page errors.
   BASE=... PAGE=... [MOB=1] [LIVE=1] node test_v1081.cjs */
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
const grab = (t, k) => { const i = t.indexOf('var ' + k + '='); if (i < 0 || t.indexOf('var ' + k + '=', i + 1) >= 0) throw new Error(k + ' not found once');
  const s = i + k.length + 5, e = t.indexOf('\n', s); return JSON.parse(t.slice(s, e).replace(/;\s*$/, '')); };
const PINS = {BJR01: [-27.985863, 153.427503], T0162: [-27.985742, 153.427447], SVP01: [-27.986211, 153.427753], T0176: [-27.986724, 153.42801]};
const unpin = d => JSON.stringify(d, (k, v) => (v && Array.isArray(v.lines) && PINS[v.ref]) ? Object.assign({}, v, {pin: PINS[v.ref] && JSON.stringify(v.pin) === JSON.stringify(PINS[v.ref]) ? '(pinned)' : v.pin}) : v);
(async () => {
  const fails = [], MOB = !!process.env.MOB;
  const B = fs.readFileSync(process.env.BASE, 'utf8'), P = fs.readFileSync(process.env.PAGE, 'utf8');
  if (JSON.stringify(grab(B, 'SVC1067_DATA')) !== JSON.stringify(grab(P, 'SVC1067_DATA'))) fails.push('tracker data changed');
  const cb = grab(B, 'SVC1067_CARD'), cp = grab(P, 'SVC1067_CARD');
  const before = unpin(cb).replace(/"pin":null(?=,"lines":\[\{"id":"(BJR01|T0162|SVP01|T0176)-)/g, '"pin":"(pinned)"');
  if (before !== unpin(cp)) fails.push('crew card: more changed than the four pins');
  const refs = {}; (function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (typeof o.ref === 'string' && Array.isArray(o.lines)) refs[o.ref] = o; Object.values(o).forEach(walk); } })(cp);
  for (const [r, ll] of Object.entries(PINS)) if (JSON.stringify(refs[r] && refs[r].pin) !== JSON.stringify(ll)) fails.push('card ' + r + ' pin ' + JSON.stringify(refs[r] && refs[r].pin));
  const nopin = Object.values(refs).filter(r => !r.pin).map(r => r.ref).sort();
  const pf = process.env.LIVE ? {} : {pageFile: process.env.PAGE};
  const s = await open(MOB ? {...pf, W: 390, H: 844, dpr: 2, mobile: true} : {...pf, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && typeof allAssets === 'function', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const r = await p.evaluate(PINS => ({pos: Object.fromEntries(Object.keys(PINS).map(k => { const P = dpPos(assetOf(k)); return [k, [P.kind, P.lat, P.lon]]; })), foot: ((document.getElementById('footL') || {}).textContent || '').trim()}), PINS);
  for (const [k, ll] of Object.entries(PINS)) { const x = r.pos[k]; if (!x || x[0] !== 'placed' || x[1] !== ll[0] || x[2] !== ll[1]) fails.push(k + ' on the page: ' + JSON.stringify(x)); }
  if (!/v10\.81$/.test(r.foot)) fails.push('footer ' + r.foot.slice(-10));
  if (errs.length) fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', live: !!process.env.LIVE, pass: !fails.length, fails, stillNoPin: nopin, pos: r.pos}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
