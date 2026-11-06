#!/usr/bin/env python3
"""v7.06 - the day's documents: smaller, under the car, Drivers and Install as drop-downs (Print all, or one load by its
references), and every document printed from a preview that stays as it will print until Close - so a phone prints the
sheets, not the Timeline (see plate706_src.js).
Build on v7.04 (live).   python3 patch_v706.py <page.html> [plate706_src.js] [plate706.css]"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from patch_v669 import rep  # noqa: E402

JS_START = "/* v7.04 - THE DAY'S DOCUMENTS AS A PLATE AT THE TOP OF THE TIMELINE."
JS_END = "function dpWireDay(pane){"
CSS_START = "/* v7.04 - the day's documents: a Coates data plate at the top of the Timeline"
CSS_END = "@media print{.dplate{display:none !important}}\n"


def swap(t, a, b, new, what, keep_end):
    if t.count(a) != 1: sys.exit('%s start: %d' % (what, t.count(a)))
    i = t.index(a); j = t.find(b, i)
    if j < 0: sys.exit('%s end not found' % what)
    if not keep_end: j += len(b)
    return t[:i] + new + t[j:]


def patch(path, jsf, cssf, need=True):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if 'function dpZoomFit(' in t: sys.exit('v7.06 already applied')
    if 'function dpPlate(' not in t: sys.exit('apply v7.04 first')
    js = open(jsf, encoding='utf-8').read().rstrip() + '\n'
    css = open(cssf, encoding='utf-8').read().rstrip() + '\n'
    bad = re.findall(r" \.[A-Za-z_]", js)
    if bad: sys.exit('the source holds a space before a dot, which the attribution scrub folds: %r' % bad[:5])
    # 1. the plate's code and style, in place of v7.04's
    t = swap(t, JS_START, JS_END, js, 'js', True)
    t = swap(t, CSS_START, CSS_END, css, 'css', False)
    # 2. one load, or all of them (dpPrint)
    t = rep(t, "flash('Preparing ' + loads.length + ' page' + (loads.length === 1 ? '' : 's') + ', one per load.');",
            "const pick = o && o.only != null && loads[o.only] ? [o.only] : loads.map((g, i) => i);   /* v7.06 - one load, or all */\n"
            " flash('Preparing ' + pick.length + ' page' + (pick.length === 1 ? '' : 's') + ', one per load.');", 'pick', path, need)
    t = rep(t, "const pages = loads.map((g, i) => dpPage(d, g, doc, i + 1, loads.length));",
            "const pages = pick.map(i => dpPage(d, loads[i], doc, i + 1, loads.length));", 'pages', path, need)
    t = rep(t, "dpBarSay(DP_DOC[doc].kick + ' · ' + fmtDate(iso) + ' · ' + loads.length + ' page' + (loads.length === 1 ? '' : 's')",
            "dpZoomFit(); dpBarSay(DP_DOC[doc].kick + ' · ' + fmtDate(iso) + (pick.length === 1 && loads.length > 1 ? ' · Load ' + (pick[0] + 1) + ' of ' + loads.length + ' · ' + loads[pick[0]].rows.map(r => r.a.key).join(', ') : '') + ' · ' + pick.length + ' page' + (pick.length === 1 ? '' : 's')",
            'bar words', path, need)
    # 3. the preview: dpFromLink takes the load; the pre-start stays up until Close; Print prints what is on screen
    t = rep(t, "function dpFromLink(kind, iso){", "function dpFromLink(kind, iso, only){", 'from link', path, need)
    t = rep(t, "bar.querySelector('[data-dpbar-print]').onclick = () => { if (kind === 'prestart') ps7Print(iso); else window.print(); };",
            "bar.querySelector('[data-dpbar-print]').onclick = () => window.print();   /* v7.06 - the preview is already what prints */", 'bar print', path, need)
    t = rep(t, "dpBarSay(DP_MAIL.prestart + ' · ' + fmtDate(iso) + ' · 1 page', true); ps7Print(iso); }",
            "dpBarSay(DP_MAIL.prestart + ' · ' + fmtDate(iso) + ' · 1 page', true); ps7Print(iso, {keep: true}); dpZoomFit(); }", 'prestart keep', path, need)
    t = rep(t, "else dpPrint(iso, kind === 'install' ? 'ins' : 'drv', {link: true});",
            "else dpPrint(iso, kind === 'install' ? 'ins' : 'drv', {link: true, only});", 'only', path, need)
    t = rep(t, "function ps7Print(iso){", "function ps7Print(iso, o){", 'ps7 sig', path, need)
    t = rep(t, " window.addEventListener('afterprint', done, {once: true});\n (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { try { window.print(); } catch (e) { done(); } });",
            " if (o && o.keep) DPBAR.done = done; else window.addEventListener('afterprint', done, {once: true});   /* v7.06 - a preview stays up until Close */\n"
            " (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { try { window.print(); } catch (e) { if (!(o && o.keep)) done(); } });",
            'ps7 keep', path, need)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
    print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    p = sys.argv[1]
    patch(p, sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'plate706_src.js'),
          sys.argv[3] if len(sys.argv) > 3 else os.path.join(HERE, 'plate706.css'), True)
