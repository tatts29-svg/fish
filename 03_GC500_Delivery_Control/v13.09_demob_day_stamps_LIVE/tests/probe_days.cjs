// Author: Andrew Fisher. Read only: why each finished Demob day card has or lacks its completed stamp. Every write is aborted.
//   node probe_days.cjs [page.html]   (no page: the live page)
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'));
(async () => {
  const s = await open({pageFile: process.argv[2] || '', W: 1440, H: 900});
  const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof demob816 === 'function' && window.DemobProgress996 && DemobProgress996.day, null, {timeout: 150000});
  await p.waitForTimeout(6000); await p.evaluate(() => go('demob')); await p.waitForTimeout(9000);
  const out = await p.evaluate(() => {
    const list = a => Array.isArray(a) ? a : [], M = demob816(), today = todayIso(), rows = [];
    for (const iso of M.days) {
      const loads = trucks816(iso, 'all'), d = DemobProgress996.day(M, iso, today, loads), w = d.whole, byKey = new Map(w.readings.map(r => [r.key, r]));
      const badRefs = d.refs.filter(r => !(byKey.get(r.key) || {}).complete).map(r => { const x = byKey.get(r.key) || {}; return r.key + (x.arrival ? '' : '(no arrival)') + ':' + (x.events || []).length + 'ev'; });
      const loadInfo = loads.map((L, i) => { const rws = L.toilet?.rows || L.rows || L.stops?.map(x => ({r: x.r, parts: x.parts})) || []; return {i, n: rws.length, keys: rws.map(x => (x.r && x.r.key) + (x.pid ? '#' + x.pid : '') + (list(x.r && x.r.portions).length > 1 ? '[' + list(x.r.portions).length + 'p]' : '')).slice(0, 12)}; });
      const card = document.querySelector('#pane-demob [data-dday816="' + iso + '"]');
      rows.push({iso, past: d.past, complete: d.complete, stampOnCard: !!(card && card.querySelector('.bc984-stamp')), refs: d.refs.length, unknown: d.unknown.length,
        loads: d.loads, completedLoads: d.completedLoads, badRefs, loadInfo});
    }
    return {today, rows};
  });
  for (const r of out.rows) console.log(JSON.stringify(r));
  console.log('errors', s.errors.length, 'blocked writes', s.counts.blocked);
  await s.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
