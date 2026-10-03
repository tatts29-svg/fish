#!/usr/bin/env python3
"""v6.69e - the header's day pod counts deliveries in, so a day with none (26 Sep: nothing in; 27 Sep: one out, none in)
is passed over for the next day that has some, and says so: "next delivery day". It read 0 / 0 / 0 while the Timeline
had ten due in on Monday.
  python3 patch_v669e.py <page.html> [builder.py]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep
def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = rep(t, """const today = todayIso(), days = programmeDays();
 const dayNow = days.find(d => d.iso === today) || null, next = days.find(d => d.iso > today) || null, show = dayNow || next;""",
 """const today = todayIso(), days = programmeDays();
 /* v6.69 - the pod counts deliveries in, so a day with none in is passed over for the next day that has some */
 const withIn = days.find(d => d.iso >= today && d.deliveries.length) || null;
 const show = withIn || days.find(d => d.iso === today) || days.find(d => d.iso > today) || null, dayNow = show && show.iso === today ? show : null;
 const nextIn = !!(withIn && show === withIn && !dayNow);""", 'pod day', path, need)
    t = rep(t, "return {d, dayNow: !!dayNow, due: due.length,", "return {d, dayNow: !!dayNow, nextIn, due: due.length,", 'pod ret', path, need)
    t = rep(t, "<b>${esc(f.d.dow)}</b> · ${f.dayNow ? 'today' : 'next programme day'}</span>",
               "<b>${esc(f.d.dow)}</b> · ${f.dayNow ? 'today' : f.nextIn ? 'next delivery day' : 'next programme day'}</span>", 'pod label', path, need)
    t = rep(t, "subOn: onsite === due.length && due.length ? 'all of them' : 'so far today'",
            "subOn: onsite === due.length && due.length ? 'all of them' : dayNow ? 'so far today' : 'already recorded'", 'pod subOn', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
patch(sys.argv[1], True)
if len(sys.argv) > 2: patch(sys.argv[2], False)
