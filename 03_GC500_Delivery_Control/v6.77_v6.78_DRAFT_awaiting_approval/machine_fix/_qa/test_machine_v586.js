/* machine v5.86 checks — M1 (opening shot), M2 (load watchdog), M3 (download size, identical model), M4/M7 (wording).
   Runs against two local copies served by serve.js (same MIME table, extension allowlist and page CSP as the live /w/ route):
     node serve.js /tmp/claude-0/machine_audit/live 8771     (before: the live v5.85 files)
     node serve.js /tmp/claude-0/stage/machine 8772          (after: this set)
   node test_machine_v586.js > test_output.txt   — screenshots land in the set's root (the before, after and load-failure PNGs). */
const {chromium, devices} = require('/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/node_modules/playwright');
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const OUT = '/tmp/claude-0/stage/machine/', BEFORE = 'http://127.0.0.1:8771/index.html', AFTER = 'http://127.0.0.1:8772/index.html';
const ARGS = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const results = []; const check = (name, ok, detail) => { results.push({name, ok: !!ok}); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); };
const DESK = {viewport: {width: 1440, height: 900}}, PHONE = {viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent};

async function open(browser, url, ctxOpts, {route = null, wait = 'ready'} = {}) {
  const ctx = await browser.newContext(ctxOpts), page = await ctx.newPage(), logs = [], net = {bytes: 0, files: 0};
  page.on('pageerror', e => logs.push('PAGEERROR ' + String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') logs.push('console.error ' + m.text().slice(0, 200)); });
  page.on('response', async r => { try { const h = await r.allHeaders(); net.bytes += +(h['content-length'] || 0); net.files++; } catch (e) {} });
  if (route) await route(page);
  const t0 = Date.now(); await page.goto(url, {waitUntil: 'load', timeout: 180000});
  if (wait === 'ready') { await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 600000, polling: 1000}); net.readyMs = Date.now() - t0; net.readyBytes = net.bytes;
    await page.waitForFunction(() => !window.__cw.tween, null, {timeout: 120000, polling: 500}); }
  return {ctx, page, logs, net, t0};
}

/* THE OPENING SHOT: who stands between the camera and the car. Rays from the eye to a grid over the car (its footprint on the
   dyno, 4.8 × 2 m, 0–1.2 m high: the front face toward the camera and the centre plane); a ray that meets a person first
   (body, vest or his 0.62 m picking box — the strict test) is blocked. Also: every person's projected box against the car's. */
