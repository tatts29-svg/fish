#!/usr/bin/env node
/* Author: Andrew Fisher. v10.45 test: scrim differences between Advanced's bill and the signed dockets are listed in
   What needs reconciling; no money moves. Base (live v10.44) against the build, live record read only.
     node tests/test_scrim1045.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
async function read(pageFile) {
  const h = await open({pageFile, hash: '#fencing'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    await h.page.waitForTimeout(2500);
    const r = await h.page.evaluate(() => { const a = fenceComponentEvidence849(todayIso()), f = fenceDerived(), P = document.querySelector('#pane-fencing');
      P.querySelectorAll('details').forEach(d => d.open = true); const t = P.innerText, i = t.indexOf('What needs reconciling');
      return {footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0], ids: a.issues.map(x => x.id), items: a.issues.filter(x => /^scrim-bill/.test(x.id)).map(x => ({id: x.id, title: x.title, detail: x.detail})),
        charged: f.charged, cost: f.cost, head: t.slice(i, i + 40), text: t.slice(i, i + 6000)}; });
    r.errors = h.errors.slice(); return r;
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base), N = await read(build);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  const want = ['36574', '36575', '36579', '36581', '36583', '36587', '36588'], got = N.items.map(x => x.id.replace('scrim-bill-', '')).sort();
  check('build is v10.45 on v10.44', B.footer === 'v10.44' && N.footer === 'v10.45', B.footer + ' -> ' + N.footer);
  check('the four existing items stay, first and unchanged', JSON.stringify(N.ids.slice(0, B.ids.length)) === JSON.stringify(B.ids) && B.ids.length === 4, JSON.stringify(B.ids));
  check('exactly the seven scrim differences are added', JSON.stringify(got) === JSON.stringify(want), JSON.stringify(got));
  check('36577 (5 m = two vehicle-gate panels) is not listed', !got.includes('36577'));
  const i81 = N.items.find(x => /36581/.test(x.id)) || {}, i75 = N.items.find(x => /36575/.test(x.id)) || {};
  check('36581: Advanced billed 72.5 m, docket says not scrimmed, $1,044.00 over clean / $1,850.93 short if braced = scrim', /72\.5 m/.test(i81.title) && /not scrimmed/i.test(i81.detail) && /\$1,044\.00/.test(i81.detail) && /\$1,850\.9[23]/.test(i81.detail), i81.detail);
  check('36575: docket 135 m scrim, Advanced billed none, our charge backed by the docket', /135 m/.test(i75.title) && /no scrim/.test(i75.detail) && /backed by the docket/.test(i75.detail), i75.detail);
  check('heading reads "What needs reconciling · 11" and the items show on the tab', /What needs reconciling · 11/.test(N.head) && want.every(n => N.text.includes('Scrim on ' + n)), N.head);
  check('no money moved: charged and paid totals unchanged', B.charged === N.charged && B.cost === N.cost, B.charged + '/' + B.cost + ' -> ' + N.charged + '/' + N.cost);
  check('no page errors', !N.errors.length, N.errors[0] || '');
  N.items.forEach(x => console.log('  · ' + x.title + '\n      ' + x.detail));
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
