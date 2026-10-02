// v8.15 - Documents, cleaned up: screenshots, before and after. Author: Andrew Fisher. Read only (open_page.js aborts
// every write). One browser at a time.
//   PAGEFILE=build/GC500_v8.15/GC500_Delivery_Control_hosted.html TAG=after OUTD=<dir> [EXTRA=1] node shots_v815.js
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
const PAGEFILE = process.env.PAGEFILE, TAG = process.env.TAG || 'shot', OUTD = process.env.OUTD || '.';
const wait = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUTD, {recursive: true});
(async () => {
  const out = {};
  for (const [name, dev] of [['desktop', {W: 1440, H: 900}], ['phone', {W: 390, H: 844, dpr: 2, mobile: true}]]) {
    const s = await open({pageFile: PAGEFILE, hash: '#docs', ...dev}); const p = s.page;
    await p.waitForFunction(() => typeof DOCS !== 'undefined' && DOCS.state === 'ready' && document.querySelector('#pane-docs .card, #pane-docs .cut'), null, {timeout: 180000});
    await wait(2500);
    const top = async () => { await p.evaluate(() => { const m = document.querySelector('main'); if (m) m.scrollTop = 0; window.scrollTo(0, 0); }); await wait(600); };
    const shot = async (file, full) => {
      if (!full) return p.screenshot({path: path.join(OUTD, file)});
      const h = await p.evaluate(() => { const m = document.querySelector('main'); return Math.min(24000, Math.max(document.documentElement.scrollHeight, (m ? m.scrollHeight + m.getBoundingClientRect().top : 0) + 80)); });
      await p.setViewportSize({width: dev.W, height: h}); await wait(1500);
      await p.screenshot({path: path.join(OUTD, file), scale: 'css'});
      await p.setViewportSize({width: dev.W, height: dev.H}); await wait(800);
    };
    await top();
    out[name] = await p.evaluate(() => { const pane = document.getElementById('pane-docs'); return {paneH: pane.offsetHeight, cards: pane.querySelectorAll('.card, .cut').length}; });
    await shot(`${TAG}_${name}_docs_first.png`);
    await shot(`${TAG}_${name}_docs_full.png`, true);
    if (process.env.EXTRA) {
      for (const k of ['maps', 'packs', 'photos', 'dockets']) {
        await p.evaluate(k => { state.docTile815 = null; const t = document.querySelector(`[data-tile815="${k}"]`); if (t) t.click(); }, k); await wait(900);
        await p.evaluate(k => { const el = document.getElementById('docsec-' + k); if (el) el.scrollIntoView({block: 'start'}); }, k); await wait(500);
        await shot(`${TAG}_${name}_docs_${k}.png`);
      }
      await p.evaluate(() => { const q = document.getElementById('docQ815'); q.value = 'WC'; q.dispatchEvent(new Event('input')); }); await wait(900); await top();
      await shot(`${TAG}_${name}_docs_search_WC.png`);
      await p.evaluate(() => { const q = document.getElementById('docQ815'); q.value = ''; q.dispatchEvent(new Event('input')); state.docTile815 = null; }); await wait(600);
      await p.evaluate(() => go('docs')); await wait(900);
    }
    await p.evaluate(() => go('today')); await p.waitForFunction(() => document.querySelector('#pane-today .hubcard'), null, {timeout: 60000}); await wait(2500); await top();
    await p.evaluate(() => { const h = document.querySelector('#pane-today .hub') || document.querySelector('#pane-today .inst'); if (h) h.scrollIntoView({block: 'start'}); });
    await wait(800);
    await shot(`${TAG}_${name}_today_cards.png`);
    out[name].errors = s.errors.slice();
    await s.browser.close();
  }
  console.log(JSON.stringify(out));
})().catch(e => { console.error(e); process.exitCode = 1; });
