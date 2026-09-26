#!/usr/bin/env python3
"""v6.87 (DRAFT until Andrew says yes) - ONE MAP: THE MASTER (Andrew, 27 Sep 2026: "we have the master. We click
buildings, then all locations of buildings show up. We click toilets and all locations show up. Rather than having all
maps. We still keep a record in documents. Same with barriers. Same with stand numbers like S08 - circles all
locations. If we click a number, e.g. P01, it should show 2 shots of the master, close up and aerial. Then if photos
are available 1 normal and 1 aerial photo; if none, a normal picture, not the aerial. Thumbnails.")

 - the Map tab opens on "Master plan": D001-26003-03 with a marker on every unit the master places (on the unit),
   the area-only lines (barriers, plant) in a dashed marker, the VMS boards from D025 (moved onto the master: that
   sheet is drawn 44 points to the side of it) and the stand numbers S01-S25
 - the trade row filters it: buildings, toilets, generators, lights, barriers, VMS ...
 - a stand row (and pressing a stand number on the map) circles every unit in that stand
 - the other drawing sheets are off the Map tab's buttons; they stay in Documents, and a search for a callout that is
   only on one of them still opens it
 - a unit's drawer: the two master pictures, then one site photograph and one aerial where they were taken, else the
   stock picture of the product - all thumbnails, full size on a press
Applied after patch_v686.py.   python3 patch_v687.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R("""function fixOf(key){ return pinsNow()[key] || null; }""", """function fixOf(key){ return pinsNow()[key] || null; }
/* v6.87 - ONE MAP: the master, with every unit, the VMS boards and the stand numbers on it */
(function masterSheet(){
 const d1 = (DATA.sheets || []).find(s => s.key === 'D001'); if (!d1 || DATA.sheets.some(s => s.key === 'MASTER')) return;
 const mk = [];
 Object.entries(MASTER_LOC).forEach(([k, m]) => { if (!m.pt) return;
 mk.push({label: k, ref: k, kind: m.prec === 'unit' ? 'master' : 'master_area', marker_kind: 'label', fx: m.pt[0], fy: m.pt[1], sec: m.sec || null}); });
 (d1.markers || []).filter(x => x.kind === 'circuit_sector').forEach(x => mk.push(Object.assign({}, x, {sector: true})));
 const d25 = DATA.sheets.find(s => s.key === 'D025');
 /* the boards drawn on D025 (its legend and its off-site notes are not places); the arrow tip where one was traced */
 const VMS_TIPS = {"03":[0.05394,0.75374],"04A":[0.07626,0.75475],"13*":[0.09195,0.66562],"5A":[0.14736,0.64905],"2A":[0.19048,0.60843],"19":[0.30805,0.42833],"12":[0.36477,0.39186],"11":[0.38129,0.34181],"05":[0.53372,0.35517],"06":[0.73763,0.36158],"15":[0.76477,0.26063],"18":[0.84916,0.2484],"20":[0.86804,0.14531],"08":[0.54174,0.22037],"7A":[0.36141,0.21413],"16*":[0.09241,0.2766],"17*":[0.07928,0.45172]};
 ((d25 && d25.markers) || []).filter(x => x.kind === 'vms' && x.context === 'Source callout').forEach(x => {
 const t = VMS_TIPS[x.label], fx = t ? t[0] : (x.fx * 2384 - 43.8) / 2384, fy = t ? t[1] : x.fy;
 mk.push({label: 'VMS ' + x.label, kind: 'vms', marker_kind: 'label', fx: fx, fy: fy, vms: true}); });
 DATA.sheets.push(Object.assign({}, d1, {key: 'MASTER', sheet_id: 'MASTER-D001-26003-03', title: 'Master plan',
 subtitle: 'D001-26003-03 · every unit on one map', markers: mk, master: true}));
})();
function mapSheetsShown(sh){ const m = DATA.sheets.filter(s => s.master); return m.length ? m.concat(sh && !sh.master ? [sh] : []) : DATA.sheets; }
function standBar(sh){
 const secs = (sh.markers || []).filter(m => m.sector).map(m => m.label).sort((a, b) => a.localeCompare(b, 'en', {numeric: true}));
 const n = s => (sh.markers || []).filter(m => m.ref && m.sec === s).length;
 return `<div class="lightbar standbar" role="group" aria-label="Circle a stand"><span class="lead">Stand</span>
 <button type="button" data-mapsec="" aria-pressed="${!state.mapSec && !state.mapVms}">All</button>
 <button type="button" data-mapvms="1" aria-pressed="${!!state.mapVms}" title="the VMS boards drawn on D025, on the master">VMS boards <b>${(sh.markers || []).filter(m => m.vms).length}</b></button>
 ${secs.map(s => `<button type="button" data-mapsec="${esc(s)}" aria-pressed="${state.mapSec === s}">${esc(s)} <b>${n(s)}</b></button>`).join('')}</div>`;
}""", 'master sheet')
    # the map draws the master by default and links its markers straight to their reference
    t = R("""const sh = DATA.sheets.find(s => s.key === state.sheet) || DATA.sheets[0];
 /* v5.83""", """if (!state.mapMasterSeen) { state.mapMasterSeen = true; if (!state.found) state.sheet = 'MASTER'; }
 const sh = DATA.sheets.find(s => s.key === state.sheet) || DATA.sheets.find(s => s.master) || DATA.sheets[0];
 /* v5.83""", 'default sheet')
    t = R("""const linkedTo = m => (m.tag ? byTag.get(m.tag) : null) || byLabel.get(m.label) || null;""",
          """const linkedTo = m => m.ref ? [m.ref] : (m.sector || m.vms) ? null : ((m.tag ? byTag.get(m.tag) : null) || byLabel.get(m.label) || null);""", 'linkedTo')
    t = R("""const onSheet = allAssets().filter(a => (a.drawing_links||[]).some(l => l.sheet === sh.sheet_id));""",
          """const onSheet = sh.master ? allAssets().filter(a => MASTER_LOC[a.key] && MASTER_LOC[a.key].pt) : allAssets().filter(a => (a.drawing_links||[]).some(l => l.sheet === sh.sheet_id));""", 'onSheet')
    t = R("""const cls = ['mk'];
 if (m.marker_kind === 'note') cls.push('note');""", """const cls = ['mk'];
 if (m.marker_kind === 'note') cls.push('note');
 if (m.kind === 'master_area') cls.push('mkarea');
 if (m.sector) { cls.push('mksec'); if (state.mapSec === m.label) cls.push('sel'); }
 if (m.vms) cls.push('mkvms');
 if (sh.master && state.mapSec && m.ref) cls.push(m.sec === state.mapSec ? 'secring' : 'off');
 if (sh.master && state.mapSec && m.vms) cls.push('off');
 if (sh.master && state.mapVms && !m.vms && !m.sector) cls.push('off');""", 'marker classes')
    t = R("""data-label="${esc(m.label)}" data-keys="${esc((linked||[]).join(','))}\"""",
          """data-label="${esc(m.label)}"${m.sector ? ` data-mapsec="${esc(m.label)}"` : ''} data-keys="${esc((linked||[]).join(','))}\"""", 'sector attr')
    t = R(""" : esc(String(m.label||'').slice(0,4));""", """ : m.vms ? esc(String(m.label || '').replace(/^VMS /, 'V'))
 : esc(String(m.label||'').slice(0,4));""", 'vms face')
    # only the master on the Map tab's sheet buttons (the drawings stay in Documents)
    n1 = t.count('<select id="sheetSel" data-ro aria-label="Sheet">${DATA.sheets.map(s =>'); n2 = t.count("${DATA.sheets.map(s => `<button class=\"btn sheetbtn")
    t = t.replace('<select id="sheetSel" data-ro aria-label="Sheet">${DATA.sheets.map(s =>', '<select id="sheetSel" data-ro aria-label="Sheet">${mapSheetsShown(typeof sh === \'undefined\' ? null : sh).map(s =>')
    t = t.replace("${DATA.sheets.map(s => `<button class=\"btn sheetbtn", "${mapSheetsShown(typeof sh === 'undefined' ? null : sh).map(s => `<button class=\"btn sheetbtn")
    print('sheet lists replaced', n1, n2)
    t = R(""" ${discBar(onSheet)}
 ${onSheet.length ? lightBar(onSheet, 'Lights on this sheet') : ''}""", """ ${discBar(onSheet)}
 ${sh.master ? standBar(sh) : ''}
 ${onSheet.length ? lightBar(onSheet, sh.master ? 'Lights on the master' : 'Lights on this sheet') : ''}""", 'stand bar')
    t = R("""<details class="notice info mapabout"${phone ? '' : ' open'}><summary><b>What a marker is</b></summary>""",
          """${sh.master ? `<details class="notice info mapabout"><summary><b>The master plan</b></summary>
 Every unit sits where the master plan D001-26003-03 puts it: the tag printed on the unit, or the callout on its own sheet followed to its arrow. A dashed marker is an area only (the line names a place, not a spot). VMS boards come from D025. Pick a trade to show only that trade; pick a stand, or press a stand number on the map, to circle every unit in it. The separate drawings are in Documents.</details>` : ''}
 <details class="notice info mapabout"${phone || sh.master ? '' : ' open'}${sh.master ? ' hidden' : ''}><summary><b>What a marker is</b></summary>""", 'notice')
    t = R("""$('#pane-map').querySelectorAll('.mk').forEach(b => b.onclick = ev => {""",
          """$('#pane-map').querySelectorAll('[data-mapsec]').forEach(b => b.onclick = ev => { ev.stopPropagation(); const v = b.dataset.mapsec || null; state.mapSec = v && state.mapSec === v && b.classList.contains('mk') ? null : v; state.mapVms = false; renderMap(); });
 $('#pane-map').querySelectorAll('[data-mapvms]').forEach(b => b.onclick = () => { state.mapVms = !state.mapVms; state.mapSec = null; state.mapDisc = null; renderMap(); });
 $('#pane-map').querySelectorAll('.mk:not(.mksec)').forEach(b => b.onclick = ev => {""", 'handlers')
    # search and "show on map" go to the master
    t = R("""function mapPlaceFor(a){""", """function mapPlaceFor(a){
 const MS = DATA.sheets.find(s => s.master);
 if (MS && a && MASTER_LOC[a.key]) { const m = MS.markers.find(x => x.ref === a.key); if (m) return {sheet: MS, label: a.key, marker: m}; }""", 'mapPlaceFor')
    t = R("""function mapSheetFor(a){""", """function mapSheetFor(a){
 if (a && MASTER_LOC[a.key]) { const MS = DATA.sheets.find(s => s.master); if (MS) return MS; }""", 'mapSheetFor')
    # the drawer: the site photographs, or the stock picture
    t = R(""" ${others.length ? `<span class="w">The master also tags""", """ ${masterPhotoRow(a)}
 ${others.length ? `<span class="w">The master also tags""", 'drawer photos')
    t = R("""function pinBlock(a){""", """/* v6.87 - one photograph taken on site and one aerial where there are some; else the stock picture of the product */
