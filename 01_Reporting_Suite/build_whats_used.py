#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | THE MONEY AND WHAT IS GETTING USED - the page - INTERNAL
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Two questions Andrew asked in one breath on 2 Aug 2026, so they are
#  answered on one page:
#    1. is the job spending what it was quoted?        (forecast.py)
#    2. what is getting used and what is not?          (whats_used.py)
#
#  Every sum lives in those two modules. This file only formats them,
#  so the print-out at the laptop and the page on the wall cannot tell
#  a manager two different stories.
#
#  COATES INTERNAL. This page carries revenue and rates, so it goes to
#  Reports\<date>\Pages\ with the other internal reports - NEVER into
#  Gear_Lookup, never onto the store Wi-Fi, never into a client pack.
#
#  Run it:  py build_whats_used.py      (or 67_MONEY_AND_WHATS_USED)
# =====================================================================
import datetime as dt
import html
import io
import json
import os

import build_utilisation_intel as UI
import forecast as FC
import mygear_intel as MI
import whats_used as WU

BASE = os.path.dirname(os.path.abspath(__file__))


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


def _m(v):
    return '${:,.2f}'.format(v or 0)


def _tile(v, lab, cls=''):
    return ("<div class='tile'><div class='v {}'>{}</div>"
            "<div class='l'>{}</div></div>".format(cls, _esc(v), _esc(lab)))


def _note(txt):
    return "<p class='lede'>{}</p>".format(_esc(txt))


def _table(head, rows, cls='', raw=()):
    """`raw` names the column indexes that are already HTML I built -
    everything else is escaped. Named explicitly so a value out of an
    export can never take that path by accident. (O'Brien is a real
    hirer on this job and his apostrophe has broken a page before.)"""
    H = ["<div class='scroll'><table class='{}'><thead><tr>".format(cls)]
    for h in head:
        H.append("<th>{}</th>".format(_esc(h)))
    H.append("</tr></thead><tbody>")
    for r in rows:
        H.append("<tr>")
        for i, c in enumerate(r):
            H.append("<td>{}</td>".format(c if i in raw else _esc(c)))
        H.append("</tr>")
    H.append("</tbody></table></div>")
    return ''.join(H)


# =====================================================================
#  THE CHART COLOURS
#
#  Not hand-picked. Coates orange is the brand and it stays, but the
#  step is one down from the masthead orange because the masthead value
#  sits outside the lightness band a chart mark has to live in on this
#  dark surface. The second slot is a blue, chosen by running the pair
#  through the palette validator rather than by eye:
#
#    #E45A1E + #3E8FD6, dark surface #0A0E14
#      lightness band    PASS   both inside L 0.48-0.67
#      chroma floor      PASS
#      CVD separation    PASS   worst pair dE 24.7 (protanopia)
#      normal vision     PASS   worst pair dE 30.9
#      contrast          PASS   both over 3:1
#
#  Orange and green - the suite's other pair - FAILS the band on this
#  surface, which is why the charts do not use it. Colour is never the
#  only signal either: both series are named in the legend and the
#  stack has a 2px gap so the split is readable in greyscale, in print
#  and to anyone who cannot separate the two hues at all.
# =====================================================================
C_CLIENT = '#E45A1E'      # slot 1 - out with a crew
C_HOLD = '#3E8FD6'        # slot 2 - out, but nobody signed for it
C_GRID = '#1A2331'
C_INK = '#8794A6'
C_AXIS = '#4A5768'

