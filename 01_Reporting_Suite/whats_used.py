#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHAT IS GETTING USED, AND WHAT IS NOT - the sums
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 2 Aug 2026): "so some really broken down info on whats
#  getting used and what not."
#
#  Every sum lives here. build_whats_used.py only formats it, so the
#  page on the wall and the print-out at the laptop cannot disagree.
#
#  ---------------------------------------------------------------
#  FOUR WAYS A PIECE OF GEAR IS NOT BEING USED, AND THEY ARE NOT
#  THE SAME PROBLEM
#  ---------------------------------------------------------------
#    NEVER MOVED    on the register, never issued to anyone. It came
#                   to site and has sat there. This is the list that
#                   goes home.
#    PART FLEET     some of the fleet moved and some never did. 221
#                   lanyards where 40 got used is not "lanyards are
#                   idle" - it is "we brought 180 too many".
#    STOPPED        used, then nothing for days. Might be finished,
#                   might be lost, might be sitting in a crib hut.
#                   This is the list that gets walked, not sent home.
#    HOLDING ONLY   only ever booked to the site holding account, so
#                   it moved but no client ever took it. It is on
#                   site costing money and no crew has asked for it.
#
#  Lumping those four together produces one useless number. Kept
#  apart, each one has a different action against it.
#
#  ---------------------------------------------------------------
#  NO DATA IS NOT IDLE
#  ---------------------------------------------------------------
#  Days outside the window the exports cover are unknown, not empty.
#  STOPPED is measured from the last day the data actually covers, not
#  from today, so an old export cannot make live gear look abandoned.
# =====================================================================
import collections
import datetime as dt

import day_rates as DR
import mygear_intel as MI
import shutdown_day as SD

#  Days with no issue before a used asset counts as STOPPED. Andrew's
#  shutdown runs in bursts, so a couple of quiet days is normal work.
STOPPED_AFTER = 3

#  A fleet has to be big enough that leaving some behind is a real
#  decision rather than a rounding error.
FLEET_MIN = 3


def _d(v):
    if isinstance(v, dt.datetime):
        return v.date()
    return v


def _pct(a, b):
    return (100.0 * a / b) if b else 0.0


def _rate_of(rates, a):
    rec = DR.resolve(rates['card'], rates['txn'], rates['base'],
                     variant=a.get('variant') or '', item=a.get('item') or '',
                     desc=a.get('desc') or '')
    if not rec or not rec.get('rate'):
        return None, ''
    return rec['rate'], rec.get('source') or ''


def load_rates(here=None, txn_path=None):
    """Every rate source this suite has, in one bag - so a caller
    cannot accidentally price half a page off the contract and the
    other half off Baseplan without noticing.

    All three are loaded because they answer in a fixed order and each
    one covers what the last one missed: the contracted card first,
    then what was actually charged on this job, then Baseplan. The card
    lives in Data_Quote\\ which does not ship, so on a machine without
    it the charged rates carry the page - and every line says which
    source it came from rather than pretending they are the same thing.
    """
    return {
        'card': DR.load(here),
        'txn': DR.from_transactions(txn_path) if txn_path else None,
        'base': DR.from_baseplan(here),
    }


