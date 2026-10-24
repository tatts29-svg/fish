"""Author: Andrew Fisher. v11.07 - Servicing tab: no doubled-up area blocks; map labels carry the unit count; the chosen
area glows on the map.

Andrew, 22 Oct 2026: "In servicing can you remove these at the bottom its like your doubled up as these are already
mentioned up the top" (the area accordions under the map repeated the score, lamps and counts of the area cards above
them); "When we click on area the area on the map glows with area chosen. In brackets next to reference make sure we
have the qty number".

Three bounded changes to the live servicing block, each an exact-once replacement:
  1. areaHtml(): the lower accordion's summary is the area number and name only; inside it stays the job tally and the
     reference-by-reference tick times (the audit view). No score, lamps or counts repeated.
  2. SvcMap1099 markers: a cluster carries its unit count; the label reads "WC70 (1)", "T0024 (2)", "3 refs (5)".
  3. The chosen area's drawing outline glows in its own colour (CSS only; the module already marks it .selected).
Footer v11.06 -> v11.07. Tracker data, codes, card, progress maths and images untouched.

    python3 patch_v1107.py page.html      (in place, on the live v11.06 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '7c3f21cef9a5d161bcd1dbf317465707b7f93df9e70fa873c3f1505e32e94716'

def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.07 requires the live v11.06 page ' + BASE_SHA256)
    for guard in ('var SVC1067_DATA=', 'var SVC1067_CARD=', 'var SvcState ='):
        if guard not in text: raise ValueError('servicing block missing ' + guard)
    before = {k: text[text.index(k):text.index('\n', text.index(k))] for k in ('var SVC1067_DATA=', 'var SVC1067_CARD=')}
    # 1. the lower area accordions: number and name only on the summary
    text = rep(text,
        "    '<summary><span class=\"svc-n\">'+(a.n?esc(a.n):'–')+'</span><span class=\"svc-name\">'+esc(a.name)+'</span>'+\n"
        "    meterHtml(M,cfg,st,a.refs,g,'panel-area-'+a.n,a.name+' servicing','area')+\n"
        "    (done?'<span class=\"svc1102-finished\">Finished '+esc(wdHm(M.S,g.finished))+'</span>':'')+'</summary>'+",
        "    /* v11.07 (Andrew, 22 Oct 2026: \"remove these at the bottom its like your doubled up\"): the score, lamps and counts live on the area cards above; here only the name, with the reference-by-reference times inside */\n"
        "    '<summary><span class=\"svc-n\">'+(a.n?esc(a.n):'–')+'</span><span class=\"svc-name\">'+esc(a.name)+'</span><span class=\"svc1107-hint\">references and times</span>'+\n"
        "    (done?'<span class=\"svc1102-finished\">Finished '+esc(wdHm(M.S,g.finished))+'</span>':'')+'</summary>'+",
        'area accordion summary without the doubled score', 'page')
    # 2. marker clusters carry their unit count; labels show it in brackets
    text = rep(text,
        "      var refs=[],kinds=[],areas=[];group.forEach(function(p){if(refs.indexOf(p.ref)<0)refs.push(p.ref);if(areas.indexOf(p.area)<0)areas.push(p.area);p.spot.lines.forEach(function(l){if(kinds.indexOf(l.kind)<0)kinds.push(l.kind);});});\n"
        "      refs.sort();return {key:group.map(function(p){return p.spot.id;}).sort().join('|'),refs:refs,kinds:kinds,areas:areas,",
        "      var refs=[],kinds=[],areas=[],units=0;group.forEach(function(p){if(refs.indexOf(p.ref)<0)refs.push(p.ref);if(areas.indexOf(p.area)<0)areas.push(p.area);p.spot.lines.forEach(function(l){if(kinds.indexOf(l.kind)<0)kinds.push(l.kind);units+=Number(l.qty)||0;});});\n"
        "      refs.sort();return {key:group.map(function(p){return p.spot.id;}).sort().join('|'),refs:refs,kinds:kinds,areas:areas,units:units,",
        'marker cluster unit count', 'page')
    text = rep(text,
        "label=g.refs.length===1?g.refs[0]:g.refs.length+' refs';",
        "label=(g.refs.length===1?g.refs[0]:g.refs.length+' refs')+(g.units?' ('+g.units+')':'');   /* v11.07: Andrew, \"In brackets next to reference make sure we have the qty number\" */",
        'marker label with the unit count', 'page')
    # 3. the chosen area glows on the drawing
    text = rep(text,
        ".svc1100-region.selected .svc1100-region-line{stroke-width:calc(4px * var(--svc-stroke-scale,1));stroke-opacity:1}",
        ".svc1100-region.selected .svc1100-region-line{stroke-width:calc(4px * var(--svc-stroke-scale,1));stroke-opacity:1}"
        ".svc1100-region.selected .svc1100-region-glow{stroke:var(--area-color);stroke-width:calc(22px * var(--svc-stroke-scale,1));stroke-opacity:.55;animation:svc1100-area-breathe 2.2s ease-in-out infinite}"
        ".svc1100-region.selected .svc1100-region-fill{fill:var(--area-color);fill-opacity:.14}"
        "#svc1067 .svc-area>summary .svc1107-hint{font:600 .72rem/1.2 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;opacity:.62;margin-left:auto}",
        'selected area glow and the accordion hint', 'page')
    text = rep(text, "+' · v11.06'; /* v8.19 release922", "+' · v11.07'; /* v8.19 release922", 'release footer', 'page')
    for k, v in before.items():
        if text[text.index(k):text.index('\n', text.index(k))] != v: raise ValueError('tracker data or card changed: ' + k)
    return text

if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
