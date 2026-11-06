/* Author: Andrew Fisher. v11.76 - find it on the map, picture it and send it. "In maps i want to search for a asset or a
   refernce no. Or gate no or vms no or stand no and take me pics of location on maps and i want a send to button also so i can
   send to phone" (Andrew, 24 Oct 2026).
   1. A "Find it on the map" box at the top of the Maps tab. It asks the page's own finder (references, register and unit
      asset numbers, gates, VMS boards, removal spots) and lists only the answers that have a position on the map.
   2. The grandstands. The master plan D001-26003-03 labels twenty stands S01 to S25 (with S22A) on the drawn stands; the page
      already holds each label's place on the sheet (the D001 markers tagged circuit_sector). Each one's position is that place
      through the master plan's own registration (the same fit that places MASTER_LAYERS) - image registration, not survey.
      "stand 5", "s5", "S05", "grandstand 22a" find them here and in the finder; the satellite map carries them as yellow pins.
   3. Picking an answer opens its card: a close picture and a wider picture of the spot (the site aerial with the master plan
      over it, a pin and the name, as the Text box draws its picture), and Send... (the phone's own share menu: Messages,
      WhatsApp, email - the pictures and the words with Google Maps directions), Text to a mobile (the service's existing
      picture-message route, on the edit link only), Navigate, Save pictures, Copy and Show on the satellite map.
   Nothing is written to the record. */
