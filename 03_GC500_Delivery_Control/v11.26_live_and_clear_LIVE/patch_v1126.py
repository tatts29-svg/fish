"""Author: Andrew Fisher. v11.26 - live and clear: the rings sweep, a change flashes, what is not done is listed.

Andrew, 22 Oct 2026: "Remember we want this clear as day. So it updates. We must make sure this data is always 100%
accurate. It saves. It updates every where it glows. It pulsates. Perecentages updates. It clear whats missing and not done".

What the live v11.25 card already does (unchanged): every tap is queued on the phone and sent to the service, resent until
the service confirms it, and shown "waiting for signal" until then; the card reads the service every 15 s, redraws every
5 s and after every tap, and only replaces the parts that changed; the status line reads "Live - updated hh:mm:ss"; every
percentage is worked out from the same job states on every draw.

What v11.26 adds, all from those same job states:
- the rings sweep to each new percentage: the card registers its `--p` ring property (a number), so the transition the
  rings already carried runs; the page's panel gets its own `--sp` property (the page uses `--p` elsewhere as a length);
- a ring or a percentage that changed since the last draw flashes (the ring's halo, the number bumps), on this phone's
  taps and on ticks that arrive from other phones alike; the count of jobs that changed shows for four seconds under the
  header ("+3 jobs done - 255 of 752 - 33%"); switching day never flashes;
- rings with work left breathe (the icon and the halo pulse slowly); a full ring keeps its green pulse;
- a "Not done yet" card at the top of the view, before the audit: how many references and jobs are left, the jobs left
  by kind with their icons, then every area with its references and, on each reference, the icons of the jobs it is
  missing and the area's last tap time. On a service day that has closed (08:00 the next morning) it reads "Missed", in
  red. When nothing is missing it says so. On a code's card the "Still to go" chips carry the same missing-job icons;
- the page's servicing panel rings sweep and breathe the same way;
- footer v11.25 -> v11.26.

    python3 patch_v1126.py page.html      (in place, on the live v11.25 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.25_neon_icons_LIVE'))
from rep import rep
import patch_v1125 as V25
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V25.E

def once(s, old, new, what):
    if s.count(old) != 1: raise ValueError(what + ': expected once in the v11.25 block, found ' + str(s.count(old)))
    return s.replace(old, new)

# ---- the crew card: rings and numbers carry a key so a change can be animated; new functions appended
CARD_FNS = V25.CARD_FNS
CARD_FNS = once(CARD_FNS, "function ringIcon(t, size, full) { return '<span class=\"ring ' + size + ' ' + t + (full ? ' full' : '') + '\"><span class=\"ic\">' + (JOB_ICON_HD[t] || JOB_ICON[t] || '') + '</span></span>'; }",
                "function ringIcon(t, size, full, key) { return '<span class=\"ring ' + size + ' ' + t + (full ? ' full' : '') + '\"' + (key ? ' data-k=\"' + esc(key) + '\"' : '') + '><span class=\"ic\">' + (JOB_ICON_HD[t] || JOB_ICON[t] || '') + '</span></span>'; }", 'ringIcon')
CARD_FNS = once(CARD_FNS, "ringIcon(t, 'sm', full).replace('class=\"ring ', 'style=\"--p:' + g.pct + '\" class=\"ring ')", "ringIcon(t, 'sm', full, 'j3:' + size + ':' + t).replace('class=\"ring ', 'style=\"--p:' + g.pct + '\" class=\"ring ')", 'j3 ring call')
CARD_FNS = once(CARD_FNS, "<b class=\"j3p\">' + g.pct + '%</b>", "<b class=\"j3p\" data-k=\"j3p:' + size + ':' + t + '\">' + g.pct + '%</b>", 'j3 percentage')
CARD_FNS += """/* v11.26 - live and clear (Andrew, 22 Oct 2026: "clear as day ... it updates ... it glows. It pulsates. Perecentages updates.
   It clear whats missing and not done"). The rings sweep to each new percentage; a ring or number that changed since the
   last draw flashes; the count of jobs that changed shows for a moment; a "Not done yet" card lists every reference with
   the jobs it is missing, by area, and reads "Missed" once the service day has closed. All from the same job states the
   percentages use. */
