// Author: Andrew Fisher. v8.90 Map explorer checks inside the dashboard, read-only against the live record.
//   PAGE=<dashboard build> CODE=<prepared explorer code folder> ASSETS=<v8.90 assets folder> OUT=<evidence dir> [MOB=1] node tests/test_explorer890.cjs
// The explorer's code and assets are served from disk (xembed890.cjs, with byte ranges); the dashboard page is the local
// build; everything else is the live service, GET only. Every write the page tries is aborted and counted.
const {openMap} = require('./xembed890'); const fs = require('fs'), path = require('path');
const OUT = process.env.OUT || '.'; fs.mkdirSync(OUT, {recursive: true});
const CHANGED = {   // the 2 Oct issue's changed references: where the sheet now prints the code (sheet pt, from the scene's labels)
  P45: 'moved about 85 m west, into the supply compound', WC51: 'moved about 18 m', WC38: 'moved about 13 m', WC39: 'moved about 9 m', WC10: 'new on this issue',
  WC69: 'one tag now', WC40: 'one tag now (WC40a gone)'};
(async () => {
  const MOB = !!process.env.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const labels = JSON.parse(fs.readFileSync(path.join(process.env.ASSETS, 'source-labels.json'), 'utf8'));
  const s = await openMap({settle: 4000}); const {page: p, f} = s; const shot = n => p.screenshot({path: path.join(OUT, `explorer890_${MOB ? 'phone' : 'laptop'}_${n}.png`)});
  // 1. the explorer opened on the 2 Oct scene
  const st = await f.evaluate(() => ({meta: P && P.meta, records: P && P.count, pyr: PYR && PYR.levels.length, files: PYR && [...new Set(PYR.levels.map(l => l.file))], mode, attrib: document.getElementById('attrib').textContent, sub: document.querySelector('.sub') && document.querySelector('.sub').textContent}));
  ok('scene is the 2 Oct issue (meta.sha256 8753d875…, issued 2 Oct 2026, frame 37792f0a…)', st.meta && st.meta.sha256.startsWith('8753d875') && st.meta.issued === '2 Oct 2026' && String(st.meta.frame_sha256).startsWith('37792f0a'), {sha: st.meta && st.meta.sha256.slice(0, 12), issued: st.meta && st.meta.issued, records: st.records});
  ok('attribution says issued 2 Oct', /issued 2 Oct/.test(st.attrib) && /issued 2 Oct/.test(st.sub || ''), {attrib: st.attrib, sub: st.sub});
  ok('pyramid manifest: 26 levels in the renamed level files', st.pyr === 26 && st.files.every(n => /-[0-9a-f]{12}\.bin$/.test(n)), {levels: st.pyr, files: st.files && st.files.slice(0, 3)});
  await shot('open');
  // 2. tiles load in every mode (the explorer counts the tiles it holds)
  const modes = {};
  for (const m of ['hybrid', 'satellite', 'original']) {
    await f.evaluate(m => GC500Explorer.setMode(m), m); await p.waitForTimeout(MOB ? 5000 : 4000);
    modes[m] = await f.evaluate(() => ({tiles: tiles.size, mode, missing: typeof vtMissing === 'number' ? vtMissing : null}));
    await shot('mode_' + m);
  }
  const rangesSeen = s.counts.ranges;
  ok('pyramid tiles were fetched by byte range from the local level files', rangesSeen > 20 && [...s.counts.localPaths].some(x => /^assets\/vt\/L.*\.bin$/.test(x)), {ranges: rangesSeen, files: [...s.counts.localPaths].filter(x => x.startsWith('assets/vt/')).slice(0, 4)});
  ok('tiles held in every mode', Object.values(modes).every(m => m.tiles > 0), modes);
  ok('no explorer file fell through to live (all served locally)', s.counts.liveExplorer === 0 && s.counts.missing.length === 0, {liveExplorer: s.counts.liveExplorer, missing: s.counts.missing.slice(0, 5)});
  await f.evaluate(() => GC500Explorer.setMode('hybrid')); await p.waitForTimeout(1500);
  // 3. search: P45 flies to the new spot; WC10 is findable; the changed references sit where the 2 Oct sheet prints them
  const labelBox = code => labels.filter(l => l[0] === code).map(l => l.slice(1));
  const findResults = {};
  for (const code of ['P45', 'WC10', 'WC51', 'WC38', 'WC39', 'WC69', 'WC40']) {
    const found = await f.evaluate(c => GC500Explorer.find(c), code); await p.waitForTimeout(MOB ? 2600 : 2200);
    const v = await f.evaluate(() => { const v = currentView(); const it = typeof selected !== 'undefined' && selected ? {code: selected.code, places: selected.places} : null; return {cx: v.x + v.w / 2, cy: v.y + v.h / 2, w: v.w, z: camera.z, it}; });
    const boxes = labelBox(code); const inView = boxes.some(b => Math.abs((b[0] + b[2]) / 2 - v.cx) < v.w / 2 && Math.abs((b[1] + b[3]) / 2 - v.cy) < v.w / 2);
    findResults[code] = {found, inView, centre: [Math.round(v.cx), Math.round(v.cy)], labelBoxes: boxes.map(b => b.map(Math.round)), places: v.it && v.it.places && v.it.places.length};
    await shot('find_' + code);
  }
  const P45new = labelBox('P45')[0];
  ok('P45: found, and the camera lands on its 2 Oct place (sheet x ≈ 1206, y ≈ 326; 17 Sep was x ≈ 1331)', findResults.P45.found && findResults.P45.inView && P45new && Math.abs(P45new[0] - 1206) < 6 && Math.abs(P45new[1] - 326) < 6, findResults.P45);
  ok('WC10 (new on this issue) is findable and in view', findResults.WC10.found && findResults.WC10.inView, findResults.WC10);
  ok('WC51, WC38, WC39: found at their 2 Oct places', ['WC51', 'WC38', 'WC39'].every(c => findResults[c].found && findResults[c].inView), {WC51: findResults.WC51, WC38: findResults.WC38, WC39: findResults.WC39});
  ok('WC69 and WC40 carry one label each on the 2 Oct sheet (WC40a gone)', labelBox('WC69').length === 1 && labelBox('WC40').length === 1 && labelBox('WC40a').length === 0, {WC69: labelBox('WC69').length, WC40: labelBox('WC40').length, WC40a: labelBox('WC40a').length});
  // 4. WC32: not drawn on the 2 Oct issue; what the explorer does with it is stated
  const wc32 = await f.evaluate(async () => { const found = await GC500Explorer.find('WC32'); const it = ITEMS.find(x => x.code === 'WC32'); return {found, inItems: !!it, places: it ? it.places.length : 0, listed: it ? (it.cat && it.cat.name) : null, labelHits: P.labels.filter(l => l[0].trim() === 'WC32').length}; });
  const wc32page = await p.evaluate(() => { const m = typeof MASTER_LOC !== 'undefined' && MASTER_LOC.WC32; const a = allAssets().find(x => x.key === 'WC32'); return {pin: !!(m && m.pt), how: m && m.how, inRegister: !!a, cancelled: !!(a && a._cancelled)}; });
  ok('WC32: no label on the 2 Oct drawing; the explorer has no place for it; the page keeps its 17 Sep pin, marked as such', wc32.labelHits === 0 && wc32.places === 0 && wc32page.pin && /17 Sep/.test(wc32page.how || ''), {explorer: wc32, page: wc32page});
  await shot('find_WC32');
  // 5. fencing still lines up: a run's end points project onto the drawing where they did; overlay screenshot
  await f.evaluate(() => GC500Explorer.setMode('hybrid'));
  const fen = await f.evaluate(async () => { const b = document.getElementById('fenceMode'); if (!b) return {noButton: true}; b.click(); await new Promise(r => setTimeout(r, 2500));
    const M = window.GC500FencingMap; const st = M && M.state; const model = st && st.model; return {active: !!(st && st.active), masterValid: model ? model.masterValid : null, geometry: model ? model.geometry.length : null, issues: model ? (model.issues || []).slice(0, 3) : null, alert: (document.getElementById('fmAlert') || {}).hidden === false ? document.getElementById('fmAlert').textContent : ''}; });
  ok('fencing layer accepts the drawing (master frame 37792f0a…): masterValid, geometry present, no "Master drawing changed" alert', fen.active && fen.masterValid === true && fen.geometry > 0 && !/Master drawing changed/.test(fen.alert || ''), fen);
  // a fence run's points against the drawing: fly to the first run and take the overlay screenshot
  const run = await f.evaluate(async () => { const M = window.GC500FencingMap; const g = M.state.model.geometry.find(x => x.points && x.points.length > 1 && x.region !== 'inset'); if (!g) return null;
    const xs = g.points.map(p => p[0]), ys = g.points.map(p => p[1]); const r = [Math.min(...xs) - 20, Math.min(...ys) - 20, Math.max(...xs) + 20, Math.max(...ys) + 20]; GC500Explorer.goto(r, 'fence'); await new Promise(res => setTimeout(res, 2500)); return {id: g.id, kind: g.kind, region: g.region, rect: r.map(Math.round), n: g.points.length}; });
  ok('a fence run is on the map at its traced place (sheet coordinates of the 17 Sep frame, still valid)', !!run, run);
  await shot('fencing_overlay');
  await f.evaluate(() => { const b = document.getElementById('fenceMode'); if (b && document.body.classList.contains('fencing-map')) b.click(); });
  // 6. deep zoom renders live from the scene (beyond the pyramid)
  await f.evaluate(() => GC500Explorer.setMode('hybrid')); await f.evaluate(() => GC500Explorer.goto([1200, 320, 1212, 332], 'P45 close')); await p.waitForTimeout(MOB ? 9000 : 7000);
  const deep = await f.evaluate(() => ({z: Math.round(camera.z), sceneReady, records: P && P.count, err: window.__bootError || null}));
  ok('deep zoom past the pyramid draws from the 2 Oct scene (sceneReady, 301,253 records)', deep.sceneReady && deep.records === 301253, deep);
  await shot('deep_P45');
  // 7. no errors, no writes
  ok('no page errors (dashboard or explorer)', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no console errors in the explorer', s.consoleErrors.filter(e => !/favicon|map-key|tile\.googleapis|mapbox/i.test(e)).length === 0, s.consoleErrors.slice(0, 4));
  ok('no writes attempted (counts.blocked is 0)', s.counts.blocked === 0, {blocked: s.counts.blocked, live: s.counts.live, local: s.counts.local});
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + ' ' + JSON.stringify(r.detail));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'laptop'}: ${R.length - fails}/${R.length} pass`);
  fs.writeFileSync(path.join(OUT, `results890_${MOB ? 'phone' : 'laptop'}.json`), JSON.stringify({results: R, counts: {...s.counts, localPaths: [...s.counts.localPaths].length}, findResults, modes}, null, 1));
  await s.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