EXTRA = """
.scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:12.5px;min-width:520px}
th{text-align:left;color:#6B7789;font-size:10px;letter-spacing:1.4px;
 text-transform:uppercase;font-weight:800;padding:8px 10px;
 border-bottom:1px solid #263143;white-space:nowrap}
td{padding:7px 10px;border-bottom:1px solid #161F2C;color:#C6D0DD;
 white-space:nowrap}
tr:hover td{background:#111926}
.tile .l{color:#8794A6;font-size:11px;margin-top:5px;letter-spacing:.4px}
.warn{background:#2A1206;border:1px solid #7A3A12;border-radius:10px;
 padding:12px 14px;margin:12px 0;color:#FFD9CC;font-size:12.5px}
.good{color:#35D68A}.bad{color:#FF6B5A}
pre.rep{background:#0C121C;border:1px solid #263143;border-radius:12px;
 padding:14px 16px;overflow-x:auto;font-size:12px;line-height:1.55;
 color:#C6D0DD;font-family:Consolas,'Courier New',monospace}
.figure{background:#0C121C;border:1px solid #263143;border-radius:14px;
 padding:14px 6px 6px;margin:10px 0 4px;position:relative}
svg.chart{width:100%;height:auto;display:block;overflow:visible}
svg.chart text.ax{fill:#6B7789;font-size:11px;
 font-family:'Segoe UI',Arial,sans-serif}
svg.chart text.ms{fill:#8794A6;font-size:9.5px;letter-spacing:1.2px;
 font-weight:800;font-family:'Segoe UI',Arial,sans-serif}
/* Everything except the hit targets is invisible to the mouse. The
   milestone rule is drawn straight down the middle of a column, and an
   SVG line DOES take pointer events - so on Flame Off, first
   nightshift and gear-on-hire day the tooltip simply did not fire.
   Found by hovering the days rather than by reading the code. */
svg.chart line,svg.chart text,svg.chart path,svg.chart polyline,
svg.chart circle{pointer-events:none}
svg.chart rect.hit{fill:transparent;cursor:crosshair;pointer-events:all}
svg.chart rect.hit:hover{fill:#FFFFFF;fill-opacity:.05}
.legend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;
 padding:2px 12px 8px;color:#8794A6;font-size:11.5px}
.legend b{display:inline-block;width:11px;height:11px;border-radius:3px;
 margin-right:6px;vertical-align:-1px}
.tip{position:absolute;pointer-events:none;opacity:0;transition:opacity .1s;
 background:#0A0E14;border:1px solid #3A4757;border-radius:8px;
 padding:8px 11px;font-size:12px;color:#DCE3EC;white-space:nowrap;
 box-shadow:0 6px 20px rgba(0,0,0,.6);z-index:5}
.tip .d{color:#8794A6;font-size:10px;letter-spacing:1.2px;font-weight:800;
 text-transform:uppercase;margin-bottom:4px}
.tip s{display:inline-block;width:9px;height:9px;border-radius:2px;
 margin-right:6px;vertical-align:-1px}
.meter{height:9px;background:#0B111A;border:1px solid #263143;
 border-radius:5px;position:relative;overflow:hidden;min-width:78px}
.meter i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;
 background:linear-gradient(90deg,#F08A4B,#E45A1E)}
.muted{color:#6B7789}
.band{font-size:10px;font-weight:800;letter-spacing:1.2px}
"""


def _nice(top):
    """A round ceiling, so the gridline labels are numbers a human
    would say out loud rather than whatever the max happened to be.

    The step list is deliberately fine. With only (1, 2, 2.5, 5) a peak
    of 1,088 rounded up to 2,000 and the tallest column filled half the
    plot - the chart read as "we are nowhere near capacity" when the
    ceiling was invented by the rounding. 1,088 now lands on 1,200.
    """
    if top <= 0:
        return 1
    import math
    mag = 10 ** int(math.floor(math.log10(top)))
    for step in (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10):
        if top <= step * mag:
            return step * mag
    return 10 * mag


def _ticks(top, n=4):
    return [top * i / n for i in range(n + 1)]