function masterPhotoRow(a){
 const phs = dropPhotosOf(a.key), sl = p => DROP_SLOTS[p.slot] || {};
 const norm = phs.find(p => !sl(p).aerial), aer = phs.find(p => sl(p).aerial);
 const tile = (url, full, word) => `<a href="${esc(full)}" target="_blank" rel="noopener noreferrer"><img src="${esc(url)}" decoding="async" alt="${esc(a.key + ' — ' + word)}"><span>${esc(word)}</span></a>`;
 const out = [];
 [[norm, 'On site'], [aer, 'Aerial']].forEach(([p, w]) => { if (!p) return; const r = photoFor(p); if (r.state === 'ready') out.push(tile(r.thumb || r.url, r.url, w + ' · ' + (sl(p).lab || 'photograph'))); });
 if (!out.length && [norm, aer].some(p => p && photoFor(p).state === 'checking')) return '<div class="mlocpics mlocphotos"><span class="w">Loading the site photographs…</span></div>';
 if (!out.length) { const pp = productPhoto(a); if (pp && typeof pp.src === 'string') out.push(tile(pp.src, pp.src, 'Stock picture · ' + (pp.says || 'this product'))); }
 return out.length ? `<div class="mlocpics mlocphotos">${out.join('')}</div>` : '';
}
function pinBlock(a){""", 'photo row fn')
    css = """
/* v6.87 - one map */
.mk.mkarea{border-style:dashed!important;opacity:.9}
.mk.mksec{background:#16324f!important;color:#fff!important;border-color:#16324f!important;font-weight:800;cursor:pointer}
.mk.mksec.sel{background:#e8641b!important;border-color:#e8641b!important}
.mk.mkvms{background:#5b2a86!important;color:#fff!important;border-color:#5b2a86!important}
.mk.secring{box-shadow:0 0 0 3px #fff,0 0 0 6px #e8641b,0 0 14px 6px rgba(232,100,27,.55)!important;z-index:5}
.standbar{flex-wrap:wrap}
.mlocphotos{grid-template-columns:repeat(auto-fill,minmax(120px,150px))!important}
.mlocphotos img{aspect-ratio:4/3;object-fit:cover}
.mapabout[hidden]{display:none!important}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
