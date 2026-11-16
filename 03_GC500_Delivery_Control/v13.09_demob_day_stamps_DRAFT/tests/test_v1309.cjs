// Author: Andrew Fisher. v13.09 - every finished demob day carries its completed stamp. Read only: every write is aborted.
//   node test_v1309.cjs <page.html|''> [mobile] [shot.png] [figures.json]
// Prints PASS/FAIL lines and writes each day's own figures (percentage, loads, refs) to figures.json so the candidate can be
// compared with the live page: only the stamp may differ.
const path = require('path'), fs = require('fs');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'));
(async () => {
  const pageFile = process.argv[2] || '', mobile = process.argv[3] === 'mobile', shot = process.argv[4], figs = process.argv[5];
  const s = mobile ? await open({pageFile, W: 390, H: 844, dpr: 2, mobile: true}) : await open({pageFile, W: 1440, H: 900});
  const p = s.page, results = [], ok = (name, pass, got) => results.push({name, pass: !!pass, got});
  await p.waitForFunction(() => typeof go === 'function' && typeof demob816 === 'function' && window.DemobProgress996 && DemobProgress996.day, null, {timeout: 150000});
  await p.waitForTimeout(6000); await p.evaluate(() => go('demob')); await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const P = DemobProgress996, M = demob816(), today = todayIso(), days = [];
    for (const iso of M.days) {
      const d = P.day(M, iso, today, trucks816(iso, 'all')), card = document.querySelector('#pane-demob [data-dday816="' + iso + '"]'), st = card && card.querySelector('.bc984-stamp');
      days.push({iso, past: d.past, complete: d.complete, closed: d.closed1309, stamp: !!st, label: st ? st.getAttribute('aria-label') : null,
        fig: {percent: d.percent, bound: d.whole.bound, loads: d.loads, completedLoads: d.completedLoads, refs: d.refs.length, recorded: d.recorded,
          load: card ? ((card.querySelector('.bc984-load-count') || {}).textContent || null) : null, pct: card ? ((card.querySelector('.bc984-percentage') || {}).textContent || null) : null}});
    }
    const future = P.day(M, '2099-01-05', today, []), emptyPast = P.day(M, '2026-10-31', today, []);
    const foot = (document.body.innerText.match(/v13\.\d\d/g) || []).slice(-1)[0] || null;
    return {today, days, futureClosed: future.closed1309, emptyPastClosed: emptyPast.closed1309, foot};
  });
  const past = r.days.filter(d => d.past);
  ok('fifteen finished demob days', past.length === 15, past.length);
  ok('every finished day is closed (closed1309)', past.every(d => d.closed === true), past.filter(d => !d.closed).map(d => d.iso));
  ok('every finished day card carries the stamp', past.every(d => d.stamp), past.filter(d => !d.stamp).map(d => d.iso));
  ok('5 and 13 Nov keep the evidenced-on-the-day label', ['2026-11-05', '2026-11-13'].every(i => (past.find(d => d.iso === i) || {}).label === 'All planned collections for this day evidenced complete.'), past.filter(d => d.complete).map(d => d.iso));
  ok('the other thirteen read "Day completed. Every pick-up planned for this day has been collected."', past.filter(d => !d.complete).length === 13 && past.filter(d => !d.complete).every(d => d.label === 'Day completed. Every pick-up planned for this day has been collected.'), past.filter(d => !d.complete).map(d => d.iso + ':' + d.label).slice(0, 3));
  ok('a future day is not closed', r.futureClosed === false, r.futureClosed);
  ok('a past day with nothing planned is not closed', r.emptyPastClosed === false, r.emptyPastClosed);
  ok('footer v13.09', r.foot === 'v13.09', r.foot);
  if (figs) fs.writeFileSync(figs, JSON.stringify(r.days.map(d => ({iso: d.iso, fig: d.fig})), null, 1));
  if (shot) { const el = await p.$('#pane-demob .strip816'); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500); await el.screenshot({path: shot}); } }
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 5));
  ok('no writes reached the service', true, {blocked: s.counts.blocked});
  await s.browser.close();
  const passed = results.filter(x => x.pass).length;
  results.forEach(x => console.log((x.pass ? 'PASS ' : 'FAIL ') + x.name + '  ' + String(JSON.stringify(x.got)).slice(0, 300)));
  console.log(JSON.stringify({page: pageFile ? path.basename(path.dirname(pageFile)) : 'live', mobile, today: r.today, passed, of: results.length}));
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
