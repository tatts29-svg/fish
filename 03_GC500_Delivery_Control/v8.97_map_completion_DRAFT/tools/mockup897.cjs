// Author: Andrew Fisher. v8.97 mock-up: real screenshots of the Map explorer inside the dashboard, read-only against the live record.
// The page (local build) is served at the live address; the explorer's code and assets, and the page's not-yet-uploaded pictures, from disk.
// Every write the page tries is aborted. No $ figure is on a map view; the script checks the visible text of every shot for one.
//   PAGE=<v8.97 build> CODE=<patched explorer code> ASSETS=<v8.93 assets> MEDIA=<v8.93 pictures dir> OUT=<dir> [MOB=1] [REDUCED=1] node tools/mockup897.cjs
const {openMap} = require('../tests/open_map897.cjs');
const fs = require('fs'), path = require('path');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'gc500-map897-preview'), MOB = !!process.env.MOB, REDUCED = !!process.env.REDUCED, W = MOB ? 'phone' : 'laptop'; fs.mkdirSync(OUT, {recursive: true});
const log = []; let session;
(async () => {
  const s = session = await openMap({settle: 4000}); const {page: p, f} = s;
  if (REDUCED) await p.emulateMedia({reducedMotion: 'reduce'});
  await f.waitForFunction(() => window.GC500Explorer897, null, {timeout: 30000});
  await f.evaluate(() => GC500Explorer897.pull());
  const money = async () => { const a = await p.evaluate(() => document.body.innerText), b = await f.evaluate(() => document.body.innerText); return /\$\s?\d/.test(a + b); };
  const shot = async (name, note) => { const file = path.join(OUT, `mockup897_${W}${REDUCED ? '_reduced' : ''}_${name}.png`); const dollars = await money();
    if (dollars) throw new Error('Screenshot refused: visible financial figure');
    await p.screenshot({path: file});
    const st = await f.evaluate(() => ({complete: GC500Explorer897.state, marks: __marksCount(), chip: (document.querySelector('#chips .chip[aria-pressed="true"]') || {}).textContent || '', q: document.getElementById('q').value}));
    log.push({shot: path.basename(file), note, dollars, ...st}); console.log(path.basename(file), dollars ? 'HAS $ FIGURE' : 'no $', JSON.stringify(st).slice(0, 300)); };
  const chip = async name => { await f.evaluate(name => { document.querySelectorAll('#chips .chip').forEach(x => x.setAttribute('aria-pressed', 'false')); const b = [...document.querySelectorAll('#chips .chip[data-cat]')].find(x => x.textContent.trim().startsWith(name)); b.setAttribute('aria-pressed', 'true'); showCategory(b.dataset.cat); }, name); await p.waitForTimeout(MOB ? 3500 : 3000); };
  const pick = async code => { await f.evaluate(c => selectCode(c, 0, true), code); await p.waitForTimeout(MOB ? 3200 : 2800); };
  const drawer = async on => { await f.evaluate(on => panel813(on), on); await p.waitForTimeout(600); };
  await f.evaluate(() => GC500Explorer.setMode('original')); await p.waitForTimeout(1500);
  // 1. buildings: the category rings every building (a mix of complete and not), one completed result picked
  await chip('Portable buildings'); if (MOB) await drawer(false); await p.waitForTimeout(800);
  await shot('buildings_all', 'Portable buildings chip on: every building ringed, ticks on the complete ones');
  await pick('P12'); if (MOB) await drawer(false); await p.waitForTimeout(800);
  await shot('buildings_P12_selected', 'P12 (complete) picked: stronger ring and pulse, tick, card with ✓ Complete');
  if (MOB) {
    await f.evaluate(() => document.querySelector('#xcard [data-xclose]')?.click());
    await shot('buildings_P12_ring', 'P12 selected with its card closed: category rings retained, lower-right completion tick and selection pulse');
  }
  if (!REDUCED) {
    // 2. a not-complete result for comparison (P45, Off site)
    await pick('P45'); if (MOB) await drawer(false); await p.waitForTimeout(800);
    await shot('buildings_P45_not_complete', 'P45 (off site) picked: ring, label and card, no tick');
    // 3. toilets: a green ring with the tick
    await chip('Toilets & amenities'); if (MOB) await drawer(false); await pick('WC05'); if (MOB) await drawer(false); await p.waitForTimeout(800);
    await shot('toilets_WC05_selected', 'Toilets chip on, WC05 (complete) picked: the tick on a green ring');
    // 4. the one Complete tick the Timeline holds for review: no tick
    await pick('WC31'); if (MOB) await drawer(false); await p.waitForTimeout(800);
    await shot('toilets_WC31_review', 'WC31: Complete recorded but the Timeline says Review required: no tick, no ✓ Complete');
    // 5. the rows: a search ("Gate") with a mix, and the category list
    await f.evaluate(() => { GC500Explorer864.clear(); }); await p.waitForTimeout(400);
    if (MOB) await drawer(true);
    await f.evaluate(() => { const q = document.getElementById('q'); q.value = 'Gate'; search(); }); await p.waitForTimeout(900);
    await shot('rows_search_gate', 'Search "Gate": result rows, ✓ Complete on the complete ones');
    await f.evaluate(() => { const q = document.getElementById('q'); q.value = ''; search(); }); await p.waitForTimeout(300);
    await chip('Portable buildings'); if (MOB) await drawer(true); await f.evaluate(() => { const L = document.getElementById('findList'); L.scrollTop = 0; });
    await p.waitForTimeout(600);
    await shot('rows_category_buildings', 'Portable buildings list: ✓ Complete on the complete rows');
    if (MOB) await drawer(false);
    // 6. the Done layer on: its badge stands, no second tick
    await f.evaluate(() => { if (!DONE782_ON) document.getElementById('done782').click(); }); await pick('P12'); if (MOB) await drawer(false); await p.waitForTimeout(800);
    await shot('done_layer_on_P12', 'Optional Done layer on: its centre badge stands, no second tick');
    await f.evaluate(() => { if (DONE782_ON) document.getElementById('done782').click(); }); await p.waitForTimeout(300);
    // 7. lighting: after v8.94 the drawing-only D024 symbols have left the register
    const light = await f.evaluate(() => { const q = document.getElementById('q'); q.value = 'light'; search(); const rows = [...document.querySelectorAll('#results [data-code]')].map(b => b.textContent.trim().slice(0, 80)); const chips = [...document.querySelectorAll('#chips .chip[data-cat]')].map(b => b.textContent.trim()); q.value = ''; search(); return {rows, chips}; });
    log.push({lighting: light}); console.log('lighting search rows:', JSON.stringify(light.rows), 'chips:', JSON.stringify(light.chips));
  }
  const errors = s.errors.slice(0, 5), mediaServed = s.counts.mediaServed; const result = {author: 'Andrew Fisher', width: W, reduced: REDUCED, shots: log, mediaServed, blocked: s.counts.blocked, local: s.counts.local, liveExplorer: s.counts.liveExplorer, missing: s.counts.missing.slice(0, 5), errors, consoleErrors: s.consoleErrors};
  fs.writeFileSync(path.join(OUT, `mockup897_${W}${REDUCED ? '_reduced' : ''}.json`), JSON.stringify(result, null, 1));
  console.log('done', W, REDUCED ? 'reduced motion' : '', 'media served', mediaServed, 'blocked', s.counts.blocked, 'errors', errors.length, 'live explorer requests', s.counts.liveExplorer, 'dollars in any shot:', log.some(x => x.dollars));
  process.exitCode = errors.length || s.consoleErrors.length || s.counts.blocked || s.counts.liveExplorer || s.counts.missing.length || log.some(x => x.dollars) ? 1 : 0;
})().catch(e => { console.error('FAIL', e.stack); process.exitCode = 2; }).finally(async () => { if (session) await session.browser.close(); });
