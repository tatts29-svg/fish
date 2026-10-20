const {open} = require('/tmp/claude-0/stage18/lh18au');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#day/2026-09-29', W: 390, H: 844, dpr: 2, mobile: true, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 const errs = []; p.on('pageerror', e => errs.push(e.message));
 await p.waitForFunction(() => document.querySelector('#pane-timeline .dplate') && typeof staleClaim === 'function', null, {timeout: 150000}); await p.waitForTimeout(4000);
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.save = () => {}; SYNC.readonly = false; document.body.classList.remove('viewonly'); S.operator = 'Andrew Fisher'; const w = document.getElementById('who'); if (w) w.value = 'Andrew Fisher'; });
 const R = {};
 R.stale = await p.evaluate(() => ({p53: staleClaim(assetOf('P53'), '1327222'), p36: staleClaim(assetOf('P36'), '1327222'), p36real: staleClaim(assetOf('P36'), '1282487'), owners: numberOwners('1327222', 'ZZ'), realOwners: numberOwners('1282487', 'ZZ')}));
 await p.evaluate(() => chOpen('2026-09-29')); await p.waitForTimeout(1200); await p.click('#pane-change [data-invjump]'); await p.waitForTimeout(600);
 R.check = await p.evaluate(() => [...document.querySelectorAll('#invCard .invwarn li')].map(li => li.innerText.replace(/\s+/g, ' ')));
 const w = await p.$('#invCard .invwarn'); if (w) await w.screenshot({path: '/tmp/claude-0/stage11/stale_m_check.png'});
 /* a real number is still protected */
 const target = await p.evaluate(() => { const a = allAssets().find(a => !a._cancelled && a.discipline === 'Portable buildings' && !invCoatesNums(a).length && !a.rest_of); return a.key; });
 R.target = target;
 R.realBlocked = await p.evaluate(k => { CHG.key = k; render(); chNumAdd(k, '1282487'); return {clash: CHG.clash ? CHG.clash.owners.map(o => o.key) : null, on: assetOf(k).asset_numbers}; }, target);
 /* the planned one goes where it really is, and comes off P36 and P53 */
 R.moved = await p.evaluate(k => { CHG.clash = null; chNumAdd(k, '1327222'); return {on: assetOf(k).asset_numbers, p36: assetOf('P36').asset_numbers, p53: assetOf('P53').asset_numbers, said: (CHG.said || {}).text, extra: (questionsList().find(q => q.id === 'sp-extra') || {}).rows || null, p36money: labourMoney('P36', chargeLines(assetOf('P36'))[0], 'P36').total}; }, target);
 R.errs = errs; console.log(JSON.stringify(R, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
