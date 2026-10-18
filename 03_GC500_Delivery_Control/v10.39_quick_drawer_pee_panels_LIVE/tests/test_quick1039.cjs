#!/usr/bin/env node
/* Author: Andrew Fisher. v10.39 test: the drawer opens quickly, the tick row gives the same answer, pee panels carry no
   steps, and Pricing's money is unchanged. Opens the base (live v10.38) and the build side by side, reads the live
   record, every write aborted.
     node tests/test_quick1039.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
const REFS = ['WC09', 'WC45', 'P03', 'GN06', 'T0128', 'PG03', 'FL03'];
async function read(pageFile) {
  const h = await open({pageFile, hash: '#plant'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    return await h.page.evaluate(refs => {
      const t = f => { const s = performance.now(); const v = f(); return [Math.round(performance.now() - s), v]; };
      const out = {footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0], state: {}, ms: {}, money: {}};
      refs.forEach(r => { const [ms, st] = t(() => sym1033State(r)); out.ms[r] = ms; out.state[r] = st && Object.fromEntries(Object.entries(st).map(([k, v]) => [k, v && v.applies ? (v.of != null ? v.on + '/' + v.of : (v.on ? 'on' : 'off')) : 'n/a'])); });
      const [dms] = t(() => openAsset('WC09')); out.ms.drawer = dms;
      holdAssets(() => refs.forEach(r => { const a = assetOf(r); if (!a) return; out.money[r] = chargeLines(a).map(l => { const m = labourMoney(r, l, l.item, a); return l.item + ':' + m.total; }).join(' '); }));
      const a = assetOf('WC09'); out.peeLines = (labourLinesFor('WC09', 'Toilets & amenities', 'Pee Panel', 'WC09', undefined, a).lines || []).map(L => L.key);
      return out;
    }, REFS);
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base), N = await read(build);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  check('build is v10.39 on v10.38', B.footer === 'v10.38' && N.footer === 'v10.39', B.footer + ' -> ' + N.footer);
  const slow = Math.max(...REFS.map(r => N.ms[r] || 0));
  check('the tick row is quick (every reference under 1.5 s; was ' + Math.max(...REFS.map(r => B.ms[r] || 0)) + ' ms worst)', slow < 1500, JSON.stringify(N.ms));
  check('opening the WC09 drawer is quick (under 2 s; was ' + B.ms.drawer + ' ms)', N.ms.drawer < 2000, N.ms.drawer + ' ms');
  const same = REFS.filter(r => r !== 'WC09').every(r => JSON.stringify(B.state[r]) === JSON.stringify(N.state[r]));
  check('the tick row gives the same answer for every other reference', same, REFS.filter(r => r !== 'WC09' && JSON.stringify(B.state[r]) !== JSON.stringify(N.state[r])).join(', '));
  check('pee panels carry install, level, clean, demob - no steps', JSON.stringify(N.peeLines) === '["install","levelling","cleaning","demob"]', JSON.stringify(N.peeLines) + ' (was ' + JSON.stringify(B.peeLines) + ')');
  check('Pricing money is unchanged on every reference', REFS.every(r => B.money[r] === N.money[r]), JSON.stringify(N.money.WC09));
  console.log('WC09 tick row before/after:', JSON.stringify(B.state.WC09), '->', JSON.stringify(N.state.WC09));
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