def breakdown(data, rates=None, today=None, txn_path=None):
    """The whole used/not-used picture, told apart rather than totalled."""
    assets = list(data['assets'].values())
    #  THE CLOCK IS THE DATA'S, NOT THE WALL'S. Measuring idleness from
    #  today against an export pulled last week invents days of sitting
    #  still that nobody can see.
    asof = (dt.date.fromisoformat(data['sourceTo']) if data.get('sourceTo')
            else (today or dt.date.today()))

    out = {
        'asof': asof, 'stoppedAfter': STOPPED_AFTER, 'fleetMin': FLEET_MIN,
        'assets': len(assets),
    }

    # ---------------- the four states, per asset ----------------
    never, stopped, holding, working = [], [], [], []
    for a in assets:
        if a.get('holdingOnly'):
            holding.append(a)
            continue
        if not a.get('issued'):
            never.append(a)
            continue
        last = _d(a.get('lastOut'))
        quiet = (asof - last).days if last else None
        if a.get('status') == MI.OUT_STATUS:
            working.append(a)
        elif quiet is not None and quiet >= STOPPED_AFTER:
            b = dict(a)
            b['quietDays'] = quiet
            stopped.append(b)
        else:
            working.append(a)

    out['never'] = never
    out['stopped'] = sorted(stopped, key=lambda x: -x['quietDays'])
    out['holdingOnly'] = holding
    out['working'] = working
    out['counts'] = {
        'never': len(never), 'stopped': len(stopped),
        'holdingOnly': len(holding), 'working': len(working),
    }

    # ---------------- what the sitting gear costs a day ----------
    #  ON CHARGE OR NOT ON CHARGE. Andrew's rule, and the whole point
    #  of this block: "available for hire means it's generally onsite,
    #  not being charged until such time it goes on hire."
    #
    #  So a shelf full of gear nobody has touched is NOT costing the
    #  client a dollar a day. It cost money to get here and it is
    #  taking up a store, but the meter is not running. Add its rate
    #  into a "what idle gear is costing" number and the page invents
    #  a bill nobody has been sent.
    #
    #  Gear ON HIRE that nobody is using is the opposite - the meter IS
    #  running and no crew has it. That is the money that can be
    #  stopped today, and it is the only figure allowed to be called a
    #  saving.
    #
    #  Priced where a rate can be found and COUNTED where it cannot,
    #  because "$0" and "no rate on file" are different statements and
    #  only one of them is true.
    rates = rates or load_rates(txn_path=txn_path)
    src_used = collections.Counter()
    for key in ('never', 'stopped', 'holdingOnly'):
        on, off = 0.0, 0.0
        n_on, n_off, unpriced = 0, 0, 0
        for a in out[key]:
            r, src = _rate_of(rates, a)
            charging = a.get('status') == MI.OUT_STATUS
            a['charging'] = charging
            if r:
                a['dayRate'] = r
                a['rateSource'] = src
                src_used[src or '(unnamed)'] += 1
                if charging:
                    on += r
                    n_on += 1
                else:
                    off += r
                    n_off += 1
            else:
                unpriced += 1
                a['dayRate'] = None
                a['rateSource'] = ''
        out[key + 'OnCharge'] = on
        out[key + 'OnChargeN'] = n_on
        out[key + 'NotCharging'] = off
        out[key + 'NotChargingN'] = n_off
        out[key + 'Unpriced'] = unpriced
    out['rateSources'] = dict(src_used)
    #  THE ONLY NUMBER THAT MAY BE CALLED A SAVING: on hire, on charge,
    #  and nobody using it.
    out['stoppablePerDay'] = (out['stoppedOnCharge']
                              + out['holdingOnlyOnCharge']
                              + out['neverOnCharge'])
    out['sittingNotCharging'] = (out['neverNotCharging']
                                 + out['stoppedNotCharging']
                                 + out['holdingOnlyNotCharging'])

    # ---------------- by category, the shape of the job ----------
    #  This is the answer to "what is getting used" at the level a
    #  store runs at. One row per unit, so a category that is dead
    #  cannot hide inside a total that looks healthy.
    units = {}
    for a in assets:
        u = a.get('unit') or 'Unassigned'
        r = units.setdefault(u, {
            'unit': u, 'plant': bool(a.get('plant')), 'assets': 0,
            'issued': 0, 'never': 0, 'out': 0, 'ready': 0,
            'clientDays': 0.0, 'commercialDays': 0.0, 'revenue': 0.0,
            'stopped': 0, 'holdingOnly': 0,
        })
        r['assets'] += 1
        r['issued'] += 1 if a.get('issued') else 0
        r['never'] += 0 if a.get('issued') else 1
        r['out'] += 1 if a.get('status') == MI.OUT_STATUS else 0
        r['ready'] += 1 if a.get('status') == MI.READY_STATUS else 0
        r['clientDays'] += a.get('clientDays') or 0.0
        r['commercialDays'] += a.get('commercialDays') or 0.0
        r['revenue'] += a.get('revenue') or 0.0
        r['holdingOnly'] += 1 if a.get('holdingOnly') else 0
    for b in out['stopped']:
        u = units.get(b.get('unit') or 'Unassigned')
        if u:
            u['stopped'] += 1
    for r in units.values():
        r['everPct'] = _pct(r['issued'], r['assets'])
        r['neverPct'] = _pct(r['never'], r['assets'])
        #  days a client actually held it, over days it was booked out
        #  at all. Under 100% means it went out on the store's own
        #  account and never reached a crew.
        r['clientPct'] = _pct(r['clientDays'], r['commercialDays'])
    out['units'] = sorted(units.values(), key=lambda r: -r['clientDays'])

    # ---------------- by variant: the workhorses and the dead ----
    vs = [v for v in data['variants']]
    out['workhorses'] = sorted(
        [v for v in vs if v['clientDays'] > 0],
        key=lambda v: -v['clientDays'])
    out['neverMoved'] = sorted(
        [v for v in vs if not v['issuedOnce'] and v['assets'] >= FLEET_MIN],
        key=lambda v: -v['assets'])
    #  PART FLEET. The surplus is what never moved, not what is idle
    #  right now - a fleet can be fully out today and still have twenty
    #  spares that have never been touched.
    part = []
    for v in vs:
        spare = v['assets'] - v['issuedOnce']
        if v['issuedOnce'] and spare > 0 and v['assets'] >= FLEET_MIN:
            w = dict(v)
            w['spare'] = spare
            w['sparePct'] = _pct(spare, v['assets'])
            part.append(w)
    out['partFleet'] = sorted(part, key=lambda v: -v['spare'])

    #  ISSUED BUT NEVER TO A CLIENT. It moved on the store's own
    #  account and no crew ever signed for it - which is not the same
    #  as never issued, and has a different conversation attached.
    out['neverToClient'] = sorted(
        [v for v in vs if v['issuedOnce'] and not v['clientIssuedOnce']],
        key=lambda v: -v['assets'])

    # ---------------- the headline, plant and tooling apart -----
    t = data['totals']
    out['totals'] = t
    out['split'] = {}
    for lab in ('plant', 'tooling'):
        g = [a for a in assets if bool(a.get('plant')) is (lab == 'plant')]
        nv = [a for a in g if not a.get('issued')]
        out['split'][lab] = {
            'assets': len(g), 'never': len(nv),
            'neverPct': _pct(len(nv), len(g)),
            'out': sum(1 for a in g if a.get('status') == MI.OUT_STATUS),
            'clientDays': sum(a.get('clientDays') or 0.0 for a in g),
            'revenue': sum(a.get('revenue') or 0.0 for a in g),
        }
    return out


