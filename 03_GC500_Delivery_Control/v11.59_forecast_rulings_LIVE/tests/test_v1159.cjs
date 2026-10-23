/* Author: Andrew Fisher. v11.59 checks: the forecast on Andrew's six rulings of 23 Oct 2026 - Coates wages and salary in hours
   only (no "unpriced", no gap), the gaps that are not gaps gone, the damage waiver $0, ended fencing weeks out of the forecast,
   the Timeline tie-out tying, the receipted orders standing at their amount on every card, Alfie's nights at his own average,
   the two Questions settled. GET only; the record is compared before and after.
     PAGE=build/GC500_v11.59/GC500_Delivery_Control_hosted.html node tests/test_v1159.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 1400))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
const near = (a, b, e) => a != null && b != null && Math.abs(a - b) < (e || 0.011);
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#costs', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#costs', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(5000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.59'));
  const R = await p.evaluate(() => holdAssets(() => {
   const r2 = n => Math.round(n * 100) / 100, today = todayIso();
   const X = cj764Model(), W = X.wages || {}, P = pl770Model(), M = moneySummary(), fd = fenceDerived(), SP = fencePaidSplit(), O = fenceOrders1159(), T = recon888Model();
   /* the hours and dollars, worked out independently from the running sheet */
   let hoursOnly = 0, hire = 0, hireNoRate = 0; const hoursPeople = new Set();
   fin745Rows(today).forEach(r => { const paid = Number(r.paid) || 0; if (r.type === 'cna' || r.type === 'salary') { hoursOnly += paid; hoursPeople.add(r.person); return; } const cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost; if (cost == null) hireNoRate += paid; else hire += cost; });
   const S745 = fin745Summary();
   /* the fencing weeks still to come, from the plan */
   const sheetCost = fd.sheet_cost, adj = O.adjustment;
   const cat = (M.categories || []).find(c => c.key === 'fencing') || {};
   const green = greenBookTotals();
   const pos = poAll().filter(poFencing866), st = no => { const o = pos.find(x => String(x.number) === no); return o ? invoiceState1158(o, poWeeksOf(o)) : null; };
   const counts = invoiceCounts1158(pos);
   const rehire = (P.cost || []).find(c => c.key === 'rehire') || {}, waiver = (P.rev || []).find(c => c.key === 'waiver') || {}, instRec = (P.rec || []).find(c => c.name === 'Installation Recovery') || {};
   const Q = questionsList(), lb = Q.find(q => q.id === 'lb-rates') || null, alfie = Q.find(q => q.id === 'lb-nights-alfie-harris') || null;
   const pane = document.getElementById('pane-costs'); if (pane) pane.querySelectorAll('details').forEach(d => { d.open = true; }); const text = pane ? pane.innerText : '';
   const orphans = fin745Orphans().length;
   const chips = pane ? [...pane.querySelectorAll('#pl770 .chip.warn')].map(c => c.textContent.trim()) : [];
   const accRow = (X.rows || []).find(r => /^Accommodation/.test(r.stream)) || {};
   return {gaps: X.gaps.map(g => g.what), wages: W, hoursOnly: r2(hoursOnly), hoursPeople: [...hoursPeople], hire: r2(hire), hireNoRate: r2(hireNoRate), allowance: labourAllowance858(),
    fin: {unpricedHours: S745.unpricedHours, unpricedCount: S745.unpricedCount, hoursOnly: S745.hoursOnly, hoursOnlyCount: S745.hoursOnlyCount, complete: S745.complete, missing: S745.missingHoursCount, orphans, card: ((document.querySelector('#finance745 .fin745-metrics') || {}).innerText || '').replace(/\s+/g, ' ')},
    fencing: {behind: X.fencing.behind, weeks: X.fencing.weeks.map(w => ({week: w.week, past: w.past, cost: w.cost})), cost: X.fencing.cost, revenue: X.fencing.revenue},
    fd: {cost: fd.cost, sheet_cost: sheetCost, dockets: fd.dockets}, adj, orders: O.orders, words: O.words, split: {clean: SP.clean, gear: SP.gear, sheet_gear: SP.sheet_gear, lab: SP.docket_labour, paid: SP.paid, other: SP.other}, fencing_paid: M.cost.fencing_paid, catFencing: cat.amount, green: green.amount,
    checks: P.checks, rehireBasis: String(rehire.basis || ''), rehireNow: rehire.now, waiver: {now: waiver.now, job: waiver.job, basis: waiver.basis}, instRec: instRec.words,
    ties: T.ties.filter(t => !t.ok).map(t => ({what: t.what, parts: t.parts})), tieTl: T.ties.find(t => /Timeline and Transport/.test(t.what)),
    inv: {w6: st('4647508'), w5: st('4647509'), w4: st('4647517'), w3: st('4647515')}, counts,
    lb: lb && {st: lb.st, q: lb.q, why: lb.why}, alfie: alfie && {st: alfie.st, q: alfie.q, why: alfie.why}, accNote: accRow.note, accToCome: accRow.toCome,
    text, chips, labour865: (document.getElementById('labour865') || {}).innerText || ''};
  }));
  const G = R.gaps;
  check('the gaps that are not gaps are gone', !G.some(g => /work charges|CW1 fencing|programme\/docket differences|Event Portables — invoice|accommodation nights with no rate|labour hours with no wage rate|Coates salary — base salary/.test(g)), G);
  check('the gaps left are transport and the fencing demob by the hour', G.length <= 6 && G.every(g => /Transport|transport|demob movements|non-equipment schedule task|Fencing still to come — relocation and removal by the hour|fire extinguisher|race crew/.test(g)), G);
  check('Coates wages and salary are hours only on the model: ' + R.hoursOnly + ' h', R.wages.hoursOnly1159 === true && near(R.wages.hoursOnly, R.hoursOnly) && R.wages.unpricedHours === R.hireNoRate && R.hoursOnly > 1000 && R.wages.hoursOnlyPeople.length === R.hoursPeople.length, {wages: R.wages, hoursOnly: R.hoursOnly});
  check('the wages priced are the hired-in people plus the salary allowance', near(R.wages.job, R.hire + R.allowance) && near(R.wages.toDate + R.wages.toCome, R.wages.job), {job: R.wages.job, hire: R.hire, allowance: R.allowance});
  check('Month-end control counts no Coates hour as unpriced', R.fin.unpricedHours === R.hireNoRate && R.fin.hoursOnly > 1000 && R.fin.hoursOnlyCount > 100 && (R.fin.missing || 0) === 0 && R.fin.complete === (R.fin.orphans === 0) && /Coates wages and salary [\d,.]+ h in hours only/.test(R.fin.card) && !/unpriced/.test(R.fin.card), R.fin);
  check('ended fencing weeks are out of the forecast', Array.isArray(R.fencing.behind) && !R.fencing.behind.length && R.fencing.weeks.length && R.fencing.weeks.every(w => !w.past), R.fencing);
  check('the receipted orders stand at their amount: 4647508 and 4647509 adjusted, 4647517 not', (() => { const by = Object.fromEntries(R.orders.map(o => [o.number, o])); return by['4647508'] && by['4647508'].noSheet && by['4647508'].dockets === 6 && near(by['4647508'].amount, 8992) && by['4647508'].adjustment < 0 && by['4647509'] && !by['4647509'].noSheet && near(by['4647509'].sheet, 33670.5) && by['4647509'].adjustment < 0 && by['4647517'] && by['4647517'].adjustment === 0 && near(R.adj, by['4647508'].adjustment + by['4647509'].adjustment); })(), R.orders);
  check('the fencing cost is the sheet rates plus the receipted difference, on every card', near(R.fd.cost, R.fd.sheet_cost + R.adj) && near(R.fencing_paid, R.fd.cost) && near(R.catFencing, R.fd.cost + R.green) && R.split.clean === true && near(R.split.gear, R.split.sheet_gear + R.adj) && near(R.split.gear + R.split.lab, R.fd.cost), {fd: R.fd, adj: R.adj, split: R.split, fencing_paid: R.fencing_paid, catFencing: R.catFencing, green: R.green});
  check('the P&L still reconciles to the cent and its Rehire basis names the receipted orders', R.checks.costs === true && R.checks.costsJob === true && R.checks.revenue === true && R.checks.revenueJob === true && /receipted orders stand at their amount: 4647508/.test(R.rehireBasis) && /4647509/.test(R.rehireBasis), {checks: R.checks, basis: R.rehireBasis.slice(-500)});
  check('the damage waiver is $0, not unpriced', R.waiver.now === 0 && R.waiver.job === 0 && /unless the project manager says otherwise/.test(R.waiver.basis), R.waiver);
  check('every tie-out ties, the Timeline one on the references’ own loads', !R.ties.length && R.tieTl && R.tieTl.ok && /own loads/.test(R.tieTl.what), {bad: R.ties, tl: R.tieTl});
  check('the Purchase orders card: 4647508 receipted, the order stands, 6 dockets, no sheet', R.inv.w6 && R.inv.w6.state === 'receipted' && /6 dockets as recorded, no sheet — the order stands/.test(R.inv.w6.words) && /4918492/.test(R.inv.w6.words), R.inv.w6);
  check('the Purchase orders card: 4647509 receipted, the sheet 50 cents over, the order stands', R.inv.w5 && R.inv.w5.state === 'receipted' && /50 cents over the receipted order/.test(R.inv.w5.words) && /\$33,670\.00 stands/.test(R.inv.w5.words), R.inv.w5);
  check('the Purchase orders card: 4647517 matched to the cent with its receipt; 4647515 matched; the counts say so', R.inv.w4 && R.inv.w4.state === 'matched' && /receipt 4926209/.test(R.inv.w4.words) && R.inv.w3 && R.inv.w3.state === 'matched' && R.counts.receipted === 2 && R.counts.matched === 4, {w4: R.inv.w4, w3: R.inv.w3, counts: R.counts});
  check('Alfie’s nights are forecast at his own average and the line says so', /Alfie Harris: 20 nights at the person’s own average/.test(R.accNote || '') && R.accToCome > 4000, {note: R.accNote, toCome: R.accToCome});
  check('the Questions settle the wage rates and Alfie’s nights', R.lb && R.lb.st === 'done' && /hours only/.test(R.lb.q) && R.alfie && R.alfie.st === 'done' && /own average/.test(R.alfie.q) && /\$208\.72 a night/.test(R.alfie.why), {lb: R.lb, alfie: R.alfie});
  check('Installation Recovery speaks of hours only', /tracked in hours only/.test(R.instRec || ''), R.instRec);
  const bad = (R.text.match(/with no wage rate|with no pay rate|no pay rate yet|labour hours unpriced|hours unpriced|h unpriced|shifts? unpriced|still have no rate|hours still unpriced|hours without a calculated pay cost|need a rate typed|nights with no rate|salary — base salary/g) || []);
  check('the Costs tab no longer calls Coates hours or Alfie’s nights unpriced', !bad.length && !R.chips.some(c => /unpriced/.test(c)), {bad: bad.slice(0, 12), chips: R.chips});
  check('the Costs tab says hours only where the wages are', (R.text.match(/hours only/g) || []).length >= 4 && /Coates wages and salary/.test(R.labour865) && !/no pay rate/.test(R.labour865), {n: (R.text.match(/hours only/g) || []).length});
  /* the Fencing tab's card as rendered */
  await p.evaluate(() => go('fencing')); await p.waitForTimeout(2500);
  const F = await p.evaluate(() => holdAssets(() => { const card = document.querySelector('#pane-fencing [data-po-values1014]'); const head = card ? card.querySelector('.hubtitle .w').textContent : '';
   const rows = card ? [...card.querySelectorAll('.tblwrap > table > tbody > tr')].map(tr => { const tds = [...tr.children].filter(e => e.tagName === 'TD'); const po = ((tds[0] && tds[0].querySelector('b.mono')) || {}).textContent || ''; const inv = tds[3] && tds[3].querySelector('.inv1158'); return {po: po.replace(/\D/g, ''), state: inv ? [...inv.classList].find(c => /^inv1158-/.test(c)) : null, words: inv ? inv.textContent.trim() : ''}; }) : [];
   return {head, rows, note: card ? card.querySelector('p.norate').textContent : ''}; }));
  const w6 = F.rows.find(r => r.po.startsWith('4647508')) || {}, w5 = F.rows.find(r => r.po.startsWith('4647509')) || {};
  check('the Purchase orders card renders the receipted state and the header counts it', /2 receipted — the order stands/.test(F.head) && w6.state === 'inv1158-receipted' && /the order stands/.test(w6.words) && w5.state === 'inv1158-receipted' && /A receipted order stands at its amount/.test(F.note), {head: F.head, w6, w5, pos: F.rows.map(r => r.po + ':' + r.state)});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('the record is untouched', before === after && h.counts.blocked === 0, {blocked: h.counts.blocked});
  check('no page errors', !h.errors.length, h.errors);
  await p.evaluate(() => go('costs')); await p.waitForTimeout(1500);
  await p.screenshot({path: path.join(out, `v1159_${tag}.png`), fullPage: false});
  fs.writeFileSync(path.join(out, `test_v1159_${tag}.json`), JSON.stringify({when: new Date().toISOString(), live, MOB, failed, results, facts: {gaps: R.gaps, wages: R.wages, fd: R.fd, adj: R.adj, orders: R.orders, split: R.split, counts: R.counts}}, null, 1));
  console.log(`\n${results.length - failed}/${results.length} checks pass (${tag})`);
 } finally { await h.browser.close(); }
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
