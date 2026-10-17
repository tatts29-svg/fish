#!/usr/bin/env python3
"""Author: Andrew Fisher. v10.57 part 3 data - the Coates delivery texts as one row per UNIT, matched to references.

Reads the full Coates text export (the spreadsheet Andrew sent: 335 texts, 8 Sep 09:39 to 16 Oct 17:47) and the page's
own DATA (programme rows, rental register, plant lines), and writes ontime1057_units.json - the derived per-unit table
that part3_ontime.py bakes into the page. The export itself is private and never copied into the repository; only the
derived times and windows below are kept. Nothing is written to the record.

    python3 -I build_ontime1057.py <export.xlsx> <page.html> [out.json]

How a text becomes a unit (study_5's corrected plan, 17 Oct 2026):
  - Booking texts ("order to deliver X to SITE on D between A - B") with the same item, site and day sent within 60 s
    of each other are SEPARATE units, each with its own first window (21 Sep: four 4.8 m buildings sent 12:49:55-59,
    06-09, 07-10, 09-12, 12-15).
  - A later booking text for the same item, site and day revises one unit: the one whose first window is nearest
    (start counted twice, end once; ties go to the unit revised least, and the revision is marked as one of several).
    Texts in one 60 s batch revise different units.
  - If a day has more delivered or failed texts for an item than units, the earliest later booking texts are read as
    further units (17 Sep: two 6.0 x 3.0 buildings booked 14 Sep 15:09 for 09:00-09:30 and 15:14 for 10:00-10:30).
  - Delivered and failed texts go to that day's units in time order (earliest text to the earliest first window, then
    the window in force, then booking order); "on its way" texts likewise, never after the unit's delivered text.
  - A delivered text with no unit that day goes to the earliest undelivered unit of the same item booked up to 7 days
    before (WC50: booked 25 Sep, texted delivered 28 Sep); otherwise it is kept as "delivered with no booking text".
  - Kept per unit: first window, every re-send with its sent time, the window in force at 00:00 on the day, on its way,
    delivered, failed.

How a unit is matched to a reference (offline, from the page's DATA):
  1. a reference written at the front of the text item (WC21, Wc86, P08 ...);
  2. else the programme rows for that day whose item is the same kind and size (a programme note "now 6m building"
     counts), narrowed by the rental register description (+-3 days) when that leaves some;
  3. else the register description alone (+-3 days);
  4. where several units share several references, the programme load order pairs them when every load time is known
     and different (21 Sep: P13 06:00, P14 07:00, P15 09:00, P16 "NOW 22ND"); otherwise the unit is "one of" them.
  REVIEWED below settles the cases these rules cannot, each with its source. The docket is taken only from a matched
  register line (never from the texts, which carry none). SET_ASIDE lists texts the site record contradicts, with
  every source named; there is no general "on site an earlier day" rule.
"""
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
EXPORT_AT = '16 Oct 2026 17:47'
EXPORT_DAY = '2026-10-16'
YEAR = 2026

# ---------------------------------------------------------------------------------------------------------------- texts

def load_texts(xlsx):
    import openpyxl
    msgs = []
    for row in list(openpyxl.load_workbook(xlsx, read_only=True).worksheets[0].iter_rows(values_only=True))[1:]:
        if not row or not row[1] or not row[4]:
            continue
        ds = re.sub(r'\s+', ' ', str(row[1]).replace(' ', ' ')).replace('Sept', 'Sep').strip()
        msgs.append((datetime.strptime(ds, '%d %b %Y %I:%M:%S %p'), re.sub(r'\s+', ' ', str(row[4])).strip()))
    msgs.sort(key=lambda m: m[0])
    return msgs


def norm(s):
    return re.sub(r'\s+', ' ', s).strip()


def events(msgs):
    ev = []
    for i, (at, t) in enumerate(msgs):
        a = re.search(r'order to deliver (.+?) to ([A-Z ]+?) on (\d{1,2} \w{3}) between (\d{2}:\d{2}) - (\d{2}:\d{2})', t)
        if a:
            day = datetime.strptime(a.group(3) + ' %d' % YEAR, '%d %b %Y').date()
            ev.append(dict(i=i, kind='booked', item=norm(a.group(1)), site=a.group(2).strip(), day=day, w=(a.group(4), a.group(5)), at=at))
            continue
        a = re.search(r'order for (.+?) to ([A-Z ]+?) is on its way', t)
        if a:
            ev.append(dict(i=i, kind='onway', item=norm(a.group(1)), site=a.group(2).strip(), at=at)); continue
        a = re.search(r'Your (.+?) from Coates has been delivered to ([A-Z ]+?)\.', t)
        if a:
            ev.append(dict(i=i, kind='delivered', item=norm(a.group(1)), site=a.group(2).strip(), at=at)); continue
        a = re.search(r'Your (.+?) from Coates could not be delivered', t)
        if a:
            ev.append(dict(i=i, kind='failed', item=norm(a.group(1)), site='', at=at)); continue
        ev.append(dict(i=i, kind='other', item='', site='', at=at))
    return ev


