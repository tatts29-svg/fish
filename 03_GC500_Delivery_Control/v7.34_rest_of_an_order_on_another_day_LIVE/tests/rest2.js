const {open} = require('/tmp/claude-0/stage18/lh18au');
const O = '/tmp/claude-0/stage11/rest_m_';
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#day/2026-09-28', W: 390, H: 844, dpr: 2, mobile: true, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.waitForFunction(() => document.querySelector('#pane-timeline .dplate') && typeof bookRest === 'function', null, {timeout: 150000}); await p.waitForTimeout(4000);
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.save = () => {}; SYNC.readonly = false; document.body.classList.remove('viewonly'); S.operator = 'Andrew Fisher'; const w = document.getElementById('who'); if (w) w.value = 'Andrew Fisher'; });
 const money = () => p.evaluate(() => { RENDER_MEMO.clear && RENDER_MEMO.clear(); const M = moneySummary(); const P = labourPlan(); return {charge: M.charge.total, card_hire: M.charge.card_hire, card_tr: M.charge.card_transport, tr_cost: M.cost.transport.card_cost, plan: [P.all.charged, P.all.expected, P.all.tocome, P.all.later].map(x => Math.round(x * 100) / 100)}; });
 const R = {}; R.m0 = await money();
 await p.evaluate(() => chOpen('2026-09-28')); await p.waitForTimeout(1200); await p.evaluate(() => chChoose('WC01')); await p.waitForTimeout(900);
 await p.fill('#pane-change [data-chgot="Accessible Toilet"]', '0'); await p.dispatchEvent('#pane-change [data-chgot="Accessible Toilet"]', 'change'); await p.waitForTimeout(800);
 await p.fill('#pane-change [data-chgot="FWF"]', '2'); await p.dispatchEvent('#pane-change [data-chgot="FWF"]', 'change'); await p.waitForTimeout(800);
 R.m1 = await money();
 R.restRow = await p.evaluate(() => { const r = document.querySelector('#pane-change .chrestr'); return r ? r.innerText.replace(/\s+/g, ' ') : null; });
 R.defaultDay = await p.evaluate(() => (document.querySelector('[data-chrestday="Accessible Toilet"]') || {}).value);
 await p.click('#pane-change [data-chrest="Accessible Toilet"]'); await p.waitForTimeout(1200);
 R.m2 = await money();
 R.after = await p.evaluate(() => { const r = assetOf('WC01-R1'); return {exists: !!r, rec: (S.added || []).find(x => x.key === 'WC01-R1'), short: shortWords(assetOf('WC01')), said: (CHG.said || {}).text, onDay: (calendarDays().find(d => d.iso === '2026-10-01' || d.iso === '2026-09-30') || {}).iso,
   days: calendarDays().filter(d => d.deliveries.some(x => x.a.key === 'WC01-R1')).map(d => d.iso), nav: navPointFor(r), lines: chargeLines(r).length, total: assetTotal(r).total, walk: locNums(r), inInv: !!inventory().list.find(x => x.refs && x.refs['WC01-R1'])}; });
 await p.evaluate(() => document.querySelector('#pane-change .chgot').scrollIntoView({block: 'center'})); await p.waitForTimeout(300); await p.screenshot({path: O + '1_wc01_booked.png'});
 /* the follow-up's own form */
 await p.evaluate(() => fixRef('WC01-R1')); await p.waitForTimeout(1500);
 R.rform = await p.evaluate(() => ({key: CHG.key, day: CHG.day, notice: (document.querySelector('#pane-change .chrestn') || {}).innerText}));
 await p.screenshot({path: O + '2_r1_form.png'});
 /* it arrives */
 R.lightStates = await p.evaluate(() => Object.keys(LIGHT));
 await p.evaluate(() => { setLight('WC01-R1', 'on site'); });
 await p.waitForTimeout(900);
 R.arrived = await p.evaluate(() => ({state: deliveryOf('WC01-R1').state, short: shortWords(assetOf('WC01')), none: noneArrived(assetOf('WC01'), 'Accessible Toilet'), acc: (inventory().list.find(r => r.type === 'Toilets & amenities|Accessible Toilet') || {}).on, labs: (() => { openAsset('WC01'); return [...document.querySelectorAll('#drawer input[data-lab]')].map(i => i.dataset.lab).filter(x => /install/.test(x)); })(), q: (questionsList().find(x => x.id === 'sp-short') || {}).rows}));
 R.m3 = await money();
 await p.evaluate(() => { const c = document.querySelector('#drawer .close, #drawer #dclose'); if (c) c.click(); location.hash = '#print/drivers/2026-09-30'; }); await p.waitForTimeout(9000);
 R.print = await p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('WC01-R1'); return {has: i >= 0, around: i >= 0 ? t.slice(Math.max(0, i - 80), i + 220).replace(/\s+/g, ' ') : null, hash: location.hash}; });
 await p.screenshot({path: O + '3_print.png'});
 R.errs = errs; console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
