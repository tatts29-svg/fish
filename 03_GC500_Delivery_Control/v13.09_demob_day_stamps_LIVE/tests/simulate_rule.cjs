// Author: Andrew Fisher. Read only: score each demob day on the proposed stamp rule before building it. Every write is aborted.
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'));
(async () => {
  const s = await open({pageFile: process.argv[2] || '', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof demob816 === 'function' && window.DemobProgress996 && DemobProgress996.day, null, {timeout: 150000});
  await p.waitForTimeout(6000); await p.evaluate(() => go('demob')); await p.waitForTimeout(8000);
  const out = await p.evaluate(() => {
    const list = a => Array.isArray(a) ? a : [], P = DemobProgress996, M = demob816(), today = todayIso(), res = [];
    const t0 = performance.now(); P.whole(M, today); const wholeMs = performance.now() - t0;
    for (const iso of M.days) {
      const loads = trucks816(iso, 'all'), d = P.day(M, iso, today, loads), w = d.whole;
      const refBy = new Map(w.refs.map(r => [r.key, r])), off = new Set(w.notOnSite1306 || []), zero = new Set(list(w.zero).map(r => r.key)), unk = new Set(list(w.unknown).map(r => r.key));
      const done = r => { try { return P.evidence(r, P.record(r.key), today).complete; } catch (e) { return false; } };
      const rowKeys = L => (L.toilet?.rows || L.rows || L.stops?.map(x => ({r: x.r})) || []).map(x => x.r && x.r.key).filter(Boolean);
      const blockers = [];
      d.refs.forEach(r => { if (!done(r)) blockers.push('ref ' + r.key); });
      loads.forEach((L, i) => rowKeys(L).forEach(k => { if (off.has(k) || zero.has(k)) return; const r = refBy.get(k); if (!r) blockers.push('load' + i + ' ' + k + (unk.has(k) ? ' (unknown qty)' : ' (not in scope)')); else if (!done(r)) blockers.push('load' + i + ' ' + k); }));
      const offRows = loads.flatMap(L => rowKeys(L)).filter(k => off.has(k) || zero.has(k));
      res.push({iso, today: d.today, past: d.past, nowStamp: d.complete, newStamp: d.past && (d.refs.length > 0 || loads.length > 0) && !d.unknown.length && !blockers.length, blockers: [...new Set(blockers)], skipped: offRows});
    }
    return {today, wholeMs: Math.round(wholeMs), res};
  });
  console.log('today', out.today, 'whole(today) ms', out.wholeMs); out.res.forEach(r => console.log(JSON.stringify(r)));
  console.log('errors', s.errors.length, 'blocked writes', s.counts.blocked); await s.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
