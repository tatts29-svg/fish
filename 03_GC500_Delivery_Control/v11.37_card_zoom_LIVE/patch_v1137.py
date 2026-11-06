"""Author: Andrew Fisher. v11.37 - the crew card's plan zooms: pinch and drag on the plan, double-tap, + and -, and the sharp
tiles of the Map explorer's drawing load in as you zoom.

Andrew, 23 Oct 2026, with a screenshot of the browser's own zoom on the card: "Also servicing when u zoom in takes u to the
symbol on the map. See attached this is all i can see. We need to be able to zoom in 16000% like our other maps".

v11.37: the plan on the card is a view the crew can move: one finger drags, two fingers pinch, a double tap zooms in on that
spot, the mouse wheel zooms on a desktop; + / - / Fit buttons under the plan. Pins, symbols and labels keep their size on the
screen whatever the zoom, and the labels are laid out again when the gesture ends. As the view goes in past what the sheet
overview can show, the card fetches the explorer's drawing tiles for the view (the same transparent raster pyramid the Map
explorer draws, levels 0 to 3: 1 to 8 device pixels per sheet point, about 16 times the overview) by byte range from the
page's own origin and draws them over the overview; they are kept for the session. The view is held while the card
redraws, and a tap on a symbol still zooms to it. Footer v11.36 -> v11.37. The crews see it once the trackers are
published again.

    python3 patch_v1137.py page.html      (in place, on the live v11.36 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.34_card_symbols_LIVE'))
from rep import rep
import patch_v1134 as V34
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V34.E
MANIFEST = json.loads((HERE / 'tiles1137_manifest.json').read_text(encoding='utf-8'))

def once(s, old, new, what):
    if s.count(old) != 1: raise ValueError(what + ': expected once, found ' + str(s.count(old)))
    return s.replace(old, new)

MAP_FNS = V34.MAP_FNS
MAP_FNS = once(MAP_FNS, "var focus1134 = null;", """var focus1134 = null;
/* v11.37 - the view the crew has moved to (plan px): null = the computed crop */
var view1137 = null;
var TILES1137 = """ + json.dumps(MANIFEST, separators=(',', ':')) + """;
var tileCache1137 = {}, tileBusy1137 = 0, tileQueue1137 = [], tileTimer1137 = null;
function tileLevel1137(w, svgEl) {
  /* device px per sheet pt the screen asks for at this view: the sheet is 2 pt per plan px */
  var cssW = svgEl && svgEl.clientWidth ? svgEl.clientWidth : 360, dpr = window.devicePixelRatio || 1;
  var pxPerPt = cssW * dpr / (w * 2), L = Math.round(Math.log(pxPerPt) / Math.LN2);
  return Math.max(0, Math.min(3, L));
}
function tilesFor1137(vx, vy, w, hgt, L) {
  var lv = TILES1137.levels.filter(function (l) { return l.L === L; })[0]; if (!lv) return [];
  var s = lv.scale, span = TILES1137.tile / s / 2; /* plan px per tile */
  var x0 = Math.max(0, Math.floor(vx / span)), x1 = Math.min(lv.nx - 1, Math.floor((vx + w) / span)), y0 = Math.max(0, Math.floor(vy / span)), y1 = Math.min(lv.ny - 1, Math.floor((vy + hgt) / span)), out = [];
  for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) { var k = tx + '_' + ty, e = lv.tiles[k]; if (e) out.push({key: L + '/' + k, L: L, file: lv.file, off: e[0], len: e[1], x: tx * span, y: ty * span, span: span}); }
  return out;
}
function tileFetch1137(t) {
  if (tileCache1137[t.key] !== undefined) return;
  tileCache1137[t.key] = null; tileQueue1137.push(t); tilePump1137();
}
function tilePump1137() {
  while (tileBusy1137 < 4 && tileQueue1137.length) {
    var t = tileQueue1137.shift(); tileBusy1137++;
    (function (t) {
      fetch(TILES1137.base + t.file, { headers: { Range: 'bytes=' + t.off + '-' + (t.off + t.len - 1) }, credentials: 'same-origin' })
        .then(function (r) { if (r.status !== 206 && r.status !== 200) throw new Error('tile ' + r.status); return r.arrayBuffer(); })
        .then(function (buf) { if (buf.byteLength !== t.len) throw new Error('tile short'); tileCache1137[t.key] = URL.createObjectURL(new Blob([buf], { type: 'image/webp' })); tileBusy1137--; tilePlace1137(); tilePump1137(); })
        .catch(function () { delete tileCache1137[t.key]; tileBusy1137--; tilePump1137(); });
    })(t);
  }
}
function tilePlace1137() {
  /* put the tiles that have arrived into the plan without a full redraw */
  var svg = document.querySelector('.amap-svg'), g = svg && svg.querySelector('g.tiles'); if (!g) return;
  var vb = svg.getAttribute('viewBox').split(' ').map(Number), L = tileLevel1137(vb[2], svg);
  g.innerHTML = tilesHtml1137(vb[0], vb[1], vb[2], vb[3], L, svg);
}
function tilesHtml1137(vx, vy, w, hgt, L, svgEl) {
  var want = tilesFor1137(vx, vy, w, hgt, L), h = '';
  want.forEach(function (t) { var u = tileCache1137[t.key]; if (u) h += '<image href="' + u + '" x="' + t.x + '" y="' + t.y + '" width="' + t.span + '" height="' + t.span + '" preserveAspectRatio="none"/>'; else if (u === undefined && navigator.onLine !== false) tileFetch1137(t); });
  return h;
}
function tilesWanted1137() { if (tileTimer1137) clearTimeout(tileTimer1137); tileTimer1137 = setTimeout(tilePlace1137, 200); }
function setView1137(cx, cy, w) {
  w = Math.max(14, Math.min(PLAN1129.w, w)); var hgt = w * 0.72;
  cx = Math.max(w / 2, Math.min(PLAN1129.w - w / 2, cx)); cy = Math.max(hgt / 2, Math.min(PLAN1129.h - hgt / 2, cy));
  view1137 = { cx: cx, cy: cy, w: w };
}
function applyView1137(svg) {
  if (!svg || !view1137) return; var w = view1137.w, hgt = w * 0.72, vx = view1137.cx - w / 2, vy = view1137.cy - hgt / 2;
  svg.setAttribute('viewBox', [vx, vy, w, hgt].map(function (n) { return Math.round(n * 100) / 100; }).join(' '));
  var veil = svg.querySelector('rect.veil'); if (veil) { veil.setAttribute('x', vx); veil.setAttribute('y', vy); veil.setAttribute('width', w); veil.setAttribute('height', hgt); }
  tilesWanted1137();
}
(function gestures1137() {
  var st = null, moved = false, lastTap = 0;
  function svgOf(ev) { var t = ev.target; return t && t.closest ? t.closest('.amap-svg') : null; }
  function viewOf(svg) { if (view1137) return view1137; var vb = svg.getAttribute('viewBox').split(' ').map(Number); return { cx: vb[0] + vb[2] / 2, cy: vb[1] + vb[3] / 2, w: vb[2] }; }
  function unit(svg) { var vb = svg.getAttribute('viewBox').split(' ').map(Number); return vb[2] / Math.max(1, svg.clientWidth); } /* plan px per css px */
  document.addEventListener('touchstart', function (ev) {
    var svg = svgOf(ev); if (!svg) return; var v = viewOf(svg), u = unit(svg);
    if (ev.touches.length === 1) { var t = ev.touches[0]; st = { svg: svg, mode: 'pan', x: t.clientX, y: t.clientY, v: v, u: u }; moved = false; }
    else if (ev.touches.length === 2) { var a = ev.touches[0], b = ev.touches[1]; st = { svg: svg, mode: 'pinch', d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2, v: v, u: u, rect: svg.getBoundingClientRect() }; moved = true; ev.preventDefault(); }
  }, { passive: false });
  document.addEventListener('touchmove', function (ev) {
    if (!st) return; ev.preventDefault();
    if (st.mode === 'pan' && ev.touches.length === 1) { var t = ev.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y; if (Math.hypot(dx, dy) > 4) moved = true; setView1137(st.v.cx - dx * st.u, st.v.cy - dy * st.u, st.v.w); applyView1137(st.svg); }
    else if (st.mode === 'pinch' && ev.touches.length === 2) { var a = ev.touches[0], b = ev.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), k = st.d / Math.max(1, d);
      var px = st.v.cx - st.v.w / 2 + (st.mx - st.rect.left) * st.u, py = st.v.cy - st.v.w * 0.72 / 2 + (st.my - st.rect.top) * st.u; /* the plan point under the pinch stays put */
      var w2 = st.v.w * k, u2 = st.u * k; setView1137(px - (st.mx - st.rect.left) * u2 + w2 / 2, py - (st.my - st.rect.top) * u2 + w2 * 0.72 / 2, w2); applyView1137(st.svg); }
  }, { passive: false });
  document.addEventListener('touchend', function (ev) {
    if (!st) return; var svg = st.svg, was = st; st = null;
    if (ev.touches.length) return;
    if (!moved) { var t0 = Date.now(); if (t0 - lastTap < 350 && ev.changedTouches && ev.changedTouches.length) { var t = ev.changedTouches[0], rect = svg.getBoundingClientRect(), v = viewOf(svg), u = unit(svg); var px = v.cx - v.w / 2 + (t.clientX - rect.left) * u, py = v.cy - v.w * 0.72 / 2 + (t.clientY - rect.top) * u; setView1137(px, py, v.w / 2); render(); ev.preventDefault(); lastTap = 0; } else lastTap = t0; return; }
    render();
  }, { passive: false });
  document.addEventListener('wheel', function (ev) {
    var svg = svgOf(ev); if (!svg) return; ev.preventDefault(); var v = viewOf(svg), u = unit(svg), rect = svg.getBoundingClientRect(), k = ev.deltaY > 0 ? 1.25 : 0.8;
    var px = v.cx - v.w / 2 + (ev.clientX - rect.left) * u, py = v.cy - v.w * 0.72 / 2 + (ev.clientY - rect.top) * u, w2 = v.w * k, u2 = u * k;
    setView1137(px - (ev.clientX - rect.left) * u2 + w2 / 2, py - (ev.clientY - rect.top) * u2 + w2 * 0.72 / 2, w2); applyView1137(svg); clearTimeout(st && st.rt); render();
  }, { passive: false });
  var drag = null;
  document.addEventListener('mousedown', function (ev) { var svg = svgOf(ev); if (!svg || ev.button !== 0) return; drag = { svg: svg, x: ev.clientX, y: ev.clientY, v: viewOf(svg), u: unit(svg), moved: false }; });
  document.addEventListener('mousemove', function (ev) { if (!drag) return; var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (Math.hypot(dx, dy) > 3) drag.moved = true; if (drag.moved) { setView1137(drag.v.cx - dx * drag.u, drag.v.cy - dy * drag.u, drag.v.w); applyView1137(drag.svg); } });
  document.addEventListener('mouseup', function () { if (!drag) return; var m = drag.moved; drag = null; if (m) render(); });
  document.addEventListener('click', function (ev) { var b = ev.target.closest('[data-vz]'); if (!b) return; var svg = document.querySelector('.amap-svg'); if (!svg) return; var v = viewOf(svg);
    if (b.getAttribute('data-vz') === 'fit') { view1137 = null; } else { setView1137(v.cx, v.cy, v.w * (b.getAttribute('data-vz') === 'in' ? 0.5 : 2)); } render(); }, true);
})();
""", 'view, tiles, gestures')
MAP_FNS = once(MAP_FNS, "w = Math.max(x1 - x0 + 2 * pad, minW), hgt = Math.max(y1 - y0 + 2 * pad, minW * 0.6);", "w = Math.max(x1 - x0 + 2 * pad, minW), hgt = Math.max(y1 - y0 + 2 * pad, minW * 0.6);\n  if (view1137) { w = view1137.w; hgt = w * 0.72; }", 'the moved view sets the crop size')
MAP_FNS = once(MAP_FNS, "  var vx = Math.max(0, Math.min((x0 + x1) / 2 - w / 2, PLAN1129.w - w)), vy = Math.max(0, Math.min((y0 + y1) / 2 - hgt / 2, PLAN1129.h - hgt));",
               "  var vx = Math.max(0, Math.min((x0 + x1) / 2 - w / 2, PLAN1129.w - w)), vy = Math.max(0, Math.min((y0 + y1) / 2 - hgt / 2, PLAN1129.h - hgt));\n  if (view1137) { vx = Math.max(0, Math.min(view1137.cx - w / 2, PLAN1129.w - w)); vy = Math.max(0, Math.min(view1137.cy - hgt / 2, PLAN1129.h - hgt)); pts = pts.filter(function (o) { return o.r === r || (o.p[0] >= vx - w * 0.3 && o.p[0] <= vx + w * 1.3 && o.p[1] >= vy - hgt * 0.3 && o.p[1] <= vy + hgt * 1.3); }); if (!pts.length) pts = [mine1131 || a.refs.filter(function (o) { return o.pin; }).map(function (o) { return { r: o, p: planPx(o.pin), done: refStats(o, day, st).done, miss: missingTasks(o, day, st).length, kind: kindOf1134(o) }; })[0]]; }", 'the moved view sets the crop place')
MAP_FNS = once(MAP_FNS, "' + (PLAN1129.src ? '<image href=\"' + PLAN1129.src + '\" x=\"0\" y=\"0\" width=\"' + PLAN1129.w + '\" height=\"' + PLAN1129.h + '\" preserveAspectRatio=\"none\"/>' : '') + '<rect x=\"' + f1(vx) + '\" y=\"' + f1(vy) + '\" width=\"' + f1(w) + '\" height=\"' + f1(hgt) + '\" fill=\"rgba(6,10,14,.22)\"/>'",
               "' + (PLAN1129.src ? '<image href=\"' + PLAN1129.src + '\" x=\"0\" y=\"0\" width=\"' + PLAN1129.w + '\" height=\"' + PLAN1129.h + '\" preserveAspectRatio=\"none\"/>' : '') + '<g class=\"tiles\">' + tilesHtml1137(vx, vy, w, hgt, tileLevel1137(w, document.querySelector('.amap-svg')), null) + '</g><rect class=\"veil\" x=\"' + f1(vx) + '\" y=\"' + f1(vy) + '\" width=\"' + f1(w) + '\" height=\"' + f1(hgt) + '\" fill=\"rgba(6,10,14,.22)\"/>'", 'tiles over the overview, under the veil')
MAP_FNS = once(MAP_FNS, "'<button class=\"bbtn sm zoom\" type=\"button\" data-zoom=\"1\"", "'<span class=\"vz\"><button class=\"bbtn sm\" type=\"button\" data-vz=\"out\" aria-label=\"Zoom out\">−</button><button class=\"bbtn sm\" type=\"button\" data-vz=\"in\" aria-label=\"Zoom in\">+</button>' + (view1137 ? '<button class=\"bbtn sm\" type=\"button\" data-vz=\"fit\">Fit</button>' : '') + '</span><button class=\"bbtn sm zoom\" type=\"button\" data-zoom=\"1\"", 'zoom buttons')
MAP_FNS = once(MAP_FNS, "document.addEventListener('click', function (ev) { if (ev.target.closest('[data-zoom]')) { zoom1129 = !zoom1129; if (!zoom1129) focus1134 = null; render(); } });", "document.addEventListener('click', function (ev) { if (ev.target.closest('[data-zoom]')) { zoom1129 = !zoom1129; view1137 = null; if (!zoom1129) focus1134 = null; render(); } });", 'Closer and Wider drop the moved view')
MAP_FNS = once(MAP_FNS, "  ev.preventDefault(); focus1134 = ref; zoom1129 = true; render();\n});", "  ev.preventDefault(); focus1134 = ref; zoom1129 = true; view1137 = null; render();\n});", 'a tap on a symbol drops the moved view')
MAP_FNS = once(MAP_FNS, "setFocus: function (ref) { focus1134 = ref || null; },", "setFocus: function (ref) { focus1134 = ref || null; }, setView: function (cx, cy, w) { if (cx == null) view1137 = null; else setView1137(cx, cy, w); }, view: function () { return view1137; }, tiles: function () { return { cached: Object.keys(tileCache1137).filter(function (k) { return tileCache1137[k]; }).length, pending: Object.keys(tileCache1137).filter(function (k) { return tileCache1137[k] === null; }).length, level: function (w) { return tileLevel1137(w, document.querySelector('.amap-svg')); }, wanted: tilesFor1137 }; },", 'map handle')
MAP_FNS = once(MAP_FNS, "    h += '<a class=\"' + cls + (focus1134 === o.r.ref ? ' focus' : '') + '\"", "    h += '<a class=\"' + cls + (focus1134 === o.r.ref ? ' focus' : '') + '\"", 'anchor unchanged')
CSS_ADD = ".amap-svg{touch-action:none;cursor:grab}.amap-svg:active{cursor:grabbing}.amap-foot .vz{display:inline-flex;gap:6px;margin-left:auto}.amap-foot .vz .bbtn.sm{min-width:40px;padding:4px 8px;font-size:18px;line-height:1}.amap-foot .vz+.zoom{margin-left:6px}\n"
CARD_CSS = V34.CARD_CSS + CSS_ADD


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.37 requires the live v11.36 page ' + BASE_SHA256)
    if 'view1137' in text: raise ValueError('v11.37 already applied')
    text = rep(text, E(V34.MAP_FNS), E(MAP_FNS), 'card: the plan zooms, tiles load in', 'page')
    text = rep(text, E(V34.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.36'; /* v8.19 release922", "+' · v11.37'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    for needle, n in [('function setView1137', 1), ('function tilesFor1137', 1), ("fetch(TILES1137.base + t.file", 1), ('<g class=\"tiles\">', 1), ('data-vz=\"in\"', 1), ('setView: function (cx, cy, w)', 1), ('var TILES1137 = {', 1)]:
        if h.count(needle) != n: raise ValueError('the crew card template did not take v11.37 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1137 applied: the crew card plan zooms (pinch, drag, double tap, wheel, + / - / Fit) and the explorer tiles load in; footer v11.36 -> v11.37')
