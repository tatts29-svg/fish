/* Author: Andrew Fisher. Servicing sheets: the master-plan pictures, rendered READ ONLY from the live page's Map explorer.

   Andrew, 18 Oct 2026: "a picture of location on the master map. With a circle around the area. And even a master map
   with a print of the different areas."

   It opens the page with the shared harness (toolchain/harness/open_page.js): the page file is served locally at the live
   address and every other request is a GET to the live service; every write the page tries is aborted. It switches the
   explorer to "Original plan" (the D001 master plan, no satellite), points the camera at each place and uses the
   explorer's own PNG export (the plan's vectors at 3840 px on the long edge), then crops it to the box the printed sheet
   has for it (layout.json). The circles, labels and the drawing credit are drawn by make_sheets.py, not here.

     NODE_PATH=/opt/node22/lib/node_modules node render_maps.cjs
     PAGE=../../build/GC500_v10.60p1/GC500_Delivery_Control_hosted.html   the page to open (default: that one)
     ONLY=master,area5,WC12                                               render just these (a quick look)

   Writes maps/*.jpg and maps/maps.json (positions in sheet units, each picture's crop rectangle). Nothing else. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const HERE = __dirname, JOB = path.resolve(HERE, '..', '..');
const {open} = require(path.join(JOB, 'toolchain', 'harness', 'open_page.js'));
const PAGE = path.resolve(process.env.PAGE || path.join(JOB, 'build', 'GC500_v10.60p1', 'GC500_Delivery_Control_hosted.html'));
const DATA = path.resolve(process.env.DATA || path.join(HERE, '..', 'tracker_data.json'));
const OUT = path.resolve(process.env.OUT || path.join(HERE, 'maps'));
const ONLY = (process.env.ONLY || '').split(',').map(s => s.trim()).filter(Boolean);
const LAY = JSON.parse(fs.readFileSync(path.join(HERE, 'layout.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const CREDIT = 'Drawing © iEDM · D001 rev 03 · issued 2 Oct';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
fs.mkdirSync(OUT, {recursive: true});

const refsOf = a => a.refs.map(r => r.ref);
const allRefs = [].concat(...data.areas.map(refsOf));
const want = key => !ONLY.length || ONLY.includes(key);

/* single-linkage clusters of placed references: a reference drawn far from the rest of its area gets its own picture */
function clusters(pts, gap) {
  const out = [];
  for (const p of pts) {
    const near = out.filter(c => c.some(q => Math.hypot(q.x - p.x, q.y - p.y) <= gap));
    const merged = [p].concat(...near); near.forEach(c => out.splice(out.indexOf(c), 1)); out.push(merged);
  }
  return out.sort((a, b) => b.length - a.length);
}
/* a rectangle round the points, padded, at least min size, at the given aspect (w/h) */
function rectFor(pts, aspect, margin, minW, minH) {
  let x0 = Math.min(...pts.map(p => p.x - p.hw)) - margin, x1 = Math.max(...pts.map(p => p.x + p.hw)) + margin;
  let y0 = Math.min(...pts.map(p => p.y - p.hh)) - margin, y1 = Math.max(...pts.map(p => p.y + p.hh)) + margin;
  let w = Math.max(x1 - x0, minW), h = Math.max(y1 - y0, minH); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
}
const centred = (p, aspect, groundW) => [p.x - groundW / 2, p.y - groundW / aspect / 2, p.x + groundW / 2, p.y + groundW / aspect / 2];

