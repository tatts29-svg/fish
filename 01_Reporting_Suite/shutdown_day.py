#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR HQ - DAYS FROM FLAME OFF
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 2 Aug 2026): "days from Flame Off - this starts at 0 on
#  the 24/07/2026, then we back track days to -1 all the way to -12,
#  then we go from 0 to 20. 02/08/2026 being the Power Outage day which
#  is 9."
#
#  A DATE MEANS NOTHING ON A SHUTDOWN. Nobody on site thinks in
#  calendar dates - they think "we're on day 9" and "the outage is in
#  two days". Every report in this suite carries a date on it. Now it
#  carries the day number as well, so a sheet picked up off the counter
#  tells you where in the job you are without anybody counting on their
#  fingers.
#
#  THE MATHS IS THE WHOLE FILE. Day number = days since Flame Off.
#      12/07/2026 = -12   the first day the window covers
#      23/07/2026 = -1    the day before
#      24/07/2026 =  0    FLAME OFF
#      02/08/2026 =  9    POWER OUTAGE
#      13/08/2026 = 20    the last day the window covers
#
#  Checked against Andrew's own two fixed points: 24 July is 0 and
#  2 August is 9. July has 31 days, so 24 + 9 = 33, which is 2 August.
#  Both land.
#
#  OUTSIDE THE WINDOW IT SAYS SO. Before -12 and after +20 the day
#  number still counts, but the label says the window has not started
#  or has finished rather than pretending day 45 is a normal day.
# =====================================================================
import datetime as dt

#  The two dates Andrew gave. Change these and the whole suite follows.
FLAME_OFF = dt.date(2026, 7, 24)
FIRST_DAY = -12          # 12/07/2026
LAST_DAY = 20            # 13/08/2026

#  Days that have a name of their own. Add to this as the job runs -
#  a named day on a report is worth ten lines of explanation.
MILESTONES = {
    -4: 'GEAR ON HIRE',
    0: 'FLAME OFF',
    1: 'FIRST NIGHTSHIFT',
    9: 'POWER OUTAGE',
}

#  HOW THE JOB IS ACTUALLY MANNED AND MOBILISED. (Andrew, 2 Aug 2026:
#  "majority of gear startee going onhire on the 20/07/2026, first
#  nightshift stafted Saturday 26/07/2026, dayshift workforce 220,
#  nightshift workforce 100".)
#
#  These are not decoration. Without them a fleet is judged against
#  nothing:
#    * MOBILISED is the day the gear actually started going out. Days
#      before it are not idle days - there was nothing to issue yet -
#      and measuring across them marks every asset down for the fact
#      the job had not started.
#    * NIGHTSHIFT_FROM is the day the site went to two shifts. Peak
#      concurrent demand before and after that date are two different
#      questions, and a fleet sized on the single-shift half of the job
#      will be short the moment nights start.
#    * The head counts are what "enough" means. 23 gas monitors ready
#      is a number; 23 for 220 blokes on dayshift is a decision.
#
#  Change them here and every report follows.
MOBILISED = dt.date(2026, 7, 20)          # day -4
#  Andrew first gave this as "Saturday 26/07/2026", but 26 July 2026 is
#  a Sunday - 24 July is the Friday, which is Day 0 on his own sheet.
#  Checked with him: the shift went on Saturday EVENING the 25th and ran
#  into Sunday morning. It is anchored to the 25th because the 06:00 to
#  06:00 operational day already puts those small hours on the day the
#  shift started - see DAY_START_HOUR in mygear_intel.
NIGHTSHIFT_FROM = dt.date(2026, 7, 25)    # day +1, the Saturday night
WORKFORCE = {'day': 220, 'night': 100}


def workforce(d=None):
    """Heads on site for a given day - nights only count once they start."""
    d = d or dt.date.today()
    if isinstance(d, dt.datetime):
        d = d.date()
    n = WORKFORCE['night'] if d >= NIGHTSHIFT_FROM else 0
    return {'day': WORKFORCE['day'], 'night': n,
            'total': WORKFORCE['day'] + n,
            'shifts': 2 if n else 1}


def mobilised(d=None):
    """Has the gear started going out yet on this date?"""
    d = d or dt.date.today()
    if isinstance(d, dt.datetime):
        d = d.date()
    return d >= MOBILISED


def day(d=None):
    """The day number. 0 is Flame Off, negative is before it."""
    d = d or dt.date.today()
    if isinstance(d, dt.datetime):
        d = d.date()
    return (d - FLAME_OFF).days


def date_of(n):
    """The other way round: which date is day n."""
    return FLAME_OFF + dt.timedelta(days=int(n))


def in_window(d=None):
    return FIRST_DAY <= day(d) <= LAST_DAY


def milestone(d=None):
    """The name of this day, or ''."""
    return MILESTONES.get(day(d), '')


def short(d=None):
    """DAY 9 / DAY -3 - the tag for a header or a tile."""
    n = day(d)
    return 'DAY {}{}'.format('+' if 0 < n else '', n)


def label(d=None):
    """The full line: 'DAY 9 - POWER OUTAGE' or 'DAY -3 - 3 days to
    Flame Off'. Never invents a milestone that is not there."""
    n = day(d)
    m = MILESTONES.get(n, '')
    if m:
        return 'DAY {} · {}'.format(n, m)
    if n < 0:
        return 'DAY {} · {} day{} to Flame Off'.format(
            n, -n, '' if n == -1 else 's')
    if n > LAST_DAY:
        return 'DAY {} · past the shutdown window'.format(n)
    if n < FIRST_DAY:
        return 'DAY {} · before the shutdown window'.format(n)
    return 'DAY {} · {} day{} since Flame Off'.format(
        n, n, '' if n == 1 else 's')


