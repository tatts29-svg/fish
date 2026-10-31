"""Author: Andrew Fisher. v11.25 - neon job icons inside the rings, drawn for the jobs; the small cousins on chips and buttons.

Andrew, 22 Oct 2026: "Lets do some really elite icons  example attached just an example. Really push ur limits" - the
example: glowing line icons inside glowing progress rings (a pump nozzle with a gauged tank, a spray bottle with a toilet
roll and a sparkle, a level gauge with a drop and a badge).

On the live v11.24 page:
- two icon sets, the same four shapes at two levels of detail, both stroked in the job colour:
  detailed (48 grid), for inside the rings - Pump out: a pump nozzle, its hose looping under and up into a holding tank
  that carries a level gauge and a down arrow; Clean & restock: a trigger spray bottle, a toilet roll and a sparkle;
  Water checked / refilled: a drop with its level gauge inside and a tick badge; lock-up: a padlock;
  small (24 grid), for chips, the per-area list and the job buttons - a tank with the liquid drawn up, a spray bottle,
  a drop with its gauge, a padlock;
- the crew card: each of the three job cards under the bars is a 66 px ring with the detailed icon glowing inside and the
  percentage big beside it; the sticky header's three rings carry the icons with the percentage and the to-go count
  beside; area chips, the per-area list and the job buttons carry the small set. The job buttons' own svg rules (written
  for the tick box: transparent stroke, a dash the done animation draws) no longer reach the label icon, so it draws
  (on v11.24 the spray bottle vanished there and only the water drop's fill showed);
- the page's servicing panel (Event nights): the three rings under the whole-night meter carry the detailed icons with
  the percentage beside; the area chips the small set;
- nothing else: percentages, data, codes, service, record unchanged. Footer v11.24 -> v11.25.

    python3 patch_v1125.py page.html      (in place, on the live v11.24 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.24_job_icons_LIVE')); sys.path.insert(0, str(HERE.parent / 'v11.23_three_jobs_LIVE')); sys.path.insert(0, str(HERE.parent / 'v11.22_water_tally_LIVE'))
from rep import rep
import patch_v1124 as V24, patch_v1123 as V23
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V24.E

def hd(inner): return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'
def ld(inner): return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'

HD = {
    # a pump nozzle (body, spout down-left, trigger); its hose loops under and up into the tank; the tank has a level gauge and a down arrow
    'pump': hd('<rect x="28" y="9" width="16" height="27" rx="3.5"/><path d="M32.5 9V5h7v4"/><path d="M31.5 19.5a4.5 4.5 0 0 1 9 0"/><path d="M36 19.5l3-3.5"/><circle cx="36" cy="19.5" r="1.3" fill="currentColor" stroke="none"/><path d="M36 23.5v8"/><path d="M32.5 28l3.5 3.5 3.5-3.5"/><path d="M6.5 9.5h9.5a3 3 0 0 1 3 3v3.5h-9l-3.5-1z"/><path d="M6.5 15 3 21"/><path d="M13 16v5"/><path d="M19 13.5h1a3 3 0 0 1 3 3V39a5 5 0 0 0 10 0v-3"/>'),
    # a trigger spray bottle, a toilet roll, a sparkle
    'clean': hd('<path d="M5.5 25h12.5v15a3.5 3.5 0 0 1-3.5 3.5H9A3.5 3.5 0 0 1 5.5 40z"/><path d="M10.5 25v-7a3 3 0 0 1 3-3h8"/><path d="M22 10v10"/><path d="M19.5 15h-4.5l-2 5"/><ellipse cx="34" cy="25" rx="9.5" ry="4.2"/><path d="M24.5 25v12a9.5 4.2 0 0 0 19 0V25"/><ellipse cx="34" cy="25" rx="3.2" ry="1.4" stroke-width="2.2"/><path d="M43.5 29.5V43h-7" stroke-width="2.6"/><path d="M38 3.5l1.9 4.8 4.8 1.9-4.8 1.9-1.9 4.8-1.9-4.8-4.8-1.9 4.8-1.9z"/>'),
    # a drop with its level gauge inside, and a tick badge
    'refill': hd('<path d="M22 4c-7 9.5-13 17-13 24a13 13 0 0 0 26 0c0-7-6-14.5-13-24z"/><path d="M15 31a7 7 0 0 1 14 0"/><path d="M22 31l4.5-5"/><circle cx="22" cy="31" r="1.8" fill="currentColor" stroke="none"/><path d="M15.8 26.3l1.4.9M28.2 26.3l-1.4.9M22 23.5v1.7" stroke-width="2.2"/><circle cx="37.5" cy="37.5" r="7.5" fill="#0e151c"/><path d="M33.8 37.5l2.6 2.6 4.8-4.8" stroke-width="2.6"/>'),
    'lockup': hd('<rect x="9" y="21" width="30" height="22" rx="4.5"/><path d="M15.5 21v-6.5a8.5 8.5 0 0 1 17 0V21"/><path d="M24 29.5v5.5" stroke-width="3.6"/>'),
}
LD = {
    'pump': ld('<path d="M3 12.5h18V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M6.5 17c1.8-1.5 3.7-1.5 5.5 0s3.7 1.5 5.5 0" stroke-width="2"/><path d="M12 12.5V3"/><path d="M8.5 6.5 12 3l3.5 3.5"/>'),
    'clean': ld('<path d="M7 10.5h7.5l1.5 2.5v7a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20v-7z"/><path d="M10.5 10.5V7a2.5 2.5 0 0 1 2.5-2.5h3"/><path d="M16 3v3"/><path d="M19.5 3h.01M21.5 6.5h.01M19.5 10h.01" stroke-width="3"/>'),
    'refill': ld('<path d="M12 2.5c-3.6 5-7 8.6-7 12.4a7 7 0 0 0 14 0c0-3.8-3.4-7.4-7-12.4z"/><path d="M9 15.5a3 3 0 0 1 6 0" stroke-width="2"/><path d="M12 15.5l2-2.2" stroke-width="2"/>'),
    'lockup': ld('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 15.5v2" stroke-width="2.6"/>'),
}
def js_obj(d): return '{\n' + ',\n'.join("  %s: '%s'" % (k, v) for k, v in d.items()) + '\n}'
for v in list(HD.values()) + list(LD.values()):
    if "'" in v or '\\' in v: raise ValueError('an icon contains a quote or backslash')
LD_JS, HD_JS = js_obj(LD), js_obj(HD)

# ---- the crew card: the v11.24 function block (v11.23's with the v11.24 icons inside) is replaced whole. On the live v11.24
# page the icon tables read `var JOB_ICON ={` and `var JOB_ICON1123 ={` (no space before the brace); the anchors follow the page.
CARD_FNS_V24 = V23.CARD_FNS.replace(V23.ICON_JS, V24.ICON_JS).replace('var JOB_ICON = {', 'var JOB_ICON ={')
CARD_FNS = """/* v11.25 - neon job icons inside the rings (Andrew, 22 Oct 2026: "really elite icons ... push ur limits"): the detailed set
   glows inside the job rings with the percentage beside; the small set sits on chips, the per-area list and the buttons.
   v11.23: three jobs, three percentages - Pump out, Clean & restock, Water checked / refilled; water counts in the completion. */
