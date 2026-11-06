#!/usr/bin/env node
/* Author: Andrew Fisher. v10.43 test: the person's name only on screen, in CSV downloads and in copies. Base (live
   v10.42) against the build, live record read only, every write aborted.
     node tests/test_names1043.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
const RX = /(codex|claude)/i;
async function read(pageFile, full) {
  const h = await open({pageFile, hash: '#today'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    const r = {hits: {}};
    const grab = async where => { const t = await h.page.evaluate(() => document.body.innerText); t.split('\n').forEach(l => { if (RX.test(l)) { const k = l.trim().slice(0, 160); (r.hits[k] = r.hits[k] || []).push(where); } }); };
    r.footer = await h.page.evaluate(() => (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0]);
    r.unit = await h.page.evaluate(() => ['Andrew Fisher (via Claude)', 'Andrew Fisher via Codex', 'Andrew Fisher via Claude (typed)', 'Marked by Andrew Fisher (via Claude) · 29 Sep', 'Andrew Fisher', 'Delivered via Coates truck'].map(s => noAgent1030(s)));
    const tabs = full ? await h.page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('[data-tab],[data-go]')).map(e => e.dataset.tab || e.dataset.go).filter(Boolean))]) : [];
    for (const t of tabs) { await h.page.evaluate(k => { try { go(k); } catch (e) {} }, t); await h.page.waitForTimeout(1200); await grab('tab:' + t); }
    const refs = full ? await h.page.evaluate(() => holdAssets(() => allAssets().map(a => a.key))) : ['WC41', 'WC43'];
    for (const k of refs) { await h.page.evaluate(x => { try { openAsset(x); } catch (e) {} }, k); await h.page.waitForTimeout(250); await grab('drawer:' + k); }
    r.tabs = tabs.length; r.refs = refs.length;
    r.wc41 = await h.page.evaluate(() => { openAsset('WC41'); return (document.querySelector('#drawer') || document.body).innerText.split('\n').filter(l => /Marked by/.test(l)).slice(0, 2); });
    r.csv = await h.page.evaluate(async () => { let txt = null; const o = URL.createObjectURL; URL.createObjectURL = b => { b.text().then(t => { txt = t; }); return o.call(URL, b); };
      try { fin745Download('t.csv', 'who\nAndrew Fisher (via Claude)\nAndrew Fisher via Codex\n', 'text/csv;charset=utf-8'); } catch (e) { return 'ERR ' + e.message; } await new Promise(z => setTimeout(z, 300)); URL.createObjectURL = o; return txt; });
    r.clip = await h.page.evaluate(() => !!(navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText.names1043));
    r.dl = await h.page.evaluate(() => !!fin745Download.names1043);
    r.errors = h.errors.slice(); return r;
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base, false), N = await read(build, true);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  check('build is v10.43 on v10.42', B.footer === 'v10.42' && N.footer === 'v10.43', B.footer + ' -> ' + N.footer);
  check('base shows the leak on WC41 (the bug is real)', B.wc41.some(l => /via Claude/.test(l)), JSON.stringify(B.wc41));
  check('WC41 now: "Marked by Andrew Fisher" only', N.wc41.length && N.wc41.every(l => /Marked by Andrew Fisher/.test(l) && !RX.test(l)), JSON.stringify(N.wc41));
  check('cleaner: both forms removed, other "via" text untouched', JSON.stringify(N.unit) === JSON.stringify(['Andrew Fisher', 'Andrew Fisher', 'Andrew Fisher', 'Marked by Andrew Fisher · 29 Sep', 'Andrew Fisher', 'Delivered via Coates truck']), JSON.stringify(N.unit));
  check('every tab and every drawer: no agent name on screen', Object.keys(N.hits).length === 0 && N.tabs > 10 && N.refs > 150, N.tabs + ' tabs, ' + N.refs + ' drawers; ' + JSON.stringify(Object.keys(N.hits).slice(0, 3)));
  check('CSV download carries the person only', typeof N.csv === 'string' && !RX.test(N.csv) && /Andrew Fisher\nAndrew Fisher/.test(N.csv), JSON.stringify(N.csv));
  check('download and clipboard paths both wrapped', N.dl && N.clip, 'download ' + N.dl + ', clipboard ' + N.clip);
  check('no page errors', !N.errors.length, N.errors[0] || '');
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
