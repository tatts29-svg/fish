// Author: Andrew Fisher. Read-only check of the GN20 install-rate explanation.
const {open} = require('../../toolchain/harness/open_page');
const assert = require('node:assert/strict');
const path = require('path');
(async () => {
  const s = await open({pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true});
  try {
    const p = s.page;
    await p.waitForFunction(() => typeof missingInstall744 === 'function' && SYNC.status === 'live', null, {timeout: 180000});
    await p.evaluate(() => openAsset('GN20'));
    const notice = p.locator('#drawer [data-install-rate-needed="GN20"]');
    await notice.waitFor();
    assert.match(await notice.innerText(), /Install charge needs a rate/);
    assert.match(await notice.innerText(), /excluding GST/);
    const info = await p.evaluate(() => {
      const a = assetOf('GN20'), l = chargeLines(a).find(x => /^350\s*kva$/i.test(x.item));
      return {labour: labourMoney(a.key, l, a.key, a).total, installOffered: labourOffered(a, 'install'), readonly: SYNC.readonly};
    });
    assert.equal(info.labour, 0);
    assert.equal(info.installOffered, false);
    assert.equal(info.readonly, true);
    await notice.scrollIntoViewIfNeeded();
    await p.screenshot({path: path.join(__dirname, 'phone_gn20_install_rate.png')});
    await p.evaluate(() => openAsset('GN01'));
    assert.equal(await p.locator('#drawer [data-install-rate-needed]').count(), 0);
    assert.equal(s.errors.length, 0, JSON.stringify(s.errors));
    assert.equal(s.counts.blocked, 0);
    console.log(JSON.stringify({passed: 7, gn20: info, pageErrors: s.errors.length, blockedWrites: s.counts.blocked}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
