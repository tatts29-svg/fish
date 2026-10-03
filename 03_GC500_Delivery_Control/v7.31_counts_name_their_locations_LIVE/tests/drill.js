const {open} = require('/tmp/claude-0/stage18/lh18au');
const MOB = !!process.env.MOB, O = '/tmp/claude-0/stage11/drill_' + (MOB ? 'm_' : '');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#day/2026-09-29', W: MOB ? 390 : 1440, H: MOB ? 844 : 1000, dpr: MOB ? 2 : 1, mobile: MOB, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.waitForFunction(() => document.querySelector('#pane-timeline .dplate') && typeof chOpen === 'function', null, {timeout: 150000}); await p.waitForTimeout(4000);
 const R = {};
 await p.evaluate(() => chOpen('2026-09-29')); await p.waitForTimeout(1500);
 await p.click('#pane-change [data-invjump]'); await p.waitForTimeout(800);
 await p.click(`[data-invdrill="Toilets & amenities|FWF|nonum"]`); await p.waitForTimeout(900);
 R.nonum = await p.evaluate(() => ({head: document.querySelector('#invDrill b').textContent, refs: [...document.querySelectorAll('#invDrill [data-fixref]')].map(b => b.innerText.replace(/\s+/g, ' ').trim()).slice(0, 12)}));
 const d = await p.$('#invDrill'); await d.screenshot({path: O + '1_nonum.png'});
 await p.click(`[data-invdrill="Toilets & amenities|FWF|togo"]`); await p.waitForTimeout(900);
 R.togo = await p.evaluate(() => ({head: document.querySelector('#invDrill b').textContent, refs: [...document.querySelectorAll('#invDrill [data-fixref]')].map(b => b.innerText.replace(/\s+/g, ' ').trim()).slice(0, 8)}));
 /* open one: WC41 if listed */
 await p.click(`[data-invdrill="Toilets & amenities|FWF|nonum"]`); await p.waitForTimeout(700);
 const k = await p.evaluate(() => { const b = [...document.querySelectorAll('#invDrill [data-fixref]')].find(x => x.dataset.fixref === 'WC41') || document.querySelector('#invDrill [data-fixref]'); return b.dataset.fixref; });
 await p.click(`#invDrill [data-fixref="${k}"]`); await p.waitForTimeout(1500);
 R.opened = await p.evaluate(() => ({key: CHG.key, day: CHG.day, tab: state.tab, formTop: Math.round(document.querySelector('#pane-change .chside .card').getBoundingClientRect().top), head: (document.querySelector('#pane-change .chhead b') || {}).textContent}));
 await p.screenshot({path: O + '2_opened.png'});
 /* Questions */
 await p.evaluate(() => go('questions')); await p.waitForTimeout(1500);
 R.qrefs = await p.evaluate(() => [...document.querySelectorAll('#pane-questions .qref')].map(b => b.dataset.fixref).slice(0, 10));
 const qk = R.qrefs[0]; await p.evaluate(k => document.querySelector(`#pane-questions .qref[data-fixref="${k}"]`).scrollIntoView({block: 'center'}), qk); await p.waitForTimeout(300);
 await p.click(`#pane-questions .qref[data-fixref="${qk}"]`); await p.waitForTimeout(1500);
 R.fromQ = await p.evaluate(() => ({key: CHG.key, tab: state.tab}));
 R.hscroll = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
 R.errs = errs; console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
