// smoke probe for the v9.14 build: read only. Author: Andrew Fisher.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const PAGE = process.env.PAGE;
(async () => {
  const s = await open({pageFile: PAGE, W: 1440, H: 900});
  const p = s.page; const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await p.waitForFunction(() => typeof fire914Of === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories'), null, {timeout: 240000});
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const o = {};
    o.accDoc = Object.keys(S.accessories || {}).slice(0, 3);
    for (const k of ['AA', 'GN01', 'T0001', 'WC09', 'T0023']) {
      openAsset(k);
      const dr = document.getElementById('drawer');
      const f = dr.querySelector('[data-fire914]');
      const fold = f ? f.closest('details') : null;
      o[k] = {block: !!f, fold: fold ? (fold.dataset.f816 || fold.id || fold.className) : null, sum: fold ? fold.querySelector('summary').innerText.replace(/\s+/g, ' ') : null, chargeLines: chargeLines(assetOf(k)).map(l => l.item)};
    }
    return o;
  });
  console.log(JSON.stringify(r, null, 1));
  await p.evaluate(() => { window.capability = () => 'edit'; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Practice Editor'; document.body.classList.remove('viewonly'); });
  const r2 = await p.evaluate(() => { const o = {}; for (const k of ['AA', 'GN01', 'T0001', 'WC09', 'T0023']) { openAsset(k); const f = document.querySelector('#drawer [data-fire914]'); const fold = f ? f.closest('details') : null;
    o[k] = {block: !!f, save: f && f.querySelector('[data-fire914-save]') ? f.querySelector('[data-fire914-save]').textContent : null, charge: f ? f.querySelector('[data-fire914-charge]').textContent : null, fold: fold ? fold.dataset.f816 : null, sum: fold ? fold.querySelector('summary').innerText.replace(/\s+/g, ' ') : null}; } return o; });
  console.log(JSON.stringify(r2, null, 1));
  console.log(JSON.stringify({errors: s.errors, cons, counts: s.counts}));
  await s.browser.close();
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(2); });