def mins(hhmm):
    h, m = hhmm.split(':'); return int(h) * 60 + int(m)


def wdist(a, b):
    """distance between two windows: the start counted twice (Coates mostly keeps the start and widens the end)"""
    return 2 * abs(mins(a[0]) - mins(b[0])) + abs(mins(a[1]) - mins(b[1]))


def build_units(ev):
    booked = [e for e in ev if e['kind'] == 'booked']
    keyed = defaultdict(list)
    for e in booked:
        keyed[(e['item'], e['site'], e['day'])].append(e)
    finals = [e for e in ev if e['kind'] in ('delivered', 'failed')]
    units = []
    for key, texts in keyed.items():
        texts.sort(key=lambda e: e['at'])
        item, site, day = key
        first = texts[0]['at']
        creators = [e for e in texts if (e['at'] - first).total_seconds() <= 60]
        later = [e for e in texts if e not in creators]
        n_final = len([x for x in finals if x['item'] == item and (not x['site'] or x['site'] == site) and x['at'].date() == day])
        while len(creators) < n_final and later:
            creators.append(later.pop(0))          # more delivered/failed texts than units: a later booking is a further unit
        us = []
        for e in creators:
            us.append(dict(item=item, site=site, day=day, w=e['w'], booked_at=e['at'], rs=[], promoted=e['at'] - first > timedelta(seconds=60)))
        # revisions, in send order; one 60 s batch revises different units
        batch_used, batch_at = set(), None
        for e in later:
            if batch_at is None or (e['at'] - batch_at).total_seconds() > 60:
                batch_used = set()
            batch_at = e['at']
            pool = [u for j, u in enumerate(us) if j not in batch_used] or us
            best = min(wdist(u['w'], e['w']) for u in pool)
            tied = [u for u in pool if wdist(u['w'], e['w']) == best]
            tied.sort(key=lambda u: (len(u['rs']), us.index(u)))
            u = tied[0]
            batch_used.add(us.index(u))
            u['rs'].append(dict(w=e['w'], at=e['at'], one=len(tied) > 1, of=len(us)))
        units.extend(us)
    for u in units:
        cut = datetime.combine(u['day'], datetime.min.time())
        before = [r for r in u['rs'] if r['at'] < cut]
        u['wf'] = before[-1]['w'] if before else u['w']
        u['wl'] = u['rs'][-1]['w'] if u['rs'] else u['w']
        u['delivered'] = u['failed'] = u['onway'] = None
    # delivered / failed texts to units in time order
    used = set()
    order = lambda u: (mins(u['w'][0]), mins(u['wf'][0]), u['booked_at'])
    for key in {(u['item'], u['site'], u['day']) for u in units}:
        us = sorted([u for u in units if (u['item'], u['site'], u['day']) == key], key=order)
        item, site, day = key
        fx = sorted([x for x in finals if x['i'] not in used and x['item'] == item and (not x['site'] or x['site'] == site) and x['at'].date() == day], key=lambda x: x['at'])
        for u, x in zip(us, fx):
            used.add(x['i']); u['delivered' if x['kind'] == 'delivered' else 'failed'] = x['at']
    # a delivered text left over: the earliest undelivered unit of that item booked up to 7 days before
    for x in finals:
        if x['i'] in used or x['kind'] != 'delivered':
            continue
        c = [u for u in units if u['item'] == x['item'] and (not x['site'] or u['site'] == x['site']) and u['day'] < x['at'].date()
             and (x['at'].date() - u['day']).days <= 7 and not u['delivered'] and not u['failed']]
        if c:
            u = min(c, key=lambda u: u['day']); used.add(x['i']); u['delivered'] = x['at']; u['later_day'] = True
    # a failed text left over: the latest unit of that item up to that day
    for x in finals:
        if x['i'] in used or x['kind'] != 'failed':
            continue
        c = [u for u in units if u['item'] == x['item'] and u['day'] <= x['at'].date() and not u['failed']]
        if c:
            u = max(c, key=lambda u: u['day']); used.add(x['i']); u['failed'] = u['failed'] or x['at']
    # delivered with no booking text: kept, not counted
    nob = []
    for x in finals:
        if x['i'] in used:
            continue
        used.add(x['i'])
        nob.append(dict(item=x['item'], site=x['site'], day=x['at'].date(), w=None, booked_at=None, rs=[], wf=None, wl=None,
                        delivered=x['at'] if x['kind'] == 'delivered' else None, failed=x['at'] if x['kind'] == 'failed' else None, onway=None, nob=True))
    units.extend(nob)
    # on its way, per item and day, in delivered order, never after the delivered (or failed) text
    onw = [e for e in ev if e['kind'] == 'onway']
    oused = set()
    for u in sorted(units, key=lambda u: (u['delivered'] or u['failed'] or datetime.max)):
        end = u['delivered'] or u['failed']
        if not end:
            continue
        c = [e for e in onw if e['i'] not in oused and e['item'] == u['item'] and e['site'] == (u['site'] or e['site']) and e['at'].date() == end.date() and e['at'] <= end]
        if c:
            oused.add(c[0]['i']); u['onway'] = c[0]['at']
    per_min = defaultdict(int)
    for e in onw:
        per_min[e['at'].strftime('%Y-%m-%d %H:%M')] += 1
    for u in units:
        u['ow_batch'] = bool(u['onway'] and per_min[u['onway'].strftime('%Y-%m-%d %H:%M')] >= 3)
    return units

