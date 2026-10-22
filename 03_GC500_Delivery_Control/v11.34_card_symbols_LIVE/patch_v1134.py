"""Author: Andrew Fisher. v11.34 - the crew card's plan draws each reference as a symbol of what it is, and a tap on a symbol takes
the map to that spot.

Andrew, 23 Oct 2026, on the live card: "I want a symbol of what it is like what we do in maps. And where it exactly it is on
map so the symbol when u zoom in takes you to where it is on the same area on map."

v11.34: every pin on the plan carries a symbol inside its disc, drawn from the record's lines for that reference: a toilet
cubicle (FWF, the standard unit), a block with doors (Toilet Block 6m, 16Pan Block), an accessible unit (cubicle with the
wheel), a trailer unit (cubicle on wheels), a sewer-connected unit (cubicle on its connection), a waste tank (the cylinder).
The disc colours stay what they were (white and haloed for the scanned one, green done, hi-vis to go). A tap on a symbol no
longer leaves the card: it zooms the plan to that reference (the Closer crop, centred on it) and names it under the plan with
its units and a Navigate link; a second tap on the same symbol navigates. Wider goes back and lets the focus go. The key
under the plan shows the symbols. Footer v11.33 -> v11.34. The crews see it once the trackers are published again.

    python3 patch_v1134.py page.html      (in place, on the live v11.33 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.31_clear_labels_LIVE'))
from rep import rep
import patch_v1131 as V31
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V31.E

def once(s, old, new, what):
    if s.count(old) != 1: raise ValueError(what + ': expected once, found ' + str(s.count(old)))
    return s.replace(old, new)

MAP_FNS = V31.MAP_FNS
MAP_FNS = once(MAP_FNS, "var zoom1129 = false;", """var zoom1129 = false;
var focus1134 = null; /* v11.34 - the reference a tap on the plan has zoomed to */
function kindOf1134(o) {
  /* what the reference is, from the record's lines: the first toilet line decides, a tank only when that is all there is */
  var lines = (o && o.lines) || [], best = 'fwf', rank = -1;
  var score = function (l) { var t = String(l.type || ''), k = String(l.kind || ''); if (/trailer/i.test(t)) return ['trailer', 6]; if (k === 'access') return ['access', 5]; if (k === 'block' || k === 'pan16') return ['block', 4]; if (k === 'sewer') return ['sewer', 3]; if (k === 'fwf' || k === 'pump_only') return ['fwf', 2]; if (k === 'tank') return ['tank', 1]; return ['fwf', 0]; };
  if (!lines.length) return 'fwf';
  rank = -1; lines.forEach(function (l) { var s = score(l); if (s[1] > rank) { rank = s[1]; best = s[0]; } });
  return best;
}
function symHtml1134(kind, x, y, rr) {
  /* the symbol inside the disc, in plan units: a cubicle for a toilet, a block with doors, the wheel for accessible, wheels for a trailer, a cylinder for a tank */
  var s = rr * 0.62, sw = Math.max(0.45, rr * 0.16), n = function (v) { return Math.round(v * 100) / 100; };
  var g = '<g class="sym sym-' + kind + '" fill="none" stroke-width="' + n(sw) + '" stroke-linecap="round" stroke-linejoin="round">';
  if (kind === 'tank') {
    g += '<rect x="' + n(x - s) + '" y="' + n(y - s * 0.55) + '" width="' + n(2 * s) + '" height="' + n(1.1 * s) + '" rx="' + n(0.5 * s) + '"/><path d="M' + n(x - s * 0.5) + ' ' + n(y - s * 0.55) + 'v' + n(1.1 * s) + 'M' + n(x + s * 0.5) + ' ' + n(y - s * 0.55) + 'v' + n(1.1 * s) + '"/>';
  } else if (kind === 'block') {
    g += '<rect x="' + n(x - s) + '" y="' + n(y - s * 0.62) + '" width="' + n(2 * s) + '" height="' + n(1.24 * s) + '" rx="' + n(0.1 * s) + '"/><path d="M' + n(x - s / 3) + ' ' + n(y - s * 0.62) + 'v' + n(1.24 * s) + 'M' + n(x + s / 3) + ' ' + n(y - s * 0.62) + 'v' + n(1.24 * s) + '"/>';
  } else {
    var top = y - s * 0.78, hgt = 1.5 * s;
    if (kind === 'trailer') { top = y - s * 0.95; hgt = 1.35 * s; }
    g += '<rect x="' + n(x - s * 0.62) + '" y="' + n(top) + '" width="' + n(1.24 * s) + '" height="' + n(hgt) + '" rx="' + n(0.12 * s) + '"/><path d="M' + n(x + s * 0.12) + ' ' + n(top) + 'v' + n(hgt) + '"/><circle class="dot" cx="' + n(x - s * 0.18) + '" cy="' + n(top + hgt * 0.52) + '" r="' + n(Math.max(0.3, 0.11 * s)) + '"/>';
    if (kind === 'access') g += '<circle cx="' + n(x + s * 0.62) + '" cy="' + n(y + s * 0.62) + '" r="' + n(0.34 * s) + '"/>';
    if (kind === 'trailer') g += '<circle cx="' + n(x - s * 0.38) + '" cy="' + n(top + hgt + 0.22 * s) + '" r="' + n(0.2 * s) + '"/><circle cx="' + n(x + s * 0.38) + '" cy="' + n(top + hgt + 0.22 * s) + '" r="' + n(0.2 * s) + '"/>';
    if (kind === 'sewer') g += '<path d="M' + n(x - s * 0.62) + ' ' + n(top + hgt + 0.2 * s) + 'h' + n(1.24 * s) + '"/>';
  }
  return g + '</g>';
}
function symKey1134() {
  var row = [['fwf', 'toilet'], ['block', 'block'], ['access', 'accessible'], ['trailer', 'trailer'], ['sewer', 'sewer'], ['tank', 'tank']];
  return '<span class="lg hint symkey">' + row.map(function (k) { return '<svg viewBox="0 0 20 20" class="skey" aria-hidden="true"><circle cx="10" cy="10" r="9" class="disc"/>' + symHtml1134(k[0], 10, 10, 9) + '</svg>' + k[1]; }).join(' ') + '</span>';
}
""", 'symbols')
MAP_FNS = once(MAP_FNS, "map(function (o) { return { r: o, p: planPx(o.pin), done: refStats(o, day, st).done, miss: missingTasks(o, day, st).length }; });", "map(function (o) { return { r: o, p: planPx(o.pin), done: refStats(o, day, st).done, miss: missingTasks(o, day, st).length, kind: kindOf1134(o) }; });", 'kind per pin')
MAP_FNS = once(MAP_FNS, "  if (zoom1129 && r.pin) { var mp = planPx(r.pin), near", "  var fref1134 = focus1134 && REFS[focus1134] && REFS[focus1134].pin ? REFS[focus1134] : null;\n  if (zoom1129 && (fref1134 || r.pin)) { var mp = planPx((fref1134 || r).pin), near", 'closer crop centred on the focus')
MAP_FNS = once(MAP_FNS, "var rad = w / 44, fs = w / 24,", "var rad = w / 38, fs = w / 24,", 'bigger discs for the symbols')
MAP_FNS = once(MAP_FNS, "h += '<a class=\"' + cls + '\" href=\"https://www.google.com/maps/dir/?api=1&amp;destination=' + Number(o.r.pin[0]) + ',' + Number(o.r.pin[1]) + '\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"' + esc(o.r.ref + (me ? ', this one' : o.done ? ', done' : ', ' + o.miss + ' to go') + ', navigate') + '\">' +",
               "h += '<a class=\"' + cls + (focus1134 === o.r.ref ? ' focus' : '') + '\" data-ref=\"' + esc(o.r.ref) + '\" href=\"https://www.google.com/maps/dir/?api=1&amp;destination=' + Number(o.r.pin[0]) + ',' + Number(o.r.pin[1]) + '\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"' + esc(o.r.ref + (me ? ', this one' : o.done ? ', done' : ', ' + o.miss + ' to go') + (focus1134 === o.r.ref ? ', tap again to navigate' : ', tap to zoom to it')) + '\">' +", 'pin anchor with its reference')
MAP_FNS = once(MAP_FNS, "'<circle class=\"pin\" cx=\"' + x + '\" cy=\"' + y + '\" r=\"' + rr + '\"/>' +", "'<circle class=\"pin\" cx=\"' + x + '\" cy=\"' + y + '\" r=\"' + rr + '\"/>' + symHtml1134(o.kind, o.p[0], o.p[1], rr) +", 'symbol in the disc')
MAP_FNS = once(MAP_FNS, "<span class=\"lg hint\">tap a pin to navigate</span>' +", "<span class=\"lg hint\">tap a symbol to zoom to it, again to navigate</span>' + symKey1134() + (fref1134 ? '<span class=\"lg focus\">' + esc(fref1134.ref) + ' · ' + esc((fref1134.lines || []).map(function (l) { return l.label || l.type || ''; }).filter(Boolean).join(', ') || fref1134.where || '') + ' <a class=\"navlink\" href=\"https://www.google.com/maps/dir/?api=1&amp;destination=' + Number(fref1134.pin[0]) + ',' + Number(fref1134.pin[1]) + '\" target=\"_blank\" rel=\"noopener noreferrer\">Navigate ↗</a></span>' : '') +", 'foot: key and the focused reference')
MAP_FNS = once(MAP_FNS, "document.addEventListener('click', function (ev) { if (ev.target.closest('[data-zoom]')) { zoom1129 = !zoom1129; render(); } });",
               "document.addEventListener('click', function (ev) { if (ev.target.closest('[data-zoom]')) { zoom1129 = !zoom1129; if (!zoom1129) focus1134 = null; render(); } });\n"
               "document.addEventListener('click', function (ev) {\n  var a = ev.target.closest('.amap-svg a[data-ref]'); if (!a) return;\n  var ref = a.getAttribute('data-ref');\n  if (focus1134 === ref && zoom1129) return; /* second tap: the link navigates */\n  ev.preventDefault(); focus1134 = ref; zoom1129 = true; render();\n});", 'tap to zoom, tap again to navigate')
MAP_FNS = once(MAP_FNS, "window.SvcMap1129 = { planPx: planPx, setLoc: function (l) { loc1129 = l; }, setZoom: function (z) { zoom1129 = !!z; },", "window.SvcMap1129 = { planPx: planPx, setLoc: function (l) { loc1129 = l; }, setZoom: function (z) { zoom1129 = !!z; if (!z) focus1134 = null; }, setFocus: function (ref) { focus1134 = ref || null; }, focus: function () { return focus1134; }, kindOf: kindOf1134,", 'map handle')
CSS_ADD = (".amap-svg .sym{stroke:#0e151c;pointer-events:none}.amap-svg .sym .dot{fill:#0e151c;stroke:none}.amap-svg .me .sym{stroke:#7a3a0c}.amap-svg .me .sym .dot{fill:#7a3a0c}"
           ".amap-svg a.focus .pin{stroke:#fff;stroke-width:2}.amap-svg .done .sym{stroke:#06281c}.amap-svg .done .sym .dot{fill:#06281c}"
           ".amap-foot .symkey{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;flex-basis:100%;font-size:11.5px}.amap-foot .skey{width:16px;height:16px;vertical-align:-3px;margin-right:3px}.amap-foot .skey .disc{fill:#ffb347;stroke:#0e151c;stroke-width:1}.amap-foot .skey .sym{stroke:#0e151c;stroke-width:1.6}.amap-foot .skey .sym .dot{fill:#0e151c;stroke:none}"
           ".amap-foot .lg.focus{flex-basis:100%;color:var(--ink);font-weight:700}.amap-foot .lg.focus::before{background:#fff;box-shadow:0 0 0 2px #ff8a32}.amap-foot .navlink{color:#ffd08a;font-weight:800;text-decoration:underline;margin-left:6px}\n")
CARD_CSS = V31.CARD_CSS + CSS_ADD


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.34 requires the live v11.33 page ' + BASE_SHA256)
    if 'kindOf1134' in text: raise ValueError('v11.34 already applied')
    text = rep(text, E(V31.MAP_FNS), E(MAP_FNS), 'card: symbols on the plan, tap to zoom', 'page')
    text = rep(text, E(V31.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.33'; /* v8.19 release922", "+' · v11.34'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    for needle, n in [('function kindOf1134', 1), ('function symHtml1134', 1), ('symHtml1134(o.kind, o.p[0], o.p[1], rr)', 1), ("' + symKey1134() + ", 1), ("closest('.amap-svg a[data-ref]')", 1), ('setFocus: function (ref)', 1), ('tap a symbol to zoom to it, again to navigate', 1)]:
        if h.count(needle) != n: raise ValueError('the crew card template did not take v11.34 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if 'tap a pin to navigate' in h or h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1134 applied: symbols of what each reference is on the crew card plan, tap to zoom to it, tap again to navigate; footer v11.33 -> v11.34')
