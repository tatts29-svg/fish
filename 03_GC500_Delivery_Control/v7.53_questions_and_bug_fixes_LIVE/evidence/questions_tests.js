// Author: Andrew Fisher. GET-only Questions regression practice; no saves and no live writes.
// PAGE=/absolute/path/page.html CHROMIUM_PATH=/usr/bin/chromium node questions_tests.js
const fs = require('fs');
const path = require('path');
const {open} = require(path.resolve(__dirname, '../../toolchain/harness/open_page'));
const pageFile = process.env.PAGE || path.resolve(__dirname, '../../build/GC500_v7.53/GC500_Delivery_Control_hosted.html');
const outDir = process.env.OUT || __dirname;
fs.mkdirSync(outDir, {recursive: true});

(async () => {
 const reports = [];
 for (const mobile of [false, true]) {
  const h = await open({pageFile, hash: '#questions', mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: 1});
  try {
   await h.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 90000});
   await h.page.waitForTimeout(1200);
   const result = await h.page.evaluate(() => {
    const checks = [], ok = (name, truth, details) => { checks.push({name, pass: !!truth, ...(truth ? {} : {details})}); };
    const original = JSON.stringify(S), histOriginal = JSON.stringify(QHIST);
    const q = questionsList(), byId = id => q.find(x => x.id === id), nvac = byId('br-norate-NVAC');
    ok('all Questions checks ran', !(q.fails || []).length, q.fails);
    ok('question IDs are unique', new Set(q.map(x => x.id)).size === q.length);
    const covered = byId('card-covered753');
    ok('31 supported contract lines are answered estimates', covered && covered.st === QH_DONE && covered.rows.length === 31, covered && covered.rows.length);
    ok('two unknown accessory rates remain pending', nvac && nvac.st === QH_LATER && nvac.rows.length === 2 && nvac.rows.some(r => /line 29/.test(r)) && nvac.rows.some(r => /line 37/.test(r)));
    ok('remaining rates open Costs', nvac && nvac.go === 'costs');
    ok('generator and event-window decisions are answered', byId('generator-card-rule753').st === QH_DONE && byId('charge-window753').st === QH_DONE);
    ok('MEAD answer shows one whole hire', /\$1,483\.20/.test(byId('mead-day-rate753').why) && /\$185\.40/.test(byId('mead-day-rate753').why));
    ok('servicing answer uses current calculator', byId('servicing-card753').why.includes(money(servicing748().total)));
    const water = byId('water-service-rate753');
    ok('four unknown water-service rates remain open', water && water.st === QH_OPEN && water.rows.length === 4 && /Supplier cost is not/.test(water.why));
    const ccb = byId('ccb-classification753');
    ok('two provisional CCB classifications remain open', ccb && ccb.st === QH_OPEN && ccb.rows.length === 2 && ccb.rows.some(r => /202.5 m/.test(r)) && ccb.rows.some(r => /447.5 m/.test(r)));
    ok('fencing gap describes recorded demarcation', byId('fe-gap').why.includes('800 m as demarcation') && !byId('fe-gap').why.includes('none as demarcation'));
    ok('missing asset number is not a missing delivery', byId('sp-nums') && /does not prove a missing delivery/.test(byId('sp-nums').why) && !/unit is not there/.test(byId('sp-nums').need));
    ok('included waste-tank hire does not waive labour', /does not remove separately recorded install or levelling/.test(byId('br-norate-KINP').why));
    const hist = questionHistory753();
    ok('GN20 historical answer includes current site record', hist.find(h => h[0] === 'R04')[3].includes('Current delivery record: GN20 is marked on site'));
    ok('GN23 historical answer includes current site record', hist.find(h => h[0] === 'R05')[3].includes('Current delivery record: GN23 is marked on site'));
    ok('current tower question distinguishes drawn positions from allocation', /already mapped/.test(byId('oi-R27').why) && /allocation/.test(byId('oi-R27').need));
    ok('unsettled BOQ and drawing revision stay open', byId('oi-R06').st === QH_OPEN && byId('oi-R23').st === QH_OPEN);
    const labour = byId('lb-rates'), finance = fin745Summary(null, todayIso());
    ok('labour question follows the current partial outlook', labour.go === 'costs' && labour.why.includes(money(finance.expectedCost)) && labour.why.includes(`${finance.rows.length - finance.unpricedCount} of ${finance.rows.length} shifts`) && !labour.why.includes('no wage is put on anyone'));
    try {
     S.answers['br-norate-NVAC'] = 'Practice note retained with the same question';
     S.answers['card-covered753'] = 'Practice note for already covered card lines';
     S.by['answers/br-norate-NVAC'] = 'Andrew Fisher';
     S.stamps['answers/br-norate-NVAC'] = '2026-10-01T00:00:00.000Z';
     const pendingNotes = questionsList().find(x => x.id === 'br-norate-NVAC');
     ok('pending question retains its note key', qAnswer(pendingNotes.noteId || pendingNotes.id) === S.answers['br-norate-NVAC']);
     ONHIRE_ROWS.filter(r => r.branch_code === 'NVAC' && !r.charge_line && !r.subhired && typeof r.rate_1 !== 'number' && !lr748Decided(r) && !lr748For(r)).forEach(r => S.lineRates[lr748Key(r)] = '42');
     RENDER_MEMO.clear();
     const allPriced = questionsList();
     ok('pricing both accessories resolves the unanswered branch question', !allPriced.some(x => x.id === 'br-norate-NVAC' && x.st !== QH_DONE));
     const answered = allPriced.find(x => x.id === 'card-covered753');
     ok('all 33 lines are now accounted for', answered.rows.length === 33, answered.rows.length);
     const resolved = allPriced.find(x => x.id === 'br-norate-NVAC');
     ok('resolved branch note remains accessible in Answered', resolved && resolved.st === QH_DONE && qAnswer(resolved.noteId || resolved.id) === 'Practice note retained with the same question');
     ok('card estimate note keeps its separate stable ID', qAnswer(answered.noteId || answered.id) === 'Practice note for already covered card lines');
     renderQuestions();
     const note = document.querySelector('[data-question-id="br-norate-NVAC"] .qansv'), cardNote = document.querySelector('[data-question-id="card-covered753"] .qansv');
     ok('both retained notes are actually rendered', note && note.textContent.includes('Practice note retained') && cardNote && cardNote.textContent.includes('Practice note for already covered'));
     const first = ONHIRE_ROWS.find(r => r.branch_code === 'NVAC' && lr748For(r) && lr748For(r).from === 'card');
     S.lineRates[lr748Key(first)] = '100';
     const service = servicing748().lines[0];
     S.lineRates[service.key] = '1';
     RENDER_MEMO.clear();
     const changed = questionsList();
     ok('answered estimates follow an entered hire rate', changed.find(x => x.id === 'card-covered753').rows.some(r => r.startsWith(first.rental_contract + ', line ' + first.line + ' ·') && r.includes('entered rate') && r.includes(money(contractCharge(first).amount))));
     ok('servicing answer follows an entered servicing rate', changed.find(x => x.id === 'servicing-card753').why.includes(money(servicing748().total)));
    } finally {
     S = JSON.parse(original);
     RENDER_MEMO.clear();
     renderQuestions();
    }
    ok('shared record restored byte for byte after practice', JSON.stringify(S) === original);
    ok('original historical questions are never mutated', JSON.stringify(QHIST) === histOriginal);
    return {checks, questionCounts: {open: q.filter(x => x.st === QH_OPEN).length, later: q.filter(x => x.st === QH_LATER).length, answered: q.filter(x => x.st === QH_DONE).length + hist.filter(h => h[1] === QH_DONE).length}};
   });
   if (mobile) {
    // renderQuestions replaces the pane children, restarting the existing staggered arrival animation.
    // Wait for the visible cards to finish revealing before recording the screen.
    await h.page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    await h.page.waitForFunction(() => [...document.querySelectorAll('#pane-questions > .notice, #pane-questions > .card')]
     .filter(e => e.getBoundingClientRect().top < innerHeight)
     .every(e => getComputedStyle(e).opacity === '1'), null, {timeout: 5000});
    await h.page.waitForTimeout(250);
    const overview = await h.page.locator('#pane-questions > .card').first().evaluate(e => ({opacity: getComputedStyle(e).opacity, top: e.getBoundingClientRect().top, height: e.getBoundingClientRect().height}));
    result.checks.push({name: 'phone overview card is visible after the arrival animation', pass: overview.opacity === '1' && overview.top < 844 && overview.height > 0, details: overview});
    await h.page.screenshot({path: path.join(outDir, 'questions_phone_overview.png')});
    await h.page.locator('.qfold').filter({hasText: 'Pending confirmation / later'}).first().evaluate(e => e.open = true);
    await h.page.locator('[data-question-id="br-norate-NVAC"]').scrollIntoViewIfNeeded();
    await h.page.screenshot({path: path.join(outDir, 'questions_phone_remaining_rates.png')});
   }
   result.checks.push({name: 'no page errors', pass: h.errors.length === 0, details: h.errors});
   result.checks.push({name: 'no attempted live writes', pass: h.counts.blocked === 0, details: h.counts});
   reports.push({mobile, ...result});
  } finally { await h.browser.close(); }
 }
 fs.writeFileSync(path.join(outDir, 'questions_results.json'), JSON.stringify(reports, null, 2));
 const failed = reports.flatMap(r => r.checks.filter(c => !c.pass).map(c => ({mobile: r.mobile, ...c})));
 console.log(JSON.stringify({checks: reports.reduce((n, r) => n + r.checks.length, 0), failed, counts: reports.map(r => ({mobile: r.mobile, ...r.questionCounts}))}, null, 2));
 if (failed.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
