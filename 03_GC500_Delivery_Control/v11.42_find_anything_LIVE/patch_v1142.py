"""Author: Andrew Fisher. v11.42 - the finder finds anything: every tab (and the Showcase), every VMS board by its number,
where each removal board goes, the removal mornings, and a generator by its register asset number.

Andrew, 23 Oct 2026: "Need to make sure we can find anything with ease." Measured on live v11.41 (a GET-only probe of the
search box with twenty likely words): a reference, a unit, a callout, a sheet and a document are found; "closures",
"removals", "where it is", "satellite", "showcase", "Friday", "Breaker", "Altus", "T10" and "1244536" (GN25's asset
number) found nothing, and "VMS 10" found sub-hire rows rather than the board.

v11.42, inside the finder's own functions (finderIndex, finderMatches, finderPick, finderRow), by text replacement:
- tabs: every TABS entry with everyday words as aliases (closures / fence -> Fence closures; removals -> VMS removals;
  boards -> VMS boards; where it is / satellite / explorer -> Map explorer; showcase / broadcast -> the Showcase, opened
  by showOpen()); a tab row opens the tab;
- VMS boards: the 28 boards from the page's positions ("VMS 10", "vms16", a board's words); a row opens the VMS boards
  tab and zooms the v11.41 satellite map on the board;
- removal spots: where each end-of-session board goes (behind 2 Breaker St, T2 runoff, T10 runoff, Altus compound /
  Cypress Ave); a row opens the VMS removals tab zoomed on the spot;
- removal mornings (Friday 23 ... Monday 26 Oct); a row opens the removals tab on that morning;
- an asset's register numbers join its search words, so "1244536" finds GN25.
A small script (find1142) carries the aliases and the zoom-after-tab-change. Footer v11.41 -> v11.42. The record is
untouched; the crew card untouched.

    python3 patch_v1142.py page.html      (in place, on the live v11.41 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()

INDEX_OLD = "const tw815 = typeof twinIds815 === 'function' ? twinIds815() : {}; /* v8.15 - a catalogue entry that is now its uploaded copy */"
INDEX_NEW = """/* v11.42 - tabs, VMS boards, removal spots and mornings: "Need to make sure we can find anything with ease" (Andrew, 23 Oct 2026) */
 try { (typeof TABS !== 'undefined' ? TABS : []).forEach(([k, l]) => out.push({kind: 'tab', tab: k, title: l, hay: (l + ' ' + k + ' tab ' + (FIND1142.alias[k] || '')).toLowerCase()}));
 out.push({kind: 'tab', tab: 'showcase', title: 'Showcase · race-day broadcast', hay: 'showcase race day broadcast 3d circuit playback show'});
 if (window.VMS1024 && typeof VMS1024.boards === 'function') VMS1024.boards().forEach(b => { const p = typeof VMS1024.position === 'function' ? VMS1024.position(b) : {lat: b.lat, lon: b.lon}; const t = String(b.title || '').trim();
 out.push({kind: 'vms', pos: b.pos, label: typeof VMS1024.label === 'function' ? VMS1024.label(b) : 'VMS ' + b.pos, where: t.split(/\\s[—-]\\sinstalled/i)[0].slice(0, 80), lat: p && p.lat, lon: p && p.lon,
 hay: ('vms ' + b.pos + ' vms' + b.pos + ' vms ' + String(b.pos).replace(/^0/, '') + ' vms' + String(b.pos).replace(/^0/, '') + ' board ' + t + ' ' + (b.board || '') + ' ' + (b.rego || '') + ' ' + (b.fleet || '')).toLowerCase()}); });
 if (window.VmsOff1132 && typeof VmsOff1132.boards === 'function') VmsOff1132.boards().forEach(b => { const sp = (Number.isFinite(b.storeLat) && Number.isFinite(b.storeLon)) ? {lat: b.storeLat, lon: b.storeLon, name: b.store} : (window.VmsMap1139 && VmsMap1139.SPOTS[b.pos]) || null; if (!sp) return;
 out.push({kind: 'spot', label: b.label || ('VMS ' + b.pos), pos: b.pos, name: sp.name, lat: sp.lat, lon: sp.lon, hay: ('where vms ' + b.pos + ' goes ' + sp.name + ' removal spot store off the track').toLowerCase()}); });
 if (window.VmsOff1132 && VmsOff1132.MORNINGS) VmsOff1132.MORNINGS.forEach(m => out.push({kind: 'morning', iso: m.iso, label: m.label, hay: (m.label + ' ' + m.iso + ' ' + (typeof fmtDate === 'function' ? fmtDate(m.iso) : '') + ' vms removal morning after ' + m.after).toLowerCase()})); } catch (e) {}
 const tw815 = typeof twinIds815 === 'function' ? twinIds815() : {}; /* v8.15 - a catalogue entry that is now its uploaded copy */"""
HAY_OLD = "...(a.item_types || []),...nums,...links.map(l => l.label)"
HAY_NEW = "...(a.item_types || []),...nums,...(a.asset_numbers || []) /* v11.42 - the register's numbers too */,...links.map(l => l.label)"
CAP_OLD = "const cap = {asset: 8, unit: 4, place: 6, sheet: 3, doc: 8, docday: 4}, /* v8.15 - doc was 4 */\n seen = {asset: 0, unit: 0, place: 0, sheet: 0, doc: 0, docday: 0};"
CAP_NEW = "const cap = {asset: 8, unit: 4, place: 6, sheet: 3, doc: 8, docday: 4, tab: 4, vms: 5, spot: 4, morning: 3}, /* v8.15 - doc was 4; v11.42 tabs, boards, spots, mornings */\n seen = {asset: 0, unit: 0, place: 0, sheet: 0, doc: 0, docday: 0, tab: 0, vms: 0, spot: 0, morning: 0};"
SCORE_OLD = " if (it.kind === 'doc') { n += 22; if ((it.title || '').toLowerCase() === s) n += 70; }"
SCORE_NEW = """ if (it.kind === 'doc') { n += 22; if ((it.title || '').toLowerCase() === s) n += 70; }
 /* v11.42 - a tab by its name or an everyday word for it; a board by its number; where a board goes; a removal morning */
 if (it.kind === 'tab') { n += 45; const t = it.title.toLowerCase(); if (t === s || it.tab === s) n += 100; else if (t.startsWith(s) || (FIND1142.alias[it.tab] || '').split(' ').includes(s)) n += 60; }
 if (it.kind === 'vms') { n += 50; const lab = it.label.toLowerCase().replace(/\\*/g, '').trim(), sq = s.replace(/\\s/g, ''); if (lab === s || lab.replace(/\\s/g, '') === sq || lab.replace(/\\s/g, '') === sq.replace(/^vms0?/, 'vms0') ) n += 110; else if (lab.startsWith(s)) n += 40; }
 if (it.kind === 'spot') { n += 42; if (it.name.toLowerCase().startsWith(s) || it.name.toLowerCase().includes(' ' + s)) n += 40; }
 if (it.kind === 'morning') { n += 40; if (it.label.toLowerCase().startsWith(s)) n += 60; }"""
NAME_OLD = " const name = it => it.key || it.sheetKey || it.title || '';"
NAME_NEW = " const name = it => it.key || it.sheetKey || it.title || it.label || '';"
PICK_OLD = " if (it.kind === 'doc' || it.kind === 'docday') {\n const href = docHref({id: it.id});"
PICK_NEW = """ /* v11.42 - a tab opens; a board opens the VMS boards tab with the satellite map zoomed on it; a spot opens the removals
 map zoomed on it; a morning opens the removals tab on that morning */
 if (it.kind === 'tab') { if (it.tab === 'showcase') { if (typeof showOpen === 'function') showOpen(); else go('today'); return; } go(it.tab); return; }
 if (it.kind === 'vms') { go('vms'); find1142Zoom('vms', it.lat, it.lon); return; }
 if (it.kind === 'spot') { go('vmsoff'); find1142Zoom('vmsoff', it.lat, it.lon); return; }
 if (it.kind === 'morning') { if (window.VmsOff1132) VmsOff1132.morning = it.iso; go('vmsoff'); return; }
 if (it.kind === 'doc' || it.kind === 'docday') {
 const href = docHref({id: it.id});"""
INJ_OLD = " const M = make(m); M.items = M.all(); if (!M.items.length) return;"
INJ_NEW = " const M = make(m); const prev = live[m.key]; if (prev) { M.view = prev.view; M.filter = prev.filter; } /* v11.42 - a redraw of the pane keeps the view the finder set */ M.items = M.all(); if (!M.items.length) return;"
ROW_OLD = " if (it.kind === 'docday') {\n const today = (typeof todayIso === 'function' && it.date === todayIso());"
ROW_NEW = """ if (it.kind === 'tab') return `<div class="fi tab${on ? ' on' : ''}" role="option" id="fi-${i}" aria-selected="${on}" data-fi="${i}">
 <span class="fipin" aria-hidden="true">▸</span><span class="fim"><b>${esc(it.title)}</b>
 <span>${it.tab === 'showcase' ? 'the race-day broadcast' : 'a tab of this page'}</span><span class="fiw">${it.tab === 'showcase' ? 'opens the Showcase' : 'opens the tab'}</span></span><span class="fik">Tab</span></div>`;
 if (it.kind === 'vms') return `<div class="fi vms${on ? ' on' : ''}" role="option" id="fi-${i}" aria-selected="${on}" data-fi="${i}">
 <span class="fipin" aria-hidden="true">${esc(String(it.pos).slice(0, 4))}</span><span class="fim"><b>${esc(it.label)}</b>
 <span>${esc(it.where)}</span><span class="fiw">${Number.isFinite(it.lat) ? 'opens the VMS boards tab with the satellite map zoomed on it' : 'no position on the record · opens the VMS boards tab'}</span></span><span class="fik">VMS</span></div>`;
 if (it.kind === 'spot') return `<div class="fi spot${on ? ' on' : ''}" role="option" id="fi-${i}" aria-selected="${on}" data-fi="${i}">
 <span class="fipin" aria-hidden="true">${esc(String(it.pos).slice(0, 4))}</span><span class="fim"><b>${esc(it.label)} → ${esc(it.name)}</b>
 <span>where the board goes when it comes off the track</span><span class="fiw">opens the VMS removals map zoomed on the spot</span></span><span class="fik">Removal</span></div>`;
 if (it.kind === 'morning') return `<div class="fi morning${on ? ' on' : ''}" role="option" id="fi-${i}" aria-selected="${on}" data-fi="${i}">
 <span class="fipin dy" aria-hidden="true">${esc(String(it.iso).slice(8, 10))}</span><span class="fim"><b>${esc(it.label)}</b>
 <span>${esc(typeof fmtDate === 'function' ? fmtDate(it.iso) : it.iso)} · VMS removals</span><span class="fiw">opens the removals tab on that morning</span></span><span class="fik">Removal</span></div>`;
 if (it.kind === 'docday') {
 const today = (typeof todayIso === 'function' && it.date === todayIso());"""
SCRIPT = """/* Author: Andrew Fisher. v11.42 - the finder's everyday words for the tabs, and the zoom after a tab change. */
(function (W) {
'use strict';
W.FIND1142 = {alias: {today: 'home now', progress: 'progress where we are', map: 'map explorer satellite where it is plan drawing sheet', docs: 'documents pdf files', register: 'register assets', plant: 'equipment plant assets generators toilets', demob: 'demob removal pick up', fencing: 'fencing fence armco', prestarts: 'pre-starts prestarts', coatesway: 'coates way', journal: 'journal diary', breakdowns: 'breakdowns', variances: 'variances', costs: 'costs p&l revenue finance', edit: 'edit', change: 'change deliveries', add: 'add an asset', pricing: 'pricing rates', timeline: 'build calendar deliveries timeline', subhired: 'sub-hired subhired premiair', nights: 'event nights run sheet servicing', vmsoff: 'vms removals removal boards off the track morning', fenceclose: 'fence closures closure closing gates lines neon map', servicing: 'servicing tracker toilets crew card', vms: 'vms boards board signs where it is satellite', questions: 'questions', about: 'about this file'}};
/* the register's asset numbers join an asset's search words whichever copy of the index runs (a later script wraps
   finderIndex and rebuilds its entries, so the words are added here, after every copy) */
const idx0 = W.finderIndex;
if (typeof idx0 === 'function') W.finderIndex = function () { const out = idx0.apply(this, arguments);
 try { const by = {}; ((typeof DATA !== 'undefined' && DATA.assets) || []).forEach(a => { by[a.key] = a; });
  out.forEach(it => { if (it.kind !== 'asset' || !by[it.key]) return; const nums = (by[it.key].asset_numbers || []).map(String).filter(Boolean); if (!nums.length) return;
   const add = nums.filter(n => !it.hay.includes(n.toLowerCase())); if (add.length) it.hay += ' ' + add.join(' ').toLowerCase();
   if (Array.isArray(it.nums)) nums.forEach(n => { if (!it.nums.some(x => String(x) === n)) it.nums.push(n); }); }); } catch (e) {}
 return out; };
W.find1142Zoom = function (where, lat, lon) {
 if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
 let tries = 0; (function go1142(){
  /* the tab's pane may redraw itself after the first draw; the zoom is set once the map is there and kept by the map across a redraw */
  if (where === 'vms' && W.SatMap1141 && SatMap1141.maps.vms && document.querySelector('#pane-vms .s1141-map[data-s1141="vms"] .s1141-svg')) { const c = document.querySelector('#pane-vms .s1141-map[data-s1141="vms"]'); SatMap1141.setZoom('vms', 1600, lat, lon); if (c) c.scrollIntoView({block: 'start'}); return; }
  if (where === 'vmsoff' && W.VmsMap1139 && document.querySelector('#pane-vmsoff .v1139-svg')) { const c = document.querySelector('#pane-vmsoff .v1139-map'); VmsMap1139.setZoom(1600, lat, lon); if (c) c.scrollIntoView({block: 'start'}); return; }
  if (++tries < 16) setTimeout(go1142, 250);
 })();
};
})(window);"""


def patch(html):
    if hashlib.sha256(html.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.42 requires the live v11.41 page ' + BASE_SHA256)
    if 'find1142-script' in html: raise ValueError('v11.42 already applied')
    for old, new, what in [(INDEX_OLD, INDEX_NEW, 'finder index'), (HAY_OLD, HAY_NEW, 'asset hay'), (CAP_OLD, CAP_NEW, 'caps'), (SCORE_OLD, SCORE_NEW, 'scores'), (NAME_OLD, NAME_NEW, 'name'), (PICK_OLD, PICK_NEW, 'pick'), (ROW_OLD, ROW_NEW, 'row'), (INJ_OLD, INJ_NEW, 'satellite map view kept')]:
        if html.count(old) != 1: raise ValueError('the finder is not as expected at: ' + what + ' x' + str(html.count(old)))
        html = html.replace(old, new)
    html = rep(html, "+' · v11.41'; /* v8.19 release922", "+' · v11.42'; /* v8.19 release922", 'release footer', 'page')
    i = html.rfind('</body>')
    if i < 0 or html.count('</body>') != 3 or html.rfind('<script id="satmap1141-script">') > i: raise ValueError('the end of the page is not as expected')
    html = html[:i] + '<script id="find1142-script">\n' + SCRIPT + '\n</script>\n' + html[i:]
    for needle, n in [('find1142-script', 1), ('W.FIND1142 = ', 1), ("kind: 'tab', tab: k", 1), ("kind: 'vms', pos: b.pos", 1), ("kind: 'spot', label:", 1), ("kind: 'morning', iso: m.iso", 1), ("if (it.kind === 'tab') return", 1), ("if (it.kind === 'tab') { if (it.tab === 'showcase')", 1), ('tab: 4, vms: 5, spot: 4, morning: 3', 1)]:
        if html.count(needle) != n: raise ValueError('v11.42 did not land cleanly: ' + needle + ' x' + str(html.count(needle)))
    return html


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1142 applied: the finder finds tabs, VMS boards, removal spots and mornings, and register asset numbers; footer v11.41 -> v11.42')
