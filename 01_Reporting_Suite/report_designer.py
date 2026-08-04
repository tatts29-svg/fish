#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | DESIGN A REPORT - the endless one
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 4 Aug 2026): "add different types of reports we can
#  pull out of here. that needs to be endless - by design, or by idea,
#  or how we want to see the reports. reports by a group of a tool, or
#  by performance etc, there are lots."
#
#  Right. Twenty-three fixed reports is not endless - it is
#  twenty-three. Every one of them was somebody's idea once, hard-coded
#  the day it was asked for, and the next idea needs another build.
#
#  So this is the engine underneath instead of another report on top.
#  FOUR QUESTIONS and you have a report:
#
#     WHAT is one line?     an asset, a bloke, a company, a product,
#                           an aisle
#     WHICH ones?           any number of filters, stacked
#     GROUPED how?          by company, person, aisle, product, band...
#     SORTED how?           days out, utilisation, times used, name
#
#  "Every 3/4 socket out more than 7 days, grouped by company, worst
#  first" is a report. So is "every product nobody has touched" and
#  "the ten hardest-worked machines on site". None of them existed
#  five minutes ago and none of them needed me.
#
#  AND THE IDEA KEEPS. Name it and it is saved into REPORT_RECIPES.txt
#  - his file, an update never overwrites it - and 77_RUN_MY_REPORTS
#  builds every saved one each morning. Today's idea becomes tomorrow's
#  standing report without anybody rebuilding anything.
#
#  NO MONEY ON ANY OF IT. Days, counts, utilisation, who and where.
#  Rates are a different question with a different door (the manager
#  code), and a designer that could quietly put a rate on a page a
#  contractor might see is not worth having.
#
#  Run it:  py report_designer.py                (or 76_DESIGN_A_REPORT)
#           py report_designer.py --recipe "..."  scripted
#           py report_designer.py --all           every saved recipe
# =====================================================================
from __future__ import print_function

import datetime as dt
import html
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RECIPES = os.path.join(HERE, 'REPORT_RECIPES.txt')


def _esc(s):
    return html.escape('' if s is None else str(s), quote=True)


# ---------------------------------------------------------------------
#  1. WHAT IS ONE LINE?
# ---------------------------------------------------------------------
ROWS = [
    ('asset',   'One asset', 'every item number on its own line'),
    ('person',  'One bloke', 'each person, and what he is holding'),
    ('company', 'One company', 'each company, and how much it has'),
    ('product', 'One product', 'each product variant across the fleet'),
    ('aisle',   'One aisle', 'each aisle in the store'),
]

# ---------------------------------------------------------------------
#  2. WHICH ONES? Every filter is a plain question with a plain answer.
#     Anything that takes a value takes it after a colon.
# ---------------------------------------------------------------------
FILTERS = [
    ('onhire',    'Only what is out with a crew',            None),
    ('onshelf',   'Only what is on the shelf',               None),
    ('overdue',   'Only gear out longer than N days',        'days'),
    ('idle',      'Only gear sitting idle N days or more',   'days'),
    ('never',     'Only what has never been issued',         None),
    ('company',   'Only one company',                        'name'),
    ('person',    'Only one bloke',                          'name'),
    ('aisle',     'Only one aisle',                          'name'),
    ('product',   'Only products matching a word',           'word'),
    ('family',    'Only one family (tools, rigging...)',     'word'),
    ('band',      'Only a performance band (high/ok/low)',   'band'),
    ('worked',    'Only worked N% or more',                  'pct'),
    ('easy',      'Only worked LESS than N%',                'pct'),
    ('used',      'Only used N times or more',               'count'),
    ('plant',     'Only plant (the machines)',               None),
    ('serial',    'Only things carrying a serial number',    None),
    ('norack',    'Only things with no shelf recorded',      None),
    ('nophoto',   'Only things with no photograph yet',      None),
]

# ---------------------------------------------------------------------
#  3. GROUPED HOW?
# ---------------------------------------------------------------------
GROUPS = [
    ('none',    'Not grouped - one straight list'),
    ('company', 'By company'),
    ('person',  'By bloke'),
    ('aisle',   'By aisle'),
    ('product', 'By product'),
    ('family',  'By family'),
    ('band',    'By how hard it has worked'),
    ('status',  'By on hire / on the shelf'),
]

