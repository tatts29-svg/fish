// read-only probe (phone): the record is changed in this browser's memory only (no save). Author: Andrew Fisher.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => { const s = await open({pageFile: process.env.PAGE, mobile: true, W: 390, H: 844, dpr: 2}); const p = s.page;
  await p.waitForFunction(() => typeof fire914Of === 'function' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories'), null, {timeout: 240000}); await p.waitForTimeout(2000);
  const r = await p.evaluate(async () => { S.accessories.AA = (S.accessories.AA || []).concat([{type: 'Fire extinguisher', qty: 2, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, _added: true, added_at: '2026-10-08T06:30:00.000Z', added_by: 'P'}]);
    RENDER_MEMO.clear(); const a = assetOf('AA'); state.plantGroup = PLANT_GROUP_WORDS[a.product] || a.product || a.discipline; state.light = null; state.q = ''; go('plant'); render();
    await new Promise(r => setTimeout(r, 3000));
    const e = document.querySelector('#pane-plant [data-fire914-equip="AA"]'); let d = e.closest('details'); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    const out = []; let x = e; for (let i = 0; i < 4 && x; i++, x = x.parentElement) { const c = getComputedStyle(x); out.push({tag: x.tagName, cls: String(x.className).slice(0, 40), fs: c.fontSize, ws: c.whiteSpace, ov: c.overflow, w: Math.round(x.getBoundingClientRect().width), ti: c.textIndent, dir: c.direction, ta: c.textAlign, ls: c.letterSpacing, disp: c.display}); }
    const sib = e.previousElementSibling; const td = e.closest('td'); return {chain: out, sib: sib ? {txt: sib.innerText, fs: getComputedStyle(sib).fontSize, w: Math.round(sib.getBoundingClientRect().width)} : null, tdText: td.innerText.slice(0, 200), tdHTML: td.innerHTML.slice(0, 400)}; });
  console.log(JSON.stringify(r, null, 1)); await s.browser.close(); })().catch(e => { console.error(e); process.exit(2); });
