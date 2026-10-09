// dump the race car (model, livery decals, atlas bytes via a recording GL) and the circuit centreline, for the real-city showcase
const {chromium} = require('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright'); const fs = require('fs');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const page = await (await browser.newContext({viewport: {width: 1200, height: 700}})).newPage();
  await page.goto('http://127.0.0.1:8814/v/viewtokenviewtoken1/#progress', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  await page.click('#showStart'); await page.waitForTimeout(1500); await page.selectOption('#showBackdrop', 'circuit3d_day'); await page.waitForTimeout(9000);
  const r = await page.evaluate(() => { const G = GC3D, S = G.S;
    const model = G.raceCarModel('high'), decals = G.raceCarDecals();
    let atlas = null; const fake = {TEXTURE_2D: 1, R8: 2, RED: 3, UNSIGNED_BYTE: 4, LINEAR: 5, TEXTURE_MIN_FILTER: 6, TEXTURE_MAG_FILTER: 7, TEXTURE_WRAP_S: 8, TEXTURE_WRAP_T: 9, CLAMP_TO_EDGE: 10, createTexture: () => ({}), bindTexture() {}, texParameteri() {}, texImage2D(t, l, f, w, h, b, fm, ty, data) { atlas = {w, h, data: Array.from(data)}; }};
    G.raceCarAtlas(fake);
    const parts = (model.parts || model).map(p => ({name: p.name, material: p.material, wheel: p.wheel || null, color: p.color || null, v: Array.from(p.vertices), i: Array.from(p.indices)}));
    const dec = decals.map(p => ({name: p.name, material: p.material, color: p.color, v: Array.from(p.vertices), i: Array.from(p.indices)}));
    const cl = []; for (let s = 0; s < S.CL.L; s += 0.5) cl.push(S.CL.at(s));
    return {modelKeys: Object.keys(model), parts, dec, atlas, cl, L: S.CL.L, ring: DATA.circuit && DATA.circuit.ring || null, geoFrame: DATA.geoFrame, carS: S.tune.carS, deckH: S.tune.deckH, gridS: S.gridS, liv: G.raceCarLiveryInfo, mats: null};
  });
  fs.writeFileSync(__dirname + '/car_dump.json', JSON.stringify(r)); console.log(r.modelKeys, r.parts.length, r.dec.length, r.atlas && [r.atlas.w, r.atlas.h], r.cl.length, r.L, JSON.stringify(r.ring).slice(0,400), JSON.stringify(r.geoFrame).slice(0, 600), r.carS, r.gridS);
  console.log(JSON.stringify(r.parts.map(p => [p.name, p.material, p.v.length / 8, p.wheel])));
  await browser.close(); })();