# ---------------------------------------------------------------------
#  4. SORTED HOW?  (- prefix = biggest first)
# ---------------------------------------------------------------------
SORTS = [
    ('-days',   'Longest out first'),
    ('-worked', 'Hardest worked first'),
    ('worked',  'Least worked first - what to send out next'),
    ('-used',   'Most times out first'),
    ('used',    'Fewest times out first'),
    ('-count',  'Biggest holding first'),
    ('name',    'By name, A to Z'),
    ('-idle',   'Longest idle first'),
]


def _band(score):
    import fleet_detail as FD
    return FD.band(score)


def load(quiet=False):
    """Every asset, with the performance figures attached - off the same
    engine Fleet Details ranks with, so nothing designed here can ever
    disagree with the screens."""
    import fleet_detail as FD
    import forecast as FC
    import mygear_intel as MI
    import ownership as OWN
    import racks as RK
    import serials as SR

    rental = FC._newest('RENTAL_STOCK*.xlsx')
    txn = FC._newest('TRANSACTIONS*.xlsx')
    if not rental or not txn:
        return None, 'No RENTAL_STOCK / TRANSACTIONS export found.'
    d = MI.read(rental, txn, FC._newest('ON_HIRE*.xlsx'))
    span = d.get('sourceDays') or 0
    seqs = OWN.zero_cost_sequences(d['assets'].values())

    thumbs = set()
    tdir = os.path.join(HERE, 'Gear_Lookup', 'thumbs')
    if os.path.isdir(tdir):
        thumbs = {os.path.splitext(f)[0].upper()
                  for f in os.listdir(tdir) if f.lower().endswith('.jpg')}

    today = dt.date.fromisoformat(d['sourceTo']) if d.get('sourceTo') \
        else dt.date.today()
    rows = []
    for a in d['assets'].values():
        try:
            r = FD.asset_row(a, span, False, seqs)
        except Exception:
            continue
        out = a.get('onHireDate')
        rows.append({
            'item': a.get('item') or '', 'bc': a.get('bc') or '',
            'desc': a.get('desc') or '', 'variant': a.get('variant') or '',
            'aisle': a.get('unit') or '', 'family': a.get('family') or '',
            'product': a.get('product') or '',
            'status': a.get('status') or '',
            'onhire': a.get('status') == MI.OUT_STATUS,
            'person': a.get('holder') or '', 'company': a.get('holderCo') or '',
            'days': ((today - out).days + 1) if out else None,
            'used': r['cycles'] or 0,
            'worked': None if r['score'] is None else round(r['score'], 1),
            'band': r['band'], 'word': r['word'],
            'idle': r['idle'], 'excluded': bool(r['excluded']),
            'why': r['why'] or '',
            'plant': bool(a.get('plant')),
            'never': bool(a.get('neverIssued')),
            'serial': SR.serial_of(a.get('item') or ''),
            'rack': RK.where(a.get('item') or '', a.get('bc') or '',
                             a.get('variant') or ''),
            'photo': (a.get('variant') or '').upper().replace(' ', '') in
                     {t.replace('_', '').replace(' ', '') for t in thumbs}
                     or (a.get('variant') or '').upper() in thumbs,
        })
    return rows, None


