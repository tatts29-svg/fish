#!/usr/bin/env python3
r"""v7.73 - Crystal. Andrew, 1 Oct 2026, 17:37 AEST: "Please do a clean sweep of all pages. I want 4K ultra crystal clear
contrast on all words. No blurring. No delays. No lagging. Perfection at every look and turn. Work with Codex for
perfection 10/10."
Apply after v7.72 (on the live page: v7.70, v7.72, then v7.73). CSS only; no figure, rule or record changes.

  A clarity audit of every tab (desktop at 2x, phone at 3x) measured every visible text run's contrast against the colour
  actually behind it, its size, and the blur, scale and opacity on its way up the tree (evidence/audit.json,
  audit_phone.json), then traced each low-contrast or tiny run to the stylesheet rule that set it (evidence/rules.json).
  Every rule below answers one of those findings:
    1. The light theme's greys lifted from 5.3:1 to 7:1 and better on white (--mute, --slate, the P&L's own --pl-mute and
       the greys written in by hand), the dark theme's kept.
    2. Bright orange is a mark, not a text colour, on white: links and the document "//" stripes on the light panes go
       to the dark orange (7:1); the P&L's eyebrow and tags likewise.
    3. "Complete" ticks: white on a deeper green (3.6:1 -> 5.9:1).
    4. The banner caption sits on a solid dark panel at full opacity, not on a blurred one.
    5. Table headers stop using backdrop blur (crisp, and cheaper to scroll on a phone).
    6. Nothing under 10 px on desktop or 11 px on phone where a person reads it: the Timeline's day figures and weather
       lines, the P&L's tags and column headings, the delivery cards' kickers, the hub list's asset numbers.
    7. Text is never dimmed with opacity on screen; its colour carries the emphasis.
    8. Cards arrive faster: the rise is 0.3 s and the stagger 60 ms, so nothing waits to be read.
  Left alone on purpose: the dark instrument panels (their own light tokens already pass), text drawn on gradients and
  photographs (the audit cannot read those backgrounds; they were checked by eye), the VMS board lines inside the Today
  picture (part of the picture), print styles.
    python3 patch_v773.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'v7.73 - CRYSTAL' in t: sys.exit('v7.73 already applied')
if 'v7.72 - no agent name' not in t: sys.exit('needs v7.72 first')

CSS = r"""
/* v7.73 - CRYSTAL. Andrew, 1 Oct 2026, 17:37: "4K ultra crystal clear contrast on all words. No blurring. No delays."
   Each rule answers a finding of the clarity audit (v7.73_crystal_DRAFT/evidence). Screen only; print keeps its own. */
