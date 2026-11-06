// Author: Andrew Fisher. 26 Oct 2026 - read back the departures on a fresh load of the live page (read only: the
// harness serves the page file and aborts every write): the reference's light, its departure record and what is left.
//   PAGE=<live page file> REFS=GN10 node check_after.cjs
'use strict';
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const refs = String(process.env.REFS || 'GN10').split(',').filter(Boolean);
  const s = await open({pageFile: process.env.PAGE, hash: '#demob', W: 1280, H: 900});
  const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const out = await p.evaluate(refs => {
      const day = todayIso(), M = demob816(), whole = DemobProgress996.whole(M, day);
      const one = k => { const d = deliveryOf(k), r = DemobCollection996.read(k, day), st = Departure1211.status(k);
        return {ref: k, light: d.state, complete: !!d.done, departure: st && {label: st.label, last: st.last, collected: st.collected, remaining: st.remaining, complete: st.complete},
          events: (r ? r.events : []).map(c => ({left: c.departedAt1211, date: c.date, by: c.by, items: c.items.map(i => i.n + ' x ' + i.type + (i.numbers.length ? ' ' + i.numbers.join(', ') : '')), whole: c.complete})),
          stillToLeave: r ? r.remaining.filter(u => u.n > 0).map(u => u.n + ' x ' + u.type) : null}; };
      return {version: SYNC.version, day, demob: whole.completed + ' of ' + whole.total + ' references have left in full', refs: refs.map(one)};
    }, refs);
    console.log(JSON.stringify(out, null, 1), '\nerrors', s.errors.length, 'blocked', s.counts.blocked);
  } catch (e) { console.log('ERR', String(e).slice(0, 300)); }
  await s.browser.close();
})();
