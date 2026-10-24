#!/usr/bin/env python3
r"""v7.87 - Inventory: ONE LINE PER LOCATION, on the screen and in the Share PDF. Author: Andrew Fisher.
Applied after v7.86: bash toolchain/build.sh v7.87 v7.86_fence_blocks_line_DRAFT/patch_v786.py v7.87_inventory_one_line_DRAFT/patch_v787.py

The project manager, 2 Oct 2026, on the Inventory: "i want to see on the same line each location reference, what still
needs to be done, and on the same line the Map location and QR code - it might make some of these lines larger, show me
some examples". Shown the examples (desktop, phone, A4) and asked locator or satellite, screen or PDF, QR size: "i want
it all".

Every location still to come is now one line, the same on the Inventory card's "Still to come - every location" list and
on the Share PDF's location pages:

  reference (and on paper its due day) | STILL TO DO: each item and how many, "Not on site yet" or "Short - the rest
  still to come", and the directions state | MAP LOCATION: a locator (the whole site as dots, this spot in orange,
  north up), a satellite close-up of the spot, and the words (Section, near, beside) | a full-size QR that opens
  navigation to the drop-off (or the pit lane while there is no drop-off).

  - The satellite close-up is the Mapbox satellite picture the live map already uses, fetched with the same public key
    the service hands the page. On screen a picture is only fetched as its line scrolls into view. With no key, no
    signal or no WebGL the line keeps its locator and says "no satellite picture". On paper the pictures carry their
    credit (Mapbox, OpenStreetMap, Maxar) in the footer.
  - The screen QR codes are drawn as their lines come into view, once each, so a long list does not stall the page.
  - The PDF keeps ten locations to an A4 page, the summary page is unchanged, and the costing is unchanged.
  - The classes the v7.82/v7.83 checks read are kept (tg782, tg-ref, tg-loc, tg-t, tg-dh, data-map; .card, .ref, .qr).

    python3 patch_v787.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function inv87Line(' in t: sys.exit('v7.87 already applied')
for need in ('function togo782Html(I){', 'function inv83Pages(){', 'const INV83_CSS = ', 'function liveMapKeyFromService(', "key: 'fence_blocks'"):
    if need not in t: sys.exit('v7.87 needs v7.86 (missing ' + need + ')')

# 1. the shared line: what is still to do, where it is (locator + satellite + words), and the QR
t = rep(t, "/* v7.82 - every location still to come, grouped by due day; the reference opens the item, Map shows where it goes */\nfunction togo782Html(I){",
        r"""/* v7.87 - ONE LINE PER LOCATION (the project manager, 2 Oct 2026: "on the same line each location reference, what still
   needs to be done, and on the same line the Map location and QR code" ... "i want it all"). The Inventory card's list
   and the Share PDF both draw their lines here, so the screen and the paper read the same. */