function dayClosed(id, ms) { return ms >= dayStart(id) + 24 * HOUR; }
function missingTasks(r, day, st) {
  var out = [];
  r.lines.forEach(function (l) { tasksFor(l, day).forEach(function (t) { if (!st[jobKey(l.id, t, day)] && out.indexOf(t) < 0) out.push(t); }); });
  return out;
}
function missingIconsHtml(r, day, st) {
  var m = missingTasks(r, day, st);
  return m.length ? '<span class="nd-i" role="img" aria-label="missing ' + esc(m.map(function (t) { return TASKS[t] || t; }).join(', ')) + '">' + m.map(function (t) { return '<i class="' + t + '">' + (JOB_ICON[t] || '') + '</i>'; }).join('') + '</span>' : '';
}
function notDoneHtml(day, st) {
  var ms = now(), open = day <= svcDay(ms), closed = dayClosed(day, ms), dd = dayOf(day), ifNeeded = !!(dd && dd.ifNeeded), missed = closed && !ifNeeded;   /* by the clock alone: the banner covers an unsynced one */
  var kinds = JOBS3.concat(['lockup']), all = jobStatsFor(kinds, ALL_REFS, day, st);
  var left = 0, refsLeft = 0, areas = [];
  AREAS.forEach(function (a) {
    var refs = a.refs.map(function (r) { return { r: r, m: missingTasks(r, day, st) }; }).filter(function (x) { return x.m.length; });
    if (!refs.length) return;
    var gs = groupStats(a.refs, day, st);
    areas.push({ a: a, refs: refs, left: gs.w - gs.d, last: gs.last });
    refsLeft += refs.length; left += gs.w - gs.d;
  });
  var total = kinds.reduce(function (n, t) { return n + all[t].w; }, 0);
  var word = missed ? 'Missed' : !open ? 'Not yet open' : 'Not done yet';
  var h = '<section class="card notdone' + (left ? (missed ? ' missed' : '') : ' clear') + '" aria-labelledby="ndh"><h3 id="ndh">' + (left ? word : 'Nothing missing') + ' · ' + esc(longDay(day)) + '</h3>';
  if (!left) return h + '<p class="nd-all">Every job on every reference is done' + (total ? ' · ' + total + ' jobs' : '') + '.</p></section>';
  h += '<div class="nd-sum"><b>' + refsLeft + ' of ' + ALL_REFS.length + ' references</b><span>' + left + ' job' + (left === 1 ? '' : 's') + ' ' + (missed ? 'missed' : 'to go') + '</span>' +
    kinds.map(function (t) { var n = all[t].w - all[t].d; return n > 0 ? '<span class="nd-job ' + t + '">' + (JOB_ICON[t] || '') + '<b>' + n + '</b><small>' + esc(TASKS[t] || t) + '</small></span>' : ''; }).join('') + '</div>';
  h += areas.map(function (x) {
    return '<div class="nd-area"><span class="nd-an">' + (x.a.n || '–') + '</span><div class="nd-body"><div class="nd-ah"><b>' + esc(x.a.name) + '</b><span>' + x.refs.length + ' of ' + x.a.refs.length + ' references · ' + x.left + ' job' + (x.left === 1 ? '' : 's') + (x.last ? ' · last tap ' + hm(x.last) : ' · nothing done yet') + '</span></div><div class="nd-refs">' +
      x.refs.map(function (y) { return '<span class="nd-ref">' + esc(y.r.ref) + missingIconsHtml(y.r, day, st) + '</span>'; }).join('') + '</div></div></div>';
  }).join('');
  return h + '</section>';
}
var live1126 = { p: {}, t: {}, done: undefined, day: null, timer: null };
function liveToast(msg) {
  var hd = document.querySelector('header'); if (!hd) return;
  var el = document.getElementById('livefx');
  if (!el) { el = document.createElement('div'); el.id = 'livefx'; el.className = 'livefx'; el.setAttribute('role', 'status'); hd.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(live1126.timer); live1126.timer = setTimeout(function () { el.classList.remove('show'); }, 4000);
}
function liveFx1126(os) {
  /* after a draw: a ring whose percentage changed sweeps from the old value and flashes; a number that changed bumps;
     the jobs done since the last draw show for a moment. A change of day resets without a flash. */
  if (live1126.day !== drawnDay) { live1126.day = drawnDay; live1126.p = {}; live1126.t = {}; live1126.done = os && typeof os.d === 'number' ? os.d : undefined; }
  var rings = document.querySelectorAll('.ring[data-k]'), i, el, k, nv, ov, tx;
  for (i = 0; i < rings.length; i++) {
    el = rings[i]; k = el.getAttribute('data-k'); nv = parseFloat(el.style.getPropertyValue('--p')) || 0; ov = live1126.p[k];
    if (ov !== undefined && ov !== nv) { el.style.setProperty('--p', ov); void el.offsetWidth; el.style.setProperty('--p', nv); el.classList.remove('moved'); void el.offsetWidth; el.classList.add('moved'); }
    live1126.p[k] = nv;
  }
  var nums = document.querySelectorAll('[data-k^="j3p:"],[data-k^="hdp:"],[data-k^="progp:"],[data-k^="areap:"]');
  for (i = 0; i < nums.length; i++) {
    el = nums[i]; k = el.getAttribute('data-k'); tx = el.textContent;
    if (live1126.t[k] !== undefined && live1126.t[k] !== tx) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    live1126.t[k] = tx;
  }
  if (os && typeof os.d === 'number') {
    if (live1126.done !== undefined && os.d !== live1126.done) { var n = os.d - live1126.done; liveToast((n > 0 ? '+' + n + ' job' + (n === 1 ? '' : 's') + ' done' : (-n) + ' job' + (n === -1 ? '' : 's') + ' undone') + ' · ' + os.d + ' of ' + os.w + ' · ' + os.pct + '%'); }
    live1126.done = os.d;
  }
}
window.SvcLive1126 = { fx: liveFx1126, toast: liveToast, notDone: function (dayId) { return notDoneHtml(dayId, jobStates(allEvents(), now())); } };
"""
COMPACT = V25.COMPACT_NEW
COMPACT = once(COMPACT, "<span class=\"ring xs ' + t + (full ? ' full' : '') + '\" style=\"--p:' + g.pct + '\"><span class=\"ic\">", "<span class=\"ring xs ' + t + (full ? ' full' : '') + '\" data-k=\"hd:' + t + '\" style=\"--p:' + g.pct + '\"><span class=\"ic\">", 'header ring')
COMPACT = once(COMPACT, "<span class=\"ctxt\"><b class=\"pct\">' + g.pct + '%</b>", "<span class=\"ctxt\"><b class=\"pct\" data-k=\"hdp:' + t + '\">' + g.pct + '%</b>", 'header percentage')

AREA_RING_OLD = "<span class=\"apct\"><span class=\"ring' + (s.finished ? ' full' : '') + '\" style=\"--p:' + s.pct + '\"><em>' + s.pct + '%</em></span></span>"
AREA_RING_NEW = "<span class=\"apct\"><span class=\"ring' + (s.finished ? ' full' : '') + '\" data-k=\"area:' + a.n + '\" style=\"--p:' + s.pct + '\"><em data-k=\"areap:' + a.n + '\">' + s.pct + '%</em></span></span>"
PROG_RING_OLD = "<span class=\"pn\">' + esc(label) + '</span><span class=\"ring' + (full ? ' full' : '') + '\" style=\"--p:' + s.pct + '\"><em' + (full ? ' class=\"full\"' : '') + '>' + s.pct + '%</em>"
PROG_RING_NEW = "<span class=\"pn\">' + esc(label) + '</span><span class=\"ring' + (full ? ' full' : '') + '\" data-k=\"prog:' + refWord + '\" style=\"--p:' + s.pct + '\"><em data-k=\"progp:' + refWord + '\"' + (full ? ' class=\"full\"' : '') + '>' + s.pct + '%</em>"
RENDER_TAIL_OLD = "  padForHeader();\n  if (focusId && document.activeElement !== document.getElementById(focusId)) refocus(focusId);\n}"
RENDER_TAIL_NEW = "  liveFx1126(os);\n  padForHeader();\n  if (focusId && document.activeElement !== document.getElementById(focusId)) refocus(focusId);\n}"
VIEW_OLD = "return '<p class=\"viewonly\">View only. To complete a job, scan the Pump out or Clean &amp; restock QR code printed for that reference.</p>' + auditHtml(day, st) + areasHtml(day, st);"
VIEW_NEW = "return '<p class=\"viewonly\">View only. To complete a job, scan the Pump out or Clean &amp; restock QR code printed for that reference.</p>' + notDoneHtml(day, st) + auditHtml(day, st) + areasHtml(day, st);"
LEFT_OLD = "'\">' + esc(r.ref) + (rs.d ? ' ' + rs.d + '/' + rs.w : '') + '</span>'"
LEFT_NEW = "'\">' + esc(r.ref) + missingIconsHtml(r, day, st) + (rs.d ? ' ' + rs.d + '/' + rs.w : '') + '</span>'"

CARD_ADD_CSS = ("@property --p{syntax:'<number>';inherits:false;initial-value:0}.ring{transition:--p .6s cubic-bezier(.2,.8,.2,1)}"
                "@keyframes svc-halo{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}@keyframes svc-breathe{0%,100%{opacity:.84;transform:scale(.97)}50%{opacity:1;transform:scale(1.05)}}"
                ".ring:not(.full)::after{animation:svc-halo 2.6s ease-in-out infinite}.ring:not(.full) .ic{animation:svc-breathe 2.6s ease-in-out infinite}"
                "@keyframes svc-flash{0%{opacity:1;transform:scale(1.3);border-width:3px}100%{opacity:.4;transform:scale(1);border-width:1px}}.ring.moved::after{animation:svc-flash 1.1s ease-out,svc-halo 2.6s ease-in-out 1.1s infinite}.ring.full.moved::after{animation:svc-flash 1.1s ease-out}"
                "@keyframes svc-bump{0%{transform:scale(1)}35%{transform:scale(1.25)}100%{transform:scale(1)}}.bump{display:inline-block;animation:svc-bump .7s cubic-bezier(.2,.9,.3,1.4)}"
                ".livefx{position:absolute;left:50%;bottom:-34px;transform:translate(-50%,-8px);padding:5px 12px;border-radius:999px;background:#0e151c;border:1px solid var(--done2);color:var(--done2);font-weight:800;font-size:13px;white-space:nowrap;box-shadow:var(--glow-d);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:6}.livefx.show{opacity:1;transform:translate(-50%,0)}"
                ".notdone{padding:14px}.notdone h3{margin:0 0 8px;font-family:var(--display);font-weight:800;font-size:22px;letter-spacing:.02em;color:var(--hivis2);text-shadow:var(--glow-h)}.notdone.missed h3{color:var(--warn);text-shadow:0 0 12px rgba(255,107,87,.6)}.notdone.clear h3{color:var(--done2);text-shadow:var(--glow-d)}"
                ".nd-all{margin:0;color:var(--done2);font-weight:700}.nd-sum{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:14px;color:var(--mute);margin-bottom:6px}.nd-sum>b{color:var(--ink);font-size:15px}"
                ".nd-job{display:inline-flex;align-items:center;gap:5px;padding:3px 10px 3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);font-variant-numeric:tabular-nums;color:var(--ink)}.nd-job svg{width:14px;height:14px}.nd-job b{font-weight:800;font-size:14px}.nd-job small{font-size:12px;color:var(--mute)}"
                ".nd-job.pump{color:#ffb347;border-color:rgba(255,179,71,.45)}.nd-job.clean{color:#5ef2c8;border-color:rgba(94,242,200,.45)}.nd-job.refill{color:#8fd0ff;border-color:rgba(95,180,255,.5)}.nd-job.lockup{color:var(--mute)}.nd-job b{color:inherit}.notdone.missed .nd-job{color:#ff9a8b;border-color:rgba(255,107,87,.55)}"
                ".nd-area{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 10px;padding:10px 0 8px;border-top:1px solid var(--line)}.nd-an{font-family:var(--display);font-weight:800;font-size:22px;line-height:1;color:var(--hivis2);text-shadow:0 0 10px rgba(255,138,50,.45)}.notdone.missed .nd-an{color:var(--warn)}"
                ".nd-ah{display:flex;flex-wrap:wrap;gap:2px 8px;align-items:baseline;font-size:13.5px;margin-bottom:6px}.nd-ah b{font-weight:700}.nd-ah span{color:var(--mute);font-size:12.5px;font-variant-numeric:tabular-nums}.nd-refs{display:flex;flex-wrap:wrap;gap:6px}"
                ".nd-ref{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:8px;background:#2a1a0d;border:1px solid #7a4418;color:var(--hivis2);font-weight:700;font-size:12.5px;font-variant-numeric:tabular-nums}.notdone.missed .nd-ref{background:#3a1611;border-color:#8a3a30;color:#ffb3a7}"
                ".nd-i{display:inline-flex;gap:3px;align-items:center;vertical-align:-2px;margin-left:2px}.nd-i i{display:inline-flex}.nd-i svg{width:12px;height:12px;display:block}.nd-i .pump{color:#ffb347}.nd-i .clean{color:#5ef2c8}.nd-i .refill{color:#5fb4ff}.nd-i .lockup{color:var(--mute)}.chip .nd-i{margin-left:4px}"
                "@media (prefers-reduced-motion:reduce){.ring::after,.ring .ic,.bump,.ring.moved::after{animation:none!important}.ring{transition:none}}\n")
CARD_CSS = V25.CARD_CSS + CARD_ADD_CSS

# ---- the page's servicing panel: its own registered property (the page uses --p elsewhere as a length), sweep and breathe
PANEL_FNS = once(V25.PANEL_FNS, "<span class=\"svc1123-ring\" style=\"--p:' + g.pct + '\">", "<span class=\"svc1123-ring\" style=\"--sp:' + g.pct + '\">", 'panel ring')
PANEL_CSS = once(V25.PANEL_CSS, '.svc1123-ring{--p:0;', '.svc1123-ring{--sp:0;', 'panel ring var')
PANEL_CSS = once(PANEL_CSS, 'calc(var(--p)*1%)', 'calc(var(--sp)*1%)', 'panel ring gradient')
PANEL_CSS += (" @property --sp{syntax:'<number>';inherits:false;initial-value:0} .svc1123-ring{transition:--sp .6s cubic-bezier(.2,.8,.2,1)}"
              " @keyframes svc1126-breathe{0%,100%{opacity:.84;transform:scale(.97)}50%{opacity:1;transform:scale(1.05)}} .svc1123-job:not(.full) .svc1123-ring .ic{animation:svc1126-breathe 2.6s ease-in-out infinite}"
              " @media (prefers-reduced-motion:reduce){.svc1123-ring .ic{animation:none!important}.svc1123-ring{transition:none}} ")


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.26 requires the live v11.25 page ' + BASE_SHA256)
    if 'liveFx1126' in text: raise ValueError('v11.26 already applied')
    text = rep(text, V25.PANEL_FNS, PANEL_FNS, 'panel: ring property', 'page')
    text = rep(text, V25.PANEL_CSS, PANEL_CSS, 'panel: sweep and breathe', 'page')
    text = rep(text, E(V25.CARD_FNS), E(CARD_FNS), 'card: keyed rings, not-done card, live effects', 'page')
    text = rep(text, E(V25.COMPACT_NEW), E(COMPACT), 'card: keyed header rings', 'page')
    text = rep(text, E(AREA_RING_OLD), E(AREA_RING_NEW), 'card: keyed area rings', 'page')
    text = rep(text, E(PROG_RING_OLD), E(PROG_RING_NEW), 'card: keyed progress rings', 'page')
    text = rep(text, E(RENDER_TAIL_OLD), E(RENDER_TAIL_NEW), 'card: live effects after each draw', 'page')
    text = rep(text, E(VIEW_OLD), E(VIEW_NEW), 'card: the not-done card at the top of the view', 'page')
    text = rep(text, E(LEFT_OLD), E(LEFT_NEW), 'card: missing-job icons on the still-to-go chips', 'page')
    text = rep(text, E(V25.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.25'; /* v8.19 release922", "+' · v11.26'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    for needle in ['function notDoneHtml', 'liveFx1126(os);', '@property --p{', 'window.SvcLive1126', 'esc(r.ref) + missingIconsHtml(r, day, st)', 'data-k="area:', 'data-k="prog:', 'data-k="hd:']:
        if h.count(needle) != 1: raise ValueError('the crew card template did not take v11.26 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    outside = text[:i] + text[j:]   # the page without the card's JSON line
    if outside.count('@property --p{') != 0 or outside.count('@property --sp{') != 1 or h.count('@property --sp{') != 0: raise ValueError('the page must register only --sp, the card only --p')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1126 applied: rings sweep and breathe, changes flash, a not-done card by area; footer v11.25 -> v11.26')