# ----------------------------------------------------------------------------------------------------------- page DATA

def load_data(page):
    t = Path(page).read_text(encoding='utf-8')
    i = t.index('const DATA = ') + len('const DATA = ')
    return json.JSONDecoder().raw_decode(t, i)[0]


REF = re.compile(r'^(?:WCTV|WC\d+|Wc\d+|wc\d+|P\d+|CP\d+|VMS\d+|WB\d+|GN\d+|AT\d+)\b')
LEAD_WORDS = re.compile(r'^(?:(?:WCTV|WC\d+|Wc\d+|P\d+|CP\d+|VMS\d+|WB\d+|GN\d+|AT\d+)\s+|supply[- ]\s*|coates[- ]\s*|events\s+)+', re.I)


def ref_of(item):
    m = REF.match(item)
    return m.group(0).upper() if m else None


def bare(desc):
    d = re.sub(r'\s*\+\s*\d+\s+items?$', '', desc).strip()
    return LEAD_WORDS.sub('', d).strip().lower()


def desc_match(text_item, reg_desc):
    """the texts cut an item at 43 characters: a cut item matches the start of a register description; a whole one must
    equal it, or carry more words than it (the register's "WC27 Toilet Block 6.0M x 3.0M" for "... - Male/Female")"""
    raw = re.sub(r'\s*\+\s*\d+\s+items?$', '', text_item).strip()
    a, b = bare(text_item), bare(reg_desc)
    if not a or not b:
        return False
    if len(raw) >= 43:
        return b.startswith(a)
    return a == b or a.startswith(b + ' ')


def size_of(s):
    m = re.search(r'(\d+(?:\.\d+)?)\s*m(?:\s*x|\b)', s, re.I)
    if not m:
        return None
    v = float(m.group(1)); return v


def kind_of_text(item):
    s = bare(item)
    if 'ticket office' in s: return ('ticket', size_of(s))
    if 'commentary booth' in s: return ('building', size_of(s))
    if 'portable building' in s: return ('building', size_of(s))
    if 'steps toilet block' in s: return ('steps', None)
    if 'toilet block' in s: return ('toilet_block', None)
    if 'sewage holding tank' in s: return ('waste_tank', None)
    if 'with trailer' in s: return ('fwf_trailer', None)
    if 'accessible' in s or 'disabled access' in s: return ('accessible', None)
    if 'fresh water flush' in s: return ('fwf', None)
    if 'barrier' in s: return ('barrier', None)
    if 'variable message' in s: return ('vms', None)
    if 'fork extension' in s: return ('fork_ext', None)
    if 'forklift' in s: return ('forklift', None)
    if 'container' in s: return ('container', size_of(s))
    if 'trakmat' in s: return ('trakmat', None)
    if 'scissor' in s: return ('lift', None)
    if 'external service' in s: return ('service', None)
    return ('other', None)


def kind_of_programme(e):
    it = (e.get('item') or '')
    s = it.lower()
    note = (e.get('note') or '') + ' ' + (e.get('notes') or '')
    now = re.search(r'now\s+(\d+(?:\.\d+)?)\s*m\s+building', note, re.I)
    if s.startswith('ticket box'): return ('ticket', size_of(it))
    if s.startswith('building'): return ('building', float(now.group(1)) if now else size_of(it))
    if 'toilet block' in s: return ('toilet_block', None)
    if 'waste tank' in s: return ('waste_tank', None)
    if 'fwf trailer' in s: return ('fwf_trailer', None)
    if 'accessible' in s: return ('accessible', None)
    if s == 'fwf': return ('fwf', None)
    if s == 'tl2': return ('barrier', None)
    if s == 'vms': return ('vms', None)
    if 'forklift' in s: return ('forklift', None)
    if 'cont' in s: return ('container', size_of(it))
    if 'trakmat' in s: return ('trakmat', None)
    return ('other', None)


def same_kind(a, b):
    if a[0] != b[0]:
        return False
    if a[1] is None or b[1] is None:
        return True
    return abs(a[1] - b[1]) < 0.05