def chart_gear(tl):
    """GEAR OUT, DAY BY DAY - stacked columns, two named series.

    Columns, not an area: fifteen days is a countable number of things,
    and a column per day lets the 2px gap between the two segments do
    the work colour would otherwise have to do on its own.
    """
    rows = tl['rows']
    W, H = 1100, 312
    L, R, T, B = 62, 18, 18, 66
    pw, ph = W - L - R, H - T - B
    top = _nice(tl['maxOut'])
    band = pw / max(1, len(rows))
    bw = min(38.0, band * 0.62)

    S = ["<svg viewBox='0 0 {} {}' class='chart' role='img' "
         "aria-label='Gear out day by day'>".format(W, H)]
    for v in _ticks(top):
        y = T + ph - (v / top) * ph
        S.append("<line x1='{:.1f}' y1='{:.1f}' x2='{:.1f}' y2='{:.1f}' "
                 "stroke='{}' stroke-width='1'/>".format(L, y, W - R, y,
                                                         C_GRID))
        S.append("<text x='{:.1f}' y='{:.1f}' class='ax' "
                 "text-anchor='end'>{:,.0f}</text>".format(L - 10, y + 4, v))

    for i, r in enumerate(rows):
        cx = L + band * i + band / 2
        x = cx - bw / 2
        if not r['gear']:
            continue
        hc = (r['client'] / top) * ph
        hh = (r['holding'] / top) * ph
        y0 = T + ph
        #  client segment sits on the baseline; the holding segment
        #  stacks above it with a 2px gap so the split survives print,
        #  greyscale and colour blindness.
        if hc > 0:
            S.append("<rect x='{:.1f}' y='{:.1f}' width='{:.1f}' "
                     "height='{:.1f}' fill='{}'/>".format(
                         x, y0 - hc, bw, hc, C_CLIENT))
        if hh > 0:
            S.append("<rect x='{:.1f}' y='{:.1f}' width='{:.1f}' "
                     "height='{:.1f}' rx='3' fill='{}'/>".format(
                         x, y0 - hc - 2 - hh, bw, hh, C_HOLD))
        S.append("<rect class='hit' x='{:.1f}' y='{:.1f}' width='{:.1f}' "
                 "height='{:.1f}' data-i='{}'/>".format(
                     L + band * i, T, band, ph, i))

    #  the days the export does not reach. Marked, never drawn as zero.
    blank = [i for i, r in enumerate(rows) if not r['gear']]
    if blank:
        x0 = L + band * blank[0]
        S.append("<rect x='{:.1f}' y='{:.1f}' width='{:.1f}' height='{:.1f}' "
                 "fill='#0F1620' opacity='.75'/>".format(
                     x0, T, band * len(blank), ph))
        S.append("<text x='{:.1f}' y='{:.1f}' class='ax' "
                 "text-anchor='middle'>NOT COVERED</text>".format(
                     x0 + band * len(blank) / 2, T + ph / 2))

    S.append("<line x1='{}' y1='{:.1f}' x2='{}' y2='{:.1f}' stroke='{}' "
             "stroke-width='1'/>".format(L, T + ph, W - R, T + ph, C_AXIS))
    S += _xaxis(rows, L, band, T, ph)
    S.append("</svg>")
    return ''.join(S)


def chart_money(tl):
    """WHAT IT BILLED, DAY BY DAY - one series, so no legend box.

    The line stops on the last day the daily summary actually covers.
    Running it to the right-hand edge through days nobody has pulled
    would draw a collapse that did not happen.
    """
    rows = tl['rows']
    W, H = 1100, 312
    L, R, T, B = 76, 18, 18, 66
    pw, ph = W - L - R, H - T - B
    top = _nice(tl['maxMoney'])
    band = pw / max(1, len(rows))

    S = ["<svg viewBox='0 0 {} {}' class='chart' role='img' "
         "aria-label='What it billed day by day'>".format(W, H)]
    for v in _ticks(top):
        y = T + ph - (v / top) * ph
        S.append("<line x1='{:.1f}' y1='{:.1f}' x2='{:.1f}' y2='{:.1f}' "
                 "stroke='{}' stroke-width='1'/>".format(L, y, W - R, y,
                                                         C_GRID))
        S.append("<text x='{:.1f}' y='{:.1f}' class='ax' "
                 "text-anchor='end'>${:,.0f}</text>".format(L - 10, y + 4, v))

    pts = [(L + band * i + band / 2,
            T + ph - (r['money'] / top) * ph)
           for i, r in enumerate(rows) if r['money'] is not None]
    if pts:
        area = ("M{:.1f},{:.1f} ".format(pts[0][0], T + ph)
                + ' '.join('L{:.1f},{:.1f}'.format(x, y) for x, y in pts)
                + " L{:.1f},{:.1f} Z".format(pts[-1][0], T + ph))
        S.append("<defs><linearGradient id='mg' x1='0' y1='0' x2='0' y2='1'>"
                 "<stop offset='0' stop-color='{}' stop-opacity='.42'/>"
                 "<stop offset='1' stop-color='{}' stop-opacity='0'/>"
                 "</linearGradient></defs>".format(C_CLIENT, C_CLIENT))
        S.append("<path d='{}' fill='url(#mg)'/>".format(area))
        S.append("<polyline points='{}' fill='none' stroke='{}' "
                 "stroke-width='2' stroke-linejoin='round' "
                 "stroke-linecap='round'/>".format(
                     ' '.join('{:.1f},{:.1f}'.format(x, y) for x, y in pts),
                     C_CLIENT))
        for x, y in pts:
            S.append("<circle cx='{:.1f}' cy='{:.1f}' r='3.5' fill='{}' "
                     "stroke='#0A0E14' stroke-width='2'/>".format(
                         x, y, C_CLIENT))

    nomoney = [i for i, r in enumerate(rows) if r['money'] is None]
    if nomoney:
        x0 = L + band * nomoney[0]
        S.append("<rect x='{:.1f}' y='{:.1f}' width='{:.1f}' height='{:.1f}' "
                 "fill='#0F1620' opacity='.75'/>".format(
                     x0, T, band * len(nomoney), ph))
        S.append("<text x='{:.1f}' y='{:.1f}' class='ax' "
                 "text-anchor='middle'>NOT BILLED YET</text>".format(
                     x0 + band * len(nomoney) / 2, T + ph / 2))

    for i in range(len(rows)):
        S.append("<rect class='hit' x='{:.1f}' y='{:.1f}' width='{:.1f}' "
                 "height='{:.1f}' data-i='{}'/>".format(
                     L + band * i, T, band, ph, i))
    S.append("<line x1='{}' y1='{:.1f}' x2='{}' y2='{:.1f}' stroke='{}' "
             "stroke-width='1'/>".format(L, T + ph, W - R, T + ph, C_AXIS))
    S += _xaxis(rows, L, band, T, ph)
    S.append("</svg>")
    return ''.join(S)


