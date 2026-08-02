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
    0: 'FLAME OFF',
    9: 'POWER OUTAGE',
}


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