# =====================================================================
#  THE TIMELINE
#
#  WHY (Andrew, 2 Aug 2026): "a nice visual time line. and costs line
#  showing beautifully."
#
#  ---------------------------------------------------------------
#  ONE ASSET, ONE DAY, ONCE
#  ---------------------------------------------------------------
#  The same physical hire turns up on both transaction sheets, so
#  counting transaction lines per day double-counts it - the same
#  mistake that once put peak at 8 on a fleet of 4. Each asset is
#  tested against the day ONCE and lands in one bucket, so the bars
#  are a count of gear, not a count of paperwork.
#
#  ---------------------------------------------------------------
#  WITH A CREW, OR JUST OUT
#  ---------------------------------------------------------------
#  An asset booked to the site holding account is out of the store but
#  no crew has signed for it. Stacking that on top of client-issued
#  gear as if they were the same thing hides the entire problem this
#  suite exists to show, so they are two bands and the top one is the
#  one that means "nobody asked for this".
#
#  ---------------------------------------------------------------
#  THE LINE STOPS WHERE THE DATA STOPS
#  ---------------------------------------------------------------
#  Days past the export are NOT zero. A chart that runs a line to the
#  right-hand edge through days nobody pulled is drawing a cliff that
#  did not happen. Both series end on their own last real day and the
#  rest of the axis is marked as not covered.
#
#  Money and gear are on SEPARATE charts, deliberately. They are
#  different scales and a second y-axis on one chart is the fastest
#  way to make two unrelated shapes look like they explain each other.
# =====================================================================
def timeline(data, ds=None):
    """Day by day: how much gear was out, and what it billed."""
    assets = list(data['assets'].values())
    frm = (dt.date.fromisoformat(data['sourceFrom'])
           if data.get('sourceFrom') else None)
    to = (dt.date.fromisoformat(data['sourceTo'])
          if data.get('sourceTo') else None)
    if not frm or not to:
        return None

    #  the money series carries further than the gear series on some
    #  pulls and less far on others, so the axis is the union and each
    #  series says where IT stops.
    money = {}
    if ds and ds['daily']:
        money = {d: v for d, v in ds['daily']}
    last_money = max(money) if money else None
    right = max([x for x in (to, last_money) if x])
    left = min([x for x in (frm, min(money)) if x]) if money else frm

    days, cur = [], left
    while cur <= right:
        days.append(cur)
        cur += dt.timedelta(days=1)

    rows = []
    for d in days:
        client = holding = 0
        for a in assets:
            out_today = any(s <= d <= e for s, e in a.get('outSpans') or ())
            if not out_today:
                continue
            #  ONE ASSET, ONE BUCKET. A crew's claim beats the holding
            #  account - if someone signed for it that day, it was
            #  working, whatever else it was also booked to that day.
            if any(s <= d <= e for s, e in a.get('clientSpans') or ()):
                client += 1
            else:
                holding += 1
        rows.append({
            'date': d,
            'client': client, 'holding': holding,
            'out': client + holding,
            'gear': frm <= d <= to,
            #  THE LAST COVERED DAY IS THE EXPORT'S EDGE, not the end of
            #  the job. A pull taken mid-morning has only the hires that
            #  were already keyed, so the final column reads low for a
            #  reason that has nothing to do with gear going home. Named
            #  here so the chart can say so rather than let the reader
            #  see a drop that is not there.
            'edge': d == to,
            'money': money.get(d),
            'day': (d - SD.FLAME_OFF).days,
            'milestone': SD.MILESTONES.get((d - SD.FLAME_OFF).days, ''),
        })
    return {
        'rows': rows,
        'gearTo': to, 'gearFrom': frm,
        'moneyTo': last_money,
        'maxOut': max([r['out'] for r in rows] or [0]),
        'maxMoney': max([r['money'] or 0 for r in rows] or [0]),
        'moneyTotal': sum(r['money'] or 0 for r in rows),
    }