var JOBS3 = ['pump', 'clean', 'refill'];
var JOB_ICON = """ + LD_JS + """;
var JOB_ICON_HD = """ + HD_JS + """;
function ringIcon(t, size, full) { return '<span class="ring ' + size + ' ' + t + (full ? ' full' : '') + '"><span class="ic">' + (JOB_ICON_HD[t] || JOB_ICON[t] || '') + '</span></span>'; }
function jobStatsFor(tasks, refs, day, st) {
  var out = {};
  tasks.forEach(function (t) { out[t] = { w: 0, d: 0, pct: 0, last: 0 }; });
  refs.forEach(function (r) { r.lines.forEach(function (l) {
    var ts = tasksFor(l, day);
    tasks.forEach(function (t) { if (ts.indexOf(t) < 0) return; var g = out[t]; g.w += l.qty; var s = st[jobKey(l.id, t, day)]; if (s) { g.d += l.qty; if (s.at > g.last) g.last = s.at; } });
  }); });
  tasks.forEach(function (t) { var g = out[t]; g.pct = g.w ? Math.floor(g.d * 100 / g.w) : 0; });
  return out;
}
function jobStats3(refs, day, st) { return jobStatsFor(JOBS3, refs, day, st); }
function jobsRowHtml(refs, day, st, size) {
  var o = jobStats3(refs, day, st), ts = JOBS3.filter(function (t) { return o[t].w > 0; });
  if (!ts.length) return '';
  return '<div class="jobs3' + (size ? ' ' + size : '') + '" role="group" aria-label="Progress by job">' + ts.map(function (t) {
    var g = o[t], full = g.d >= g.w, left = g.w - g.d;
    return '<div class="j3 ' + t + (full ? ' full' : '') + '"><span class="j3ring" style="--p:' + g.pct + '">' + ringIcon(t, 'sm', full).replace('class="ring ', 'style="--p:' + g.pct + '" class="ring ') + '</span><b class="j3p">' + g.pct + '%</b><span class="j3t"><b>' + esc(TASKS[t] || t) + '</b><small>' + g.d + ' of ' + g.w + (full ? ' · all done' : ' · ' + left + ' to go') + '</small>' + (g.last ? '<small>last ' + hm(g.last) + '</small>' : '') + '</span></div>';
  }).join('') + '</div>';
}
function jobChipsHtml(refs, day, st) {
  var o = jobStats3(refs, day, st), ts = JOBS3.filter(function (t) { return o[t].w > 0; });
  if (!ts.length) return '';
  return '<span class="jchips">' + ts.map(function (t) { var g = o[t]; return '<span class="jchip ' + t + (g.d >= g.w ? ' full' : '') + '" title="' + esc(TASKS[t] || t) + ' ' + g.d + ' of ' + g.w + '">' + JOB_ICON[t] + '<b>' + g.pct + '%</b></span>'; }).join('') + '</span>';
}
"""
COMPACT_NEW = """function compactHtml(day, os, st) {
  /* v11.25 - the sticky header: the three job rings with the icon inside, the percentage and the to-go count beside, for
     where the phone is: this code's area, or everything. A day with none of the three (the final lock-up) keeps the one
     Everything ring. */
  var a = mode === 'tick' ? AREA_OF[curRef] : null, refs = a ? a.refs : ALL_REFS, o = jobStats3(refs, day, st), where = a ? (a.n ? 'Area ' + a.n : a.name) : 'Everything';
  var cells = JOBS3.filter(function (t) { return o[t].w > 0; }).map(function (t) { var g = o[t], full = g.d >= g.w; return '<span class="ccell ' + t + (full ? ' full' : '') + '"><span class="ring xs ' + t + (full ? ' full' : '') + '" style="--p:' + g.pct + '"><span class="ic">' + JOB_ICON_HD[t] + '</span></span><span class="ctxt"><b class="pct">' + g.pct + '%</b><b class="n">' + (full ? 'all' : g.w - g.d) + '</b><small>' + (full ? 'done' : 'to go') + '</small></span></span>'; }).join('');
  if (!cells) { var full = os.w > 0 && os.d >= os.w; cells = '<span class="ccell one"><span class="ring sm' + (full ? ' full' : '') + '" style="--p:' + os.pct + '"><b>' + os.pct + '%</b></span><span class="ctxt"><b>' + (full ? 'all' : Math.max(0, os.w - os.d)) + '</b><small>' + (full ? 'done' : 'to go') + '</small></span></span>'; }
  return '<span class="compact-day">' + esc(shortDay(day)) + '<small>' + esc(where) + '</small></span>' + cells;
}"""
GLOW = {'pump': ('#ffb347', 'rgba(255,179,71,.6)'), 'clean': ('#5ef2c8', 'rgba(94,242,200,.6)'), 'refill': ('#5fb4ff', 'rgba(95,180,255,.65)'), 'full': ('#7dffd0', 'rgba(125,255,208,.6)')}
def glow_rules(prefix):
    return ''.join('%s.%s .ic{color:%s;filter:drop-shadow(0 0 2px %s) drop-shadow(0 0 6px %s)}' % (prefix, k, c, c, g) for k, (c, g) in GLOW.items())
ADD_CSS = (".ring .ic{position:relative;z-index:1;display:grid;place-items:center;color:var(--hivis2)}.ring .ic svg{display:block}"
           + glow_rules('.ring') +
           ".j3 .ring.sm{width:66px;height:66px}.j3 .ring.sm::before{inset:6px}.j3 .ring .ic svg{width:42px;height:42px}"
           ".j3{gap:4px;padding:10px 6px 10px}.j3p{font-family:var(--display);font-weight:800;font-size:21px;line-height:1.05;font-variant-numeric:tabular-nums;margin-top:2px}.j3.pump .j3p{color:#ffb347;text-shadow:var(--glow-h)}.j3.clean .j3p{color:#5ef2c8;text-shadow:0 0 10px rgba(94,242,200,.55)}.j3.refill .j3p{color:#8fd0ff;text-shadow:0 0 10px rgba(95,180,255,.6)}.j3.full .j3p{color:var(--done2);text-shadow:var(--glow-d)}"
           ".ccell .ring.xs .ic svg{width:26px;height:26px}.ccell .ctxt{gap:0}.ccell .ctxt .pct{font-family:var(--display);font-size:14px;line-height:1.05}.ccell .ctxt .n{font-size:11px;line-height:1.1;color:var(--ink)}.ccell.pump .ctxt .pct{color:#ffb347}.ccell.clean .ctxt .pct{color:#5ef2c8}.ccell.refill .ctxt .pct{color:#8fd0ff}.ccell.full .ctxt .pct,.ccell.full .ctxt .n{color:var(--done2)}"
           ".job .jtxt b svg{stroke:currentColor;stroke-width:2.2;fill:none;width:15px;height:15px}.job .jtxt b svg path{stroke-dasharray:none;stroke-dashoffset:0;animation:none}"
           "@media (prefers-reduced-motion:reduce){.ring .ic{filter:none!important}}\n")
CARD_CSS = V24.CARD_CSS + ADD_CSS

# ---- the page's servicing panel
PANEL_FNS_V24 = V23.PANEL_FNS.replace(V23.ICON_JS, V24.ICON_JS).replace('var JOB_ICON1123 = {', 'var JOB_ICON1123 ={')
PANEL_FNS = r"""/* v11.25 - neon job icons inside the panel's three rings, the percentage beside; the small set on the area chips.
   v11.23: three jobs, three percentages on the panel; water counts in the completion like the other two. Andrew, 22 Oct 2026. */
