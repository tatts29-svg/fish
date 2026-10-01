// v7.70 practice tests - the Forecast P&L in the business's lines. GETs only; every write the page tries is aborted.
//   PAGE=../../build/GC500_v7.70/GC500_Delivery_Control_hosted.html [MOB=1] node practice_tests.js
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page; const T = []; const ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: detail == null ? '' : String(detail)});
  await p.waitForFunction(() => typeof go === 'function' && typeof pl770Model === 'function', null, {timeout: 150000});
  await p.evaluate(() => go('costs')); await p.waitForTimeout(2500);
  const R = await p.evaluate(() => {
    const r2 = v => Math.round(v * 100) / 100, n = v => Number(v) || 0;
    const M = moneySummary(), c = M.charge, k = M.cost, X = cj764Model(), RH = rh766Model(), sv = servicing748(), P = pl770Model();
    const Q = DATA.rehire_quotes.quotes; const qt = id => { const q = Q.find(x => x.quote === id); return q ? r2(n(q.sub_total) + n(q.delivery_charge) + n(q.pickup)) : null; };
    const L = (arr, key) => arr.find(x => x.key === key) || {};
    const sec = document.getElementById('pl770'); const txt = sec ? sec.innerText : '';
    const rehireLines = r2(RH.groups.filter(g => !/^Fencing/.test(g.what)).reduce((a, g) => a + n(g.rev), 0) - n(c.servicing));
    const water = sv.at_cost, wp = r2(water.filter(l => /truck|pre ?-?fill/i.test(l.description)).reduce((a, l) => a + l.amount, 0)), wc = r2(water.filter(l => !/truck|pre ?-?fill/i.test(l.description)).reduce((a, l) => a + l.amount, 0));
    const pl752 = document.getElementById('pl752'); const plRevText = pl752 ? (pl752.querySelector('.pl-kpi b') || {}).textContent : null;
    const glance = document.querySelector('.cj765-flow'); const jump = glance ? glance.querySelector('[data-jump765="pl770"]') : null;
    const vw = document.documentElement.clientWidth;
    return {P, c: {total: c.total, contracts: c.contracts, delivery: c.delivery, labour: c.labour, race: c.race.amount, fencing: c.fencing, servicing: c.servicing, other: c.other}, k: {known: k.known, rehire: k.rehire, transport: k.transport.amount}, X: {job: X.job, revenueJob: X.revenue.job, wagesJob: X.wages.job, toCome: X.toCome}, difference0: M.difference0,
      rehireLines, wp, wc, svTotal: sv.total, svCard: sv.card_total, q6844: qt('Q6844'), q6846: qt('Q6846'), q6845: qt('Q6845'), q6847: qt('Q6847'),
      has: !!sec, txt, plRevText, jump: !!jump, jumpText: jump ? jump.textContent : null, rows: sec ? sec.querySelectorAll('tbody tr').length : 0, recRows: P.rec.length,
      secW: sec ? sec.getBoundingClientRect().width : 0, vw, secScroll: sec ? sec.scrollWidth : 0, bodyScroll: document.documentElement.scrollWidth,
      L: {hire: L(P.rev, 'hire'), rehire: L(P.rev, 'rehire'), transport: L(P.rev, 'transport'), pump: L(P.rev, 'pump'), cons: L(P.rev, 'cons'), install: L(P.rev, 'install'), waiver: L(P.rev, 'waiver'), cRehire: L(P.cost, 'rehire'), cPump: L(P.cost, 'pump'), cCons: L(P.cost, 'cons'), cTransport: L(P.cost, 'transport'), cInstall: L(P.cost, 'install')}};
  });
  const near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.015, P = R.P, L = R.L;
  ok('the card is on the Costs tab', R.has, `rows ${R.rows}`);
  ok('revenue lines add to the Forecast P&L revenue, to the cent', P.checks.revenue && near(P.revNow, R.c.total), `${P.revNow} vs ${R.c.total}`);
  ok('revenue to job end is the Costs to job end card figure', P.checks.revenueJob && near(P.revJob, R.X.revenueJob), `${P.revJob} vs ${R.X.revenueJob}`);
  ok('cost lines plus the below-the-line costs add to direct costs known, to the cent', P.checks.costs && near(P.costNow, R.k.known), `${P.costNow} vs ${R.k.known}`);
  ok('costs to job end are the Costs to job end card figure', P.checks.costsJob && near(P.costJob, R.X.job), `${P.costJob} vs ${R.X.job}`);
  ok('the four quotes split by kitty add to the rehire figure', P.checks.quotes && near(P.qk.pump + P.qk.cons + P.qk.rehire, R.k.rehire), JSON.stringify(P.qk));
  ok('Toilet Pumpout Costs is Q6844 whole; Consumables is Q6846 whole; Rehire is Q6845 and Q6847', near(P.qk.pump, R.q6844) && near(P.qk.cons, R.q6846) && near(P.qk.rehire, R.q6845 + R.q6847), `${P.qk.pump}/${R.q6844} ${P.qk.cons}/${R.q6846} ${P.qk.rehire}/${R.q6845 + R.q6847}`);
  ok('Hire Revenue is the contracts less the delivery lines and the hired-in lines', near(L.hire.now, R.c.contracts - R.c.delivery - R.rehireLines), `${L.hire.now}`);
  ok('Rehire Revenue is the hired-in lines plus the fencing dockets', near(L.rehire.now, R.rehireLines + R.c.fencing), `${L.rehire.now}`);
  ok('Transport Revenue is the delivery lines', near(L.transport.now, R.c.delivery), `${L.transport.now}`);
  ok('Toilet Pumpouts and Consumables together are the servicing line; the water truck and pre-fill sit with the pump-outs', near(L.pump.now + L.cons.now, R.svTotal) && near(L.pump.now, R.svCard + R.wp) && near(L.cons.now, R.wc), `${L.pump.now} + ${L.cons.now} vs ${R.svTotal}`);
  ok('Installation is the labour ticked plus the event labour scope', near(L.install.now, R.c.labour + R.c.race), `${L.install.now}`);
  ok('Damage Waiver carries no figure and says the branch sets the rate', L.waiver.now == null && /branch/.test(L.waiver.basis || ''), L.waiver.basis);
  /* the P&L's difference0 is kept to the dollar; the card's is to the cent */
  ok('Difference so far is the Forecast P&L figure (to the dollar)', Math.abs(P.diff.now - R.difference0) < 0.51, `${P.diff.now} vs ${R.difference0}`);
  ok('Difference to job end is the At a glance figure after priced wages', near(P.diff.job, R.X.revenueJob - R.X.job - R.X.wagesJob), `${P.diff.job} vs ${R.X.revenueJob - R.X.job - R.X.wagesJob}`);
  ok('Gross margin is revenue less the ledger lines, with a percentage', near(P.gm.now, P.revNow - P.direct) && P.gm.pcNow > 0 && P.gm.pcNow < 1, `${P.gm.now} ${Math.round(P.gm.pcNow * 100)}%`);
  const tRec = P.rec.find(r => r.name === 'Transport Recovery'), iRec = P.rec.find(r => r.name === 'Installation Recovery'), cRec = P.rec.find(r => r.name === 'Consumables Recovery');
  ok('Transport Recovery groups the pump-outs with cartage and names cartage alone in words', tRec && near(tRec.now, (L.transport.now + L.pump.now) / (L.cTransport.now + L.cPump.now)) && /cartage alone/.test(tRec.words), tRec && tRec.words);
  ok('Installation Recovery is not readable yet and says why', iRec && iRec.now == null && /not readable yet/.test(iRec.words), iRec && iRec.words);
  ok('Consumables Recovery says what is not charged on when under one', cRec && (cRec.now >= 1 || /not charged on yet/.test(cRec.words)), cRec && `${cRec.now} ${cRec.words}`);
  ok('four recovery rows', R.recRows === 4, R.recRows);
  ok('no NaN, undefined, null or template leftovers in the card text', !/NaN|undefined|\bnull\b|\$\{|\[object/.test(R.txt), R.txt.slice(0, 80));
  ok('nothing from another year on the card', !/\b2025\b|\b2024\b|last year/i.test(R.txt), '');
  ok('the P&L codes read on the card', ['1005', '1010', '1030', '1032', '1020', '1047', '1015', '2126', '3325', '2144', '2120', '2140', '2142', '2357'].every(code => R.txt.includes(code)), '');
  ok('the card bridges to the Rehire by branch card and never calls the difference a margin', /Rehire by branch card/.test(R.txt) && !/Gross margin —/.test(R.txt) && /not a margin yet/.test(R.txt), '');
  ok('the direct costs tile is the Costs to job end figure', near(P.costJob, R.X.job) && R.txt.includes(String(Math.round(P.costJob)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')), `${P.costJob}`);
  ok('the At a glance flow links to the card', R.jump && /business/.test(R.jumpText || ''), R.jumpText);
  ok('the Forecast P&L revenue tile is unchanged by the card', R.plRevText != null && R.plRevText.replace(/[^0-9]/g, '') === String(Math.round(R.c.total)).replace(/[^0-9]/g, ''), `${R.plRevText} vs ${R.c.total}`);
  ok('the card does not widen the page', R.bodyScroll <= R.vw + 1 && R.secW <= R.vw + 1, `section ${Math.round(R.secW)} of ${R.vw}; page ${R.bodyScroll}`);
  ok('no page errors, no console errors', s.errors.length === 0 && (s.console || []).length === 0, `${s.errors.length} / ${(s.console || []).length}`);
  const passed = T.filter(t => t.pass).length;
  const out = {page: process.env.PAGE, mobile: MOB, passed, of: T.length, tests: T, figures: {revNow: P.revNow, revJob: P.revJob, direct: P.direct, directJob: P.directJob, over: P.over, overJob: P.overJob, costNow: P.costNow, costJob: P.costJob, gm: P.gm, diff: P.diff, qk: P.qk, rec: P.rec.map(r => ({name: r.name, now: r.now, job: r.job}))}};
  fs.writeFileSync(`${__dirname}/practice_results${MOB ? '_phone' : ''}.json`, JSON.stringify(out, null, 1));
  console.log(`${passed}/${T.length} ${MOB ? 'phone' : 'desktop'}`); T.filter(t => !t.pass).forEach(t => console.log('  FAIL', t.name, '—', t.detail));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