# =====================================================================
#  THE PER-ASSET USAGE SCORE
#
#  WHY (Andrew, 2 Aug 2026): "where did we get to to have each tool
#  having a utilisation bar or a score on usage."
#
#  The bar already exists on the intelligence page. This is the number
#  that goes with it, and it uses THE SAME denominator - days the
#  transactions cover, from mobilisation - so the two can never tell a
#  different story about the same tool.
#
#  0-100, and it is a percentage of days, not a mark out of ten. A tool
#  that was with a crew every day the data covers scores 100. Nothing
#  is curved and nothing is rounded up to look better.
# =====================================================================
#  Floors, high to low. A score sits in the first band it clears, and
#  zero is its own band - "never issued" and "barely out" are different
#  conversations and must not share a label.
SCORE_BANDS = (
    (60.0, 'WORKING HARD'),
    (25.0, 'EARNING'),
    (0.01, 'BARELY OUT'),
)


def score_of(a, span_days):
    """Client days over days the data covers. Nothing else."""
    if not span_days:
        return None
    return max(0.0, min(100.0, 100.0 * (a.get('clientDays') or 0.0)
                        / span_days))


def band(score):
    if score is None:
        return 'NO DATA'
    for floor, lab in SCORE_BANDS:
        if score >= floor:
            return lab
    return 'NEVER ISSUED'


def scored(data, limit=None):
    """Every asset with a score, hardest-worked first."""
    span = data.get('sourceDays') or 0
    out = []
    for a in data['assets'].values():
        s = score_of(a, span)
        r = dict(a)
        r['score'] = s
        r['band'] = band(s)
        r['spanDays'] = span
        out.append(r)
    out.sort(key=lambda r: -(r['score'] or 0))
    return out[:limit] if limit else out


