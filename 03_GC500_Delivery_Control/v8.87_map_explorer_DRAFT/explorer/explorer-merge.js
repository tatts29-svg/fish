/* v6.99 - THE MAP EXPLORER: ONE MAP, EVERYTHING IN IT.
 Andrew Fisher, 27 Sep 2026: "Everything in 3d proof should be merged into plan on satellite.. satellite 3d and satellite
 pinned if its not in planned on satellite it needs to be in there. When u tap maps it takes u directly into satellite
 explorer ... We dont wanna double up on info in here." And, of the two pages' controls: keep Auto / Ultra (4K) / Light and
 Plan / Sat + plan / Satellite.

 What the other three views had that this page did not, now here:
 - 3D (3D proof and Satellite · 3D were the same thing twice): Google's photorealistic 3D city as a fourth mode beside
   Plan / Sat + plan / Satellite, with the job standing on it - the SAME pins as the rings here (the Map's numbers and places,
   laid on the ground through this page's own georeference), coloured by chip, driven by this page's search and Find
   chips; the model's compass, orbit, Overhead / Angled / Close-up views and Auto / Ultra (4K) / Light stay with it.
   Its tiles are fetched on the first press of 3D only (Google bills per opening), and kept while the page is open.
 - The reference card (Satellite · pins): tap or find a reference and a card says what it is, its trade, where the
   delivery stands, the master-plan close-up, who pinned it on the ground and when, and Open for its full record.
 Loaded after explorer.js; uses its globals (ITEMS, CATS_NOW, GEO, selectCode, showCategory, setMode). */
