// Author: Andrew Fisher. Read-only: every labour row on the record with its month, hours, cost and the branch its note names (hours
// split by branch where the note gives them), for Andrew to settle the rest against tomorrow's invoices. Writes aborted by the harness.
//   PAGE=<page file> OUT=<json> node labour_register.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const today = todayIso(), r2 = n => Math.round(n * 100) / 100;
      const people = new Map(ourCosts().filter(c => c.kind === 'person').map(c => [c.person, c]));
      const fin = new Map(fin745Rows(today).map(x => [x.id, x]));
      const crew = x => typeof RaceCrew1227 !== 'undefined' && RaceCrew1227.isCrew(x);
      const BR = /\b(STPS|KINP|NVAC|MEAD)\b/;
      /* the note's own split: a segment naming a branch takes the hours in the segment after it ("Generators 9961976 NVAC · 4 h");
         a segment naming a branch with "the rest" takes what is left; a note naming one branch and no hours takes the whole row */
      const split = (note, hours) => {
        const segs = String(note || '').split(' · ').map(x => x.trim());
        const out = {}; let rest = null; const named = new Set();
        segs.forEach((sg, i) => { const m = sg.match(BR); if (!m) return; named.add(m[1]);
          const nx = (segs[i + 1] || '').match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?\b/);
          if (nx) out[m[1]] = r2((out[m[1]] || 0) + Number(nx[1]));
          else if (/rest of the day|the rest/i.test(sg)) rest = m[1]; });
        const got = Object.values(out).reduce((t, v) => t + v, 0);
        if (rest && hours != null) out[rest] = r2((out[rest] || 0) + Math.max(0, hours - got));
        if (!Object.keys(out).length && named.size === 1 && hours != null) out[[...named][0]] = hours;
        return {out, named: [...named]};
      };
      const rows = ourCosts().filter(c => c.kind === 'labour').map(c => {
        const f = fin.get(c.id), P = people.get(c.person) || {};
        const cost = f ? (f.status === 'confirmed' && f.actualCost != null ? f.actualCost : f.calculatedCost) : null;
        const hours = (Number(c.hours) || 0) + (Number(c.overtime_hours) || 0);
        const sp = split(c.note, hours);
        const assigned = Object.values(sp.out).reduce((t, v) => t + v, 0);
        return {id: c.id, date: c.date || '', month: String(c.date || '').slice(0, 7), person: c.person || '', type: P.type || (f && f.type) || '', home: P.branch || '',
          start: c.start || '', finish: c.finish || '', hours: r2(hours), paid: f ? f.paid : null, cost: cost == null ? null : r2(cost), status: f ? f.status : (c.usable ? '' : 'not usable'),
          raceCrew: f ? crew(f) : false, usable: !!c.usable, split: sp.out, named: sp.named, unassignedHours: r2(Math.max(0, hours - assigned)), note: String(c.note || '').slice(0, 400)};
      });
      return {asAt: today, record: SYNC.backend.readVersion821(), rows, lhJob: (labourHireSoFar1267(today) || {}).job};
    }));
    fs.writeFileSync(process.env.OUT, JSON.stringify(r, null, 1));
    console.log('rows', r.rows.length, 'record', r.record, 'labour hire job end', r.lhJob);
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
