#!/usr/bin/env node
/* Author: Andrew Fisher. v10.47 test: fencing completion like for like. Base (v10.46 build) against the build, live
   record read only.   node tests/test_fence1047.cjs <base.html> <build.html> */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const {open} = require(path.join(ROOT, 'toolchain', 'harness', 'open_page.js'));
async function read(pageFile) {
  const h = await open({pageFile, hash: '#today'});
  try {
    await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
    await h.page.waitForTimeout(5000);
    const r = await h.page.evaluate(() => { const d = todayIso(), s = todayWorkSummary848(d), o = fenceOverall853(d), row = id => s.fencingRows.find(x => x.id === id) || {};
      const pick = x => ({label: x.label, total: x.total, done: x.done, left: x.left, pct: x.pct == null ? null : Math.round(x.pct * 100) / 100});
      const mesh = allDockets().filter(x => x.scope === 'programme').reduce((n, x) => n + (Number((x.components || {}).mesh_panel) || 0), 0);
      return {footer: (document.body.innerText.match(/v10\.\d+/g) || []).slice(-1)[0], clean: pick(row('clean')), scrim: pick(row('scrim')), vg: pick(row('v_gates')), pg: pick(row('ped_gates')),
        ev: pick(row('ccb_event')), dm: pick(row('ccb_demarc')), reloc: pick(row('relocation')), head: {total: o.total, credited: o.credited && o.credited.min, pct: o.pct && Math.round(o.pct.min * 100) / 100},
        mesh, f: fenceDerived(), text: document.body.innerText}; });
    for (const tab of ['progress', 'fencing']) { await h.page.evaluate(k => { try { go(k); } catch (e) {} }, tab); await h.page.waitForTimeout(2000); r['t_' + tab] = await h.page.evaluate(() => document.body.innerText); }
    r.errors = h.errors.slice(); return r;
  } finally { await h.browser.close(); }
}
(async () => {
  const [base, build] = process.argv.slice(2);
  const B = await read(base), N = await read(build);
  let failed = 0, total = 0; const check = (w, ok, d) => { total++; if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + w + (d ? ' - ' + d : '')); };
  check('build is v10.47 on v10.46', B.footer === 'v10.46' && N.footer === 'v10.47', B.footer + ' -> ' + N.footer);
  check('base shows the bug: clean fence above 100%, vehicle gates 0', B.clean.pct > 100 && B.vg.done === 0, JSON.stringify([B.clean, B.vg]));
  check('fence metres recorded unchanged (the clean line is the installed fence)', N.clean.done === B.clean.done, B.clean.done + ' -> ' + N.clean.done + ' (' + N.mesh + ' mesh panels counted on programme dockets that list them)');
  check('temporary fence against clean + braced: total = ' + (B.clean.total + B.scrim.total), N.clean.total === B.clean.total + B.scrim.total && N.clean.left === N.clean.total - N.clean.done && N.clean.pct > 0 && N.clean.pct <= 100, JSON.stringify(N.clean));
  check('scrim fitted unchanged in number, relabelled', N.scrim.total === B.scrim.total && N.scrim.done === B.scrim.done && /Scrim fitted/.test(N.scrim.label), JSON.stringify(N.scrim));
  check('vehicle gates from wheels, two per gate, capped at the schedule', N.vg.done > 0 && N.vg.done <= N.vg.total && N.vg.left === N.vg.total - N.vg.done, JSON.stringify(N.vg));
  check('pedestrian gates, CCB event/demarcation and relocations unchanged', JSON.stringify([N.pg, N.ev, N.dm, N.reloc].map(x => [x.total, x.done])) === JSON.stringify([B.pg, B.ev, B.dm, B.reloc].map(x => [x.total, x.done])));
  const want = N.clean.total + N.ev.total + N.dm.total + 256;
  check('headline = installation only (fence + CCB event + demarcation + flat feet), no scrim/relocation/removal', Math.abs(N.head.total - want) < 0.01 && N.head.pct > 0 && N.head.pct <= 100, JSON.stringify(N.head) + ' (was ' + JSON.stringify(B.head) + ')');
  check('no percentage above 100% left on Today, Progress or Fencing', ![N.text, N.t_progress, N.t_fencing].some(t => /1[0-9]{2}(\.\d+)?% recorded/.test(t)), '');
  check('charges and costs unchanged', B.f.charged === N.f.charged && B.f.cost === N.f.cost, N.f.charged + ' / ' + N.f.cost);
  check('no page errors', !N.errors.length, N.errors[0] || '');
  console.log(failed ? 'FAILED ' + failed + ' of ' + total : 'ALL ' + total + ' PASSED'); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
