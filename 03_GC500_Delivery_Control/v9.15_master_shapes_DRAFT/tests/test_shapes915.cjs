// Author: Andrew Fisher. v9.15 master shapes - tests.
//
//   node tests/test_shapes915.cjs static  <build.html> <base.html>          (no browser)
//   node tests/test_shapes915.cjs browser <build.html> <base.html> [laptop|phone]   (through browser_run.sh)
//
// static: the page is the base plus exactly the two new blocks (DATA, MASTER_LOC and everything else byte for byte);
//   the embedded data carries its checksums; every reference on the page has a shape or a reason; every part's
//   centroid and vertices agree with a fresh read of the PDF (evidence/pdf_check.json) after the frame transform;
//   svg() keeps aspect and rotation exactly, scales up uniformly under minPx, puts the door mark on the master's door
//   edge (and on the chosen edge when one is chosen), and the projected mode matches the explorer camera.
// browser: the global is on the live-address page (laptop and phone), the markers parse and render in the browser with
//   the same geometry, no page or console errors beyond the base page's own, 0 blocked writes, and the visible text
//   of every tab is the same on the base page and the build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const HERE = path.resolve(__dirname, '..');
const [mode, PAGE, BASE, DEV] = process.argv.slice(2);
const results = []; let fails = 0;
const ok = (name, pass, info) => { results.push({name, pass: !!pass, info: info === undefined ? null : info}); if (!pass) fails++; };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const SHEET = [2384, 1684];
const toPdf = (f, inset) => [f[0] * 2384 - (inset ? 0 : 25.5), f[1] * 1684 - (inset ? 0.06 : 0.12)];

function blocks(t) {
  const d = t.match(/\n<script id="shapes915-data" data-sha256="([0-9a-f]{64})">const MASTER_SHAPES915_DATA = ([\s\S]*?);<\/script>\n<script id="shapes915-script">([\s\S]*?)<\/script>/);
  return d ? {whole: d[0], sha: d[1], json: d[2], js: d[3]} : null;
}
function loadApi(t) {
  const b = blocks(t); if (!b) return null;
  const ctx = {window: {}, JSON, Math, Object, Number, String, Array, Infinity, isNaN};
  vm.createContext(ctx); vm.runInContext('const MASTER_SHAPES915_DATA = ' + b.json + ';\n' + b.js + '\n;this.__api = MasterShapes915;', ctx);
  return ctx.__api;
}
const parsePts = s => s.trim().split(/\s+/).map(p => p.split(',').map(Number));
function svgParts(svg) {
  const comps = [...svg.matchAll(/<polygon class="ms915-comp" data-i="(\d+)" data-kind="[^"]*" points="([^"]+)"/g)].map(m => ({i: +m[1], pts: parsePts(m[2])}));
  const doors = [...svg.matchAll(/<g class="ms915-door" data-source="(\w+)" data-comp="(\d+)" data-edge="(\d+)"[^>]*>([\s\S]*?)<\/g><\/g>/g)].map(m => {
    const bar = m[4].match(/<line class="ms915-door-bar" x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/);
    const ar = m[4].match(/<g class="ms915-door-arrow"><line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/);
    return {source: m[1], comp: +m[2], edge: +m[3], bar: bar ? bar.slice(1).map(Number) : null, arrow: ar ? ar.slice(1).map(Number) : null, swing: /ms915-swing/.test(m[4])};
  });
  return {comps, doors, scale: +((svg.match(/data-ms915-scale="([\d.]+)"/) || [])[1]), door: (svg.match(/data-ms915-door="(\w+)"/) || [])[1]};
}
function segDist(p, a, b) { const ab = [b[0] - a[0], b[1] - a[1]], L2 = ab[0] ** 2 + ab[1] ** 2; let t = L2 ? ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / L2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p[0] - a[0] - ab[0] * t, p[1] - a[1] - ab[1] * t); }
function objEnd(t, i) { let d = 0, q = false; for (let j = i; j < t.length; j++) { const c = t[j]; if (q) { if (c === '\\') j++; else if (c === '"') q = false; continue; } if (c === '"') q = true; else if (c === '{') d++; else if (c === '}') { d--; if (!d) return j + 1; } } return -1; }
function centroid(poly) { let A = 0, cx = 0, cy = 0; for (let i = 0; i < poly.length; i++) { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length], c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c; } A /= 2; return [cx / (6 * A), cy / (6 * A)]; }

