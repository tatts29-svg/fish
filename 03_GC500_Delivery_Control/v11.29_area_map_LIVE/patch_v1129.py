"""Author: Andrew Fisher. v11.29 - the area on the site plan after a scan, and a done job lit in its own colour.

Andrew, 23 Oct 2026: "Be good if we can show them a map of area they scanned is this possible . Just want to help them and
make this extremly easy for them" and "And we high light based off colour too. Water needs to be neon blue. Clean and restock
is green. We need one for pump."

On the live v11.28 crew card:
- **The area on the plan.** On a code's card, under the reference's details, and on the status page after Save & close: the
  site plan (the explorer's own sheet overview, /w/Coates-GC500-2026/explorer/assets/sheet-overview.webp, same origin as the
  card) cropped to the area, with a pin on every reference of the area that has a pin on the record: the scanned one white
  with a pulsing hi-vis halo, done ones green, the rest hi-vis; every pin is a tap to navigate (Google Maps directions, as
  the Navigate button). "Where am I" asks the phone for its location once and plots a blue dot, or says how far and which
  way the scanned reference is when the dot would fall off the crop. Without signal the plan does not load and the pins sit
  on the dark. Pins are placed with the explorer's georeferencing: lat/lon -> Web Mercator pixels at z18 -> the inverse of
  the registration affine -> sheet points -> overview pixels (0.5 px per pt); a reference the drawing shows in the inset
  takes the inset's own affine, as the explorer does. Checked against the drawing's own reference labels: 61 of 74 pinned
  references have a label, median 3.3 pt (about 2 m) from the pin, 59 within 10 pt. Not a survey, as the registration says.
- **Done in the job's colour.** A done Pump out button lights hi-vis orange, a done Water checked / refilled neon blue,
  Clean & restock stays green: the button, its tick box, its "Completed hh:mm" line and its settle flash.
Footer v11.28 -> v11.29. The crews see it once the trackers are published again.

    python3 patch_v1129.py page.html      (in place, on the live v11.28 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.27_saved_status_LIVE')); sys.path.insert(0, str(HERE.parent / 'v11.26_live_and_clear_LIVE'))
from rep import rep
import patch_v1127 as V27, patch_v1126 as V26
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V27.E
GEO = json.loads((HERE / 'georeferencing_explorer_copy.json').read_text())   # the explorer's assets/georeferencing.json, 2026-09-25

def once(s, old, new, what):
    if s.count(old) != 1: raise ValueError(what + ': expected once, found ' + str(s.count(old)))
    return s.replace(old, new)

def m2(a): return json.dumps([a[0], a[1]])   # the two affine rows the card needs
MAP_FNS = """/* v11.29 - the area on the site plan (Andrew, 23 Oct 2026: "show them a map of area they scanned ... make this extremly easy
   for them"). The explorer's sheet overview, cropped to the area, with a pin on every reference that has a pin on the
   record. Pins come from the explorer's georeferencing (lat/lon -> Web Mercator px at z18 -> inverse registration affine ->
   sheet pt -> overview px at 0.5 px/pt; a reference the drawing shows in the inset takes the inset's own affine). Not a
   survey: the registration's check is 0.67 m RMS. */