async function openingShot(page) {
  return page.evaluate(async () => {
    const T = await import('./vendor/three.module.js'), C = await import('./crew.js'), cam = __cw.camera, crew = __cw.crew; cam.updateMatrixWorld(); crew.root.updateMatrixWorld(true);
    const roots = new Map(Object.entries(crew.men).map(([k, m]) => [m.fig.root, k]));
    const who = o => { for (let p = o; p && p !== crew.root; p = p.parent) if (roots.has(p)) return roots.get(p); return null; };
    const ray = new T.Raycaster(), P = new T.Vector3(), d = new T.Vector3(), blocked = {}; let n = 0, nb = 0;
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 6; j++) for (const z of [0, 1.0 * Math.sign(cam.position.z || 1)]) {
      P.set(-2.4 + 4.8 * i / 12, .05 + 1.1 * j / 6, z); d.subVectors(P, cam.position); const L = d.length(); d.normalize(); ray.set(cam.position, d); ray.far = L; n++;
      const hit = ray.intersectObject(crew.root, true).find(h => who(h.object)); if (hit) { nb++; const k = who(hit.object); blocked[k] = (blocked[k] || 0) + 1; } }
    const proj = (x, y, z) => new T.Vector3(x, y, z).project(cam);
    const rect = (x0, x1, y0, y1, z0, z1) => { const a = [9, 9, -9, -9]; let dist = 1e9; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const v = proj(x, y, z); a[0] = Math.min(a[0], v.x); a[1] = Math.min(a[1], v.y); a[2] = Math.max(a[2], v.x); a[3] = Math.max(a[3], v.y); dist = Math.min(dist, cam.position.distanceTo(new T.Vector3(x, y, z))); } return {a, dist}; };
    const car = rect(-2.4, 2.4, 0, 1.2, -1, 1), area = (car.a[2] - car.a[0]) * (car.a[3] - car.a[1]), people = {};
    for (const [k, m] of Object.entries(crew.men)) { const q = rect(m.pos.x - .3, m.pos.x + .3, 0, 1.85, m.pos.z - .3, m.pos.z + .3);
      const ov = Math.max(0, Math.min(q.a[2], car.a[2]) - Math.max(q.a[0], car.a[0])) * Math.max(0, Math.min(q.a[3], car.a[3]) - Math.max(q.a[1], car.a[1]));
      people[k] = {x: +m.pos.x.toFixed(2), z: +m.pos.z.toFixed(2), post: m.post.kind, overlapPct: +(100 * ov / area).toFixed(1), inFrontOfCar: q.dist < car.dist + 1.2}; }
    const standing = Object.entries(crew.men).filter(([, m]) => m.post.kind !== 'sit'); let minGap = Infinity, pair = '';
    for (let a = 0; a < standing.length; a++) for (let b = a + 1; b < standing.length; b++) { const g = Math.hypot(standing[a][1].pos.x - standing[b][1].pos.x, standing[a][1].pos.z - standing[b][1].pos.z); if (g < minGap) { minGap = g; pair = standing[a][0] + '/' + standing[b][0]; } }
    const personOpacity = k => { let lo = 1, hi = 0; crew.men[k].fig.root.traverse(o => { if (o.isMesh && o.material && !(o.material.visible === false)) for (const m of [].concat(o.material)) { lo = Math.min(lo, m.opacity); hi = Math.max(hi, m.opacity); } }); return [+lo.toFixed(2), +hi.toFixed(2)]; };
    const vest = __cw.scene.getObjectByName('Safety officer hi-vis vest');
    return {camera: cam.position.toArray().map(v => +v.toFixed(2)), rays: n, blockedRays: nb, blockedBy: blocked, people, minGap: +minGap.toFixed(2), minGapPair: pair,
      faded: __cw.dyno.faded, fadedPeople: Object.keys(crew.men).filter(k => personOpacity(k)[0] < .99), vestOpacity: vest ? [].concat(vest.material)[0].opacity : null, safetyOpacity: personOpacity('safety'),
      text: {count: document.querySelector('#count').textContent, status: document.querySelector('#status-text').textContent, chips: [...document.querySelectorAll('#rings .connection span')].map(e => e.textContent), note: document.querySelector('#model-note') && document.querySelector('#model-note').textContent, telemetry: document.querySelector('.telemetry span').textContent}};
  });
}

/* THE MODEL, compared as data: the page's own buildModel() (before: the plain GLB; after: the gzipped meshopt GLB, unpacked and
   decoded in the browser) hashed over every geometry's positions, normals, UVs and triangles (a triangle keyed from its lowest
   index, so a rotation that keeps the winding hashes the same) — and the studio light's decoded floats. */
