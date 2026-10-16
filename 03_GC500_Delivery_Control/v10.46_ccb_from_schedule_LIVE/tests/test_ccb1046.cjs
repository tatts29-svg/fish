#!/usr/bin/env node
/* Author: Andrew Fisher. v10.46 test: every crowd-control barrier docket has a confirmed category from the programme;
   the six decided today match the record exactly. Base v10.45 against the build, live record read only.
     node tests/test_ccb1046.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
async function read(pageFile) {
  const h = await open({pageFile, hash: '#fencing'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    await h.page.waitForTimeout(3000);
    const r = await h.page.evaluate(() => { const D = allDockets(), rv = D.map(d => [d.docket_no, fenceCcbReview847(d)]).filter(([, x]) => x && x.state !== 'not-applicable');
      const P = document.querySelector('#pane-fencing'); P.querySelectorAll('details').forEach(d => d.open = true);
      return {footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0], ccb: rv.map(([n, x]) => ({no: n, state: x.state, type: x.confirmedType || x.currentType, q: x.quantity, why: x.reason.slice(0, 120)})),
        f: fenceDerived(), scrim: fenceComponentEvidence849(todayIso()).issues.filter(i => /^scrim-bill/.test(i.id)).length, text: P.innerText,
        nos: D.map(d => d.docket_no)}; });
    r.errors = h.errors.slice(); return r;
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base), N = await read(build);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  const want = {'36603': 'ccb_demarc', '36608': 'ccb_demarc', '36610': 'ccb_demarc', '36613': 'ccb_event', '36595': 'ccb_event', '36619': 'ccb_event'};
  check('build is v10.46 on v10.45', B.footer === 'v10.45' && N.footer === 'v10.46', B.footer + ' -> ' + N.footer);
  const bp = B.ccb.filter(x => x.state !== 'confirmed').map(x => x.no);
  check('on v10.45 the six are not confirmed (the gap is real)', Object.keys(want).every(n => bp.includes(n)), JSON.stringify(bp));
  const np = N.ccb.filter(x => x.state !== 'confirmed');
  check('on v10.46 every barrier docket is confirmed', np.length === 0 && N.ccb.length >= 25, N.ccb.length + ' barrier dockets; not confirmed: ' + JSON.stringify(np));
  for (const [n, t] of Object.entries(want)) { const x = N.ccb.find(y => y.no === n) || {}; check(n + ' confirmed as ' + (t === 'ccb_event' ? 'Event' : 'Demarcation'), x.state === 'confirmed' && x.type === t, JSON.stringify(x)); }
  check('the earlier 20 confirmed decisions unchanged', B.ccb.filter(x => x.state === 'confirmed').every(x => { const y = N.ccb.find(z => z.no === x.no); return y && y.state === 'confirmed' && y.type === x.type; }));
  check('"need category review" no longer on the Fencing tab', !/need category review|CCB category needs review/.test(N.text), (N.text.match(/[^\n]*category[^\n]*review[^\n]*/i) || [''])[0]);
  check('36617-36622 on the books', ['36617', '36618', '36619', '36620', '36621', '36622'].every(n => N.nos.includes(n)));
  check('charges and costs unchanged by the page change', B.f.charged === N.f.charged && B.f.cost === N.f.cost, N.f.charged + ' / ' + N.f.cost);
  check('scrim bill items (v10.45) still listed', N.scrim === B.scrim && N.scrim >= 7, String(N.scrim));
  check('no page errors', !N.errors.length, N.errors[0] || '');
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
