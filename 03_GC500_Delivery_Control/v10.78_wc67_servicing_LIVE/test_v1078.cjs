/* Author: Andrew Fisher. v10.78 check (read-only, every write aborted).
   1. Static, BASE (live v10.77) against PAGE: the servicing tracker data and crew card differ only at WC67, which is now
      4 x FWF (0793, 0769, 0714, 172824); every other reference, task and plan is byte for byte the same.
   2. Browser, PAGE: WC67 on the record is 4 FWF units on site, the tracker data agrees with it, footer v10.78, no page errors.
   BASE=... PAGE=... [MOB=1] [LIVE=1] node test_v1078.cjs */
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
const grab = (t, k) => { const i = t.indexOf('var ' + k + '='); if (i < 0 || t.indexOf('var ' + k + '=', i + 1) >= 0) throw new Error(k + ' not found once');
  const s = i + k.length + 5, e = t.indexOf('\n', s); return JSON.parse(t.slice(s, e).replace(/;\s*$/, '')); };
const refsOf = d => { const m = {}; (function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (typeof o.ref === 'string' && Array.isArray(o.lines)) m[o.ref] = o; Object.values(o).forEach(walk); } })(d); return m; };
const strip = (d, ref) => JSON.stringify(d, (k, v) => (v && v.ref === ref && Array.isArray(v.lines)) ? '(WC67)' : v);
(async () => {
  const fails = [], MOB = !!process.env.MOB;
  const B = fs.readFileSync(process.env.BASE, 'utf8'), P = fs.readFileSync(process.env.PAGE, 'utf8');
  const out = {};
  for (const k of ['SVC1067_DATA', 'SVC1067_CARD']) {
    const b = grab(B, k), p = grab(P, k), rb = refsOf(b), rp = refsOf(p);
    if (strip(b, 'WC67') !== strip(p, 'WC67')) fails.push(k + ': something other than WC67 changed');
    const w = rp.WC67, l = w && w.lines.length === 1 ? w.lines[0] : null;
    if (!l || l.qty !== 4 || l.label !== '4 × FWF' || l.id !== 'WC67-FWF') fails.push(k + ' WC67: ' + JSON.stringify(w));
    if (k === 'SVC1067_CARD' && JSON.stringify(l && l.nos) !== '["0793","0769","0714","172824"]') fails.push('crew card WC67 numbers: ' + JSON.stringify(l && l.nos));
    const sum = r => Object.values(r).reduce((a, x) => a + x.lines.filter(y => y.kind === 'fwf').reduce((s, y) => s + (y.qty || 0), 0), 0);
    out[k] = {refs: Object.keys(rp).length, fwfBefore: sum(rb), fwfAfter: sum(rp)};
    if (Object.keys(rb).length !== Object.keys(rp).length || sum(rp) - sum(rb) !== 2) fails.push(k + ' totals: ' + JSON.stringify(out[k]));
  }
  const pf = process.env.LIVE ? {} : {pageFile: process.env.PAGE};   // LIVE=1: the browser part opens the live view link
  const s = await open(MOB ? {...pf, W: 390, H: 844, dpr: 2, mobile: true} : {...pf, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && typeof allAssets === 'function', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const a = allAssets().find(x => x && x.key === 'WC67');
    const units = a ? gcUnits925(a).filter(u => /fwf/i.test(String(u.item || ''))).map(u => String(u.assetNo || u.nativeId || '')) : null;
    let card = null; (function walk(o) { if (card) return; if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o.ref === 'WC67' && Array.isArray(o.lines) && o.lines[0] && o.lines[0].nos) card = o; else Object.values(o).forEach(walk); } })(SVC1067_CARD);
    return {units, card: card ? card.lines[0].nos : null, cardQty: card ? card.lines[0].qty : null, state: a ? (S.delivery[a.key] || {}).state || '' : '', foot: ((document.getElementById('footL') || {}).textContent || '').trim()};
  });
  const nos = (r.units || []).slice().sort().join(' ');
  if (nos !== '0714 0769 0793 172824') fails.push('record WC67 FWF units: ' + nos);
  if (r.cardQty !== 4 || (r.card || []).slice().sort().join(' ') !== nos) fails.push('tracker card does not match the record: ' + JSON.stringify(r.card));
  if (!/v10\.78$/.test(r.foot)) fails.push('footer ' + r.foot.slice(-10));
  if (errs.length) fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', pass: !fails.length, fails, tracker: out, recordWC67: nos, state: r.state}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