def next_milestone(d=None):
    """The next named day and how far off it is, or None. Used for the
    'outage in 2 days' line - the one people actually plan around."""
    n = day(d)
    ahead = sorted(k for k in MILESTONES if k > n)
    if not ahead:
        return None
    k = ahead[0]
    return {'day': k, 'name': MILESTONES[k], 'away': k - n,
            'date': date_of(k)}


def calendar():
    """Every day in the window, for a strip or a printed planner."""
    out = []
    for n in range(FIRST_DAY, LAST_DAY + 1):
        out.append({'n': n, 'date': date_of(n),
                    'name': MILESTONES.get(n, '')})
    return out


if __name__ == '__main__':
    t = dt.date.today()
    print('=' * 62)
    print(' COATES | DAYS FROM FLAME OFF')
    print('=' * 62)
    print(' Flame Off : {} = day 0'.format(FLAME_OFF.strftime('%d/%m/%Y')))
    print(' Window    : day {} ({}) to day {} ({})'.format(
        FIRST_DAY, date_of(FIRST_DAY).strftime('%d/%m/%Y'),
        LAST_DAY, date_of(LAST_DAY).strftime('%d/%m/%Y')))
    print(' Today     : {} = {}'.format(t.strftime('%d/%m/%Y'), label(t)))
    nm = next_milestone(t)
    if nm:
        print(' Next      : {} on day {} ({}) - {} day(s) away'.format(
            nm['name'], nm['day'], nm['date'].strftime('%d/%m/%Y'),
            nm['away']))
    print('-' * 62)
    for row in calendar():
        star = '  <<< ' + row['name'] if row['name'] else ''
        here = '  * today' if row['date'] == t else ''
        print('  day {:>3}   {}{}{}'.format(
            row['n'], row['date'].strftime('%a %d/%m/%Y'), star, here))


# ---------------------------------------------------------------------
#  THE CLOCK, AS A PAGE. (Andrew, 4 Aug 2026 - he asked for 64 on the
#  phone, and 64 had no page: this module is a clock other screens read,
#  and the console printed a line and stopped.)
#
#  Where the job is up to, what day it is against Flame Off, the named
#  days behind and ahead, and how long is left. Nothing here is a
#  number anybody has to work out.
# ---------------------------------------------------------------------
def page(date_tag=None):
    import datetime as _dt
    import os as _os
    import page_style as PS

    today = _dt.date.today()
    d = day(today)
    wf = workforce(today)

    #  the end, from his own file - the whole clock counts to it
    end = None
    ef = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                       'shutdown_end.txt')
    try:
        with open(ef) as fh:
            end = _dt.date.fromisoformat(fh.read().strip()[:10])
    except Exception:
        pass
    left = (end - today).days if end else None

    tiles = [(('+' if d >= 0 else '') + str(d), 'days from Flame Off',
              '' if d >= 0 else 'a'),
             (today.strftime('%d %b'), 'today', '')]
    if left is not None:
        tiles.append((str(left), 'days to the end',
                      'r' if left <= 3 else ('a' if left <= 7 else 'g')))
    if wf:
        tiles.append((str(wf.get('total') or 0), 'on the tools',
                      ''))
        tiles.append((str(wf.get('shifts') or 0), 'shifts running', ''))

    #  every named day, behind and ahead, so nobody counts on fingers
    rows = []
    for n in sorted(MILESTONES):
        dd = date_of(n)
        gone = dd < today
        when = ('{} days ago'.format((today - dd).days) if gone
                else ('TODAY' if dd == today
                      else 'in {} days'.format((dd - today).days)))
        rows.append(PS.row(
            MILESTONES[n],
            dd.strftime('%A %d %B %Y') + ' &middot; day '
            + ('+' if n >= 0 else '') + str(n),
            when))
    if end:
        gone = end < today
        rows.append(PS.row(
            'SHUTDOWN ENDS',
            end.strftime('%A %d %B %Y') + ' &middot; day +' + str((end - FLAME_OFF).days),
            ('{} days ago'.format((today - end).days) if gone
             else ('TODAY' if end == today else 'in {} days'.format(left)))))

    blocks = [
        PS.tiles(tiles),
        "<h2>THE DAYS THAT HAVE A NAME</h2>",
        ''.join(rows),
    ]
    if wf:
        blocks += [
            "<h2>HOW IT IS MANNED</h2>",
            PS.row('Dayshift', 'on the tools', str(wf.get('day') or 0)),
            PS.row('Nightshift', 'on the tools', str(wf.get('night') or 0)),
        ]
    blocks.append(PS.note(
        '<b>Flame Off is day 0</b> &mdash; ' + FLAME_OFF.strftime('%d %B %Y')
        + '. Everything in this suite counts from it, so a fleet is never '
        'judged against days when there was nothing to issue.'))

    return PS.write('Coates_K2_Shutdown_Clock', 'Shutdown clock',
                    'Where the job is up to, in days.',
                    blocks, asof='Built ' + today.strftime('%d %b %Y'),
                    date_tag=date_tag)


if __name__ == '__main__':
    out = page()
    print('=' * 64)
    print(' COATES | SHUTDOWN CLOCK')
    print('=' * 64)
    print(' ' + label())
    print('')
    print(' Page: ' + out)
