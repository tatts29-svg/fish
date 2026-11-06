#!/usr/bin/env node
/* Author: Andrew Fisher. v10.44 test: no agent name anywhere in the page's drawn text or titles (closed sections
   included), on every tab, drawer and print view; and no slowdown. Base (live v10.43) against the build, live record
   read only, every write aborted.   node tests/test_names1044.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
async function read(pageFile) {
  const h = await open({pageFile, hash: '#today'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    await h.page.waitForTimeout(1500);
    const scan = () => h.page.evaluate(() => { const RX = /via (?:Codex|Claude)/i, out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode && n.parentNode.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT}); let n;
      while ((n = w.nextNode())) if (RX.test(n.nodeValue)) out.push(n.nodeValue.trim().slice(0, 120));
      document.querySelectorAll('[title]').forEach(e => { if (RX.test(e.getAttribute('title'))) out.push('title: ' + e.getAttribute('title').slice(0, 120)); }); return out; });
    const r = {hits: {}, times: {}};
    const add = (where, list) => list.forEach(t => { (r.hits[t] = r.hits[t] || []).push(where); });
    r.footer = await h.page.evaluate(() => (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0]);
    const tabs = await h.page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('[data-tab],[data-go]')).map(e => e.dataset.tab || e.dataset.go).filter(Boolean))]);
    for (const t of tabs) { const ms = await h.page.evaluate(k => { const t0 = performance.now(); try { go(k); } catch (e) {} return performance.now() - t0; }, t); r.times[t] = Math.round(ms);
      await h.page.waitForTimeout(1200); await h.page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await h.page.waitForTimeout(200); add('tab:' + t, await scan()); }
    for (const hash of ['#print/drivers/2026-10-16', '#nights', '#change/2026-10-16']) { await h.page.evaluate(x => { location.hash = x; }, hash); await h.page.waitForTimeout(1500); add(hash, await scan()); }
    const refs = await h.page.evaluate(() => holdAssets(() => allAssets().map(a => a.key)));
    for (const k of refs) { await h.page.evaluate(x => { try { openAsset(x); } catch (e) {} document.querySelectorAll('#drawer details').forEach(d => d.open = true); }, k); await h.page.waitForTimeout(200); add('drawer:' + k, await scan()); }
    r.tabs = tabs.length; r.refs = refs.length; r.errors = h.errors.slice(); return r;
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base), N = await read(build);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  check('build is v10.44 on v10.43', B.footer === 'v10.43' && N.footer === 'v10.44', B.footer + ' -> ' + N.footer);
  const bk = Object.keys(B.hits), nk = Object.keys(N.hits);
  check('base still carries agent names in closed sections / other views (the gap is real)', bk.length > 0, bk.length + ' distinct, e.g. ' + JSON.stringify(bk.slice(0, 2)) + ' at ' + JSON.stringify((B.hits[bk[0]] || []).slice(0, 2)));
  check('build: no agent name in any tab, print view or drawer (closed sections opened, titles included)', nk.length === 0 && N.tabs > 10 && N.refs > 150, N.tabs + ' tabs, ' + N.refs + ' drawers; ' + JSON.stringify(nk.slice(0, 3)));
  const slow = Object.keys(N.times).filter(t => N.times[t] > (B.times[t] || 0) * 1.25 + 150);
  check('no tab slower to open (within 25% + 150 ms)', slow.length === 0, slow.map(t => t + ' ' + B.times[t] + '->' + N.times[t] + 'ms').join(', ') || 'heaviest: ' + Object.entries(N.times).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, v]) => t + ' ' + B.times[t] + '->' + v + 'ms').join(', '));
  check('no page errors', !N.errors.length, N.errors[0] || '');
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