var PLAN1129 = { url: '/w/Coates-GC500-2026/explorer/assets/sheet-overview.webp', w: 1192, h: 842, k: 0.5, main: """ + m2(GEO['main']['sheet_to_z18px']) + """, inset: """ + m2(GEO['inset']['sheet_to_z18px']) + """, insetRect: """ + json.dumps(GEO['inset']['sheet_region_pts']) + """ };
function inv1129(m) { var a = m[0][0], b = m[0][1], c = m[0][2], d = m[1][0], e = m[1][1], f = m[1][2], det = a * e - b * d; return [[e / det, -b / det, (b * f - c * e) / det], [-d / det, a / det, (c * d - a * f) / det]]; }
var INV1129 = { main: inv1129(PLAN1129.main), inset: inv1129(PLAN1129.inset) };
function ap1129(m, p) { return [m[0][0] * p[0] + m[0][1] * p[1] + m[0][2], m[1][0] * p[0] + m[1][1] * p[1] + m[1][2]]; }
function z181129(lat, lon) { var n = 134217728, x = (lon + 180) / 360 * n, s = Math.sin(lat * Math.PI / 180), y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n; return [x, y]; }
function inRect1129(p, r) { return p[0] >= r[0] && p[0] <= r[2] && p[1] >= r[1] && p[1] <= r[3]; }
function planPx(pin) { if (!pin || pin.length < 2) return null; var z = z181129(+pin[0], +pin[1]), i = ap1129(INV1129.inset, z), s = inRect1129(i, PLAN1129.insetRect) ? i : ap1129(INV1129.main, z); return [s[0] * PLAN1129.k, s[1] * PLAN1129.k]; }
function compass1129(from, to) { var dLat = to[0] - from[0], dLon = (to[1] - from[1]) * Math.cos(from[0] * Math.PI / 180), ang = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360; return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(ang / 45) % 8]; }
var loc1129 = null;
function areaMapHtml(a, r, day, st) {
  var pts = a.refs.filter(function (o) { return o.pin; }).map(function (o) { return { r: o, p: planPx(o.pin), done: refStats(o, day, st).done, miss: missingTasks(o, day, st).length }; });
  if (!pts.length) return '';
  var you = loc1129 && loc1129.length ? planPx(loc1129) : null;
  var xs = pts.map(function (x) { return x.p[0]; }), ys = pts.map(function (x) { return x.p[1]; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = 34;
  var w = Math.max(x1 - x0 + 2 * pad, 230), hgt = Math.max(y1 - y0 + 2 * pad, 140);
  if (hgt < w * 0.72) hgt = w * 0.72; else if (w < hgt / 0.72) w = hgt / 0.72;
  w = Math.min(w, PLAN1129.w); hgt = Math.min(hgt, PLAN1129.h);
  var vx = Math.max(0, Math.min((x0 + x1) / 2 - w / 2, PLAN1129.w - w)), vy = Math.max(0, Math.min((y0 + y1) / 2 - hgt / 2, PLAN1129.h - hgt));
  var rad = w / 44, fs = w / 24, f1 = function (n) { return Math.round(n * 10) / 10; };
  var h = '<section class="card amap" aria-labelledby="amh"><h3 id="amh">' + esc(areaLabel(a)) + ' · on the plan</h3>';
  h += '<svg class="amap-svg" viewBox="' + [vx, vy, w, hgt].map(f1).join(' ') + '" style="aspect-ratio:' + (w / hgt).toFixed(3) + '" role="img" aria-label="' + esc(areaLabel(a)) + ' on the site plan: ' + pts.length + ' references">';
  h += '<rect x="0" y="0" width="' + PLAN1129.w + '" height="' + PLAN1129.h + '" fill="#0e151c"/><image href="' + PLAN1129.url + '" x="0" y="0" width="' + PLAN1129.w + '" height="' + PLAN1129.h + '" preserveAspectRatio="none"/><rect x="' + f1(vx) + '" y="' + f1(vy) + '" width="' + f1(w) + '" height="' + f1(hgt) + '" fill="rgba(6,10,14,.22)"/>';
  pts.sort(function (p, q) { return (p.r === r) - (q.r === r); });
  pts.forEach(function (o) {
    var me = o.r === r, cls = (me ? 'me ' : '') + (o.done ? 'done' : 'togo'), x = f1(o.p[0]), y = f1(o.p[1]), rr = f1(me ? rad * 1.3 : rad);
    h += '<a class="' + cls + '" href="https://www.google.com/maps/dir/?api=1&amp;destination=' + Number(o.r.pin[0]) + ',' + Number(o.r.pin[1]) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(o.r.ref + (me ? ', this one' : o.done ? ', done' : ', ' + o.miss + ' to go') + ', navigate') + '">' +
      (me ? '<circle class="halo" cx="' + x + '" cy="' + y + '" r="' + f1(rad * 1.6) + '"/>' : '') + '<circle class="pin" cx="' + x + '" cy="' + y + '" r="' + rr + '"/>' +
      '<text class="lbl" x="' + x + '" y="' + f1(o.p[1] - rr - fs * 0.35) + '" font-size="' + f1(fs) + '" text-anchor="middle">' + esc(o.r.ref) + '</text></a>';
  });
  var off = '';
  if (you) {
    if (you[0] >= vx && you[0] <= vx + w && you[1] >= vy && you[1] <= vy + hgt) h += '<circle class="youhalo" cx="' + f1(you[0]) + '" cy="' + f1(you[1]) + '" r="' + f1(rad * 1.5) + '"/><circle class="you" cx="' + f1(you[0]) + '" cy="' + f1(you[1]) + '" r="' + f1(rad * 0.8) + '"/>';
    else if (r.pin) off = 'You are about ' + Math.round(distM(loc1129, r.pin)) + ' m ' + compass1129(r.pin, loc1129) + ' of ' + esc(r.ref) + ', off this crop.';
  }
  h += '</svg><div class="amap-foot"><span class="lg me">' + esc(r.ref) + ' · you scanned this</span><span class="lg done">done</span><span class="lg togo">to go</span><span class="lg hint">tap a pin to navigate</span>' +
    (loc1129 === 'denied' ? '<span class="lg hint">Location is off for this browser</span>' : you ? (off ? '<span class="lg you">' + off + '</span>' : '<span class="lg you">You are the blue dot</span>') : '<button class="bbtn sm" type="button" data-locate="1">Where am I</button>') + '</div></section>';
  return h;
}
document.addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-locate]'); if (!b) return;
  if (!navigator.geolocation) { loc1129 = 'denied'; render(); return; }
  b.disabled = true; b.textContent = 'Finding you…';
  navigator.geolocation.getCurrentPosition(function (pos) { loc1129 = [pos.coords.latitude, pos.coords.longitude]; render(); }, function () { loc1129 = 'denied'; render(); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
});
window.SvcMap1129 = { planPx: planPx, setLoc: function (l) { loc1129 = l; }, html: function (ref, dayId) { var was = curRef; curRef = ref; try { return areaMapHtml(AREA_OF[ref], REFS[ref], dayId || shownDay(), jobStates(allEvents(), now())); } finally { curRef = was; } } };
"""
TICK_OLD = "+ navHtml(r);\n  shown.forEach(function (l) {"
TICK_NEW = "+ navHtml(r) + areaMapHtml(a, r, day, st);\n  shown.forEach(function (l) {"
SAVED_NEW = once(V27.SAVED_NEW, "'</section>';\n  h += '<button class=\"showall\"", "'</section>';\n  h += areaMapHtml(a, r, day, st);\n  h += '<button class=\"showall\"", 'saved view map')
CSS_ADD = ("/* v11.29 - the area on the plan */.amap{padding:12px 14px 12px}.amap h3{margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}"
           ".amap-svg{display:block;width:100%;height:auto;border-radius:12px;border:1px solid var(--line);background:#0e151c}.amap-svg a{cursor:pointer}.amap-svg .pin{stroke:#0e151c;stroke-width:1.2}.amap-svg .togo .pin{fill:#ffb347}.amap-svg .done .pin{fill:#2ef0ab}.amap-svg .me .pin{fill:#fff;stroke:#ff8a32;stroke-width:2}"
           ".amap-svg .halo{fill:none;stroke:#ff8a32;stroke-width:2;transform-box:fill-box;transform-origin:center;animation:svc-mapme 1.6s ease-out infinite}@keyframes svc-mapme{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.3)}}"
           ".amap-svg .lbl{font-family:var(--display);font-weight:800;fill:#fff;paint-order:stroke;stroke:#0e151c;stroke-width:3px;stroke-linejoin:round}.amap-svg .you{fill:#5fb4ff;stroke:#fff;stroke-width:2}.amap-svg .youhalo{fill:rgba(95,180,255,.25);stroke:#5fb4ff;stroke-width:1.5}"
           ".amap-foot{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin-top:8px;font-size:12.5px;color:var(--mute)}.lg::before{content:\"\";display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}.lg.me::before{background:#fff;box-shadow:0 0 0 2px #ff8a32}.lg.done::before{background:#2ef0ab}.lg.togo::before{background:#ffb347}.lg.you::before{background:#5fb4ff}.lg.hint::before{display:none}.lg.me{color:var(--ink);font-weight:700}.bbtn.sm{min-height:36px;padding:4px 10px;font-size:13px;margin-left:auto}"
           "@media (prefers-reduced-motion:reduce){.amap-svg .halo{animation:none}}"
           "/* v11.29 - a done job lit in its own colour: pump hi-vis, water neon blue, clean & restock green (Andrew, 23 Oct 2026) */"
           "@keyframes svc-settle-p{0%{transform:scale(1.03);box-shadow:0 0 30px rgba(255,179,71,1),0 0 70px rgba(255,179,71,.6)}}@keyframes svc-settle-w{0%{transform:scale(1.03);box-shadow:0 0 30px rgba(95,180,255,1),0 0 70px rgba(95,180,255,.6)}}"
           ".job.t-pump.done{background:linear-gradient(180deg,#3a2510,#2a1a0b);border-color:#ffb347;box-shadow:0 0 14px rgba(255,179,71,.85),0 0 40px rgba(255,179,71,.4);animation:svc-settle-p .6s ease-out}.job.t-pump.done .jbox{background:#ffb347;border-color:#ffd9a8;box-shadow:0 0 14px rgba(255,179,71,.8)}.job.t-pump.done .jbox svg{stroke:#2a1a0b}.job.t-pump.done b{color:#fff3e3}.job.t-pump.done small{color:#ffd08a}.job.t-pump.done .jtxt b svg{color:#ffd08a}"
           ".job.t-refill.done{background:linear-gradient(180deg,#0f2d4d,#0a1d33);border-color:#5fb4ff;box-shadow:0 0 14px rgba(95,180,255,.9),0 0 40px rgba(95,180,255,.45);animation:svc-settle-w .6s ease-out}.job.t-refill.done .jbox{background:#5fb4ff;border-color:#c5e6ff;box-shadow:0 0 14px rgba(95,180,255,.85)}.job.t-refill.done .jbox svg{stroke:#061a2e}.job.t-refill.done b{color:#eaf6ff}.job.t-refill.done small{color:#9fd8ff}.job.t-refill.done .jtxt b svg{color:#9fd8ff}"
           "@media (prefers-reduced-motion:reduce){.job.t-pump.done,.job.t-refill.done{animation:none!important}}\n")
CARD_CSS = V27.CARD_CSS + CSS_ADD


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.29 requires the live v11.28 page ' + BASE_SHA256)
    if 'PLAN1129' in text: raise ValueError('v11.29 already applied')
    text = rep(text, E(V26.CARD_FNS), E(V26.CARD_FNS + MAP_FNS), 'card: the plan map functions', 'page')
    text = rep(text, E(TICK_OLD), E(TICK_NEW), "card: the map on a code's card", 'page')
    text = rep(text, E(V27.SAVED_NEW), E(SAVED_NEW), 'card: the map on the status page', 'page')
    text = rep(text, E(V27.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.28'; /* v8.19 release922", "+' · v11.29'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    for needle in ['var PLAN1129', 'function areaMapHtml', 'window.SvcMap1129', '.job.t-refill.done{background:linear-gradient(180deg,#0f2d4d']:
        if h.count(needle) != 1: raise ValueError('the crew card template did not take v11.29 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if h.count('navHtml(r) + areaMapHtml(a, r, day, st)') != 1 or h.count('h += areaMapHtml(a, r, day, st);') != 1 or h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1129 applied: the area on the plan after a scan and on the status page; done jobs lit in their own colour; footer v11.28 -> v11.29')