(function () {
  'use strict';

  const CSS = `#model3d{position:absolute;inset:0;width:100%;height:100%;border:0;display:none;z-index:6;background:#0f0d0c}
body.in3d #model3d{display:block}
body.in3d #zoomInput,body.in3d #zoomOut,body.in3d #zoomIn,body.in3d #fitBtn,body.in3d #boxBtn,body.in3d #exportBtn,body.in3d #mini,body.in3d #rose,body.in3d #sheetBtn,body.in3d #satBanner,body.in3d #qual,body.in3d #overzoom,body.in3d #viewName{display:none !important}
body.in3d #layers{opacity:.45;pointer-events:none}
#xcard{position:absolute;left:12px;bottom:12px;z-index:8;width:min(330px,calc(100% - 24px));background:#15181a;color:#f3f1ee;border:1px solid rgba(255,255,255,.14);border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.45);font:13px/1.4 Inter,system-ui,sans-serif}
#xcard[hidden]{display:none}
#xcard img{display:block;width:100%;height:140px;object-fit:cover;background:#222}
.xc-b{padding:10px 12px}.xc-t{display:flex;align-items:baseline;gap:6px}.xc-t b{font-size:16px}.xc-t span{color:#c9cfd2;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xc-x{margin-left:auto;background:none;border:0;color:#c9cfd2;font-size:20px;line-height:1;cursor:pointer;padding:0 2px}
.xc-m{margin-top:4px;color:#e6e2dd;display:flex;align-items:center;gap:5px;flex-wrap:wrap}.xc-m i{width:10px;height:10px;border-radius:50%;display:inline-block;box-shadow:0 0 0 1px rgba(0,0,0,.5) inset}
.xc-s{margin-top:4px;color:#aab2b6;font-size:12px}
.xc-a{margin-top:8px}.xc-open{background:#ff6a13;color:#1b1207;border:0;border-radius:8px;padding:7px 12px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}
@media (max-width:640px){#xcard{left:8px;right:8px;width:auto;bottom:8px;display:flex;align-items:stretch;max-height:38%;overflow:auto;border-radius:12px}#xcard img{width:76px;height:auto;min-height:64px;flex:none}#xcard .xc-b{flex:1;min-width:0;padding:8px 10px}}`;
  { const st = document.createElement('style'); st.id = 'mergeCss'; st.textContent = CSS; document.head.appendChild(st); }
  const W18 = 512 * Math.pow(2, 18);
  const $$ = id => document.getElementById(id);
  let in3d = false, frame = null, ready3d = false, curCat = null, noFly = false, lastCode = null;
  const host = () => { try { return window.parent !== window ? window.parent : null; } catch (e) { return null; } };
  const escH = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  /* ---------------- the ground position of anything on the sheet, through this page's own registration */
  function llOf(x, y) {
    if (typeof GEO === 'undefined' || !GEO || !GEO.main) return null;
    const r = GEO.inset && GEO.inset.sheet_region_pts, inIn = r && x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
    const m = inIn ? GEO.inset.sheet_to_z18px : GEO.main.sheet_to_z18px;
    const px = m[0][0] * x + m[0][1] * y + m[0][2], py = m[1][0] * x + m[1][1] * y + m[1][2];
    return [Math.atan(Math.sinh(Math.PI * (1 - 2 * py / W18))) * 180 / Math.PI, px / W18 * 360 - 180];
  }
  function pins3d() {
    const out = [];
    (typeof ITEMS !== 'undefined' ? ITEMS : []).forEach(it => {
      if (!it.cat || !it.places || !it.places.length) return;
      const b = it.places[0], ll = llOf((b[0] + b[2]) / 2, (b[1] + b[3]) / 2); if (!ll) return;
      out.push({k: it.code, n: (it.reg && it.reg.name) || '', c: it.cat.c, g: String(it.cat.id), ll});
    });
    return out;
  }
  const api3d = () => { try { return frame && frame.contentWindow && frame.contentWindow.GC500_3D; } catch (e) { return null; } };
  function sync3d(fly) {
const a = api3d(); if (!a || !ready3d || !a.state || !a.state.ready) return;
    a.showGroups(curCat ? [String(curCat)] : null);
    if (lastCode) { if (fly) a.find(lastCode); else a.ring(lastCode); }
  }

  /* ---------------- the 3D mode */
  let wait3dTimer813 = 0, load3dEpoch813 = 0;
  window.gc500Explorer3DFailed813 = source => {
    if (!frame || source !== frame.contentWindow) return false;
    clearTimeout(wait3dTimer813); load3dEpoch813++; ready3d = false;
    return true;
  };
  window.gc500Explorer3DReady813 = source => {
    if (!frame || source !== frame.contentWindow || !source.__ready || source.__bootError || !source.GC500_3D) return false;
    clearTimeout(wait3dTimer813); load3dEpoch813++; ready3d = true;
    source.GC500_3D.setPins(pins3d());
    if (in3d) sync3d(true); else if (source.GC500_3D.stopMotion813) source.GC500_3D.stopMotion813();
    return true;
  };
  function ensureFrame() {
    if (frame) return frame;
    const st = $$('stage'); if (!st) return null;
    frame = document.createElement('iframe');
    frame.id = 'model3d'; frame.title = 'The circuit in 3D'; frame.allow = 'fullscreen';
    frame.src = '../poc3d/index.html?embed=1&back=' + (new URLSearchParams(location.search).get('back') === 'e' ? 'e' : 'v');
    frame.addEventListener('load', () => {
      clearTimeout(wait3dTimer813); ready3d = false;
      const epoch = ++load3dEpoch813, t0 = Date.now();
      (function wait() {
        if (epoch !== load3dEpoch813) return;
        let source = null; try { source = frame.contentWindow; } catch (e) {}
        if (source && source.__ready && window.gc500Explorer3DReady813(source)) return;
        if (source && source.__bootError) return;
        if (Date.now() - t0 < 90000) wait3dTimer813 = setTimeout(wait, 150);
      })();
    });
    st.appendChild(frame);
    return frame;
  }
  function modeButtons() { return document.querySelectorAll('.modes button[data-mode]'); }
  function enter3d() {
    if (in3d) return; in3d = true;
    ensureFrame(); document.body.classList.add('in3d');
    modeButtons().forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === '3d')));
    try { localStorage.setItem('gc500.explorer.mode', '3d'); } catch (e) {}
    if (ready3d) sync3d(!!lastCode);
    try { history.replaceState(null, '', location.pathname + location.search + '#3d'); } catch (e) {}
  }
  function exit3d() {
    if (!in3d) return; in3d = false; document.body.classList.remove('in3d');
    setTimeout(() => { const m = typeof mode !== 'undefined' ? mode : null; modeButtons().forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m))); }, 0);