#  what each filter actually does to a row
def _keep(r, key, val):
    if key == 'onhire':
        return r['onhire']
    if key == 'onshelf':
        return not r['onhire'] and not r['excluded']
    if key == 'overdue':
        return r['onhire'] and (r['days'] or 0) >= int(val or 7)
    if key == 'idle':
        return (r['idle'] or 0) >= int(val or 7)
    if key == 'never':
        return r['never']
    if key == 'company':
        return (val or '').lower() in (r['company'] or '').lower()
    if key == 'person':
        return (val or '').lower() in (r['person'] or '').lower()
    if key == 'aisle':
        return (val or '').lower() in (r['aisle'] or '').lower()
    if key == 'product':
        return (val or '').lower() in (
            (r['desc'] or '') + ' ' + (r['variant'] or '')).lower()
    if key == 'family':
        return (val or '').lower() in (
            (r['family'] or '') + ' ' + (r['product'] or '')).lower()
    if key == 'band':
        return r['band'] == (val or '').lower()
    if key == 'worked':
        return (r['worked'] or 0) >= float(val or 50)
    if key == 'easy':
        return (r['worked'] or 0) < float(val or 20)
    if key == 'used':
        return r['used'] >= int(val or 1)
    if key == 'plant':
        return r['plant']
    if key == 'serial':
        return bool(r['serial'])
    if key == 'norack':
        return not r['rack']
    if key == 'nophoto':
        return not r['photo']
    return True


def _roll(rows, kind):
    """Fold the asset lines up into people, companies, products, aisles.

    A count that quietly drops the lines it could not measure is the
    thing this suite refuses to do, so every rolled-up line carries how
    many of its own it could not put a figure on."""
    if kind == 'asset':
        return rows
    key = {'person': 'person', 'company': 'company',
           'product': 'variant', 'aisle': 'aisle'}[kind]
    out = {}
    for r in rows:
        k = r.get(key) or '(not recorded)'
        g = out.setdefault(k, {'name': k, 'count': 0, 'onhire': 0,
                               'days': [], 'worked': [], 'used': 0,
                               'noworked': 0, 'company': r.get('company', ''),
                               'aisle': r.get('aisle', ''),
                               'desc': r.get('desc', '')})
        g['count'] += 1
        g['used'] += r['used']
        if r['onhire']:
            g['onhire'] += 1
            if r['days'] is not None:
                g['days'].append(r['days'])
        if r['worked'] is None:
            g['noworked'] += 1
        else:
            g['worked'].append(r['worked'])
    fin = []
    for g in out.values():
        g['daysmax'] = max(g['days']) if g['days'] else None
        g['days'] = round(sum(g['days']) / len(g['days']), 1) if g['days'] \
            else None
        g['worked'] = round(sum(g['worked']) / len(g['worked']), 1) \
            if g['worked'] else None
        g['band'], g['word'] = _band(g['worked'])
        g['idle'] = None
        fin.append(g)
    return fin


def _sortkey(r, how):
    rev = how.startswith('-')
    f = how.lstrip('-')
    v = r.get(f)
    if f == 'name':
        v = (r.get('name') or r.get('desc') or '').lower()
        return (v, )
    if v is None:
        v = -1 if rev else 10 ** 9
    return (v, )


COLS = {
    'asset': [('item', 'ITEM NO'), ('desc', 'WHAT IT IS'),
              ('aisle', 'AISLE'), ('rack', 'SHELF'),
              ('person', 'WHO HAS IT'), ('company', 'COMPANY'),
              ('days', 'DAYS OUT'), ('used', 'TIMES OUT'),
              ('worked', 'WORKED %'), ('word', 'BAND')],
    'person': [('name', 'WHO'), ('company', 'COMPANY'), ('count', 'ITEMS'),
               ('onhire', 'ON HIRE'), ('days', 'AVG DAYS'),
               ('daysmax', 'LONGEST'), ('used', 'TIMES OUT'),
               ('worked', 'AVG WORKED %'), ('word', 'BAND')],
    'company': [('name', 'COMPANY'), ('count', 'ITEMS'),
                ('onhire', 'ON HIRE'), ('days', 'AVG DAYS'),
                ('daysmax', 'LONGEST'), ('used', 'TIMES OUT'),
                ('worked', 'AVG WORKED %'), ('word', 'BAND')],
    'product': [('name', 'CODE'), ('desc', 'WHAT IT IS'), ('aisle', 'AISLE'),
                ('count', 'ON SITE'), ('onhire', 'OUT NOW'),
                ('used', 'TIMES OUT'), ('worked', 'AVG WORKED %'),
                ('word', 'BAND')],
    'aisle': [('name', 'AISLE'), ('count', 'LINES'), ('onhire', 'OUT NOW'),
              ('used', 'TIMES OUT'), ('worked', 'AVG WORKED %'),
              ('word', 'BAND')],
}

