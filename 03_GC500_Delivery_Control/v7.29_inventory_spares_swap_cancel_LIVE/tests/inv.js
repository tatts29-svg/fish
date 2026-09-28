const {open} = require('/tmp/claude-0/stage18/lh18au'); const fs = require('fs');
const O = '/tmp/claude-0/stage11/inv_' + (process.env.MOB ? 'm_' : '');
const MOB = !!process.env.MOB;
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#day/2026-09-28', W: MOB ? 390 : 1440, H: MOB ? 844 : 1000, dpr: MOB ? 2 : 1, mobile: MOB, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push('console: ' + m.text()); });
 await p.waitForFunction(() => document.querySelector('#pane-timeline .dplate') && typeof chOpen === 'function', null, {timeout: 150000}); await p.waitForTimeout(4000);
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.save = () => {}; SYNC.readonly = false; document.body.classList.remove('viewonly'); S.operator = 'Andrew Fisher'; const w = document.getElementById('who'); if (w) w.value = 'Andrew Fisher'; });
 const t0 = Date.now(); await p.evaluate(() => chOpen('2026-09-28')); await p.waitForTimeout(1500); const tOpen = Date.now() - t0;
 const perf = await p.evaluate(() => { const a = performance.now(); inventory(); const b = performance.now(); invHtml(false); return {inv: Math.round(b - a), html: Math.round(performance.now() - b)}; });
 const R = {perf, tOpen};
 const fwf = () => p.evaluate(() => { const I = inventory(), r = I.list.find(x => x.type === 'Toilets & amenities|FWF'); return {row: r, cos: I.cos, spares: I.spares.length}; });
 R.base = await fwf();
 const card = async n => { await p.evaluate(() => document.querySelector('#invCard').scrollIntoView({block: 'start'})); await p.waitForTimeout(400); const c = await p.$('#invCard'); await c.screenshot({path: O + n + '.png'}); };
 await card('0_card');
 /* two spares, the way a person types them */
 await p.selectOption('#spType', 'Toilets & amenities|FWF'); await p.fill('#spCo', 'Coates'); await p.fill('#spNo', '1299991'); await p.fill('#spNote', 'Coates compound'); await p.click('#spAdd'); await p.waitForTimeout(800);
 await p.selectOption('#spType', 'Toilets & amenities|FWF'); await p.fill('#spCo', 'Event Portables'); await p.fill('#spNo', 'EP20001'); await p.fill('#spNote', 'Coates compound'); await p.click('#spAdd'); await p.waitForTimeout(800);
 /* a number already on a location is refused */
 const onRef = await p.evaluate(() => { const a = allAssets().find(a => !a._cancelled && invCoatesNums(a).length); return a ? [a.key, invCoatesNums(a)[0]] : null; });
 await p.selectOption('#spType', 'Toilets & amenities|FWF'); await p.fill('#spCo', 'Coates'); await p.fill('#spNo', onRef[1]); await p.click('#spAdd'); await p.waitForTimeout(500);
 R.refused = await p.evaluate(() => (document.querySelector('#flash, .flash, [role="alert"]') || {}).textContent || '');
 R.afterAdd = await fwf();
 await card('1_card_spares');
 /* the swap: a toilet location with a Coates number, swapped for the Event Portables spare */
 const wc = await p.evaluate(() => { const a = allAssets().find(a => !a._cancelled && invTypeOf(a) === 'Toilets & amenities|FWF' && invCoatesNums(a).length && invOnSite(a, todayIso())); return a ? {key: a.key, no: invCoatesNums(a)[0], nums: invCoatesNums(a), subs: subOf(a.key).length} : null; });
 R.wc = wc;
 await p.evaluate(k => chChoose(k), wc.key); await p.waitForTimeout(900);
 await p.click(`#pane-change [data-chswap*='"no":"${wc.no}"']`); await p.waitForTimeout(700);
 const box = await p.$('#chSwapBox'); await box.screenshot({path: O + '2_swapbox.png'});
 R.swapOpts = await p.evaluate(() => [...document.querySelectorAll('#chSwapTo option')].map(o => o.textContent));
 await p.click('#chSwapGo'); await p.waitForTimeout(1200);
 R.afterSwap = await p.evaluate(k => ({nums: invCoatesNums(assetOf(k)), subs: subOf(k).map(x => [x.co, x.no]), spares: spareList().map(s => [s.co, s.no, s.note]), said: (CHG.said || {}).text}), wc.key);
 await p.evaluate(() => document.querySelector('#chForm, .chform, #pane-change .chside').scrollIntoView({block: 'start'})); await p.waitForTimeout(400);
 const form = await p.$('#pane-change .chside .card'); if (form) await form.screenshot({path: O + '3_form_after_swap.png'});
 /* use the Coates spare at a toilet location with no number yet */
 const bare = await p.evaluate(() => { const a = allAssets().find(a => !a._cancelled && invTypeOf(a) === 'Toilets & amenities|FWF' && !invCoatesNums(a).length && !subOf(a.key).length); return a ? a.key : null; });
 R.bare = bare;
 const sid = await p.evaluate(() => (spareList().find(s => s.no === '1299991') || {}).id);
 await p.selectOption(`[data-spuse-to="${sid}"]`, bare); await p.click(`[data-spuse="${sid}"]`); await p.waitForTimeout(900);
 R.afterUse = await p.evaluate(k => ({nums: invCoatesNums(assetOf(k)), spares: spareList().map(s => [s.co, s.no])}), bare);
 R.afterAll = await fwf();
 await card('4_card_after');
 /* cancel an order from the form: a building on site with a number */
 const bld = await p.evaluate(() => { const a = allAssets().find(a => !a._cancelled && a.discipline === 'Portable buildings' && invCoatesNums(a).length && invOnSite(a, todayIso())); return a ? {key: a.key, nums: invCoatesNums(a)} : null; });
 R.bld = bld;
 await p.evaluate(k => chChoose(k), bld.key); await p.waitForTimeout(900);
 await p.click(`#pane-change [data-cancelk="${bld.key}"]`); await p.waitForTimeout(600);
 const dlg = await p.$('[aria-label="Cancel ' + bld.key + '"]'); if (dlg) await dlg.screenshot({path: O + '5_cancel_dialog.png'});
 R.cxBox = await p.evaluate(() => { const c = document.querySelector('#cxSpare'); return c ? {checked: c.checked, text: c.parentElement.textContent.trim()} : null; });
 await p.fill('#cxWhy', 'Customer cancelled'); await p.click('#cxSave'); await p.waitForTimeout(1200);
 R.afterCancel = await p.evaluate(k => ({cancelled: !!assetOf(k)._cancelled, words: rowOffWords(k), nums: invCoatesNums(assetOf(k)), spares: spareList().filter(s => /cancelled/.test(s.note || '')).map(s => [s.no, s.note]), inv: inventory().list.filter(r => r.disc === 'Portable buildings').map(r => [r.item, r.asked, r.on, r.spares])}), bld.key);
 await p.evaluate(() => document.querySelector('#pane-change .chcx').scrollIntoView({block: 'center'})); await p.waitForTimeout(300);
 const cx = await p.$('#pane-change .chside .card'); if (cx) await cx.screenshot({path: O + '6_form_cancelled.png'});
 await p.click(`#pane-change [data-restorek="${bld.key}"]`); await p.waitForTimeout(1000);
 R.afterRestore = await p.evaluate(k => ({cancelled: !!assetOf(k)._cancelled}), bld.key);
 /* the Inventory button jumps to the card */
 await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#pane-change [data-invjump]'); await p.waitForTimeout(900);
 R.jump = await p.evaluate(() => Math.round(document.querySelector('#invCard').getBoundingClientRect().top));
 R.hscroll = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
 R.errs = errs;
 console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
