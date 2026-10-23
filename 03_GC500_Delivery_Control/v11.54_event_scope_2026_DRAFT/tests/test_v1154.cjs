/* Author: Andrew Fisher. v11.54 checks: the page's scope engine reproduces the 2026 workbook C004-26003-01 to the cent
   (every line's hours and amount, the access-plan times, people, accommodation and travel, the total), no change is
   typed, the provisional caveat is gone, the P&L race line and the Customer rates & charges card carry it. GET only;
   the record is compared.
     PAGE=build/GC500_v11.54/GC500_Delivery_Control_hosted.html node tests/test_v1154.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const EXPECT = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'event_scope_2026.json'), 'utf8'));
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 1200))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
const cents = n => Math.round(n * 100) / 100;
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#pricing', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#pricing', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.54'));
  const R = await p.evaluate(() => holdAssets(() => { const SF = scopeFigures(), M = moneySummary(); return {SF, race: M.charge.race, total: M.charge.total, caveats: M.caveats, doc: SCOPE.document, suppliedOn: SCOPE.supplied_on, asWritten: SCOPE.access_plan.as_written, typed: Object.keys(S.eventHours || {}).length + Object.keys(S.rates || {}).filter(k => /^scope/.test(k)).length}; }));
  const SF = R.SF;
  check('the page carries the 2026 document, received 23 Oct 2026, with nothing typed over it and no provisional flag', R.doc === EXPECT.document && R.suppliedOn === '2026-10-23' && SF.edits === 0 && R.typed === 0 && SF.provisional === false && !/to be updated/i.test(R.asWritten), {doc: R.doc, suppliedOn: R.suppliedOn, edits: SF.edits, typed: R.typed, provisional: SF.provisional});
  const lineChecks = EXPECT.lines.map(L => { const row = SF.lines.find(x => x.key === L.key); const aw = L.as_written; return {key: L.key, ok: !!row && row.rate === L.rate && Math.abs(row.hours - aw.total_hours) < 0.0001 && row.amount === cents(aw.amount) && L.days && ['Fri', 'Sat', 'Sun'].every(d => { const D = row.days.find(x => x.day === d); const mm = m => m == null ? null : String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); return D && Math.abs(D.hours - aw.hours[d]) < 0.0001 && mm(D.start) === aw.start[d] && mm(D.finish) === aw.finish[d]; }), got: row && {rate: row.rate, hours: row.hours, amount: row.amount, days: row.days.map(d => [d.day, d.start, d.finish, d.hours])}, want: {rate: L.rate, hours: aw.total_hours, amount: cents(aw.amount), start: aw.start, finish: aw.finish}}; });
  check('every line reproduces the workbook: rate, each day\'s start, finish and hours, the line\'s hours and amount', lineChecks.every(x => x.ok), lineChecks.filter(x => !x.ok));
  const T = EXPECT.totals_as_written;
  check('people, accommodation and travel, hours and the total land on the workbook to the cent', SF.people === cents(T.people) && SF.at === T.accommodation_travel && SF.total === cents(T.grand) && Math.abs(SF.hours - EXPECT.lines.reduce((s, l) => s + l.as_written.total_hours, 0)) < 0.01, {people: SF.people, at: SF.at, total: SF.total, hours: SF.hours, want: T});
  const times = EXPECT.access_plan.days.flatMap(d => EXPECT.access_plan.fields.map(f => ({day: d.day, field: f.key, want: d[f.key]})));
  const timeChecks = times.map(t => { const got = SF.times.find(x => x.day === t.day && x.field === t.field); const mm = m => m == null ? null : String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); return {t, got: got && mm(got.min), ok: !!got && mm(got.min) === t.want && !got.typed}; });
  check('the 2026 access plan is the one in force (gates Fri 09:30, Sat and Sun 08:00; closure 07:00; track opening 18:00, 18:00, 17:40; entertainment 20:30, 20:30, none)', timeChecks.every(x => x.ok), timeChecks.filter(x => !x.ok));
  check('the P&L race-weekend line is the scope total, in scope, not provisional, and no caveat says the times are still to be updated', R.race && R.race.scope === true && R.race.amount === cents(T.grand) && !R.race.provisional && !R.caveats.some(c => /to be updated/i.test(c)), {race: R.race && {amount: R.race.amount, scope: R.race.scope, provisional: R.race.provisional}, caveats: R.caveats});
  await p.waitForTimeout(1500);
  const card = await p.evaluate(() => { const pane = document.getElementById('pane-pricing'); const el = [...pane.querySelectorAll('section, div.card, .card')].find(x => /Event Labour Scope/.test(x.textContent) && x.querySelector('h2, h3')); return {found: !!el, text: el ? el.innerText.slice(0, 1500) : pane.innerText.slice(0, 400)}; });
  check('the Customer rates & charges card names the 2026 document, received 23 Oct 2026, with the workbook\'s total', card.found && /C004-26003-01/.test(card.text) && /23 Oct 2026/.test(card.text) && /56,744\.47/.test(card.text) && !/C004-25003-01/.test(card.text), {found: card.found, snippet: card.text.slice(0, 300)});
  await p.evaluate(() => { const pane = document.getElementById('pane-pricing'); const el = [...pane.querySelectorAll('section, div.card, .card')].find(x => /Event Labour Scope/.test(x.textContent) && x.querySelector('h2, h3')); if (el) el.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(600);
  await p.screenshot({path: path.join(out, 'scope_card_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
  fs.writeFileSync(path.join(out, tag + '_scope_figures.json'), JSON.stringify({at: new Date().toISOString(), live, people: SF.people, at_: SF.at, total: SF.total, hours: SF.hours, race: R.race && R.race.amount, revenue_total: R.total, lines: SF.lines.map(l => ({key: l.key, rate: l.rate, hours: l.hours, amount: l.amount}))}, null, 1));
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1154.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
