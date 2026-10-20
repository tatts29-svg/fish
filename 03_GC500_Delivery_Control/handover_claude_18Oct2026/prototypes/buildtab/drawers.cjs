const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
(async () => { const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page; const out = {};
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500}); await p.waitForTimeout(8000);
  out.version = await p.evaluate(() => SYNC.db.readVersion821());
  const keys = (process.env.KEYS || '').split(',');
  for (const k of keys) { await p.evaluate(k => openAsset(k), k); await p.waitForTimeout(2500);
    out[k] = await p.evaluate(() => { const d = document.getElementById('drawer'); const c = d.cloneNode(true); c.querySelectorAll('style,script').forEach(x => x.remove()); return c.textContent.replace(/\s+/g, ' '); });
    await p.evaluate(() => { try { closeDrawer(); } catch (e) { document.getElementById('drawer').classList.remove('on'); } }); await p.waitForTimeout(800); }
  fs.writeFileSync(process.env.OUT, JSON.stringify(out)); console.log('ok', out.version); await s.browser.close(); })();