async function modelHash(page) {
  return page.evaluate(async () => {
    const M = await import('./model.js'), m = await M.buildModel({decodeImages: false});
    let h = 2166136261 >>> 0, n = 0; const mix = u32 => { for (let i = 0; i < u32.length; i++) { h ^= u32[i]; h = Math.imul(h, 16777619) >>> 0; } n += u32.length; };
    const seen = new Set();
    m.root.traverse(o => { if (!o.isMesh || seen.has(o.geometry)) return; seen.add(o.geometry); const g = o.geometry;
      for (const k of ['position', 'normal', 'uv']) { const at = g.getAttribute(k); if (!at) { mix([k.length]); continue; } const a = at.array; if (a instanceof Float32Array) mix(new Uint32Array(a.buffer, a.byteOffset, a.length)); else mix(Array.from(a, v => Math.fround(v) * 1e6 | 0)); }
      if (!g.index) return; const ix = g.index.array, t = new Uint32Array(ix.length); for (let i = 0; i < ix.length; i += 3) { const a = ix[i], b = ix[i + 1], c = ix[i + 2], mn = Math.min(a, b, c); const r = mn === a ? [a, b, c] : mn === b ? [b, c, a] : [c, a, b]; t[i] = r[0]; t[i + 1] = r[1]; t[i + 2] = r[2]; } mix(t);
      mix(new Uint32Array(g.groups.flatMap(x => [x.start, x.count, x.materialIndex]))); });
    /* the studio light as each page ships it: after, the gzipped file unpacked by the browser; before, the plain file */
    let e = 2166136261 >>> 0; const env = await (async () => { const pk = await fetch('./assets/machine/studio.hdr.gz.bin'); const b = pk.ok ? await new Response(pk.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer() : await fetch('./assets/machine/studio.hdr').then(r => r.arrayBuffer()); const t = M.decodeHDR(b); const f = new Uint32Array(t.image.data.buffer); for (let i = 0; i < f.length; i++) { e ^= f[i]; e = Math.imul(e, 16777619) >>> 0; } return e.toString(16); })();
    return {geometries: seen.size, words: n, hash: h.toString(16), parts: m.parts.length, materials: m.materials.length, hdrHash: env};
  });
}

/* THE MODEL, compared as pixels: the cockpit view (the cog is the steering wheel) rendered once with the animation loop stopped and
   the crew hidden, read back from a render target; the canvas screenshot is kept for the eye. */
async function cogRender(page, file) {
  await page.click('[data-view="cog"]'); await page.waitForTimeout(1500);
  await page.waitForFunction(() => !window.__cw.tween, null, {timeout: 180000, polling: 500}); await page.waitForTimeout(3000);
  const px = await page.evaluate(async () => {
    const T = await import('./vendor/three.module.js'), r = __cw.renderer; r.setAnimationLoop(null); __cw.crew.root.visible = false;
    const w = 960, h = 600, rt = new T.WebGLRenderTarget(w, h, {type: T.UnsignedByteType}); const cam = __cw.camera.clone(); cam.aspect = w / h; cam.updateProjectionMatrix();
    r.setRenderTarget(rt); r.render(__cw.scene, cam); const buf = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    /* the cog's own pixels: a second pass with only the meshes built from coates-23.glb (model.js marks them userData.surface), flat white */
    const hidden = [], bg = __cw.scene.background, white = new T.MeshBasicMaterial({color: 0xffffff}); __cw.scene.traverse(o => { if (o.isMesh && o.visible && !Array.isArray(o.userData.surface)) { o.visible = false; hidden.push(o); } });
    __cw.scene.background = new T.Color(0); __cw.scene.overrideMaterial = white; r.render(__cw.scene, cam); const mask = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, mask);
    __cw.scene.overrideMaterial = null; __cw.scene.background = bg; hidden.forEach(o => o.visible = true);
    for (let i = 0; i < buf.length; i += 4) buf[i + 3] = mask[i] > 127 ? 255 : 0;   /* alpha carries the cog mask */
    r.setRenderTarget(null); r.render(__cw.scene, __cw.camera); rt.dispose();
    let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(s);
  });
  await page.screenshot({path: file, timeout: 240000});
  return Buffer.from(px, 'base64');
}

function glbImageBytes(file) { const b = fs.readFileSync(file), jl = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jl)), v = j.bufferViews[j.images[0].bufferView]; return b.subarray(20 + jl + 8 + (v.byteOffset || 0), 20 + jl + 8 + (v.byteOffset || 0) + v.byteLength); }

