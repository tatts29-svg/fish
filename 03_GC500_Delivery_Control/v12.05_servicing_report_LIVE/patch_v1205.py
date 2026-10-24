"""Author: Andrew Fisher. v12.05 (claimed as v12.02) - the servicing night report: a Coates report for one service night, to print
or save as a PDF.

Andrew, 25 Oct 2026 (this chat): "Can we also work on a new coates report for the servicing to be printed off of nights
completion. Make this look elite and proffesional. Anything over 90% is exceptionally good. We should rate the night out of 5
stars. So be good to work out where this sits. And we have 5 stars that fill up like a gauge. This report will be sent to the
buisness as well as event portables. So really make this stand out. And we talk about team effort." Then: "build it".
  report1202_src.js: the report (two A4 pages, a third only when a night has more left over than fits): the night's whole-night
  servicing percentage, rated out of five stars that fill like a gauge (one star for every 10 points above 40%, 90% or better
  all five), the units, locations, areas and first-to-last times, each job, the crews' team effort, every area, what was left at
  close and how it is scored. One "Night report" button on the Servicing tab opens it for the night the panel shows.
  The Servicing tab's own panel exposes its last verified tracker read, clock and night (svcNight1202), so every figure is the
  panel's, through the one state rule (SvcState). No second read, no write, no money, no hidden tabs; no QR code, crew card or
  tracker link touched. Footer -> v12.05.

    python3 patch_v1205.py page.html      (in place, on live v12.03 named by BASE, or after patch_v1204.py in the same build)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '682fcc85862c2ba91c2d201b4406901d8d881f4d9e64bdc8e3ef30d00c1c0e69'
ANCHOR = '<script id="steady1143-script">'
FOOT = "+' · %s'; /* v8.19 release922"
FOOT_NEW = FOOT % 'v12.05'
TAB = "W.renderServicing1084 = wake;"
TAB_NEW = ("/* v12.05 - the night report reads exactly what this panel shows: its last verified tracker read, its clock and its night */\n"
           "W.svcNight1202 = function () { if (!model || !editable()) return null; var now = timeNow(), data = SvcScope1170.active(model.D);\n"
           "  return {D: data, events: model.events, now: now, read: clockNow, day: pickedDay || SvcState.autoDay(data, now),\n"
           "    meta: {load: model.meta.load, title: model.meta.title, card_withdrawn: !!model.meta.card_withdrawn, expired: !!model.meta.expired}}; };\n"
           + TAB)


def patch(html):
    if 'report1202-script' in html or 'W.svcNight1202' in html: raise ValueError('v12.05 already applied')
    # on live v12.03 (BASE), or on v12.04 applied to it in the same build (or live by then): the footer moves forward either way
    if hashlib.sha256(html.encode('utf-8')).hexdigest() == BASE: FOOT_OLD = FOOT % 'v12.03'
    elif 'cards1201-style' in html and html.count(FOOT % 'v12.04') == 1: FOOT_OLD = FOOT % 'v12.04'
    else: raise ValueError('Wrong base for v12.05 (expected live v12.03 %s... or v12.04 on it)' % BASE[:8])
    for need in ('var SvcState = (function () {', 'var SvcCrews1173 = (function () {', 'var SvcScope1170 = (function () {', "s.id='fonts1066'",
                 "var D = SVC1067_DATA, host, picker, content, list = [], selected = '', model = null, status = '', busy = false, timer = 0;",
                 "function timeNow() { return clockNow + Math.max(0, performance.now() - clockAt); }", "var day = pickedDay || SvcState.autoDay(data, now);"):
        if need not in html: raise ValueError('the page has no %r' % need[:70])
    for once in (ANCHOR, FOOT_OLD, TAB):
        if html.count(once) != 1: raise ValueError('%r must be there exactly once' % once[:60])
    if html.index(TAB) > html.index(ANCHOR): raise ValueError('the Servicing tab must load before the anchor')
    src = (HERE / 'report1202_src.js').read_text(encoding='utf-8')
    css = (HERE / 'report1202.css').read_text(encoding='utf-8')
    if '</script' in src.lower() or '</style' in css.lower(): raise ValueError('source would close its own tag')
    html = rep(html, TAB, TAB_NEW, 'Servicing tab: what the panel shows, for the report', 'page')
    html = rep(html, ANCHOR, '<style id="report1202-style">\n' + css + '</style>\n<script id="report1202-script">\n' + src + '\n</script>\n' + ANCHOR, 'Servicing night report', 'page')
    return rep(html, FOOT_OLD, FOOT_NEW, 'footer', 'page')


if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text(encoding='utf-8')), encoding='utf-8')
    print('v12.05 Servicing night report applied')