(function (W) {
'use strict';
const SRC = 'D001-26003-03';
const STANDS = __STANDS__;
const PIC = {w: 1000, h: 720, band: 104, maxBytes: 235000};
const VIEWS = [{key: 'close', halfM: 95, bar: 20, word: 'Close up'}, {key: 'wide', halfM: 420, bar: 100, word: 'Wider area'}];
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const navUrl = (lat, lon) => 'https://www.google.com/maps/dir/?api=1&destination=' + Number(lat).toFixed(6) + ',' + Number(lon).toFixed(6);
const held = fn => (typeof holdAssets === 'function' ? holdAssets(fn) : fn());
const plain = s => { try { if (typeof text747Plain === 'function') return text747Plain(s); } catch (e) {} return String(s).replace(/[·—–]/g, '-').replace(/[‘’]/g, "'").replace(/[^\x20-\x7e\n]/g, ''); };
const dayWord = () => { try { return fmtDate(todayIso()); } catch (e) { return new Date().toISOString().slice(0, 10); } };

/* ---- the grandstands ---- */
let standMemo = null;
function stands(){
 if (standMemo) return standMemo;
 standMemo = STANDS.map(s => { const num = s.face.replace(/^S0?/, '');
  return {kind: 'stand', id: s.face, face: s.face, num, label: 'Grandstand ' + s.face, lat: s.lat, lon: s.lon, fx: s.fx, fy: s.fy,
   name: 'grandstand · master plan ' + SRC, what: 'grandstand',
   how: 'master plan ' + SRC + ' - where the plan labels ' + s.face + ' on the drawn stand (image registration, not survey)', colour: '#ffd400'}; });
 return standMemo;
}
function parseStand(q){ /* "stand 5", "stand5", "s5", "s 05", "S22A", "grandstand 22a", "gs 7" */
 const m = /^\s*(?:grand\s*stand|grandstand|stand|gs|s)\s*0?(\d{1,2})\s*(a)?\s*$/i.exec(String(q || '')); if (!m) return null;
 const face = 'S' + String(m[1]).padStart(2, '0') + (m[2] ? 'A' : '');
 const hit = stands().filter(s => s.face === face);
 if (hit.length) return hit;
 return /^\s*(?:grand\s*stand|grandstand|stand|gs)/i.test(q) ? [] : null; /* "stand 3": the plan draws no S03 - say so; a bare "s3" may be anything */
}
const STAND_NONE = q => { const m = /(\d{1,2})\s*(a)?\s*$/i.exec(String(q || '')); return m ? 'S' + String(m[1]).padStart(2, '0') + (m[2] ? 'A' : '') : null; };

/* ---- the finder learns the grandstands ---- */
const idx0 = W.finderIndex;
if (typeof idx0 === 'function') W.finderIndex = function () { const out = idx0.apply(this, arguments);
 try { stands().forEach(s => out.push(Object.assign({}, s, {hay: ('stand ' + s.num + ' stand' + s.num + ' grandstand ' + s.num + ' ' + s.face + ' s' + s.num + ' grandstand stands seating where it is master plan ' + SRC).toLowerCase()}))); } catch (e) {}
 return out; };
const m0 = W.finderMatches;
if (typeof m0 === 'function') W.finderMatches = function (q) { const out = (m0.apply(this, arguments) || []).filter(it => it.kind !== 'stand');
 try { const s = String(q || '').trim().toLowerCase(); let hits = parseStand(s);
  if (!hits && /^(?:grand\s*)?stands?$/.test(s)) hits = stands();
  if (hits && hits.length) return hits.concat(out).slice(0, 14); } catch (e) {}
 return out; };
const r0 = W.finderRow;
if (typeof r0 === 'function') W.finderRow = function (it, i) {
 if (it && it.kind === 'stand') { const on = (typeof FINDER !== 'undefined' && FINDER && i === FINDER.at);
  return `<div class="fi stand1176${on ? ' on' : ''}" role="option" id="fi-${i}" aria-selected="${on}" data-fi="${i}">
 <span class="fipin" aria-hidden="true">${esc(it.face)}</span><span class="fim"><b>${esc(it.label)}</b>
 <span>${esc(it.name)} · where the plan labels it</span><span class="fiw">opens the Maps tab with its pictures, Send and Navigate</span></span><span class="fik">Stand</span></div>`; }
 return r0.apply(this, arguments); };
const p0 = W.finderPick;
if (typeof p0 === 'function') W.finderPick = function (i) { const it = (typeof FINDER !== 'undefined' && FINDER && FINDER.list || [])[i];
 const r = p0.apply(this, arguments);
 try { if (it && it.kind === 'stand') { try { if (typeof state !== 'undefined' && state) { state.sheet = '__explorer'; state.sel = null; } } catch (e) {} try { go('map'); } catch (e) {} setTimeout(() => W.Find1176.open(locate(it)), 350); } } catch (e) {}
 return r; };

/* ---- what has a place on the map ---- */
function assetLoc(key){
 let a = null; try { a = typeof assetOf === 'function' ? assetOf(key) : null; } catch (e) { a = null; }
 if (!a) return {kind: 'asset', id: key, label: key, what: '', none: 'not on the register'};
 let D = null; try { D = typeof dest782 === 'function' ? dest782(a) : null; } catch (e) { D = null; }
 const what = [a.name, (a.item_types || []).join(', ') || a.product].filter(Boolean).join(' · ');
 const base = {kind: 'asset', id: a.key, key: a.key, label: a.key, what, a};
 if (!D || !D.ll || !Number.isFinite(Number(D.ll.lat)) || !Number.isFinite(Number(D.ll.lon))) return Object.assign(base, {none: 'no position on the record yet'});
 const report = D.kind === 'report';
 return Object.assign(base, {lat: Number(D.ll.lat), lon: Number(D.ll.lon), tag: report ? a.key + ' - report here (pit lane)' : a.key,
  how: report ? 'no drop-off set yet - this is the pit lane, where the driver reports' : (D.approx ? D.sms + ' (approximate - check on site)' : 'position: ' + D.sms),
  warn: report ? 'No drop-off is set for ' + a.key + ' yet. The picture shows the pit lane, where the driver reports and site directs them.' : D.approx ? 'This position is approximate - check on site.' : ''});
}
function locate(it){
 if (!it) return null;
 if (it.kind === 'asset' || it.kind === 'unit') return assetLoc(it.key);
 if (it.kind === 'gate') return {kind: 'gate', id: it.id, label: it.label, what: 'spectator gate', lat: Number(it.lat), lon: Number(it.lon), tag: it.label, how: it.how || ('master plan ' + SRC)};
 if (it.kind === 'stand') return {kind: 'stand', id: it.id, label: it.label, what: 'grandstand', lat: Number(it.lat), lon: Number(it.lon), tag: it.face, how: it.how};
 if (it.kind === 'vms') return {kind: 'vms', id: it.label, label: it.label, what: 'VMS board' + (it.where ? ' · ' + it.where : ''), lat: Number(it.lat), lon: Number(it.lon), tag: it.label,
  how: 'the board’s position on the record (pinned on site or read from the VMS plan)', none: Number.isFinite(Number(it.lat)) ? '' : 'no position on the record'};
 if (it.kind === 'spot') return {kind: 'spot', id: 'spot:' + (it.name || it.label), label: (it.name || it.label), what: 'VMS removal spot' + (it.label ? ' for ' + it.label : ''), lat: Number(it.lat), lon: Number(it.lon), tag: it.name || it.label,
  how: 'where the end-of-session board goes, as the removals plan places it'};
 return null;
}
function search(q){
 const s = String(q || '').trim(); if (!s) return {rows: [], note: ''};
 let list = []; held(() => { try { list = W.finderMatches(s) || []; } catch (e) { list = []; } });
 const seen = new Set(), rows = [];
 list.forEach(it => { const L = locate(it); if (!L) return; const k = L.kind === 'unit' ? 'asset:' + L.id : L.kind + ':' + L.id; if (seen.has(k)) return; seen.add(k); rows.push(L); });
 const ps = parseStand(s), note = ps && !ps.length ? 'The master plan draws no grandstand ' + STAND_NONE(s) + '. It labels ' + stands().map(x => x.face).join(', ') + '.' : '';
 return {rows: ps && !ps.length ? [] : rows.slice(0, 10), note};
}

/* ---- the pictures: the site aerial with the master plan over it, a pin, the name, a scale bar and north ---- */
function loadImg(src, cors){ return new Promise((ok, no) => { const im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => ok(im); im.onerror = () => no(new Error('a map picture would not load')); im.src = src; }); }
/* the site aerial covers the circuit and its surrounds; a spot outside it (a VMS board out on the roads) is pictured on the
   same satellite imagery the Maps tab's satellite map uses, north up, without the plan */
function inAerial(L){ try { const fr = DATA.georef && typeof frameOf === 'function' ? frameOf(L.lat, L.lon) : null; return !!(fr && fr.ax > 0.01 && fr.ax < 0.99 && fr.ay > 0.01 && fr.ay < 0.99 && (DATA.sheets || []).some(s => s.key === 'AERIAL' && typeof s.src === 'string')); } catch (e) { return false; } }
function canPicture(L){ return !!(L && Number.isFinite(L.lat) && Number.isFinite(L.lon) && !!document.createElement('canvas').getContext); }
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/';
function pinAt(c, X, Y, mPx, tag){
 const Wd = PIC.w;
 c.save(); c.strokeStyle = 'rgba(255,106,19,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(X, Y, Math.max(16, 8 * mPx), 0, Math.PI * 2); c.stroke(); c.restore();
 c.save(); c.translate(X, Y); c.fillStyle = '#ff6a13'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineJoin = 'round';
 c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-30, -34, -30, -64, 0, -68); c.bezierCurveTo(30, -64, 30, -34, 0, 0); c.closePath(); c.stroke(); c.fill();
 c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -46, 9, 0, Math.PI * 2); c.fill(); c.restore();
 c.save(); c.font = 'bold 30px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'; c.textBaseline = 'middle'; const lw = c.measureText(tag).width + 26, lx = Math.max(8, Math.min(Wd - lw - 8, X + 30)), ly = Math.max(24, Y - 88);
 c.fillStyle = 'rgba(16,22,27,.92)'; c.beginPath(); c.roundRect ? c.roundRect(lx, ly - 22, lw, 44, 10) : c.rect(lx, ly - 22, lw, 44); c.fill(); c.fillStyle = '#ff6a13'; c.fillText(tag, lx + 13, ly + 1); c.restore();
}
function finish(c, cv, L, V, mPx, across, up, source){
 const Wd = PIC.w, H = PIC.h;
 c.save(); c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 4; c.shadowColor = 'rgba(0,0,0,.7)'; c.shadowBlur = 4; c.beginPath(); c.moveTo(24, H - 26); c.lineTo(24 + V.bar * mPx, H - 26); c.stroke(); c.font = 'bold 18px system-ui, sans-serif'; c.fillText(V.bar + ' m', 24, H - 36);
 const b = (up || 0) * Math.PI / 180, nx = Wd - 46, ny = H - 46, ux = -Math.sin(b), uy = -Math.cos(b);
 c.beginPath(); c.moveTo(nx + ux * 28, ny + uy * 28); c.lineTo(nx - ux * 14 + uy * 10, ny - uy * 14 - ux * 10); c.lineTo(nx - ux * 14 - uy * 10, ny - uy * 14 + ux * 10); c.closePath(); c.fill(); c.font = 'bold 16px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('N', nx + ux * 40, ny + uy * 40 + 6); c.restore();
 const fit2 = (s, f, max) => { c.font = f; let cut = false; while (c.measureText(s + (cut ? '…' : '')).width > max && s.length > 8) { s = s.slice(0, -2); cut = true; } return cut ? s.replace(/[\s·—\-,]+$/, '') + '…' : s; };
 c.save(); c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
 c.fillText(fit2(L.label + (L.what ? ' · ' + L.what : ''), 'bold 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif', Wd - 240), 24, H + 44);
 c.fillStyle = '#c9d1d9'; c.fillText(fit2(L.lat.toFixed(5) + ', ' + L.lon.toFixed(5) + ' · ' + V.word.toLowerCase() + ', about ' + Math.round(across / 10) * 10 + ' m across · ' + (L.how || '') + (source ? ' · ' + source : ''), '21px system-ui, -apple-system, Segoe UI, Roboto, sans-serif', Wd - 240), 24, H + 80);
 c.textAlign = 'right'; c.fillStyle = '#ff6a13'; c.font = 'bold 22px system-ui, sans-serif'; c.fillText('Coates GC500', Wd - 24, H + 44); c.fillStyle = '#9aa3ad'; c.font = '17px system-ui, sans-serif'; c.fillText(dayWord(), Wd - 24, H + 78); c.restore();
 let q = 0.86, url = cv.toDataURL('image/jpeg', q); const bytesOf = u => Math.floor((u.length - u.indexOf(',') - 1) * 3 / 4);
 while (bytesOf(url) > PIC.maxBytes && q > 0.45) { q = Math.round((q - 0.08) * 100) / 100; url = cv.toDataURL('image/jpeg', q); }
 return {url, bytes: bytesOf(url), quality: q};
}
async function pictureSat(L, V){
 const Wd = PIC.w, H = PIC.h, B = PIC.band, cos = Math.cos(L.lat * Math.PI / 180);
 const z = Math.max(12, Math.min(19, Math.floor(Math.log2(156543.03392 * cos / (2 * V.halfM / Wd))))), mpp = 156543.03392 * cos / Math.pow(2, z);
 const n = 256 * Math.pow(2, z), wx = (L.lon + 180) / 360 * n, sn = Math.sin(L.lat * Math.PI / 180), wy = (0.5 - Math.log((1 + sn) / (1 - sn)) / (4 * Math.PI)) * n;
 const x0 = wx - Wd / 2, y0 = wy - H / 2, loads = [];
 for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y0 + H) / 256); ty++) for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x0 + Wd) / 256); tx++) loads.push(loadImg(SAT + z + '/' + ty + '/' + tx, true).then(im => ({im, tx, ty})).catch(() => null));
 const tiles = (await Promise.all(loads)).filter(Boolean); if (!tiles.length) throw new Error('the satellite pictures would not load');
 const cv = document.createElement('canvas'); cv.width = Wd; cv.height = H + B; const c = cv.getContext('2d');
 c.fillStyle = '#10161b'; c.fillRect(0, 0, Wd, H + B); c.save(); c.beginPath(); c.rect(0, 0, Wd, H); c.clip(); tiles.forEach(({im, tx, ty}) => c.drawImage(im, tx * 256 - x0, ty * 256 - y0, 256, 256)); c.restore();
 const mPx = 1 / mpp; pinAt(c, Wd / 2, H / 2, mPx, String(L.tag || L.label));
 const f = finish(c, cv, L, V, mPx, Wd * mpp, 0, 'satellite: Esri World Imagery');
 return {view: V.key, word: V.word, dataUrl: f.url, bytes: f.bytes, w: Wd, h: H + B, quality: f.quality, plan: false, source: 'satellite', across: Math.round(Wd * mpp)};
}
async function picture(L, V){
 if (!inAerial(L)) return pictureSat(L, V);
 const g = DATA.georef, fr = frameOf(L.lat, L.lon); if (!g || !fr) throw new Error('this spot is outside the site aerial');
 const aer = (DATA.sheets || []).find(s => s.key === 'AERIAL'); if (!aer || typeof aer.src !== 'string') throw new Error('the aerial is not on this page');
 const Wd = PIC.w, H = PIC.h, B = PIC.band, FX = g.frame_px[0], FY = g.frame_px[1];
 const pxPerM = 1 / g.m_per_frame_px_ground; let fw = 2 * V.halfM * pxPerM, fh = fw * H / Wd;
 if (fw > FX) { fw = FX; fh = fw * H / Wd; } if (fh > FY) { fh = FY; fw = fh * Wd / H; }
 let x0 = fr.ax * FX - fw / 2, y0 = fr.ay * FY - fh / 2; x0 = Math.max(0, Math.min(FX - fw, x0)); y0 = Math.max(0, Math.min(FY - fh, y0));
 const im = await loadImg(aer.src), sx = im.naturalWidth / FX, sy = im.naturalHeight / FY;
 const cv = document.createElement('canvas'); cv.width = Wd; cv.height = H + B; const c = cv.getContext('2d');
 c.fillStyle = '#10161b'; c.fillRect(0, 0, Wd, H + B); c.drawImage(im, x0 * sx, y0 * sy, fw * sx, fh * sy, 0, 0, Wd, H);
 let plan = false;
 try { const d1 = (DATA.sheets || []).find(s => s.key === 'D001'), fit = d1 && typeof sheetFitOf === 'function' ? sheetFitOf(d1) : null;
  if (fit && typeof MAP_TILES !== 'undefined' && MAP_TILES && MAP_TILES.levels && DATA.media) {
   const lv = V.halfM > 200 ? 0 : Math.min(1, MAP_TILES.levels.length - 1), Lv = MAP_TILES.levels[lv], T = MAP_TILES.tile;
   const px0 = (fit.fx.k * (x0 / FX) + fit.fx.c) * Lv.w, px1 = (fit.fx.k * ((x0 + fw) / FX) + fit.fx.c) * Lv.w;
   const py0 = (fit.fy.k * (y0 / FY) + fit.fy.c) * Lv.h, py1 = (fit.fy.k * ((y0 + fh) / FY) + fit.fy.c) * Lv.h;
   if (px1 > px0 && py1 > py0) { const kx = Wd / (px1 - px0), ky = H / (py1 - py0), loads = [];
    for (let r = Math.max(0, Math.floor(py0 / T)); r <= Math.min(Lv.rows.length - 1, Math.floor(py1 / T)); r++)
     for (let cc = Math.max(0, Math.floor(px0 / T)); cc <= Math.min(Lv.rows[0].length - 1, Math.floor(px1 / T)); cc++) { const u = DATA.media[Lv.rows[r][cc]]; if (typeof u === 'string') loads.push(loadImg(u).then(im2 => ({im2, r, cc})).catch(() => null)); }
    const tiles = (await Promise.all(loads)).filter(Boolean);
    if (tiles.length) { c.save(); c.beginPath(); c.rect(0, 0, Wd, H); c.clip(); c.globalAlpha = 0.58; c.globalCompositeOperation = 'multiply';
     tiles.forEach(({im2, r, cc}) => c.drawImage(im2, (cc * T - px0) * kx, (r * T - py0) * ky, im2.naturalWidth * kx + 0.6, im2.naturalHeight * ky + 0.6)); c.restore(); plan = true; } } } } catch (e) { plan = false; }
 const X = (fr.ax * FX - x0) / fw * Wd, Y = (fr.ay * FY - y0) / fh * H, mPx = Wd / (fw / pxPerM);
 pinAt(c, X, Y, mPx, String(L.tag || L.label));
 const f = finish(c, cv, L, V, mPx, fw / pxPerM, g.up_is_bearing_deg || 0, plan ? 'aerial with the master plan' : 'site aerial');
 return {view: V.key, word: V.word, dataUrl: f.url, bytes: f.bytes, w: Wd, h: H + B, quality: f.quality, plan, source: 'aerial', across: Math.round(fw / pxPerM)};
}
function fileOf(pic, L){
 const bin = atob(pic.dataUrl.split(',')[1]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
 const name = ('GC500-' + String(L.tag || L.label).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') + '-' + pic.view + '.jpg');
 return new File([u8], name, {type: 'image/jpeg'});
}
function words(L){
 return plain('Coates GC500: ' + L.label + (L.what ? ' (' + L.what.replace(/ · /g, ', ') + ')' : '') + '. Directions: ' + navUrl(L.lat, L.lon) + (L.warn ? ' ' + L.warn : ''));
}

/* ---- the card ---- */
async function serviceReady(){
 let ready = false, mms = null, today = null;
 try { if (typeof SYNC !== 'undefined' && SYNC.readonly) return {ready: false};
  const r = await fetch('/api/sms', {headers: {'x-gc500-token': tokenOf()}}); const j = await r.json(); ready = !!j.configured; today = j.today || null; } catch (e) { ready = false; }
 if (ready) { try { const r = await fetch('/api/mms', {headers: {'x-gc500-token': tokenOf()}}); if (r.ok) mms = await r.json(); } catch (e) { mms = null; } }
 return {ready, mms, today, mmsOn: !!(ready && mms && mms.configured && !mms.from_needed)};
}
function open(L){
 if (!L) return null;
 const prev = document.querySelector('.drawer.find1176'); if (prev) prev.remove();
 const has = Number.isFinite(L.lat) && Number.isFinite(L.lon), canPic = has && canPicture(L);
 const d = document.createElement('div'); d.className = 'drawer on find1176'; d.style.zIndex = 31; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'f1176h');
 const text = has ? words(L) : '';
 d.innerHTML = `<div class="dh"><div><h2 id="f1176h">${esc(L.label)} · on the map</h2><div class="sub">${esc(L.what || '')}${L.what ? ' · ' : ''}${esc(has ? L.how : (L.none || 'no position on the record'))}</div></div>
 <button class="close" aria-label="Close" title="Close">&times;</button></div>
 <div class="db">
 ${L.warn ? `<p class="f1176-warn">${esc(L.warn)}</p>` : ''}
 ${!has ? `<p class="hint">${esc(L.label)} has ${esc(L.none || 'no position on the record')}, so there is nothing to picture or send yet.${L.a ? ' Its details open from the button below.' : ''}</p>` : ''}
 ${has && canPic ? `<div class="f1176-pics">${VIEWS.map(V => `<figure data-view="${V.key}"><div class="f1176-pic"><span class="f1176-wait">Drawing the ${esc(V.word.toLowerCase())} picture…</span><img alt="${esc(V.word + ': where ' + L.label + ' is, on the map')}" hidden></div><figcaption>${esc(V.word)}</figcaption></figure>`).join('')}</div>` : ''}
 ${has && !canPic ? `<p class="hint">This browser cannot draw pictures here; Navigate, Send and the words still work.</p>` : ''}
 <p class="hint" id="f1176msg" role="status" aria-live="polite"></p>
 <div class="f1176-acts">
 ${has ? `<button class="btn primary" type="button" data-f1176="share">Send…</button>
 <a class="btn" data-f1176="nav" href="${esc(navUrl(L.lat, L.lon))}" target="_blank" rel="noopener noreferrer">Navigate ↗</a>
 ${canPic ? '<button class="btn" type="button" data-f1176="save">Save pictures</button>' : ''}
 <button class="btn" type="button" data-f1176="copy">Copy words + directions</button>
 <a class="btn ghost" data-f1176="sms" href="sms:?&body=${encodeURIComponent(text)}">Open a text message</a>
 <button class="btn ghost" type="button" data-f1176="ring">Show on the satellite map</button>` : ''}
 ${L.a ? '<button class="btn ghost" type="button" data-f1176="details">Open its details</button>' : ''}
 </div>
 ${has ? `<details class="f1176-text" hidden><summary>Text it to a mobile${canPic ? ', with the close-up picture' : ''}</summary>
 <div class="f"><label for="f1176to">Mobile number</label><input id="f1176to" type="tel" inputmode="tel" autocomplete="off" placeholder="04xx xxx xxx — separate numbers with commas"></div>
 <div class="f"><label for="f1176tx">Message</label><textarea id="f1176tx" rows="4" style="width:100%;font:inherit">${esc(text)}</textarea></div>
 <label class="f1176-tick" hidden><input type="checkbox" id="f1176pic" checked> <span>Include the close-up picture (MMS). Picture messages cost more than plain texts.</span></label>
 <p class="hint" id="f1176tmsg" role="status" aria-live="polite"></p><div id="f1176res" aria-live="polite"></div>
 <div class="df" style="padding:0"><button class="btn ghost" type="button" data-f1176="dry">Check it, send nothing</button><button class="btn primary" type="button" data-f1176="send">Send</button><button class="btn ghost" type="button" data-f1176="again" hidden>Prepare another message</button></div>
 </details>` : ''}
 <p class="norate">${has ? (inAerial(L) ? 'Pictures: the site aerial with the master plan ' + esc(SRC) + ' over it, drawn here from the page’s own pictures. ' : 'Pictures: Esri World Imagery (Esri, Maxar, Earthstar Geographics and the GIS User Community), north up — this spot is outside the site aerial. ') : ''}Send… hands the pictures and words to your phone’s share menu; delivery is up to the app you choose. Nothing here changes the record.</p>
 </div>`;
 (typeof mounted === 'function' ? mounted : x => x)(document.body.appendChild(d));
 const msg = d.querySelector('#f1176msg'); const pics = {};
 const close = () => { d.remove(); };
 d.querySelector('.close').onclick = close;
 d.addEventListener('keydown', ev => { if (ev.key === 'Escape') close(); });
 if (has && canPic) VIEWS.forEach(V => { const fig = d.querySelector(`figure[data-view="${V.key}"]`), img = fig.querySelector('img'), wait = fig.querySelector('.f1176-wait');
  picture(L, V).then(p => { pics[V.key] = p; img.src = p.dataUrl; img.hidden = false; if (wait) wait.remove(); fig.querySelector('figcaption').textContent = V.word + ' · about ' + Math.round(p.across / 10) * 10 + ' m across'; })
   .catch(e => { if (wait) wait.textContent = 'The picture could not be drawn: ' + String(e && e.message || e); }); });
 d._pics = pics; d._loc = L;
 const ready = () => VIEWS.every(V => pics[V.key]) || !canPic;
 const act = {
  share: async () => {
   if (!ready()) { msg.textContent = 'The pictures are still being drawn — a moment.'; return; }
   const files = canPic ? VIEWS.map(V => fileOf(pics[V.key], L)) : [];
   let can = false; try { can = !!navigator.share && (!files.length || (!!navigator.canShare && navigator.canShare({files}))); } catch (e) { can = false; }
   if (!can) { if (files.length) act.save(); try { await navigator.clipboard.writeText(text); msg.textContent = 'This browser cannot open a share menu, so the pictures were saved and the words copied — paste them into a message.'; } catch (e) { msg.textContent = 'This browser cannot open a share menu: save the pictures and copy the words below.'; } return; }
   try { await navigator.share(Object.assign({title: 'Coates GC500 · ' + L.label, text}, files.length ? {files} : {})); msg.textContent = 'Share menu closed. Delivery is handled by the app you chose.'; }
   catch (e) { msg.textContent = e && e.name === 'AbortError' ? 'Share cancelled. Nothing was sent.' : 'The share menu would not open: save the pictures and copy the words instead.'; } },
  save: () => { if (!ready()) { msg.textContent = 'The pictures are still being drawn — a moment.'; return; }
   VIEWS.forEach(V => { const f = fileOf(pics[V.key], L), url = URL.createObjectURL(f), a = document.createElement('a'); a.href = url; a.download = f.name; a.setAttribute('data-ro', ''); d.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); });
   msg.textContent = 'Picture downloads requested. On a phone you can also press and hold a picture to save or share it.'; },
  copy: async () => { try { await navigator.clipboard.writeText(text); msg.textContent = 'Words and directions copied.'; } catch (e) { msg.textContent = 'Your browser would not let the page copy — the words are in the text box under "Text it to a mobile", or use Open a text message.'; } },
  ring: () => { close(); try { if (typeof state !== 'undefined' && state) { state.sheet = '__explorer'; state.sel = null; } } catch (e) {} try { if (!document.getElementById('pane-map') || !document.getElementById('pane-map').offsetParent) go('map'); } catch (e) {}
   try { if (typeof W.gate1156Zoom === 'function') W.gate1156Zoom(L.lat, L.lon, L.id); } catch (e) {} try { flash(L.label + ' — ringed on the satellite map.'); } catch (e) {} },
  details: () => { close(); try { openAsset(L.a.key); } catch (e) {} }
 };
 d.addEventListener('click', ev => { const b = ev.target.closest('[data-f1176]'); if (!b) return; const k = b.dataset.f1176; if (act[k]) { if (b.tagName !== 'A') ev.preventDefault(); act[k](); } });
 if (has) serviceReady().then(S0 => { const box = d.querySelector('.f1176-text'); if (!box || !S0.ready) return; box.hidden = false; d._svc = S0;
  if (S0.mmsOn && canPic) box.querySelector('.f1176-tick').hidden = false;
  if (S0.today) box.querySelector('#f1176tmsg').textContent = S0.today.left + ' of today’s ' + S0.today.cap + ' texts left';
  wireText(d, L, S0, pics, canPic); });
 W.Find1176.last = d; return d;
}
function wireText(d, L, S0, pics, canPic){
 const tmsg = d.querySelector('#f1176tmsg'), res = d.querySelector('#f1176res'), send = d.querySelector('[data-f1176="send"]'), dry = d.querySelector('[data-f1176="dry"]'), again = d.querySelector('[data-f1176="again"]');
 let rows = [];
 const max = typeof TEXT747_SERVICE_MAX === 'number' ? TEXT747_SERVICE_MAX : 480;
 const buttons = () => { send.disabled = !!(d._busy || d._locked); dry.disabled = !!d._busy; again.hidden = !d._locked; };
 const run = async isDry => {
  if (d._busy || (!isDry && d._locked)) return;
  const to = d.querySelector('#f1176to').value.split(/[,;\n]+/).map(x => x.replace(/\s+/g, '')).filter(Boolean);
  if (!to.length) { tmsg.textContent = 'Put a number in first.'; return; }
  const body0 = d.querySelector('#f1176tx').value; if (body0.length > max) { tmsg.textContent = 'Trim the message to ' + max + ' characters before sending.'; return; }
  const tick = d.querySelector('#f1176pic'), withPic = !!(S0.mmsOn && canPic && tick && tick.checked && !tick.closest('[hidden]'));
  if (withPic && !pics.close) { tmsg.textContent = 'The picture is still being drawn — a moment.'; return; }
  d._busy = true; buttons(); tmsg.textContent = isDry ? 'Checking — nothing will be sent…' : 'Submitting the message…';
  try {
   const body = withPic ? {to, text: body0, subject: ('Coates GC500 ' + (L.tag || L.label)).slice(0, 20), picture: pics.close.dataUrl, dry_run: !!isDry} : {to, text: body0, dry_run: !!isDry};
   const r = await fetch(withPic ? '/api/mms' : '/api/sms', {method: 'POST', headers: {'Content-Type': 'application/json', 'x-gc500-token': tokenOf(), 'x-gc500-who': ((typeof S !== 'undefined' && S.operator) || '').trim() || 'unnamed'}, body: JSON.stringify(body)});
   const j = await r.json();
   if (isDry) { tmsg.textContent = r.ok && j.dry_run ? 'The message passed the format check. Nothing was sent by this check.' : 'The check did not pass. Nothing was sent. ' + (j.error || 'Check the number and message.'); return; }
   rows = typeof sms777Submission === 'function' ? sms777Submission(j, to) : [];
   const before = [400, 401, 403, 413, 429, 501].includes(r.status) && !Array.isArray(j.messages);
   if (before) rows.forEach(x => { x.rejected = true; x.delivery_status = 'failed'; x.submission_status = 'NOT_SUBMITTED'; });
   d._locked = rows.some(x => !x.rejected);
   const ok = rows.filter(x => x.accepted).length, bad = rows.filter(x => x.rejected).length;
   tmsg.textContent = ok ? ok + ' of ' + rows.length + ' accepted by the messaging service. Delivery is not confirmed.' : bad === rows.length ? 'The messaging service did not accept these messages. ' + (j.error || '') : 'The send result is unknown. Check before trying again; it may already have been accepted.';
   if (typeof sms777Results === 'function') sms777Results(res, rows);
  } catch (e) { if (isDry) tmsg.textContent = 'The format check could not finish. Nothing was sent by this check.'; else { d._locked = true; tmsg.textContent = 'The connection ended before the result arrived. The message may have been accepted. Check before sending again.'; } }
  finally { d._busy = false; buttons(); }
 };
 send.onclick = () => run(false); dry.onclick = () => run(true);
 again.onclick = () => { if (d._busy) return; if (!confirm('The earlier message may already have arrived. Preparing another can send a duplicate. Continue?')) return; d._locked = false; rows = []; res.innerHTML = ''; tmsg.textContent = 'Check the number and message before pressing Send.'; buttons(); };
 buttons();
}