CAT = {'building': 'Buildings', 'ticket': 'Buildings', 'container': 'Buildings', 'toilet_block': 'Toilets', 'waste_tank': 'Toilets',
       'fwf': 'Toilets', 'fwf_trailer': 'Toilets', 'accessible': 'Toilets', 'steps': 'Toilets', 'barrier': 'Water barriers',
       'vms': 'VMS boards', 'forklift': 'Forklifts', 'fork_ext': 'Forklifts', 'trakmat': 'Track mat', 'lift': 'Plant', 'service': 'Other'}


def word_of(kind, item):
    k, sz = kind
    num = lambda v: ('%g' % v) if v is not None else ''
    if k == 'building': return ('Commentary booth ' + num(sz) + ' m') if 'commentary' in item.lower() else ('Building ' + num(sz) + ' m' if sz else 'Building')
    return {'ticket': 'Ticket box', 'container': 'Container' + (' ' + num(sz) + ' m' if sz else ''), 'toilet_block': 'Toilet block', 'waste_tank': 'Waste tank',
            'fwf': 'FWF toilets', 'fwf_trailer': 'Toilet trailer', 'accessible': 'Accessible toilet', 'steps': 'Toilet block steps',
            'barrier': 'Water barriers', 'vms': 'VMS board', 'forklift': 'Forklift', 'fork_ext': 'Fork extension', 'trakmat': 'Track mat',
            'lift': 'Scissor lift', 'service': 'External service'}.get(k, 'Item')


def load_time(raw, idx):
    """the programme's load field: a clock time (430, 0500/0830, 09:30 / 10:00) per unit, or its own words (6th, NOW 22ND)"""
    if raw is None:
        return None, None
    s = str(raw).strip()
    parts = re.split(r'\s*/\s*', s)
    p = parts[min(idx, len(parts) - 1)] if parts else s
    m = re.fullmatch(r'(\d{1,2}):?(\d{2})', p.strip())
    if m and int(m.group(1)) < 24 and int(m.group(2)) < 60:
        return '%02d:%s' % (int(m.group(1)), m.group(2)), None
    w = re.sub(r'\s*d?DD#\s*\d+', '', s, flags=re.I).strip()
    return None, (w or None)


def dd_words(raw):
    if not raw:
        return None
    w = re.sub(r'\s*(?:Both\s+)?(?:not torren\s+)?d?dd#\s*[\d &]+', '', str(raw), flags=re.I)
    w = re.sub(r'^\s*[\d /&]+\s*$', '', w).strip(' .')
    return w or None


ORDER_NOTE = re.compile(r'\b(?:\d{1,2}[.:]\d{2}\s*(?:am|pm)?|was\b|now\b|after\b|before\b|last\b|\d+(?:st|nd|rd|th)\b)', re.I)

