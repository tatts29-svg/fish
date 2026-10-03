// Author: Andrew Fisher. Empty space on the Documents tab, measured the v7.99 way (v7.99_today_faster_fuller_DRAFT/
// evidence/layout799.cjs): each section's area, less the natural area of what is in it (every child at its own height,
// nothing stretched). Read only.   PAGE=<html> [MOB=1] TAG=live|v815 node layout815.cjs
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {open} = require('../../toolchain/harness/open_page');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const file = process.env.PAGE, mobile = process.env.MOB === '1', tag = process.env.TAG || 'v815';
  const h = await open({pageFile: file, hash: '#docs', W: mobile ? 390 : 1440, H: mobile ? 844 : 900, dpr: mobile ? 2 : 1, mobile}), p = h.page;
  const result = {author: 'Andrew Fisher', tag, mobile, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), views: {}};
  try {
    await p.waitForFunction(() => typeof DOCS !== 'undefined' && DOCS.state === 'ready' && document.querySelector('#pane-docs .card, #pane-docs .cut'), null, {timeout: 240000});
    await sleep(2500); await p.emulateMedia({reducedMotion: 'reduce'});
    const views = tag === 'live' ? [['as it opens', null]] : [['as it opens', null], ['Packs open', 'packs'], ['Drawings open', 'maps'], ['Fencing dockets open', 'dockets']];
    for (const [label, tile] of views) {
      if (tile) { await p.evaluate(k => { state.docTile815 = null; paintDocs815(); document.querySelector(`[data-tile815="${k}"]`).click(); }, tile); await sleep(800); }
      result.views[label] = await p.evaluate(live => {
        const pane = document.getElementById('pane-docs'), vis = e => e && e.getClientRects().length > 0 && !e.closest('details:not([open])');
        const sections = {};
        if (live) [...pane.querySelectorAll('.docsec')].filter(vis).forEach(s => { const g = s.querySelector('.docgrid'); if (g) sections[s.id] = g; });
        else { sections['Cards'] = pane.querySelector('#docTiles815');
          pane.querySelectorAll('#docBody815 .static815').forEach(c => { c.querySelectorAll(':scope .rows815').forEach((r, i) => { if (vis(r)) sections[(c.id || 'recent') + ' rows ' + (i + 1)] = r; }); }); }
        const natural = new Map(), st = document.createElement('style');
        st.textContent = '.natural815>*{align-self:start!important;height:auto!important;flex-grow:0!important;min-height:0!important}.natural815{align-items:start!important}';
        document.head.appendChild(st);
        Object.values(sections).forEach(c => c && c.classList.add('natural815'));
        Object.values(sections).forEach(c => c && [...c.children].filter(vis).forEach(k => { const r = k.getBoundingClientRect(); natural.set(k, r.width * r.height); }));
        Object.values(sections).forEach(c => c && c.classList.remove('natural815')); st.remove();
        const areas = {}; let total = 0, empty = 0;
        for (const [n, c] of Object.entries(sections)) { if (!vis(c)) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (!a) continue;
          const used = [...c.children].filter(vis).reduce((s, k) => s + (natural.get(k) || 0), 0);
          areas[n] = {heightPx: Math.round(r.height), emptyPct: +(Math.max(0, a - used) / a * 100).toFixed(1)}; total += a; empty += Math.max(0, a - used); }
        const m = document.querySelector('main');
        return {paneHeightPx: Math.round(pane.getBoundingClientRect().height), viewportWidth: innerWidth, pageScrollWidth: Math.max(document.documentElement.scrollWidth, m ? m.scrollWidth : 0), sections: areas, totalEmptyPct: total ? +(empty / total * 100).toFixed(1) : null};
      }, tag === 'live');
    }
    result.errors = h.errors;
    fs.writeFileSync(path.join(__dirname, `layout815_${tag}_${mobile ? 'phone' : 'desktop'}.json`), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { await h.browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
