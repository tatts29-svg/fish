#!/usr/bin/env python3
"""v7.12 - the day's list on the Timeline as one compact line per LOAD (a truck), tap to open. The project manager,
27 Sep 2026: the Timeline "looks like too much is happening" - nine fully open delivery cards, about 6,900 px, on Mon 28
Sep. Each line is one load as the printed sheets group it (dpLoads, v7.00), numbered as the Day documents plate numbers
it: the references big with what they are, their lamps and words, their ticks, the load time and carrier, one short
place. Tapping a line opens that load's own delivery cards (dayCards - every control on them unchanged); one open at a
time, kept in state through the sync redraw; a half-typed note survives any redraw. Due out the same. Moved off this
day, the rows with no reference, the cancelled references, what the carrier says is coming and what D007 says the
circuit is doing fold to one line each with a count. The Every day view is unchanged (see loads712_src.js).
Build on v7.13 (live: v7.10, v7.11, the v7.05 race cards and the v7.13 10-day weather).   python3 patch_v712.py <page.html> [loads712_src.js] [loads712.css]"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402

JS_AT = "function dayBlock(d, full){"
CSS_AT = "#pane-timeline > .dayblock > .sect:first-of-type{margin-top:0 !important}\n"


def patch(path, jsf, cssf, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function ldList(' in t: sys.exit('v7.12 already applied')
    if 'function dpLoads(' not in t or 'v7.11 - the one-day view' not in t: sys.exit('apply v7.00 to v7.11 first')
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
    bad = re.findall(r" \.[A-Za-z_]", js)
    if bad: sys.exit('the source holds a space before a dot, which the attribution scrub folds: %r' % bad[:5])
    if ' ,' in js or ' .' in js: sys.exit('the source holds a space before a dot or a comma, which the attribution scrub folds')
    # 1. the code, before dayBlock; the style, after v7.11's
    for a, what in ((JS_AT, 'js anchor'), (CSS_AT, 'css anchor')):
        if t.count(a) != 1: sys.exit('%s: %d' % (what, t.count(a)))
    t = t.replace(JS_AT, js + JS_AT)
    t = t.replace(CSS_AT, CSS_AT + css)
    # 2. dayBlock, the one-day view only: the load lines, and the blocks under them folded
    t = rep(t, '<div class="dayblock card">', '<div class="dayblock card${full ? \' nosfold ldday\' : \'\'}">', 'dayblock class', path, need)
    t = rep(t, "Due in (${ins.length}${ins.length !== d.deliveries.length ? ' of ' + d.deliveries.length : ''})</div>${full ? dayCards(ins, 'deliveries') : dayRows(ins, 'deliveries')}",
            "Due in (${ins.length}${ins.length !== d.deliveries.length ? ' of ' + d.deliveries.length : ''})${full ? ldCount(d, ins, 'deliveries') : ''}</div>${full ? ldList(d, ins, 'deliveries') : dayRows(ins, 'deliveries')}",
            'due in', path, need)
    t = rep(t, "Due out (${outs.length}${outs.length !== d.removals.length ? ' of ' + d.removals.length : ''})</div>${full ? dayCards(outs, 'removals') : dayRows(outs, 'removals')}",
            "Due out (${outs.length}${outs.length !== d.removals.length ? ' of ' + d.removals.length : ''})${full ? ldCount(d, outs, 'removals') : ''}</div>${full ? ldList(d, outs, 'removals') : dayRows(outs, 'removals')}",
            'due out', path, need)
    t = rep(t, "${(() => { const mv = movedOffDay(d.iso); if (!mv.length) return '';",
            "${ldFoldIf(full, 'moved', 'Moved off this day', movedOffDay(d.iso).length, (() => { const mv = movedOffDay(d.iso); if (!mv.length) return '';",
            'moved start', path, need)
    t = rep(t, "nothing was overwritten</span></li>`).join('')}</ul></div>`; })()}",
            "nothing was overwritten</span></li>`).join('')}</ul></div>`; })())}", 'moved end', path, need)
    t = rep(t, "${d.unref.length ? unrefBlock(d, full) : ''}",
            "${d.unref.length ? ldFoldIf(full, 'unref', 'On the schedule with no reference', d.unref.length, unrefBlock(d, full)) : ''}", 'unref', path, need)
    t = rep(t, " ${cancelledBlock(d, full)}\n",
            " ${ldFoldIf(full, 'cancelled', 'Cancelled on this day', (d.cancelled || []).length, cancelledBlock(d, full))}\n", 'cancelled', path, need)
    t = rep(t, "${d.loads.length ? `<div class=\"card\"><h3>What the carrier says is coming</h3>",
            "${d.loads.length ? ldFoldIf(full, 'carrier', 'What the carrier says is coming', d.loads.length, `<div class=\"card\"><h3>What the carrier says is coming</h3>",
            'carrier start', path, need)
    t = rep(t, "<p class=\"norate\">${esc(carrier.authority || '')}</p></div>` : ''}",
            "<p class=\"norate\">${esc(carrier.authority || '')}</p></div>`) : ''}", 'carrier end', path, need)
    t = rep(t, "${d.notes.length ? `<div class=\"card\"><h3>What D007 says the circuit is doing</h3>",
            "${d.notes.length ? ldFoldIf(full, 'd007', 'What D007 says the circuit is doing', d.notes.flatMap(n => n.items).length, `<div class=\"card\"><h3>What D007 says the circuit is doing</h3>",
            'd007 start', path, need)
    t = rep(t, "<p class=\"norate\">${esc((DATA.access || {}).authority || '')}</p></div>` : ''}",
            "<p class=\"norate\">${esc((DATA.access || {}).authority || '')}</p></div>`) : ''}", 'd007 end', path, need)
    # 3. a redraw of the Timeline keeps a half-typed note and its cursor; the lines are wired with the rest
    t = rep(t, "try { return holdAssets(renderTimeline_held); } finally",
            "try { const kp = ldKeep(); const r = holdAssets(renderTimeline_held); ldPutBack(kp); return r; } finally", 'keep note', path, need)
    t = rep(t, "dpWirePlate(pane);   /* v7.04 - the plate's day steppers */",
            "dpWirePlate(pane);   /* v7.04 - the plate's day steppers */\n ldWire(pane);   /* v7.12 - the load lines and the folded blocks */", 'wire', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    p = sys.argv[1]
    patch(p, sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'loads712_src.js'),
          sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'loads712.css'), True)
