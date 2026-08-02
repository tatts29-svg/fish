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


def _table(head, rows, cls=''):
    H = ["<div class='scroll'><table class='{}'><thead><tr>".format(cls)]
    for h in head:
        H.append("<th>{}</th>".format(_esc(h)))
    H.append("</tr></thead><tbody>")
    for r in rows:
        H.append("<tr>")
        for c in r:
            H.append("<td>{}</td>".format(_esc(c)))
        H.append("</tr>")
    H.append("</tbody></table></div>")
    return ''.join(H)


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
"""


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
    H.append("<div class='tiles'>")
    H.append(_tile(_m(b['stoppablePerDay']) + '/day',
                   'stoppable today - on hire, nobody using it', 'org'))
    H.append(_tile(_m(b['sittingNotCharging']) + '/day',
                   'on site NOT charging - not a bill'))
    H.append("</div>")
    unp = (b['neverUnpriced'] + b['stoppedUnpriced']
           + b['holdingOnlyUnpriced'])
    if unp:
        H.append(_note(
            '{:,} of these assets have no rate this suite can find, so both '
            'figures are a floor, not a total. A blank rate is not $0.'
            .format(unp)))

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

    # ---------------- the full print-out --------------------------
    #  The same lines the .bat prints, on the page, so a manager who
    #  was not at the laptop reads the identical wording rather than a
    #  summary of it.
    H.append("<h2>THE FULL <span>PRINT-OUT</span></h2>")
    H.append("<pre class='rep'>" + _esc('\n'.join(FC.lines(c))) + "</pre>")
    H.append("<pre class='rep'>" + _esc('\n'.join(WU.lines(b))) + "</pre>")
    H.append("</div>")

    page = ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,"
            "initial-scale=1'><title>Coates | The Money &amp; What Is Getting "
            "Used</title><style>" + UI.CSS + EXTRA + "</style></head><body>"
            + ''.join(H) + "</body></html>")

    out_dir = os.path.join(BASE, 'Reports', today.isoformat(), 'Pages')
    if not os.path.isdir(out_dir):
        os.makedirs(out_dir)
    out = os.path.join(out_dir,
                       'Coates_K2_Money_And_Whats_Used_{}.html'
                       .format(today.isoformat()))
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)

    print('\n'.join(FC.lines(c)))
    print('')
    print('\n'.join(WU.lines(b)))
    print('')
    print('  Written: ' + out)
    return out


if __name__ == '__main__':
    build()