/* ---- the box at the top of the Maps tab ---- */
function boxHtml(){
 return `<section class="card f1176-find" id="f1176find" aria-labelledby="f1176findh"><h3 id="f1176findh">Find it on the map</h3>
 <form class="f1176-row" role="search" data-ro><label class="sr" for="f1176q">Asset number, reference, gate, VMS board or grandstand</label>
 <input id="f1176q" type="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="Asset no, reference, gate, VMS or stand — e.g. 1244536, WC41, gate 6, VMS 10, stand 5" data-ro>
 <button class="btn primary" type="submit" data-ro>Find</button></form>
 <div class="f1176-list" id="f1176list" role="listbox" aria-label="Places found"></div></section>`;
}
function rowHtml(L, i){
 const chip = {asset: L.id, gate: L.label.replace('Gate ', 'G'), stand: L.tag, vms: 'VMS', spot: 'VMS'}[L.kind] || '•';
 return `<button type="button" class="f1176-hit${L.none ? ' none' : ''}" role="option" data-f1176-hit="${i}"><span class="f1176-chip k-${esc(L.kind)}">${esc(String(chip).slice(0, 6))}</span><span class="f1176-m"><b>${esc(L.label)}</b>${L.what ? ' · ' + esc(L.what) : ''}<small>${esc(L.none ? L.none : (L.warn ? L.warn : L.how))}</small></span><span class="f1176-go">${L.none ? 'Details' : 'Pictures · Send'}</span></button>`;
}
function wireBox(sec){
 if (sec.__f1176) return; sec.__f1176 = true;
 const q = sec.querySelector('#f1176q'), list = sec.querySelector('#f1176list'); let rows = [], t = null;
 const draw = () => { const r = search(q.value); rows = r.rows;
  list.innerHTML = !String(q.value).trim() ? '' : rows.length ? rows.map(rowHtml).join('') : `<p class="hint">${esc(r.note || 'Nothing with a place on the map matches "' + q.value.trim() + '". Try the reference (WC41), the asset number, "gate 6", "VMS 10" or "stand 5".')}</p>`; };
 q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(draw, 180); });
 sec.querySelector('form').addEventListener('submit', ev => { ev.preventDefault(); clearTimeout(t); draw(); if (rows.length) open(rows[0]); });
 list.addEventListener('click', ev => { const b = ev.target.closest('[data-f1176-hit]'); if (!b) return; const L = rows[Number(b.dataset.f1176Hit)]; if (L) open(L); });
}
function inject(){
 const pane = document.getElementById('pane-map'); if (!pane || !pane.firstElementChild) return false;
 let sec = pane.querySelector('#f1176find');
 if (!sec) { const card = pane.querySelector('#expcard'), head = pane.querySelector('#panehead-map');
  if (card) card.insertAdjacentHTML('beforebegin', boxHtml()); else if (head) head.insertAdjacentHTML('afterend', boxHtml()); else pane.insertAdjacentHTML('afterbegin', boxHtml());
  sec = pane.querySelector('#f1176find'); }
 wireBox(sec); return true;
}