var JOBS1123 = ['pump', 'clean', 'refill'];
var JOB_ICON1123 = """ + LD_JS + r""";
var JOB_ICON1123_HD = """ + HD_JS + r""";
function jobStats1123(M, cfg, st, refs) {
  var out = {};
  JOBS1123.forEach(function (t) { out[t] = { w: 0, d: 0, pct: 0, last: 0 }; });
  refs.forEach(function (r) { r.lines.forEach(function (l) {
    var ts = M.S.tasksFor(cfg, l, M.day);
    JOBS1123.forEach(function (t) { if (ts.indexOf(t) < 0) return; var g = out[t]; g.w += l.qty; var s = st[M.S.jobKey(l.id, t, M.day)]; if (s) { g.d += l.qty; if (s.at > g.last) g.last = s.at; } });
  }); });
  JOBS1123.forEach(function (t) { var g = out[t]; g.pct = g.w ? Math.floor(g.d * 100 / g.w) : 0; });
  return out;
}
function jobs1123Html(M, cfg, st, refs, size) {
  var o = jobStats1123(M, cfg, st, refs), ts = JOBS1123.filter(function (t) { return o[t].w > 0; });
  if (!ts.length) return '';
  if (size === 'area') return '<span class="svc1123-chips">' + ts.map(function (t) { var g = o[t]; return '<span class="svc1123-chip ' + t + (g.d >= g.w ? ' full' : '') + '" title="' + esc(M.D.tasks[t] || t) + ' ' + g.d + ' of ' + g.w + '">' + JOB_ICON1123[t] + '<b>' + g.pct + '%</b></span>'; }).join('') + '</span>';
  return '<div class="svc1123-jobs" data-svc1123="' + esc(size) + '" role="group" aria-label="Progress by job">' + ts.map(function (t) {
    var g = o[t], full = g.d >= g.w;
    return '<div class="svc1123-job ' + t + (full ? ' full' : '') + '"><span class="svc1123-ring" style="--p:' + g.pct + '"><span class="ic">' + JOB_ICON1123_HD[t] + '</span></span><span class="svc1123-t"><b class="pct">' + g.pct + '%</b><b>' + esc(M.D.tasks[t] || t) + '</b><small>' + g.d + ' of ' + g.w + (full ? ' · all done' : ' · ' + (g.w - g.d) + ' to go') + (g.last ? ' · last ' + esc(M.S.hm(g.last)) : '') + '</small></span></div>';
  }).join('') + '</div>';
}
"""
PANEL_ADD_CSS = (" .svc1123-ring{width:64px;height:64px} .svc1123-ring::before{inset:6px} .svc1123-ring .ic{position:relative;z-index:1;display:grid;place-items:center;color:var(--c);filter:drop-shadow(0 0 2px var(--c)) drop-shadow(0 0 6px color-mix(in srgb,var(--c) 60%,transparent))} .svc1123-ring .ic svg{display:block;width:40px;height:40px}"
                 " .svc1123-t .pct{font-size:20px;line-height:1.05;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums} @media (prefers-reduced-motion:reduce){.svc1123-ring .ic{filter:none!important}} ")
PANEL_CSS = V24.PANEL_CSS + PANEL_ADD_CSS


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.25 requires the live v11.24 page ' + BASE_SHA256)
    if 'JOB_ICON_HD' in text: raise ValueError('v11.25 already applied')
    text = rep(text, PANEL_FNS_V24, PANEL_FNS, 'panel: icons inside the rings', 'page')
    text = rep(text, V24.PANEL_CSS, PANEL_CSS, 'panel: style', 'page')
    text = rep(text, E(CARD_FNS_V24), E(CARD_FNS), 'card: the two icon sets and the job cards', 'page')
    text = rep(text, E(V23.COMPACT_NEW), E(COMPACT_NEW), 'card: the sticky header', 'page')
    text = rep(text, E(V24.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.24'; /* v8.19 release922", "+' · v11.25'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    if h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h or h.count('var JOB_ICON_HD') != 1 or h.count('function ringIcon') != 1 or h.count('.job .jtxt b svg{stroke:currentColor') != 1 or 'jobsRowHtml' not in h: raise ValueError('the crew card template did not take v11.25 cleanly')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1125 applied: neon job icons inside the rings on the card and the panel, small set on chips and buttons; footer v11.24 -> v11.25')