CSS = """
@page{size:A4 landscape;margin:9mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;color:#14181D;font-size:9.5pt;
 background:#fff}
.hd{display:flex;align-items:flex-end;gap:14px;border-bottom:3px solid #F26222;
 padding-bottom:7px;margin-bottom:9px}
.hd h1{font-size:18pt;font-weight:800;flex:1;letter-spacing:-.4px}
.hd .m{text-align:right;font-size:8pt;color:#556;line-height:1.5}
.recipe{background:#F5F7FA;border-left:4px solid #F26222;padding:7px 11px;
 font-size:8.5pt;color:#333;margin-bottom:10px;line-height:1.6}
.recipe b{color:#B4410F}
h2{font-size:10.5pt;font-weight:800;background:#14181D;color:#fff;
 padding:5px 9px;margin:14px 0 0;border-radius:3px}
h2 span{float:right;font-weight:600;opacity:.8;font-size:8.5pt}
table{width:100%;border-collapse:collapse}
th{background:#EDEFF2;font-size:7.5pt;letter-spacing:.5px;text-align:left;
 padding:5px 7px;border-bottom:1.5px solid #C8CDD4;text-transform:uppercase;
 white-space:nowrap}
td{padding:4px 7px;border-bottom:1px solid #E3E7EB;font-size:9pt;
 vertical-align:top}
tr:nth-child(even) td{background:#FAFBFC}
td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td.code{font-family:Consolas,monospace;font-size:8pt}
.b{display:inline-block;font-size:7pt;font-weight:800;letter-spacing:.7px;
 border-radius:20px;padding:2px 7px;white-space:nowrap}
.b-low{background:#DCF3F6;color:#0C6A75}
.b-ok{background:#E2F4DB;color:#2C6B18}
.b-high{background:#FBE3D5;color:#94400A}
.b-none{background:#ECEFF2;color:#5A6470}
.ft{margin-top:14px;border-top:1px solid #C8CDD4;padding-top:7px;
 font-size:7.5pt;color:#667;line-height:1.6}
.none{background:#FFF3EC;border-left:4px solid #F26222;padding:11px 13px;
 font-size:10pt;margin:12px 0}
@media print{tr{break-inside:avoid}h2{break-after:avoid}}
"""


def _cell(r, f):
    v = r.get(f)
    if f == 'word':
        return ("<span class='b b-" + _esc(r.get('band') or 'none') + "'>"
                + _esc(v or 'NO DATA') + '</span>')
    if v is None or v == '':
        return '<span style="color:#98A0AA">-</span>'
    if f == 'worked':
        return _esc('{}%'.format(v))
    return _esc(v)


