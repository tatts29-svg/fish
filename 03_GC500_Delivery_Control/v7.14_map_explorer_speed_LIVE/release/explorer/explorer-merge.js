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
    const a = api3d(); if (!a || !ready3d) return;
    a.showGroups(curCat ? [String(curCat)] : null);
    if (lastCode) { if (fly) a.find(lastCode); else a.ring(lastCode); }
  }

  /* ---------------- the 3D mode */
  function ensureFrame() {
    if (frame) return frame;
    const st = $$('stage'); if (!st) return null;
    frame = document.createElement('iframe');
    frame.id = 'model3d'; frame.title = 'The circuit in 3D'; frame.allow = 'fullscreen';
    frame.src = '../poc3d/index.html?embed=1&back=' + (new URLSearchParams(location.search).get('back') === 'e' ? 'e' : 'v');
    frame.addEventListener('load', () => {
      const t0 = Date.now();
      (function wait() {
        let ok = false; try { ok = !!frame.contentWindow.__ready && !!frame.contentWindow.GC500_3D; } catch (e) {}
        if (ok) { ready3d = true; frame.contentWindow.GC500_3D.setPins(pins3d()); sync3d(true); return; }
        if (Date.now() - t0 < 90000) setTimeout(wait, 150);
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
    try { const a = api3d(); if (a) a.stopOrbit(); } catch (e) {}
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
    st.addEventListener('pointerdown', e => { if (outside(e)) hideCard(); }, true);
    st.addEventListener('wheel', e => { if (outside(e)) hideCard(); }, {capture: true, passive: true});
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideCard(); });
    let rz = 0; window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => placeCard($$('xcard'))); });
  }
  function card(code) {
    let el = $$('xcard');
    if (!el) { el = document.createElement('div'); el.id = 'xcard'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Reference');
      const st = $$('stage'); (st || document.body).appendChild(el);
      el.addEventListener('click', e => { if (e.target.closest('[data-xclose]')) { el.hidden = true; return; }
        const o = e.target.closest('[data-xopen]'); if (o) { try { const h = host(); if (h && h.gc500ExplorerPicked) h.gc500ExplorerPicked(o.dataset.xopen); } catch (x) {} } });
      for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'dblclick', 'click']) el.addEventListener(ev, e => e.stopPropagation());
      el.addEventListener('wheel', e => e.stopPropagation(), {passive: true});
      el.addEventListener('load', () => placeCard(el), true); }
    const it = (typeof ITEMS !== 'undefined' ? ITEMS : []).find(x => x.code === code); if (!it) { el.hidden = true; return; }
    let info = null; try { const h = host(); if (h && typeof h.gc500PlanCard === 'function') info = h.gc500PlanCard(code); } catch (e) {}
    const name = (info && info.name) || (it.reg && it.reg.name) || '';
    const canOpen = !!(info && info.open);
    el.innerHTML = `${info && info.img ? `<img src="${escH(info.img)}" alt="" decoding="async">` : ''}
      <div class="xc-b"><div class="xc-t"><b>${escH(code)}</b>${name ? ` <span>${escH(name)}</span>` : ''}<button type="button" class="xc-x" data-xclose aria-label="Close">×</button></div>
      <div class="xc-m"><i style="background:${escH(it.cat.c)}"></i>${escH(it.cat.name)}${info && info.status ? ` <i style="background:${escH(info.statusColour || '#9aa3ad')};margin-left:8px"></i>${escH(info.status)}` : ''}${it.reg && it.reg.sec ? ` · ${escH(it.reg.sec)}` : ''}</div>
      ${info && info.pinned ? `<div class="xc-s">${escH(info.pinned)}</div>` : ''}
      ${info && info.assets ? `<div class="xc-s">Asset ${escH(info.assets)}</div>` : ''}
      ${!it.places.length ? '<div class="xc-s">In the register, with no place on the master plan yet.</div>' : ''}
      ${canOpen ? `<div class="xc-a"><button type="button" class="xc-open" data-xopen="${escH(code)}">Open ${escH(code)}</button></div>` : ''}</div>`;
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
    window.gc500Explorer3DPick = code => { noFly = true; try { selectCode(code); } finally { noFly = false; } };
    const G = window.GC500Explorer || (window.GC500Explorer = {});
    G.mode3d = on => (on ? enter3d() : exit3d());
    G.is3d = () => in3d;
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
})();