/* ---- the satellite map under the explorer: the grandstands as yellow pins, a filter and a list ---- */
function ensurePins(){
 const SM = W.SatMap1141, M = SM && SM.maps && SM.maps.map; if (!M || !Array.isArray(M.items)) return false;
 const card = document.querySelector('#pane-map .s1141-map[data-s1141="map"]');
 const G = stands(); let added = false;
 if (!M.items.some(i => i.kind === 'stand')) { G.forEach(s => M.items.push({kind: 'stand', id: s.id, num: s.face, label: s.label, name: s.name, units: [], lat: s.lat, lon: s.lon, how: s.how, colour: s.colour})); added = true; }
 if (card) {
  const bar = card.querySelector('.s1141-bar'); if (bar && !bar.querySelector('[data-s1141-filter="stand"]')) bar.insertAdjacentHTML('beforeend', `<button type="button" class="btn sm${M.filter === 'stand' ? ' primary' : ''}" data-s1141-filter="stand" data-ro>Grandstands (${G.length})</button>`);
  const list = card.querySelector('.s1141-list'); if (list && !list.querySelector('li[data-kind="stand"]')) list.insertAdjacentHTML('beforeend', G.map(s => `<li data-kind="stand"${M.filter !== 'all' && M.filter !== 'stand' ? ' hidden' : ''}><i class="s1141-chip stand" style="background:${esc(s.colour)}"></i><div><b>${esc(s.label)}</b> · ${esc(s.name)}<br><span class="s1141-how">${esc(s.how)}</span> <a class="btn sm" href="${esc(navUrl(s.lat, s.lon))}" target="_blank" rel="noopener noreferrer">Navigate ↗</a> <button type="button" class="btn sm ghost" data-stand1176="${esc(s.id)}" data-ro>Pictures · Send</button></div></li>`).join(''));
  if (!card.__s1176click) { card.__s1176click = true; card.addEventListener('click', ev => { const b = ev.target.closest('[data-stand1176]'); if (b) { ev.preventDefault(); const s = stands().find(x => x.id === b.dataset.stand1176); if (s) open(locate(s)); } }); }
  const sub = card.querySelector('p.sub'); if (sub && !/grandstands/i.test(sub.textContent)) sub.insertAdjacentHTML('beforeend', ' The grandstands S01 to S25 are yellow pins where the master plan labels them.');
 }
 if (added) { try { const pct = SM.pct('map'); SM.setZoom('map', pct || 100); } catch (e) {} }
 return added;
}
function settle(){ try { inject(); } catch (e) { W.Find1176.err = String(e && e.message || e); } try { ensurePins(); } catch (e) { W.Find1176.err = String(e && e.message || e); } }
const rm0 = W.renderMap;
if (typeof rm0 === 'function') W.renderMap = function () { const r = rm0.apply(this, arguments); try { settle(); setTimeout(settle, 80); setTimeout(settle, 700); } catch (e) {} return r; };
(function watch(){ const pane = document.getElementById('pane-map'); if (!pane) { setTimeout(watch, 500); return; }
 const obs = new MutationObserver(() => { if (pane.__f1176t) return; pane.__f1176t = setTimeout(() => { pane.__f1176t = null; settle(); }, 200); });
 obs.observe(pane, {childList: true, subtree: true}); settle(); })();

W.Find1176 = {stands, parseStand, search, locate, open, picture, canPicture, inAerial, words, navUrl, inject, ensurePins, VIEWS, SRC};
})(window);