def render(rows, rec, note=''):
    kind = rec['rows']
    cols = COLS[kind]
    gkey = rec['group']
    #  group the finished lines - never the raw ones, so a rolled-up
    #  report groups by what it actually shows
    buckets = {}
    for r in rows:
        if gkey == 'none':
            k = ''
        elif kind == 'asset':
            k = r.get(gkey) or '(not recorded)'
        else:
            k = r.get(gkey) or r.get('name') or '(not recorded)'
        buckets.setdefault(k, []).append(r)

    body = []
    for k in sorted(buckets, key=lambda x: str(x).lower()):
        rs = buckets[k]
        rs.sort(key=lambda r: _sortkey(r, rec['sort']),
                reverse=rec['sort'].startswith('-'))
        if gkey != 'none':
            body.append('<h2>{}<span>{} line(s)</span></h2>'.format(
                _esc(k), len(rs)))
        body.append('<table><tr>'
                    + ''.join('<th>{}</th>'.format(_esc(h)) for _f, h in cols)
                    + '</tr>')
        for r in rs:
            body.append('<tr>' + ''.join(
                "<td class='{}'>{}</td>".format(
                    'num' if f in ('days', 'used', 'worked', 'count',
                                   'onhire', 'daysmax', 'idle')
                    else ('code' if f in ('item', 'bc') else ''),
                    _cell(r, f))
                for f, _h in cols) + '</tr>')
        body.append('</table>')

    if not rows:
        body = ["<div class='none'><b>Nothing matches this one.</b><br>"
                "That is an answer too - but check the filters below if you "
                "expected lines.</div>"]

    words = ' &middot; '.join(
        [dict(ROWS[i][0:2] for i in range(len(ROWS))).get(kind, kind)]
        + [_esc(f + (':' + v if v else '')) for f, v in rec['where']]
        + (['grouped by ' + gkey] if gkey != 'none' else [])
        + [dict(SORTS).get(rec['sort'], rec['sort']).lower()])

    today = dt.date.today().strftime('%d %b %Y')
    return ("<!doctype html><html lang='en-AU'><head><meta charset='utf-8'>"
            "<title>Coates | " + _esc(rec['name']) + "</title>"
            "<style>" + CSS + "</style></head><body>"
            "<div class='hd'><h1>" + _esc(rec['name'].upper()) + "</h1>"
            "<div class='m'><b>COATES</b> &middot; Cement Australia K2<br>"
            "Gladstone &middot; " + today + "<br>POWERED BY SITEIQ</div></div>"
            "<div class='recipe'><b>How this was built:</b> " + words
            + (("<br>" + note) if note else '')
            + "</div>" + ''.join(body) +
            "<div class='ft'>" + str(len(rows)) + " line(s). Read-only "
            "SiteIQ snapshot &mdash; nothing on this page is a live "
            "number.<br>No money on this report by design: rates live "
            "behind the manager code and nowhere else.<br>Author: Andrew "
            "Fisher &middot; POWERED BY SITEIQ</div></body></html>")


def run(rec, quiet=False):
    rows, err = load()
    if err:
        print('  ' + err)
        return 1
    before = len(rows)
    for f, v in rec['where']:
        rows = [r for r in rows if _keep(r, f, v)]
    kept = len(rows)
    rows = _roll(rows, rec['rows'])
    #  what the filters took out, said out loud
    note = ('Started with {:,} assets, {:,} matched.'.format(before, kept)
            if rec['where'] else 'Every asset on the register: {:,}.'
            .format(before))
    if rec['rows'] != 'asset':
        nof = sum(1 for r in rows if r.get('noworked'))
        if nof:
            note += (' {} of these lines have gear with no utilisation '
                     'figure - counted in the totals, left out of the '
                     'averages.'.format(nof))
    page = render(rows, rec, note)

    day = dt.date.today().isoformat()
    out_dir = os.path.join(HERE, 'Reports', day, 'Pages')
    os.makedirs(out_dir, exist_ok=True)
    safe = re.sub(r'[^A-Za-z0-9]+', '_', rec['name']).strip('_')[:60]
    out = os.path.join(out_dir, 'Coates_K2_Designed_{}_{}.html'.format(
        safe, day))
    with io.open(out, 'w', encoding='utf-8') as fh:
        fh.write(page)
    if not quiet:
        print('')
        print('  {:,} line(s)  ->  {}'.format(len(rows), out))
    return 0


# ---------------------------------------------------------------------
#  the recipe: one line of text, so it can be typed, saved, or scripted
#    rows=asset;where=onhire,overdue:7;group=company;sort=-days;name=...
# ---------------------------------------------------------------------
def parse(text):
    rec = {'rows': 'asset', 'where': [], 'group': 'none', 'sort': '-days',
           'name': 'Designed report'}
    for part in text.split(';'):
        if '=' not in part:
            continue
        k, v = part.split('=', 1)
        k, v = k.strip().lower(), v.strip()
        if k == 'rows' and v in dict(r[0:2] for r in ROWS):
            rec['rows'] = v
        elif k == 'where':
            for f in v.split(','):
                f = f.strip()
                if not f:
                    continue
                key, _c, val = f.partition(':')
                rec['where'].append((key.strip().lower(), val.strip()))
        elif k == 'group':
            rec['group'] = v
        elif k == 'sort':
            rec['sort'] = v
        elif k == 'name':
            rec['name'] = v
    return rec


