const {open} = require('/tmp/claude-0/stage18/lh18au');
const MOB = !!process.env.MOB, O = '/tmp/claude-0/stage11/walk_' + (MOB ? 'm_' : '');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#day/2026-09-29', W: MOB ? 390 : 1440, H: MOB ? 844 : 1000, dpr: MOB ? 2 : 1, mobile: MOB, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.waitForFunction(() => document.querySelector('#pane-timeline .dplate') && typeof chOpen === 'function', null, {timeout: 150000}); await p.waitForTimeout(4000);
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.save = () => {}; SYNC.readonly = false; document.body.classList.remove('viewonly'); S.operator = 'Andrew Fisher'; const w = document.getElementById('who'); if (w) w.value = 'Andrew Fisher'; });
 await p.evaluate(() => chOpen('2026-09-29')); await p.waitForTimeout(1500);
 const R = {};
 await p.click('#pane-change [data-walkjump]'); await p.waitForTimeout(900);
 R.first = await p.evaluate(() => ({order: WALK.order.slice(0, 8), n: WALK.order.length, head: document.querySelector('#walkCard .sub').innerText}));
 const card = async n => { const c = await p.$('#walkCard'); await c.screenshot({path: O + n + '.png'}); };
 await p.evaluate(() => document.querySelector('#walkCard').scrollIntoView()); await p.waitForTimeout(300); await card('0_start');
 const k0 = R.first.order[0];
 /* Enter at the first location, twice */
 await p.fill(`[data-wkno="${k0}"]`, 'ep40001'); await p.press(`[data-wkno="${k0}"]`, 'Enter'); await p.waitForTimeout(900);
 R.focus1 = await p.evaluate(() => (document.activeElement || {}).dataset ? document.activeElement.dataset.wkno : null);
 await p.keyboard.type('EP40002'); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
 R.focus2 = await p.evaluate(() => document.activeElement.dataset.wkno || null);
 /* the same number again is refused */
 await p.keyboard.type('EP40002'); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
 R.dupe = await p.evaluate(() => (document.querySelector('#flash, .flash, [role="alert"]') || {}).textContent || '');
 await p.evaluate(() => { document.activeElement.value = ''; });
 R.k0 = await p.evaluate(k => ({subs: subOf(k).map(x => [x.co, x.no]), c: locNums(assetOf(k))}), k0);
 /* no number */
 const k1 = await p.evaluate(k => WALK.order.find(x => x !== k), k0); await p.click(`[data-wknone="${k1}"]`); await p.waitForTimeout(800);
 R.k1 = await p.evaluate(k => subOf(k).map(x => [x.co, x.no]), k1);
 /* search */
 await p.fill('#wkFind', 'WC11'); await p.waitForTimeout(900);
 R.find = await p.evaluate(() => WALK.order);
 await p.fill('#wkFind', ''); await p.waitForTimeout(900);
 /* Coates */
 await p.fill('#wkCo', 'Coates'); await p.dispatchEvent('#wkCo', 'change'); await p.waitForTimeout(800);
 const k2 = await p.evaluate(() => WALK.order[2]);
 await p.fill(`[data-wkno="${k2}"]`, '1299995'); await p.press(`[data-wkno="${k2}"]`, 'Enter'); await p.waitForTimeout(900);
 R.k2 = await p.evaluate(k => invCoatesNums(assetOf(k)), k2);
 await p.evaluate(() => document.querySelector('#walkCard').scrollIntoView()); await p.waitForTimeout(300); await card('1_after');
 /* WC01: one accessible toilet did not turn up */
 await p.evaluate(() => chChoose('WC01')); await p.waitForTimeout(900);
 await p.fill('#pane-change [data-chgot="Accessible Toilet"]', '0'); await p.dispatchEvent('#pane-change [data-chgot="Accessible Toilet"]', 'change'); await p.waitForTimeout(900);
 await p.fill('#pane-change [data-chgot="FWF"]', '2'); await p.dispatchEvent('#pane-change [data-chgot="FWF"]', 'change'); await p.waitForTimeout(900);
 R.wc01 = await p.evaluate(() => ({short: shortWords(assetOf('WC01')), said: (CHG.said || {}).text, done: doneChip(assetOf('WC01')), q: (questionsList().find(x => x.id === 'sp-short') || {}).rows,
   inv: (inventory().list.find(r => r.type === 'Toilets & amenities|Accessible Toilet') || {}).on, ld: ldTicks(assetOf('WC01'))}));
 await p.evaluate(() => document.querySelector('#pane-change .chgot').scrollIntoView({block: 'center'})); await p.waitForTimeout(300);
 const f = await p.$('#pane-change .chside .card'); await f.screenshot({path: O + '2_wc01_form.png'});
 R.hscroll = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
 R.errs = errs; console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