#  roughly how wide a milestone label runs at 9.5px with 1.2px tracking
_MS_CHAR = 6.6


def _xaxis(rows, L, band, T, ph):
    """Dates along the bottom, and the named days standing up in the
    plot. A milestone is worth ten lines of explanation.

    FLAME OFF and FIRST NIGHTSHIFT are consecutive days on this job, so
    a single label row printed them straight through each other -
    "FLAME OFRST NIGHTSHIFT". Labels now drop to a second row whenever
    they would touch the one before, measured rather than assumed.
    """
    S = []
    every = max(1, len(rows) // 16)
    last_right, last_row = None, 1
    for i, r in enumerate(rows):
        cx = L + band * i + band / 2
        if i % every == 0 or r['milestone']:
            S.append("<text x='{:.1f}' y='{:.1f}' class='ax' "
                     "text-anchor='middle'>{}</text>".format(
                         cx, T + ph + 18, _esc(r['date'].strftime('%d %b'))))
        if not r['milestone']:
            continue
        S.append("<line x1='{:.1f}' y1='{:.1f}' x2='{:.1f}' y2='{:.1f}' "
                 "stroke='#5B6B80' stroke-width='1' "
                 "stroke-dasharray='3 3'/>".format(cx, T, cx, T + ph))
        half = len(r['milestone']) * _MS_CHAR / 2
        row = 1
        if last_right is not None and (cx - half) < last_right + 6:
            row = 2 if last_row == 1 else 1
        last_right, last_row = cx + half, row
        S.append("<text x='{:.1f}' y='{:.1f}' class='ms' "
                 "text-anchor='middle'>{}</text>".format(
                     cx, T + ph + (36 if row == 1 else 49),
                     _esc(r['milestone'])))
    return S


def _meter(score):
    """One tool's usage, as a share of the days the data covers."""
    if score is None:
        return "<span class='muted'>no data</span>"
    return ("<div class='meter' title='{:.0f}%'><i style='width:{:.1f}%'>"
            "</i></div>".format(score, score))


def build(today=None):
    today = today or dt.date.today()
    rental = FC._newest('RENTAL_STOCK*.xlsx')
    txn = FC._newest('TRANSACTIONS*.xlsx')
    if not rental or not txn:
        print('  No RENTAL_STOCK / TRANSACTIONS export found. Nothing built.')
        return None
    data = MI.read(rental, txn, FC._newest('ON_HIRE*.xlsx'))
    ds = FC.read_daily_summary(FC._newest('DAILY_SUMMARY*.xlsx'))
    c = FC.compare(data, ds)
    b = WU.breakdown(data, txn_path=txn, today=today)

    H = ["<div class='wrap'>",
         "<div class='internal'>COATES INTERNAL &mdash; CARRIES REVENUE</div>",
         "<div class='mast'><div><h1>THE MONEY &amp; <b>WHAT IS GETTING "
         "USED</b></h1><div class='sub'>Cement Australia K2 Shutdown 2026 "
         "&middot; Gladstone &middot; as at {}</div></div>"
         "<div class='rt'>POWERED BY <span class='siq'>SITEIQ</span></div>"
         "</div>".format(_esc(b['asof'].strftime('%d %b %Y')))]

    # ---------------- HOW OLD IS THIS -----------------------------
    #  (Andrew, 2 Aug 2026: "is this recent date utlisation".) Fair
    #  question, and the page was not answering it loudly enough.
    #
    #  The file is NAMED for the day it was built and a reader sees the
    #  name before the masthead, so a page called ..._02Aug built on
    #  gear data that stops on 30 Jul reads as today's picture when it
    #  is three days old. Utilisation divides by days the data covers,
    #  so a stale pull does not make the percentages wrong - it makes
    #  them answer a question about last week.
    #
    #  The two exports go stale at different speeds and are named
    #  separately: the charge lines carry the gear, the daily summary
    #  carries the money, and on most pulls the summary is the older of
    #  the two.
    gear_lag = (today - b['asof']).days
    ds_last = max(ds['daily'])[0] if (ds and ds['daily']) else None
    ds_lag = (today - ds_last).days if ds_last else None
    if gear_lag > 0 or (ds_lag or 0) > 0:
        bits = []
        if gear_lag > 0:
            bits.append('Gear and utilisation stop at <b>{}</b> &mdash; {} '
                        'day{} back.'.format(
                            _esc(b['asof'].strftime('%a %d %b')), gear_lag,
                            '' if gear_lag == 1 else 's'))
        if ds_lag:
            bits.append('The money stops at <b>{}</b> &mdash; {} day{} '
                        'back.'.format(_esc(ds_last.strftime('%a %d %b')),
                                       ds_lag, '' if ds_lag == 1 else 's'))
        H.append(
            "<div class='warn'><b>THIS IS NOT TODAY.</b> "
            + ' '.join(bits)
            + " Anything issued, returned or charged since then is not on "
              "this page &mdash; not as zero, just not seen. Pull fresh "
              "SiteIQ exports over the top of the old ones and run "
              "67_MONEY_AND_WHATS_USED again to move both dates forward."
              "</div>")

    # ---------------- forecast v actual --------------------------
    H.append("<h2>FORECAST v <span>ACTUAL</span></h2>")
    H.append(_note(
        'The forecast covers all the equipment on this job. The job bills '
        'through two streams, so radios and gas monitors come off the '
        'forecast because the branch charges them, and the rest of Baseplan '
        'is added to the actual because nobody took it off the forecast. '
        'Take one side off and leave the other in and the variance is just '
        'the size of the gear you forgot.'))
    H.append("<div class='tiles'>")
    H.append(_tile(_m(c['forecastComparable']), 'comparable forecast'))
    H.append(_tile(_m(c['perDayNeeded']) + '/day', 'which needs'))
    if c.get('actual') is not None:
        H.append(_tile(_m(c['actual']), 'spent, both streams', 'org'))
        H.append(_tile(_m(c['rate']) + '/day', 'at the pace so far'))
    H.append("</div>")

    if c.get('splitGap'):
        H.append("<div class='warn'>Plant and tooling do not add back to "
                 "the store total &mdash; " + _esc(_m(abs(c['splitGap'])))
                 + " is in neither book. The split below is not safe to "
                   "quote until that is found.</div>")

    # ---------------- what is used -------------------------------
    cnt = b['counts']
    H.append("<h2>WHAT IS <span>GETTING USED</span></h2>")
    H.append("<div class='tiles'>")
    H.append(_tile('{:,}'.format(cnt['working']), 'working'))
    H.append(_tile('{:,}'.format(cnt['stopped']),
                   'stopped {}+ days'.format(b['stoppedAfter'])))
    H.append(_tile('{:,}'.format(cnt['never']), 'never issued', 'org'))
    H.append(_tile('{:,}'.format(cnt['holdingOnly']),
                   'no client ever took it', 'org'))
    H.append("</div>")

    H.append("<h2>THE ONE DISTINCTION <span>THAT MATTERS</span></h2>")
    H.append(_note(
        "Gear that is On Hire has the meter running. Gear that is Available "
        "for Hire is on site and is NOT being charged. Only the first kind "
        "can be stopped to save anything today - so only the first kind is "
        "called a saving here."))
    H.append(_note(
        "And it is not \u201cidle\u201d. This suite cannot see idle. It can "
        "see who put their name against a tool, which is a different thing. "
        "Categories where nothing has ever been signed to a person - "
        "barriers, rubbish chutes - are placed around site rather than "
        "issued over a counter, so they are counted separately and kept out "
        "of the saving."))
    H.append("<div class='tiles'>")
    H.append(_tile(_m(b['stoppablePerDay']) + '/day',
                   'stoppable today - on charge, nobody has signed for it',
                   'org'))
    H.append(_tile(_m(b['sittingNotCharging']) + '/day',
                   'on site NOT charging - not a bill'))
    H.append("</div>")
    if b.get('stoppableList'):
        H.append(_table(
            ['$/day', 'asset', 'item', 'category', 'last out'],
            [['${:,.2f}'.format(a['dayRate']), a.get('desc') or '',
              a.get('item') or '', a.get('unit') or '',
              WU._d(a['lastOut']).strftime('%d %b') if a.get('lastOut')
              else '-']
             for a in b['stoppableList'][:25]]))
    if b.get('placedOnChargeN'):
        H.append(_note(
            'Kept out of that figure: {:,} assets, {}/day, in {} - placed '
            'around site rather than issued over a counter. Every one of '
            'them has moved and not one has ever been signed to a person, '
            'so its cost is not a saving waiting to be taken.'
            .format(b['placedOnChargeN'], _m(b['placedOnCharge']),
                    ' and '.join(b['placedUnits']))))
    unp = (b['neverUnpriced'] + b['stoppedUnpriced']
           + b['holdingOnlyUnpriced'])
    if unp:
        H.append(_note(
            '{:,} of these assets have no rate this suite can find, so both '
            'figures are a floor, not a total. A blank rate is not $0.'
            .format(unp)))

    # ---------------- does every line land somewhere? -------------
    #  Runs on every pull. If money on the export ever stops equalling
    #  money in the buckets, this says so before anybody quotes a
    #  figure off this page.
    rec = FC.reconcile(data, txn)
    ok = (abs(rec.get('gap', 0)) < 0.005
          and abs(rec.get('splitGap', 0)) < 0.005)
    H.append("<h2>DOES EVERY CHARGE LINE <span>LAND SOMEWHERE</span>"
             "</h2>")
    if ok:
        H.append(_note(
            '{:,} charge lines on the export, {} between them, and every '
            'one is in exactly one bucket. Plant plus tooling adds back to '
            'the store total. {:,} lines carry no money - same-day returns, '
            'and the paired one-shift line SiteIQ writes against a hire. '
            'Legitimate, counted so the total is explained, never flagged.'
            .format(rec['lines'], _m(rec['raw']), rec['zero'])))
    else:
        H.append("<div class='warn'><b>OUT BY "
                 + _esc(_m(abs(rec.get('gap', 0))))
                 + ".</b> Money on the export that this suite has not put "
                   "anywhere. Nothing on this page is safe to quote until "
                   "that is found.</div>")
    H.append("<div class='tiles'>")
    H.append(_tile('{:,}'.format(rec['lines']), 'charge lines'))
    H.append(_tile(_m(rec['raw']), 'on the export'))
    H.append(_tile(_m(rec.get('buckets', 0)), 'in the buckets',
                   '' if ok else 'org'))
    H.append(_tile(_m(abs(rec.get('gap', 0))), 'difference',
                   '' if ok else 'org'))
    H.append("</div>")

    # ---------------- the timeline -------------------------------
    #  TWO CHARTS, NOT ONE WITH TWO SCALES. Gear counts and dollars do
    #  not share an axis - a second y-scale is the fastest way to make
    #  two unrelated shapes look like one explains the other.
    tl = WU.timeline(data, ds)
    if tl:
        H.append("<h2>THE JOB, <span>DAY BY DAY</span></h2>")
        H.append(_note(
            'How much gear was out each day, split by whether a crew had '
            'signed for it. The orange is working. The blue is out of the '
            'store on our own account with nobody named against it - and it '
            'barely moves while the orange climbs, which is the whole story '
            'of this job in one picture. The last column is the day the '
            'export was pulled - a day that was still running when it was '
            'taken always reads low, so read the dip at the right-hand end '
            'as the edge of the data, not as gear going home.'))
        H.append("<div class='figure' data-tl='1'>"
                 + "<div class='legend'>"
                 + "<span><b style='background:{}'></b>with a crew</span>"
                   .format(C_CLIENT)
                 + "<span><b style='background:{}'></b>out, nobody signed "
                   "for it</span>".format(C_HOLD)
                 + "</div>" + chart_gear(tl)
                 + "<div class='tip' data-tip='gear'></div></div>")
        H.append("<h2>WHAT IT <span>BILLED</span></h2>")
        H.append(_note(
            'SiteIQ hire revenue per day, off its own daily summary. It '
            'stops on the last day the summary covers - the days after it '
            'are not $0, they are days nobody has pulled yet.'))
        H.append("<div class='figure' data-tl='1'>" + chart_money(tl)
                 + "<div class='tip' data-tip='money'></div></div>")

    # ---------------- by category --------------------------------
    H.append("<h2>BY <span>CATEGORY</span></h2>")
    H.append(_note('Most used first. One row per category so a dead category '
                   'cannot hide inside a healthy total.'))
    H.append(_table(
        ['category', 'assets', 'never issued', 'out now', 'client days',
         'ever issued'],
        [[r['unit'], '{:,}'.format(r['assets']), '{:,}'.format(r['never']),
          '{:,}'.format(r['out']), '{:,.0f}'.format(r['clientDays']),
          '{:.0f}%'.format(r['everPct'])] for r in b['units']]))

    # ---------------- never moved --------------------------------
    H.append("<h2>NEVER MOVED &mdash; <span>THE SEND-HOME LIST</span></h2>")
    H.append(_note('Whole fleets of {}+ that have never once been issued, '
                   'biggest first.'.format(b['fleetMin'])))
    H.append(_table(
        ['have', 'fleet', 'category'],
        [['{:,}'.format(v['assets']), v['name'] or v['desc'],
          ', '.join(u for u, _n in (v.get('units') or []))]
         for v in b['neverMoved'][:60]]))

    # ---------------- part fleet ---------------------------------
    H.append("<h2>TOO MANY BROUGHT &mdash; <span>PART OF THE FLEET NEVER "
             "MOVED</span></h2>")
    H.append(_note('Spare is the count that has never once been issued - not '
                   'what is idle right now. A fleet can be fully out today '
                   'and still have twenty that have never been touched.'))
    H.append(_table(
        ['fleet', 'have', 'ever used', 'spare', 'spare %'],
        [[v['name'] or v['desc'], '{:,}'.format(v['assets']),
          '{:,}'.format(v['issuedOnce']), '{:,}'.format(v['spare']),
          '{:.0f}%'.format(v['sparePct'])] for v in b['partFleet'][:60]]))

    # ---------------- stopped ------------------------------------
    H.append("<h2>STOPPED &mdash; <span>WALK THESE</span></h2>")
    H.append(_note('Used, then quiet for {}+ days. Quiet is not the same as '
                   'finished - it might be in a crib hut.'
                   .format(b['stoppedAfter'])))
    H.append(_table(
        ['asset', 'item', 'quiet', 'last out', 'on charge'],
        [[a.get('desc') or '', a.get('item') or '',
          '{:,}d'.format(a['quietDays']),
          WU._d(a.get('lastOut')).strftime('%d %b')
          if a.get('lastOut') else '?',
          'YES' if a.get('charging') else 'no']
         for a in b['stopped'][:80]]))

    # ---------------- the per-tool score --------------------------
    #  (Andrew, 2 Aug 2026: "where did we get to to have each tool
    #  having a utilisation bar or a score on usage".) The bar has been
    #  on the intelligence page since the 2 Aug build - open a variant
    #  and every asset carries one. THIS is the number that goes with
    #  it, on the same denominator, so the two can never disagree.
    sc = WU.scored(data)
    bands = {}
    for a in sc:
        bands[a['band']] = bands.get(a['band'], 0) + 1
    H.append("<h2>EVERY TOOL, <span>SCORED</span></h2>")
    H.append(_note(
        'Score is the share of days the export covers ({} of them) that a '
        'named crew had the tool. Not a mark out of ten, not curved, not '
        'rounded up - a tool with a crew every single day scores 100. The '
        'same denominator the utilisation bars use, so a bar and a score '
        'can never say different things about the same tool.'
        .format(data.get('sourceDays') or 0)))
    H.append("<div class='tiles'>")
    for lab in ('WORKING HARD', 'EARNING', 'BARELY OUT', 'NEVER ISSUED'):
        H.append(_tile('{:,}'.format(bands.get(lab, 0)), lab.lower(),
                       'org' if lab == 'NEVER ISSUED' else ''))
    H.append("</div>")
    H.append(_note('Hardest-worked first. Top 60 of {:,} - the whole list is '
                   'on the intelligence page, asset by asset.'
                   .format(len(sc))))
    H.append(_table(
        ['score', '', 'tool', 'item', 'category', 'who has it', 'company'],
        [['{:.0f}'.format(a['score']) if a['score'] is not None else '-',
          _meter(a['score']), a.get('desc') or '', a.get('item') or '',
          a.get('unit') or '',
          a.get('holder') or '', a.get('holderCo') or '']
         for a in sc[:60]], raw={1}))

    # ---------------- the full print-out --------------------------
    #  The same lines the .bat prints, on the page, so a manager who
    #  was not at the laptop reads the identical wording rather than a
    #  summary of it.
    H.append("<h2>THE FULL <span>PRINT-OUT</span></h2>")
    H.append("<pre class='rep'>"
             + _esc('\n'.join(FC.reconcile_lines(rec))) + "</pre>")
    H.append("<pre class='rep'>" + _esc('\n'.join(FC.lines(c))) + "</pre>")
    H.append("<pre class='rep'>" + _esc('\n'.join(WU.lines(b))) + "</pre>")
    H.append("</div>")

    #  THE HOVER LAYER. The numbers ride in a JSON payload and the hit
    #  targets carry only an index - nothing from an export is ever
    #  written into an attribute the browser will hand to a parser.
    #  That is the O'Brien rule: an apostrophe in a hirer's name has
    #  taken a page down before and it will not do it here.
    payload = [{
        'd': r['date'].strftime('%a %d %b'),
        'c': r['client'], 'h': r['holding'], 'o': r['out'],
        'm': r['money'], 'g': bool(r['gear']), 'ms': r['milestone'],
        'e': bool(r.get('edge')),
    } for r in (tl['rows'] if tl else [])]

    JS = """
(function(){
  var R = window.__TL__ || [];
  if(!R.length) return;
  document.querySelectorAll('.figure[data-tl]').forEach(function(fig){
    var tip = fig.querySelector('.tip');
    if(!tip) return;
    var kind = tip.getAttribute('data-tip');
    function money(v){
      return '$' + Number(v).toLocaleString('en-AU',
        {minimumFractionDigits:2, maximumFractionDigits:2});
    }
    function html(r){
      var s = "<div class='d'>" + r.d
        + (r.ms ? ' \\u00b7 ' + r.ms : '') + "</div>";
      if(kind === 'money'){
        /* NO DATA IS NOT ZERO, and the tooltip has to say so too -
           it is the one place a reader stops and looks closely. */
        s += (r.m === null || r.m === undefined)
          ? 'not billed yet' : money(r.m);
        return s;
      }
      if(!r.g) return s + 'not covered by this export';
      s += "<div><s style='background:__C1__'></s>with a crew &nbsp;<b>"
        + r.c.toLocaleString() + '</b></div>';
      s += "<div><s style='background:__C2__'></s>nobody signed &nbsp;<b>"
        + r.h.toLocaleString() + '</b></div>';
      s += "<div style='color:#8794A6;margin-top:3px'>out altogether "
        + r.o.toLocaleString() + '</div>';
      if(r.e) s += "<div style='color:#8794A6;margin-top:3px'>"
        + 'last day the export covers &mdash; usually reads low</div>';
      return s;
    }
    fig.querySelectorAll('rect.hit').forEach(function(hit){
      hit.addEventListener('mousemove', function(ev){
        var i = parseInt(hit.getAttribute('data-i'), 10);
        var r = R[i];
        if(!r) return;
        tip.innerHTML = html(r);
        tip.style.opacity = 1;
        var b = fig.getBoundingClientRect();
        var x = ev.clientX - b.left + 14, y = ev.clientY - b.top - 10;
        if(x + tip.offsetWidth > b.width) x = ev.clientX - b.left
          - tip.offsetWidth - 14;
        tip.style.left = Math.max(4, x) + 'px';
        tip.style.top = Math.max(4, y) + 'px';
      });
      hit.addEventListener('mouseleave', function(){
        tip.style.opacity = 0;
      });
    });
  });
})();
""".replace('__C1__', C_CLIENT).replace('__C2__', C_HOLD)

    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1'><title>Coates | The Money &amp; What Is Getting "
            "Used</title><style>" + UI.CSS + EXTRA + "</style></head><body>"
            + ''.join(H)
            + "<script>window.__TL__=" + json.dumps(payload) + ";\n"
            + JS + "</script></body></html>")

    out_dir = os.path.join(BASE, 'Reports', today.isoformat(), 'Pages')
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
    out = os.path.join(out_dir,
                       'Coates_K2_Money_And_Whats_Used_{}.html'
                       .format(today.isoformat()))
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)

    print('\n'.join(FC.reconcile_lines(rec)))
    print('')
    print('\n'.join(FC.lines(c)))
    print('')
    print('\n'.join(WU.lines(b)))
    print('')
    print('  Written: ' + out)
    return out


if __name__ == '__main__':
    build()
