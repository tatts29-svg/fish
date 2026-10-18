#!/usr/bin/env python3
"""v6.88 - WHAT THE OTHER SHEETS DRAW, ON THE MASTER (Andrew, 27 Sep 2026: "If they are on other sheets lets add to
the master").

The master map gains a Show bar. Each button shows one set of places the other drawings put on the site, read off
those drawings and laid on the master in its own frame:
  Water barriers   the runs on the zone pages K221-K231 (each page registered onto the master by the words the two
                   share; the colour says traffic management or HVM, the page's own counts go with it)
  Gates            G1-G10 on D001 (approach and fence line)
  Entry points     the E.P marks on D001
  Big screens      001-014 on D024, each leader line followed to its arrow
  Other gensets    EE (Eventelec, direct hire) and TV (SC Television, self supply) on D024 - not ours
  Interface areas  EVL, GEM, TAL, COO on D022 - "not in BOQ"
  Toilets not on our schedule   WC18, WCBS, WCTV on D023
VMS boards stay on by default as before. Pressing a place says what it is, which drawing it came from, and gives
Drive / Walk / Earth. P27 and P29 join the units on the master (built into MASTER_LOC by patch_v685 with
master_loc_688.json, and their two pictures by patch_v686 with new_media_688.json).

Also: the map's search lights the master's markers (it matched drawing callouts, which the master has none of); the
"callout with nothing at it" list, the breakdown form and the Edit sheet list leave the master out (it is a view,
not an issued drawing).

Applied after patch_v687.py.   python3 patch_v688.py <page.html> <master_extra.json>
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, extraf, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    E = json.load(open(extraf))
    lay = [{k: l[k] for k in ('layer', 'label', 'face', 'fx', 'fy', 'll', 'src', 'note')} for l in E['layers']]
    off = [{'sheet': o['sheet'], 'll': o['ll']} for o in E['off_sheet']]
    js = json.dumps(lay, separators=(',', ':'), ensure_ascii=False)
    # the layers join the master sheet
    t = R("""mk.push({label: 'VMS ' + x.label, kind: 'vms', marker_kind: 'label', fx: fx, fy: fy, vms: true}); });""",
          """mk.push({label: 'VMS ' + x.label, kind: 'vms', marker_kind: 'label', fx: fx, fy: fy, vms: true, layer: 'vms', src: 'D025-26003-02',
 note: 'VMS board ' + x.label + ' as D025 draws it' + (t ? ', its arrow followed to the tip.' : '.')}); });
 /* v6.88 - what the other sheets draw (Andrew, 27 Sep 2026: "if they are on other sheets lets add to the master") */
 MASTER_LAYERS.forEach(l => mk.push(Object.assign({kind: 'layer', marker_kind: 'label'}, l)));""", 'layers into master')
    t = R("""(function masterSheet(){""", """/* v6.88 - places the other drawings put on the site, laid on the master: water-barrier runs (K221-K231, each zone
 page registered onto the master), gates and entry points (D001), big screens and other people's gensets (D024),
 interface areas (D022) and the toilets D023 draws that our schedule does not carry. */
const MASTER_LAYERS = """ + js + """;
const MASTER_OFFSHEET = """ + json.dumps(off, separators=(',', ':')) + """;
const MAP_LAYERS = [['vms', 'VMS boards', 'the VMS boards drawn on D025'], ['wb', 'Water barriers', 'the barrier runs on K221-K231, zone by zone'],
 ['gate', 'Gates', 'the gates on D001'], ['ep', 'Entry points', 'the pedestrian entry points (E.P) on D001'], ['screen', 'Big screens', 'the big screens on D024'],
 ['gens', 'Other gensets', 'EE (Eventelec, direct hire) and TV (SC Television, self supply) on D024 - not ours'],
 ['iface', 'Interface areas', 'EVL, GEM, TAL and COO on D022 - not in the BOQ'], ['wcx', 'Toilets not on our schedule', 'WC18, WCBS and WCTV, drawn on D023 with no schedule row']];
(function masterSheet(){""", 'layers const')
    t = R("""const linkedTo = m => m.ref ? [m.ref] : (m.sector || m.vms) ? null :""",
          """const linkedTo = m => m.ref ? [m.ref] : (m.sector || m.vms || m.layer) ? null :""", 'linkedTo')
    t = R(""" if (sh.master && state.mapSec && m.vms) cls.push('off');
 if (sh.master && state.mapVms && !m.vms && !m.sector) cls.push('off');
 if (q) cls.push(hits.has(m.label) ? 'hit' : 'dim');""", """ if (m.layer) { cls.push('mkly', 'ly-' + m.layer);
 const qhit = q && (m.label + ' ' + (m.note || '')).toLowerCase().includes(q);
 if (state.mapLayer ? state.mapLayer !== m.layer : m.layer !== 'vms') { if (!qhit) cls.push('lyhide'); } }
 if (sh.master && state.mapSec && m.layer) cls.push('off');
 if (sh.master && state.mapLayer && !m.layer && !m.sector && !(linked && linked.some(k => (assetOf(k) || {}).discipline === ({wb: 'Water-filled barriers', vms: 'Variable message signs'})[state.mapLayer]))) cls.push('off');
 if (q) cls.push(hits.has(m.label) || (m.layer && (m.label + ' ' + (m.note || '')).toLowerCase().includes(q)) ? 'hit' : 'dim');""", 'classes')
    t = R(""".flatMap(a => (a.drawing_links||[]).filter(l => l.sheet === sh.sheet_id).map(l => l.label)));""",
          """.flatMap(a => sh.master ? [a.key] : (a.drawing_links||[]).filter(l => l.sheet === sh.sheet_id).map(l => l.label)));""", 'master search hits')
    t = R(""" : linked ? named + ' · callout ' + m.label + ' · ' + lightWords + doneWords + lvlWords + stpWords + bdWords + movedWord + offWords
 : (m.label || '');""", """ : linked ? named + ' · callout ' + m.label + ' · ' + lightWords + doneWords + lvlWords + stpWords + bdWords + movedWord + offWords
 : m.note ? m.label + ' — ' + m.note
 : (m.label || '');""", 'title')
    t = R(""" : 'callout ' + (m.label || 'unlabelled') + ', no schedule row linked');""",
          """ : m.note ? m.label + ' — ' + m.note
 : 'callout ' + (m.label || 'unlabelled') + ', no schedule row linked');""", 'name')
    t = R(""" : m.vms ? esc(String(m.label || '').replace(/^VMS /, 'V'))""", """ : m.face ? esc(m.face)
 : m.vms ? esc(String(m.label || '').replace(/^VMS /, 'V'))""", 'face')
    t = R("""data-label="${esc(m.label)}"${m.sector ? ` data-mapsec="${esc(m.label)}"` : ''}""",
          """data-label="${esc(m.label)}"${m.sector ? ` data-mapsec="${esc(m.label)}"` : ''}${m.layer ? ` data-lyi="${i}"` : ''}""", 'layer attr')
    # the Show bar
    t = R(""" <button type="button" data-mapsec="" aria-pressed="${!state.mapSec && !state.mapVms}">All</button>
 <button type="button" data-mapvms="1" aria-pressed="${!!state.mapVms}" title="the VMS boards drawn on D025, on the master">VMS boards <b>${(sh.markers || []).filter(m => m.vms).length}</b></button>
 ${secs.map(s => `<button type="button" data-mapsec="${esc(s)}" aria-pressed="${state.mapSec === s}">${esc(s)} <b>${n(s)}</b></button>`).join('')}</div>`;""",
          """ <button type="button" data-mapsec="" aria-pressed="${!state.mapSec && !state.mapLayer}">All</button>
 ${secs.map(s => `<button type="button" data-mapsec="${esc(s)}" aria-pressed="${state.mapSec === s}">${esc(s)} <b>${n(s)}</b></button>`).join('')}</div>
 <div class="lightbar standbar showbar" role="group" aria-label="Show what the other drawings put on the site"><span class="lead">Show</span>
 ${MAP_LAYERS.map(([k, w, why]) => { const c = (sh.markers || []).filter(m => m.layer === k).length; return c ? `<button type="button" data-maplayer="${k}" aria-pressed="${state.mapLayer === k}" title="${esc(why)}"><i class="lysw ly-${k}" aria-hidden="true"></i>${esc(w)} <b>${c}</b></button>` : ''; }).join('')}</div>`;""", 'show bar')
    t = R("""state.mapSec = v && state.mapSec === v && b.classList.contains('mk') ? null : v; state.mapVms = false; renderMap(); });
 $('#pane-map').querySelectorAll('[data-mapvms]').forEach(b => b.onclick = () => { state.mapVms = !state.mapVms; state.mapSec = null; state.mapDisc = null; renderMap(); });
 $('#pane-map').querySelectorAll('.mk:not(.mksec)').forEach(b => b.onclick = ev => {
 ev.stopPropagation();""", """state.mapSec = v && state.mapSec === v && b.classList.contains('mk') ? null : v; state.mapLayer = null; renderMap(); });
 $('#pane-map').querySelectorAll('[data-maplayer]').forEach(b => b.onclick = () => { const v = b.dataset.maplayer; state.mapLayer = state.mapLayer === v ? null : v; state.mapSec = null; state.mapDisc = null; renderMap(); });
 $('#pane-map').querySelectorAll('.mk:not(.mksec)').forEach(b => b.onclick = ev => {
 ev.stopPropagation();
 if (b.dataset.lyi != null) { layerCallout(sh.markers[+b.dataset.lyi]); return; }""", 'handlers')
    t = R("""function emptyCallout(sh, labels){""", """/* v6.88 - a place another drawing puts on the site: what it is, where it came from, and the way there */
function layerCallout(m){
 if (!m) return;
 document.querySelectorAll('.mkpick').forEach(e => e.remove());
 const d = document.createElement('div'); d.className = 'mkpick'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', m.label);
 const ll = m.ll ? {lat: m.ll[0], lon: m.ll[1]} : null;
 d.innerHTML = `<div class="mkpick-h"><b>${esc(m.label)}</b><button class="close" aria-label="Close" title="Close">&times;</button></div>
 <p class="norate" style="margin:0 6px 6px">${esc(m.note || '')}</p>
 <p class="norate w" style="margin:0 6px 8px">From ${esc(m.src || 'the drawings')}, laid on the master plan D001-26003-03. The drawing itself is in Documents.</p>
 ${ll ? `<div class="pinacts" style="margin:0 6px 8px;display:flex;gap:6px;flex-wrap:wrap">
 <a class="btn ghost" href="${navUrl(ll)}" target="_blank" rel="noopener noreferrer" title="Driving directions — ends at the nearest road.">Drive there</a>
 <a class="btn ghost" href="${walkUrl(ll)}" target="_blank" rel="noopener noreferrer">Walk to it</a>
 <a class="btn ghost" href="${earthUrl(ll)}" target="_blank" rel="noopener noreferrer">Earth</a></div>` : ''}`;
 mounted(document.body.appendChild(d));
 const close = () => { d.remove(); document.removeEventListener('keydown', onKey); };
 const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
 document.addEventListener('keydown', onKey);
 d.querySelector('.close').onclick = close;
 d.querySelector('.close').focus();
}
function emptyCallout(sh, labels){""", 'layerCallout')
    t = R("""VMS boards come from D025. Pick a trade to show only that trade;""",
          """VMS boards come from D025. Under Show, one press lays out what the other drawings put on the site: the water-barrier runs from the zone pages K221-K231, the gates and entry points, the big screens, other people's gensets, the interface areas and the toilets D023 draws that our schedule does not carry; press a place to see what it is and get there.${MASTER_OFFSHEET.length ? ' ' + MASTER_OFFSHEET.length + ' barrier run' + (MASTER_OFFSHEET.length === 1 ? '' : 's') + ' (' + [...new Set(MASTER_OFFSHEET.map(o => o.sheet))].join(', ') + ') fall past the edge of the master, so they are on their zone pages in Documents only.' : ''} Pick a trade to show only that trade;""", 'notice')
    # the master is a view, not an issued drawing
    t = R("""function emptyCallouts(){
 const out = [];
 const all = allAssets();
 (DATA.sheets || []).forEach(sh => {""", """function emptyCallouts(){
 const out = [];
 const all = allAssets();
 (DATA.sheets || []).filter(sh => !sh.master).forEach(sh => {""", 'emptyCallouts')
    t = R("""const sheets = (DATA.fence_sheets || []).map(x => x.sheet_id).concat(DATA.sheets.map(x => x.sheet_id).filter(Boolean));""",
          """const sheets = (DATA.fence_sheets || []).map(x => x.sheet_id).concat(DATA.sheets.filter(x => !x.master).map(x => x.sheet_id).filter(Boolean));""", 'breakdown sheets')
    t = R("""const sheets = DATA.sheets.map(s => `<option value="${esc(s.sheet_id)}\"""", """const sheets = DATA.sheets.filter(s => !s.master).map(s => `<option value="${esc(s.sheet_id)}\"""", 'edit sheets')
    css = """
/* v6.88 - the Show bar and what it lays on the master */
.mk.lyhide{display:none!important}
.mk.mkarea.off,.mk.mkarea.dim{opacity:.14}
.mk.mkly:not(.mkvms){color:#fff!important;font-weight:800}
.mk.ly-wb,.lysw.ly-wb{background:#e8641b!important;border-color:#b54708!important}
.mk.ly-gate,.lysw.ly-gate{background:#1f7a3a!important;border-color:#145228!important}
.mk.ly-ep,.lysw.ly-ep{background:#0e7c9a!important;border-color:#0a5a70!important}
.mk.ly-screen,.lysw.ly-screen{background:#1d3a8a!important;border-color:#142a66!important}
.mk.ly-gens,.lysw.ly-gens{background:#9b2c8f!important;border-color:#6e1f66!important}
.mk.ly-iface,.lysw.ly-iface{background:#b42318!important;border-color:#7a1a12!important}
.mk.ly-wcx,.lysw.ly-wcx{background:#7a4a12!important;border-color:#553208!important}
.lysw.ly-vms{background:#5b2a86}
.lysw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px;border:1px solid transparent}
</style>"""
    k = t.find('</style>'); t = t[:k] + css + t[k + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], True)
