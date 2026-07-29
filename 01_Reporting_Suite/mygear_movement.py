#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR - MOVEMENT (how you're tracking, day on day)
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 29 Jul 2026): "lets add the movement."
#
#  A score on its own is a verdict. A score with an arrow beside it is a
#  story - "up 3 places since yesterday" is the line that brings a bloke
#  back tomorrow to look again.
#
#  Nothing in the SiteIQ exports remembers yesterday, so the page has to.
#  Every build writes one small file: each person's score and rank for
#  that day. Tomorrow's build reads it back and works out the arrows.
#
#  Rules this file lives by:
#    - The snapshot is DATA, not code. It lives in Updates\ with the
#      other registers, so 46_APPLY_UPDATE never overwrites it and a
#      suite update can never wipe the history.
#    - One entry per day. Re-running the build three times in a morning
#      overwrites today's entry and does NOT invent three days of
#      movement.
#    - No history yet means NO arrow. A first-day page says nothing
#      about movement rather than claiming everyone held steady.
#    - It keeps 60 days and prunes - it is a scoreboard, not an archive.
# =====================================================================
import datetime as dt
import io
import json
import os

FILE = 'mygear_history.json'
KEEP_DAYS = 60


def _path(base):
    return os.path.join(base, 'Updates', FILE)


def load(base):
    p = _path(base)
    if not os.path.isfile(p):
        return {}
    try:
        with io.open(p, 'r', encoding='utf-8') as fh:
            d = json.load(fh)
        return d if isinstance(d, dict) else {}
    except (ValueError, OSError):
        #  A corrupt scoreboard must never stop the morning run. We lose
        #  the arrows for a day and carry on.
        return {}


def save(base, day, people):
    """people = {id: {'score': int, 'rank': int}}"""
    hist = load(base)
    hist[day] = people
    #  prune to the window, oldest first
    for k in sorted(hist.keys())[:-KEEP_DAYS]:
        hist.pop(k, None)
    p = _path(base)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + '.tmp'
    with io.open(tmp, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps(hist, separators=(',', ':')))
    os.replace(tmp, p)          # never leave a half-written scoreboard
    return len(hist)


def previous_day(base, today):
    """The most recent day we have that ISN'T today."""
    hist = load(base)
    days = sorted(k for k in hist.keys() if k < today)
    return (days[-1], hist[days[-1]]) if days else (None, {})


def movement(prev_people, idno, score, rank):
    """What changed for one person since the last build.

    Returns None when there is nothing honest to say - no history for
    them at all - so the page shows no arrow rather than a made-up one.
    """
    was = prev_people.get(idno)
    if not was:
        return None
    try:
        was_rank = int(was.get('rank'))
        was_score = int(was.get('score'))
    except (TypeError, ValueError):
        return None
    #  rank: a SMALLER number is better, so a fall in rank number is a
    #  climb up the board. Say it the way a person would.
    up = was_rank - rank
    if up > 0:
        arrow, word = 'up', 'up {} place{}'.format(up, '' if up == 1 else 's')
    elif up < 0:
        arrow, word = 'down', 'down {} place{}'.format(-up, '' if up == -1 else 's')
    else:
        arrow, word = 'hold', 'holding your spot'
    return {'dir': arrow, 'word': word, 'places': up,
            'score': score - was_score, 'wasRank': was_rank}


def today_key(now=None):
    return (now or dt.datetime.now()).strftime('%Y-%m-%d')
