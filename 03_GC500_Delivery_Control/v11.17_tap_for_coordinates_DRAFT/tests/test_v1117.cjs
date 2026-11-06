/* Author: Andrew Fisher. v11.17 checks: Map explorer press-and-hold coordinates and the share picture. GET only (every
   write is aborted); the record is compared before and after.
     PAGE=build/GC500_v11.17/GC500_Delivery_Control_hosted.html node tests/test_v1117.cjs        (desktop)
     MOB=1 PAGE=... node tests/test_v1117.cjs                                                      (phone) */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', mobile = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence', (live ? 'live-' : '') + (mobile ? 'phone' : 'desktop'));
fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 400))); };
const KNOWN = {WC16: [-27.985974, 153.427681], P01: [-27.983447, 153.42658]};
const metres = (a, b) => Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180));
(async () => {
 const h = await open({pageFile, hash: '#sheet/__explorer', mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1});
 const p = h.page; let frame;
 const shot = async name => { await p.screenshot({path: path.join(out, (mobile ? 'phone-' : 'desktop-') + name + '.png')}); };
 const settle = async () => { await frame.waitForFunction(() => (typeof gotoAnim887 === 'undefined' || gotoAnim887 === 0) && zAnim === 0, null, {timeout: 15000}).catch(() => {}); await frame.waitForFunction(() => inflight.size === 0 && queue.size === 0 && vtQueue.size === 0 && vtInflight.size === 0, null, {timeout: 60000}).catch(() => {}); await p.waitForTimeout(700); };
 /* a reference may be labelled in more than one place on the sheet (a tag and its leader, an inset copy); the place
    nearest its recorded pin is the one that stands for it */
 const PLACE = `(k, known) => { const it = ITEMS.find(x => x.code === k); if (!it || !it.places.length) return null; let best = null;
   for (const b of it.places) { const x = (b[0] + b[2]) / 2, y = (b[1] + b[3]) / 2; const ll = GC500Spot1117.sheetToLL(x, y); const d = known && ll ? Math.hypot((ll.lat - known[0]) * 111320, (ll.lon - known[1]) * 111320 * Math.cos(known[0] * Math.PI / 180)) : 0; if (!best || d < best.d) best = {x, y, d, ll}; } return best; }`;
 const centreOf = key => frame.evaluate(([k, known, PLACE]) => { const b = eval(PLACE)(k, known); if (!b) return null; const c = applyM(sheetToDevice(fitScale * camera.z, sw, sh), b.x, b.y); return {x: b.x, y: b.y, cx: c.x, cy: c.y}; }, [key, KNOWN[key] || null, PLACE]);
 const look = async (key, z) => { await frame.evaluate(([k, known, z, PLACE]) => { const b = eval(PLACE)(k, known); camera = {...camera, cx: b.x, cy: b.y, z}; if (typeof changeView === 'function') changeView(); else requestPaint(); }, [key, KNOWN[key] || null, z, PLACE]); await settle(); };
 const stageBox = async () => { const el = await frame.frameElement(); const fb = await el.boundingBox(); const sb = await frame.evaluate(() => { const r = stage.getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; }); return {x: fb.x + sb.x, y: fb.y + sb.y, w: sb.w, h: sb.h}; };
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.17'));
  await p.waitForFunction(() => typeof EXP !== 'undefined' && EXP.frame && EXP.frame.contentWindow && EXP.frame.contentWindow.__ready, null, {timeout: 180000});
  frame = p.frames().find(f => /\/explorer\/index\.html(?:\?|$)/.test(f.url()));
  await frame.evaluate(() => GC500Explorer.ready);
  await frame.waitForFunction(() => !!window.GC500Spot1117, null, {timeout: 20000}).catch(() => {});
  await frame.waitForFunction(() => !!GEO, null, {timeout: 60000}).catch(() => {});

  /* page side */
  const pg = await p.evaluate(() => ({layer: !!window.gc500SpotLayer1117 && gc500SpotLayer1117.version, one: document.querySelectorAll('#spot1117-script').length, again: gc500SpotLayer1117.mount(document.getElementById('expFrame'))}));
  check('page: layer present, one script, a second mount does not inject twice', pg.layer === 'v11.17' && pg.one === 1 && pg.again === true, pg);
  const other = await p.evaluate(() => { const d = document.getElementById('expFrame').contentDocument, s = d.querySelector('script[src="explorer-fix887.js?v=6996471a6a0f"]'); if (!s) return 'no script'; s.setAttribute('src', 'explorer-fix887.js?v=other'); const r = gc500SpotLayer1117.mount(document.getElementById('expFrame')); s.setAttribute('src', 'explorer-fix887.js?v=6996471a6a0f'); return r; });
  check('page: another explorer build (one script changed) is refused', other === false, other);
  const fr0 = await frame.evaluate(() => ({mounted: !!window.GC500Spot1117, scripts: document.querySelectorAll('#spot1117-script').length, geo: !!GEO, state: GC500Spot1117 && GC500Spot1117.state}));
  check('frame: layer mounted once, registration loaded, no pin yet', fr0.mounted && fr0.scripts === 1 && fr0.geo && fr0.state.pin === null && !fr0.state.card, fr0);

  /* the maths: a reference's drawn tag lands on its recorded pin (P01 exactly; across every pinned reference the tags
     sit where the record has them, the odd tag a few metres from its pin being the drawing's, not the layer's) */
  const r1 = await frame.evaluate(([k, known, PLACE]) => { const b = eval(PLACE)(k, known); return b && b.ll && [b.ll.lat, b.ll.lon]; }, ['P01', KNOWN.P01, PLACE]);
  check('maths: P01 tag centre -> its recorded pin within 0.5 m', r1 && metres(r1, KNOWN.P01) < 0.5, r1 && {got: r1, known: KNOWN.P01, off_m: metres(r1, KNOWN.P01).toFixed(2)});
  const pins = await p.evaluate(() => Object.fromEntries(Object.entries(S.places || {}).filter(([k, v]) => v && Number.isFinite(v.lat) && Number.isFinite(v.lon)).map(([k, v]) => [k, [v.lat, v.lon]])));
  const stats = await frame.evaluate(([pins, PLACE]) => { const offs = []; for (const [k, known] of Object.entries(pins)) { const b = eval(PLACE)(k, known); if (b && b.ll) offs.push([k, +b.d.toFixed(2)]); } offs.sort((a, b) => a[1] - b[1]); const d = offs.map(x => x[1]); return {n: d.length, median: d.length ? d[Math.floor(d.length / 2)] : null, within2: d.filter(x => x <= 2).length, worst: offs.slice(-5)}; }, [pins, PLACE]);
  check('maths: across the recorded pins the tags land on them (median under 1 m, most within 2 m)', stats.n >= 20 && stats.median !== null && stats.median <= 1 && stats.within2 / stats.n >= 0.7, stats);

  /* drop at a screen point: the pin, the card, the words */
  await look('P01', mobile ? 7 : 9);
  const c = await centreOf('P01');
  const d1 = await frame.evaluate(c => { const pin = GC500Spot1117.drop(c.cx, c.cy); return {pin: pin && {lat: pin.ll.lat, lon: pin.ll.lon, near: pin.near}, state: GC500Spot1117.state, words: GC500Spot1117.words(), card: document.getElementById('spot1117').hidden === false, ll: document.querySelector('#spot1117 [data-sp-ll]').textContent, nearTxt: document.querySelector('#spot1117 [data-sp-near]').textContent}; }, c);
  check('drop: pin lands on P01 to 0.5 m and names P01 first', d1.pin && metres([d1.pin.lat, d1.pin.lon], KNOWN.P01) < 0.5 && d1.pin.near[0] && d1.pin.near[0].code === 'P01' && d1.pin.near[0].d < 3, d1.pin);
  check('drop: the card shows the coordinates to six decimals and "at P01"', d1.card && /^-27\.\d{6}, 153\.\d{6}$/.test(d1.ll) && /^at P01/.test(d1.nearTxt) && d1.state.card && d1.state.pinShown, {ll: d1.ll, near: d1.nearTxt});
  check('words: coordinates, nearest references, a Maps link and the accuracy line', /^GC500 spot: -27\.\d{6}, 153\.\d{6}\n.*P01.*\nhttps:\/\/maps\.google\.com\/\?q=-27\.\d{6},153\.\d{6}\nOff the plan on satellite/.test(d1.words), d1.words);
  await settle(); await shot('pin-p01');
  const vis = await frame.evaluate(() => { const el = document.getElementById('spot1117pin'), c = document.getElementById('spot1117'); const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform); const y = m ? +m[2] : NaN; return {y, clearTo: sh - c.offsetHeight - 24, shown: el.style.display === 'block'}; });
  check('drop: the pin is in view above the card', vis.shown && vis.y < vis.clearTo, vis);

  /* the picture */
  const pic = await frame.evaluate(async () => { const b = await GC500Spot1117.picture(); if (!b) return null; const bm = await createImageBitmap(b); const buf = new Uint8Array(await b.arrayBuffer()); return {size: b.size, type: b.type, w: bm.width, h: bm.height, b64: btoa(Array.from(buf.slice(0, 200000), x => String.fromCharCode(x)).join(''))}; });
  check('picture: a PNG 1080 x 1270 of a sensible size', pic && pic.type === 'image/png' && pic.w === 1080 && pic.h === 1270 && pic.size > 30000, pic && {size: pic.size, w: pic.w, h: pic.h});
  if (pic && pic.size <= 200000) fs.writeFileSync(path.join(out, (mobile ? 'phone-' : 'desktop-') + 'share-picture.png'), Buffer.from(pic.b64, 'base64'));
  else if (pic) { const full = await frame.evaluate(async () => { const b = await GC500Spot1117.picture(); const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192)); return btoa(s); }); fs.writeFileSync(path.join(out, (mobile ? 'phone-' : 'desktop-') + 'share-picture.png'), Buffer.from(full, 'base64')); }

  /* share: through a share sheet that takes files; through one that takes text only; with none (copy + save) */
  const sh = await frame.evaluate(async () => { const rec = {}; const o1 = navigator.share, o2 = navigator.canShare; let r = {};
   try { Object.defineProperty(navigator, 'share', {configurable: true, value: async d => { rec.files = d; }}); Object.defineProperty(navigator, 'canShare', {configurable: true, value: () => true}); r.files = await GC500Spot1117.share();
    Object.defineProperty(navigator, 'canShare', {configurable: true, value: () => false}); Object.defineProperty(navigator, 'share', {configurable: true, value: async d => { rec.text = d; }}); const od = URL.createObjectURL; URL.createObjectURL = () => 'blob:stub'; r.text = await GC500Spot1117.share(); URL.createObjectURL = od;
   } finally { Object.defineProperty(navigator, 'share', {configurable: true, value: o1}); Object.defineProperty(navigator, 'canShare', {configurable: true, value: o2}); }
   return {r, filesPayload: rec.files && {n: rec.files.files.length, type: rec.files.files[0].type, name: rec.files.files[0].name, text: rec.files.text, title: rec.files.title}, textPayload: rec.text && {hasFiles: !!rec.text.files, text: rec.text.text}}; });
  check('share: a share sheet that takes files gets the PNG and the words', sh.r.files === 'files' && sh.filesPayload && sh.filesPayload.n === 1 && sh.filesPayload.type === 'image/png' && /^GC500-spot-/.test(sh.filesPayload.name) && /^GC500 spot:/.test(sh.filesPayload.text), sh);
  check('share: a text-only share sheet gets the words and the picture is saved', sh.r.text === 'text' && sh.textPayload && !sh.textPayload.hasFiles && /maps\.google\.com/.test(sh.textPayload.text), sh);

  /* gestures: press and hold drops; a tap does not; a drag does not; the click after a hold picks nothing */
  await frame.evaluate(() => { GC500Spot1117.clear(); selected = null; try { clearSelection813(); } catch (e) {} });
  const sb = await stageBox();
  const hx = sb.x + sb.w * 0.5, hy = sb.y + sb.h * 0.42;
  await p.mouse.move(hx, hy); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up(); await p.waitForTimeout(250);
  const g1 = await frame.evaluate(() => ({state: GC500Spot1117.state, selected: selected && selected.code}));
  check('gesture: press and hold drops the pin and opens the card; nothing selected underneath', g1.state.pin && g1.state.card && !g1.selected, g1);
  await settle(); await shot('hold');
  await frame.evaluate(() => GC500Spot1117.clear());
  await p.mouse.move(hx + 60, hy + 40); await p.mouse.down(); await p.waitForTimeout(120); await p.mouse.up(); await p.waitForTimeout(300);
  const g2 = await frame.evaluate(() => GC500Spot1117.state);
  check('gesture: a short tap does not drop a pin', !g2.pin && !g2.card, g2);
  await p.mouse.move(hx, hy); await p.mouse.down(); await p.mouse.move(hx + 40, hy + 30, {steps: 6}); await p.waitForTimeout(900); await p.mouse.up(); await p.waitForTimeout(300);
  const g3 = await frame.evaluate(() => GC500Spot1117.state);
  check('gesture: a drag (pan) does not drop a pin', !g3.pin && !g3.card, g3);
  if (!mobile) { await p.mouse.click(hx - 80, hy + 60, {button: 'right'}); await p.waitForTimeout(300); const g4 = await frame.evaluate(() => GC500Spot1117.state); check('gesture: a right-click drops the pin', g4.pin && g4.card, g4); }
  /* the pin follows the camera */
  await frame.evaluate(() => GC500Spot1117.drop(sw / 2, sh / 2 - 120)); await settle();
  const before1 = await frame.evaluate(() => { const el = document.getElementById('spot1117pin'); return el.style.transform; });
  await frame.evaluate(() => { camera = {...camera, cx: camera.cx + 40}; if (typeof changeView === 'function') changeView(); else requestPaint(); }); await settle();
  const after1 = await frame.evaluate(() => { const el = document.getElementById('spot1117pin'); return el.style.transform; });
  check('pin: moves with the map', before1 !== after1, {before1, after1});
  /* clear */
  await frame.evaluate(() => document.querySelector('#spot1117 [data-sp="clear"]').click());
  const g5 = await frame.evaluate(() => GC500Spot1117.state);
  check('card: Clear removes the pin and hides the card', !g5.pin && !g5.card && !g5.pinShown, g5);

  /* a last look for the evidence folder: the pin near the Gate 5 buildings */
  await look('P60', mobile ? 7 : 9); const c2 = await centreOf('P60');
  await frame.evaluate(c => GC500Spot1117.drop(c.cx + 30, c.cy - 20), c2); await settle(); await shot('pin-p60');

  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the whole run', before === after);
  check('no page errors', h.errors.length === 0, h.errors);
  check('no writes attempted', h.counts.blocked === 0, h.counts);
 } catch (e) { check('run completed', false, String(e && e.stack || e).slice(0, 800)); }
 fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({author: 'Andrew Fisher', page: live ? 'live' : pageFile, mobile, passed: results.length - failed, failed, results}, null, 1));
 console.log('test_v1117: ' + (results.length - failed) + ' passed, ' + failed + ' failed');
 try { await h.browser.close(); } catch (e) {}
 process.exit(failed ? 1 : 0);
})();
