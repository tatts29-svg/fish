// Author: Andrew Fisher. v8.67 Did not work checks, read-only against the live record (every write is aborted by open_page).
//   PAGE=build/GC500_v8.67/GC500_Delivery_Control_hosted.html [MOB=1] node v8.67_did_not_work_DRAFT/tests/test_didnotwork867.cjs
const {open} = require('../../toolchain/harness/open_page');
(async () => { const MOB = !!process.env.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1200);
  /* a day with a shift on the record */
  const pick = await p.evaluate(() => { const L = ourCosts().filter(c => c.kind === 'labour' && c.usable && c.date && c.hours != null); L.sort((a, b) => String(b.date).localeCompare(String(a.date))); const c = L[0]; return c ? {id: c.id, person: c.person, date: c.date, hours: c.hours} : null; });
  ok('a worked shift exists on the record to try', !!pick, pick);
  await p.evaluate(d => { state.runDay = d; }, pick.date);
  await p.evaluate(() => { const b = document.querySelector('[data-finance857="runsheet"]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  const V = await p.evaluate(() => { const t = document.querySelector('#pane-runsheet table.rstbl'); if (!t) return {none: true};
    const ths = t.querySelectorAll('thead th').length, rows = [...t.querySelectorAll('tbody tr')].map(tr => tr.children.length);
    return {ths, rows, offCells: t.querySelectorAll('td.rsoff867').length, buttons: t.querySelectorAll('[data-rsoff],[data-rson]').length, ed: canEdit()}; });
  ok('running sheet drawn with the new column, every row the same width as the header', !V.none && V.offCells > 0 && V.rows.every(n => n === V.ths), V);
  ok('a view-only link sees no Did not work or Put back button', V.ed === false && V.buttons === 0, {ed: V.ed, buttons: V.buttons});
  /* in memory, never saved: tomb the shift, read the models, untomb */
  const M = await p.evaluate(({id, person, date}) => { const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
    const before = {day: runDay(date).rows.find(r => r.name === person), paid: fin745Rows(todayIso()).reduce((s, r) => s + (Number(r.paid) || 0), 0), wages: cj764Model().wages.job, n: ourCosts().filter(c => c.kind === 'labour').length};
    const html0 = runOffCell867({name: person, shift: before.day && before.day.shift}, date, true);
    tomb(id, 'test'); try { RENDER_MEMO.clear(); } catch (e) {}
    const after = {day: runDay(date).rows.find(r => r.name === person), paid: fin745Rows(todayIso()).reduce((s, r) => s + (Number(r.paid) || 0), 0), wages: cj764Model().wages.job, n: ourCosts().filter(c => c.kind === 'labour').length};
    const html1 = runOffCell867({name: person, shift: after.day && after.day.shift}, date, true), html1v = runOffCell867({name: person, shift: null}, date, false);
    untomb(id, 'test'); try { RENDER_MEMO.clear(); } catch (e) {}
    const back = {day: runDay(date).rows.find(r => r.name === person), paid: fin745Rows(todayIso()).reduce((s, r) => s + (Number(r.paid) || 0), 0), wages: cj764Model().wages.job, n: ourCosts().filter(c => c.kind === 'labour').length};
    delete S.deleted[id]; delete S.deleted[UNDO + id]; try { RENDER_MEMO.clear(); } catch (e) {}
    return {before: {shift: !!(before.day && before.day.shift), hours: before.day && before.day.hours, paid: r2(before.paid), wages: before.wages, n: before.n}, after: {shift: !!(after.day && after.day.shift), paid: r2(after.paid), wages: after.wages, n: after.n}, back: {shift: !!(back.day && back.day.shift), paid: r2(back.paid), wages: back.wages, n: back.n}, html0, html1, html1v}; }, pick);
  ok('the row offers Did not work while the shift is on', /data-rsoff=/.test(M.html0) && /Did not work/.test(M.html0), {html: M.html0.slice(0, 120)});
  ok('taking the shift off removes it from the day, the paid hours and the labour line count', !M.after.shift && M.after.n === M.before.n - 1 && M.after.paid < M.before.paid, {before: M.before, after: M.after});
  ok('the row then offers Put back, and a view-only link sees nothing', /data-rson=/.test(M.html1) && /Put back/.test(M.html1) && M.html1v === '', {html: M.html1.slice(0, 120), view: M.html1v});
  ok('putting it back restores the day, the paid hours and the wages to the cent', M.back.shift && M.back.n === M.before.n && Math.abs(M.back.paid - M.before.paid) < 0.005 && Math.abs(M.back.wages - M.before.wages) < 0.005, {before: M.before, back: M.back});
  /* the write guards on a view-only link */
  const G = await p.evaluate(({person, date}) => { const was = JSON.stringify(S.deleted || {}); const a = runShiftOff867(person, date); const b = runShiftBack867(person, date); return {a, b, same: JSON.stringify(S.deleted || {}) === was}; }, pick);
  ok('on a view-only link neither write goes through and nothing changes', G.a === false && G.b === false && G.same, G);
  await p.evaluate(() => { const b = document.querySelector('[data-finance857="summary"]'); if (b) b.click(); }); await p.waitForTimeout(1200);
  const back = await p.evaluate(() => ({glance: !!document.getElementById('costs765'), labour: !!document.getElementById('labour865')}));
  ok('P&L summary comes back whole', back.glance && back.labour, back);
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  R.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 600)}`));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'desktop'}: ${R.length - fails}/${R.length} pass`); await s.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('TEST FAIL', e); process.exit(2); });
