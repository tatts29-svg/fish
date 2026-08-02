#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | FLEET DETAILS - the sums - asset-by-asset evidence
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 2 Aug 2026, on his Fleet Details design): "the
#  important part I'm protecting here is readable asset-level evidence,
#  because this page has to earn staff trust - not just look
#  impressive."
#
#  Every sum lives here. build_fleet_detail.py only formats it.
#
#  ---------------------------------------------------------------
#  EXCLUDED GEAR IS SHOWN AND EXCLUDED, NEVER HIDDEN
#  ---------------------------------------------------------------
#  Andrew's rule, in his own words: rank every asset "without hiding
#  out-of-service or reserved gear inside the percentage."
#
#  So an asset that cannot be issued is listed, labelled EXCLUDED with
#  the reason, and taken OUT OF THE DENOMINATOR. Both halves matter.
#  Leave it in the denominator and the fleet looks lazier than it is.
#  Drop it off the list and a store hand walks the racks looking for a
#  machine the screen never mentioned.
#
#  ---------------------------------------------------------------
#  THE 631 PROBLEM - WHY AN OPEN HIRE IS COUNTED
#  ---------------------------------------------------------------
#  A hire becomes a completed CYCLE when the gear comes back. Count
#  only cycles and every asset that is out right now reads "0 hires":
#  631 of the 857 assets on hire on the 30 Jul pull. A store hand who
#  watched a cylinder go out on Tuesday, and reads "0 hires" against it
#  on Thursday, stops believing the screen - and they are right to.
#
#  So the open hire is counted and SAID: "3 hires . 1 open". The
#  completed count is still there for anyone doing the sums, and the
#  screen stops contradicting what the bloke can see with his eyes.
# =====================================================================
import datetime as dt

import mygear_intel as MI
import racks as RK

#  Statuses that mean the asset cannot be issued today. Off the
#  register itself, not from a judgement call - and every one of them
#  is a real value seen on this job's exports.
EXCLUDED_STATUS = {
    'Awaiting Arrival': 'not on site yet',
    'Pending Baseplan': 'gone to Baseplan',
    'Failed Baseplan': 'failed Baseplan',
    'Pending Branch Receipt': 'gone back to branch',
}

#  Where the bands sit. Andrew's design: cyan below, green through the
#  middle, orange at the top. Named here so one edit moves every bar,
#  every chip and every word on the screen together.
BAND_LOW = 25.0
BAND_HIGH = 85.0


def band(score):
    """Every band carries a WORD, not just a colour.

    The three colours sit in the validator's WARN band for red-green
    colour blindness (worst pair dE 6.7), which is legal ONLY when
    something other than hue also carries the meaning. This is that
    something - and it is the reason the healthy state gets a label
    too, rather than being the one state with no chip on it.
    """
    if score is None:
        return ('none', 'NO DATA')
    if score < BAND_LOW:
        return ('low', 'USE NEXT')
    if score < BAND_HIGH:
        return ('ok', 'GOOD')
    return ('high', 'HIGH USE')


def _pct(a, b):
    return (100.0 * a / b) if b else 0.0


def _d(v):
    return v.date() if isinstance(v, dt.datetime) else v


def asset_row(a, span, with_money):
    """One asset, told plainly enough that a store hand can argue with
    it. Money only when the caller is allowed to see money."""
    why = EXCLUDED_STATUS.get(a.get('status') or '')
    score = _pct(a.get('clientDays') or 0.0, span) if span else None
    commercial = _pct(a.get('commercialDays') or 0.0, span) if span else None
    cls, word = band(None if why else score)
    row = {
        'item': a.get('item') or '',
        'bc': a.get('bc') or '',
        'desc': a.get('desc') or '',
        'status': a.get('status') or '',
        'out': a.get('status') == MI.OUT_STATUS,
        'excluded': bool(why),
        'why': why or '',
        'score': None if why else score,
        'commercial': None if why else commercial,
        'cycles': a.get('cycles') or 0,
        #  THE OPEN HIRE. See the header - this is the line that stops
        #  gear a bloke watched go out reading "0 hires".
        'open': a.get('openLines') or (1 if a.get('status') == MI.OUT_STATUS
                                       and not a.get('cycles') else 0),
        'holder': a.get('holder') or '',
        'holderCo': a.get('holderCo') or '',
        'idle': a.get('idleDays'),
        'rack': RK.where(a.get('item') or '', a.get('bc') or '',
                         a.get('variant') or ''),
        'band': cls, 'word': word,
    }
    if with_money:
        row['revenue'] = a.get('revenue') or 0.0
    return row