const px = {};
function pixelChecks() {
  const cmp = (A, B) => { let diff = 0, maxd = 0, cogPx = 0, cogDiff = 0, cogMax = 0;
      for (let i = 0; i < A.length; i += 4) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])), cog = A[i + 3] === 255 || B[i + 3] === 255;
        if (cog) cogPx++; if (d > 0) { diff++; if (cog) { cogDiff++; cogMax = Math.max(cogMax, d); } } maxd = Math.max(maxd, d); }
      return {framePixelsDiffering: diff, frameMaxChannelDiff: maxd, cogPixels: cogPx, cogPixelsDiffering: cogDiff, cogMaxChannelDiff: cogMax}; };
    const ctl = cmp(px.before, px.control), m3 = cmp(px.before, px.m3only), ab = cmp(px.before, px.after);
    check('M3 (control): the cockpit render is deterministic — live vs live loaded again', ctl.framePixelsDiffering === 0, ctl);
    check('M3: the compressed model renders pixel-identical to live — this set with only the live crew.js restored (whole frame, cog and all)', m3.cogPixels > 5000 && m3.framePixelsDiffering === 0, m3);
    console.log('INFO pixels, live vs this whole set (incl. the moved safety officer): ' + JSON.stringify(ab) + ' — the crew are hidden for the render, but the garage reflection map is baked at start-up with the crew in it, so moving the officer changes reflections; the model-only comparison above is the M3 proof'); 
}
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ARGS});
  const shots = {};
  /* ---------------------------------------------------------------- BEFORE (live v5.85) and AFTER, laptop 1440 × 900 */
  /* a control for the pixel comparison: the live build loaded a second time must render the cockpit identically (it does: the
     render is deterministic). The garage is baked into the reflection map at start-up with the crew standing in it, so the
     model is compared with the rest of the scene held equal: this set with the live crew.js put back. */
  { const s = await open(browser, BEFORE, DESK); await s.page.waitForTimeout(4000); px.control = await cogRender(s.page, OUT + '_qa/cog_render_before_again.png'); await s.ctx.close(); }
  /* and this set with only the live crew.js put back: the crew stand where v5.85 had them when the garage is baked into the reflections */
  { const s = await open(browser, AFTER, DESK, {route: p => p.route('**/crew.js', r => r.fulfill({path: '/tmp/claude-0/machine_audit/live/crew.js', contentType: 'text/javascript; charset=utf-8'}))}); await s.page.waitForTimeout(4000); px.m3only = await cogRender(s.page, OUT + '_qa/cog_render_after_with_live_crew.png'); await s.ctx.close(); }
  if (process.argv[2] === 'pixels') { const s = await open(browser, BEFORE, DESK); await s.page.waitForTimeout(4000); px.before = await cogRender(s.page, OUT + '_qa/cog_render_before.png'); await s.ctx.close();
    const t = await open(browser, AFTER, DESK); await t.page.waitForTimeout(4000); px.after = await cogRender(t.page, OUT + '_qa/cog_render_after.png'); await t.ctx.close(); }
  if (process.argv[2] === 'pixels') { pixelChecks(); await browser.close(); return; }
  for (const [tag, url] of [['before', BEFORE], ['after', AFTER]]) {
    const s = await open(browser, url, DESK); await s.page.waitForTimeout(4000);
    await s.page.screenshot({path: OUT + tag + '_first_view.png', timeout: 240000});
    const o = await openingShot(s.page); console.log(tag.toUpperCase() + ' 1440x900 opening', JSON.stringify(o));
    console.log(tag.toUpperCase() + ' first open: ' + s.net.files + ' responses, ' + s.net.readyBytes + ' bytes (content-length) to ready, ready in ' + s.net.readyMs + ' ms');
    shots[tag] = {desk: o, net: s.net};
    shots[tag].model = await modelHash(s.page); console.log(tag.toUpperCase() + ' model', JSON.stringify(shots[tag].model));
    px[tag] = await cogRender(s.page, OUT + '_qa/cog_render_' + tag + '.png');
    await s.ctx.close();
    check(tag + ': no page errors on first open', s.logs.filter(l => /PAGEERROR/.test(l)).length === 0, s.logs.slice(0, 5));
  }
  const b = shots.before.desk, a = shots.after.desk;
  check('before (evidence): a person blocks the opening shot', b.blockedRays > 0, {blockedRays: b.blockedRays, by: b.blockedBy});
  check('before (evidence): the safety officer\'s vest is ghosted on its own', b.vestOpacity !== null && b.vestOpacity < .9 && b.safetyOpacity[1] > .99, {vest: b.vestOpacity, person: b.safetyOpacity});
  check('after 1440x900: no person between the camera and the car', a.blockedRays === 0 && Object.values(a.people).every(p => !(p.inFrontOfCar && p.overlapPct > 0)), {blockedRays: a.blockedRays, of: a.rays, people: a.people});
  check('after 1440x900: nobody faded in the opening shot (nobody in the way)', a.fadedPeople.length === 0, a.fadedPeople);
  check('after 1440x900: standing crew not overlapping (min gap > 0.6 m)', a.minGap > .6, a.minGap + ' m ' + a.minGapPair);
  check('after: wording', a.text.count === '310 / 310 parts fitted' && a.text.status === 'Ready to run' && a.text.chips.every(c => c === 'Fitted') && a.text.note === 'Interactive illustration — not a performance measure' && a.text.telemetry === 'COG SPEED', a.text);
  /* M3 */
  check('M3: first-open download reduced', shots.after.net.readyBytes < shots.before.net.readyBytes * .4, {before: shots.before.net.readyBytes, after: shots.after.net.readyBytes});
  check('M3: the model the page builds is identical (geometry hash)', shots.before.model.hash === shots.after.model.hash && shots.before.model.geometries === shots.after.model.geometries, {before: shots.before.model, after: shots.after.model});
  check('M3: the studio light decodes identically', shots.before.model.hdrHash === shots.after.model.hdrHash);
  check('M3: the artwork PNG inside the GLB is byte-identical', Buffer.compare(glbImageBytes('/tmp/claude-0/machine_audit/live/assets/machine/coates-23.glb'), glbImageBytes(OUT + 'assets/machine/coates-23.glb')) === 0);
  pixelChecks();

  /* ---------------------------------------------------------------- AFTER: running, the people fade, the patrol */
  { const s = await open(browser, AFTER, DESK); await s.page.waitForTimeout(3000);
    /* a person put in the way fades as one — the lead at the corner the officer used to stand on (waits on the ~1 fps software renderer) */
    const op = k => s.page.evaluate(k => { let lo = 1, hi = 0, n = 0; __cw.crew.men[k].fig.root.traverse(o => { if (o.isMesh && o.material && o.material.visible !== false) for (const m of [].concat(o.material)) { lo = Math.min(lo, m.opacity); hi = Math.max(hi, m.opacity); n++; } }); return {lo: +lo.toFixed(2), hi: +hi.toFixed(2), meshes: n}; }, k);
    await s.page.evaluate(() => __cw.crew.men.lead.place(-4.8, 2.6, Math.atan2(4.8, -2.6))); let t1 = Date.now();
    const faded = await s.page.waitForFunction(() => { let hi = 0; __cw.crew.men.lead.fig.root.traverse(o => { if (o.isMesh && o.material && o.material.visible !== false) for (const m of [].concat(o.material)) hi = Math.max(hi, m.opacity); }); return hi < .5; }, null, {timeout: 240000, polling: 500}).then(() => true, () => false);
    const f1 = {lead: await op('lead'), safety: await op('safety'), seconds: (Date.now() - t1) / 1000}; await s.page.screenshot({path: OUT + '_qa/after_person_in_the_way_fades.png', timeout: 240000});
    check('M1: a person between the camera and the car fades as one figure (every mesh of him ghosted)', faded && f1.lead.hi < .5, f1);
    await s.page.evaluate(() => __cw.crew.men.lead.place(-3.75, -3.05, Math.atan2(3.75, 3.05))); t1 = Date.now();
    const back = await s.page.waitForFunction(() => { let lo = 1; __cw.crew.men.lead.fig.root.traverse(o => { if (o.isMesh && o.material && o.material.visible !== false) for (const m of [].concat(o.material)) lo = Math.min(lo, m.opacity); }); return lo > .99; }, null, {timeout: 240000, polling: 500}).then(() => true, () => false);
    check('M1: out of the way again, he is solid again', back, {seconds: (Date.now() - t1) / 1000, lead: await op('lead')});
    await s.page.click('#start'); await s.page.evaluate(() => __cw.advance(3, 1 / 30, () => __cw.drive.running));
    await s.page.evaluate(() => { const t = document.querySelector('#throttle'); t.value = 80; t.dispatchEvent(new Event('input', {bubbles: true})); __cw.advance(4, 1 / 30); });
    await s.page.waitForTimeout(6000); await s.page.screenshot({path: OUT + 'after_running.png', timeout: 240000});
    const run = await s.page.evaluate(() => ({running: __cw.drive.running, dashRpm: Math.round(__cw.powertrain.rpm), label: document.querySelector('.telemetry span').textContent, cogSpeed: document.querySelector('#engine-rpm').textContent, status: document.querySelector('#status-text').textContent}));
    console.log('RUNNING', JSON.stringify(run));
    check('M7: while the V8 runs the overlay reads Cog speed, not an engine speed', run.running && run.label === 'COG SPEED', run);
    /* the safety officer, sampled through the run: never half-faded (his vest ghosted without him, the v5.85 bug) */
    { const sf = []; for (let k = 0; k < 6; k++) { sf.push(await op('safety')); await s.page.waitForTimeout(2000); } check('M1: the safety officer is never half-faded (vest and body together)', sf.every(x => x.hi - x.lo < .05), sf); }
    /* stop, then two simulated minutes of patrol: never inside a footprint; how long he stands on the opening line */
    await s.page.click('#start'); await s.page.evaluate(() => __cw.advance(6, 1 / 30, () => __cw.drive.stationary && !__cw.drive.running));
    const pat = await s.page.evaluate(async () => { const C = await import('./crew.js'), m = __cw.crew.men.safety, eye = [-7.61, 3.88], tgt = [.14, 0]; let inside = 0, onLine = 0, n = 0; const stops = new Set();
      const segD = (p) => { const dx = tgt[0] - eye[0], dz = tgt[1] - eye[1], t = Math.max(0, Math.min(1, ((p[0] - eye[0]) * dx + (p[1] - eye[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(p[0] - eye[0] - t * dx, p[1] - eye[1] - t * dz); };
      for (let k = 0; k < 240; k++) { __cw.advance(.5, 1 / 30); n++; const p = [m.pos.x, m.pos.z]; if (C.OBSTACLES.some(b => p[0] > b[0] && p[0] < b[2] && p[1] > b[1] && p[1] < b[3])) inside++; if (segD(p) < .45) onLine++; if (!m.path) stops.add(p.map(v => v.toFixed(1)).join(',')); }
      return {samples: n, insideFootprint: inside, secondsOnOpeningLine: onLine / 2, stops: [...stops]}; });
    console.log('PATROL (120 s simulated)', JSON.stringify(pat));
    check('M1: the officer\'s patrol never enters a floor footprint and does not stop on the opening line', pat.insideFootprint === 0 && !pat.stops.includes('-4.8,2.6'), pat);
    check('after: no page errors while running / fading / patrolling', s.logs.filter(l => /PAGEERROR/.test(l)).length === 0, s.logs.slice(0, 5));
    await s.ctx.close(); }

  /* ---------------------------------------------------------------- phone 390 × 844, before and after */
  for (const [tag, url] of [['before', BEFORE], ['after', AFTER]]) {
    const s = await open(browser, url, PHONE); await s.page.waitForTimeout(4000);
    await s.page.screenshot({path: OUT + tag + '_first_view_390x844.png', timeout: 240000});
    const o = await openingShot(s.page); console.log(tag.toUpperCase() + ' 390x844 opening', JSON.stringify(o));
    if (tag === 'before') check('before 390x844 (evidence): a person blocks the opening shot', o.blockedRays > 0, {blockedRays: o.blockedRays, by: o.blockedBy});
    else { check('after 390x844: no person between the camera and the car', o.blockedRays === 0 && Object.values(o.people).every(p => !(p.inFrontOfCar && p.overlapPct > 0)), {blockedRays: o.blockedRays, of: o.rays});
      check('after 390x844: nobody faded, crew not overlapping', o.fadedPeople.length === 0 && o.minGap > .6, {faded: o.fadedPeople, minGap: o.minGap}); }
    check(tag + ' 390x844: no page errors', s.logs.filter(l => /PAGEERROR/.test(l)).length === 0, s.logs.slice(0, 5));
    await s.ctx.close(); }

  /* ---------------------------------------------------------------- M2: a file that fails, a file that never comes */
  const fb = async page => page.evaluate(() => ({shown: !document.querySelector('#fallback').hidden, loading: !document.querySelector('#loading').hidden, text: document.querySelector('#fallback p').textContent, button: document.querySelector('#retry').textContent, status: document.querySelector('#status-text').textContent}));
  { /* 1. a module that fails to load (crew.js aborted): straight to the fallback */
    const s = await open(browser, AFTER, DESK, {wait: 'none', route: p => p.route('**/crew.js', r => r.abort('failed'))});
    await s.page.waitForFunction(() => !document.querySelector('#fallback').hidden, null, {timeout: 60000, polling: 250}); const ms = Date.now() - s.t0, st = await fb(s.page);
    await s.page.screenshot({path: OUT + 'load_failure_fallback.png', timeout: 240000});
    check('M2: a module that fails to load shows the fallback at once (' + ms + ' ms)', st.shown && !st.loading && st.button === 'Try again' && ms < 20000, st);
    /* Try again: the file is back, the page reloads and builds */
    await s.page.unroute('**/crew.js'); await Promise.all([s.page.waitForEvent('load', {timeout: 60000}), s.page.click('#retry')]);
    await s.page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 600000, polling: 1000});
    check('M2: Try again reloads and the car builds once the file is there', await s.page.evaluate(() => __cw.ready && document.querySelector('#fallback').hidden));
    await s.ctx.close(); }
  { /* 2. the model download 404s (packed and plain): the app's own catch, same fallback, same button */
    const s = await open(browser, AFTER, DESK, {wait: 'none', route: p => p.route(/coates-23\.glb/, r => r.fulfill({status: 404, body: '{}'}))});
    await s.page.waitForFunction(() => !document.querySelector('#fallback').hidden, null, {timeout: 300000, polling: 500}); const st = await fb(s.page);
    check('M2: a model that 404s shows the fallback with Try again (' + (Date.now() - s.t0) + ' ms)', st.shown && st.button === 'Try again', st);
    await s.ctx.close(); }
  { /* 3. the studio light never arrives (both packed and plain hang): the watchdog, 40 s after the last file arrived */
    const s = await open(browser, AFTER, DESK, {wait: 'none', route: p => p.route(/studio\.hdr/, () => {})});
    await s.page.waitForFunction(() => !document.querySelector('#fallback').hidden, null, {timeout: 300000, polling: 500}); const ms = Date.now() - s.t0, st = await fb(s.page);
    const lastFile = await s.page.evaluate(() => Math.round(Math.max(...performance.getEntriesByType('resource').map(e => e.responseEnd))));
    await s.page.screenshot({path: OUT + 'watchdog_fallback.png', timeout: 240000});
    check('M2: a hung download falls back via the watchdog (' + ms + ' ms after navigation; last file at ' + lastFile + ' ms)', st.shown && !st.loading && st.button === 'Try again' && /too long/.test(st.text), st);
    await s.ctx.close(); }

  await browser.close();
  const failed = results.filter(r => !r.ok); console.log('\nSUMMARY: ' + (results.length - failed.length) + ' / ' + results.length + ' passed' + (failed.length ? '; FAILED: ' + failed.map(f => f.name).join(' | ') : ''));
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error('TEST CRASH', e); process.exit(2); });
