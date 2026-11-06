// read-only: the Map explorer's departed marks on the v12.61 candidate (Sat + plan, zoomed to the pit lane group)
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
const PAGE = process.env.PAGE || '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.61/GC500_Delivery_Control_hosted.html';
const OUTDIR = process.env.OUTDIR || '/tmp/gc500-scratch/shots1261';
const MOB = process.env.MOB === '1';
fs.mkdirSync(OUTDIR, {recursive: true});
(async () => {
  const tag = MOB ? 'phone' : 'desktop';
  const h = await open({pageFile: PAGE, hash: '#map', W: MOB ? 390 : 1440, H: MOB ? 1100 : 1200, ...(MOB ? {dpr: 2, mobile: true} : {})});
  const p = h.page; const r = {};
  const hide = () => p.evaluate(() => { [...document.querySelectorAll('body *')].forEach(el => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height < 200) el.style.visibility = 'hidden'; }); });
  const shotBy = async (key, finder) => { try { const handle = await p.evaluateHandle(finder); const el = handle.asElement(); if (!el) { r[key] = 'not found'; return; } await el.scrollIntoViewIfNeeded({timeout: 15000}); await p.waitForTimeout(1500); await el.screenshot({path: OUTDIR + '/' + tag + '-' + key + '.png', timeout: 60000}); r[key] = 'ok'; } catch (e) { r[key] = 'fail ' + String(e.message || e).slice(0, 100); } };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(9000);
    // the explorer is the "Site plan & equipment" view of the Show map drop-down (v11.88)
    r.showMap = await p.evaluate(() => { const s = [...document.querySelectorAll('#pane-map select')].find(x => [...x.options].some(o => /site plan/i.test(o.textContent))); if (!s) return null; const o = [...s.options].find(o => /site plan/i.test(o.textContent)); if (o && s.value !== o.value) { s.value = o.value; s.dispatchEvent(new Event('change', {bubbles: true})); } return s.value; });
    await p.waitForTimeout(4000);
    const fr = await p.$('#expwrap iframe'); const frame = fr ? await fr.contentFrame() : null;
    r.frame = !!frame;
    await p.evaluate(() => { const b = [...document.querySelectorAll('#expcard button')].find(x => /^satellite \+ plan$/i.test((x.textContent || '').trim())); if (b) b.click(); });
    await p.waitForTimeout(4000);
    // 1. the area selector on Area 1 (the pit lane group Andrew photographed)
    r.area = await p.evaluate(() => { const s = [...document.querySelectorAll('#map1147-controls select, #pane-map select')].find(x => [...x.options].some(o => /pit lane/i.test(o.textContent))); if (!s) return 'no area select'; const o = [...s.options].find(o => /pit lane/i.test(o.textContent)); s.value = o.value; s.dispatchEvent(new Event('change', {bubbles: true})); return o.textContent.trim(); });
    await p.waitForTimeout(5000);
    const inside = async () => frame ? await frame.evaluate(() => { const out = {}; try { const it = ITEMS.find(i => i.code === 'BJR01'); const s = it && mapStatus1009(it); out.status = s ? {state: s.state, shape: s.shape, glyphCode: s.glyph ? s.glyph.charCodeAt(0).toString(16) : null, colour: s.colour, fill: s.fill, label: s.label} : null; } catch (e) { out.status = 'err ' + e.message; } out.key = (document.getElementById('map1256-key') || {}).textContent; out.zoomText = (document.body.innerText.match(/\b\d{2,4}%/g) || []).slice(0, 2); try { out.rings = Offsite1225.points.length; out.sample = Offsite1225.points.filter(q => /^(BJR01|T0162|PG29|SVP01|T0176)$/.test(q.code || q.key || '')).map(q => ({code: q.code || q.key, kind: q.kind, n: q.n, total: q.total})); } catch (e) { out.rings = 'n/a ' + e.message; } return out; }).catch(e => 'err ' + e.message) : null;
    r.insideArea = await inside();
    await hide();
    await shotBy('explorer_area1', () => document.getElementById('expcard'));
    // 2. the explorer's own search on BJR01 (zooms the plan to the reference)
    r.search = frame ? await frame.evaluate(() => { const i = [...document.querySelectorAll('input')].find(x => /WC69|asset number|search/i.test(x.placeholder || '')); if (!i) return 'no search box'; i.focus(); i.value = 'BJR01'; i.dispatchEvent(new Event('input', {bubbles: true})); i.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})); i.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter', bubbles: true})); return i.placeholder; }).catch(e => 'err ' + e.message) : 'no frame';
    await p.waitForTimeout(5000);
    r.hit = frame ? await frame.evaluate(() => { const b = [...document.querySelectorAll('button, a, li')].find(x => /^BJR01\b/.test((x.textContent || '').trim())); if (b) { b.click(); return (b.textContent || '').trim().slice(0, 60); } return 'no hit row'; }).catch(e => 'err ' + e.message) : null;
    await p.waitForTimeout(6000);
    r.insideSearch = await inside();
    await hide();
    await shotBy('explorer_marks', () => document.getElementById('expcard'));
    // 3. the same spot with nothing selected: every departed reference carries its own symbol, the ring and the count
    r.cleared = frame ? await frame.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /clear selection/i.test(x.textContent || '')); if (b) { b.click(); return 'cleared'; } return 'no clear button'; }).catch(e => 'err ' + e.message) : null;
    await p.waitForTimeout(4000);
    r.switchBox = await p.evaluate(() => { const l = document.querySelector('#map1147-controls .map1256-left'); if (!l) return 'no switch element'; return {hidden: l.hidden, display: getComputedStyle(l).display, visible: l.getBoundingClientRect().width > 0}; });
    await shotBy('explorer_noselect', () => document.getElementById('expcard'));
    r.pageErrors = h.errors.length; r.errorsSample = h.errors.slice(0, 3).map(e => String(e).slice(0, 160));
  } catch (e) { r.err = String(e).slice(0, 400); } finally { await h.browser.close(); }
  fs.writeFileSync(OUTDIR + '/explorer1261_' + tag + '.json', JSON.stringify(r, null, 1));
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(1); });
