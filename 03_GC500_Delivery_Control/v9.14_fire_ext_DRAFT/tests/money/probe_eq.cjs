// read-only probe: the record is changed in this browser's memory only (no save), Author: Andrew Fisher.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => { const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof fire914Of === 'function' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories'), null, {timeout: 240000}); await p.waitForTimeout(2000);
  const r = await p.evaluate(async () => { S.accessories.AA = (S.accessories.AA || []).concat([{type: 'Fire extinguisher', qty: 2, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, _added: true, added_at: '2026-10-08T06:30:00.000Z', added_by: 'P'}]);
    RENDER_MEMO.clear(); const a = assetOf('AA'); state.plantGroup = PLANT_GROUP_WORDS[a.product] || a.product || a.discipline; state.light = null; state.q = ''; go('plant'); render();
    await new Promise(r => setTimeout(r, 3000));
    const e = document.querySelector('#pane-plant [data-fire914-equip="AA"]'); const o = {group: state.plantGroup, found: !!e};
    if (e) { const cs = getComputedStyle(e), td = e.closest('td'), tr = e.closest('tr'); o.text = e.textContent; o.inner = e.innerText; o.disp = cs.display; o.rect = JSON.stringify(e.getBoundingClientRect()); o.tdDisp = td && getComputedStyle(td).display; o.trDisp = tr && getComputedStyle(tr).display; o.anc = []; let x = e; while (x && x !== document.body) { const c = getComputedStyle(x); if (c.display === 'none' || x.hidden || (x.tagName === 'DETAILS' && !x.open)) o.anc.push(x.tagName + '#' + x.id + '.' + x.className); x = x.parentElement; } }
    o.count = document.querySelectorAll('[data-fire914-equip="AA"]').length; o.panes = [...document.querySelectorAll('[data-fire914-equip="AA"]')].map(x => (x.closest('[id^=pane-]') || {}).id);
    location.hash = '#print/install/2026-09-17'; await new Promise(r => setTimeout(r, 9000));
    const hits = [...document.querySelectorAll('body *')].filter(x => /Fire extinguisher × 2/.test(x.textContent) && ![...x.children].some(c => /Fire extinguisher × 2/.test(c.textContent)));
    o.print = hits.map(x => ({tag: x.tagName, cls: x.className, vis: x.offsetParent !== null, pane: (x.closest('[id]') || {}).id})); o.hash = location.hash; o.dp = !!document.getElementById('dpbar');
    return o; });
  console.log(JSON.stringify(r, null, 1)); console.log(JSON.stringify({errors: s.errors, counts: s.counts})); await s.browser.close(); })().catch(e => { console.error(e); process.exit(2); });
