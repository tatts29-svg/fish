#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MY GEAR HQ - HIDDEN ITEMS
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 2 Aug 2026): "can we permently remove these and ensure
#  these dont show up again remove from all history if any."
#
#  THE PROBLEM WITH "JUST DELETE THEM". The SiteIQ exports are pulled
#  fresh every morning and written straight over the top. Anything
#  deleted out of a spreadsheet is back tomorrow. So a line cannot be
#  removed once - it has to be removed EVERY TIME, on every build,
#  forever, without anybody having to remember.
#
#  That is what this file is. One list Andrew controls, read by every
#  report that touches the shelf, applied before a single number is
#  counted. A hidden line is not just hidden from the screen - it never
#  enters the maths, so it cannot inflate a line count, drag a stocktake
#  percentage down, or turn up in a print.
#
#  ABOUT "REMOVE FROM ALL HISTORY". Checked, and there is no SKU-level
#  history in the suite to purge:
#     - Updates\movement history holds a score and a rank per PERSON
#     - stocktake_log.json holds counting orders per AISLE
#  Neither one stores an item, so there is nothing carrying these lines
#  forward. The exports themselves are overwritten daily and are not an
#  archive. Filtering every build IS the permanent removal.
#
#  THE RULES THE LIST OBEYS
#    - A bare SKU hides that item everywhere.
#    - "SKU | STORAGE UNIT" hides it only in that storage unit, which
#      is how one line can be dead stock on the consumables shelf and
#      live gear in Tooling at the same time.
#    - Matching ignores case and stray spaces. A blank line or a line
#      starting with # is a note, not a rule.
#    - An unreadable or missing list hides NOTHING. It can never take
#      the board down.
# =====================================================================
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LIST_FILE = os.path.join(HERE, 'HIDDEN_ITEMS.txt')

_CACHE = None


def _norm(s):
    return ' '.join(str(s or '').strip().upper().split())


def load(path=None):
    """The rule set: a set of bare SKUs, and a set of (SKU, UNIT) pairs.

    Cached, because a build asks this thousands of times and the answer
    cannot change mid-run."""
    global _CACHE
    if _CACHE is not None and path is None:
        return _CACHE
    anywhere, in_unit = set(), set()
    p = path or LIST_FILE
    try:
        with io.open(p, 'r', encoding='utf-8-sig', errors='replace') as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '|' in line:
                    sku, unit = line.split('|', 1)
                    sku, unit = _norm(sku), _norm(unit)
                    if sku and unit:
                        in_unit.add((sku, unit))
                    elif sku:
                        anywhere.add(sku)
                else:
                    s = _norm(line)
                    if s:
                        anywhere.add(s)
    except Exception:
        #  A missing or broken list hides nothing. Losing a line off a
        #  report is a nuisance; a report that will not build because a
        #  text file has a bad character in it is a morning gone.
        anywhere, in_unit = set(), set()
    out = (anywhere, in_unit)
    if path is None:
        _CACHE = out
    return out


def hidden(sku, unit=None):
    """Is this line on the do-not-show list?"""
    anywhere, in_unit = load()
    if not anywhere and not in_unit:
        return False
    s = _norm(sku)
    if not s:
        return False
    if s in anywhere:
        return True
    return (s, _norm(unit)) in in_unit


def count():
    anywhere, in_unit = load()
    return len(anywhere) + len(in_unit)


def note(dropped, where=''):
    """One honest line for the console. A filter that removes things
    silently is a filter nobody trusts - if a line count looks light,
    the run should already have said why."""
    if not dropped:
        return ''
    return ('  Hidden items: {} line(s) left out{} - '
            'see HIDDEN_ITEMS.txt'.format(dropped, (' of ' + where) if where else ''))


def _cli():
    a, u = load()
    print('=' * 62)
    print(' COATES | HIDDEN ITEMS')
    print('=' * 62)
    print(' List file : ' + LIST_FILE)
    print(' Rules     : {} everywhere, {} in one storage unit'
          .format(len(a), len(u)))
    for s in sorted(a):
        print('   ' + s)
    for s, un in sorted(u):
        print('   {}  (only in {})'.format(s, un))
    if not a and not u:
        print(' Nothing is hidden. Every line in the export is reported.')
    print('')
    print(' Page      : ' + page())
    return 0


# ---------------------------------------------------------------------
#  WHAT IS HELD OFF THE BOARD, AND WHY. (Andrew, 4 Aug 2026 - 63 on the
#  phone. It had no page: it edits a text file and prints a count.)
#
#  This list matters more than it looks. Every line on it is something
#  a storeman will NOT see when he searches, and a screen that hides
#  things without saying so is the one thing this suite refuses to be.
#  So the hidden list is a page you can hold up.
# ---------------------------------------------------------------------
def page(date_tag=None):
    import datetime as _dt
    import page_style as PS

    anywhere, in_unit = load()
    rows_any = sorted(anywhere)
    rows_unit = sorted(in_unit)

    blocks = [PS.tiles([
        (str(len(rows_any) + len(rows_unit)), 'lines held off the board',
         'a' if (rows_any or rows_unit) else 'g'),
        (str(len(rows_any)), 'hidden everywhere', ''),
        (str(len(rows_unit)), 'hidden in one aisle only', ''),
    ])]

    if rows_any:
        blocks.append("<h2>HIDDEN EVERYWHERE<span>{} line(s)</span></h2>"
                      .format(len(rows_any)))
        blocks.append("<p>These never appear on any screen, in any aisle.</p>")
        blocks.append(PS.table(
            ['Code / SKU'], [[c] for c in rows_any]))
    if rows_unit:
        blocks.append("<h2>HIDDEN IN ONE AISLE<span>{} line(s)</span></h2>"
                      .format(len(rows_unit)))
        blocks.append("<p>Held off that aisle only - the same thing still "
                      "shows anywhere else it lives.</p>")
        blocks.append(PS.table(
            ['Code / SKU', 'Aisle'], [[c, u] for c, u in rows_unit]))
    if not rows_any and not rows_unit:
        blocks.append(PS.note(
            '<b>Nothing is hidden.</b> Every line on the register is on '
            'the board.'))

    blocks.append(PS.note(
        'This list lives in <b>HIDDEN_ITEMS.txt</b> - your file, and an '
        'update never overwrites it. Take a line out and it is back on '
        'the board at the next 04_RUN_MY_GEAR. '
        'Nothing is hidden that is not on this page.'))

    return PS.write('Coates_K2_Hidden_Items', 'Held off the board',
                    'What a storeman will NOT see when he searches, '
                    'and why.', blocks,
                    asof='Built ' + _dt.date.today().strftime('%d %b %Y'),
                    date_tag=date_tag)


if __name__ == '__main__':
    import sys as _sys
    _sys.exit(_cli())
