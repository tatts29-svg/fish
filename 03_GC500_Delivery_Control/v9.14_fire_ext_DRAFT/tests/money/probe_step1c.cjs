// Step 1 probe, part c (phone): the drawer folds a viewer and an editor see, and why WC09's two added air conditioners
// read where they do. Read-only; counts and booleans only. Author: Andrew Fisher.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
const PAGE = process.env.PAGE, OUT = process.env.OUT, MOB = !!process.env.MOB;
(async () => {
  const s = await open({pageFile: PAGE, mobile: MOB, W: MOB ? 390 : 1440, H: MOB ? 844 : 900, dpr: MOB ? 2 : 1});
  const consoleErr = []; s.page.on('console', m => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 200)); });
  await s.page.waitForFunction(() => typeof allAssets === 'function' && typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 120000}).catch(() => {});
  await s.page.waitForTimeout(5000);
  const wc09 = await s.page.evaluate(() => { const a = assetOf('WC09'), own = (S.accessories || {}).WC09 || [];
    const ids = accIds(((DATA.assets.find(x => x.key === 'WC09') || {}).accessories || []).concat(own));
    return {movedAway: !!movedAway('WC09'), givenRef: !!givenRefOf('WC09'), shown: (a.accessories || []).length, takenOff: (a._accessoriesTakenOff || []).length,
      tombed: ids.map(id => tombedHere('acc/WC09/' + id)), gone: ids.map(id => tombedHere('accgone/WC09/' + id)),
      contentsNumbers: (a._contentsNumbers || []).length, unitsNotContents: (a._unitsNotContents || []).length,
      unitsLabels: unitsOf('WC09').map(u => u.label), recordKeysWithAcc: Object.keys(S.accessories || {}).length}; });
  const view = await s.page.evaluate(() => { const r = {}; ['AA', 'WC09'].forEach(k => { openAsset(k); const dr = document.getElementById('drawer');
    r[k] = {folds: [...dr.querySelectorAll('details[data-f816]')].filter(d => getComputedStyle(d).display !== 'none').map(d => d.dataset.f816), accFormInDom: !!dr.querySelector('#accForm'), accInputsDisabled: [...dr.querySelectorAll('#accForm select, #accForm input, #accForm button')].every(e => e.disabled || getComputedStyle(e).display === 'none')};
    document.getElementById('dclose').click(); }); return r; });
  fs.writeFileSync(OUT, JSON.stringify({wc09, view, errors: s.errors, consoleErr, counts: s.counts}, null, 1));
  console.log('done', OUT, 'blocked', s.counts.blocked, 'errors', s.errors.length);
  await s.browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