function staticTests() {
  const t = fs.readFileSync(PAGE, 'utf8'), base = BASE ? fs.readFileSync(BASE, 'utf8') : null;
  const b = blocks(t);
  ok('S1 the two new blocks are on the page, once', b && t.split('id="shapes915-data"').length === 2 && t.split('id="shapes915-script"').length === 2);
  if (base) ok('S1 removing them gives the base page byte for byte (DATA, MASTER_LOC, money, footer, every screen unchanged)', t.replace(b.whole, '') === base, {build: t.length, base: base.length});
  ok('S2 embedded data matches its recorded sha256', sha(b.json) === b.sha, b.sha.slice(0, 16));
  const srcSha = sha(fs.readFileSync(path.join(HERE, 'shapes_v915.json')));
  const data = JSON.parse(b.json.replace(/<\\\//g, '</'));
  ok('S2 page data names the source file it came from', data.source_sha256 === srcSha, srcSha.slice(0, 16));
  ok('S2 no agent or model names, no author name in the page data', !/Claude|Codex|Opus|GPT|Andrew|Fisher/.test(b.json + b.js.replace(/^\s*\/\*[\s\S]*?\*\//, '')));
  const api = loadApi(t);
  ok('S3 MasterShapes915 loads, frozen, read only', api && Object.isFrozen(api) && typeof api.shape === 'function' && typeof api.svg === 'function');
  const J = JSON.parse(fs.readFileSync(path.join(HERE, 'shapes_v915.json'), 'utf8'));
  const withShape = Object.keys(J.refs).filter(r => J.refs[r].shape);
  ok('S3 refs() lists every reference with a shape', JSON.stringify(api.refs()) === JSON.stringify(withShape.slice().sort()), api.refs().length);
  // every reference on the page and every MASTER_LOC entry answered
  const dataM = t.match(/const DATA = (\{.*?\});\n/), dataObj = dataM ? JSON.parse(dataM[1]) : null;
  const mlI = t.indexOf('const MASTER_LOC = ') + 'const MASTER_LOC = '.length;
  let ML = null; try { ML = JSON.parse(t.slice(mlI, objEnd(t, mlI))); } catch (e) { ML = null; }
  const pageRefs = new Set([...(dataObj ? dataObj.assets.map(a => a.key) : []), ...Object.keys(ML || {})]);
  const unanswered = [...pageRefs].filter(r => !api.shape(r) && !(api.reason(r) && api.reason(r) !== 'not a reference on this page'));
  ok('S3 every reference on the page (DATA and MASTER_LOC) has a shape or a reason', pageRefs.size >= 180 && unanswered.length === 0, {refs: pageRefs.size, shapes: withShape.length, unanswered});
  ok('S3 a reference with no shape gives null and says why', [...pageRefs].filter(r => !api.shape(r)).every(r => api.svg(r) === null && /\w/.test(api.reason(r))));
  const m1 = api.shape('P67'); m1.components[0].poly[0][0] = 9; ok('S3 shape() hands out a copy (cannot change the data)', api.shape('P67').components[0].poly[0][0] !== 9);
  // S4 every part against a fresh read of the PDF
  const pc = JSON.parse(fs.readFileSync(path.join(HERE, 'evidence', 'pdf_check.json'), 'utf8'));
  const M = data.m_per_pt; let worstC = 0, worstV = 0, worstWhere = null, nParts = 0, worstDoorM = 0, nDoors = 0;
  for (const r of withShape) {
    const s = api.shape(r), rows = pc.refs[r];
    s.components.forEach((c, i) => {
      nParts++;
      const P = c.poly.map(f => toPdf(f, rows[i].inset)), C = centroid(P), dC = Math.hypot(C[0] - rows[i].centroid_pt[0], C[1] - rows[i].centroid_pt[1]) * M;
      if (dC > worstC) { worstC = dC; worstWhere = r + '#' + i; }
      for (const v of P) worstV = Math.max(worstV, Math.min(...rows[i].corners_pt.map(q => Math.hypot(v[0] - q[0], v[1] - q[1]))));
      c.doors.forEach((d, k) => { nDoors++; const a = d.swing.arc.map(f => toPdf(f, rows[i].inset)), q = rows[i].doors[k].arc_pt; a.forEach((v, j) => { worstDoorM = Math.max(worstDoorM, Math.hypot(v[0] - q[j][0], v[1] - q[j][1]) * M); }); });
    });
  }
  ok('S4 every part\'s centroid within 0.5 m of the PDF centroid after the transform', nParts === 318 && worstC < 0.5, {parts: nParts, worst_m: +worstC.toFixed(4), at: worstWhere});
  ok('S4 every vertex is a PDF corner (under 0.01 pt)', worstV < 0.01, {worst_pt: +worstV.toFixed(5)});
  ok('S4 every door swing is the PDF arc (under 0.01 m)', nDoors === 117 && worstDoorM < 0.01, {doors: nDoors, worst_m: +worstDoorM.toFixed(5)});
  // S5-S8 svg geometry
  let worstAng = 0, worstRatio = 0, nEdges = 0, minPxBad = [], doorBad = [], choiceBad = [], kSpread = 0, nDoorMarks = 0;
  const cases = [{pxPerPt: 0.23, rot: 0, minPx: 18}, {pxPerPt: 7.75, rot: 0, minPx: 18}, {pxPerPt: 37, rot: 0.61, minPx: 18}, {pxPerPt: 2.5, rot: -2.2, minPx: 40}];
  for (const r of withShape) {
    const s = api.shape(r);
    for (const cs of cases) {
      const svg = api.svg(r, Object.assign({number: 3}, cs)), L = api.layout(r, cs), parts = svgParts(svg), k = parts.scale;
      const cos = Math.cos(cs.rot), sin = Math.sin(cs.rot), ks = [];
      parts.comps.forEach(pc_ => {
        const src = s.components[pc_.i].poly.map(f => [f[0] * SHEET[0], f[1] * SHEET[1]]);
        for (let e = 0; e < src.length; e++) {
          const a = src[e], b = src[(e + 1) % src.length], v = [b[0] - a[0], b[1] - a[1]], want = [(cos * v[0] - sin * v[1]) * cs.pxPerPt * k, (sin * v[0] + cos * v[1]) * cs.pxPerPt * k];
          const A = pc_.pts[e], B = pc_.pts[(e + 1) % src.length], got = [B[0] - A[0], B[1] - A[1]], Lw = Math.hypot(...want), Lg = Math.hypot(...got);
          if (Lw < 4) continue;   // the page rounds to 0.01 px: compare edges of 4 px and up
          nEdges++;
          const ang = Math.abs(((Math.atan2(got[1], got[0]) - Math.atan2(want[1], want[0])) * 180 / Math.PI + 540) % 360 - 180);
          worstAng = Math.max(worstAng, ang); worstRatio = Math.max(worstRatio, Math.abs(Lg / Lw - 1)); ks.push(Lg / Math.hypot(v[0], v[1]) / cs.pxPerPt);
        }
      });
      if (ks.length > 1) kSpread = Math.max(kSpread, (Math.max(...ks) - Math.min(...ks)) / Math.min(...ks));
      // minPx: short side of the largest part reaches minPx exactly when below it, else true size
      const trueShort = L.shortPx / L.scale;
      if (trueShort < cs.minPx ? Math.abs(L.shortPx - cs.minPx) > 0.01 || !(L.scale > 1) : L.scale !== 1) minPxBad.push([r, cs.pxPerPt, L.shortPx, L.scale]);
      // door marks on the master's door edges
      const want = []; s.components.forEach((c, i) => c.doors.forEach(d => want.push(i + ':' + d.edge_index)));
      const got = parts.doors.filter(d => d.source === 'master');
      if (got.map(d => d.comp + ':' + d.edge).sort().join() !== want.sort().join() || parts.door !== 'master') doorBad.push([r, 'set', want, got.map(d => d.comp + ':' + d.edge)]);
      for (const d of got) {
        nDoorMarks++;
        const poly = parts.comps.find(c => c.i === d.comp).pts, a = poly[d.edge], b = poly[(d.edge + 1) % poly.length];
        const mid = [(d.bar[0] + d.bar[2]) / 2, (d.bar[1] + d.bar[3]) / 2], cen = centroid(poly), ev = [b[0] - a[0], b[1] - a[1]], el = Math.hypot(...ev);
        const ar = [d.arrow[2] - d.arrow[0], d.arrow[3] - d.arrow[1]], al = Math.hypot(...ar);
        const onEdge = segDist(mid, a, b), square = Math.abs((ar[0] * ev[0] + ar[1] * ev[1]) / (al * el)), outward = ((mid[0] - cen[0]) * ar[0] + (mid[1] - cen[1]) * ar[1]) > 0;
        if (onEdge > 0.06 || square > 0.02 || !outward) doorBad.push([r, d.comp, d.edge, +onEdge.toFixed(3), +square.toFixed(4), outward]);
      }
      // a chosen edge wins over the master's door
      const c0 = s.components[0];
      for (let e = 0; e < c0.poly.length; e++) {
        const sv = api.svg(r, Object.assign({door: {component: 0, edge: e}}, cs)), pp = svgParts(sv), dd = pp.doors;
        const poly = pp.comps.find(c => c.i === 0).pts, a = poly[e], b = poly[(e + 1) % poly.length];
        const good = pp.door === 'choice' && dd.length === 1 && dd[0].source === 'choice' && dd[0].edge === e && !dd[0].swing && segDist([(dd[0].bar[0] + dd[0].bar[2]) / 2, (dd[0].bar[1] + dd[0].bar[3]) / 2], a, b) < 0.06;
        if (!good) choiceBad.push([r, e, cs.pxPerPt]);
      }
      if (api.svg(r, Object.assign({door: 'none'}, cs)).includes('ms915-door"')) choiceBad.push([r, 'none']);
    }
  }
  ok('S5 svg keeps every edge\'s direction (rotation exact)', nEdges > 1000 && worstAng < 0.5, {edges: nEdges, worst_deg: +worstAng.toFixed(4)});
  ok('S5 svg keeps every edge\'s length ratio (aspect exact)', worstRatio < 0.01, {worst_relative: +worstRatio.toFixed(5)});
  ok('S6 scaling is uniform: one factor for every edge of every part', kSpread < 0.01, {spread: +kSpread.toFixed(5)});
  ok('S6 under minPx the shape is scaled up to exactly minPx, otherwise true size', minPxBad.length === 0, minPxBad.slice(0, 5));
  ok('S7 the door mark sits on the master\'s door edge, square to it, pointing out', doorBad.length === 0 && nDoorMarks === 117 * cases.length, {marks: nDoorMarks, bad: doorBad.slice(0, 5)});
  ok('S8 a chosen edge replaces the master\'s door; door:\'none\' draws none', choiceBad.length === 0, choiceBad.slice(0, 5));
  // S9 the explorer camera through project() gives the same picture as pxPerPt + rot
  let worstProj = 0;
  const cam = {s: 7.7508, rot: 0.37, W: 1032, H: 420, cx: 1200, cy: 300};
  const project = f => { const a = cam.s * Math.cos(cam.rot), b = cam.s * Math.sin(cam.rot), X = f[0] * 2384, Y = f[1] * 1684; return [a * X - b * Y + cam.W / 2 - a * cam.cx + b * cam.cy, b * X + a * Y + cam.H / 2 - b * cam.cx - a * cam.cy]; };
  for (const r of withShape) {
    const A = api.layout(r, {project, minPx: 18}), B = api.layout(r, {pxPerPt: cam.s, rot: cam.rot, minPx: 18});
    A.components.forEach((c, i) => c.poly.forEach((q, j) => { worstProj = Math.max(worstProj, Math.hypot(q[0] - B.components[i].poly[j][0], q[1] - B.components[i].poly[j][1])); }));
  }
  ok('S9 project() (the explorer camera) and pxPerPt + rot draw the same shape', worstProj < 1e-6, {worst_px: worstProj});
  // S10 badge: always present and readable, inside a big shape, beside a small one
  const big = api.layout('P01', {pxPerPt: 37, number: 1}), small = api.layout('WC24', {pxPerPt: 0.5, number: 12});
  ok('S10 the number badge stays readable (radius 11 px at any zoom)', big.badge.r === 11 && small.badge.r === 11 && big.badge.inside && !small.badge.inside);
  return {api, J};
}

async function browserTests() {
  const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
  // MS915_CACHE_TRIM=1: keep the test rig's fetch cache (GC500_CACHE, a fresh temporary folder) small on a full disk by
  // dropping entries older than 20 s; a dropped entry is simply fetched again (GET only).
  if (process.env.MS915_CACHE_TRIM && process.env.GC500_CACHE) {
    const dir = process.env.GC500_CACHE;
    setInterval(() => { try { const now = Date.now(); for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.json')) continue; const j = path.join(dir, f);
      try { if (now - fs.statSync(j).mtimeMs > 20000) { fs.unlinkSync(j); try { fs.unlinkSync(j.slice(0, -5) + '.body'); } catch (_) {} } } catch (_) {} } } catch (_) {} }, 3000).unref();
  }
  const phone = DEV === 'phone', geo = phone ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900};
  const norm = t => t.replace(/\d{1,2}:\d{2}(:\d{2})?(\s?(am|pm|AEST))?/gi, '#:#').replace(/\b\d+\s?(s|sec|secs|seconds?|min|mins|minutes?|h|hrs?|hours?)\s+ago\b/gi, '# ago').replace(/\s+/g, ' ').trim();
  const runOne = async (file, label) => {
    const s = await open(Object.assign({pageFile: file}, geo)), p = s.page, cons = [];
    p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200) + ((m.location() || {}).url ? ' @ ' + m.location().url.replace(/[?#].*$/, '').slice(0, 120) : '')); });
    await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 180000});
    await p.waitForTimeout(4000);
    return {s, p, cons, label};
  };
  // one browser at a time (the machine is short of disk): the build first, then the base page
  const tabText = async (P) => { const tabs = await P.evaluate(() => TABS.map(t => t[0])), out = {};
    for (const t of tabs) { await P.evaluate(k => { try { go(k); } catch (e) { window.__goerr = String(e && e.message); } }, t); await P.waitForTimeout(t === 'map' ? 6000 : 1800);
      out[t] = await P.evaluate(k => { const pane = document.getElementById('pane-' + k); return pane ? pane.innerText : ''; }, t); }
    return out; };
  const B = await runOne(PAGE, 'build'); let textB, errsB, consB, countsB;
  try {
    const g = await B.p.evaluate(() => ({has: typeof window.MasterShapes915 === 'object' && window.MasterShapes915 === MasterShapes915, n: MasterShapes915.refs().length, meta: MasterShapes915.meta(), p67: MasterShapes915.shape('P67')}));
    ok('B1 window.MasterShapes915 is on the page', g.has && g.n === 126 && g.meta.shapes === 126 && g.meta.none === 54, {n: g.n, meta: g.meta});
    ok('B1 P67 is the master\'s 6 x 3 m building with its door', g.p67 && g.p67.components.length === 1 && g.p67.components[0].size_m[0] === 6 && g.p67.components[0].door && g.p67.components[0].door.faces === 'north');
    // every marker parses as SVG in the browser and renders with the computed geometry (test-only container, removed after)
    const r = await B.p.evaluate(() => {
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none'; document.body.appendChild(host);
      let bad = [], worst = 0, n = 0;
      for (const ref of MasterShapes915.refs()) for (const o of [{pxPerPt: 7.75, number: 1}, {pxPerPt: 0.3, number: 2, selected: true, rot: 1.1}, {pxPerPt: 30, number: 3, door: 0}]) {
        const str = MasterShapes915.svg(ref, o), doc = new DOMParser().parseFromString(str, 'image/svg+xml');
        if (doc.querySelector('parsererror')) { bad.push(ref); continue; }
        host.innerHTML = str; const svg = host.firstElementChild, L = MasterShapes915.layout(ref, o);
        svg.querySelectorAll('polygon.ms915-comp').forEach(pg => { const i = +pg.dataset.i, pts = pg.points; for (let j = 0; j < pts.numberOfItems; j++) { const q = pts.getItem(j); n++; worst = Math.max(worst, Math.hypot(q.x - L.components[i].poly[j][0], q.y - L.components[i].poly[j][1])); } });
        const bb = svg.getBoundingClientRect(); if (Math.abs(bb.width - L.width) > 1 || Math.abs(bb.height - L.height) > 1) bad.push(ref + ' size');
      }
      host.remove();
      return {bad, worst, n, left: document.querySelectorAll('.ms915-marker').length};
    });
    ok('B2 every marker parses and renders in the browser with the computed geometry', r.bad.length === 0 && r.worst < 0.01 && r.n > 3000 && r.left === 0, r);
    const shot = path.join(HERE, 'evidence', 'markers_' + (phone ? 'phone' : 'laptop') + '.png');
    await B.p.evaluate(() => {
      const host = document.createElement('div'); host.id = 'ms915-test-sheet';
      host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#e9eef0;overflow:auto;padding:10px;font:12px system-ui;display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start';
      const rows = [['P25', 1, true], ['P65', 2], ['P66', 3], ['P67', 4], ['WC09', 5], ['T0243', 6], ['GN20', 7], ['WC31', 8], ['P34', 9]];
      let html = '';
      for (const [ref, n, sel] of rows) {
        html += '<div style="background:#fff;border:1px solid #ccd;padding:6px;border-radius:6px"><b>' + ref + '</b> ' + MasterShapes915.shape(ref).door_summary + '<div style="display:flex;gap:8px;align-items:center">' +
          MasterShapes915.svg(ref, {number: n, selected: !!sel, pxPerPt: 0.6}) + MasterShapes915.svg(ref, {number: n, selected: !!sel, pxPerPt: 7.75}) +
          MasterShapes915.svg(ref, {number: n, selected: !!sel, pxPerPt: 7.75, rot: 0.5}) + (ref.startsWith('P') ? MasterShapes915.svg(ref, {number: n, pxPerPt: 7.75, door: 3}) : '') + '</div></div>';
      }
      host.innerHTML = html; document.body.appendChild(host);
    });
    await B.p.waitForTimeout(300);
    await B.p.screenshot({path: shot, fullPage: false});
    await B.p.evaluate(() => document.getElementById('ms915-test-sheet').remove());
    ok('B3 marker picture saved for review', fs.existsSync(shot), shot);
    textB = await tabText(B.p);
  } finally { errsB = B.s.errors.slice(); consB = B.cons.slice(); countsB = Object.assign({}, B.s.counts); await B.s.browser.close(); }
  const A = await runOne(BASE, 'base'); let textA, errsA, consA, countsA;
  try {
    ok('B1 the base page has no MasterShapes915', !(await A.p.evaluate(() => typeof window.MasterShapes915 !== 'undefined')));
    textA = await tabText(A.p);
  } finally { errsA = A.s.errors.slice(); consA = A.cons.slice(); countsA = Object.assign({}, A.s.counts); await A.s.browser.close(); }
  const tabs = Object.keys(textB);
  ok('B4 same tabs', JSON.stringify(tabs) === JSON.stringify(Object.keys(textA)), tabs.length);
  const diffs = [];
  for (const t of tabs) {
    const tb = textB[t], ta = textA[t] || '';
    if (norm(tb) !== norm(ta)) {
      const lb = tb.split('\n').map(norm), la = ta.split('\n').map(norm);
      const onlyB = lb.filter(x => !la.includes(x)), onlyA = la.filter(x => !lb.includes(x));
      diffs.push({tab: t, build_len: tb.length, base_len: ta.length, only_build: onlyB.slice(0, 4), only_base: onlyA.slice(0, 4)});
    }
  }
  ok('B4 visible text of every tab is the same on base and build', diffs.length === 0, {tabs: tabs.length, diffs});
  ok('B5 no page errors on the build', errsB.length === 0, {build: errsB.slice(0, 5), base: errsA.slice(0, 5)});
  const newCons = consB.filter(c => !consA.includes(c));
  ok('B5 no console errors the base page does not also show', newCons.length === 0, {build: consB.length, base: consA.length, new: newCons.slice(0, 5)});
  ok('B6 0 blocked writes (nothing tried to change the record)', countsB.blocked === 0 && countsA.blocked === 0, {build: countsB, base: countsA});
}

(async () => {
  if (mode === 'static') staticTests();
  else if (mode === 'browser') { staticTests(); await browserTests(); }
  else { console.error('usage: node tests/test_shapes915.cjs static|browser <build.html> <base.html> [laptop|phone]'); process.exit(2); }
  const out = {mode, device: DEV || null, page: path.basename(PAGE), page_sha256: sha(fs.readFileSync(PAGE)), pass: results.filter(r => r.pass).length, total: results.length, results};
  console.log(JSON.stringify(out, null, 1));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
