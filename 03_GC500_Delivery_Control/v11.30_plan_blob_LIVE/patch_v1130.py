"""Author: Andrew Fisher. v11.30 - the plan loads on the crew card: fetched by the card and handed to the map as a blob, kept for offline.

Found on the live TEST card after v11.29 (GET-only probe, 23 Oct 2026 01:50 AEST): the service serves the crew card with a
Content-Security-Policy whose img-src is `data: blob:`, so the map's plan image from the card's own origin was refused
("Refused to load the image ... img-src data: blob:") and the pins sat on the dark. The same policy lets the card fetch
(connect) from its origin, and show images from data: and blob: sources.

v11.30: the card fetches the sheet overview itself, shows it through a blob URL, and keeps a data URL copy in local
storage (about 240 KB) so the map draws without signal too, from the next open. Until the plan is there the map says
"Plan loads with signal". Pins that share a spot on the record (PG01, PG03 and PG05 sit on one pin) are spread a touch so
each label can be read. Footer v11.29 -> v11.30. The crews see it once the trackers are published again.

    python3 patch_v1130.py page.html      (in place, on the live v11.29 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.29_area_map_LIVE')); sys.path.insert(0, str(HERE.parent / 'v11.27_saved_status_LIVE')); sys.path.insert(0, str(HERE.parent / 'v11.26_live_and_clear_LIVE'))
from rep import rep
import patch_v1129 as V29
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V29.E

def once(s, old, new, what):
    if s.count(old) != 1: raise ValueError(what + ': expected once, found ' + str(s.count(old)))
    return s.replace(old, new)

MAP_FNS = V29.MAP_FNS
MAP_FNS = once(MAP_FNS, "var PLAN1129 = { url: '/w/Coates-GC500-2026/explorer/assets/sheet-overview.webp', w: 1192, h: 842, k: 0.5,", "var PLAN1129 = { url: '/w/Coates-GC500-2026/explorer/assets/sheet-overview.webp', src: '', state: 'idle', w: 1192, h: 842, k: 0.5,", 'plan state')
MAP_FNS = once(MAP_FNS, "var loc1129 = null;\n", """var loc1129 = null;
/* v11.30 - the card's CSP shows images from data: and blob: only, so the plan is fetched by the card and handed to the map as a
   blob; a data URL copy is kept in local storage for the next open without signal. */
function planKey1129() { return 'gc500.svc1067.plan1129'; } /* one copy per device, shared by every card; a later release bumps the key if the plan is redrawn */
function loadPlan1129() {
  if (PLAN1129.src || PLAN1129.state === 'loading') return;
  try { var kept = localStorage.getItem(planKey1129()); if (kept && kept.indexOf('data:image/') === 0) { PLAN1129.src = kept; PLAN1129.state = 'kept'; return; } } catch (e) {}
  if (typeof fetch !== 'function') { PLAN1129.state = 'failed'; return; }
  PLAN1129.state = 'loading';
  fetch(PLAN1129.url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('plan ' + r.status); return r.blob(); }).then(function (blob) {
    PLAN1129.src = URL.createObjectURL(blob); PLAN1129.state = 'fetched'; render();
    try { var fr = new FileReader(); fr.onload = function () { try { localStorage.setItem(planKey1129(), String(fr.result)); } catch (e) {} }; fr.readAsDataURL(blob); } catch (e) {}
  }).catch(function () { PLAN1129.state = 'failed'; render(); });
}
function spread1129(pts) {
  /* references that share a pin on the record (PG01, PG03 and PG05 sit on one) are spread a touch so each label can be read */
  var groups = {};
  pts.forEach(function (o) { var k = Math.round(o.p[0] * 2) + ',' + Math.round(o.p[1] * 2); (groups[k] = groups[k] || []).push(o); });
  Object.keys(groups).forEach(function (k) { var g = groups[k]; if (g.length < 2) return; g.forEach(function (o, i) { var ang = -Math.PI / 2 + i * 2 * Math.PI / g.length, d = 10 + 3 * g.length; o.p = [o.p[0] + d * Math.cos(ang), o.p[1] + d * Math.sin(ang)]; }); });
  return pts;
}
""", 'plan loader')
MAP_FNS = once(MAP_FNS, "  if (!pts.length) return '';\n  var you = loc1129 && loc1129.length ? planPx(loc1129) : null;", "  if (!pts.length) return '';\n  spread1129(pts);\n  var you = loc1129 && loc1129.length ? planPx(loc1129) : null;", 'spread call')
MAP_FNS = once(MAP_FNS, "<image href=\"' + PLAN1129.url + '\" x=\"0\" y=\"0\" width=\"' + PLAN1129.w + '\" height=\"' + PLAN1129.h + '\" preserveAspectRatio=\"none\"/>", "' + (PLAN1129.src ? '<image href=\"' + PLAN1129.src + '\" x=\"0\" y=\"0\" width=\"' + PLAN1129.w + '\" height=\"' + PLAN1129.h + '\" preserveAspectRatio=\"none\"/>' : '') + '", 'image from the loaded plan')
MAP_FNS = once(MAP_FNS, "h += '</svg><div class=\"amap-foot\">", "if (!PLAN1129.src) h += '<text class=\"lbl plannote\" x=\"' + f1(vx + w / 2) + '\" y=\"' + f1(vy + hgt - fs * 0.8) + '\" font-size=\"' + f1(fs * 0.85) + '\" text-anchor=\"middle\">' + (PLAN1129.state === 'failed' ? 'Plan loads with signal' : 'Plan loading…') + '</text>';\n  h += '</svg><div class=\"amap-foot\">", 'plan note')
MAP_FNS = once(MAP_FNS, "window.SvcMap1129 = { planPx: planPx, setLoc: function (l) { loc1129 = l; },", "loadPlan1129();\nwindow.SvcMap1129 = { planPx: planPx, setLoc: function (l) { loc1129 = l; }, src: function () { return PLAN1129.src; }, state: function () { return PLAN1129.state; }, setSrc: function (s, st) { PLAN1129.src = s; PLAN1129.state = st || 'set'; }, reload: function () { PLAN1129.src = ''; PLAN1129.state = 'idle'; loadPlan1129(); },", 'map handle')
CSS_ADD = ".amap-svg .plannote{fill:#9cb0c2;stroke:none;font-weight:600;font-family:var(--body)}\n"
CARD_CSS = V29.CARD_CSS + CSS_ADD


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.30 requires the live v11.29 page ' + BASE_SHA256)
    if 'loadPlan1129' in text: raise ValueError('v11.30 already applied')
    text = rep(text, E(V29.MAP_FNS), E(MAP_FNS), 'card: the plan fetched as a blob, kept for offline', 'page')
    text = rep(text, E(V29.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.29'; /* v8.19 release922", "+' · v11.30'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    for needle in ['function loadPlan1129', 'function spread1129', 'URL.createObjectURL(blob)', 'Plan loads with signal', "setSrc: function (s, st)"]:
        if h.count(needle) != 1: raise ValueError('the crew card template did not take v11.30 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if '<image href="\' + PLAN1129.url' in h or h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1130 applied: the plan fetched by the card as a blob and kept for offline; shared pins spread; footer v11.29 -> v11.30')
