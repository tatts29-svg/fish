/* Author: Andrew Fisher. v11.53 checks: the Questions tab's identity check runs (no "checks didn't run" warning), the
   asset-number question counts the fleet numbers on the record, the eight settled questions sit in Answered or history
   with their notes kept, labour cost basis is Pending / later, NVAC has no unpriced line and the four 9961976 lines carry
   their treatment at nought, the review date reads 23 Oct 2026. GET only; the record is compared.
     PAGE=build/GC500_v11.53/GC500_Delivery_Control_hosted.html node tests/test_v1153.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 1200))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
const SETTLED = ['fe-quote', 'fe-closure', 'fe-gap', 'fe-rate-team_leader', 'oi-R10', 'oi-R26', 'oi-R29', 'oi-TX03'];
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#questions', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#questions', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.53'));
  const R = await p.evaluate(settled => holdAssets(() => {
   const Q = questionsList(), list = Object.keys(Q).filter(k => /^\d+$/.test(k)).map(k => Q[k]);
   const hist = questionHistory753();
   const byId = id => list.find(q => q.id === id) || (id.startsWith('oi-') ? (() => { const r = hist.find(x => x[0] === id.slice(3)); return r && {id, st: r[1], q: r[2], why: r[3], need: r[4]}; })() : null);
   const c = Questions967.context();
   const sp = byId('sp-nums');
   const open = list.filter(q => q.st === 'open').map(q => q.id), later = list.filter(q => q.st === 'later').map(q => q.id);
   const nvacRows = ONHIRE_ROWS.filter(r => String(r.rental_contract) === '9961976' && [37, 41, 45, 47].includes(Number(r.line))).map(r => { const ch = contractCharge(r), t = contractTreatment747(r); return {line: r.line, status: r.status_as_written, amount: ch.amount, how: ch.how, kind: t && t.kind}; });
   const M = moneySummary();
   return {fails: Q.fails || [], identityError: !!c.identityError, identities: c.identities ? {pending: c.identities.pending.length, covered: c.identities.covered.length, pendingRows: c.identities.pending.map(r => r.ref + ' · ' + r.item + ' ' + r.numbered + '/' + r.quantity), coveredRefs: c.identities.covered.map(r => r.ref)} : null,
    sp: sp && {st: sp.st, q: sp.q, rows: (sp.rows || []).slice(0, 12), n: (sp.rows || []).length}, open, later,
    settled: settled.map(id => { const q = byId(id); return {id, st: q && q.st, q: q && String(q.q).slice(0, 70), note: !!qAnswer(id)}; }),
    nvac: byId('br-norate-NVAC') && {st: byId('br-norate-NVAC').st, q: byId('br-norate-NVAC').q}, nvacRows, unknown: M.charge.contracts_unknown,
    lb: byId('lb-rates') && {st: byId('lb-rates').st, need: String(byId('lb-rates').need).slice(0, 120)},
    reviewed: /Questions reviewed · 23 Oct 2026/.test(answersOverview754Html()), handle: typeof Questions1153 !== 'undefined' && Questions1153.settled.length};
  }), SETTLED);
  check('the identity check runs: no failed check and no identity error; the fleet numbers on the record are counted (at least 30 received lines covered)', R.fails.length === 0 && !R.identityError && R.identities && R.identities.covered >= 30, {fails: R.fails, identityError: R.identityError, identities: R.identities && {pending: R.identities.pending, covered: R.identities.covered}});
  check('the asset-number question counts received units numbered and lists only the lines still short (under a dozen), the Pit Garage toilets with their numbers no longer among them', R.sp && (R.sp.st === 'done' || (R.sp.n > 0 && R.sp.n < 12 && R.sp.rows.every(r => /received units numbered/.test(r)) && !R.sp.rows.some(r => /^(PG01|PG03|PG05|PG29|WC10|WC30) /.test(r)))), R.sp);
  check('the eight settled questions sit in Answered or history with their decision, the saved notes kept', R.settled.every(x => x.st === 'done') && R.settled.filter(x => x.note).length >= 6, R.settled);
  check('labour cost basis is Pending / later with the payroll words; it is not in Needs an answer', R.lb && R.lb.st === 'later' && /payroll/.test(R.lb.need) && !R.open.includes('lb-rates'), R.lb);
  check('NVAC has no unpriced contract line: the four 9961976 lines carry their treatment at nought and the P&L counts no unrated line for them', R.nvacRows.length === 4 && R.nvacRows.every(r => r.amount === 0 && r.kind) && (!R.nvac || R.nvac.st === 'done') && !R.open.includes('br-norate-NVAC') && !R.later.includes('br-norate-NVAC'), {nvac: R.nvac, rows: R.nvacRows, unknown: R.unknown});
  check('Needs an answer is down to the questions the record cannot answer yet (at most four), none of them the settled ones', R.open.length <= 4 && !R.open.some(id => SETTLED.includes(id) || id === 'fe-quote'), {open: R.open, later: R.later});
  check('the tab says Questions reviewed · 23 Oct 2026 and the handle names the settled questions', R.reviewed && R.handle === 8, {reviewed: R.reviewed, handle: R.handle});
  await p.waitForTimeout(1500);
  const pane = await p.evaluate(() => { const el = document.getElementById('pane-questions'); return {text: el.innerText, warn: /checks didn’t run|checks didn't run/.test(el.innerText), counts: (el.innerText.match(/(\d+)\s+NEED AN ANSWER[\s\S]*?(\d+)\s+PENDING \/ LATER[\s\S]*?(\d+)\s+ANSWERED OR HISTORY/) || []).slice(1).map(Number)}; });
  check('the pane shows no "checks didn’t run" warning, its counts match (need ≤ 4, answered ≥ 48) and it reads 23 Oct 2026', !pane.warn && pane.counts.length === 3 && pane.counts[0] <= 4 && pane.counts[2] >= 48 && /Questions reviewed · 23 Oct 2026/.test(pane.text), {warn: pane.warn, counts: pane.counts});
  await p.evaluate(() => { const el = document.querySelector('#pane-questions [data-answers754]'); if (el) el.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(600);
  await p.screenshot({path: path.join(out, 'questions_top_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1153.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
