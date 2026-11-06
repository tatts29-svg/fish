"""Author: Andrew Fisher. v11.23 - three jobs, three percentages, water in the completion: Pump out, Clean & restock,
Water checked / refilled.

Andrew, 22 Oct 2026: "As we are doing references who ever is doing the water refil. They just need to tick complete. This
confirms everything for this reference has been confirmed level is ok or has been refilled. So lets do a completion
percentage for checking refiling water. This uses the current clean and restock qr code which is used. So we should have a
completion percentage done for pump out. One for clean and restock and another for Water checked/refilled. Everything is
time stamped. Its a way to work out what is getting done. Capture anything that is not getting done. Or even missed. But we
want this to look really good and amazing for people using it". Then: "I think we add the water to the completion".

On the live v11.22 page:
- the tracker definition (page data and the card bundle's copy): the v11.22 "Water checked" job goes; the one water job keeps
  its key `refill` (so any Refilled tap already made counts) and is relabelled "Water checked / refilled" - one tap a
  reference on the clean code, meaning every unit there is right, filled or not needed. It is a counted job like the other
  two: the extras list is empty, so the overall completion is pump + clean + water (Andrew: "we add the water to the
  completion"). On a reference with FWF or accessible units the night's jobs are pump, clean, water; blocks, sewer, tanks
  and pump-only lines are unchanged;
- the crew card: three rings - Pump out (hi-vis), Clean & restock (mint), Water (blue) - with icon, percentage, done of all,
  to go and the last time, under the progress bars for the area and for everything; the sticky header carries the three as
  small rings sized for a phone (the final day, lock-up only, falls back to the one Everything ring); every area header in
  the list carries three chips; the per-area fold lists the jobs with times; each job button carries its icon and the water
  button is blue with its own hint. The overall completion ring, the audit log, the tables and the printed codes are
  unchanged;
- the page's servicing panel (Event nights): the same three rings under the whole-night meter and three chips on each area
  row; the whole-night meter and the per-reference table now count water;
- footer v11.22 -> v11.23.

    python3 patch_v1123.py page.html      (in place, on the live v11.22 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.22_water_tally_LIVE'))
from rep import rep
import patch_v1122 as V22   # the v11.22 blocks this release replaces, byte for byte
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V22.card_escape

DATA_EDITS = [  # twice each: `var SVC1067_DATA=` (the panel) and SVC1067_CARD.data (what the admin fold publishes)
    ('"check":"Water checked","refill":"Refilled"', '"refill":"Water checked / refilled"'),
    ('"extras":["check","refill"]', '"extras":[]'),
    ('"clean":{"label":"Clean & restock","tasks":["clean","lockup","check","refill"]}', '"clean":{"label":"Clean & restock","tasks":["clean","lockup","refill"]}'),
    ('"fwf":{"night":["pump","clean","check","refill"],"final":["lockup"]}', '"fwf":{"night":["pump","clean","refill"],"final":["lockup"]}'),
    ('"access":{"night":["pump","clean","check","refill"],"final":["lockup"]}', '"access":{"night":["pump","clean","refill"],"final":["lockup"]}'),
]

ICON_JS = """{
  pump: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11h10a3 3 0 0 1 3 3v4H3z"/><path d="M16 14h2.2a2.8 2.8 0 0 1 2.8 2.8V18h-5z"/><circle cx="6.5" cy="19.5" r="1.7"/><circle cx="13.5" cy="19.5" r="1.7"/><path d="M8 11V6.5h5V11" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  clean: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.9 5.3L19.2 9l-5.3 1.9L12 16.2l-1.9-5.3L4.8 9l5.3-1.7z"/><path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/><path d="M5 15l.7 1.7 1.7.7-1.7.7L5 19.8l-.7-1.7-1.7-.7 1.7-.7z"/></svg>',
  refill: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-3.6 5-7 8.6-7 12.4a7 7 0 0 0 14 0c0-3.8-3.4-7.4-7-12.4z"/></svg>',
  lockup: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3h1.5A1.5 1.5 0 0 1 20 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-8A1.5 1.5 0 0 1 5.5 10zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>'
}"""

CARD_FNS = """/* v11.23 - three jobs, three percentages: Pump out, Clean & restock, Water checked / refilled. Water is one tap a reference on
   the clean code: every unit there is right, filled or not needed. It counts in the completion like the other two.
   Andrew, 22 Oct 2026: "a completion percentage done for pump out. One for clean and restock and another for Water
   checked/refilled. Everything is time stamped" ... "I think we add the water to the completion". */
