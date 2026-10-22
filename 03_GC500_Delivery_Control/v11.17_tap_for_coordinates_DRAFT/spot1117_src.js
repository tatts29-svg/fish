/* Author: Andrew Fisher. v11.17 - Map explorer: press and hold anywhere for that spot's coordinates, and share them with a
   picture of the map (Andrew, 22 Oct 2026: "tap any where in here to get the exact map coordinates ... then attach and send
   a message with those coordinates and a map of that area"). The layer rides inside the explorer frame the way the v10.60
   shapes do: injected by the page, read-only, no record writes, pinned to the reviewed explorer build. */
(function(W){
 'use strict';
 if (W.gc500SpotLayer1117) return;
 /* the reviewed explorer build: every script it loads, in order (any other build and the layer stands down) */
 const EXPLORER_BUILD = 'explorer.js?v=e175ec073b2d|explorer-merge.js?v=7c276bb18154|fencing-map-core.js?v=0c26c3b7777f|fencing-map-explorer.js?v=e3a4bef6c17d|explorer-fix864.js?v=d7041320fc3f|explorer-fix887.js?v=6996471a6a0f';

 /* ------------------------------------------------------------------ the frame side: runs inside the explorer document */
 function frameMain(){
  'use strict';
  if (window.GC500Spot1117) return;
  /* the explorer's own pieces this layer reads (its lets live in the shared global scope, not on window) */
  const have = typeof stage !== 'undefined' && typeof canvas !== 'undefined' && typeof screenToSource === 'function' && typeof sheetToDevice === 'function' && typeof applyM === 'function' && typeof ap === 'function' && typeof inInset === 'function' && typeof geoOn === 'function' && typeof northOnSheet === 'function' && typeof currentView === 'function' && typeof toast === 'function' && typeof drawMarks === 'function' && typeof stagePoint === 'function' && typeof onControls === 'function';
  if (!have) return;
  const W18 = 512 * Math.pow(2, 18);                    /* the georeferencing is in Web Mercator pixels at z18, 512 px tiles */
  const HOLD_MS = 550, MOVE_PX = 8;                      /* press and hold, finger still, drops the pin */
  const WORDS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const S = {pin: null, press: null, suppressClick: false, fired: 0, pinEl: null, card: null, hinted: false};
  const r6 = v => Math.round(v * 1e6) / 1e6;
  const f6 = v => (Math.round(v * 1e6) / 1e6).toFixed(6);

  /* -------------------------------------------------------------------------------------- sheet point -> lat/lon */
  function matrixFor(x, y){
   if (!GEO || !GEO.main || !GEO.main.sheet_to_z18px) return null;
   /* in the original view the inset is drawn where it is printed, so a point inside it takes the inset's registration;
      on the satellite the inset has been moved to its true place, so every point is in the main frame */
   if (!geoOn() && GEO.inset && GEO.inset.sheet_to_z18px && inInset(x, y)) return GEO.inset.sheet_to_z18px;
   return GEO.main.sheet_to_z18px;
  }
  function sheetToLL(x, y){
   const M = matrixFor(x, y); if (!M) return null;
   const q = ap(M, x, y), lon = q[0] / W18 * 360 - 180, n = Math.PI - 2 * Math.PI * q[1] / W18, lat = 180 / Math.PI * Math.atan(Math.sinh(n));
   return Number.isFinite(lat) && Number.isFinite(lon) ? {lat, lon} : null;
  }
  function metresPerPt(x, y, lat){ const M = matrixFor(x, y); if (!M) return null; return Math.hypot(M[0][0], M[0][1]) * 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, 18) / 2; }
  function dist(a, b){ const R = 6371000, m = (a.lat + b.lat) / 2 * Math.PI / 180; return Math.hypot((b.lat - a.lat) * Math.PI / 180 * R, (b.lon - a.lon) * Math.PI / 180 * R * Math.cos(m)); }
  function bearing(a, b){ const m = (a.lat + b.lat) / 2 * Math.PI / 180, d = Math.atan2((b.lon - a.lon) * Math.cos(m), b.lat - a.lat) * 180 / Math.PI; return (d + 360) % 360; }
  const word = deg => WORDS[Math.round(deg / 45) % 8];
  /* the two nearest placed references within 200 m, with the spot's bearing from each */
  function nearest(ll){
   const out = [];
   for (const it of (Array.isArray(ITEMS) ? ITEMS : [])) {
    if (!it || !it.places || !it.places.length) continue;
    let best = null;
    for (const p of it.places) { const c = sheetToLL((p[0] + p[2]) / 2, (p[1] + p[3]) / 2); if (!c) continue; const d = dist(ll, c); if (!best || d < best.d) best = {d, c}; }
    if (best && best.d <= 200) out.push({code: it.code, d: Math.round(best.d), b: bearing(best.c, ll)});
   }
   out.sort((a, b) => a.d - b.d); return out.slice(0, 2);
  }
  const nearWords = near => near.map(n => n.d < 3 ? 'at ' + n.code : n.d + ' m ' + word(n.b) + ' of ' + n.code).join(' · ');
  const mapsUrl = ll => 'https://maps.google.com/?q=' + f6(ll.lat) + ',' + f6(ll.lon);
  const when = d => { try { return new Intl.DateTimeFormat('en-AU', {timeZone: 'Australia/Brisbane', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false}).format(d).replace(',', '') + ' AEST'; } catch (e) { return d.toISOString(); } };
  function words(){
   const p = S.pin; if (!p) return '';
   const lines = ['GC500 spot: ' + f6(p.ll.lat) + ', ' + f6(p.ll.lon)];
   if (p.near.length) lines.push(nearWords(p.near));
   lines.push(mapsUrl(p.ll));
   lines.push('Off the plan on satellite, give or take a metre or two (not a survey). ' + when(p.at) + '.');
   return lines.join('\n');
  }

  /* ------------------------------------------------------------------------------------------------- the pin */
  function els(){
   if (S.pinEl) return;
   const st = document.createElement('style'); st.id = 'spot1117-style';
   st.textContent = [
    '#spot1117pin{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:9;display:none}',
    '#spot1117pin i{position:absolute;left:-13px;top:-40px;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--or,#ff6a13);border:3px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,.45),0 6px 18px rgba(0,0,0,.6),0 0 22px rgba(255,106,19,.75)}',
    '#spot1117pin i::after{content:"";position:absolute;left:5px;top:5px;width:10px;height:10px;border-radius:50%;background:#fff}',
    '#spot1117pin b{position:absolute;left:-7px;top:-5px;width:14px;height:6px;border-radius:50%;background:rgba(0,0,0,.55);filter:blur(1px)}',
    '@keyframes spot1117drop{0%{transform:translateY(-18px) scale(1.15);opacity:0}100%{transform:none;opacity:1}}',
    '#spot1117pin.drop i{animation:spot1117drop .22s ease-out}',
    '#spot1117{position:absolute;left:12px;right:12px;bottom:12px;margin:0 auto;max-width:480px;z-index:40;background:rgba(26,22,20,.97);border:1px solid var(--or,#ff6a13);border-radius:14px;padding:12px 14px 12px;color:var(--ink,#f3efe9);box-shadow:0 10px 36px rgba(0,0,0,.6),0 0 28px rgba(255,106,19,.35);font:14px/1.35 Inter,system-ui,sans-serif}',
    '#spot1117[hidden]{display:none}',
    '#spot1117 .sp-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}',
    '#spot1117 .sp-head b{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--or2,#ff9a4d)}',
    '#spot1117 .sp-x{background:transparent;border:1px solid var(--rule,#2e2723);color:var(--mute,#a9a39c);border-radius:999px;width:36px;height:36px;font-size:16px;cursor:pointer}',
    '#spot1117 .sp-ll{font-size:22px;font-weight:800;letter-spacing:.01em;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 0 14px rgba(255,106,19,.45)}',
    '#spot1117 .sp-near{margin-top:4px;color:var(--ink,#f3efe9);font-weight:600}',
    '#spot1117 .sp-note{margin-top:4px;color:var(--mute,#a9a39c);font-size:12px}',
    '#spot1117 .sp-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
    '#spot1117 .sp-btns button{flex:1 1 auto;min-height:44px;border-radius:10px;border:1px solid var(--rule,#2e2723);background:#0b0908;color:var(--ink,#f3efe9);font:700 14px Inter,system-ui,sans-serif;padding:0 12px;cursor:pointer}',
    '#spot1117 .sp-btns button.primary{background:var(--or,#ff6a13);border-color:var(--or,#ff6a13);color:#1a0c04;box-shadow:0 0 18px rgba(255,106,19,.55)}',
    '#spot1117 .sp-btns button:active{transform:translateY(1px)}',
    '#spot1117 .sp-short{display:none}',
    '@media (max-width:600px){#spot1117{left:8px;right:8px;bottom:8px;padding:10px 12px}#spot1117 .sp-ll{font-size:19px}#spot1117 .sp-btns button{padding:0 10px;white-space:nowrap}#spot1117 .sp-long{display:none}#spot1117 .sp-short{display:inline}}'
   ].join('\n');
   document.head.appendChild(st);
   const pin = document.createElement('div'); pin.id = 'spot1117pin'; pin.setAttribute('aria-hidden', 'true'); pin.innerHTML = '<b></b><i></i>'; stage.appendChild(pin); S.pinEl = pin;
   const card = document.createElement('div'); card.id = 'spot1117'; card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Pinned spot');
   card.innerHTML = '<div class="sp-head"><b>Pinned spot</b><button type="button" class="sp-x" data-sp="clear" aria-label="Clear the pin">&#x2715;</button></div>'
    + '<div class="sp-ll" data-sp-ll></div><div class="sp-near" data-sp-near></div>'
    + '<div class="sp-note">Off the plan on satellite, give or take a metre or two. Not a survey.</div>'
    + '<div class="sp-btns"><button type="button" data-sp="copy">Copy</button><button type="button" class="primary" data-sp="share">Share with map</button><button type="button" data-sp="maps"><span class="sp-long">Open in Maps</span><span class="sp-short">Maps</span></button></div>';
   (stage.parentElement || document.body).appendChild(card); S.card = card;
   card.addEventListener('click', e => { const b = e.target.closest('[data-sp]'); if (!b) return; e.preventDefault(); const k = b.dataset.sp;
    if (k === 'clear') clear(); else if (k === 'copy') copy(words()).then(ok => toast(ok ? 'Copied: the coordinates, the nearest references and a Maps link.' : 'Could not copy on this device.'));
    else if (k === 'maps') { try { window.open(mapsUrl(S.pin.ll), '_blank', 'noopener'); } catch (err) {} } else if (k === 'share') share(); });
  }
  function place(){
   const p = S.pin, el = S.pinEl; if (!el) return;
   if (!p) { el.style.display = 'none'; return; }
   const c = applyM(sheetToDevice(fitScale * camera.z, sw, sh), p.x, p.y);
   const on = c.x > -30 && c.y > -50 && c.x < sw + 30 && c.y < sh + 30;
   el.style.display = on ? 'block' : 'none'; el.style.transform = 'translate(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px)';
  }
  function renderCard(){
   const p = S.pin, c = S.card; if (!c) return;
   if (!p) { c.hidden = true; try { const t = document.getElementById('toast'); if (t) t.style.bottom = ''; } catch (e) {} return; }
   c.querySelector('[data-sp-ll]').textContent = f6(p.ll.lat) + ', ' + f6(p.ll.lon);
   c.querySelector('[data-sp-near]').textContent = p.near.length ? nearWords(p.near) : 'No placed reference within 200 m';
   c.hidden = false;
   try { const t = document.getElementById('toast'); if (t) t.style.bottom = (c.offsetHeight + 24) + 'px'; } catch (e) {}
  }
  /* drop the pin at a stage point (CSS px); returns the pin or null when the registration is not loaded */
  function drop(cx, cy){
   const s = screenToSource(cx, cy), ll = sheetToLL(s.x, s.y);
   if (!ll) { toast('The satellite alignment has not loaded yet, so this spot has no coordinates. Try again in a moment.', 4500); return null; }
   els();
   S.pin = {x: s.x, y: s.y, ll: {lat: r6(ll.lat), lon: r6(ll.lon)}, near: nearest(ll), at: new Date()};
   S.pinEl.classList.remove('drop'); void S.pinEl.offsetWidth; S.pinEl.classList.add('drop');
   place(); renderCard(); reveal();
   try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {}
   return S.pin;
  }
  /* a pin dropped where the card now sits (low on a phone screen) is slid up into view: the map moves, the pin stays put */
  function reveal(){
   const p = S.pin, c = S.card; if (!p || !c || c.hidden) return;
   const at = applyM(sheetToDevice(fitScale * camera.z, sw, sh), p.x, p.y), clearTo = sh - c.offsetHeight - 24;
   if (at.y <= clearTo - 50) return;
   const dy = at.y - Math.max(70, clearTo / 2), centre = screenToSource(sw / 2, sh / 2 + dy);
   camera.cx = centre.x; camera.cy = centre.y;
   if (typeof changeView === 'function') changeView(false); else requestPaint();
   place();
  }
  function clear(){ S.pin = null; place(); renderCard(); }

  /* ----------------------------------------------------------------------------- press and hold, right-click */
  function cancelPress(){ if (S.press) { clearTimeout(S.press.timer); S.press = null; } }
  function fire(x, y){ S.fired = performance.now(); S.suppressClick = true; drop(x, y); }
  stage.addEventListener('pointerdown', e => {
   S.suppressClick = false;
   if (!e.isPrimary || e.button > 0 || onControls(e)) { cancelPress(); return; }
   if (typeof boxMode !== 'undefined' && boxMode) { cancelPress(); return; }
   cancelPress();
   const p = stagePoint(e);
   S.press = {x: p.x, y: p.y, id: e.pointerId, timer: setTimeout(() => { const pr = S.press; S.press = null; if (!pr) return; if (typeof pointers !== 'undefined' && pointers.size > 1) return; fire(pr.x, pr.y); }, HOLD_MS)};
  }, true);
  stage.addEventListener('pointermove', e => { const pr = S.press; if (!pr || pr.id !== e.pointerId) return; const p = stagePoint(e); if (Math.hypot(p.x - pr.x, p.y - pr.y) > MOVE_PX) cancelPress(); }, true);
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(t, cancelPress, true);
  /* the click that follows a long press must not pick a reference underneath */
  stage.addEventListener('click', e => { if (S.suppressClick) { S.suppressClick = false; e.stopImmediatePropagation(); e.preventDefault(); if (typeof tapPick !== 'undefined') tapPick = null; } }, true);
  /* a right-click on a laptop drops the pin; a phone's long-press menu is swallowed (the hold above has it) */
  stage.addEventListener('contextmenu', e => { if (onControls(e)) return; e.preventDefault(); if (performance.now() - S.fired < 900) return; cancelPress(); const p = stagePoint(e); S.suppressClick = true; S.fired = performance.now(); drop(p.x, p.y); }, true);

  /* the pin follows the camera: placed after every paint of the marks layer */
  const od = drawMarks; drawMarks = function(){ const r = od.apply(this, arguments); try { place(); } catch (e) {} return r; };

  /* --------------------------------------------------------------------------------------- copy and share */
  async function copy(text){ try { await navigator.clipboard.writeText(text); return true; } catch (e) {} try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; } }
  function download(file){ try { const a = document.createElement('a'), u = URL.createObjectURL(file); a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return true; } catch (e) { return false; } }
  /* the picture: the map as it is on screen around the pin, the pin, north, a scale bar, and a band with the words */
  function imagery(){ if (typeof mode !== 'undefined' && mode === 'original') return 'Drawing: GC500 master plan, its own aerial'; return typeof SOURCE !== 'undefined' && SOURCE === 'google' ? 'Imagery © Google' : '© Mapbox © OpenStreetMap © Maxar'; }
  function picture(){
   const p = S.pin; if (!p) return Promise.resolve(null);
   const cv = canvas, d = Math.max(1, dpr || 1), v = currentView(), Md = sheetToDevice(d * v.scale, cv.width, cv.height), c = applyM(Md, p.x, p.y);
   const side = Math.max(64, Math.round(Math.min(cv.width, cv.height) * 0.92));
   const sx = Math.max(0, Math.min(cv.width - side, Math.round(c.x - side / 2))), sy = Math.max(0, Math.min(cv.height - side, Math.round(c.y - side / 2)));
   const OUT = 1080, BAND = 190, o = document.createElement('canvas'); o.width = OUT; o.height = OUT + BAND; const g = o.getContext('2d');
   g.fillStyle = '#0f0d0c'; g.fillRect(0, 0, o.width, o.height);
   g.drawImage(cv, sx, sy, side, side, 0, 0, OUT, OUT);
   for (const id of ['shape1060', 'marks']) { const L = document.getElementById(id); if (L && L.width === cv.width && L.height === cv.height && L.style.display !== 'none') { try { g.drawImage(L, sx, sy, side, side, 0, 0, OUT, OUT); } catch (e) {} } }
   const k = OUT / side, px = (c.x - sx) * k, py = (c.y - sy) * k;
   /* the pin */
   g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
   g.beginPath(); g.ellipse(px, py, 12, 5, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(0,0,0,.55)'; g.fill();
   g.translate(px, py - 46); g.rotate(-Math.PI / 4); g.beginPath(); g.moveTo(22, 0); g.arcTo(22, 22, 0, 22, 22); g.arcTo(-22, 22, -22, 0, 22); g.arcTo(-22, -22, 0, -22, 22); g.lineTo(22, -22); g.closePath();
   g.fillStyle = '#ff6a13'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke(); g.restore();
   g.beginPath(); g.arc(px, py - 46, 8, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
   /* north arrow, top right */
   const n = northOnSheet();
   if (n) { const dx = Md[0] * n.x + Md[2] * n.y, dy = Md[1] * n.x + Md[3] * n.y, a = Math.atan2(dy, dx); g.save(); g.translate(OUT - 70, 78); g.rotate(a + Math.PI / 2);
    g.beginPath(); g.arc(0, 0, 44, 0, Math.PI * 2); g.fillStyle = 'rgba(15,13,12,.72)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke();
    g.beginPath(); g.moveTo(0, -34); g.lineTo(12, 10); g.lineTo(0, 2); g.lineTo(-12, 10); g.closePath(); g.fillStyle = '#ff6a13'; g.fill(); g.restore();
    g.save(); g.translate(OUT - 70, 78); g.rotate(a + Math.PI / 2); g.translate(0, -48); g.rotate(-(a + Math.PI / 2)); g.font = '800 22px Inter, system-ui, sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', 0, 0); g.restore(); }
   /* scale bar, bottom left of the map */
   const mpt = metresPerPt(p.x, p.y, p.ll.lat);
   if (mpt) { const mPerOut = mpt / (d * v.scale) / k; let m = 10; for (const cand of [10, 20, 25, 50, 100, 200, 250, 500]) { m = cand; if (cand / mPerOut >= 220) break; } const L = m / mPerOut;
    g.save(); g.translate(40, OUT - 44); g.fillStyle = 'rgba(15,13,12,.72)'; g.fillRect(-14, -34, L + 28, 54); g.fillStyle = '#fff'; g.fillRect(0, 0, L, 8); g.fillStyle = '#ff6a13'; g.fillRect(0, 0, L / 2, 8);
    g.font = '700 20px Inter, system-ui, sans-serif'; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; g.fillText(m + ' m', 0, -10); g.restore(); }
   /* the band */
   g.fillStyle = '#0f0d0c'; g.fillRect(0, OUT, OUT, BAND); g.fillStyle = '#ff6a13'; g.fillRect(0, OUT, OUT, 4);
   g.fillStyle = '#fff'; g.font = '800 44px Inter, system-ui, sans-serif'; g.textBaseline = 'alphabetic'; g.fillText(f6(p.ll.lat) + ', ' + f6(p.ll.lon), 36, OUT + 66);
   g.fillStyle = '#f3efe9'; g.font = '600 26px Inter, system-ui, sans-serif'; g.fillText(p.near.length ? nearWords(p.near) : 'GC500 site', 36, OUT + 112);
   g.fillStyle = '#a9a39c'; g.font = '500 20px Inter, system-ui, sans-serif'; g.fillText('GC500 Delivery Control · ' + when(p.at) + ' · ' + imagery(), 36, OUT + 158);
   return new Promise(res => { try { o.toBlob(b => res(b), 'image/png'); } catch (e) { res(null); } });
  }
  async function share(){
   const p = S.pin; if (!p) return 'nothing';
   const text = words(); let blob = null; try { blob = await picture(); } catch (e) { blob = null; }
   const file = blob ? new File([blob], 'GC500-spot-' + f6(p.ll.lat) + '_' + f6(p.ll.lon) + '.png', {type: 'image/png'}) : null;
   try {
    if (file && navigator.share && navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], text, title: 'GC500 spot'}); toast('Sent to the share sheet: the map picture and the words.'); return 'files'; }
    if (navigator.share) { await navigator.share({text, title: 'GC500 spot'}); if (file) download(file); toast('Sent to the share sheet; the map picture was saved to this device.'); return 'text'; }
   } catch (e) { if (e && e.name === 'AbortError') { toast('Not sent.'); return 'aborted'; } }
   const ok = await copy(text); if (file) download(file);
   toast((ok ? 'Copied the words; ' : 'Could not copy; ') + (file ? 'the map picture was saved to this device.' : 'no picture could be made.')); return ok ? 'copied' : 'failed';
  }

  /* a one-time hint when the plan is on screen */
  try { const key = 'spot1117hint'; if (window.GC500Explorer && window.GC500Explorer.ready && !sessionStorage.getItem(key)) { window.GC500Explorer.ready.then(() => { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); setTimeout(() => toast('Press and hold anywhere on the map for that spot’s coordinates.', 6000), 1200); }); } } catch (e) {}

  window.GC500Spot1117 = Object.freeze({version: 'v11.17', drop, clear, words, picture, share, sheetToLL, nearest,
   get state(){ const p = S.pin; return {pin: p ? {x: p.x, y: p.y, lat: p.ll.lat, lon: p.ll.lon, near: p.near} : null, card: !!(S.card && !S.card.hidden), pinShown: !!(S.pinEl && S.pinEl.style.display === 'block'), pressing: !!S.press}; }});
 }

 /* ------------------------------------------------------------------------------------------ the page side */
 const FRAME_JS = '/* Author: Andrew Fisher. v11.17 - Map explorer: press and hold for a spot\'s coordinates (injected by the page). */\n(' + frameMain.toString() + ')();';
 function mount(frame){
  try {
   const doc = frame && frame.contentDocument, win = frame && frame.contentWindow;
   if (!doc || !win || !doc.head || doc.readyState !== 'complete') return false;
   const url = new URL(doc.URL, location.href);
   if (url.origin !== location.origin || !/\/explorer\/index\.html$/.test(url.pathname)) return false;
   if ([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).join('|') !== EXPLORER_BUILD) return false;     /* a different explorer build: stand down */
   if (!doc.getElementById('stage') || !doc.getElementById('display') || typeof win.screenToSource !== 'function' || typeof win.sheetToDevice !== 'function' || typeof win.northOnSheet !== 'function' || typeof win.drawMarks !== 'function') return false;
   if (win.GC500Spot1117) return true;
   const s = doc.createElement('script'); s.id = 'spot1117-script'; s.textContent = FRAME_JS; doc.head.appendChild(s);
   return !!win.GC500Spot1117;
  } catch (e) { return false; }
 }
 W.gc500SpotLayer1117 = Object.freeze({version: 'v11.17', mount, frameScript: () => FRAME_JS});
 /* a frame already loaded before this script ran */
 try { const f = document.getElementById('expFrame'); if (f && f.contentDocument && f.contentDocument.readyState === 'complete') mount(f); } catch (e) {}
})(window);
