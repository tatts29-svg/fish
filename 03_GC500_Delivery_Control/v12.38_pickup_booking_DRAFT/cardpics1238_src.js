<style id="cardpics1238-style">
/* v12.38 - three pictures on every Demob card (the master plan beside it, the aerial close up and the wider aerial in a row
   across it) and its directions, ready to send by text or email */
#pane-demob .pz1238{grid-area:pics;display:grid;gap:8px;margin:2px 0 0;min-width:0}
#pane-demob .pz1238 .ph1238{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#pane-demob .pz1238 button.pf1238{all:unset;box-sizing:border-box;position:relative;display:block;width:100%;aspect-ratio:396/276;overflow:hidden;border:1px solid #ffffff1f;border-radius:12px;background:#0c181d;cursor:pointer}
#pane-demob .pz1238 button.pf1238:focus-visible{outline:2px solid #18e8ff;outline-offset:2px}
#pane-demob .pz1238 .pf1238 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .25s}
#pane-demob .pz1238 .pf1238 img.on{opacity:1}
#pane-demob .pz1238 .pf1238 .w1238{position:absolute;inset:0;background:linear-gradient(100deg,#0c181d 30%,#17323c 50%,#0c181d 70%);background-size:200% 100%;animation:sh1238 1.4s linear infinite}
@keyframes sh1238{to{background-position:-200% 0}}
#pane-demob .pz1238 .pf1238 b{position:absolute;left:7px;bottom:7px;padding:4px 8px;border-radius:999px;background:#0f1b21e0;color:#eef6f8;font:800 10.5px/1 Inter,Arial,sans-serif;letter-spacing:.02em;white-space:nowrap}
#pane-demob .pz1238 .pf1238 .nm1238{position:absolute;inset:0;display:grid;place-items:center;padding:8px;color:#a3b7bf;font:700 11.5px/1.3 Inter,Arial,sans-serif;text-align:center}
#pane-demob .pz1238 .ac1238{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#pane-demob .pz1238 .ac1238 button{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:8px 4px;border:1px solid #ffffff22;border-radius:10px;background:#ffffff0d;color:#eef6f8;font:800 12px/1 Inter,Arial,sans-serif;text-align:center;cursor:pointer;white-space:nowrap}
#pane-demob .pz1238 .ac1238 button:hover,#pane-demob .pz1238 .ac1238 button:focus-visible{background:#ffffff1c;outline:none}
#pane-demob .pz1238 .ac1238 button.nv1238{border-color:#ff6a1399;background:#ff6a1326;color:#ffd2b0}
#pane-demob .pz1238 .ac1238 svg{flex:none;width:15px;height:15px}
@media (prefers-reduced-motion:reduce){#pane-demob .pz1238 .pf1238 .w1238{animation:none}#pane-demob .pz1238 .pf1238 img{transition:none}}
@media (max-width:900px){
 #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816]{grid-template-areas:"what what map" "ref br map" "pics pics pics" "st st st" "pk pk act"}
 #pane-demob .pz1238 .ac1238 button{font-size:11.5px;gap:5px}
}
@media (min-width:901px){
 #pane-demob .sec1231 .daywrap table.daytbl tbody tr[data-row816]{grid-template-areas:"what what map" "ref br map" "pics pics pics" "st st st" "pk pk act"}
}
/* every VMS board on site, under the VMS boards group: where it stands, its asset number and its rego (Andrew, 26 Oct 2026) */
#pane-demob tr.vb1238{grid-column:1/-1}
#pane-demob tr.vb1238 > td{display:block;padding:4px 0 12px!important;border:0!important;background:transparent!important}
#pane-demob .vh1238{margin:0 0 8px;color:#a3b7bf;font:700 12.5px/1.35 Inter,Arial,sans-serif}
#pane-demob .vh1238 b{color:#b794ff;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
#pane-demob .vg1238{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
#pane-demob .vc1238{display:grid;gap:7px;padding:12px 13px;border:1px solid #ffffff17;border-left:4px solid #b794ff;border-radius:14px;background:linear-gradient(180deg,#14262d,#0f1d22);color:#eef6f8}
#pane-demob .vc1238.gone{border-left-color:#19c46a;opacity:.82}
#pane-demob .vt1238{display:flex;align-items:center;justify-content:space-between;gap:8px}
#pane-demob .vt1238 b{font:900 15px/1.1 Inter,Arial,sans-serif}
#pane-demob .vt1238 b small{margin-left:6px;color:#a3b7bf;font-weight:700;font-size:12px}
#pane-demob .vs1238{padding:4px 9px;border-radius:999px;background:#5d778233;color:#cfe0e6;font:800 10.5px/1 Inter,Arial,sans-serif;white-space:nowrap}
#pane-demob .vc1238.gone .vs1238{background:#19c46a2e;color:#7fe0a8}
#pane-demob .vw1238{color:#cfe0e6;font:600 12.5px/1.35 Inter,Arial,sans-serif}
#pane-demob .vp1238{display:flex;flex-wrap:wrap;gap:6px}
#pane-demob .vp1238 span{padding:5px 9px;border:1px solid #ffffff1f;border-radius:9px;background:#ffffff0b;color:#eef6f8;font:800 12.5px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
#pane-demob .vp1238 span i{margin-right:6px;color:#8fa8b2;font:800 9.5px/1 Inter,Arial,sans-serif;font-style:normal;letter-spacing:.08em;text-transform:uppercase}
#pane-demob .vp1238 span.no{color:#8fa8b2;font-family:Inter,Arial,sans-serif;font-weight:700}
#pane-demob .va1238{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#pane-demob .va1238 button{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:7px 4px;border:1px solid #ffffff22;border-radius:10px;background:#ffffff0d;color:#eef6f8;font:800 12px/1 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .va1238 button:first-child{border-color:#ff6a1399;background:#ff6a1326;color:#ffd2b0}
#pane-demob .va1238 svg{flex:none;width:15px;height:15px}
@media print{#pane-demob .pz1238,#pane-demob tr.vb1238{display:none!important}}
</style>
<script id="cardpics1238-script">
/* Author: Andrew Fisher. v12.38 - three pictures on every Demob card and its directions to send.
   Andrew, 26 Oct 2026: "i want more pics min 3 for each and navigateion with a tex or email that send the".
   Every card on the Demob tab that has a place on the record shows three pictures: the master plan beside it (v12.36, the
   equipment's icon in a neon ring) and, in a row across the card, the site aerial close up (about 190 m across) and the wider
   aerial (about 840 m across), each with the same icon and ring on the spot, drawn here from the page's own aerial. Tap either
   for the page's own "on the map" card (the full pictures, Navigate, Send). Under them: Navigate (driving directions to the
   spot), Text and Email (what it is, its asset numbers, where it is, its size and weight, how it stands, any booked pick-up
   and the directions link, into a new text or email on this phone; nothing is sent from here) and Send (the three pictures
   and the words to the phone's share menu). Read only: nothing is written to the record. */
(function (W) {
'use strict';
const D = W.document;
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const VIEWS = {close: {halfM: 95, word: 'Close up', across: 190, ring: 0.118}, wide: {halfM: 420, word: 'Wider area', across: 840, ring: 0.082}};
const OUTW = 396, OUTH = 276;
const ICON = {
 nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8z"/></svg>',
 text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
 mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/></svg>',
 send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6h14v-6"/></svg>'
};

/* ---- where a reference is: the same place the page's "on the map" card uses ---- */
const LOC = new Map();
function locOf(key) {
 if (LOC.has(key)) return LOC.get(key);
 let L = null; try { L = W.Find1176 ? Find1176.locate({kind: 'asset', key}) : null; } catch (x) { L = null; }
 if (L && !(Number.isFinite(L.lat) && Number.isFinite(L.lon))) L = null;
 LOC.set(key, L); return L;
}
const navOf = L => 'https://www.google.com/maps/dir/?api=1&destination=' + L.lat.toFixed(6) + ',' + L.lon.toFixed(6) + '&travelmode=driving';
function inAerial(L) { try { const fr = DATA.georef && typeof frameOf === 'function' ? frameOf(L.lat, L.lon) : null; return !!(fr && fr.ax > 0.01 && fr.ax < 0.99 && fr.ay > 0.01 && fr.ay < 0.99); } catch (x) { return false; } }
function goneOf(key) { try { const r = demob816().refs.find(x => x.key === key); const st = r && W.Ready1231 ? Ready1231.state(r) : null; return !!(st && st.s === 'gone'); } catch (x) { return false; } }

/* ---- the row on each card ---- */
function rowHtml(key) {
 const L = locOf(key); if (!L || goneOf(key)) return '';
 const k = e(key), aer = inAerial(L);
 const frame = v => '<button type="button" class="pf1238' + (aer ? '' : ' sat') + '" data-map1236="' + k + '" aria-label="' + k + ': ' + e(VIEWS[v].word.toLowerCase()) + ' on the site aerial - open the full pictures, directions and send">'
  + (aer ? '<span class="w1238"></span><img alt="" decoding="async" draggable="false" data-ai1238="' + k + '|' + v + '"><b>' + e(VIEWS[v].word) + ' · ' + VIEWS[v].across + ' m</b>'
   : '<span class="nm1238">' + (v === 'close' ? 'Off the site aerial · tap for the satellite pictures' : 'Satellite map, directions and send · tap') + '</span>') + '</button>';
 const btn = (cls, data, icon, word) => '<button type="button"' + (cls ? ' class="' + cls + '"' : '') + ' ' + data + '="' + k + '">' + icon + '<span>' + word + '</span></button>';
 return '<div class="pz1238" data-pz1238="' + k + '"><div class="ph1238">' + frame('close') + frame('wide') + '</div><div class="ac1238">'
  + btn('nv1238', 'data-nv1238', ICON.nav, 'Navigate') + btn('', 'data-sm1238', ICON.text, 'Text') + btn('', 'data-em1238', ICON.mail, 'Email') + btn('', 'data-sd1238', ICON.send, 'Send') + '</div></div>';
}
if (typeof rowHtml816 === 'function') {
 const before = rowHtml816;
 rowHtml816 = function (r) {
  const html = before.apply(this, arguments);
  try {
   if (!r || !r.key) return html;
   const add = rowHtml(r.key); if (!add) return html;
   const a = html.indexOf('<td class="refcell"'), b = a < 0 ? -1 : html.indexOf('</td>', a);
   return b < 0 ? html : html.slice(0, b) + add + html.slice(b);
  } catch (x) { return html; }
 };
 Object.assign(rowHtml816, before);
}

/* ---- the aerial pictures, drawn from the page's own site aerial (one image, loaded once) ---- */
let AERP = null;
function aerial() {
 if (AERP) return AERP;
 const s = (typeof DATA !== 'undefined' && DATA.sheets || []).find(x => x.key === 'AERIAL'); let src = s && s.src;
 if (src && typeof src === 'object' && src.media && DATA.media) src = DATA.media[src.media];
 AERP = typeof src !== 'string' ? Promise.resolve(null) : new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
 return AERP;
}
/* the equipment's icon on the spot in a neon ring, as on the master plan */
function mark(c, X, Y, R, key, Wd) {
 const M = W.DemobMap1236 || {}, NEON = M.NEON || '#18e8ff';
 c.save(); c.lineWidth = Wd * 0.027; c.strokeStyle = 'rgba(15,27,33,.6)'; c.beginPath(); c.arc(X, Y, R, 0, Math.PI * 2); c.stroke();
 c.shadowColor = NEON; c.shadowBlur = Wd * 0.06; c.lineWidth = Wd * 0.017; c.strokeStyle = NEON; for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(X, Y, R, 0, Math.PI * 2); c.stroke(); } c.restore();
 const r = Math.max(R * 0.66, Wd * 0.05);
 c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = Wd * 0.02; c.fillStyle = '#0f1b21'; c.beginPath(); c.arc(X, Y, r, 0, Math.PI * 2); c.fill(); c.restore();
 c.save(); c.lineWidth = Wd * 0.006; c.strokeStyle = NEON; c.beginPath(); c.arc(X, Y, r, 0, Math.PI * 2); c.stroke(); c.restore();
 let paths = []; try { paths = typeof M.iconPaths === 'function' ? M.iconPaths(M.catOf(key)) || [] : []; } catch (x) { paths = []; }
 const s = r * 1.36;
 if (paths.length) { c.save(); c.translate(X - s / 2, Y - s / 2); c.scale(s / 24, s / 24); c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#ffffff'; paths.forEach(p => c.stroke(p)); c.restore(); }
}
function north(c, Wd, up) {
 const x = Wd - Wd * 0.07, y = Wd * 0.07, a = -(Number(up) || 0) * Math.PI / 180, L = Wd * 0.032;
 c.save(); c.translate(x, y); c.fillStyle = 'rgba(15,27,33,.72)'; c.beginPath(); c.arc(0, 0, L * 1.55, 0, Math.PI * 2); c.fill(); c.rotate(a);
 c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, -L); c.lineTo(L * 0.55, L * 0.7); c.lineTo(0, L * 0.35); c.lineTo(-L * 0.55, L * 0.7); c.closePath(); c.fill(); c.restore();
}
async function aerialCanvas(key, view, k) {
 const L = locOf(key); if (!L || !inAerial(L)) return null;
 const g = DATA.georef, fr = frameOf(L.lat, L.lon), im = await aerial(); if (!g || !fr || !im) return null;
 const Wd = Math.round(OUTW * k), H = Math.round(OUTH * k), FX = g.frame_px[0], FY = g.frame_px[1], pxPerM = 1 / g.m_per_frame_px_ground, V = VIEWS[view];
 let fw = 2 * V.halfM * pxPerM, fh = fw * H / Wd; if (fw > FX) { fw = FX; fh = fw * H / Wd; } if (fh > FY) { fh = FY; fw = fh * Wd / H; }
 let x0 = fr.ax * FX - fw / 2, y0 = fr.ay * FY - fh / 2; x0 = Math.max(0, Math.min(FX - fw, x0)); y0 = Math.max(0, Math.min(FY - fh, y0));
 const sx = im.naturalWidth / FX, sy = im.naturalHeight / FY;
 const cv = D.createElement('canvas'); cv.width = Wd; cv.height = H; const c = cv.getContext('2d'); if (!c) return null;
 c.fillStyle = '#10161b'; c.fillRect(0, 0, Wd, H); c.imageSmoothingEnabled = true; try { c.imageSmoothingQuality = 'high'; } catch (x) {}
 c.drawImage(im, x0 * sx, y0 * sy, fw * sx, fh * sy, 0, 0, Wd, H);
 mark(c, (fr.ax * FX - x0) / fw * Wd, (fr.ay * FY - y0) / fh * H, Wd * V.ring, key, Wd);
 north(c, Wd, g.up_is_bearing_deg);
 const v = c.createRadialGradient(Wd / 2, H / 2, H * 0.42, Wd / 2, H / 2, Wd * 0.74); v.addColorStop(0, 'rgba(15,27,33,0)'); v.addColorStop(1, 'rgba(15,27,33,.28)'); c.fillStyle = v; c.fillRect(0, 0, Wd, H);
 return cv;
}
const blobOf = (cv, q) => new Promise(res => { try { cv.toBlob(b => res(b || null), 'image/jpeg', q || 0.85); } catch (x) { res(null); } });
const AI = new Map(), AFAIL = new Set(); let aq = [], abusy = 0, aio = null, aioRoot;
function aShow(id) {
 const url = AI.get(id); if (!url) return;
 D.querySelectorAll('#pane-demob img[data-ai1238]:not(.on)').forEach(im => { if (im.getAttribute('data-ai1238') !== id) return;
  im.src = url; im.classList.add('on'); const w = im.parentNode && im.parentNode.querySelector('.w1238'); if (w) w.remove(); });
}
function aFail(id) {
 D.querySelectorAll('#pane-demob img[data-ai1238]').forEach(im => { if (im.getAttribute('data-ai1238') !== id) return;
  const f = im.parentNode; im.remove(); const w = f.querySelector('.w1238'); if (w) w.remove();
  if (!f.querySelector('.nm1238')) f.insertAdjacentHTML('beforeend', '<span class="nm1238">The aerial did not load · tap for the map</span>'); });
}
function aPump() {
 while (abusy < 2 && aq.length) {
  const id = aq.shift(); if (AI.has(id)) { aShow(id); continue; } if (AFAIL.has(id)) { aFail(id); continue; }
  const i = id.lastIndexOf('|'), key = id.slice(0, i), view = id.slice(i + 1); abusy++;
  aerialCanvas(key, view, 1).then(cv => cv ? blobOf(cv, 0.84) : null).then(b => { if (b) { AI.set(id, URL.createObjectURL(b)); aShow(id); } else { AFAIL.add(id); aFail(id); } })
   .catch(() => { AFAIL.add(id); aFail(id); }).finally(() => { abusy--; aPump(); });
 }
}
function aWant(id) { if (AI.has(id)) { aShow(id); return; } if (AFAIL.has(id)) { aFail(id); return; } if (!aq.includes(id)) aq.push(id); aPump(); }
function scroller() {
 const pane = D.getElementById('pane-demob'); let sc = pane && pane.parentElement;
 while (sc && sc !== D.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY)) return sc; sc = sc.parentElement; }
 return null;
}
function arm() {
 const imgs = D.querySelectorAll('#pane-demob img[data-ai1238]:not(.on)'); if (!imgs.length) return;
 if (!('IntersectionObserver' in W)) { imgs.forEach(im => aWant(im.getAttribute('data-ai1238'))); return; }
 const root = scroller();
 if (!aio || aioRoot !== root) {
  if (aio) aio.disconnect(); aioRoot = root;
  aio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { aio.unobserve(en.target); aWant(en.target.getAttribute('data-ai1238')); } }), {root, rootMargin: '600px 0px'});
 }
 imgs.forEach(im => aio.observe(im));
}

