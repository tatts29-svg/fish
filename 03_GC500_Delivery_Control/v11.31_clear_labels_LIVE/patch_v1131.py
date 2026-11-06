"""Author: Andrew Fisher. v11.31 - every label on the plan gets a clear spot; a Closer view around the scanned reference.

On the v11.30 card the plan draws, but where references sit close together (around PG01 in Area 1: WC17, WC73, T0176,
PG03, PG05) their labels ran into each other on a phone. Andrew's standard for the card: "clear as day".

v11.31: labels are laid out, the scanned reference first: above its pin when that is free, else beside or below it, else
further out with a short leader line to the pin; the scanned reference's label a touch larger, the others a touch
smaller. A Closer button crops the plan to the references within about 48 plan pixels (a hundred-odd metres on the
sheet) of the scanned one, so a tight cluster spreads out; Wider goes back to the whole area. Footer v11.30 -> v11.31.
The crews see it once the trackers are published again.

    python3 patch_v1131.py page.html      (in place, on the live v11.30 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.30_plan_blob_LIVE'))
from rep import rep
import patch_v1130 as V30
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V30.E

def once(s, old, new, what):
    if s.count(old) != 1: raise ValueError(what + ': expected once, found ' + str(s.count(old)))
    return s.replace(old, new)

MAP_FNS = V30.MAP_FNS
MAP_FNS = once(MAP_FNS, "var loc1129 = null;\n", """var loc1129 = null;
var zoom1129 = false; /* v11.31 - Closer: the plan cropped to the references near the scanned one */
function layoutLabels1131(pts, r, rad, fs, vx, vy, w, hgt) {
  /* v11.31 - each label gets a clear spot: above its pin when that is free, else beside or below it, else further out with a
     leader line; the scanned reference is placed first. Boxes already taken: every pin, then each label as it is placed. */
  var boxes = pts.map(function (o) { var rr = (o.r === r ? rad * 1.3 : rad) + 0.6; return [o.p[0] - rr, o.p[1] - rr, o.p[0] + rr, o.p[1] + rr]; });
  var pen = function (b) { var p = 0; for (var i = 0; i < boxes.length; i++) { var c = boxes[i], ox = Math.min(b[2], c[2]) - Math.max(b[0], c[0]), oy = Math.min(b[3], c[3]) - Math.max(b[1], c[1]); if (ox > 0 && oy > 0) p += ox * oy; } if (b[0] < vx || b[1] < vy || b[2] > vx + w || b[3] > vy + hgt) p += 1e4; return p; };
  var dirs = [-90, -67.5, -112.5, -45, -135, -22.5, -157.5, 0, 180, 22.5, 157.5, 45, 135, 67.5, 112.5, 90].map(function (deg) { var t = deg * Math.PI / 180; return [Math.cos(t), Math.sin(t)]; }); /* up first, then around, down last */
  pts.slice().sort(function (p, q) { return (q.r === r) - (p.r === r); }).forEach(function (o) {
    var me = o.r === r, size = me ? fs * 1.05 : fs * 0.88, tw = size * 0.72 * o.r.ref.length + size * 0.5, th = size * 1.2, rr = me ? rad * 1.3 : rad, best = null;
    for (var ring = 0; ring < 5 && !(best && best.pen === 0); ring++) {
      for (var k = 0; k < dirs.length; k++) {
        var ux = dirs[k][0], uy = dirs[k][1], gap = size * 0.25 + ring * size * 1.3;
        var cx = o.p[0] + ux * (rr + gap + tw / 2 * Math.abs(ux)), cy = o.p[1] + uy * (rr + gap + th / 2 * Math.abs(uy));
        var b = [cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2], p = pen(b);
        if (!best || p < best.pen) best = { b: b, pen: p, cx: cx, cy: cy, ring: ring, ux: ux, uy: uy };
        if (p === 0) break;
      }
    }
    o.lx = best.cx; o.ly = best.cy + size * 0.36; o.fs = size;
    o.lead = best.ring > 0 ? [o.p[0] + best.ux * rr, o.p[1] + best.uy * rr, best.cx - best.ux * Math.abs(best.ux) * tw / 2, best.cy - best.uy * Math.abs(best.uy) * th / 2] : null;
    boxes.push(best.b);
  });
}
""", 'label layout')
MAP_FNS = once(MAP_FNS, "  if (!pts.length) return '';\n  spread1129(pts);\n", """  /* v11.31 - a reference whose record pin falls off the sheet (WC85 at the Coates Compound, Seaway) gets a line instead of an empty crop; other off-sheet pins are left out */
  var onPlan1131 = function (o) { return o.p[0] >= 0 && o.p[0] <= PLAN1129.w && o.p[1] >= 0 && o.p[1] <= PLAN1129.h; };
  var mine1131 = pts.filter(function (o) { return o.r === r; })[0];
  if (mine1131 && !onPlan1131(mine1131)) return '<section class="card amap" aria-labelledby="amh"><h3 id="amh">' + esc(areaLabel(a)) + ' · on the plan</h3><p class="amap-off">' + esc(r.ref) + ' sits off the site plan. Navigate, above, takes you to its pin.</p></section>';
  pts = pts.filter(onPlan1131);
  if (!pts.length) return '';
  spread1129(pts);
