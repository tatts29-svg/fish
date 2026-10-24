/* v7.29 round trip on the LOCAL test server (test tokens only): a spare typed on the edit link is saved, survives a
   reload, and shows on the view link; a swap and a cancel travel the same way. */
const {chromium} = require('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright');
const B = 'http://127.0.0.1:8829', E = B + '/e/edittokenedittoken1/', V = B + '/v/viewtokenviewtoken1/';
const state = async () => (await (await fetch(B + '/api/state?t=viewtokenviewtoken1')).json());
(async () => { const br = await chromium.launch({executablePath: '/opt/pw-browsers/chromium'}); const R = {};
 const ctx = await br.newContext({viewport: {width: 1440, height: 1000}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
 await ctx.route(u => !u.href.startsWith(B), r => r.abort());
 const ctxV = await br.newContext({viewport: {width: 1440, height: 1000}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'}); await ctxV.route(u => !u.href.startsWith(B), r => r.abort());
 const errs = []; const pg = async (url, c) => { const p = await (c || ctx).newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(url + '#change/2026-09-28');
  await p.waitForFunction(() => typeof invHtml === 'function' && SYNC && SYNC.status === 'live' && document.querySelector('#invCard'), null, {timeout: 120000}); await p.waitForTimeout(1500); return p; };
 const a = await pg(E);
 R.levelA = await a.evaluate(() => [capability(), SYNC.level]);
 await a.fill('#chWho', 'Andrew Fisher'); await a.press('#chWho', 'Tab'); await a.waitForTimeout(300);
 await a.selectOption('#spType', 'Toilets & amenities|FWF'); await a.fill('#spCo', 'Event Portables'); await a.fill('#spNo', 'EP30001'); await a.fill('#spNote', 'Coates compound'); await a.click('#spAdd'); await a.waitForTimeout(500);
 await a.selectOption('#spType', 'Toilets & amenities|FWF'); await a.fill('#spCo', 'Coates'); await a.fill('#spNo', '1299992'); await a.click('#spAdd');
 await a.waitForFunction(() => syncWaiting() === 0, null, {timeout: 20000}); await a.waitForTimeout(800);
 let st = await state(); R.serverSpares = Object.values(st.docs.spares || {}).map(d => [d.co, d.no, d.note, d.by]);
 /* reload: still there */
 await a.reload(); await a.waitForFunction(() => typeof invHtml === 'function' && SYNC.status === 'live' && document.querySelector('#invCard'), null, {timeout: 120000}); await a.waitForTimeout(1500);
 R.afterReload = await a.evaluate(() => spareList().map(s => [s.co, s.no]));
 /* the view link sees them */
 const v = await pg(V, ctxV);
 R.viewSees = await v.evaluate(() => ({level: capability(), spares: spareList().map(s => [s.co, s.no]), card: /Event Portables 1 on site/.test(document.querySelector('#invCard').innerText), addDisabled: document.querySelector('#spAdd').disabled}));
 const K3 = await a.evaluate(() => { const x = allAssets().find(a => a.key !== 'WC02' && !a._cancelled && invTypeOf(a) === 'Toilets & amenities|FWF'); CHG.key = x.key; render(); return x.key; }); await a.waitForTimeout(500); await a.fill('#chNum', '1299992'); await a.click('#chNumAdd'); await a.waitForFunction(() => syncWaiting() === 0, null, {timeout: 20000}); await a.waitForTimeout(600);
 R.claim = await a.evaluate(k => ({ref: k, nums: assetOf(k).asset_numbers, spares: spareList().map(s => s.no), said: (CHG.said || {}).text}), K3);
 /* swap on the edit link: a toilet location with a number typed on it first */
 await a.evaluate(() => { CHG.key = 'WC02'; render(); }); await a.waitForTimeout(600);
 await a.fill('#chNum', '1299993'); await a.click('#chNumAdd'); await a.waitForTimeout(600);
 await a.click(`#pane-change [data-chswap*='"no":"1299993"']`); await a.waitForTimeout(500);
 R.swapPick = await a.evaluate(() => document.querySelector('#chSwapTo').selectedOptions[0].textContent);
 await a.click('#chSwapGo'); await a.waitForFunction(() => syncWaiting() === 0, null, {timeout: 20000}); await a.waitForTimeout(2500);
 await v.waitForFunction(() => subOf('WC02').length === 1, null, {timeout: 30000}).catch(() => {}); R.viewAfterSwap = await v.evaluate(() => ({nums: (assetOf('WC02').asset_numbers || []), subs: subOf('WC02').map(x => [x.co, x.no]), spares: spareList().map(s => [s.co, s.no, s.note])}));
 /* cancel on the edit link, through the form button */
 await a.evaluate(() => { CHG.key = 'WC02'; render(); }); await a.waitForTimeout(500);
 await a.click('#pane-change [data-cancelk="WC02"]'); await a.waitForTimeout(400); await a.fill('#cxWhy', 'Test - customer cancelled');
 R.cxChecked = await a.evaluate(() => { const c = document.querySelector('#cxSpare'); return c ? c.checked : null; });
 await a.click('#cxSave'); await a.waitForFunction(() => syncWaiting() === 0, null, {timeout: 20000}); await a.waitForTimeout(2500);
 await v.waitForFunction(() => !!assetOf('WC02')._cancelled, null, {timeout: 30000}).catch(() => {}); R.viewAfterCancel = await v.evaluate(() => ({cancelled: !!assetOf('WC02')._cancelled, words: rowOffWords('WC02')}));
 await a.click('#pane-change [data-restorek="WC02"]'); await a.waitForFunction(() => syncWaiting() === 0, null, {timeout: 20000}); await a.waitForTimeout(2500);
 await v.waitForFunction(() => !assetOf('WC02')._cancelled, null, {timeout: 30000}).catch(() => {}); R.viewAfterRestore = await v.evaluate(() => !!assetOf('WC02')._cancelled);
 /* a spare taken out */
 await a.evaluate(() => document.querySelector('#invCard').scrollIntoView()); const id = await a.evaluate(() => spareList().find(s => s.no === 'EP30001') ? null : (spareList()[0] || {}).id);
 const first = await a.evaluate(() => spareList()[0].id); await a.click(`[data-spoff="${first}"]`); await a.waitForFunction(() => syncWaiting() === 0, null, {timeout: 20000}); await a.waitForTimeout(2500);
 st = await state(); R.serverSparesEnd = Object.values(st.docs.spares || {}).map(d => [d.co, d.no]); await v.waitForFunction(() => spareList().length === 1, null, {timeout: 30000}).catch(() => {}); R.viewEnd = await v.evaluate(() => spareList().map(s => [s.co, s.no]));
 R.errs = errs; console.log(JSON.stringify(R, null, 1)); await br.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
