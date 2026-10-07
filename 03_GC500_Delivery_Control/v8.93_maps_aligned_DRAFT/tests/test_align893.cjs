// Author: Andrew Fisher. v8.93 alignment: every map works off the 2 Oct master and lines up the same way everywhere.
// The dashboard page (local build) at the live address, reading the live record with GET only; the Map explorer's code
// and assets, the page's new pictures and the 3D proof's files served from disk. Every write the page tries is aborted.
//   PAGE=<v8.93 build> CODE=<v8.93 explorer code> ASSETS=<v8.93 assets> MEDIA=<v8.93 media dir> POC3D=<dir with units3d.json>
//   OUT=<evidence dir> [MOB=1] node tests/test_align893.cjs
const {open} = require('../../v8.90_explorer_master_DRAFT/tests/xembed890.cjs');
const fs = require('fs'), path = require('path');
const here = __dirname, OUT = process.env.OUT || '.'; fs.mkdirSync(OUT, {recursive: true});
const C93 = JSON.parse(fs.readFileSync(path.join(here, '..', 'changes893.json'), 'utf8'));
const C89 = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'v8.89_master_map_DRAFT', 'changes889.json'), 'utf8'));
const LABELS = JSON.parse(fs.readFileSync(path.join(process.env.ASSETS, 'source-labels.json'), 'utf8'));
const PW = 2384, PH = 1684, PX = 2600, PY = 1837, M_PER_PT = 0.7056;
const SEP17 = {CP1: [0.90642, 0.76348], WC81: [0.90659, 0.74246], T0265: [0.89304, 0.85273]};        // the 17 Sep inset positions
const FLAGGED = ['P60', 'P62', 'P63', 'WC48', 'WC49', 'WC51', 'WC81'];                                  // the first diff's "not shifted with the rest"
const MOVED = ['P45', 'WC38', 'WC39', 'WC51', 'WC10'];
const TYPES = {'.json': 'application/json; charset=utf-8', '.html': 'text/html; charset=utf-8', '.webp': 'image/webp'};
const labelBoxes = code => LABELS.filter(l => l[0].trim().toUpperCase() === code.toUpperCase()).map(l => l.slice(1));
function offPt(pt, boxes) {   // distance (sheet pt) from a picture fraction to the nearest label box; 0 inside
  const x = pt[0] * PW, y = pt[1] * PH; let best = null;
  for (const b of boxes) { const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); const d = Math.hypot(dx, dy); if (best === null || d < best) best = d; }
  return best;
}
(async () => {
  const MOB = !!process.env.MOB, R = [], ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page; let mediaServed = 0, pocServed = 0;
  await p.route('**/m/Coates-GC500-2026/*.webp', async route => { const f = path.join(process.env.MEDIA || '', path.basename(new URL(route.request().url()).pathname));
    if (process.env.MEDIA && fs.existsSync(f)) { mediaServed++; return route.fulfill({status: 200, contentType: 'image/webp', body: fs.readFileSync(f)}); } return route.fallback(); });
  await p.route('**/w/Coates-GC500-2026/poc3d/**', async route => { const rel = new URL(route.request().url()).pathname.split('/poc3d/')[1].split('?')[0] || 'index.html'; const f = path.join(process.env.POC3D || '', rel);
    if (process.env.POC3D && fs.existsSync(f)) { pocServed++; return route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f)}); } return route.fallback(); });
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined' && typeof MASTER_LOC === 'object' && SYNC && SYNC.status === 'live', null, {timeout: 150000}); await p.waitForTimeout(2000);
  const shot = n => p.screenshot({path: path.join(OUT, `align893_${MOB ? 'phone' : 'laptop'}_${n}.png`)});
  // ---- 1. the page: picture, pins, pictures, navigation
  const pg = await p.evaluate(async ({C93, SEP17}) => {
    const out = {}; const d1 = DATA.sheets.find(x => x.key === 'D001');
    out.sheet = d1.src && JSON.stringify(d1.src).includes(C93.sheet_media.sha256); out.sheetUrl = String(DATA.media[C93.sheet_media.sha256] || '');
    const load = src => new Promise(res => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.onerror = () => res(null); im.src = src; });
    out.sheetPx = await load(out.sheetUrl);
    out.inset = Object.fromEntries(Object.entries(SEP17).map(([k, v]) => [k, {pt: MASTER_LOC[k].pt, back: Math.abs(MASTER_LOC[k].pt[0] - v[0]) < 2e-5 && Math.abs(MASTER_LOC[k].pt[1] - v[1]) < 2e-5}]));
    out.pins = Object.keys(MASTER_LOC).length; out.imgKnown = Object.values(MASTER_LOC).every(v => (v.img || []).every(sha => typeof DATA.media[sha] === 'string'));
    out.oldSheetGone = !(C93.previous_sheet_sha256 in DATA.media) && !('d0df399ee0f4adb179772cddaec164db1be0c026aac10473883d1211a5afc567' in DATA.media);
    const thumbs = {}; for (const k of ['P45', 'WC81', 'CP1', 'WC51', 'P60']) { const im = MASTER_LOC[k].img || []; thumbs[k] = [await load(DATA.media[im[0]]), await load(DATA.media[im[1]])]; } out.thumbs = thumbs;
    const nav = {}; for (const k of ['P45', 'WC51', 'WC38', 'WC39', 'WC10', 'CP1', 'WC81', 'T0265', 'P60', 'WC48']) { const f = masterFixFor(k); nav[k] = {ll: MASTER_LOC[k].ll, fix: f ? [f.lat, f.lon] : null, unit: MASTER_LOC[k].prec === 'unit'}; } out.nav = nav;
    const snap = gc500FencingMapSnapshot(); out.fencing = {geometry: (snap.geometry || []).length, masters: [...new Set((snap.geometry || []).map(g => String(g.master_sha256).slice(0, 12)))]};
    return out; }, {C93, SEP17});
  ok('D001 picture is the v8.93 render of the aligned scene (2600 x 1837) and the v8.89 / 17 Sep pictures left the media list', pg.sheet && pg.sheetPx && pg.sheetPx[0] === 2600 && pg.sheetPx[1] === 1837 && pg.oldSheetGone, {sheet: pg.sheet, px: pg.sheetPx, url: pg.sheetUrl.slice(-30)});
  ok('CP1, T0265 and WC81 are back on their 17 Sep positions (the inset did not move on the paper)', Object.values(pg.inset).every(x => x.back), pg.inset);
  ok('every pin picture is in the media list; close-ups 771 x 491 and context pictures 937 x 613 load', pg.imgKnown && Object.values(pg.thumbs).every(t => t[0] && t[0][0] === 771 && t[0][1] === 491 && t[1] && t[1][0] === 937 && t[1][1] === 613), {thumbs: pg.thumbs, served: mediaServed});
  ok('navigation pins as v8.89 set them: P45, WC51, WC38, WC39 and WC10 on the 2 Oct master, every other pin as live (masterFixFor = ll for every unit-tagged pin; T0265 is a label, not a tag, so it has no master fix, as on live)', Object.entries(pg.nav).every(([k, v]) => v.unit ? (v.fix && v.fix[0] === v.ll[0] && v.fix[1] === v.ll[1]) : v.fix === null) && MOVED.every(k => JSON.stringify(pg.nav[k].ll) === JSON.stringify(C89.master_loc[k].ll)), pg.nav);
  ok('page-side fencing geometry still binds to the 17 Sep frame (37792f0a...)', pg.fencing.geometry > 0 && pg.fencing.masters.length === 1 && pg.fencing.masters[0] === '37792f0a9d32', pg.fencing);
  // ---- 2. the MASTER sheet: every marker where the page draws it, read against the 2 Oct tags
  await p.evaluate(() => { go('map'); state.sheet = 'MASTER'; state.zoom = 1; state.ox = 0; state.oy = 0; renderMap(); }); await p.waitForTimeout(MOB ? 3500 : 2500);
  const readMarkers = () => p.evaluate(() => { const out = {}; document.querySelectorAll('#pane-map button.mk[data-label]').forEach(b => { const lab = b.dataset.label; const fx = parseFloat(b.style.left) / 100, fy = parseFloat(b.style.top) / 100; const r = b.getBoundingClientRect(); const par = b.offsetParent ? b.offsetParent.getBoundingClientRect() : null;
      out[lab] = out[lab] || []; out[lab].push({fx, fy, shown: r.width > 0, dom: par && par.width > 0 ? [(r.left + r.width / 2 - par.left) / par.width, (r.top + r.height / 2 - par.top) / par.height] : null, cls: b.className}); }); return {sheet: state.sheet, markers: out}; });
  const master = await readMarkers(); await shot('master_sheet');
  const tagPins = Object.entries(C89.master_loc).map(([k]) => k);
  const refs = {}; const allTag = await p.evaluate(() => Object.entries(MASTER_LOC).filter(([k, v]) => String(v.how || '').startsWith('tag on the unit')).map(([k]) => k).sort());
  const sample = allTag.filter((k, i) => i % 9 === 0);
  const checkList = [...new Set([...Object.keys(SEP17), ...FLAGGED, ...MOVED, ...sample])];
  const pts = await p.evaluate(keys => Object.fromEntries(keys.map(k => [k, MASTER_LOC[k] ? {pt: MASTER_LOC[k].pt, how: MASTER_LOC[k].how} : null])), checkList);
  let domAgree = 0, domSeen = 0;
  for (const k of checkList) {
    const m = (master.markers[k] || [])[0], info = pts[k]; if (!m || !info) { refs[k] = {missing: true}; continue; }
    const boxes = labelBoxes(k); const isTag = String(info.how).startsWith('tag on the unit');
    const off = boxes.length ? offPt([m.fx, m.fy], boxes) : null;
    if (m.dom) { domSeen++; if (Math.abs(m.dom[0] - m.fx) < 0.004 && Math.abs(m.dom[1] - m.fy) < 0.004) domAgree++; }
    refs[k] = {marker: [m.fx, m.fy], sheet_pt: [Math.round(m.fx * PW * 10) / 10, Math.round(m.fy * PH * 10) / 10], label_boxes: boxes.length, off_pt: off === null ? null : Math.round(off * 100) / 100, off_m: off === null ? null : Math.round(off * M_PER_PT * 10) / 10,
      on_label: off !== null ? off <= 1.0 : null, tag: isTag, matches_data: Math.abs(m.fx - info.pt[0]) < 1e-5 && Math.abs(m.fy - info.pt[1]) < 1e-5, drawn: m.shown};
  }
  const tagRefs = Object.entries(refs).filter(([k, r]) => r.tag && r.label_boxes > 0 && k !== 'WC32');
  ok(`MASTER markers sit exactly where MASTER_LOC puts them (${checkList.length} references read from the DOM)`, Object.values(refs).every(r => !r.missing && r.matches_data), Object.fromEntries(Object.entries(refs).filter(([k, r]) => r.missing || !r.matches_data)));
  ok(`every checked tag pin is on its 2 Oct tag (${tagRefs.length} with a tag: the inset pins, the flagged set, the moved set and every 9th tag pin)`, tagRefs.every(([k, r]) => r.on_label), Object.fromEntries(tagRefs.filter(([k, r]) => !r.on_label)));
  ok('the inset cluster: WC81 on its tag, P68 tag beside it, CP1 (leader line from D022, no tag) and T0265 (OP42 label) back where the 17 Sep issue had them', refs.WC81 && refs.WC81.on_label && offPt(refs.WC81.marker, labelBoxes('P68')) < 15 && offPt(refs.T0265.marker, labelBoxes('OP42')) <= 1.0 && refs.CP1 && refs.CP1.matches_data, {WC81: refs.WC81, CP1: refs.CP1, T0265: refs.T0265, P68_from_WC81_pt: Math.round(offPt(refs.WC81.marker, labelBoxes('P68')) * 10) / 10});
  ok('the first diff\'s flagged references (P60, P62, P63, WC48, WC49, WC51, WC81) each sit on their 2 Oct tag', FLAGGED.every(k => refs[k] && refs[k].on_label), Object.fromEntries(FLAGGED.map(k => [k, refs[k]])));
  ok('marker positions on screen agree with their data (bounding boxes against style, for the markers laid out)', domSeen > 0 && domAgree === domSeen, {seen: domSeen, agree: domAgree});
  // ---- 3. the D001 sheet: sector labels and gates on their 2 Oct text
  await p.evaluate(() => { state.sheet = 'D001'; state.zoom = 1; state.ox = 0; state.oy = 0; renderMap(); }); await p.waitForTimeout(MOB ? 3000 : 2000);
  const d001 = await readMarkers(); await shot('d001_sheet');
  const secs = {}; for (const [lab, arr] of Object.entries(d001.markers)) { if (!/^S\d\d[A]?$/.test(lab)) continue; const boxes = labelBoxes(lab); if (!boxes.length) continue; const off = offPt([arr[0].fx, arr[0].fy], boxes); secs[lab] = Math.round(off * 100) / 100; }
  const gates = {}; for (const [lab, arr] of Object.entries(d001.markers)) { if (!/^G\d+[a-zA-Z]?$/.test(lab)) continue; const boxes = labelBoxes(lab); if (!boxes.length) continue; gates[lab] = Math.round(Math.min(...arr.map(m => offPt([m.fx, m.fy], boxes))) * 100) / 100; }
  ok(`D001 sector labels sit on their 2 Oct text (${Object.keys(secs).length} sectors, all within 1 pt)`, Object.keys(secs).length >= 18 && Object.values(secs).every(v => v <= 1.0), secs);
  ok(`D001 gate markers sit on their 2 Oct gate text (${Object.keys(gates).length} gates with text on the 2 Oct sheet)`, Object.keys(gates).length >= 8 && Object.values(gates).every(v => v <= 1.0), gates);
  // ---- 4. the explorer: modes, the inset pins, plan items, and the picture against the explorer's own render
  await p.evaluate(() => { state.sheet = SAT_EXPLORER; state.zoom = 1; renderMap(); }); const fh = await p.waitForSelector('#pane-map iframe', {timeout: 30000}); const f = await fh.contentFrame();
  await f.waitForFunction(() => window.GC500Explorer && GC500Explorer.state && GC500Explorer.state.ready && window.__ready, null, {timeout: 150000}); await p.waitForTimeout(MOB ? 4000 : 3000);
  const st = await f.evaluate(() => ({sha: P && P.meta && P.meta.sha256, frame: P && P.meta && P.meta.frame_sha256, clip: P && P.meta && P.meta.window_clip, records: P && P.count, levels: PYR && PYR.levels.length, files: PYR && [...new Set(PYR.levels.map(l => l.file))]}));
  ok('explorer scene is the 2 Oct issue in the 17 Sep frame with the v8.93 window clip; pyramid files carry the v8.93 token', st.sha && st.sha.startsWith('8753d875') && String(st.frame).startsWith('37792f0a') && /v8\.93/.test(st.clip || '') && st.records === 301253 && st.files && st.files.every(n => n.includes(C93.explorer_token || '-')), {sha: st.sha && st.sha.slice(0, 12), records: st.records, levels: st.levels, files: st.files && st.files.slice(0, 2)});
  const modes = {}; for (const m of ['hybrid', 'satellite', 'original']) { await f.evaluate(m => GC500Explorer.setMode(m), m); await p.waitForTimeout(MOB ? 4500 : 3500); modes[m] = await f.evaluate(() => ({tiles: tiles.size, mode})); }
  ok('tiles held in every explorer mode', Object.values(modes).every(m => m.tiles > 0), modes);
  const plan = JSON.parse(fs.readFileSync(path.join(process.env.ASSETS, 'plan_items.json'), 'utf8')); const pi = k => (plan.items || []).find(i => i.key === k);
  ok('plan_items.json (Plan on satellite in its own window) carries the v8.93 pins: inset trio at 17 Sep, WC10 placed, P45 at its 2 Oct place', Object.entries(SEP17).every(([k, v]) => pi(k) && Math.abs(pi(k).pt[0] - v[0]) < 2e-5) && pi('WC10') && pi('P45') && Math.abs(pi('P45').pt[0] - C89.master_loc.P45.pt[0]) < 2e-5, {CP1: pi('CP1') && pi('CP1').pt, WC81: pi('WC81') && pi('WC81').pt, T0265: pi('T0265') && pi('T0265').pt, WC10: pi('WC10') && pi('WC10').pt, items: (plan.items || []).length});
  const finds = {}; for (const k of ['WC81', 'P45', 'WC10']) { const found = await f.evaluate(c => GC500Explorer.find(c), k); await p.waitForTimeout(MOB ? 2600 : 2200);
    const v = await f.evaluate(() => { const v = currentView(); return {cx: v.x + v.w / 2, cy: v.y + v.h / 2, w: v.w}; }); const boxes = labelBoxes(k); finds[k] = {found, inView: boxes.some(b => Math.abs((b[0] + b[2]) / 2 - v.cx) < v.w / 2 && Math.abs((b[1] + b[3]) / 2 - v.cy) < v.w / 2), centre: [Math.round(v.cx), Math.round(v.cy)]}; }
  ok('explorer search lands on WC81 (inset), P45 and WC10 where the 2 Oct sheet prints them', Object.values(finds).every(x => x.found && x.inView), finds);
  // the page picture against the explorer's own render of the same window: main plan and inset (Original plan mode)
  await f.evaluate(() => GC500Explorer.setMode('original'));
  const agree = {};
  for (const [name, rect] of Object.entries({main: [300, 300, 1100, 860], inset: [1490, 880, 2330, 1460]})) {
    await f.evaluate(r => GC500Explorer.goto(r, 'alignment check'), rect); await p.waitForTimeout(MOB ? 7000 : 6000);
    const canvas = await f.evaluate(() => { const v = currentView(); const c = document.getElementById('display'); return {view: v, w: c.width, h: c.height, url: c.toDataURL('image/png')}; });
    const cmp = await p.evaluate(async ({canvas, sheetUrl}) => {
      const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
      const [ex, pic] = await Promise.all([load(canvas.url), load(sheetUrl)]);
      const W = 480, H = Math.round(W * canvas.h / canvas.w); const gray = (im, sx, sy, sw, sh) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(im, sx, sy, sw, sh, 0, 0, W, H); const d = g.getImageData(0, 0, W, H).data; const a = new Float32Array(W * H); for (let i = 0; i < W * H; i++) a[i] = 0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2]; return a; };
      const v = canvas.view; const A = gray(ex, 0, 0, canvas.w, canvas.h), B = gray(pic, v.x * 2600 / 2384, v.y * 1837 / 1684, v.w * 2600 / 2384, v.h * 1837 / 1684);
      const mean = a => a.reduce((s, x) => s + x, 0) / a.length; const ma = mean(A), mb = mean(B);
      let best = null; const S = 12;
      for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) { let num = 0, da = 0, db = 0; for (let y = S; y < H - S; y += 2) for (let x = S; x < W - S; x += 2) { const a = A[y * W + x] - ma, b = B[(y + dy) * W + (x + dx)] - mb; num += a * b; da += a * a; db += b * b; } const r = num / Math.sqrt(da * db || 1); if (!best || r > best.r) best = {dx, dy, r}; }
      let r0 = 0; { let num = 0, da = 0, db = 0; for (let y = S; y < H - S; y += 2) for (let x = S; x < W - S; x += 2) { const a = A[y * W + x] - ma, b = B[y * W + x] - mb; num += a * b; da += a * a; db += b * b; } r0 = num / Math.sqrt(da * db || 1); }
      const picPxPerSample = (v.w * 2600 / 2384) / W;
      return {best, r0, shift_picture_px: [Math.round(best.dx * picPxPerSample * 10) / 10, Math.round(best.dy * picPxPerSample * 10) / 10], sample_px: Math.round(picPxPerSample * 100) / 100, W, H}; }, {canvas, sheetUrl: pg.sheetUrl});
    agree[name] = cmp; fs.writeFileSync(path.join(OUT, `align893_${MOB ? 'phone' : 'laptop'}_explorer_${name}.png`), Buffer.from(canvas.url.split(',')[1], 'base64'));
  }
  ok('the page picture and the explorer render agree: best correlation at (0, 0) for the main plan and for the inset (within one sample, under 3 picture px)', Object.values(agree).every(a => a.best && Math.abs(a.best.dx) <= 1 && Math.abs(a.best.dy) <= 1 && a.best.r > 0.5), agree);
  await shot('explorer_inset');
  // ---- 5. the 3D proof's unit list
  const poc = await p.evaluate(async () => { try { const r = await fetch('/w/Coates-GC500-2026/poc3d/units3d.json', {cache: 'no-store'}); const j = await r.json(); const by = Object.fromEntries(j.pins.map(x => [x.k, x])); return {n: j.pins.length, WC10: by.WC10 || null, P45: by.P45 && by.P45.ll, WC51: by.WC51 && by.WC51.ll, WC38: by.WC38 && by.WC38.ll, WC39: by.WC39 && by.WC39.ll, CP1: by.CP1 && by.CP1.ll, source: j.source}; } catch (e) { return {error: String(e)}; } });
  const same = (a, b) => a && b && Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
  ok('3D proof units: WC10 added from the 2 Oct drawing; P45, WC51, WC38, WC39 follow the 2 Oct master (v8.89 ll); CP1 unchanged', poc.n === 261 && poc.WC10 && same(poc.WC10.ll, C89.master_loc.WC10.ll) && /2 Oct/.test(poc.WC10.note || '') && ['P45', 'WC51', 'WC38', 'WC39'].every(k => same(poc[k], C89.master_loc[k].ll)) && same(poc.CP1, C89.master_loc.CP1.ll), {n: poc.n, WC10: poc.WC10, served: pocServed, error: poc.error});
  // ---- 6. nothing written, nothing broken
  ok('no page errors (dashboard or explorer)', s.errors.length === 0, s.errors.slice(0, 4));
  const bad = (s.counts.badResponses || []).filter(u => !/favicon/.test(u));
  ok('no failed requests (every 4xx/5xx listed)', bad.length === 0, {bad: bad.slice(0, 6)});
  ok('no writes attempted (counts.blocked is 0); explorer served locally', s.counts.blocked === 0 && s.counts.liveExplorer === 0 && s.counts.missing.length === 0, {blocked: s.counts.blocked, liveExplorer: s.counts.liveExplorer, missing: s.counts.missing.slice(0, 5), local: s.counts.local, mediaServed});
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + ' ' + JSON.stringify(r.detail).slice(0, 900));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'laptop'}: ${R.length - fails}/${R.length} pass`);
  fs.writeFileSync(path.join(OUT, `results893_${MOB ? 'phone' : 'laptop'}.json`), JSON.stringify({results: R, refs, secs, gates, agree, finds, modes, poc, counts: {...s.counts, localPaths: [...s.counts.localPaths].length}}, null, 1));
  await s.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