def hires_text(row):
    """'3 hires . 1 open' - and never a bare 0 against gear that is
    physically out on a workfront."""
    n, o = row['cycles'], row['open']
    if not n and not o:
        return 'never issued'
    bits = []
    if n:
        bits.append('{} hire{}'.format(n, '' if n == 1 else 's'))
    if o:
        bits.append('{} open'.format(o))
    return ' · '.join(bits)


def fleet(data, variant, with_money=False):
    """One product variant, asset by asset, ranked least-used first."""
    span = data.get('sourceDays') or 0
    assets = [a for a in data['assets'].values() if a.get('variant') == variant]
    if not assets:
        return None
    rows = [asset_row(a, span, with_money) for a in assets]

    #  RANKED LEAST-USED FIRST, which is the whole point of the screen:
    #  the top of the list is what should go out next. Excluded gear is
    #  pushed to the bottom rather than dropped, so it is visible but
    #  never recommended.
    rows.sort(key=lambda r: (r['excluded'], r['out'],
                             r['score'] if r['score'] is not None else 0,
                             r['cycles']))
    for i, r in enumerate(rows, 1):
        r['rank'] = i
    #  the top-ranked asset that can actually be walked to and issued
    nxt = next((r for r in rows
                if not r['excluded'] and not r['out']), None)
    if nxt:
        nxt['useNext'] = True

    live = [r for r in rows if not r['excluded']]
    #  THE DENOMINATOR IS THE ISSUABLE FLEET. Excluded gear is out of
    #  it, and the screen says so out loud.
    n = len(live)
    src = [a for a in assets
           if not EXCLUDED_STATUS.get(a.get('status') or '')]
    client = _pct(sum(a.get('clientDays') or 0.0 for a in src), span * n) \
        if (span and n) else 0.0
    comm = _pct(sum(a.get('commercialDays') or 0.0 for a in src), span * n) \
        if (span and n) else 0.0

    a0 = assets[0]
    out = {
        'variant': variant,
        'name': a0.get('desc') or variant,
        'unit': a0.get('unit') or '',
        'store': a0.get('store') or '',
        'onsite': len(rows),
        'ready': sum(1 for r in live if not r['out']),
        'inUse': sum(1 for r in live if r['out']),
        'excluded': len(rows) - n,
        'client': client, 'commercial': comm,
        'clientBand': band(client), 'commercialBand': band(comm),
        'span': span,
        'rows': rows,
        'racksKnown': sum(1 for r in rows if r['rack']),
    }
    if with_money:
        out['revenue'] = sum(r.get('revenue') or 0.0 for r in rows)

    #  ROTATION OPPORTUNITY. Only worth saying when the spread is real -
    #  a fleet where everything has been out twice does not need a
    #  callout, and a screen that shouts about nothing gets ignored.
    used = [r for r in live if not r['out']]
    if len(live) >= 2 and nxt:
        top = max(live, key=lambda r: (r['cycles'] + r['open']))
        low = nxt
        gap = (top['cycles'] + top['open']) - (low['cycles'] + low['open'])
        if gap >= 2:
            out['rotation'] = {
                'topItem': top['item'], 'topHires': top['cycles'] + top['open'],
                'lowItem': low['item'], 'lowHires': low['cycles'] + low['open'],
                'gap': gap,
            }
    out['unused'] = len(used)
    return out


def variants(data, limit=None):
    """Every fleet, worst-rotated first - so the picker opens on the
    ones actually worth looking at."""
    span = data.get('sourceDays') or 0
    by = {}
    for a in data['assets'].values():
        v = a.get('variant')
        if not v:
            continue
        by.setdefault(v, []).append(a)
    out = []
    for v, ass in by.items():
        live = [a for a in ass
                if not EXCLUDED_STATUS.get(a.get('status') or '')]
        n = len(live)
        cd = sum(a.get('clientDays') or 0.0 for a in live)
        hires = [(a.get('cycles') or 0) + (a.get('openLines') or 0)
                 for a in live]
        spread = (max(hires) - min(hires)) if hires else 0
        out.append({
            'variant': v,
            'name': (ass[0].get('desc') or v),
            'unit': ass[0].get('unit') or '',
            'assets': len(ass),
            'live': n,
            'client': _pct(cd, span * n) if (span and n) else 0.0,
            'spread': spread,
            'neverIssued': sum(1 for a in live if not a.get('issued')),
        })
    out.sort(key=lambda r: (-r['spread'], -r['assets']))
    return out[:limit] if limit else out