# Matches the rules cannot settle, reviewed against the sources named (17 Oct 2026).
REVIEWED = {
    # 16 Oct: the 'Senior + 2 items' (3 boards) and 'Senior + 1 items' (2 boards) texts are the 5 boards T0158 received on 16 Oct
    # for Monday (receipt VMS:5 stamped 16 Oct); T0128 holds VMS11 and VMS12 (Andrew, 16 Oct: "VMS for today are VMS11 ... and VMS12").
    ('2026-10-16', 'Variable Message Board Senior + 2 items', 0): (['T0158'], 'T0158\'s receipt of 5 boards on 16 Oct (3 + 2 on the two Senior texts); T0128 holds VMS11 and VMS12'),
    ('2026-10-16', 'Variable Message Board Senior + 1 items', 0): (['T0158'], 'T0158\'s receipt of 5 boards on 16 Oct (3 + 2 on the two Senior texts); T0128 holds VMS11 and VMS12'),
    # 17 Sep: the cyclone 6.0 x 3.0 is HRP: the record gives HRP asset 1189410, register 9968862 line 93 (bdd drifted to 14 Sep).
    ('2026-09-17', 'Portable Building Shell 6.0M x 3.0M - Cyclo', 0): (['HRP'], 'asset number 1189410, which the record gives HRP (register 9968862 line 93)'),
    # 17 Sep: two plain 6.0 x 3.0 units for three plain 6 m buildings on the programme (P36, P37, AA): the texts cannot tell them apart.
    ('2026-09-17', 'Portable Building Shell 6.0M x 3.0M', 0): (['P36', 'P37', 'AA'], 'the 17 Sep programme: two plain 6.0 × 3.0 texts for three plain 6 m buildings'),
    ('2026-09-17', 'Portable Building Shell 6.0M x 3.0M', 1): (['P36', 'P37', 'AA'], 'the 17 Sep programme: two plain 6.0 × 3.0 texts for three plain 6 m buildings'),
    # 22 Sep: the 4.8 m booked 21 Sep 12:54 for 22 Sep is the fourth 21 Sep unit, re-booked: P16 ("NOW 22ND"; register 9968862 line 57, bdd 22 Sep).
    ('2026-09-22', 'Portable Building Shell 4.8M x 2.4M', 0): (['P16'], 'programme T0044 ("NOW 22ND") and register 9968862 line 57 (booked 22 Sep)'),
    # 1 Oct: the "Toilet Block 6.0M x 3.0M - Male/Female" is WC60's (the 1 Oct programme's only toilet block, T0248).
    ('2026-10-01', 'Toilet Block 6.0M x 3.0M - Male/Female', 0): (['WC60'], 'the 1 Oct programme\'s only toilet block (T0248)'),
    ('2026-10-01', 'Steps Toilet Block + 1 items', 0): (['WC60'], 'register 9968955 lines 138-139 (steps), on WC60\'s tank dockets 26106375 and 26106388'),
    ('2026-10-01', 'Steps Toilet Block + 1 items', 1): (['WC60'], 'register 9968955 lines 138-139 (steps), on WC60\'s tank dockets 26106375 and 26106388'),
    # 12 Oct: the programme row T0109 (12 Oct) names both dockets: "DD 26120976 (STRP) and DD 26122181 (EAGS)".
    ('2026-10-12', 'Forklift 2.5t Dual Fuel', 0): (['T0109'], 'programme row T0109 (12 Oct), which names DD 26120976'),
    ('2026-10-12', 'Telehandler Fork Extension 1800mm', 0): (['T0109'], 'programme row T0109 (12 Oct), which names DD 26122181'),
    # 15 Sep: the 4.8 x 3.0 "+1 items" is T0021 (the office with its accessories), the plain one T0022 (register 9968929 lines 1 and 3).
    ('2026-09-15', 'Portable Building Shell 4.8M x 3.0M + 1 items', 0): (['T0021'], 'register 9968929 line 1 (960639, docket 26064235)'),
    ('2026-09-15', 'Portable Building Shell 4.8M x 3.0M', 0): (['T0022'], 'register 9968929 line 3 (960634, docket 26064243) and the site note "Lunch room 960634"'),
    # 23 Sep: no commentary booth on the 23 Sep programme or register.
    ('2026-09-23', 'Commentary Booth 6.0M x 3.0M', 0): ([], 'no commentary booth on the 23 Sep programme or register'),
    # 14 Oct: a cyclone 6.0 x 3.0 and two commentary booths for P25, P65 and P67 (P66 is named in its own text).
    ('2026-10-14', 'Portable Building Shell 6.0M x 3.0M - Cyclo + 1 items', 0): (['P25', 'P65', 'P67'], 'the 14 Oct programme: three texts for P25, P65 and P67'),
    ('2026-10-14', 'Commentary Booth 6.0M x 3.0M + 1 items', 0): (['P25', 'P65', 'P67'], 'the 14 Oct programme: three texts for P25, P65 and P67'),
    ('2026-10-14', 'Commentary Booth 6.0M x 3.0M', 0): (['P25', 'P65', 'P67'], 'the 14 Oct programme: three texts for P25, P65 and P67'),
    # 16 Oct: Andrew's site notes on FL03, FL04 and TM01 name the contract lines (9992300 lines 1, 2 and 6).
    ('2026-10-16', 'Forklift Rough Terrain 5.0t 4WD Diesel', 0): (['FL03'], 'the site note on FL03, which names contract 9992300 line 1', ('9992300', 1)),
    ('2026-10-16', 'Forklift Rough Terrain 2.5t 4WD Diesel', 0): (['FL04'], 'the site note on FL04, which names contract 9992300 line 2', ('9992300', 2)),
    ('2026-10-16', 'Trakmat - 2.4M x 1.1M - TM4496', 0): (['TM01'], 'the site note on TM01, which names contract 9992300 line 6', ('9992300', 6)),
}

# Texts the site record contradicts: shown, never counted, every source named.
SET_ASIDE = {
    ('2026-09-25', 'WC50 Toilet Portable - Fresh Water Flush', 0): (
        'The Coates text says delivered 28 Sep 12:49 against this 25 Sep booking, but the site record dates WC50 on site '
        '21 Sep (ticked 23 Sep 12:02), and register 9968955 line 22 (asset 1211974, docket 26081402) was delivered 21 Sep. '
        'Programme T0247 puts WC50 on the 28 Sep SFL BOGIE 10:30 truck ("was 25th sep").',
        ['site record (WC50 dated 21 Sep, ticked 23 Sep 12:02)', 'register 9968955 line 22 (asset 1211974, docket 26081402, delivered 21 Sep)',
         'programme T0247 (28 Sep, SFL BOGIE 10:30, "was 25th sep")', 'Coates text 28 Sep 12:49']),
}