var JOBS3 = ['pump', 'clean', 'refill'];
var JOB_ICON = """ + ICON_JS + """;
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
    return '<div class="j3 ' + t + (full ? ' full' : '') + '"><span class="ring sm ' + t + (full ? ' full' : '') + '" style="--p:' + g.pct + '"><b>' + g.pct + '%</b></span><span class="j3t">' + JOB_ICON[t] + '<b>' + esc(TASKS[t] || t) + '</b><small>' + g.d + ' of ' + g.w + (full ? ' · all done' : ' · ' + left + ' to go') + '</small>' + (g.last ? '<small>last ' + hm(g.last) + '</small>' : '') + '</span></div>';
  }).join('') + '</div>';
}
function jobChipsHtml(refs, day, st) {
  var o = jobStats3(refs, day, st), ts = JOBS3.filter(function (t) { return o[t].w > 0; });
  if (!ts.length) return '';
  return '<span class="jchips">' + ts.map(function (t) { var g = o[t]; return '<span class="jchip ' + t + (g.d >= g.w ? ' full' : '') + '" title="' + esc(TASKS[t] || t) + ' ' + g.d + ' of ' + g.w + '">' + JOB_ICON[t] + '<b>' + g.pct + '%</b></span>'; }).join('') + '</span>';
}
"""
COMPACT_OLD = """function compactHtml(day, os, st) {
  var a = mode === 'tick' ? AREA_OF[curRef] : null;
  var as = a ? groupStats(a.refs, day, st) : null;
  var cell = function (label, s) { var full = s.w > 0 && s.d >= s.w, left = Math.max(0, s.w - s.d); return '<span class="ccell"><span class="ring sm' + (full ? ' full' : '') + '" style="--p:' + s.pct + '"><b' + (full ? ' class="full"' : '') + '>' + s.pct + '%</b></span><span class="ctxt">' + label + '<small>' + (full ? 'all done' : left + ' to go') + '</small></span></span>'; };
  return '<span class="compact-day">' + esc(shortDay(day)) + '</span>' + (as ? cell(a.n ? 'Area ' + a.n : esc(a.name), as) : '') + cell('Everything', os);
}"""
COMPACT_NEW = """function compactHtml(day, os, st) {
  /* v11.23 - the sticky header carries the three jobs for where the phone is: this code's area, or everything. A day with
     none of the three (the final lock-up) keeps the one Everything ring. */
  var a = mode === 'tick' ? AREA_OF[curRef] : null, refs = a ? a.refs : ALL_REFS, o = jobStats3(refs, day, st), where = a ? (a.n ? 'Area ' + a.n : a.name) : 'Everything';
  var cells = JOBS3.filter(function (t) { return o[t].w > 0; }).map(function (t) { var g = o[t], full = g.d >= g.w; return '<span class="ccell ' + t + '"><span class="ring xs ' + t + (full ? ' full' : '') + '" style="--p:' + g.pct + '"><b>' + g.pct + '%</b></span><span class="ctxt">' + JOB_ICON[t] + '<b>' + (full ? 'all' : g.w - g.d) + '</b><small>' + (full ? 'done' : 'to go') + '</small></span></span>'; }).join('');
  if (!cells) { var full = os.w > 0 && os.d >= os.w; cells = '<span class="ccell one"><span class="ring sm' + (full ? ' full' : '') + '" style="--p:' + os.pct + '"><b>' + os.pct + '%</b></span><span class="ctxt"><b>' + (full ? 'all' : Math.max(0, os.w - os.d)) + '</b><small>' + (full ? 'done' : 'to go') + '</small></span></span>'; }
  return '<span class="compact-day">' + esc(shortDay(day)) + '<small>' + esc(where) + '</small></span>' + cells;
}"""
TASKPROG_OLD = """function taskProgress(refs, day, st) {
  var stats = SvcState.taskStats(D, refs, day, st);
  return '<dl class="task-progress">' + Object.keys(stats).map(function (task) {
    var s = stats[task];
    return '<div><dt>' + esc(TASKS[task] || task) + '</dt><dd' + (s.w > 0 && s.d >= s.w ? ' class="full"' : '') + '>' + s.d + '/' + s.w + ' jobs · ' + s.pct + '%' + (s.w > s.d ? ' · ' + (s.w - s.d) + ' to go' : '') + '</dd></div>';
  }).join('') + '</dl>';
}"""
TASKPROG_NEW = """function taskProgress(refs, day, st) {
  /* v11.23 - every job on the day with its icon and last time: the three first, then any other (the final lock-up) */
  var tasks = JOBS3.slice(); Object.keys(SvcState.taskStats(D, refs, day, st)).forEach(function (t) { if (tasks.indexOf(t) < 0) tasks.push(t); });
  var o = jobStatsFor(tasks, refs, day, st);
  return '<dl class="task-progress">' + tasks.filter(function (t) { return o[t].w > 0; }).map(function (t) {
    var s = o[t];
    return '<div class="' + t + '"><dt>' + (JOB_ICON[t] || '') + esc(TASKS[t] || t) + '</dt><dd' + (s.w > 0 && s.d >= s.w ? ' class="full"' : '') + '>' + s.d + '/' + s.w + ' · ' + s.pct + '%' + (s.w > s.d ? ' · ' + (s.w - s.d) + ' to go' : '') + (s.last ? ' · last ' + hm(s.last) : '') + '</dd></div>';
  }).join('') + '</dl>';
}"""
JOB_CLS_OLD = "var extra = isExtra(task), cls = 'job' + (extra ? ' extra' : '') + (s ? (s.local ? ' pending' : ' done') : '');"
JOB_CLS_NEW = "var extra = isExtra(task), cls = 'job t-' + task + (extra ? ' extra' : '') + (s ? (s.local ? ' pending' : ' done') : '');"
JOB_LABEL_OLD = "TICK + '</span><span class=\"jtxt\"><b>' + esc(label) + '</b><small>' + esc(sub) + '</small></span></button>'"
JOB_LABEL_NEW = "TICK + '</span><span class=\"jtxt\"><b>' + (JOB_ICON[task] || '') + esc(label) + '</b><small>' + esc(sub) + '</small></span></button>'"
HINT_OLD = "extra ? (task === 'check' ? 'Tap when the water is checked · not counted in %' : 'Tap if refilled · not counted in %') : 'Tap to complete'"
HINT_NEW = "task === 'refill' ? 'Tap when the water is checked or refilled' : extra ? 'Tap to complete · not counted in %' : 'Tap to complete'"

CARD_CSS = (".ring.xs{width:42px;height:42px}.ring.xs::before{inset:5px}.ring.xs b{font-size:13px}"
            ".ring.clean{background:conic-gradient(#5ef2c8 calc(var(--p)*1%),#1b2630 0);box-shadow:0 0 16px rgba(94,242,200,.45),0 0 0 2px #0e151c inset}.ring.clean em,.ring.clean b{color:#5ef2c8;text-shadow:0 0 10px rgba(94,242,200,.55)}"
            ".ring.refill{background:conic-gradient(#5fb4ff calc(var(--p)*1%),#1b2630 0);box-shadow:0 0 16px rgba(95,180,255,.5),0 0 0 2px #0e151c inset}.ring.refill em,.ring.refill b{color:#8fd0ff;text-shadow:0 0 10px rgba(95,180,255,.6)}"
            ".ring.full,.ring.clean.full,.ring.refill.full{background:conic-gradient(var(--done2) calc(var(--p)*1%),#1b2630 0);box-shadow:var(--glow-d),0 0 0 2px #0e151c inset}.ring.full b,.ring.full em{color:var(--done2);text-shadow:var(--glow-d)}"
            ".jobs3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 2px}.j3{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:10px 6px 9px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);min-width:0}"
            ".j3.pump{border-color:rgba(255,179,71,.35)}.j3.clean{border-color:rgba(94,242,200,.35)}.j3.refill{border-color:rgba(95,180,255,.45)}.j3.full{border-color:rgba(125,255,208,.6);background:rgba(46,240,171,.08)}"
            ".j3t{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12.5px;line-height:1.2;min-width:0}.j3t svg{width:18px;height:18px}.j3.pump .j3t svg{fill:#ffb347}.j3.clean .j3t svg{fill:#5ef2c8}.j3.refill .j3t svg{fill:#5fb4ff}.j3.full .j3t svg{fill:var(--done2)}.j3t b{font-weight:700}.j3t small{color:var(--mute);font-size:11px;font-variant-numeric:tabular-nums}"
            ".jchips{display:inline-flex;gap:5px;margin-right:8px;vertical-align:middle}.jchip{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}.jchip svg{width:12px;height:12px}.jchip.pump{color:#ffb347}.jchip.pump svg{fill:#ffb347}.jchip.clean{color:#5ef2c8}.jchip.clean svg{fill:#5ef2c8}.jchip.refill{color:#8fd0ff}.jchip.refill svg{fill:#5fb4ff}.jchip.full{color:var(--done2);border-color:rgba(125,255,208,.5)}.jchip.full svg{fill:var(--done2)}"
            ".compact{gap:4px}.compact-day{font-size:12px;line-height:1.15;max-width:78px;flex-shrink:0}.compact-day small{display:block;font-size:10.5px;color:var(--mute);font-weight:600}"
            ".ccell{gap:5px;flex-shrink:0}.ccell .ctxt{display:grid;justify-items:center;text-align:center;font-size:11px;line-height:1.1;font-weight:800;font-variant-numeric:tabular-nums}.ccell .ctxt svg{width:13px;height:13px;display:block}.ccell.pump .ctxt svg{fill:#ffb347}.ccell.clean .ctxt svg{fill:#5ef2c8}.ccell.refill .ctxt svg{fill:#5fb4ff}.ccell .ctxt small{font-size:9.5px;font-weight:600;color:var(--mute)}.ccell.pump .ctxt b{color:#ffb347}.ccell.clean .ctxt b{color:#5ef2c8}.ccell.refill .ctxt b{color:#8fd0ff}.ccell .ring.full+.ctxt b{color:var(--done2)}.ccell.one .ctxt{font-size:13px}"
            ".task-progress dt svg{width:13px;height:13px;vertical-align:-2px;margin-right:5px}.task-progress .pump dt svg{fill:#ffb347}.task-progress .clean dt svg{fill:#5ef2c8}.task-progress .refill dt svg{fill:#5fb4ff}.task-progress .lockup dt svg{fill:var(--mute)}"
            ".jtxt b svg{width:15px;height:15px;vertical-align:-2px;margin-right:6px}.job.t-pump .jtxt b svg{fill:#ffb347}.job.t-clean .jtxt b svg{fill:#5ef2c8}.job.t-refill .jtxt b svg{fill:#5fb4ff}.job.t-lockup .jtxt b svg{fill:var(--mute)}.job.done .jtxt b svg{fill:var(--done2)}"
            ".job.t-refill{border-color:#3f7fb8;background:linear-gradient(180deg,#172a3a,#111c27);box-shadow:0 0 0 1px rgba(95,180,255,.14),0 0 18px rgba(95,180,255,.14)}.job.t-refill .jbox{border-color:#5fb4ff}.job.t-refill.pending{background:#2f2810;border-color:var(--wait);box-shadow:var(--glow-w)}.job.t-refill.done{background:linear-gradient(180deg,#123a2d,#0c2b21);border-color:var(--done);box-shadow:var(--glow-d)}.job.t-refill.done .jbox{border-color:var(--done)}"
            ".job.extra{border-style:dashed}.job.extra b::after{content:\"\"}\n")

PANEL_FNS = r"""/* v11.23 - three jobs, three percentages on the panel: Pump out, Clean & restock, Water checked / refilled; water counts in the
   completion like the other two. Andrew, 22 Oct 2026. */
