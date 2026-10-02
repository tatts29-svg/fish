// v8.16 - empty area in every multi-column layout v8.16 adds, measured the way v7.99's layout799.cjs measures Today:
// each container's area against its visible children at their natural size. Author: Andrew Fisher. Read only.
//   PAGE=build/GC500_v8.16/GC500_Delivery_Control_hosted.html [MOB=1] node v8.16_reference_and_demob_DRAFT/evidence/layout816.cjs
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const mobile = process.env.MOB === '1', file = process.env.PAGE || path.join(__dirname, '../../build/GC500_v8.16/GC500_Delivery_Control_hosted.html');
  const h = await open({pageFile: file, W: mobile ? 390 : 1440, H: mobile ? 844 : 900, dpr: mobile ? 2 : 1, mobile}), p = h.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await wait(2500);
    await p.emulateMedia({reducedMotion: 'reduce'});
    const measure = sels => p.evaluate(sels => {
      const vis = e => e && e.getClientRects().length > 0 && !e.closest('details:not([open])');
      const st = document.createElement('style'); st.textContent = '.m816n>*{align-self:start!important;height:auto!important;flex-grow:0!important}.m816n{align-items:start!important}'; document.head.appendChild(st);
      const out = {};
      for (const [name, sel] of Object.entries(sels)) {
        const c = document.querySelector(sel); if (!vis(c)) { out[name] = null; continue; }
        const r = c.getBoundingClientRect(), a = r.width * r.height;
        c.classList.add('m816n'); const used = [...c.children].filter(vis).reduce((s, k) => { const q = k.getBoundingClientRect(); return s + q.width * q.height; }, 0); c.classList.remove('m816n');
        out[name] = {w: Math.round(r.width), h: Math.round(r.height), emptyPct: +(Math.max(0, a - used) / a * 100).toFixed(1)};
      }
      st.remove(); return out; }, sels);
    const R = {mobile};
    for (const k of ['P42', 'WC05']) {
      await p.evaluate(k => openAsset(k), k); await wait(1500);
      R['drawer ' + k] = await measure({'summary In/Out tiles': '#drawer .sum816 .ctwo', 'Complete it lights': '#drawer .cmp816 .hublights', 'Where it is': '#drawer .where816 dl.kv816', 'photo strip': '#drawer .ph816 .strip816p'});
      await p.evaluate(() => document.getElementById('dclose').click()); await wait(300);
    }
    await p.evaluate(() => go('demob')); await wait(1500);
    for (const d of ['2026-10-28', '2026-11-04']) {
      await p.evaluate(d => { DM816.sel = d; DM816.view = 'list'; render(); }, d); await wait(800);
      R['demob ' + d] = await measure({'board head (words | counts)': '#pane-demob .dmhead816', 'count tiles': '#pane-demob .kp816', 'day strip': '#pane-demob .strip816', 'day bar (branches | actions)': '#pane-demob .dmbar816'});
    }
    R.errors = h.errors;
    fs.writeFileSync(path.join(__dirname, `layout816_${mobile ? 'phone' : 'desktop'}.json`), JSON.stringify(R, null, 1));
    console.log(JSON.stringify(R, null, 1));
  } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