try { const a = api3d(); if (a) { if (a.stopMotion813) a.stopMotion813(); else a.stopOrbit(); } } catch (e) {}
  }
  function addButton() {
    const g = document.querySelector('.modes'); if (!g || g.querySelector('[data-mode="3d"]')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.mode = '3d'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'The circuit in 3D');
    b.textContent = '3D'; b.title = 'Google’s photorealistic 3D city, with the job on it (4)';
    g.appendChild(b);
    b.addEventListener('click', e => { e.stopImmediatePropagation(); enter3d(); });
    /* the other three leave 3D first, then do what they always did */
    g.addEventListener('click', e => { const x = e.target.closest('[data-mode]'); if (x && x.dataset.mode !== '3d') exit3d(); }, true);
    document.addEventListener('keydown', e => { if (e.key === '4' && !/input|textarea/i.test((e.target && e.target.tagName) || '')) enter3d();
      if (/^[123]$/.test(e.key) && in3d && !/input|textarea/i.test((e.target && e.target.tagName) || '')) exit3d(); });
  }

  /* ---------------- the reference card (what Satellite · pins had) */
  /* stage5 - the card sits clear of the map's own bottom controls (the compass and As drawn, the status pill, the imagery
     credit, the minimap, the banners): its bottom edge goes just above the highest of those under it. It closes when the
     map is touched, scrolled or zoomed anywhere outside it, and on Escape; a touch inside it stays in it (it no longer
     reaches the map as the start of a pan, and a wheel over it no longer zooms the map). */
  const CARD_CLEAR = ['#rose', '#sheetBtn', '#qual', '#attrib', '#mini', '#satBanner', '#overzoom', '#zoomIn', '#zoomOut', '#zoomInput', '#fitBtn', '#boxBtn', '#exportBtn', '#fsBtn'];
  function placeCard(el) {
    const st = $$('stage'); if (!st || !el || el.hidden) return;
    el.style.bottom = ''; const sr = st.getBoundingClientRect(), cr = el.getBoundingClientRect(); let low = sr.bottom - 8;
    for (const sel of CARD_CLEAR) { const b = document.querySelector(sel); if (!b || !b.getClientRects().length || getComputedStyle(b).visibility === 'hidden') continue;
      const r = b.getBoundingClientRect(); if (!r.width || !r.height || r.right <= cr.left || r.left >= cr.right || r.top < sr.top + sr.height / 2) continue; low = Math.min(low, r.top - 8); }
    el.style.bottom = Math.max(8, Math.round(sr.bottom - low)) + 'px';
  }
  function hideCard() { const el = $$('xcard'); if (el && !el.hidden) el.hidden = true; }
  function cardInputs() {
    const st = $$('stage'); if (!st || st.__cardHooked) return; st.__cardHooked = true;
    const outside = e => !(e.target && e.target.closest && e.target.closest('#xcard'));
    /* v8.87 - the card stays through a pan or a zoom (Andrew, 7 Oct 2026); a tap on the map away from it closes it */
    let down887 = null;
    st.addEventListener('pointerdown', e => { down887 = outside(e) && e.isPrimary ? {x: e.clientX, y: e.clientY, t: performance.now()} : null; }, true);
    st.addEventListener('pointerup', e => { const d = down887; down887 = null; if (d && outside(e) && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8 && performance.now() - d.t < 600) hideCard(); }, true);
    st.addEventListener('pointercancel', () => { down887 = null; }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });
    let rz = 0; window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => placeCard($$('xcard'))); });
  }
  function card(code) {
    let el = $$('xcard');
    if (!el) { el = document.createElement('div'); el.id = 'xcard'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Reference');
      const st = $$('stage'); (st || document.body).appendChild(el);
      el.addEventListener('click', e => { if (e.target.closest('[data-xclose]')) { el.hidden = true; return; }
        const o = e.target.closest('[data-xopen]'); if (o) { try { const h = host(); if (h && h.gc500ExplorerPicked) h.gc500ExplorerPicked(o.dataset.xopen); } catch (x) {} }
        const pr = e.target.closest('[data-xprog]'); if (pr) { try { const h = host(); if (h && h.gc500ExplorerProgress) h.gc500ExplorerProgress(pr.dataset.xprog); } catch (x) {} } });
      for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'dblclick', 'click']) el.addEventListener(ev, e => e.stopPropagation());
      el.addEventListener('wheel', e => e.stopPropagation(), {passive: true});
      el.addEventListener('load', () => placeCard(el), true); }
    const it = (typeof ITEMS !== 'undefined' ? ITEMS : []).find(x => x.code === code); if (!it) { el.hidden = true; return; }
    let info = null; try { const h = host(); if (h && typeof h.gc500PlanCard === 'function') info = h.gc500PlanCard(code); } catch (e) {}
    const name = (info && info.name) || (it.reg && it.reg.name) || '';
    const canOpen = !!(info && info.open);
    /* v8.87 - WHAT HAS BEEN DONE, CLEARLY (Andrew, 7 Oct 2026): the Timeline's own five-stage reading, who and when, the due day and
       what is left, from the dashboard's gc500PlanCard. A card without a stage (an older dashboard) shows its one delivery word. */
    const st887 = info && info.stage, tone887 = {green: '#39e07a', amber: '#ffb000', red: '#ff4d4d', none: '#9aa3ad', cx: '#9aa3ad'};
    const lamps887 = st887 ? `<div class="xc-lamps" role="img" aria-label="${escH(st887.label)}">${st887.lamps.map((l, i) => `<span class="${i < st887.n ? 'on ' + escH(st887.tone) : ''}"><i></i>${escH(l)}</span>`).join('')}</div>` : '';
    const lines887 = info && Array.isArray(info.lines) && info.lines.length ? `<ul class="xc-lines">${info.lines.map(l => `<li class="${l.done ? 'done' : ''}"><b>${l.done ? '✓' : '·'} ${escH(l.k)}</b><span>${escH(l.text)}</span></li>`).join('')}</ul>` : '';
    el.innerHTML = `${info && info.img ? `<img src="${escH(info.img)}" alt="" decoding="async">` : ''}
      <div class="xc-b"><div class="xc-t"><b>${escH(code)}</b>${name ? ` <span>${escH(name)}</span>` : ''}<button type="button" class="xc-x" data-xclose aria-label="Close">×</button></div>
      <div class="xc-m"><i style="background:${escH(it.cat.c)}"></i>${escH(it.cat.name)}${!st887 && info && info.status ? ` <i style="background:${escH(info.statusColour || '#9aa3ad')};margin-left:8px"></i>${escH(info.status)}` : ''}${it.reg && it.reg.sec ? ` · ${escH(it.reg.sec)}` : ''}</div>
      ${st887 ? `<div class="xc-st"><i style="background:${escH(tone887[st887.tone] || '#9aa3ad')}"></i>${escH(st887.label)}</div>${lamps887}${st887.why ? `<div class="xc-why">${escH(st887.why)}</div>` : ''}` : ''}
      ${lines887}
      ${info && info.due ? `<div class="xc-s">${escH(info.due)}</div>` : ''}
      ${info && info.left ? `<div class="xc-left">${escH(info.left)}</div>` : ''}
      ${info && info.pinned ? `<div class="xc-s">${escH(info.pinned)}</div>` : ''}
      ${info && info.assets ? `<div class="xc-s">Asset ${escH(info.assets)}</div>` : ''}
      ${!it.places.length ? '<div class="xc-s">In the register, with no place on the master plan yet.</div>' : ''}
      ${canOpen ? `<div class="xc-a"><button type="button" class="xc-open" data-xopen="${escH(code)}">Open record ${escH(code)}</button>${info && info.progress ? `<button type="button" class="xc-prog" data-xprog="${escH(code)}">Progress</button>` : ''}</div>` : ''}</div>`;
    el.hidden = false; placeCard(el);
  }

  /* ---------------- one search, one set of chips, for both 2D and 3D */
  function hook() {
    if (typeof selectCode === 'function' && !selectCode.__merged) {
      const orig = selectCode;
      selectCode = function (code, place) {
        const r = orig.apply(this, arguments);
        const it = (typeof ITEMS !== 'undefined' ? ITEMS : []).find(x => x.code === norm(String(code)));
        if (it) { lastCode = it.code; card(it.code); if (in3d && ready3d) { const a = api3d(); if (a) { if (noFly) a.ring(it.code); else a.find(it.code); } } }
        return r;
      };
      selectCode.__merged = true;
    }
    if (typeof showCategory === 'function' && !showCategory.__merged) {
      const orig = showCategory;
      showCategory = function (id) { const r = orig.apply(this, arguments); curCat = id || null; if (in3d) sync3d(false); return r; };
      showCategory.__merged = true;
    }
    /* a pin tapped on the 3D model: the same card and list highlight as a tap here, without flying away from it */
    window.gc500Explorer3DPick = code => { noFly = true;try { selectCode(code, 0, true); } finally { noFly = false; } };
    const G = window.GC500Explorer || (window.GC500Explorer = {});
    G.mode3d = on => (on ? enter3d() : exit3d());
G.is3d = () => in3d;
    G.clearPick813 = () => { lastCode = null; hideCard(); const a = api3d(); if (a && ready3d) a.ring(null); };
  }

  function start() {
    addButton(); hook(); cardInputs();
    const want = location.hash === '#3d' || new URLSearchParams(location.search).get('mode') === '3d';
    if (want) enter3d();
  }
  (function waitReady() { if (window.__ready && typeof ITEMS !== 'undefined') start(); else setTimeout(waitReady, 120); })();
  /* a snapshot or a parent that lands after boot re-lays the 3D pins */
  window.addEventListener('message', () => {});
  window.GC500ExplorerRepin = () => { const a = api3d(); if (a && ready3d) { a.setPins(pins3d()); sync3d(false); } };

  /* ---------------- v7.02 - PLACED ON THE GROUND, AND PICKED FROM HERE.
   Andrew, 27 Sep 2026, of the page that changes deliveries: "an option to add location and pin it to the map where its
   going". Two things, both through this page's own registration (GEO.main.sheet_to_z18px, the same affine llOf and
   pins3d use), nothing new invented:
   - A reference the dashboard has placed or pinned (S.places / S.fixes) with no place on the master plan comes over
     in gc500PlanItems().placed as a latitude and longitude; it is put on the sheet here and ringed under its trade
     like any other, and its list line says how it got there rather than "on the master plan".
   - GC500Explorer.pickPoint(cb, {label}) turns the next plain tap on the plan into a latitude and longitude and hands
     it to cb; Esc or Cancel hands back null. A drag still pans and a pinch still zooms while it waits. */
  function z18Of(lat, lon) { return [(lon + 180) / 360 * W18, (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2 * W18]; }
  function invAff(m) { const a = m[0][0], b = m[0][1], c = m[0][2], d = m[1][0], e = m[1][1], f = m[1][2], det = a * e - b * d; if (!det) return null;
    return [[e / det, -b / det, (b * f - c * e) / det], [-d / det, a / det, (c * d - a * f) / det]]; }
  const apAff = (m, x, y) => [m[0][0] * x + m[0][1] * y + m[0][2], m[1][0] * x + m[1][1] * y + m[1][2]];
  const inRect = (r, x, y) => !!r && x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  /* a latitude and longitude as a point on the sheet: the main plan's, or the inset's where the inset draws that ground */
  function sheetOfLL(lat, lon) {
    if (typeof GEO === 'undefined' || !GEO || !GEO.main || !isFinite(lat) || !isFinite(lon)) return null;
    const z = z18Of(lat, lon), im = invAff(GEO.main.sheet_to_z18px); if (!im) return null;
    let p = apAff(im, z[0], z[1]);
    const r = GEO.inset && GEO.inset.sheet_region_pts;
    if (inRect(r, p[0], p[1])) { const ii = invAff(GEO.inset.sheet_to_z18px), q = ii && apAff(ii, z[0], z[1]); if (q && inRect(r, q[0], q[1])) p = q; else return null; }
    if (p[0] < -SHEET_W * .25 || p[0] > SHEET_W * 1.25 || p[1] < -SHEET_H * .25 || p[1] > SHEET_H * 1.25) return null;
    return [p[0] / SHEET_W, p[1] / SHEET_H];
  }
  /* the latitude and longitude under a point on the screen, in whichever mode is showing */
  function llAtScreen(x, y) {
    if (typeof GEO === 'undefined' || !GEO || !GEO.main || typeof screenToSource !== 'function') return null;
    const s = screenToSource(x, y), geo = typeof geoOn === 'function' && geoOn();
    if (geo) { const m = GEO.main.sheet_to_z18px, px = m[0][0] * s.x + m[0][1] * s.y + m[0][2], py = m[1][0] * s.x + m[1][1] * s.y + m[1][2];
      return [Math.atan(Math.sinh(Math.PI * (1 - 2 * py / W18))) * 180 / Math.PI, px / W18 * 360 - 180]; }
    return llOf(s.x, s.y);
  }
  /* the host's plan, with its placed references put on the sheet under their trade (and off the "no place yet" list) */
  if (typeof hostPlan === 'function' && !hostPlan.__placed) {
    const origHost = hostPlan;
    hostPlan = function () {
      const h = origHost.apply(this, arguments);
      if (!h || !Array.isArray(h.placed) || !h.placed.length) return h;
      const items = h.items.slice(), unplaced = (h.unplaced || []).slice(), done = new Set();
      h.placed.forEach(p => { const pt = p && p.ll ? sheetOfLL(+p.ll[0], +p.ll[1]) : null; if (!pt) return;
        items.push({key: p.key, trade: p.trade, name: p.name || '', pt, sec: '', assets: p.assets || '', placedHow: (p.how || 'placed') + (p.by ? ' by ' + p.by : '') + ' · not on the master plan'});
        done.add(p.key); });
      return Object.assign({}, h, {items, unplaced: unplaced.filter(u => !done.has(u.key))});
    };
    hostPlan.__placed = true;
  }
  /* what the items were last built from, so a refresh rebuilds only when the dashboard's answer has changed */
  const planSigOf = h => JSON.stringify(h ? [h.items.map(i => i.key + ':' + i.pt), (h.unplaced || []).length, (h.trades || []).map(t => t.name + ':' + t.count)] : null);
  let planSig = null;
  /* the list line of a placed reference says how it got there */
  if (typeof buildItems === 'function' && !buildItems.__placed) {
    const origBuild = buildItems;
    buildItems = function () {
      const r = origBuild.apply(this, arguments);
      try { planSig = planSigOf(HOST);
        const byKey = new Map(((HOST && HOST.items) || []).filter(i => i.placedHow).map(i => [norm(i.key), i.placedHow]));
        ITEMS.forEach(it => { if (byKey.has(it.code)) { it.placedHow = byKey.get(it.code); it.reg = Object.assign({}, it.reg, {sec: ''}); } }); } catch (e) {}
      return r;
    };
    buildItems.__placed = true;
  }
  if (typeof placeWord === 'function' && !placeWord.__placed) {
    const origWord = placeWord;
    placeWord = function (it) { return it && it.placedHow ? it.placedHow : origWord.apply(this, arguments); };
    placeWord.__placed = true;
  }
  /* the dashboard's record changed: the items again, only when what the host gives has changed, keeping the chip that
     is pressed and the reference that is picked, and without moving the camera */
  function refresh() {
    if (!window.__ready || typeof buildItems !== 'function') return false;
    let h = null; try { h = hostPlan(); } catch (e) { return false; }
    if (planSigOf(h) === planSig) return false;
    const on = document.querySelector('#chips .chip[aria-pressed="true"]'), onName = on ? (CATS_NOW.find(c => c.id === on.dataset.cat) || {}).name : null;
    const selCode = selected && selected.code;
    buildItems();
    const cat = onName ? CATS_NOW.find(c => c.name === onName) : null;
    if (cat) { const b = document.querySelector('#chips .chip[data-cat="' + cat.id + '"]'); if (b) b.setAttribute('aria-pressed', 'true');
      const keep = gotoRect; gotoRect = function () {}; try { showCategory(cat.id); } finally { gotoRect = keep; } }
    if (selCode) { const it = ITEMS.find(x => x.code === selCode); if (it) { selected = it; if (!marks.some(m => m.it === it)) marks = marks.concat([{it, c: it.cat ? it.cat.c : '#ff6a13'}]); } }
    try { window.GC500ExplorerRepin(); } catch (e) {}
    requestPaint();
    return true;
  }
  /* pick a point */
  let pickCb = null;
  /* the plan can be tapped once the loader has gone: the Map speed build (7253ae1d89da) says it is ready (__ready) before
     its first view is drawn, and until then the loader lies over the stage and takes the tap */
  const planShown = () => { const l = $$('loader'); return !l || l.classList.contains('done') || getComputedStyle(l).display === 'none'; };
  let pickLabel = '', pickWait = 0;
  function pickHint(label) {
    let el = $$('xpick');
    if (!el) { el = document.createElement('div'); el.id = 'xpick'; el.setAttribute('role', 'status');
      const st = document.createElement('style'); st.textContent = '#xpick{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:9;background:#ff6a13;color:#1b1207;border-radius:10px;padding:8px 10px 8px 14px;font:700 14px Inter,system-ui,sans-serif;display:flex;gap:10px;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.45);max-width:calc(100% - 24px)}#xpick[hidden]{display:none}#xpick button{background:#1b1207;color:#fff;border:0;border-radius:7px;padding:6px 10px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}body.picking #stage{cursor:crosshair}body.picking #xcard{display:none !important}';
      document.head.appendChild(st); ($$('stage') || document.body).appendChild(el);
      el.addEventListener('click', e => { if (e.target.closest('[data-xpickx]')) pickEnd(null); }); }
    pickLabel = label || '';
    const shown = !label || planShown();
    el.innerHTML = `<span>${escH(shown ? (label || 'Tap where it is going') : 'The plan is still drawing — ' + label.replace(/^Tap/, 'tap') + ' once it shows')}</span><button type="button" data-xpickx>Cancel</button>`;
    el.hidden = !label;
    clearTimeout(pickWait); if (label && !shown) pickWait = setTimeout(() => { if (pickCb && pickLabel) pickHint(pickLabel); }, 250);
  }
  function pickEnd(v) {
    const cb = pickCb; pickCb = null; clearTimeout(pickWait); document.body.classList.remove('picking'); pickHint('');
    if (cb) { try { cb(v); } catch (e) {} }
  }
  /* before the explorer's own tap (which picks a ring): a plain tap on the plan, while a pick waits, is the answer */
  document.addEventListener('click', e => {
    if (!pickCb) return;
    const st = $$('stage'); if (!st || !st.contains(e.target) || e.target.closest('button,input,.mini,.console,.legend,#xpick,#xcard,#loader') || !planShown()) return;
    const t = typeof tapPick !== 'undefined' ? tapPick : null;
    if (!t || performance.now() - t.t > 400) return;
    e.stopImmediatePropagation(); e.preventDefault(); tapPick = null;
    const ll = llAtScreen(t.x, t.y);
    if (!ll || !isFinite(ll[0]) || !isFinite(ll[1])) { toast('This drawing has no satellite registration here, so a tap cannot be turned into a position.', 6000); return; }
    pickEnd({lat: +ll[0].toFixed(7), lon: +ll[1].toFixed(7)});
  }, true);
  document.addEventListener('keydown', e => { if (pickCb && e.key === 'Escape') pickEnd(null); }, true);
  {
    const G = window.GC500Explorer || (window.GC500Explorer = {});
    G.refresh = refresh;
    G.pickPoint = (cb, opts) => {
      if (pickCb) { const old = pickCb; pickCb = null; try { old(null); } catch (e) {} }
      if (typeof cb !== 'function') { pickEnd(null); return false; }
      if (in3d) exit3d();
      pickHint(''); /* its style carries body.picking #xcard{display:none}: the reference card lies over the plan on a phone, so it is out of the way while a place is picked */
      pickCb = cb; document.body.classList.add('picking'); pickHint((opts && opts.label) || 'Tap where it is going');
      return true;
    };
    G.picking = () => !!pickCb;
    G.pickReady = () => !!pickCb && planShown();   /* waiting for a tap, and the plan is on screen to take it */
  }
})();