const INV87 = {qr: new Map(), box: null, boxAt: 0, bg: '', timer: 0};
/* the site's extent and a picture of it (every location with a spot, as a dot), worked out once a minute at most */
function inv87Site(){
 const now = Date.now(); if (INV87.box && now - INV87.boxAt < 60000) return INV87.box;
 const pts = []; allAssets().forEach(a => { if (a._cancelled) return; try { const P = dpPos(a); if (P && P.lat != null && P.kind !== 'report') pts.push([P.lat, P.lon]); } catch (e) {} });
 if (!pts.length) { INV87.box = null; return null; }
 let la0 = Infinity, la1 = -Infinity, lo0 = Infinity, lo1 = -Infinity; pts.forEach(([a, o]) => { la0 = Math.min(la0, a); la1 = Math.max(la1, a); lo0 = Math.min(lo0, o); lo1 = Math.max(lo1, o); });
 const pad = 0.06, dla = (la1 - la0) || 0.001, dlo = (lo1 - lo0) || 0.001; la0 -= dla * pad; la1 += dla * pad; lo0 -= dlo * pad; lo1 += dlo * pad;
 const W = 40, H = 100, xy = (a, o) => [((o - lo0) / (lo1 - lo0) * W).toFixed(1), ((la1 - a) / (la1 - la0) * H).toFixed(1)];
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g fill="#8794a3">${pts.map(p => { const [x, y] = xy(p[0], p[1]); return `<circle cx="${x}" cy="${y}" r="1.15"/>`; }).join('')}</g></svg>`;
 INV87.box = {la0, la1, lo0, lo1, bg: 'url("data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27') + '")'}; INV87.boxAt = now; return INV87.box;
}
function inv87Pin(lat, lon){ const B = inv87Site(); if (!B || lat == null) return null; return {x: Math.max(0, Math.min(100, (lon - B.lo0) / (B.lo1 - B.lo0) * 100)), y: Math.max(0, Math.min(100, (B.la1 - lat) / (B.la1 - B.la0) * 100))}; }
/* the satellite close-up: the same Mapbox satellite the live map shows, north up, the spot pinned in Coates orange */
function inv87SatUrl(lat, lon, w, h){
 const k = liveMapKey(); if (!k || lat == null) return '';
 const ll = (+lon).toFixed(6) + ',' + (+lat).toFixed(6);
 return 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+ff6a13(' + ll + ')/' + ll + ',17.4,0/' + (w || 150) + 'x' + (h || 100) + '@2x?attribution=false&logo=false&access_token=' + encodeURIComponent(k.token);
}
function inv87Qr(url, cell){ const k = url + '|' + (cell || 3); if (!INV87.qr.has(k)) INV87.qr.set(k, qrSvg(url, cell || 3)); return INV87.qr.get(k); }
/* everything a line says, worked out once: the same facts for the screen and the paper */
function inv87Facts(e){
 const a = e.a, w = whereText(a), m = masterLoc(a.key) || {}, inP = typeof inPlace782 === 'function' && inPlace782(a.key), dr = typeof dirs782 === 'function' && !inP ? dirs782(a) : null;
 let P = {}; try { P = dpPos(a) || {}; } catch (x) {}
 const clean = xs => (xs || []).map(v => String(v).replace(/\s*\(~[^)]*\)\s*$/, '')).filter(Boolean), nb = clean(m.near).slice(0, 2), bs = clean([].concat(m.beside || [], m.next || [])).slice(0, 3);
 const D = typeof descLoc782 === 'function' ? descLoc782(a) : null;
 const main = [m.sec ? 'Section ' + m.sec : '', nb.length ? 'near ' + nb.join(', ') : ''].filter(Boolean).join(' · ');
 const report = !!(dr && dr.ok && dr.report) || P.kind === 'report';
 const loc = report && !main ? 'No drop-off yet - report to the pit lane' : main || (bs.length ? 'beside ' + bs.join(', ') : '') || (D ? 'the spot the description names' : 'no location on the map yet');
 const sub = main && bs.length ? 'beside ' + bs.join(', ') : '';
 const tags = [e.short ? ['am', 'Short - the rest still to come'] : ['gy', 'Not on site yet']]
  .concat(!dr ? [] : dr.ok && dr.report ? [['tg-r', 'Drop-off to be set in Edit']] : dr.ok ? [['tg-ok', 'Directions set']] : [['tg-no', dr.missing.join('; ')]]);
 const nav = P.lat != null ? navUrl({lat: P.lat, lon: P.lon}) : '';
 return {a, name: a.name || w.main || a.key, items: e.items, loc, sub, report, tags, lat: P.lat, lon: P.lon, nav, pin: inv87Pin(P.lat, P.lon),
  map: !!(mapPlaceFor(a) || mapSheetFor(a))};
}
const inv87Items = F => F.items.map(s => { const m = /^(\d+) × (.*)$/.exec(String(s)); return `<span class="ln87-it">${m ? '<b>' + esc(m[1]) + ' ×</b> ' + esc(m[2]) : esc(s)}</span>`; }).join('');
const inv87Loc = F => `<span class="ln87-loc" style="background-image:${INV87.box ? INV87.box.bg.replace(/"/g, '&quot;') : 'none'}" aria-hidden="true">${F.pin ? `<i style="left:${F.pin.x.toFixed(1)}%;top:${F.pin.y.toFixed(1)}%"></i>` : ''}<em>N</em></span>`;
/* the screen line */
function inv87Line(e, due){
 const F = inv87Facts(e), k = esc(F.a.key);
 const tags = F.tags.map(([c, w]) => `<span class="tg-t ln87-tag ${c}">${esc(w)}</span>`).join('');
 const sat = F.lat != null ? `<img alt="" loading="lazy" decoding="async" data-sat87="${F.lat},${F.lon}" width="150" height="100">` : '';
 return `<li class="ln87" data-k87="${k}"><div class="ln87-ref"><button type="button" class="tg-ref" data-open="${k}" title="Open ${k}">${refPlate(F.a.key, 18)}</button>${due ? `<span class="ln87-due">${e.due ? 'Due ' + esc(fmtDate(e.due)) : 'No date yet'}</span>` : ''}<span class="ln87-nm">${esc(F.name)}</span></div>
  <div class="ln87-do tg-w"><span class="ln87-lab">Still to do</span><span class="ln87-its">${inv87Items(F)}</span><span class="ln87-tags">${tags}</span></div>
  <div class="ln87-map">${F.map ? `<button type="button" class="ln87-pics" data-map="${k}" title="Show ${k} on the map">` : '<span class="ln87-pics">'}${inv87Loc(F)}<span class="ln87-sat${sat ? '' : ' none'}">${sat}<span class="ln87-ns">no satellite picture</span></span>${F.map ? '</button>' : '</span>'}
   <div class="ln87-w"><span class="ln87-lab">Map location</span><b class="tg-loc${F.report ? ' ln87-rp' : ''}">${esc(F.loc)}</b>${F.sub ? `<span class="ln87-sub">${esc(F.sub)}</span>` : ''}<span class="ln87-acts">${F.map ? `<button type="button" class="btn sm tg-map" data-map="${k}" title="Show ${k} on the map">Map ›</button>` : `<button type="button" class="btn sm ghost tg-map" data-open="${k}" title="No spot on the map yet - open ${k} to place it">Set in Edit ›</button>`}${F.nav ? `<a class="btn sm ln87-go" href="${esc(F.nav)}" target="_blank" rel="noopener" title="Open navigation to ${k} on this device">Directions ›</a>` : ''}</span></div></div>
  <div class="ln87-qr">${F.nav ? `<span class="ln87-code" data-qr87="${esc(F.nav)}" role="img" aria-label="QR code: navigate to ${k}"></span><span class="ln87-cap">${F.report ? 'Scan: the pit lane' : 'Scan to navigate'}</span>` : '<span class="ln87-nq">No map spot yet - set it in Edit</span>'}</div></li>`;
}
/* after the card is drawn: QR codes as their lines come into view, satellite pictures once the key is known */
function inv87Hydrate(){
 INV87.timer = 0; document.querySelectorAll('.ln87host').forEach(inv87HydrateBox);
}
function inv87HydrateBox(box){
 const fill = el => { if (el.dataset.done) return; el.dataset.done = '1'; el.innerHTML = inv87Qr(el.dataset.qr87, 3); };
 const codes = [...box.querySelectorAll('[data-qr87]')], scroller = box.querySelector('.tg-box');
 if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { io.unobserve(x.target); fill(x.target); } }), {root: scroller || null, rootMargin: '300px 0px'}); codes.forEach(c => io.observe(c)); }
 else codes.forEach(fill);
 const pics = () => { const b = box; if (!document.body.contains(b)) return; b.querySelectorAll('img[data-sat87]').forEach(im => { if (im.getAttribute('src')) return; const [la, lo] = im.dataset.sat87.split(',').map(Number), u = inv87SatUrl(la, lo);
  if (!u) { im.parentNode.classList.add('none'); return; } im.onerror = () => im.parentNode.classList.add('none'); im.src = u; }); };
 if (LIVEMAP.env === undefined) liveMapKeyFromService().then(pics, pics); else pics();
}
/* v7.82 - every location still to come, grouped by due day; the reference opens the item, Map shows where it goes */
function togo782Html(I){""", 'one-line helpers', p, True)

# 2. the card's list draws the new line
t = rep(t, " const days = new Map(); list.forEach(e => { const k = e.due || ''; if (!days.has(k)) days.set(k, []); days.get(k).push(e); });\n const line = e => {",
        " const days = new Map(); list.forEach(e => { const k = e.due || ''; if (!days.has(k)) days.set(k, []); days.get(k).push(e); });\n inv87Site(); if (!INV87.timer) INV87.timer = setTimeout(inv87Hydrate, 0); /* v7.87 */\n const line782 = e => {",
        'card list uses the line', p, True)
t = rep(t, "<ul>${es.map(line).join('')}</ul></div>`).join('')}</div></div>`;\n}",
        "<ul>${es.map(inv87Line).join('')}</ul></div>`).join('')}</div><div class=\"ln87-cr\">Satellite pictures © Mapbox © OpenStreetMap © Maxar. Each code opens navigation to the drop-off.</div></div>`;\n}",
        'card list lines', p, True)
t = rep(t, "return `<div class=\"tg782\" id=\"tg782\"><h3 class=\"invh\">Still to come - every location (${list.length})</h3>",
        "return `<div class=\"tg782 ln87host\" id=\"tg782\"><h3 class=\"invh\">Still to come - every location (${list.length})</h3>", 'card list host', p, True)
# 2b. the Still-to-come number in the table: the same lines, for that type (the project manager, 2 Oct 2026: "the reference
#     on this line, where each one that has not turned up goes, then a direct link to the location - this works out good for
#     toilets so we know where to place")
t = rep(t, " }[D.col] || [];\n const spares = (D.col === 'spare' || D.col === 'total')",
        r""" }[D.col] || [];
 if (D.col === 'togo' && pick.length) { /* v7.87 - one line per location, with where it goes and directions */
  inv87Site(); if (!INV87.timer) INV87.timer = setTimeout(inv87Hydrate, 0);
  const es = pick.map(([x]) => ({key: x.key, a: assetOf(x.key), items: [(x.asked - x.on) + ' × ' + r.item], short: !!x.onsite, due: due(x.key)})).filter(e => e.a), n7 = pick.reduce((s, [x]) => s + x.asked - x.on, 0);
  return `<div class="notice info invdrill tg782 ln87host" id="invDrill"><div class="invdrillh"><b>${esc(r.item)} - still to come: ${n7} at ${es.length} location${es.length === 1 ? '' : 's'}</b><button type="button" class="chnumx" data-invdrill-x aria-label="Close the list">×</button></div>
  <div class="tg-box"><ul>${es.map(e => inv87Line(e, true)).join('')}</ul></div>
  <div class="hint">Where each one still to come goes: Directions opens navigation on this phone, Map shows it on the site map, or scan the code. Press a reference to open it on the form.</div></div>`; }
 const spares = (D.col === 'spare' || D.col === 'total')""", 'still-to-come drill as lines', p, True)
t = rep(t, "<p class=\"hint\">Everything ordered that is not on site yet${INV.disc !== '*' ? ' in ' + esc(INV.disc) : ''}, by the day it is due. Press a reference to open it, or Map to see where it goes.</p>",
        "<p class=\"hint\">Everything ordered that is not on site yet${INV.disc !== '*' ? ' in ' + esc(INV.disc) : ''}, by the day it is due - one line each: what is still to do, where it goes, and a code to scan for directions. Press a reference to open it, or the map to see where it goes.</p>",
        'card list hint', p, True)

# Bind the controls in both the every-location list and the per-type drill.
t = rep(t, "pane.querySelectorAll('#tg782 [data-open]')",
        "pane.querySelectorAll('#tg782 [data-open], #invDrill [data-open]')",
        'bind references in both inventory lists', p, True)
t = rep(t, "pane.querySelectorAll('#tg782 [data-map]')",
        "pane.querySelectorAll('#tg782 [data-map], #invDrill [data-map]')",
        'bind map controls in both inventory lists', p, True)

# 3. the screen styles
t = rep(t, ".tg782 .tg-w .tg-r{color:#d97706}\n",
        r""".tg782 .tg-w .tg-r{color:#d97706}
.tg782 .tg-box{max-height:min(80vh,920px)}
.tg782 li.ln87{grid-template-columns:150px minmax(0,1.05fr) minmax(0,1.6fr) 104px;gap:14px;align-items:center;padding:10px 2px}
.ln87-ref{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:0}.ln87-nm{font-size:12.5px;color:var(--mute,#5d6468);overflow-wrap:anywhere}
.tg782 .ln87-lab,.tg782 .tg-w .ln87-lab{display:block;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--mute,#5d6468);margin-bottom:2px}
.tg782 .ln87-do{gap:4px}.ln87-its{display:flex;flex-wrap:wrap;gap:3px 12px;color:var(--ink,#15181a)!important;font-size:13.5px!important}.ln87-it{white-space:nowrap}.tg782 .ln87-it b{display:inline;margin:0}.tg782 .tg-w .ln87-it{color:var(--ink,#15181a);font-size:13.5px}
.ln87-tags{display:flex;flex-wrap:wrap;gap:4px}.tg782 .tg-w .ln87-tag{font-size:11.5px;font-weight:700;padding:1px 8px;border-radius:10px;background:rgba(93,100,104,.12);color:var(--ink,#15181a)}
.tg782 .tg-w .ln87-tag.am{background:rgba(217,119,6,.15);color:#a15c00}.tg782 .tg-w .ln87-tag.tg-ok{background:rgba(31,157,85,.13);color:#1a7f45}
.tg782 .tg-w .ln87-tag.tg-no,.tg782 .tg-w .ln87-tag.tg-r{background:rgba(217,61,47,.13);color:#b42318}
.ln87-map{display:flex;gap:10px;align-items:center;min-width:0}.ln87-pics{all:unset;display:flex;gap:6px;flex:none;cursor:pointer;border-radius:8px}.ln87-pics:focus-visible{outline:2px solid var(--orange,#ff6a13)}
.ln87-loc{position:relative;display:block;width:40px;height:100px;border:1px solid var(--line,rgba(0,0,0,.14));border-radius:6px;background-color:rgba(127,140,155,.08);background-size:100% 100%;background-repeat:no-repeat;box-sizing:border-box;flex:none}
.ln87-loc i{position:absolute;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#ff6a13;border:1.5px solid #fff;box-shadow:0 0 0 3px rgba(255,106,19,.3)}
.ln87-loc em{position:absolute;top:2px;right:3px;font:800 8px/1 Inter,sans-serif;color:var(--mute,#5d6468);font-style:normal}
.ln87-sat{position:relative;display:block;width:150px;height:100px;border-radius:6px;overflow:hidden;background:rgba(127,140,155,.12);flex:none}.ln87-sat img{display:block;width:150px;height:100px;object-fit:cover}
.ln87-ns{display:none}.ln87-sat.none img{display:none}.ln87-sat.none .ln87-ns{display:grid;place-items:center;height:100%;padding:6px;text-align:center;font-size:11px;color:var(--mute,#5d6468);box-sizing:border-box}
.ln87-w{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}.ln87-w .tg-loc{font-weight:700;font-size:13.5px;overflow-wrap:anywhere}.ln87-w .ln87-rp{color:#b42318}.ln87-sub{font-size:12.5px;color:var(--mute,#5d6468);overflow-wrap:anywhere}.ln87-w .tg-map{margin-top:3px}
.ln87-qr{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center}.ln87-code{display:block;width:96px;height:96px;background:#fff;border-radius:4px}.ln87-code svg{display:block;width:96px;height:96px}
.ln87-cap{font-size:10.5px;font-weight:700;color:var(--mute,#5d6468)}.ln87-nq{display:grid;place-items:center;width:96px;height:96px;border:1px dashed var(--line,rgba(0,0,0,.2));border-radius:6px;font-size:11px;color:var(--mute,#5d6468);padding:6px;box-sizing:border-box}
.ln87-due{font-size:12px;font-weight:700}.ln87-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}.ln87-acts .tg-map{margin:0}a.ln87-go{text-decoration:none}
.invdrill.tg782{margin:10px 0}.invdrill.tg782 .tg-box{background:var(--card,#fff)}
.inv87refs{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:3px;margin:5px 0 0 auto;min-width:150px;max-width:230px;white-space:normal}
.inv87ref{all:unset;cursor:pointer;font:800 italic 12px/1 'Barlow Condensed',Inter,sans-serif;letter-spacing:.02em;padding:2px 5px 2px;border-radius:3px;background:rgba(255,106,19,.14);border:1px solid rgba(255,106,19,.55);color:var(--ink,#15181a);white-space:nowrap}
.inv87ref i{font-style:normal;font-weight:700;margin-left:2px;color:var(--mute,#5d6468)}.inv87ref:hover{background:rgba(255,106,19,.28)}.inv87ref:focus-visible{outline:2px solid var(--orange,#ff6a13)}
.tg782 li.ln87-hit{background:rgba(255,106,19,.12);border-radius:8px}
.ln87-cr{font-size:11px;color:var(--mute,#5d6468);padding:6px 2px 0}
@media (max-width:900px){.tg782 li.ln87{grid-template-columns:minmax(0,1fr) 100px;grid-template-areas:"ref qr" "do qr" "map map";gap:8px 10px;align-items:start}
 .ln87-ref{grid-area:ref;flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px 8px}.ln87-do{grid-area:do}.ln87-map{grid-area:map}.ln87-qr{grid-area:qr}
 .ln87-code,.ln87-code svg{width:92px;height:92px}.ln87-nq{width:92px;height:92px}.ln87-loc{width:34px;height:84px}.ln87-sat,.ln87-sat img{width:118px;height:84px}}
@media (max-width:420px){.ln87-map{flex-wrap:wrap}.ln87-sat,.ln87-sat img{width:104px;height:76px}.ln87-loc{width:30px;height:76px}}
""", 'screen styles', p, True)

# 4. the Share PDF: the same line, ten to an A4 page (the classes the v7.83 checks read are kept)
t = rep(t, " const card = e => { const a = e.a, m = masterLoc(a.key) || {}, w = whereText(a), dr = dirs782(a), P = dpPos(a);",
        r""" inv87Site();
 const card = e => { const F = inv87Facts(e), a = F.a, q = F.nav ? inv87Qr(F.nav, 3) : '', sat = F.lat != null ? inv87SatUrl(F.lat, F.lon, 140, 96) : '';
  return `<div class="card ln87p"><div class="c1"><span class="ref">${esc(a.key)}</span><span class="due">${e.due ? esc(fmtDate(e.due)) : 'No date yet'}</span><div class="nm">${esc(F.name)}</div></div>
   <div class="c2"><span class="lb">Still to do</span><div class="it">${inv87Items(F)}</div><div class="tgs">${F.tags.map(([c, w]) => `<span class="st ${c === 'tg-ok' ? 'ok' : c === 'gy' ? 'gy' : c === 'am' ? 'am' : c === 'tg-r' ? 'rp' : 'no'}">${esc(w)}</span>`).join('')}</div></div>
   <div class="c3">${inv87Loc(F)}${sat ? `<img class="sat" alt="" src="${esc(sat)}" crossorigin="anonymous">` : '<span class="sat ns">no satellite picture</span>'}<div class="lw"><span class="lb">Map location</span><div class="lo${F.report ? ' rp' : ''}">${esc(F.loc)}</div>${F.sub ? `<div class="sb">${esc(F.sub)}</div>` : ''}</div></div>
   <div class="qr">${q ? q + '<span>' + (F.report ? 'Scan: the pit lane' : 'Scan to navigate') + '</span>' : '<div class="nq">No map spot yet - set it in Edit</div>'}</div></div>`; };
 const card783 = e => { const a = e.a, m = masterLoc(a.key) || {}, w = whereText(a), dr = dirs782(a), P = dpPos(a);""", 'pdf line', p, True)
t = rep(t, "<span>${i + 1}-${i + part.length} of ${togo.length} · scan a code to navigate</span></div><div class=\"cards\">${part.map(card).join('')}</div>${foot()}</section>`});",
        "<span>${i + 1}-${i + part.length} of ${togo.length} · scan a code to navigate</span></div><div class=\"cards ln87s\">${part.map(card).join('')}</div>${foot(true)}</section>`});",
        'pdf pages use the line', p, True)
t = rep(t, " const foot = () => `<div class=\"ft\"><span>From the delivery record - it moves as things are ticked on site. Hire value: the 2026 card at the charged days and minimum hire, ex GST; a line with no rate is counted, never estimated.</span><span>GC500 Delivery Control</span></div>`;",
        " const foot = sat => `<div class=\"ft\"><span>From the delivery record - it moves as things are ticked on site. ${sat ? 'Each code opens navigation to the drop-off. Satellite pictures © Mapbox © OpenStreetMap © Maxar.' : 'Hire value: the 2026 card at the charged days and minimum hire, ex GST; a line with no rate is counted, never estimated.'}</span><span>GC500 Delivery Control</span></div>`;",
        'pdf footer credit', p, True)
t = rep(t, " + '.i83 .qr svg{width:27mm;height:27mm;display:block}",
        r""" + '.i83 .cards.ln87s{display:flex;flex-direction:column;gap:0;grid-auto-rows:auto}'
 + '.i83 .card.ln87p{margin:0;box-shadow:none;background:#fff;display:grid;grid-template-columns:27mm minmax(0,1fr) 88mm 25mm;grid-auto-rows:auto;gap:2.6mm;align-items:center;height:23.4mm;border:0;border-top:.3mm solid #d7dde4;border-radius:0;padding:1.2mm .5mm;box-sizing:border-box}'
 + '.i83 .card.ln87p .c1{display:flex;flex-direction:column;align-items:flex-start;gap:.8mm;min-width:0}.i83 .card.ln87p .ref{font-size:14pt}.i83 .card.ln87p .due{float:none;font:700 7.6pt/1.2 Inter,sans-serif;color:#15181a}'
 + '.i83 .card.ln87p .nm{margin:0;font:500 7.4pt/1.25 Inter,sans-serif;color:#5d6468;overflow-wrap:anywhere}'
 + '.i83 .card.ln87p .lb{display:block;font:800 6.2pt/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#7b8590;margin-bottom:.9mm}'
 + '.i83 .card.ln87p .c2{min-width:0}.i83 .card.ln87p .it{margin:0;display:flex;flex-wrap:wrap;gap:.6mm 2.6mm;font:500 8.2pt/1.3 Inter,sans-serif;color:#15181a}.i83 .ln87-it{white-space:nowrap}'
 + '.i83 .card.ln87p .tgs{display:flex;flex-wrap:wrap;gap:1mm;margin-top:1.1mm}.i83 .card.ln87p .st{margin:0;padding:.3mm 1.8mm;border-radius:2mm;font:700 6.8pt/1.3 Inter,sans-serif;background:#eef0f2;color:#3d454b}'
 + '.i83 .card.ln87p .st.ok{background:#e3f3ea;color:#1a7f45}.i83 .card.ln87p .st.am{background:#fdf0d8;color:#8a5200}.i83 .card.ln87p .st.no,.i83 .card.ln87p .st.rp{background:#fde4df;color:#b42318}'
 + '.i83 .card.ln87p .c3{display:flex;align-items:center;gap:2mm;min-width:0}'
 + '.i83 .ln87-loc{position:relative;display:block;flex:none;width:7.5mm;height:19mm;border:.3mm solid #c9ced2;border-radius:1mm;background-color:#f3f5f7;background-size:100% 100%;background-repeat:no-repeat;box-sizing:border-box}'
 + '.i83 .ln87-loc i{position:absolute;width:2.2mm;height:2.2mm;margin:-1.1mm 0 0 -1.1mm;border-radius:50%;background:#ff6a13;border:.35mm solid #fff;box-shadow:0 0 0 .7mm rgba(255,106,19,.3)}'
 + '.i83 .ln87-loc em{position:absolute;top:.4mm;right:.6mm;font:800 4.6pt/1 Inter,sans-serif;color:#5d6468;font-style:normal}'
 + '.i83 .card.ln87p .sat{display:block;flex:none;width:28mm;height:19mm;object-fit:cover;border-radius:1mm;background:#eef0f2}.i83 .card.ln87p .sat.ns{display:grid;place-items:center;font:600 6.4pt/1.2 Inter,sans-serif;color:#7b8590;text-align:center}'
 + '.i83 .card.ln87p .lw{min-width:0}.i83 .card.ln87p .lo{margin:0;font:700 8pt/1.25 Inter,sans-serif;color:#15181a;overflow-wrap:anywhere}.i83 .card.ln87p .lo.rp{color:#b42318}.i83 .card.ln87p .sb{margin-top:.5mm;font:500 7.2pt/1.25 Inter,sans-serif;color:#5d6468;overflow-wrap:anywhere}'
 + '.i83 .card.ln87p .qr svg{width:17.5mm;height:17.5mm}.i83 .card.ln87p .qr .nq{width:17.5mm;height:17.5mm;font-size:6pt}.i83 .card.ln87p .qr{gap:.5mm;font-size:6pt}'
 + '.i83 .qr svg{width:27mm;height:27mm;display:block}""", 'pdf styles', p, True)

# 5. the references in the table (the project manager, 2 Oct 2026, on the Inventory table: "we mention still not here - well,
#    give me a reference for each one, keeping this same look"): under each Still-to-come number, the reference of every
#    location it is still waiting on (with how many, when more than one), by the day due. Pressing one opens that type's
#    Still-to-come lines at that location - where it goes, Directions, the QR.
t = rep(t, "<td class=\"num\">${invCell(r, 'togo', Math.max(0, r.asked - r.on))}</td>",
        "<td class=\"num\">${invCell(r, 'togo', Math.max(0, r.asked - r.on))}${inv87Refs(r)}</td>", 'table references', p, True)
t = rep(t, "/* v7.82 - every location still to come, grouped by due day; the reference opens the item, Map shows where it goes */\nfunction togo782Html(I){",
        r"""/* v7.87 - the references behind a Still-to-come number, in the table itself */
function inv87Refs(r){
 const xs = Object.values(r.refs || {}).filter(x => x.asked - x.on > 0); if (!xs.length) return '';
 const due = k => { const a = assetOf(k); return (a && effectiveDates(a).in) || ''; };
 xs.sort((p, q) => String(due(p.key) || '9').localeCompare(String(due(q.key) || '9')) || p.key.localeCompare(q.key, undefined, {numeric: true}));
 return `<span class="inv87refs">${xs.map(x => { const n = x.asked - x.on, d = due(x.key);
  return `<button type="button" class="inv87ref" data-invref87="${esc(r.type + '|' + x.key)}" title="${esc(x.key)}: ${n} ${esc(r.item)} still to come${d ? ' - due ' + esc(fmtDate(d)) : ''}. Press for where it goes.">${esc(x.key)}${n > 1 ? '<i>×' + n + '</i>' : ''}</button>`; }).join('')}</span>`;
}
/* v7.82 - every location still to come, grouped by due day; the reference opens the item, Map shows where it goes */
function togo782Html(I){""", 'table references helper', p, True)
t = rep(t, "pane.querySelectorAll('[data-invdrill]').forEach(b => b.onclick = () => {",
        "pane.querySelectorAll('[data-invref87]').forEach(b => b.onclick = () => { const v = b.dataset.invref87, k = v.lastIndexOf('|'), ref = v.slice(k + 1); /* v7.87 */\n INV.drill = {t: v.slice(0, k), col: 'togo'}; render();\n setTimeout(() => { const li = [...document.querySelectorAll('#invDrill li.ln87')].find(x => x.dataset.k87 === ref); if (!li) return; li.classList.add('ln87-hit'); try { li.scrollIntoView({block: 'center', behavior: 'smooth'}); } catch (e) { li.scrollIntoView(); } }, 60); });\n pane.querySelectorAll('[data-invdrill]').forEach(b => b.onclick = () => {", 'table references press', p, True)
t = t.replace('/* v7.86 - a Fence blocks line on the Fencing tab', '/* v7.87 - Inventory: one line per location (still to do, locator, satellite, QR) on the card and the Share PDF. */\n/* v7.86 - a Fence blocks line on the Fencing tab', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.87 applied: Inventory one line per location - still to do, locator, satellite, QR - on the card and the Share PDF')