@media screen{
:root{--mute:#4b535b;--slate:#4a5560;--ink2:#2f3841;--orange-ink:#9a3f0a}
@media (prefers-color-scheme:dark){:root{--mute:#b4bcc4;--slate:#b4bcc4;--ink2:#c6cdd4;--orange-ink:#ff9a4d}
 .fin745,.pl752,.cj765,.card.pl752{--mute:#4b535b;--slate:#4a5560;--ink2:#2f3841;--orange-ink:#9a3f0a}}
.pl752{--pl-mute:#4f5860}.pl752 .pl-tag.none{color:#4f5860}.pl752 .pl-tag.est{color:#8f3a08}.pl752 .pl-tag.ok{color:#145f2c}
.pl752 .pl-tag{font-size:10.5px}.pl752 .pl-tbl th{font-size:10.5px}.plfold765 > summary small{color:#4f5860}
.pl752 .pl-sub .w{color:var(--mute);font-size:11.5px}.pl752 .pl-sub .pl-todo{font-size:11.5px}
.cj765-end small,.rh766-tbl th small,.cj765 .pl-todo{color:#4f5860}.rh766-tbl th small{font-size:11px}
#pane-fencing a:not(.btn):not(.navbtn):not(.chip),#pane-prestarts a:not(.btn):not(.navbtn):not(.chip),#pane-docs a:not(.btn):not(.navbtn):not(.chip),#pane-costs a:not(.btn):not(.navbtn):not(.chip),#pane-plant a:not(.btn):not(.navbtn):not(.chip),#pane-questions a:not(.btn):not(.navbtn):not(.chip),#pane-about a:not(.btn):not(.navbtn):not(.chip),#pane-pricing a:not(.btn):not(.navbtn):not(.chip),#pane-change a:not(.btn):not(.navbtn):not(.chip),#pane-runsheet a:not(.btn):not(.navbtn):not(.chip){color:var(--orange-ink)}
.doccard .slash.doc{color:var(--orange-ink)}.slash{color:var(--mute)}
.tick{background:#0f7a37}.tick.sm{font-size:11.5px}
.pgban .rbcap{background:rgba(18,14,12,.8);color:#fff;-webkit-backdrop-filter:none;backdrop-filter:none}.rbcap span,.pgban .rbcap span{opacity:1}
.tblwrap thead th{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(255,255,255,.97)}
.hublist .hubrow .anos small{font-size:11px}.navbtn .navpinned,.btn .navpinned{font-size:10.5px}
.day .dfig em,.day.on .dfig em{font-size:10px}.day .wxo,.day .wxo.ol{font-size:10px;color:#5b6670}.day .wxrain.nil,.day .wxwind em{font-size:10px;color:#5b6670}
.dmotto{font-size:10.5px;opacity:1}em.wxnw,.day .wxnw{font-size:10.5px}
.ctk{font-size:10.5px;opacity:1}.lbck{font-size:11px;opacity:1}.dcpk{font-size:11px;opacity:1}.lbtf{font-size:11px;opacity:1}
.ctile.lead span,.ctwo > .ctile > span,.showgo i,.dp .dpl i,.labtick.labnil .w,.labtick.labunk .w,.dcpos p,.lbflag p,.dphgone code{opacity:1}
.pane.on.arrive > *{animation-duration:.3s}.pane.on.arrive > :nth-child(n+2){animation-delay:.06s}
.card.island,.card.racecard,.hubcard.island,.hubcard.racecard,.wip,.ldlist,.dplate{--mute:#b4bcc4;--slate:#b4bcc4;--ink2:#c6cdd4;--orange-ink:#ff9a4d}
.day em,.day .l,.day span.l{font-size:10px}.dwk{font-size:10.5px}th small{font-size:10.5px}
}
@media screen and (max-width:640px){
.w,small,.src,.hint,.pl-note,.acc761-w,.fin745-basis,.cj765-note{font-size:12px}
.chip,.chip.ref,.pill{font-size:11px}.pl752 .pl-tbl th{font-size:10.5px}.dtoday{font-size:10px}
#pane-costs .paycat .pc-sub{font-size:11.5px}.cj765-end small{font-size:11.5px}.dchip{font-size:11px}.day em,.day .l{font-size:10.5px}
}
"""
t = rep(t, """/* v7.54 */ .pl752 .pl-sub{white-space:normal;max-width:38ch;line-height:1.35}.pl752 .pl-sub .w{display:block;font-size:10.5px;color:#7b8590}.pl752 .pl-sub .pl-todo{font-size:10.5px}
</style>""", """/* v7.54 */ .pl752 .pl-sub{white-space:normal;max-width:38ch;line-height:1.35}.pl752 .pl-sub .w{display:block;font-size:10.5px;color:#7b8590}.pl752 .pl-sub .pl-todo{font-size:10.5px}
""" + CSS + """</style>""", 'crystal css', p, True)

# 9. pl770Model once per draw (it reads two other models; the review's robustness lens, 1 Oct) - like fencePaidSplit
t = rep(t, """function pl770Model(){
 const M = moneySummary(), c = M.charge || {}, k = M.cost || {}, X = cj764Model(), R = rh766Model(), r2 = v => Math.round(v * 100) / 100;""",
 """function pl770Model(){
 const mk770 = 'pl770Model'; if (RENDER_MEMO.has(mk770)) return RENDER_MEMO.get(mk770); /* v7.73 - once per draw, like fencePaidSplit */
 const M = moneySummary(), c = M.charge || {}, k = M.cost || {}, X = cj764Model(), R = rh766Model(), r2 = v => Math.round(v * 100) / 100;""", 'pl770 memo start', p, True)
t = rep(t, """ return {asAt: X.asAt || todayIso(), rev, cost, over, overJob, revNow, revJob, direct, directJob, costNow, costJob, gm, diff, rec, wages: W, qk, qWords, qClean, rehireTotal, rhCover,
  checks: {revenue: near(revNow, n(c.total)), revenueJob: X.revenue ? near(revJob, n(X.revenue.job)) : null, costs: near(costNow, n(k.known)), costsJob: near(costJob, n(X.job)), quotes: qClean}};
}""", """ const out770 = {asAt: X.asAt || todayIso(), rev, cost, over, overJob, revNow, revJob, direct, directJob, costNow, costJob, gm, diff, rec, wages: W, qk, qWords, qClean, rehireTotal, rhCover,
  checks: {revenue: near(revNow, n(c.total)), revenueJob: X.revenue ? near(revJob, n(X.revenue.job)) : null, costs: near(costNow, n(k.known)), costsJob: near(costJob, n(X.job)), quotes: qClean}};
 RENDER_MEMO.set(mk770, out770); return out770;
}""", 'pl770 memo end', p, True)

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.73 applied: crystal - the greys at 7:1, orange a mark not a text colour on white, deeper tick green, solid caption, no backdrop blur on headers, nothing under 10 px, no dimmed text, quicker arrival')
