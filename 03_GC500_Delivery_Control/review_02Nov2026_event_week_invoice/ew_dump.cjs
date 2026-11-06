'use strict';
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#fencing', W: 1280, H: 900}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000}); await p.waitForTimeout(2500);
    const out = await p.evaluate(() => {
      const inEW = x => x.date >= '2026-10-19' && x.date <= '2026-10-25';
      const dk = (S.fenceDockets || []).filter(inEW).map(d => { const c = costDocket(d); return {no: String(d.docket_no), id: d.id, date: d.date, week: d.week, loc: d.location, q: d.quantities, comp: d.components || {}, charge: c.cost_total, paid: c.paid_total, paid_state: c.paid_state, lines: c.lines.map(l => [l.column, l.qty, l.paid_rate, l.paid, l.rate, l.cost])}; });
      const sn = (S.serviceNotes || []).filter(inEW).map(n => ({no: String(n.note_no), id: n.id, date: n.date, loc: n.location, h: n.labour_hours, crew: n.crew_note, metres: n.metres, note: String(n.note || '').slice(0, 160)}));
      let rc = null; try { rc = typeof RaceCrew1227 !== 'undefined' ? RaceCrew1227.model(todayIso()) : null; } catch (e) { rc = 'ERR ' + e; }
      const fc = typeof fenceCostFor === 'function' ? ['clean','scrim','ccb_event','ccb_demarc','ped_gates','flat_feet','fence_blocks'].map(k => [k, fenceCostFor(k)]) : null;
      return {dk, sn, rc, fc};
    });
    require('fs').writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
    console.log('dockets', out.dk.length, 'notes', out.sn.length, 'errors', s.errors.length);
  } catch (e) { console.log('ERR', String(e).slice(0, 300)); }
  await s.browser.close();
})();