""", 'off-plan reference')
MAP_FNS = once(MAP_FNS, "  spread1129(pts);\n", "  spread1129(pts);\n  if (zoom1129 && r.pin) { var mp = planPx(r.pin), near = pts.filter(function (o) { return Math.hypot(o.p[0] - mp[0], o.p[1] - mp[1]) <= 48; }); if (near.length && near.length < pts.length) pts = near; }\n", 'closer crop')
MAP_FNS = once(MAP_FNS, "var w = Math.max(x1 - x0 + 2 * pad, 230), hgt = Math.max(y1 - y0 + 2 * pad, 140);", "var minW = zoom1129 ? 150 : 230, w = Math.max(x1 - x0 + 2 * pad, minW), hgt = Math.max(y1 - y0 + 2 * pad, minW * 0.6);", 'crop minimum')
MAP_FNS = once(MAP_FNS, "  pts.sort(function (p, q) { return (p.r === r) - (q.r === r); });\n", "  pts.sort(function (p, q) { return (p.r === r) - (q.r === r); });\n  layoutLabels1131(pts, r, rad, fs, vx, vy, w, hgt);\n", 'layout call')
MAP_FNS = once(MAP_FNS, "'<text class=\"lbl\" x=\"' + x + '\" y=\"' + f1(o.p[1] - rr - fs * 0.35) + '\" font-size=\"' + f1(fs) + '\" text-anchor=\"middle\">' + esc(o.r.ref) + '</text></a>';",
               "(o.lead ? '<line class=\"lead\" x1=\"' + f1(o.lead[0]) + '\" y1=\"' + f1(o.lead[1]) + '\" x2=\"' + f1(o.lead[2]) + '\" y2=\"' + f1(o.lead[3]) + '\"/>' : '') + '<text class=\"lbl' + (me ? ' melbl' : '') + '\" x=\"' + f1(o.lx) + '\" y=\"' + f1(o.ly) + '\" font-size=\"' + f1(o.fs) + '\" text-anchor=\"middle\">' + esc(o.r.ref) + '</text></a>';", 'label draw')
MAP_FNS = once(MAP_FNS, "'<button class=\"bbtn sm\" type=\"button\" data-locate=\"1\">Where am I</button>') + '</div></section>';", "'<button class=\"bbtn sm\" type=\"button\" data-locate=\"1\">Where am I</button>') + '<button class=\"bbtn sm zoom\" type=\"button\" data-zoom=\"1\" aria-pressed=\"' + (zoom1129 ? 'true' : 'false') + '\">' + (zoom1129 ? 'Wider' : 'Closer') + '</button></div></section>';", 'closer button')
MAP_FNS = once(MAP_FNS, "document.addEventListener('click', function (ev) {\n  var b = ev.target.closest('[data-locate]'); if (!b) return;", "document.addEventListener('click', function (ev) { if (ev.target.closest('[data-zoom]')) { zoom1129 = !zoom1129; render(); } });\ndocument.addEventListener('click', function (ev) {\n  var b = ev.target.closest('[data-locate]'); if (!b) return;", 'closer listener')
MAP_FNS = once(MAP_FNS, "window.SvcMap1129 = { planPx: planPx, setLoc: function (l) { loc1129 = l; },", "window.SvcMap1129 = { planPx: planPx, setLoc: function (l) { loc1129 = l; }, setZoom: function (z) { zoom1129 = !!z; }, zoom: function () { return zoom1129; },", 'map handle')
CSS_ADD = ".amap-off{margin:0;font-size:13.5px;line-height:1.4;color:var(--mute)}.amap-svg .lead{stroke:rgba(255,255,255,.62);stroke-width:.9;stroke-linecap:round}.amap-svg .melbl{stroke-width:3.6px;letter-spacing:.02em}.amap-foot .zoom{margin-left:0}.amap-foot .zoom[aria-pressed=true]{border-color:#ffb347;color:#ffd08a}\n"
CARD_CSS = V30.CARD_CSS + CSS_ADD


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.31 requires the live v11.30 page ' + BASE_SHA256)
    if 'layoutLabels1131' in text: raise ValueError('v11.31 already applied')
    text = rep(text, E(V30.MAP_FNS), E(MAP_FNS), 'card: labels laid out clear of each other; Closer view', 'page')
    text = rep(text, E(V30.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.30'; /* v8.19 release922", "+' · v11.31'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    for needle, n in [('function layoutLabels1131', 1), ('sits off the site plan', 1), ('pts = pts.filter(onPlan1131);', 1), ('layoutLabels1131(pts, r, rad, fs, vx, vy, w, hgt);', 1), ('data-zoom', 2), ("'Wider' : 'Closer'", 1), ('class="lead"', 1), ('setZoom: function (z)', 1), ('var zoom1129 = false;', 1)]:
        if h.count(needle) != n: raise ValueError('the crew card template did not take v11.31 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if "f1(o.p[1] - rr - fs * 0.35)" in h or h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1131 applied: labels laid out clear of each other with leaders; Closer / Wider view; footer v11.30 -> v11.31')