def main():
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    xlsx, page = a[0], a[1]
    out = Path(a[2]) if len(a) > 2 else HERE / 'ontime1057_units.json'
    msgs = load_texts(xlsx)
    ev = events(msgs)
    units = build_units(ev)
    D = load_data(page)
    assets = {x['key']: x for x in D['assets']}
    plants = {x['key']: x for x in D['plant_lines']['lines']}
    every = dict(plants); every.update(assets)
    rows = D['rental_on_hire']['rows']
    # register line -> reference: the leading reference in its description, else a plant line that carries it
    plant_of = {}
    for k, p in plants.items():
        for r in p.get('rental') or []:
            plant_of[(str(r.get('rental_contract')), r.get('line'))] = k
    by_no = defaultdict(set)
    for k, x in every.items():
        for n in x.get('asset_numbers') or []:
            by_no[str(n)].add(k)
    def reg_ref(r):
        m = re.match(r'^((?:(?:WCTV|WC\d+|Wc\d+|P\d+|CP\d+|VMS\d+|WB\d+)\s+)+)', r['description'] or '')
        toks = [t.upper() for t in m.group(1).split()] if m else []
        for t in toks:
            if t in every: return t
        k = plant_of.get((str(r['rental_contract']), r['line']))
        if k: return k
        ks = by_no.get(str(r.get('asset_no')), set())
        if len(ks) == 1: return next(iter(ks))
        return toks[0] if toks else None
    for r in rows:
        r['_ref'] = reg_ref(r)
    def reg_lines(ref, item):
        return [r for r in rows if r['_ref'] == ref and desc_match(item, r['description'] or '')]
    def near(r, day):
        bd = r.get('booked_delivery_date') or r.get('start_date')
        if not bd: return False
        return abs((datetime.strptime(bd, '%Y-%m-%d').date() - day).days) <= 3
    # programme rows per day
    prog = defaultdict(list)
    for k, x in every.items():
        for e in x.get('events') or []:
            if e.get('movement') == 'remove' or not e.get('date'): continue
            prog[e['date']].append((k, e))
    # unit ids, sorted
    units.sort(key=lambda u: (u['day'], u['w'][0] if u['w'] else '99', u['booked_at'] or u['delivered'] or datetime.max, u['item']))
    seen = defaultdict(int)
    for u in units:
        k = (u['day'].isoformat(), u['item'])
        u['n'] = seen[k]; seen[k] += 1
        u['kind'] = kind_of_text(u['item'])
    # match
    for u in units:
        iso = u['day'].isoformat()
        key = (iso, u['item'], u['n'])
        u['how'] = ''
        if key in REVIEWED:
            u['refs'], u['how'] = list(REVIEWED[key][0]), 'reviewed: ' + REVIEWED[key][1]
            if len(REVIEWED[key]) > 2: u['reg'] = REVIEWED[key][2]
            continue
        r0 = ref_of(u['item'])
        if r0:
            u['refs'], u['how'] = [r0], 'reference in the text'
            continue
        pk = [k for k, e in prog.get(iso, []) if same_kind(u['kind'], kind_of_programme(e))]
        pk = list(dict.fromkeys(pk))
        regk = list(dict.fromkeys(r['_ref'] for r in rows if r['_ref'] and near(r, u['day']) and desc_match(u['item'], r['description'] or '')))
        both = [k for k in pk if k in regk]
        n_same = len([v for v in units if v['day'] == u['day'] and v['item'] == u['item'] and not v.get('nob')]) or 1
        exact = [k for k in both if any(r['_ref'] == k and (r.get('booked_delivery_date') or r.get('start_date')) == iso and desc_match(u['item'], r['description'] or '') for r in rows)]
        if len(exact) == n_same and len(both) > n_same:
            both = exact                                   # the register books exactly that many on the day itself (16 Oct barriers)
        if both:
            u['refs'], u['how'] = both, 'the ' + u['day'].strftime('%-d %b') + ' programme and the register description'
        elif pk:
            u['refs'], u['how'] = pk, 'the ' + u['day'].strftime('%-d %b') + ' programme (item and size)'
        elif regk:
            u['refs'], u['how'] = regk, 'register description within 3 days'
        else:
            u['refs'], u['how'] = [], 'no programme row or register line matches'
    # references named by the text itself, or already settled, come out of the other units' lists that day
    for iso in sorted({u['day'].isoformat() for u in units}):
        day_units = [u for u in units if u['day'].isoformat() == iso]
        fixed = {u['refs'][0] for u in day_units if len(u['refs']) == 1 and (u['how'] == 'reference in the text' or u['how'].startswith('reviewed'))}
        for u in day_units:
            if len(u['refs']) > 1 and not u['how'].startswith('reviewed'):
                left = [r for r in u['refs'] if r not in fixed]
                if left: u['refs'] = left
        # several units sharing several references: pair by the programme load order when it is known and different
        groups = defaultdict(list)
        for u in day_units:
            if len(u['refs']) > 1 and not u.get('nob'):
                groups[tuple(u['refs'])].append(u)
        for refs, us in groups.items():
            if len(us) != len(refs) or u_reviewed(us):
                continue
            lt = []
            for r in refs:
                es = [e for k, e in prog.get(iso, []) if k == r]
                t, words = load_time(es[0].get('load_time') if es else None, 0)
                o = re.match(r'(\d+)(?:st|nd|rd|th)\b', words or '')
                lt.append((r, mins(t) if t else (int(o.group(1)) if o else None), t or (o.group(0) if o else None)))
            keyed = [x for x in lt if x[1] is not None]
            if len(keyed) < len(lt) - 1:
                continue
            lt.sort(key=lambda x: (x[1] if x[1] is not None else 99999))
            # refs grouped by equal load key, units by equal window in force: equal shapes pair group to group
            rg, ug = [], []
            for x in lt:
                if rg and rg[-1][0][1] == x[1] and x[1] is not None: rg[-1].append(x)
                else: rg.append([x])
            us_wf = sorted(us, key=lambda u: (mins((u['wf'] or u['w'])[0]), mins(u['w'][0]), u['booked_at']))
            for u in us_wf:
                if ug and mins((ug[-1][0]['wf'] or ug[-1][0]['w'])[0]) == mins((u['wf'] or u['w'])[0]): ug[-1].append(u)
                else: ug.append([u])
            if [len(g) for g in rg] == [len(g) for g in ug] and len(rg) > 1:
                for rgi, ugi in zip(rg, ug):
                    names = [x[0] for x in rgi]
                    for u in ugi:
                        u['refs'] = names
                        u['how'] = 'programme load order (' + ', '.join(x[0] + ' ' + (x[2] or 'no time') for x in lt) + ') against the windows in force'
                continue
            if len({x[1] for x in keyed}) != len(keyed):
                continue
            us.sort(key=lambda u: (mins(u['w'][0]), u['booked_at']))
            for u, x in zip(us, lt):
                u['refs'] = [x[0]]
                u['how'] = 'programme load order (' + ', '.join(y[0] + ' ' + (y[2] or 'no time') for y in lt) + ') against the booked windows'
    # docket, register line and programme facts for a single reference
    for u in units:
        iso = u['day'].isoformat()
        u['dk'] = None; u['rl'] = None; u['pg'] = None
        if u.get('reg'):
            r = [x for x in rows if str(x['rental_contract']) == u['reg'][0] and x['line'] == u['reg'][1]]
            if r: u['dk'] = r[0]['delivery_number']; u['rl'] = '%s line %s' % (r[0]['rental_contract'], r[0]['line'])
        if not u['refs'] and not u.get('nob'):
            r = [x for x in rows if near(x, u['day']) and desc_match(u['item'], x['description'] or '')]
            if len(r) == 1: u['dk'] = r[0]['delivery_number']; u['rl'] = '%s line %s' % (r[0]['rental_contract'], r[0]['line'])
        if len(u['refs']) > 1:
            multi = []
            for ref in u['refs']:
                es = [e for k, e in prog.get(iso, []) if k == ref and same_kind(u['kind'], kind_of_programme(e))]
                if es:
                    tt, words = load_time(es[0].get('load_time'), 0)
                    multi.append({'ref': ref, 'carrier': es[0].get('carrier'), 'load': tt or words})
            if multi: u['pgm'] = multi
        if len(u['refs']) != 1:
            continue
        ref = u['refs'][0]
        ls = reg_lines(ref, u['item'])
        ls_near = [r for r in ls if near(r, u['day'])]
        if not ls_near and u['how'] == 'reference in the text':
            # the reference's own lines for that item whose date is only a placeholder (not yet delivered in the register):
            # WC51's line says 14 Sep but was delivered on docket 26129341; a line delivered on another day is a different load
            ls_near = [r for r in ls if not r.get('start_date')]
        same_ref_units = sorted([v for v in units if v['day'] == u['day'] and v['refs'] == u['refs'] and same_kind(v['kind'], u['kind']) and not v.get('nob')],
                                key=lambda v: (mins(v['w'][0]) if v['w'] else 9999, v['booked_at'] or datetime.max))
        if u['dk']:
            pass
        elif len(ls_near) == 1:
            u['dk'] = ls_near[0]['delivery_number']; u['rl'] = '%s line %s' % (ls_near[0]['rental_contract'], ls_near[0]['line'])
        elif len(ls_near) > 1:
            u['dk'] = ' / '.join(sorted({str(r['delivery_number']) for r in ls_near if r['delivery_number']})) or None
            ln = [r['line'] for r in ls_near]
            u['rl'] = '%s lines %s' % (ls_near[0]['rental_contract'], ('%s-%s' % (ln[0], ln[-1])) if len(ln) > 3 and ln == list(range(ln[0], ln[0] + len(ln))) else ', '.join(str(x) for x in ln))
        es = [e for k, e in prog.get(iso, []) if k == ref and same_kind(u['kind'], kind_of_programme(e))]
        if es:
            e = es[0]
            idx = same_ref_units.index(u) if u in same_ref_units else 0
            t, words = load_time(e.get('load_time'), idx)
            carr = e.get('carrier')
            carr = re.split(r'\s*/\s*', str(carr))[min(idx, len(re.split(r'\s*/\s*', str(carr))) - 1)] if carr else None
            note = (e.get('note') or e.get('notes') or '').strip()
            u['pg'] = {'task': e.get('task_id'), 'carrier': carr, 'load': t, 'words': [w for w in [words, dd_words(e.get('dd')), note if note and ORDER_NOTE.search(note) and len(note) < 60 else None] if w]}
    # set aside
    for u in units:
        key = (u['day'].isoformat(), u['item'], u['n'])
        if key in SET_ASIDE:
            u['aside'] = {'why': SET_ASIDE[key][0], 'sources': SET_ASIDE[key][1]}
    # texted together: other units closed out in the same delivered minute
    by_min = defaultdict(list)
    for u in units:
        if u['delivered']: by_min[u['delivered'].strftime('%Y-%m-%d %H:%M')].append(u)
    hm = lambda d: d.strftime('%H:%M') if d else None
    out_units = []
    for j, u in enumerate(units):
        u['id'] = '%s-%02d' % (u['day'].strftime('%m%d'), j)
    for u in units:
        row = {'id': u['id'], 'd': u['day'].isoformat(), 'i': re.sub(r'\s+-\s+Cy\w*$', ' cyclone', u['item']), 'c': CAT.get(u['kind'][0], 'Other'), 'k': word_of(u['kind'], u['item']),
               'r': u['refs'], 'm': u['how']}
        if len(u['refs']) > 1: row['one'] = True
        if u.get('nob'):
            row['nb'] = True
        else:
            row['w'] = list(u['w']); row['b'] = u['booked_at'].strftime('%Y-%m-%d %H:%M')
            if list(u['wf']) != list(u['w']): row['wf'] = list(u['wf'])
            if u['rs']:
                row['rs'] = [{'w': list(r['w']), 'at': r['at'].strftime('%Y-%m-%d %H:%M'), **({'one': r['of']} if r['one'] else {})} for r in u['rs']]
            sibs = [v for v in units if v is not u and not v.get('nob') and v['item'] == u['item'] and v['site'] == u['site'] and v['day'] == u['day'] and v['booked_at']
                    and abs((v['booked_at'] - u['booked_at']).total_seconds()) <= 60]
            if sibs: row['sib'] = [list(v['w']) for v in sibs]
        if u['onway']:
            row['o'] = hm(u['onway'])
            if u['onway'].date() != u['day']: row['od'] = u['onway'].date().isoformat()
            if u['ow_batch']: row['ob'] = True
        if u['delivered']:
            row['t'] = hm(u['delivered'])
            if u['delivered'].date() != u['day']: row['td'] = u['delivered'].date().isoformat()
            tog = [v['id'] for v in by_min[u['delivered'].strftime('%Y-%m-%d %H:%M')] if v is not u]
            if tog: row['tg'] = tog
        if u['failed']:
            row['f'] = hm(u['failed'])
            if u['failed'].date() != u['day']: row['fd'] = u['failed'].date().isoformat()
        if u['dk']: row['dk'] = str(u['dk'])
        if u['rl']: row['rl'] = u['rl']
        if u['pg']: row['pg'] = u['pg']
        if u.get('pgm'): row['pgm'] = u['pgm']
        if u.get('aside'): row['x'] = u['aside']
        if u['site'] and u['site'] != 'MAIN BEACH': row['s'] = u['site'].title()
        out_units.append(row)
    data = {'author': 'Andrew Fisher', 'source': 'Coates delivery texts, export ' + EXPORT_AT + ' (' + str(len(msgs)) + ' texts, ' +
            msgs[0][0].strftime('%-d %b %H:%M') + ' to ' + msgs[-1][0].strftime('%-d %b %H:%M') + ')', 'export_at': EXPORT_AT, 'export_day': EXPORT_DAY,
            'texts': len(msgs), 'units': out_units}
    head = json.dumps({k: v for k, v in data.items() if k != 'units'}, ensure_ascii=False, separators=(',', ':'))[:-1]
    body = ',\n'.join(json.dumps(u, ensure_ascii=False, separators=(',', ':')) for u in out_units)
    out.write_text(head + ',"units":[\n' + body + '\n]}\n', encoding='utf-8')   # one unit per line, for review
    print('build_ontime1057:', len(msgs), 'texts ->', len([u for u in out_units if not u.get('nb')]), 'booked units +',
          len([u for u in out_units if u.get('nb')]), 'delivered with no booking text ->', out)


def u_reviewed(us):
    return any(u['how'].startswith('reviewed') for u in us)


if __name__ == '__main__':
    main()