(async () => {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex');
  log('page', path.relative(JOB, PAGE), sha.slice(0, 16));
  const h = await open({pageFile: PAGE, hash: '#sheet/__explorer', W: 1400, H: 1000});
  const p = h.page; let failed = 0;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForFunction(() => typeof EXP !== 'undefined' && EXP.frame && EXP.frame.contentWindow && EXP.frame.contentWindow.__ready, null, {timeout: 180000});
    const frame = p.frames().find(f => /\/explorer\/index\.html(?:\?|$)/.test(f.url()));
    await frame.evaluate(() => GC500Explorer.ready);
    const pageInfo = await p.evaluate(() => ({footer: (document.body.innerText.match(/v\d+\.\d+(?:\.\d+)?(?=\s*$|\s*\n)/m) || [''])[0], version: (document.body.innerText.match(/\bv10\.\d+(?:\.\d+)?\b/g) || []).pop() || ''}));

    /* positions: wait until every placed reference has arrived (pins come in after the plan) and the count holds */
    let pos = {}, last = -1, steady = 0;
    for (let i = 0; i < 40; i++) {
      pos = await frame.evaluate(refs => { const o = {}; for (const k of refs) { const it = ITEMS.find(x => x.code === k);
        o[k] = it && it.places && it.places.length ? it.places.map(b => ({x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2, hw: Math.abs(b[2] - b[0]) / 2, hh: Math.abs(b[3] - b[1]) / 2})) : null; } return o; }, allRefs);
      const n = Object.values(pos).filter(Boolean).length; steady = n === last ? steady + 1 : 0; last = n;
      if (i >= 8 && steady >= 3) break; await p.waitForTimeout(1000);
    }
    const multi = Object.entries(pos).filter(([, v]) => v && v.length > 1).map(([k]) => k);
    if (multi.length) log('note: drawn in more than one place, the first is used:', multi.join(' '));
    const P = {}; for (const [k, v] of Object.entries(pos)) P[k] = v ? Object.assign({ref: k}, v[0]) : null;
    log('placed', Object.values(P).filter(Boolean).length, 'of', allRefs.length, '· not on the map:', allRefs.filter(k => !P[k]).join(' '));

    const geo = await frame.evaluate(() => ({north: northOnSheet(), M: GEO.main.sheet_to_z18px, inset: GEO.inset && GEO.inset.sheet_region_pts, url: location.pathname, sheet: [SHEET_W, SHEET_H]}));
    const pins = [].concat(...data.areas.map(a => a.refs.map(r => r.pin).filter(Boolean)));
    const lat = pins.reduce((s, q) => s + q[0], 0) / pins.length;
    /* metres on the ground per sheet unit: the plan's registration to z18 @2x pixels (0.264 m a pixel here). Image registration, not survey. */
    const mPerPx = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, 19);
    const mPerUnit = Math.hypot(geo.M[0][0], geo.M[1][0]) * mPerPx;

    /* the jobs */
    const jobs = [];
    const placed = allRefs.map(k => P[k]).filter(Boolean);
    const mm = LAY.master_map;
    jobs.push({key: 'master', rect: (() => { const r = rectFor(placed, mm.w / mm.h, LAY.master_margin_units, 0, 0); return r; })(), px: mm.px});
    const areas = {};
    for (const a of data.areas) {
      const pts = a.refs.map(r => P[r.ref]).filter(Boolean); const entry = {n: a.n, name: a.name, main: null, far: [], unplaced: a.refs.filter(r => !P[r.ref]).map(r => r.ref)};
      areas[a.n] = entry; if (!pts.length) continue;
      const cl = clusters(pts, LAY.cluster_gap_units);
      const box = cl.length > 1 ? LAY.area_map_split : LAY.area_map_full;
      const mainKey = 'area' + a.n; entry.main = {key: mainKey, refs: cl[0].map(q => q.ref)};
      jobs.push({key: mainKey, rect: rectFor(cl[0], box.w / box.h, LAY.area_margin_units, LAY.area_min_units[0], LAY.area_min_units[1]), px: box.px});
      cl.slice(1).forEach((c, i) => { const fk = mainKey + '_far' + (i + 1), fb = LAY.area_map_far;
        entry.far.push({key: fk, refs: c.map(q => q.ref)});
        jobs.push({key: fk, rect: c.length === 1 ? centred(c[0], fb.w / fb.h, fb.ground_units) : rectFor(c, fb.w / fb.h, LAY.area_margin_units, fb.ground_units, fb.ground_units / (fb.w / fb.h)), px: fb.px}); });
    }
    /* one picture per place: references drawn at the same spot (the pit garage FWFs) share it */
    const refImg = {}, spot = {};
    for (const k of allRefs) { const q = P[k]; if (!q) continue; const s = Math.round(q.x * 10) + ',' + Math.round(q.y * 10);
      if (spot[s]) { refImg[k] = spot[s]; continue; } const key = 'ref_' + k; spot[s] = key; refImg[k] = key;
      const rb = LAY.ref_map; jobs.push({key, refs: [k], rect: centred(q, rb.w / rb.h, rb.ground_units), px: rb.px}); }
    for (const j of jobs) if (j.key.startsWith('ref_')) j.refs = allRefs.filter(k => refImg[k] === j.key);

    /* the explorer: original plan, as drawn; its export is captured instead of downloaded */
    await frame.evaluate(() => {
      setMode('original');
      if (!window.__print1063) { window.__print1063 = true;
        const oc = URL.createObjectURL.bind(URL); URL.createObjectURL = b => { if (b && b.type === 'image/png') window.__expBlob = b; return oc(b); };
        const ok = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download && /^GC500_D001/.test(this.download)) { window.__expName = this.download; return; } return ok.apply(this, arguments); };
        const ot = toast; toast = function (m) { window.__expToast = String(m); return ot.apply(this, arguments); }; }
    });
    await p.waitForTimeout(1500);
    const st = await frame.evaluate(() => ({sw, sh, fitScale, mode, MIN_Z, MAX_Z}));
    log('stage', st.sw + 'x' + st.sh, 'fit', st.fitScale.toFixed(4), 'mode', st.mode);
    const We = st.sw >= st.sh ? 3840 : 3840 * st.sw / st.sh, He = st.sw >= st.sh ? 3840 * st.sh / st.sw : 3840;

    const images = {};
    let oldMaps = {}; try { oldMaps = JSON.parse(fs.readFileSync(path.join(OUT, 'maps.json'), 'utf8')).images || {}; } catch (e) {}
    for (const j of jobs) {
      if (!want(j.key) && !(j.refs || []).some(want) && !(j.key.startsWith('area') && want(j.key.split('_')[0]))) { if (oldMaps[j.key]) images[j.key] = oldMaps[j.key]; continue; }
      const rw = j.rect[2] - j.rect[0], rh = j.rect[3] - j.rect[1];
      const k = Math.min((We - 8) / rw, (He - 110) / rh), z = Math.min(st.MAX_Z, Math.max(st.MIN_Z, st.sw * k / (st.fitScale * We)));
      let got = null;
      for (let attempt = 1; attempt <= 3 && !got; attempt++) {
        const t0 = Date.now();
        await frame.evaluate(([cx, cy, z]) => { window.__expBlob = null; window.__expToast = ''; window.__expName = ''; camera = {cx, cy, z, rot: 0}; changeView(false); }, [(j.rect[0] + j.rect[2]) / 2, (j.rect[1] + j.rect[3]) / 2, z]);
        await p.waitForTimeout(600);
        const v = await frame.evaluate(() => { const v = currentView(); window.__expView = v; return {x: v.x, y: v.y, w: v.w, h: v.h, rot: camera.rot}; });
        if (v.rot !== 0 || j.rect[0] < v.x - 0.5 || j.rect[1] < v.y - 0.5 || j.rect[2] > v.x + v.w + 0.5 || j.rect[3] > v.y + v.h + 0.5) { log('FAIL', j.key, 'view does not hold the crop', JSON.stringify({v, rect: j.rect})); break; }
        await frame.evaluate(() => document.getElementById('exportBtn').click());
        try { await frame.waitForFunction(() => window.__expBlob && !exporting && window.__expToast, null, {timeout: 120000}); } catch (e) { log('retry', j.key, 'no export in 120 s'); continue; }
        const r = await frame.evaluate(async ([rect, px]) => {
          const v = window.__expView, bm = await createImageBitmap(window.__expBlob), k = bm.width / v.w;
          const sx = (rect[0] - v.x) * k, sy = (rect[1] - v.y) * k, cw = (rect[2] - rect[0]) * k, ch = (rect[3] - rect[1]) * k;
          const W = Math.round(Math.min(px, cw)), H = Math.round(W * ch / cw), c = document.createElement('canvas'); c.width = W; c.height = H;
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(bm, sx, sy, cw, ch, 0, 0, W, H);
          return {url: c.toDataURL('image/jpeg', 0.82), W, H, bw: bm.width, bh: bm.height, sx, sy, cw, ch, toast: window.__expToast, name: window.__expName};
        }, [j.rect, j.px]);
        if (/INCOMPLETE/.test(r.toast)) { log('retry', j.key, r.toast); continue; }
        if (r.sy < 0 || r.sy + r.ch > r.bh - 46 || r.sx < 0 || r.sx + r.cw > r.bw + 0.5) { log('FAIL', j.key, 'crop runs into the export edge or its credit bar', JSON.stringify(r).slice(0, 300)); break; }
        const file = j.key + '.jpg'; fs.writeFileSync(path.join(OUT, file), Buffer.from(r.url.split(',')[1], 'base64'));
        got = {file, rect: j.rect.map(x => +x.toFixed(3)), px: [r.W, r.H], source_px_per_unit: +(r.bw / v.w).toFixed(4), export: r.name, refs: j.refs || undefined};
        log('ok', j.key, r.W + 'x' + r.H, 'z', z.toFixed(2), (Date.now() - t0) + ' ms');
      }
      if (got) images[j.key] = got; else { failed++; log('FAIL', j.key); }
    }

    const out = {
      _about: 'Author: Andrew Fisher. Master-plan pictures for the servicing sheets, rendered read only from the live page\'s Map explorer (Original plan, as drawn, rotation 0) by render_maps.cjs. Positions and rectangles are in drawing sheet units (D001, 2384 x 1684). Picture x = (sheet x - rect x0) / (rect x1 - rect x0) x picture width; the same for y.',
      rendered_at: new Date().toISOString(), page: {file: path.relative(JOB, PAGE), sha256: sha, version: pageInfo.version}, explorer: geo.url,
      credit: CREDIT, north_on_sheet: geo.north, m_per_unit: +mPerUnit.toFixed(4), m_per_unit_note: 'image registration of the plan to satellite z18, not survey (the explorer says so); used for an approximate scale bar and distances only',
      inset_region: geo.inset, sheet: geo.sheet, positions: Object.fromEntries(allRefs.map(k => [k, P[k] ? {x: +P[k].x.toFixed(3), y: +P[k].y.toFixed(3), hw: +P[k].hw.toFixed(3), hh: +P[k].hh.toFixed(3)} : null])),
      ref_image: refImg, areas, images};
    fs.writeFileSync(path.join(OUT, 'maps.json'), JSON.stringify(out, null, 1));
    log('wrote', path.join(OUT, 'maps.json'), Object.keys(images).length, 'pictures', failed ? failed + ' FAILED' : '');
  } catch (e) { failed++; console.error('ERR', e && e.stack || e); }
  if (h.errors.length) log('page errors:', h.errors.slice(0, 5).join(' | '));
  log('requests', JSON.stringify(h.counts), '(blocked = writes the page tried, all aborted)');
  await h.browser.close();
  process.exit(failed ? 1 : 0);
})();