/* ---- the words: what it is, where, its size and weight, how it stands, and the directions, read from the card itself ---- */
function cardOf(key) { return D.querySelector('#pane-demob tr[data-row816="' + (W.CSS && CSS.escape ? CSS.escape(key) : key) + '"]'); }
function wordsOf(key) {
 const tr = cardOf(key), L = locOf(key), t = s => String(s || '').replace(/\s+/g, ' ').trim();
 const what = t(tr && (tr.querySelector('td[data-label="What"] > b, td[data-label="What"] strong') || {}).textContent) || t(tr && (tr.querySelector('td[data-label="What"]') || {}).textContent).split(' Asset no.')[0];
 const nos = t(tr && (tr.querySelector('.an1231 b') || {}).textContent);
 const where = t(tr && (tr.querySelector('.mpc1236') || {}).textContent);
 const pill = k => { const el = tr && tr.querySelector('.pp1236.' + k); if (!el) return ''; const i = el.querySelector('i'), em = el.querySelector('em'); let v = el.textContent; if (i) v = v.replace(i.textContent, ''); if (em) v = v.replace(em.textContent, ''); v = t(v); return v && !/^to confirm$/i.test(v) ? v + (em ? ' (' + t(em.textContent) + ')' : '') : 'to confirm'; };
 const status = t(tr && (tr.querySelector('.sw1231') || {}).textContent);
 const booked = t(tr && (tr.querySelector('.bk1238.on .bw1238') || {}).textContent);
 const lines = ['Coates GC500 demob · ' + key + (what ? ' · ' + what : ''), nos ? 'Asset no. ' + nos : '', where ? 'Where: ' + where : '',
  'Size ' + pill('size') + ' · Weight ' + pill('weight'), status ? 'Now: ' + status : '', booked || '', L ? 'Navigate: ' + navOf(L) : ''].filter(Boolean);
 return {subject: 'GC500 demob · ' + key + (what ? ' · ' + what : ''), lines};
}
function openUrl(u) { try { const a = D.createElement('a'); a.href = u; a.rel = 'noopener'; if (/^https?:/.test(u)) a.target = '_blank'; D.body.appendChild(a); a.click(); a.remove(); } catch (x) { W.location.href = u; } }
function navigate(key) { const L = locOf(key); if (!L) return false; openUrl(navOf(L)); return true; }
function text(key) { const w = wordsOf(key); openUrl('sms:?&body=' + encodeURIComponent(w.lines.join('\n'))); return w; }
function email(key) { const w = wordsOf(key); openUrl('mailto:?subject=' + encodeURIComponent(w.subject) + '&body=' + encodeURIComponent(w.lines.join('\n'))); return w; }
async function pictures(key) {
 const files = [], name = v => 'GC500-' + String(key).replace(/[^a-z0-9]+/gi, '-') + '-' + v + '.jpg';
 try { const im = cardOf(key) && cardOf(key).querySelector('img[data-id1236].on'); if (im && im.src) { const b = await (await fetch(im.src)).blob(); files.push(new File([b], name('master-plan'), {type: 'image/jpeg'})); } } catch (x) {}
 for (const v of ['close', 'wide']) { try { const cv = await aerialCanvas(key, v, 2); const b = cv && await blobOf(cv, 0.86); if (b) files.push(new File([b], name(v === 'close' ? 'close-up' : 'wider-area'), {type: 'image/jpeg'})); } catch (x) {} }
 return files;
}
async function send(key) {
 const w = wordsOf(key), files = await pictures(key), txt = w.lines.join('\n');
 try { if (navigator.share && files.length && (!navigator.canShare || navigator.canShare({files}))) { await navigator.share({title: w.subject, text: txt, files}); return 'shared'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 try { if (navigator.share) { await navigator.share({title: w.subject, text: txt}); return 'shared words'; } } catch (x) { if (x && x.name === 'AbortError') return 'cancelled'; }
 files.forEach(f => { const u = URL.createObjectURL(f), a = D.createElement('a'); a.href = u; a.download = f.name; D.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); });
 try { await navigator.clipboard.writeText(txt); } catch (x) {}
 try { flash(files.length + ' picture' + (files.length === 1 ? '' : 's') + ' saved and the words copied: attach them to a text or email.'); } catch (x) {}
 return 'saved';
}

/* ---- every VMS board on site (Andrew, 26 Oct 2026: "dont forget to add VMS Boards here too please. mention their asset no and
   Location and rego no"): the VMS plan's positions (VMS1024), each with the board standing there - its asset number and number
   plate as the VMS tab holds them - and where it stands; a board whose asset number has left on the departure record says so.
   A position whose board moved on (moves_to) is shown at its new place. ---- */
function vmsBoards() {
 const V = W.VMS1024; if (!V || typeof V.boards !== 'function') return [];
 let list = []; try { list = V.boards() || []; } catch (x) { return []; }
 const seen = new Set(), out = [];
 list.forEach(b => {
  if (!b || !b.pos || b.moves_to) return;
  let id = {}, p = {}; try { id = V.identity(b) || {}; } catch (x) { id = {}; } try { p = V.position(b) || {}; } catch (x) { p = {lat: b.lat, lon: b.lon}; }
  const asset = String(id.asset || '').trim(), rego = String(id.rego || '').trim(), k = asset ? 'a:' + asset : 'p:' + b.pos; if (seen.has(k)) return; seen.add(k);
  out.push({pos: String(b.pos), label: typeof V.label === 'function' ? V.label(b) : 'VMS ' + b.pos, where: String(b.title || '').split(/\s[—-]\sinstalled/i)[0].trim(), asset, rego, lat: +p.lat, lon: +p.lon, session: !!b.session});
 });
 return out.sort((a, b) => a.pos.localeCompare(b.pos, undefined, {numeric: true}));
}
function departedNos() {
 const out = new Map();
 try { DemobProgress996.whole(demob816(), todayIso()).readings.forEach(x => (x.events || []).forEach(ev => (ev.items || []).forEach(i => (i.numbers || []).forEach(n => { if (!out.has(String(n))) out.set(String(n), {at: ev.at || ev.date || '', key: x.key}); })))); } catch (x) {}
 return out;
}
const hm = v => { const t = Date.parse(v); if (!Number.isFinite(t)) return ''; const d = new Date(t + 10 * 3600e3); return d.getUTCDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()] + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
let VMSNOW = [];
function vmsRows() {
 const pane = D.getElementById('pane-demob'); if (!pane || typeof DM816 === 'undefined' || DM816.view !== 'everything') return;
 const head = pane.querySelector('.sec1231 tr.zr1231[data-cat1236="vms"]'); if (!head) return;
 const gone = departedNos(); VMSNOW = vmsBoards().map(b => Object.assign(b, {left: b.asset && gone.get(b.asset) || null}));
 if (!VMSNOW.length) return;
 const sig = JSON.stringify(VMSNOW.map(b => [b.pos, b.asset, b.rego, b.left && b.left.at]));
 const old = pane.querySelector('tr.vb1238'); if (old && old.dataset.sig1238 === sig) return; if (old) old.remove();
 let last = head; for (let x = head.nextElementSibling; x && !x.classList.contains('zr1231'); x = x.nextElementSibling) last = x;
 const n = VMSNOW.length, off = VMSNOW.filter(b => b.left).length, cols = (head.closest('table').querySelector('thead tr') || {}).children;
 const card = b => '<div class="vc1238' + (b.left ? ' gone' : '') + '" data-vms1238="' + e(b.pos) + '"><div class="vt1238"><b>' + e(b.label) + '<small>message board</small></b><span class="vs1238">' + (b.left ? 'Picked up ' + e(hm(b.left.at)) : 'On site') + '</span></div>'
  + '<div class="vw1238">' + e(b.where || 'Place on the VMS plan') + '</div>'
  + '<div class="vp1238">' + (b.asset ? '<span><i>Asset no.</i>' + e(b.asset) + '</span>' : '<span class="no">Asset no. to confirm</span>') + (b.rego ? '<span><i>Rego</i>' + e(b.rego) + '</span>' : '<span class="no">Rego to confirm</span>') + '</div>'
  + (Number.isFinite(b.lat) && Number.isFinite(b.lon) && !b.left ? '<div class="va1238"><button type="button" data-vnv1238="' + e(b.pos) + '">' + ICON.nav + '<span>Navigate</span></button><button type="button" data-vsm1238="' + e(b.pos) + '">' + ICON.text + '<span>Text</span></button><button type="button" data-vem1238="' + e(b.pos) + '">' + ICON.mail + '<span>Email</span></button></div>' : '') + '</div>';
 const tr = D.createElement('tr'); tr.className = 'vb1238'; tr.dataset.sig1238 = sig;
 tr.innerHTML = '<td colspan="' + ((cols && cols.length) || 6) + '"><p class="vh1238"><b>Every VMS board</b> · ' + n + ' board' + (n === 1 ? '' : 's') + (off ? ' · ' + off + ' picked up' : '') + ' · where it stands, its asset number and rego</p><div class="vg1238">' + VMSNOW.map(card).join('') + '</div></td>';
 last.after(tr);
}
function vmsWords(pos) {
 const b = VMSNOW.find(x => x.pos === pos); if (!b) return null;
 const L = {lat: b.lat, lon: b.lon};
 const lines = ['Coates GC500 demob · ' + b.label + ' · message board', 'Asset no. ' + (b.asset || 'to confirm') + ' · Rego ' + (b.rego || 'to confirm'), b.where ? 'Where: ' + b.where : '', 'Now: ' + (b.left ? 'Picked up ' + hm(b.left.at) : 'On site'), Number.isFinite(b.lat) ? 'Navigate: ' + navOf(L) : ''].filter(Boolean);
 return {subject: 'GC500 demob · ' + b.label + (b.asset ? ' · ' + b.asset : ''), lines, L};
}

/* ---- taps ---- */
D.addEventListener('click', ev => {
 const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
 const v = t.closest('#pane-demob [data-vnv1238],#pane-demob [data-vsm1238],#pane-demob [data-vem1238]');
 if (v) { ev.preventDefault(); ev.stopPropagation(); const pos = v.getAttribute('data-vnv1238') || v.getAttribute('data-vsm1238') || v.getAttribute('data-vem1238'), w = vmsWords(pos); if (!w) return;
  if (v.hasAttribute('data-vnv1238')) openUrl(navOf(w.L)); else if (v.hasAttribute('data-vsm1238')) openUrl('sms:?&body=' + encodeURIComponent(w.lines.join('\n'))); else openUrl('mailto:?subject=' + encodeURIComponent(w.subject) + '&body=' + encodeURIComponent(w.lines.join('\n'))); return; }
 const b = t.closest('#pane-demob [data-nv1238],#pane-demob [data-sm1238],#pane-demob [data-em1238],#pane-demob [data-sd1238]'); if (!b) return;
 ev.preventDefault(); ev.stopPropagation();
 if (b.hasAttribute('data-nv1238')) navigate(b.getAttribute('data-nv1238'));
 else if (b.hasAttribute('data-sm1238')) text(b.getAttribute('data-sm1238'));
 else if (b.hasAttribute('data-em1238')) email(b.getAttribute('data-em1238'));
 else send(b.getAttribute('data-sd1238'));
}, true);

/* ---- after each drawing of the Demob tab ---- */
if (typeof renderDemob816 === 'function') { const before = renderDemob816; renderDemob816 = function () { const v = before.apply(this, arguments); try { vmsRows(); } catch (x) {} try { arm(); } catch (x) {} return v; }; Object.assign(renderDemob816, before); }
let raf = 0;
function watch() {
 const pane = D.getElementById('pane-demob'); if (!pane || pane.__pics1238) return; pane.__pics1238 = true;
 new MutationObserver(ms => { if (raf || ms.every(m => m.target && m.target.closest && m.target.closest('.pz1238,.mpf1236'))) return; raf = (W.requestAnimationFrame || setTimeout)(() => { raf = 0; try { arm(); } catch (x) {} }); }).observe(pane, {childList: true, subtree: true});
}
W.CardPics1238 = Object.freeze({locOf, navOf, wordsOf, aerialCanvas, navigate, text, email, send, pictures, vmsBoards, vmsWords, VIEWS, release: 'v12.38'});
try { if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map) RENDER_MEMO.delete('demob816'); } catch (x) {}
watch();
try { const p = D.getElementById('pane-demob'); if (p && !p.hidden && p.querySelector('.sec1231')) renderDemob816(); } catch (x) {}
})(window);
</script>