def lines(b):
    """The breakdown as printable lines."""
    L = []
    A = L.append
    A('=' * 66)
    A(' WHAT IS GETTING USED, AND WHAT IS NOT   as at {}'.format(
        b['asof'].strftime('%d %b %Y')))
    A('=' * 66)
    A('')
    c = b['counts']
    A('  {:,} assets on the register'.format(b['assets']))
    A('    working      {:>6,}   out now, or issued within {} days'.format(
        c['working'], b['stoppedAfter']))
    A('    stopped      {:>6,}   used, then nothing for {}+ days'.format(
        c['stopped'], b['stoppedAfter']))
    A('    never moved  {:>6,}   on site, never issued to anyone'.format(
        c['never']))
    A('    holding only {:>6,}   moved, but no client ever took it'.format(
        c['holdingOnly']))
    A('')
    A('  THE MONEY, AND THE ONE DISTINCTION THAT MATTERS')
    A('    Gear that is ON HIRE has the meter running. Gear that is')
    A('    Available for Hire is on site and NOT being charged. Only')
    A('    the first kind can be stopped to save anything today.')
    A('')
    A('    {:<14}{:>16}{:>18}'.format(
        '', 'ON HIRE $/day', 'on site, not chg'))
    for key, lab in (('never', 'never moved'), ('stopped', 'stopped'),
                     ('holdingOnly', 'holding only')):
        A('    {:<14}{:>16}{:>18}'.format(
            lab,
            '${:,.2f} ({})'.format(b[key + 'OnCharge'],
                                   b[key + 'OnChargeN']),
            '${:,.2f} ({})'.format(b[key + 'NotCharging'],
                                   b[key + 'NotChargingN'])))
    A('')
    A('    STOPPABLE TODAY   ${:,.2f}/day'.format(b['stoppablePerDay']))
    A('    That is gear on hire, on charge, that no crew is using. It')
    A('    is the only figure on this page that is a saving.')
    A('')
    A('    ${:,.2f}/day sits on site NOT charging. That is not a'.format(
        b['sittingNotCharging']))
    A('    bill and must never be quoted as one - it is what the site')
    A('    would pay if all of it went on hire, and it is the size of')
    A('    the over-mobilisation, which is next time\'s conversation.')
    unp = (b['neverUnpriced'] + b['stoppedUnpriced']
           + b['holdingOnlyUnpriced'])
    if unp:
        A('')
        A('    {:,} of these assets have no rate this suite can find, so'
          .format(unp))
        A('    both figures above are a FLOOR, not a total. A blank rate')
        A('    is not $0.')
    if b.get('rateSources'):
        A('    priced from: ' + ', '.join(
            '{} x {}'.format(v, k) for k, v in
            sorted(b['rateSources'].items(), key=lambda kv: -kv[1])))
    A('')
    A('  PLANT AND TOOLING, SEPARATELY')
    for lab in ('plant', 'tooling'):
        s = b['split'][lab]
        A('    {:<8} {:>5,} assets | {:>5,} never issued ({:.0f}%) | '
          '{:>4,} out now'.format(lab, s['assets'], s['never'],
                                  s['neverPct'], s['out']))
    A('')
    A('  BY CATEGORY - most used first')
    A('    {:<24}{:>6}{:>7}{:>8}{:>10}'.format(
        'category', 'assets', 'never', 'out now', 'client d'))
    for r in b['units']:
        A('    {:<24}{:>6,}{:>7,}{:>8,}{:>10,.0f}'.format(
            r['unit'][:24], r['assets'], r['never'], r['out'],
            r['clientDays']))
    A('')
    A('  NEVER MOVED - whole fleets that have not been touched')
    A('  (fleets of {}+, biggest first. This is the send-home list.)'.format(
        b['fleetMin']))
    if not b['neverMoved']:
        A('    None. Every fleet of {}+ has been issued at least once.'
          .format(b['fleetMin']))
    for v in b['neverMoved'][:25]:
        A('    {:>5,} x {}'.format(v['assets'], (v['name'] or v['desc'])[:52]))
    if len(b['neverMoved']) > 25:
        A('    ... and {} more fleets'.format(len(b['neverMoved']) - 25))
    A('')
    A('  TOO MANY BROUGHT - part of the fleet has never moved')
    A('  (spare = assets that have never once been issued)')
    A('    {:<44}{:>7}{:>7}{:>6}'.format('fleet', 'have', 'used', 'spare'))
    for v in b['partFleet'][:25]:
        A('    {:<44}{:>7,}{:>7,}{:>6,}'.format(
            (v['name'] or v['desc'])[:44], v['assets'], v['issuedOnce'],
            v['spare']))
    if len(b['partFleet']) > 25:
        A('    ... and {} more fleets'.format(len(b['partFleet']) - 25))
    A('')
    A('  STOPPED - used, then quiet for {}+ days'.format(b['stoppedAfter']))
    A('  (walk these. Quiet is not the same as finished.)')
    A('    {:<40}{:>7}{:>12}'.format('asset', 'quiet', 'last out'))
    for a in b['stopped'][:25]:
        last = _d(a.get('lastOut'))
        A('    {:<40}{:>5,}d{:>13}'.format(
            (a.get('desc') or a.get('item') or '')[:40], a['quietDays'],
            last.strftime('%d %b') if last else '?'))
    if len(b['stopped']) > 25:
        A('    ... and {:,} more'.format(len(b['stopped']) - 25))
    A('')
    A('  ISSUED, BUT NEVER TO A CLIENT')
    A('  (it moved on the store\'s own account. No crew signed for it.)')
    if not b['neverToClient']:
        A('    None.')
    for v in b['neverToClient'][:15]:
        A('    {:>5,} x {}'.format(v['assets'], (v['name'] or v['desc'])[:52]))
    A('')
    A('  WHAT THIS CANNOT SEE')
    A('    Days outside {} are NO DATA, not idle days. Anything'.format(
        b['asof'].strftime('%d %b')))
    A('    used since that date reads here as quiet, and is not.')
    A('')
    A('    This page and the Flame Off plant sheet count different')
    A('    things and are MEANT to differ. Flame Off asks what is on')
    A('    the Site Plant account right now, plant only. This asks')
    A('    which assets have ONLY ever been on the holding account,')
    A('    across the whole register. Neither is wrong; they are not')
    A('    the same question and their totals should not match.')
    return L