var JOBS1123 = ['pump', 'clean', 'refill'];
var JOB_ICON1123 = """ + ICON_JS + r""";
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
    return '<div class="svc1123-job ' + t + (full ? ' full' : '') + '"><span class="svc1123-ring" style="--p:' + g.pct + '"><b>' + g.pct + '%</b></span><span class="svc1123-t">' + JOB_ICON1123[t] + '<b>' + esc(M.D.tasks[t] || t) + '</b><small>' + g.d + ' of ' + g.w + (full ? ' · all done' : ' · ' + (g.w - g.d) + ' to go') + (g.last ? ' · last ' + esc(M.S.hm(g.last)) : '') + '</small></span></div>';
  }).join('') + '</div>';
}
"""
PANEL_CSS = ("/* v11.23 three jobs */ .svc1123-jobs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0 4px}"
             " .svc1123-job{--c:#ffb347;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.10);min-width:0}"
             " .svc1123-job.clean{--c:#5ef2c8} .svc1123-job.refill{--c:#5fb4ff} .svc1123-job.full{--c:#7dffd0;border-color:rgba(125,255,208,.5);background:rgba(46,240,171,.08)}"
             " .svc1123-ring{--p:0;position:relative;display:inline-grid;place-items:center;width:56px;height:56px;border-radius:50%;flex-shrink:0;background:conic-gradient(var(--c) calc(var(--p)*1%),#1f2a30 0);box-shadow:0 0 12px color-mix(in srgb,var(--c) 45%,transparent)}"
             " .svc1123-ring::before{content:'';position:absolute;inset:6px;border-radius:50%;background:#0f171c} .svc1123-ring b{position:relative;z-index:1;font-weight:800;font-size:15px;color:var(--c);font-variant-numeric:tabular-nums}"
             " .svc1123-t{display:flex;flex-direction:column;gap:2px;min-width:0;font-size:13px;line-height:1.25} .svc1123-t svg{width:14px;height:14px;fill:var(--c)} .svc1123-t b{font-weight:700} .svc1123-t small{color:#9cb0c2;font-size:11.5px;font-variant-numeric:tabular-nums}"
             " .svc1123-chips{display:inline-flex;gap:5px;margin:0 0 0 auto} .svc1123-chip{--c:#ffb347;display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;font-size:12px;font-weight:800;color:var(--c);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);font-variant-numeric:tabular-nums}"
             " .svc1123-chip.clean{--c:#5ef2c8} .svc1123-chip.refill{--c:#8fd0ff} .svc1123-chip.full{--c:#7dffd0;border-color:rgba(125,255,208,.5)} .svc1123-chip svg{width:12px;height:12px;fill:var(--c)}"
             " @media (max-width:720px){.svc1123-jobs{grid-template-columns:1fr}} ")


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.23 requires the live v11.22 page ' + BASE_SHA256)
    if 'svc1123-jobs' in text: raise ValueError('v11.23 already applied')
    for old, new in DATA_EDITS:
        if text.count(old) != 2: raise ValueError('tracker definition anchor is not exactly twice on the page: ' + old[:60])
        text = text.replace(old, new)
    text = rep(text, 'Water checked added as an extra on the clean code (Andrew, 22 Oct)', 'Water checked / refilled is the one water job, counted in the completion, on the clean code (Andrew, 22 Oct)', 'tracker data version', 'page')
    # the page's servicing panel: the v11.22 water line becomes three rings; areas get three chips
    text = rep(text, V22.PANEL_FNS, PANEL_FNS, 'panel: three-job functions', 'page')
    text = rep(text, "waterHtml(M, cfg, st, all, 'overall')", "jobs1123Html(M, cfg, st, all, 'overall')", 'panel: overall three rings', 'page')
    text = rep(text, "waterHtml(M,cfg,st,a.refs,'area')", "jobs1123Html(M,cfg,st,a.refs,'area')", 'panel: area chips', 'page')
    text = rep(text, V22.PANEL_CSS, PANEL_CSS, 'panel: style', 'page')
    # the crew card template, inside its JSON string
    text = rep(text, E(V22.CARD_FNS), E(CARD_FNS), 'card: three-job functions', 'page')
    text = rep(text, E(COMPACT_OLD), E(COMPACT_NEW), 'card: sticky header with the three rings', 'page')
    text = rep(text, E(TASKPROG_OLD), E(TASKPROG_NEW), 'card: progress by job with times', 'page')
    text = rep(text, E("bars = progHtml(areaLabel(a), groupStats(a.refs, day, st), 'area') + waterHtml(a.refs, day, st, 'area') + progHtml('Everything', os, 'all') + waterHtml(ALL_REFS, day, st, 'all');"),
               E("bars = progHtml(areaLabel(a), groupStats(a.refs, day, st), 'area') + jobsRowHtml(a.refs, day, st, 'area') + progHtml('Everything', os, 'all') + jobsRowHtml(ALL_REFS, day, st, 'all');"), 'card: three rings under the bars (tick mode)', 'page')
    text = rep(text, E("} else bars = progHtml('Everything · ' + longDay(day), os, 'all') + waterHtml(ALL_REFS, day, st, 'all');"), E("} else bars = progHtml('Everything · ' + longDay(day), os, 'all') + jobsRowHtml(ALL_REFS, day, st, 'all');"), 'card: three rings under the bar (view mode)', 'page')
    text = rep(text, E("'<span class=\"ameta\">' + waterHtml(a.refs, day, st, 'small') + (s.finished ?"), E("'<span class=\"ameta\">' + jobChipsHtml(a.refs, day, st) + (s.finished ?"), 'card: three chips on each area header', 'page')
    text = rep(text, E("'</div>' + waterHtml([r], day, st, 'ref') +"), E("'</div>' +"), 'card: the reference card shows its jobs, not a water line', 'page')
    text = rep(text, E(JOB_CLS_OLD), E(JOB_CLS_NEW), 'card: a job button carries its task', 'page')
    text = rep(text, E(JOB_LABEL_OLD), E(JOB_LABEL_NEW), 'card: a job button carries its icon', 'page')
    text = rep(text, E(HINT_OLD), E(HINT_NEW), 'card: the water hint', 'page')
    text = rep(text, E(V22.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.22'; /* v8.19 release922", "+' · v11.23'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    if card['html'].count('<script') != 1 or '/*SVC1067_DATA*/null' not in card['html'] or 'function jobsRowHtml' not in card['html'] or 'waterHtml' in card['html']: raise ValueError('the crew card template did not take the three jobs cleanly')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or 'check' in card['data']['tasks'] or card['data']['extras'] != []: raise ValueError('the card bundle data did not take the one counted water job')
    if 'waterHtml' in text: raise ValueError('a v11.22 water call is still on the page')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1123 applied: one water job "Water checked / refilled", counted in the completion; three rings on the card and the panel; footer v11.22 -> v11.23')
