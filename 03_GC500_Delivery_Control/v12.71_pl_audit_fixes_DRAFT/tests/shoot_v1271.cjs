// Author: Andrew Fisher. The whole v12.71 face in one picture, desktop and phone, for Andrew's look before any upload: a tall
// viewport so the page's own scroller shows the tiles, the revenue, where the costs are, the branches and Not in it yet together;
// then each section on its own. Read-only: every write the page tries is aborted by the harness.
//   PAGE=build/GC500_v12.71/GC500_Delivery_Control_hosted.html [MOB=1] OUT=evidence node tests/shoot_v1271.cjs
const fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, out = process.env.OUT || 'evidence', tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 3400 : 2600, dpr: mobile ? 2 : 1, hash: '#costs'}), p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267') && document.getElementById('pl1267-work'), null, {timeout: 60000});
    await p.waitForTimeout(2500);
    fs.mkdirSync(out, {recursive: true});
    await p.evaluate(() => { const el = document.getElementById('pl1267'); if (el) el.scrollIntoView({block: 'start'}); });
    await p.waitForTimeout(500);
    await p.screenshot({path: path.join(out, `face_${tag}.png`)});
    for (const id of ['pl1267-cost', 'pl1267-branch', 'pl1267-gaps']) {
      const el = await p.$('#' + id); if (!el) continue;
      await el.evaluate(e => e.scrollIntoView({block: 'start'})); await p.waitForTimeout(400);
      await el.screenshot({path: path.join(out, `${id.replace('pl1267-', 'face_')}_${tag}.png`)});
    }
    console.log(`shot ${tag}: face and sections in ${out}; errors ${s.errors.length}, writes ${s.counts.blocked}`);
  } catch (e) { console.error(`shoot ${tag}: FAILED: ${e.message}`); process.exitCode = 1; }
  finally { await s.browser.close(); }
})();
