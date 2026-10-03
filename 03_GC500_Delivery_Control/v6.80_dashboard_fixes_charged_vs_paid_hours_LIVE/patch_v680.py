#!/usr/bin/env python3
"""v6.80 - CHARGED HOURS AND PAID HOURS KEPT APART (Andrew, 26 Sep 2026).

"That's different - we charge V8s all hrs. We pay our workers or our casual staff what I told you."

  worked (charged)  start to finish, nothing taken off - the V8s are charged every hour. This is the hours figure on
                    Costs and everywhere else (build and demob back to 2,003.5 h, race weekend 159 h).
  paid              worked less the unpaid weekday break (30 min standard, a typed break wins; weekend breaks are
                    paid), then split normal / x1.5 / x2 by the person's type - only for what we pay our people.

Applied after patch_v679.py.
  python3 patch_v680.py <page.html>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    # the two readings of a shift
    t = R("""/* the hours of a shift: from start and finish, less the break, whenever both are there; else the hours typed */
function runHours(c){""", """/* v6.80 - the hours WORKED, start to finish with nothing taken off: what the V8s are charged; else the hours typed */
function runWorked(c){
 if (c.start && c.finish) { const h = shiftHours(c.start, c.finish, 0); if (h != null) return h; }
 const n = Number(c.hours); return c.hours != null && String(c.hours).trim() !== '' && Number.isFinite(n) ? n : null;
}
/* the hours PAID: start to finish less the unpaid break (pay only); hours typed without times are taken as they are */
function runHours(c){""", 'runWorked')
    t = R("""function runPay(split, rate){""", """function runPaidOf(s){ if (s.start && s.finish) { const h = shiftHours(s.start, s.finish, runBreak(s)); if (h != null) return h; } return s.hours || 0; }
function runPay(split, rate){""", 'runPaidOf')
    # Costs and the tracker count every hour worked
    t = R("""? runHours(c) : has(c.hours) ? num(c.hours) : shiftHours(c.start, c.finish, c.break_min); /* v6.78 - the running sheet's reading */""",
          """? runWorked(c) : has(c.hours) ? num(c.hours) : shiftHours(c.start, c.finish, c.break_min); /* v6.80 - every hour worked: the V8s are charged all hours */""", 'grade hours')
    # the normal / x1.5 / x2 split is of the paid hours
    t = R("""const b = splitHoursFor(h, s.date, personOf(s.person).type); /* v6.78 - by the person's type */""",
          """const b = splitHoursFor(runPaidOf(s), s.date, personOf(s.person).type); /* v6.80 - the pay split is of the paid hours (less the unpaid weekday break) */""", 'tracker split')
    t = R("""<div class="q">${h(L.to_date)} h worked, ${h(L.planned)} h planned · hours only</div>""",
          """<div class="q">${h(L.to_date)} h worked, ${h(L.planned)} h planned · every hour, start to finish, no break taken off</div>""", 'costs worked kpi')
    t = R("""<div class="l">Ordinary hours</div><div class="q">${h(L.at_1_5)} h at ×1.5 · ${h(L.at_2)} h at ×2 — his rule, shift by shift</div>""",
          """<div class="l">Paid — ordinary hours</div><div class="q">${h(L.at_1_5)} h at ×1.5 · ${h(L.at_2)} h at ×2 · ${h(r2h(L.ordinary + L.at_1_5 + L.at_2))} h paid after the unpaid weekday break — what we pay our people, shift by shift</div>""", 'costs paid kpi')
    t = R("""function trackerFigures(asOf){""", """const r2h = n => Math.round(n * 100) / 100;
function trackerFigures(asOf){""", 'r2h')
    # the running sheet: worked (charged) and paid side by side
    t = R("""const h = shift ? runHours(shift) : null, sp = h != null ? splitHoursFor(h, iso, P.type) : null;""",
          """const h = shift ? runHours(shift) : null, worked = shift ? runWorked(shift) : null, sp = h != null ? splitHoursFor(h, iso, P.type) : null;""", 'runDay worked')
    t = R("""return {name: n, P, type, rate, shift, hours: h, split: sp,""", """return {name: n, P, type, rate, shift, hours: h, worked, split: sp,""", 'runDay row')
    t = R("""hours: 0, to_date: 0, ordinary: 0, at_1_5: 0, at_2: 0, pay: 0, pay_hours_unrated: 0,""",
          """worked: 0, hours: 0, to_date: 0, ordinary: 0, at_1_5: 0, at_2: 0, pay: 0, pay_hours_unrated: 0,""", 'runTotals zero')
    t = R("""const sp = splitHoursFor(h, c.date, (pmap.get(c.person) || {}).type); x.hours += h; if (c.date <= td) x.to_date += h;""",
          """const sp = splitHoursFor(h, c.date, (pmap.get(c.person) || {}).type), w = runWorked(c) || 0; x.hours += h; x.worked += w; if (c.date <= td) x.to_date += w;""", 'runTotals worked')
    t = R(""".sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name));""", """.sort((a, b) => b.worked - a.worked || a.name.localeCompare(b.name));""", 'runTotals sort')
    t = R("""['hours', 'to_date', 'ordinary',""", """['worked', 'hours', 'to_date', 'ordinary',""", 'runTotals all')
    t = R("""<p class="sub">Type or change anyone's start and finish — the hours, the normal / ×1.5 / ×2 split,""",
          """<p class="sub"><b>Worked</b> is every hour from start to finish — what the V8s are charged. <b>Paid</b> is what we pay our people: less the unpaid weekday break, split normal / ×1.5 / ×2 by their type. Type or change anyone's start and finish — the hours, the split,""", 'rs sub')
    t = R("""<th class="num" title="unpaid break in minutes — empty takes the standard">Break</th><th class="num">Hours</th><th class="num">Normal</th>""",
          """<th class="num" title="unpaid break in minutes, taken off pay only — empty takes the standard">Unpaid break</th><th class="num" title="start to finish, nothing taken off — charged to the V8s">Worked (charged)</th><th class="num" title="worked less the unpaid break">Paid hrs</th><th class="num">Normal</th>""", 'rs head')
    t = R("""<td class="num"><b>${hh(r.hours)}</b></td><td class="num">${hh(r.split && r.split.ordinary)}</td>""",
          """<td class="num"><b>${hh(r.worked)}</b></td><td class="num">${hh(r.hours)}</td><td class="num">${hh(r.split && r.split.ordinary)}</td>""", 'rs row')
    t = R("""<td class="num"><b>${hh(tot('hours'))}</b></td><td class="num">${hh(sumSplit('ordinary'))}</td>""",
          """<td class="num"><b>${hh(tot('worked'))}</b></td><td class="num">${hh(tot('hours'))}</td><td class="num">${hh(sumSplit('ordinary'))}</td>""", 'rs day total')
    t = R("""<th>Person</th><th>Type</th><th class="num">Hours</th><th class="num">to date</th><th class="num">Normal</th>""",
          """<th>Person</th><th>Type</th><th class="num" title="start to finish — charged to the V8s">Worked (charged)</th><th class="num">worked to date</th><th class="num" title="less the unpaid weekday break">Paid hrs</th><th class="num">Normal</th>""", 'rt head')
    t = R("""<td class="num">${hh(x.hours)}</td><td class="num">${hh(x.to_date)}</td><td class="num">${hh(x.ordinary)}</td>""",
          """<td class="num"><b>${hh(x.worked)}</b></td><td class="num">${hh(x.to_date)}</td><td class="num">${hh(x.hours)}</td><td class="num">${hh(x.ordinary)}</td>""", 'rt row')
    t = R("""<td class="num"><b>${hh(T.all.hours)}</b></td><td class="num">${hh(T.all.to_date)}</td><td class="num">${hh(T.all.ordinary)}</td>""",
          """<td class="num"><b>${hh(T.all.worked)}</b></td><td class="num">${hh(T.all.to_date)}</td><td class="num">${hh(T.all.hours)}</td><td class="num">${hh(T.all.ordinary)}</td>""", 'rt total')
    t = R("""A break typed on a line always wins over the standard.</p>""",
          """A break typed on a line always wins over the standard. The break comes off pay only — the V8s are charged every hour worked, start to finish.</p>""", 'rules note')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
