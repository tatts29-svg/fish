#!/usr/bin/env python3
"""v7.00 - the day's documents on the Timeline's day card. The row is exactly [Pre-start] [Drivers] [Install] [Email v]:
 - Pre-start: the v6.97 Coates Installs pre-start (ps7Print), enabled once its batch day has come, greyed before
   ("Prefilled automatically on <batch day>"), not shown on a day gone by;
 - Drivers: GC500-DRV-01, one A4 page per load, for the branch to print for the drivers;
 - Install: GC500-INS-01, one A4 page per load, for the install team on site;
 - Email: a drop-down (Pre-start / Drivers / Install) that opens a mailto with no recipient - a short note, the loads one
   line each, the SWMS titles with their view links and ONE view link to that day's document - and a
   "Copy the email text" beside each.
 Print the day, Delivery advice, Email the advice, Email this day, Copy link and Add an asset to this day leave the row;
 their functions and wiring stay. New hash routes #print/drivers/<iso>, #print/install/<iso> and #print/prestart/<iso>
 open the day and its document, with a Print / Save as PDF bar in case the browser does not open the dialog itself.
 Applies to v6.96 live or to the v6.99 draft (the Timeline and the router are the same in both).
   python3 patch_v700.py <page.html> [dayprint700_src.js] [dayprint700.css]"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402

ROW_START = '${full ? (() => { const got = arrivalsOn(d.iso).length; return `<div class="daynav"><button class="btn primary editonly tabsoff" data-add-day="${esc(d.iso)}"'
ROW_END = '<button class="btn" data-copy-day="${esc(d.iso)}">Copy link</button></div>`; })() : \'\'}'


def patch(path, jsf, cssf, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function dpPrint(' in t: sys.exit('v7.00 already applied')
    if 'function ps7Print(' not in t: sys.exit('this page has no v6.97 pre-start (ps7Print): the Pre-start button calls it')
    if 'const PS7 = ' not in t: sys.exit('this page has no v6.97 pre-start data (PS7): the Life Saving Rules and the install list come from it')
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
    import re
    bad = [m.group(0) for m in re.finditer(r"[ ]\.(?:dp|ps7|btn|lsr|daynav)[A-Za-z_-]*", js)]
    if bad: sys.exit('the source holds a space before a class selector, which the attribution scrub folds: %r' % bad[:5])
    # 1. the code, just ahead of the day's run sheet it sits beside
    t = rep(t, "function dayPrint(iso){", js + "function dayPrint(iso){", 'code', path, need)
    # 2. the day row: exactly Pre-start, Drivers, Install, Email
    a, b = t.count(ROW_START), t.count(ROW_END)
    if a != 1 or b != 1: sys.exit('day row anchors: start %d, end %d' % (a, b))
    i = t.index(ROW_START); j = t.index(ROW_END, i) + len(ROW_END)
    old = t[i:j]
    for w in ('Add an asset to this day', 'Delivery advice', 'Email the advice', 'Email this day', 'Print the day', 'Copy link'):
        if w not in old: sys.exit('day row: %r not where expected' % w)
    t = t[:i] + '${full ? `<div class="daynav dprow tlday-ctl" role="group" aria-label="This day\'s documents">${dpDayButtons(d)}</div>` : \'\'}' + t[j:]
    # 3. the wiring (the old row's handlers stay; they find nothing to wire)
    w_ = "pane.querySelectorAll('[data-print-day]').forEach(n => n.onclick = () => dayPrint(n.dataset.printDay));"
    t = rep(t, w_, w_ + "\n dpWireDay(pane);   /* v7.00 - Pre-start, Drivers, Install, Email */", 'wire', path, need)
    # 4. the links in the email: #print/<drivers|install|prestart>/<iso>
    h_ = " if (/^day\\//.test(s)) return 'timeline';"
    t = rep(t, h_, h_ + "\n if (/^print\\//.test(s)) return 'timeline';   /* v7.00 */", 'hashTab', path, need)
    r_ = " } else if ((m = h.match(/^day\\/(\\d{4}-\\d{2}-\\d{2})$/))) { state.day = m[1]; state.tlView = 'day'; go('timeline'); }"
    t = rep(t, r_, r_ + "\n else if ((m = h.match(/^print\\/(drivers|install|prestart)\\/(\\d{4}-\\d{2}-\\d{2})$/))) { state.day = m[2]; state.tlView = 'day'; go('timeline'); dpFromLink(m[1], m[2]); }   /* v7.00 */",
            'route', path, need)
    # 5. the paper's style, in the page's own sheet (never inside a script, where the attribution scrub folds " .")
    k = t.find('</style>')
    if k < 0: sys.exit('no </style>')
    t = t[:k] + css + t[k:]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    p = sys.argv[1]
    jsf = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'dayprint700_src.js')
    cssf = sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'dayprint700.css')
    patch(p, jsf, cssf, True)
