/* Author: Andrew Fisher. v10.83 check (read-only, every write aborted).
   1. Static, BASE (live v10.82) against PAGE: in the tracker data and crew card only WC05 (its FWF line gone), T0024 (2 x FWF,
      1211968 and 0164, pinned at EVL's toilet symbol) and WC31 (its pin) change; FWF total unchanged; 74 references.
   2. Browser, PAGE: on the record 0164 is on T0024 and not WC05; T0024 and WC31 are placed at the card's pins; footer v10.83.
   BASE=... PAGE=... [MOB=1] [LIVE=1] node test_v1083.cjs */
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
const grab = (t, k) => { const i = t.indexOf('var ' + k + '='); if (i < 0 || t.indexOf('var ' + k + '=', i + 1) >= 0) throw new Error(k + ' not found once');
  const s = i + k.length + 5, e = t.indexOf('\n', s); return JSON.parse(t.slice(s, e).replace(/;\s*$/, '')); };
const refsOf = d => { const m = {}; (function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (typeof o.ref === 'string' && Array.isArray(o.lines)) m[o.ref] = o; Object.values(o).forEach(walk); } })(d); return m; };
const T = ['WC05', 'T0024', 'WC31'];
const blank = d => JSON.stringify((function w(o) { if (Array.isArray(o)) return o.map(w); if (o && typeof o === 'object') { if (Array.isArray(o.lines) && T.includes(o.ref)) return '(' + o.ref + ')'; return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, w(v)])); } return o; })(d));
(async () => {
  const fails = [], MOB = !!process.env.MOB, B = fs.readFileSync(process.env.BASE, 'utf8'), P = fs.readFileSync(process.env.PAGE, 'utf8'), out = {};
  for (const k of ['SVC1067_DATA', 'SVC1067_CARD']) {
    const b = grab(B, k), p = grab(P, k), rb = refsOf(b), rp = refsOf(p);
    if (blank(b) !== blank(p)) fails.push(k + ': more changed than WC05, T0024 and WC31');
    const sum = r => Object.values(r).reduce((a, x) => a + x.lines.filter(y => y.kind === 'fwf').reduce((s, y) => s + (y.qty || 0), 0), 0);
    out[k] = {refs: Object.keys(rp).length, fwfBefore: sum(rb), fwfAfter: sum(rp)};
    if (out[k].refs !== 74 || out[k].fwfAfter !== out[k].fwfBefore) fails.push(k + ' totals ' + JSON.stringify(out[k]));
    if (rp.WC05.lines.map(l => l.id).join() !== 'WC05-TOILETBL,WC05-WASTETAN') fails.push(k + ' WC05 lines ' + rp.WC05.lines.map(l => l.id));
    const t24 = rp.T0024.lines; if (t24.length !== 1 || t24[0].qty !== 2 || t24[0].label !== '2 × FWF' || (k === 'SVC1067_CARD' && JSON.stringify(t24[0].nos) !== '["1211968","0164"]')) fails.push(k + ' T0024 ' + JSON.stringify(t24));
    if (k === 'SVC1067_CARD') { if (JSON.stringify(rp.T0024.pin) !== '[-27.983217,153.426642]') fails.push('T0024 pin ' + JSON.stringify(rp.T0024.pin)); if (JSON.stringify(rp.WC31.pin) !== '[-27.982533,153.425151]') fails.push('WC31 pin ' + JSON.stringify(rp.WC31.pin));
      if (JSON.stringify(rp.WC31.lines) !== JSON.stringify(rb.WC31.lines)) fails.push('WC31 lines changed'); }
  }
  const pf = process.env.LIVE ? {} : {pageFile: process.env.PAGE};
  const s = await open(MOB ? {...pf, W: 390, H: 844, dpr: 2, mobile: true} : {...pf, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && typeof allAssets === 'function', null, {timeout: 240000}); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({wc05: unitsOf('WC05').map(u => String(u.asset_no || '')), t24: subOf('T0024').map(x => String(x.no)), t24pos: (() => { const P = dpPos(assetOf('T0024')); return [P.kind, P.lat, P.lon]; })(),
    wc31place: (() => { const x = (S.places || {}).WC31 || {}; return [x.lat, x.lon]; })(), foot: ((document.getElementById('footL') || {}).textContent || '').trim()}));
  if (r.wc05.includes('0164') || !r.t24.includes('0164')) fails.push('record 0164: WC05 ' + r.wc05 + ' / T0024 ' + r.t24);
  if (r.t24pos[0] !== 'placed' || r.t24pos[1] !== -27.983217 || r.t24pos[2] !== 153.426642) fails.push('T0024 on the page ' + JSON.stringify(r.t24pos));
  if (r.wc31place[0] !== -27.982533 || r.wc31place[1] !== 153.425151) fails.push('WC31 place ' + JSON.stringify(r.wc31place));
  if (!/v10\.83$/.test(r.foot)) fails.push('footer ' + r.foot.slice(-10));
  if (errs.length) fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', live: !!process.env.LIVE, pass: !fails.length, fails, tracker: out, record: r}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
