// Author: Andrew Fisher. Read-only comparison of every reference's money and labour before/after v7.44.
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900});
  try {
    const p = s.page;
    await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2000);
    const snapshot = await p.evaluate(() => {
      const assets = allAssets().slice().sort((a, b) => a.key.localeCompare(b.key));
      const figures = Object.fromEntries(assets.map(a => {
        const total = assetTotal(a);
        return [a.key, {
          base: total.base, accessories: total.accessories, labour: total.labour,
          known: total.known, transport: total.transport, total: total.total,
          lines: chargeLines(a).map(l => ({item: l.item, labour: labourMoney(a.key, l, a.key, a).total, units: labourUnits(a, l.item)}))
        }];
      }));
      const a = assetOf('GN20'), l = chargeLines(a).find(x => /^350\s*kva$/i.test(x.item));
      return {figures, labourPlan: labourPlan().all, gn20: {key: a.key, item: l.item, install: labourLinesFor(a.key, l.discipline, l.item, a.key).lines.find(x => x.key === 'install') || null}};
    });
    if (s.errors.length) throw new Error('page errors: ' + JSON.stringify(s.errors));
    if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(snapshot, null, 2) + '\n');
    console.log(JSON.stringify({references: Object.keys(snapshot.figures).length, labourPlan: snapshot.labourPlan, gn20: snapshot.gn20, pageErrors: s.errors.length, blockedWrites: s.counts.blocked}));
  } finally { await s.browser.close(); }
})().catch(e => {console.error(e.message); process.exitCode = 1;});