def unparse(rec):
    return 'rows={};where={};group={};sort={};name={}'.format(
        rec['rows'],
        ','.join(f + (':' + v if v else '') for f, v in rec['where']),
        rec['group'], rec['sort'], rec['name'])


def saved():
    out = []
    if os.path.isfile(RECIPES):
        with io.open(RECIPES, encoding='utf-8', errors='ignore') as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith('#') and 'rows=' in line:
                    out.append(line)
    return out


def _ask(q, default=''):
    d = ' [{}]'.format(default) if default else ''
    try:
        return input(' {}{}: '.format(q, d)).strip() or default
    except EOFError:
        return default


def wizard():
    print('=' * 68)
    print(' COATES | DESIGN A REPORT - four questions')
    print('=' * 68)
    print('')
    print(' 1. WHAT IS ONE LINE?')
    for i, (k, name, what) in enumerate(ROWS, 1):
        print('   {:>2}  {:<14} {}'.format(i, name, what))
    n = _ask('Pick one', '1')
    rec = {'rows': ROWS[int(n) - 1][0] if n.isdigit()
           and 1 <= int(n) <= len(ROWS) else 'asset',
           'where': [], 'group': 'none', 'sort': '-days', 'name': ''}

    print('')
    print(' 2. WHICH ONES? (numbers, spaces between - blank for all)')
    for i, (k, what, arg) in enumerate(FILTERS, 1):
        print('   {:>2}  {}{}'.format(i, what,
                                      '  (needs a ' + arg + ')' if arg else ''))
    picks = _ask('Pick any', '')
    for p in picks.split():
        if not p.isdigit() or not (1 <= int(p) <= len(FILTERS)):
            continue
        key, what, arg = FILTERS[int(p) - 1]
        val = _ask('   ' + what + ' - ' + arg, '') if arg else ''
        rec['where'].append((key, val))

    print('')
    print(' 3. GROUPED HOW?')
    for i, (k, what) in enumerate(GROUPS, 1):
        print('   {:>2}  {}'.format(i, what))
    g = _ask('Pick one', '1')
    rec['group'] = GROUPS[int(g) - 1][0] if g.isdigit() \
        and 1 <= int(g) <= len(GROUPS) else 'none'

    print('')
    print(' 4. SORTED HOW?')
    for i, (k, what) in enumerate(SORTS, 1):
        print('   {:>2}  {}'.format(i, what))
    sv = _ask('Pick one', '1')
    rec['sort'] = SORTS[int(sv) - 1][0] if sv.isdigit() \
        and 1 <= int(sv) <= len(SORTS) else '-days'

    print('')
    rec['name'] = _ask('Call it what?', 'Designed report')
    run(rec)

    print('')
    keep = _ask('Save this idea so it builds every morning? y/n', 'y')
    if keep.lower().startswith('y'):
        first = not os.path.isfile(RECIPES)
        with io.open(RECIPES, 'a', encoding='utf-8') as fh:
            if first:
                fh.write(
                    u'# YOUR OWN REPORTS - Andrew\'s file. Updates never\n'
                    u'# overwrite it.\n#\n'
                    u'# One recipe per line. 77_RUN_MY_REPORTS builds every\n'
                    u'# one of them. Delete a line and it stops building.\n'
                    u'# Lines starting with # are ignored.\n#\n')
            fh.write(unparse(rec) + u'\n')
        print(' Saved. 77_RUN_MY_REPORTS builds it with the rest.')
    return 0


def main(argv):
    if '--all' in argv:
        recs = saved()
        if not recs:
            print(' No saved reports yet - run 76_DESIGN_A_REPORT to make one.')
            return 0
        print('=' * 68)
        print(' COATES | YOUR OWN REPORTS - {} saved'.format(len(recs)))
        print('=' * 68)
        for line in recs:
            rec = parse(line)
            print('')
            print(' ' + rec['name'])
            run(rec, quiet=False)
        return 0
    if '--recipe' in argv:
        i = argv.index('--recipe')
        if i + 1 < len(argv):
            return run(parse(argv[i + 1]))
        print(' --recipe needs the recipe after it.')
        return 1
    return wizard()


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
