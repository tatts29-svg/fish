// read-only probe (phone): the record is changed in this browser's memory only (no save) to picture AA's Equipment cell. Author: Andrew Fisher.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => { const s = await open({pageFile: process.env.PAGE, mobile: true, W: 390, H: 844, dpr: 2}); const p = s.page;
  await p.waitForFunction(() => typeof fire914Of === 'function' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories'), null, {timeout: 240000}); await p.waitForTimeout(2000);
  const g = await p.evaluate(async () => { S.accessories.AA = (S.accessories.AA || []).concat([{type: 'Fire extinguisher', qty: 2, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, _added: true, added_at: '2026-10-08T06:30:00.000Z', added_by: 'Practice Recorder'}]);
    RENDER_MEMO.clear(); const a = assetOf('AA'); state.plantGroup = PLANT_GROUP_WORDS[a.product] || a.product || a.discipline; state.light = null; state.q = ''; go('plant'); render();
    await new Promise(r => setTimeout(r, 3000));
    const e = document.querySelector('#pane-plant [data-fire914-equip="AA"]'); let d = e.closest('details'); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    const td = e.closest('td'); const sc = []; let x = td.parentElement; while (x) { if (x.scrollWidth > x.clientWidth + 2) sc.push(x); x = x.parentElement; }
    sc.forEach(s => { s.scrollLeft = 0; }); await new Promise(r => setTimeout(r, 200));
    const first = sc[0]; const fr = first.getBoundingClientRect(), tr0 = td.getBoundingClientRect();
    first.scrollLeft = tr0.left - fr.left - 140; await new Promise(r => setTimeout(r, 300));
    td.scrollIntoView({block: 'center', inline: 'nearest'}); await new Promise(r => setTimeout(r, 300));
    const r = td.getBoundingClientRect(); return {sc: sc.map(s => s.tagName + '.' + String(s.className).slice(0, 30) + ' ' + s.scrollLeft + '/' + s.scrollWidth), x: r.left, y: r.top, w: r.width, h: r.height, vis: e.getBoundingClientRect().left, txt: e.innerText}; });
  console.log(JSON.stringify(g));
  const y = Math.max(0, g.y - 60), x = Math.max(0, Math.min(g.x - 150, 390 - 380));
  await p.screenshot({path: '/home/user/fish/03_GC500_Delivery_Control/v9.14_fire_ext_DRAFT/evidence/equipment_AA_phone.png', clip: {x: 0, y, width: 390, height: Math.min(260, 844 - y)}, animations: 'disabled'});
  const dollars = await p.evaluate(() => /\$\s?\d/.test(document.querySelector('#pane-plant [data-fire914-equip="AA"]').closest('tr').innerText));
  console.log(JSON.stringify({dollarsInRow: dollars, errors: s.errors, counts: s.counts})); await s.browser.close(); })().catch(e => { console.error(e); process.exit(2); });
