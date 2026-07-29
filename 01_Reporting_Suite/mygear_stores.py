#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | STORES TEAM PAGE - the counter's own view
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 29 Jul 2026): "can Coates have a direct sign in - opens
#  up stores staff page. all the product groups, how many available,
#  how many on hire, company and name, where abouts, what storage unit
#  ... a section of stock take and a percentage of what has been stock
#  taked and what has not ... on hire list longer than 3 days, a
#  section you look through to ensure its not in the store, done by
#  storage unit so your being directed where to go."
#
#  This is a DIFFERENT JOB from the crew page. A crew member asks "what
#  have I got and what can I grab". The stores team asks "what is
#  missing, who has it, and where do I walk to find it". So this page
#  is built around the hunt, not the browse.
#
#  ON THE SIGN-IN, HONESTLY. The page is a static file on the store's
#  own Wi-Fi - there is no server to check a password against. So the
#  payload is ENCRYPTED with the passcode, using the same scheme that
#  already protects every crew member's card: without the code the file
#  is meaningless noise, and the code is never written into the page.
#  That is real protection against someone browsing the Wi-Fi, and it
#  is NOT enterprise sign-on - a determined person with the file and
#  time could work at it. For a list of who is holding which grinder on
#  a shutdown, already printed on the client's daily reports, that is
#  the proportionate answer. Say so plainly rather than call it secure.
#
#  THE SITE PLANT SPLIT. 509 items are out longer than three days, but
#  294 of them are barriers, rubbish chutes and site plant that live on
#  site by design - they are not lost, and putting them in a hunt list
#  turns it into 60% noise that nobody reads twice. Tools and plant are
#  therefore counted apart: the chase list is the gear that should
#  plausibly be back on a shelf.
# =====================================================================
import base64
import datetime as dt
import io
import json
import os
import re

M32 = 0xFFFFFFFF


def _imul(a, b):
    return (a * b) & M32


def _xmur3(s):
    h = 1779033703 ^ len(s)
    for ch in s:
        h = _imul(h ^ ord(ch), 3432918353)
        h = ((h << 13) | (h >> 19)) & M32

    def call():
        nonlocal h
        h = _imul(h ^ (h >> 16), 2246822507)
        h = _imul(h ^ (h >> 13), 3266489909)
        h ^= h >> 16
        return h & M32
    return call


def _mulberry32(a):
    #  Copied verbatim from BUILD_MY_GEAR's proven pair - the Python and
    #  the JavaScript have to produce the identical stream or the page
    #  will not open, and "close enough" fails silently.
    a &= M32

    def call():
        nonlocal a
        a = (a + 0x6D2B79F5) & M32
        t = _imul(a ^ (a >> 15), (a | 1) & M32)
        t = ((t + _imul(t ^ (t >> 7), (t | 61) & M32)) & M32) ^ t
        t &= M32
        return (t ^ (t >> 14)) & M32
    return call


def enc(code, s):
    """Same scheme as the crew cards - XOR against a seeded stream.
    r() >> 24 is the integer form of the page's Math.floor(rnd()*256)."""
    r = _mulberry32(_xmur3(code + '|CoatesK2stores2026')())
    return base64.b64encode(
        bytes((ord(c) ^ (r() >> 24)) & 0xFF for c in s)).decode('ascii')


def tag(code):
    return format(_xmur3(code + '|CoatesK2storestag2026')(), 'x')


def au_date(v):
    """SiteIQ writes these as TEXT ("28/07/2026"), not dates - the third
    field family in this export set to do it. Read as a date they come
    back as nothing, and every ageing figure silently reads zero, which
    is a confident wrong answer. (29 Jul 2026)"""
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    m = re.match(r'\s*(\d{1,2})/(\d{1,2})/(\d{4})', str(v or ''))
    if not m:
        return None
    try:
        return dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    except ValueError:
        return None


def au_dt(v):
    """Date AND time. STOCKTAKE writes "25/07/2026 08:47 AM", so a count
    can be put on the shift that actually did it."""
    sv = str(v or '').strip()
    m = re.match(r'\s*(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2})\s*([AaPp][Mm])?', sv)
    if not m:
        d = au_date(v)
        return (d, None) if d else (None, None)
    try:
        day = dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    except ValueError:
        return None, None
    h, mi = int(m.group(4)), int(m.group(5))
    ap = (m.group(6) or '').lower()
    if ap == 'pm' and h != 12:
        h += 12
    elif ap == 'am' and h == 12:
        h = 0
    return day, (h, mi)


#  Storage units that live on site by design - out for days is normal,
#  not a thing to chase round the store.
PLANT_UNITS = ('site plant', 'barrier', 'chute', 'laydown')


def _is_plant(unit):
    u = (unit or '').lower()
    return any(k in u for k in PLANT_UNITS)


def _hm(v):
    m = re.match(r'\s*(\d{1,2}):(\d{2})', str(v or ''))
    return (int(m.group(1)), int(m.group(2))) if m else None


def _shift_of(d, hm):
    """Which shift-day a movement belongs to.

    Nights run 18:00 to 06:00, so they straddle midnight: 02:00 on the
    14th is still the NIGHT OF THE 13th and has to score for the crew
    that was actually standing there. Andrew's own example, 29 Jul 2026:
    "they do 18:00 to 6:00 so 13/07/2026 into 14/07/2026".
    """
    if not d or not hm:
        return None, None
    h = hm[0]
    if h >= 18:
        return d, 'N'
    if h < 6:
        return d - dt.timedelta(days=1), 'N'
    return d, 'D'


def _night_ran(hm):
    """Was a night crew really on?

    Andrew, 29 Jul 2026: "if there is no transactions after 18:30
    through to 5:00 generally means no nightshift." The SHIFT runs
    18:00-06:00, but the DETECTION window is deliberately tighter - a
    day-shift straggler scanning at 18:05, or an early bird at 05:40,
    must not conjure a night crew that was never there.
    """
    if not hm:
        return False
    h, m = hm
    return (h > 18 or (h == 18 and m >= 30)) or h < 5


def _battle(txn_path, stocktake_path=None):
    """Day versus night, every shift-day of the shut.

    An issue is counted at its start, a return at its end - so a tool
    taken on days and dropped back at night scores one for each crew,
    which is exactly right: both did a piece of work.

    FAIRNESS. Nights did not start until part-way through the shut, and
    scoring the empty nights as day-shift wins would rig the ladder and
    the night crew would dismiss the whole board in one look. So a
    shift-day only counts as a contest once BOTH crews are running; the
    earlier days are shown, and plainly marked as days-only.
    """
    import openpyxl
    if not os.path.isfile(txn_path):
        return None
    wb = openpyxl.load_workbook(txn_path, read_only=True, data_only=True)
    if 'TRANSACTION_CHARGES' not in wb.sheetnames:
        wb.close()
        return None
    rows = list(wb['TRANSACTION_CHARGES'].iter_rows(values_only=True))
    wb.close()
    if not rows:
        return None
    hdr = [str(c or '').strip() for c in rows[0]]
    ix = {h: i for i, h in enumerate(hdr) if h}
    need = ('TRAN_START_DATE', 'TRAN_START_TIME')
    if not all(k in ix for k in need):
        return None

    tally = {}

    nights_on = {}

    def slot(d):
        return tally.setdefault(d, {'D': {'i': 0, 'r': 0, 's': 0},
                                    'N': {'i': 0, 'r': 0, 's': 0}})
    for r in rows[1:]:
        if not r or not any(c not in (None, '') for c in r):
            continue
        _t = _hm(r[ix['TRAN_START_TIME']])
        d, sh = _shift_of(au_date(r[ix['TRAN_START_DATE']]), _t)
        if d:
            slot(d)[sh]['i'] += 1
            if _night_ran(_t):
                nights_on[d] = True
        if 'TRAN_END_DATE' in ix and 'TRAN_END_TIME' in ix:
            _t2 = _hm(r[ix['TRAN_END_TIME']])
            d2, sh2 = _shift_of(au_date(r[ix['TRAN_END_DATE']]), _t2)
            if d2:
                slot(d2)[sh2]['r'] += 1
                if _night_ran(_t2):
                    nights_on[d2] = True

    #  stocktake counts, scored onto the same shift-days
    if stocktake_path and os.path.isfile(stocktake_path):
        wb2 = openpyxl.load_workbook(stocktake_path, read_only=True,
                                     data_only=True)
        ws2 = wb2['STOCKTAKE'] if 'STOCKTAKE' in wb2.sheetnames else wb2.active
        srows = list(ws2.iter_rows(values_only=True))
        wb2.close()
        if srows:
            sh_ = [str(c or '').strip() for c in srows[0]]
            si = {h: i for i, h in enumerate(sh_) if h}
            if 'LAST_SIGHTED_DATE_TIME' in si:
                for r in srows[1:]:
                    if not r:
                        continue
                    d0, hm = au_dt(r[si['LAST_SIGHTED_DATE_TIME']])
                    if not d0:
                        continue
                    dd, ss = _shift_of(d0, hm or (12, 0))
                    if dd:
                        slot(dd)[ss]['s'] += 1
                        if _night_ran(hm):
                            nights_on[dd] = True

    days = sorted(tally)
    if not days:
        return None
    out, dw, nw, tie = [], 0, 0, 0
    for d in days:
        v = tally[d]
        D = v['D']['i'] + v['D']['r']
        N = v['N']['i'] + v['N']['r']
        #  a day is only a contest if a night crew actually worked it
        contest = bool(nights_on.get(d))
        w = ''
        if contest:
            if D > N:
                w = 'D'
                dw += 1
            elif N > D:
                w = 'N'
                nw += 1
            else:
                w = 'T'
                tie += 1
        out.append({'d': d.strftime('%a %d %b'), 'iso': d.isoformat(),
                    'di': v['D']['i'], 'dr': v['D']['r'],
                    'ni': v['N']['i'], 'nr': v['N']['r'],
                    'ds': v['D']['s'], 'ns': v['N']['s'],
                    'D': D, 'N': N, 'w': w, 'c': contest})
    return {
        'days': out,
        'dayTotal': sum(x['D'] for x in out),
        'nightTotal': sum(x['N'] for x in out),
        'dayWins': dw, 'nightWins': nw, 'ties': tie,
        'dayStock': sum(x['ds'] for x in out),
        'nightStock': sum(x['ns'] for x in out),
        'nightDays': sum(1 for x in out if x['c']),
    }


def _money(v):
    try:
        return float(str(v).strip().replace('$', '').replace(',', ''))
    except (TypeError, ValueError):
        return None


def _pricing(onhire_path, master=None):
    """What the gear on hire is costing per day, for the manager view.

    The point is a manager glancing down a column and spotting the line
    that is wrong - so the odd ones are surfaced, not buried: anything on
    hire at a zero rate (earning nothing), and the dearest lines.
    Everything here is SiteIQ's own SHIFT_RATE; nothing is calculated up
    or estimated. (Andrew, 29 Jul 2026: "see visually if anything does
    not look correct or wrong")
    """
    import openpyxl
    if not onhire_path or not os.path.isfile(onhire_path):
        return None
    import mygear_store as MS
    wb = openpyxl.load_workbook(onhire_path, read_only=True, data_only=True)
    ws = wb['ON_HIRE'] if 'ON_HIRE' in wb.sheetnames else wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if not rows:
        return None
    hdr = [str(c or '').strip() for c in rows[0]]
    ix = {h: i for i, h in enumerate(hdr) if h}
    if 'SHIFT_RATE' not in ix:
        return None

    def g(r, k):
        return str(r[ix[k]] or '').strip() if k in ix else ''

    cats, firms, items, zero = {}, {}, {}, []
    total = 0.0
    for r in rows[1:]:
        if not r or not any(c not in (None, '') for c in r):
            continue
        rate = _money(r[ix['SHIFT_RATE']])
        desc = g(r, 'ITEM_DESCRIPTION')
        if not desc:
            continue
        name = MS._tidy(desc, master, g(r, 'ITEM_NUMBER'))
        co = g(r, 'COMPANY') or 'Not named'
        cat = MS._cat_of(name)
        if rate is None or rate <= 0:
            zero.append({'n': name, 'co': co, 'w': g(r, 'HIRER_NAME')})
            rate = 0.0
        total += rate
        cats[cat] = cats.get(cat, 0.0) + rate
        firms[co] = firms.get(co, 0.0) + rate
        e = items.setdefault(name, {'n': name, 'q': 0, 'r': rate, 'v': 0.0})
        e['q'] += 1
        e['v'] += rate
        e['r'] = max(e['r'], rate)

    top = sorted(items.values(), key=lambda x: -x['v'])[:60]
    return {
        'perDay': round(total, 2),
        'cats': sorted(([k, round(v, 2)] for k, v in cats.items()),
                       key=lambda t: -t[1]),
        'firms': sorted(([k, round(v, 2)] for k, v in firms.items()),
                        key=lambda t: -t[1]),
        'top': [{'n': x['n'], 'q': x['q'], 'r': round(x['r'], 2),
                 'v': round(x['v'], 2)} for x in top],
        'zero': zero[:80],
        'zeroN': len(zero),
        'week': round(total * 7, 2),
    }


def read(rental_path, stocktake_path, master=None, today=None,
         txn_path=None):
    """Everything the counter needs, from the two registers."""
    import openpyxl
    today = today or dt.date.today()

    def sheet(path, name):
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb[name] if name in wb.sheetnames else wb.active
        rows = list(ws.iter_rows(values_only=True))
        hdr = [str(c or '').strip() for c in rows[0]]
        ix = {h: i for i, h in enumerate(hdr) if h}
        body = [r for r in rows[1:] if r and any(c is not None for c in r)]
        wb.close()
        return ix, body

    import mygear_store as MS          # the crew catalogue's category brain
    ix, rs = sheet(rental_path, 'RENTAL_STOCK')

    def g(r, k, d=''):
        return str(r[ix[k]] or '').strip() if k in ix else d

    groups, chase_t, chase_p, idle = {}, [], [], []
    arrivals, plant = [], {'out': [], 'idle': [], 'free': []}
    for r in rs:
        status = g(r, 'ITEM_STATUS')
        #  Anything not yet on the shelf and not out - ordered, in
        #  transit, or stuck in Baseplan. The counter needs to know it is
        #  coming rather than wonder where it went.
        #  (Andrew, 29 Jul 2026: "flag anything that is in arrival status")
        if status not in ('Available for Hire', 'On Hire'):
            if status:
                arrivals.append({
                    'n': MS._tidy(g(r, 'ITEM_DESCRIPTION'), master,
                                  g(r, 'ITEM_NUMBER')),
                    'u': g(r, 'STORAGE_UNIT') or 'Unfiled',
                    's': status})
            continue
        raw = g(r, 'ITEM_DESCRIPTION')
        if not raw or not MS._offerable(raw):
            continue
        name = MS._tidy(raw, master, g(r, 'ITEM_NUMBER'))
        cat = MS._cat_of(name)
        unit = g(r, 'STORAGE_UNIT') or 'Unfiled'
        key = (cat, name)
        e = groups.setdefault(key, {'c': cat, 'n': name, 'av': 0, 'oh': 0,
                                    'u': {}, 'who': []})
        if status == 'Available for Hire':
            e['av'] += 1
            e['u'][unit] = e['u'].get(unit, 0) + 1
            if _is_plant(unit):
                plant['free'].append({'n': name, 'u': unit})
        else:
            e['oh'] += 1
            d = au_date(g(r, 'ON_HIRE_DATE'))
            days = (today - d).days if d else None
            who = g(r, 'HIRER_NAME') or 'Not named'
            co = g(r, 'COMPANY_NAME') or 'Not named'
            e['who'].append({'w': who, 'co': co, 'd': days, 'u': unit})
            if days is not None and days > 3:
                row = {'n': name, 'u': unit, 'w': who, 'co': co, 'd': days}
                (chase_p if _is_plant(unit) else chase_t).append(row)
            if 'site plant' in who.lower():
                idle.append({'n': name, 'u': unit, 'd': days})
                if _is_plant(unit):
                    plant['idle'].append({'n': name, 'u': unit, 'd': days})
            elif _is_plant(unit):
                plant['out'].append({'n': name, 'u': unit, 'w': who,
                                     'co': co, 'd': days})

    #  stocktake - how much of the store has actually been laid eyes on
    stock = {'total': 0, 'w1': 0, 'w3': 0, 'w7': 0, 'stale': []}
    if stocktake_path and os.path.isfile(stocktake_path):
        six, sk = sheet(stocktake_path, 'STOCKTAKE')

        def sg(r, k):
            return str(r[six[k]] or '').strip() if k in six else ''
        for r in sk:
            d = au_date(sg(r, 'LAST_SIGHTED_DATE_TIME'))
            if not d:
                continue
            age = (today - d).days
            stock['total'] += 1
            if age <= 1:
                stock['w1'] += 1
            if age <= 3:
                stock['w3'] += 1
            if age <= 7:
                stock['w7'] += 1
            else:
                stock['stale'].append({
                    'n': sg(r, 'DESCRIPTION')[:60],
                    'u': sg(r, 'STORAGE_UNIT') or 'Unfiled',
                    'd': age, 'by': sg(r, 'LAST_SIGHTED_BY')[:26]})
    stock['stale'].sort(key=lambda x: -x['d'])

    battle = _battle(txn_path, stocktake_path) if txn_path else None

    G = sorted(groups.values(), key=lambda e: (e['c'], e['n'].lower()))
    chase_t.sort(key=lambda x: (-x['d'], x['u']))
    chase_p.sort(key=lambda x: -x['d'])

    def by_unit(rows):
        out = {}
        for x in rows:
            out[x['u']] = out.get(x['u'], 0) + 1
        return sorted(out.items(), key=lambda t: -t[1])

    arrivals.sort(key=lambda x: (x['s'], x['n'].lower()))
    return {
        'battle': battle,
        'arrivals': arrivals,
        'plant': plant,
        'hasPlant': bool(plant['out'] or plant['idle'] or plant['free']),
        'groups': G,
        'chase': {'tools': chase_t, 'plant': chase_p,
                  'toolUnits': by_unit(chase_t),
                  'plantUnits': by_unit(chase_p)},
        'stock': stock,
        'idle': idle,
        'tiles': {
            'avail': sum(e['av'] for e in G),
            'onhire': sum(e['oh'] for e in G),
            'lines': len(G),
            'chase': len(chase_t),
            'plantOut': len(chase_p),
            'idle': len(idle),
            'stockPct': int(100.0 * stock['w7'] / stock['total'] + 0.5)
                        if stock['total'] else 0,
            'stale': len(stock['stale']),
            'arrivals': len(arrivals),
            'plantOn': len(plant['out']),
            'plantIdle': len(plant['idle']),
            'plantFree': len(plant['free']),
        },
    }


# ---------------------------------------------------------------------
#  THE PAGE
# ---------------------------------------------------------------------
PAGE = """<!DOCTYPE html><html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#F26222">
<title>Coates Stores Team - K2</title><style>
:root{--org:#F26222;--ink:#0A0E14;--pnl:#151A22;--pnl2:#1C232D;--line:#2A3340;
 --txt:#E9EEF5;--dim:#98A4B4;--gd:#2BB673;--am:#F5A623;--rd:#E23B2E;--neon:#EFFF3D}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:var(--ink);color:var(--txt);font-family:-apple-system,
 BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.5}
.wrap{max-width:820px;margin:0 auto;padding:0 13px 90px}
header{background:linear-gradient(135deg,#F26222,#C44C28 62%,#8E3218);
 padding:16px 15px;margin:0 -13px 14px;position:relative;overflow:hidden}
header:after{content:"";position:absolute;right:-40px;top:-40px;width:170px;
 height:170px;border-radius:50%;background:rgba(255,255,255,.10)}
.brand{font-size:19px;font-weight:900;letter-spacing:-.4px}
.brand span{background:#fff;color:#F26222;padding:3px 9px;border-radius:6px;
 margin-right:8px}
h1{font-size:23px;font-weight:900;margin:9px 0 2px;letter-spacing:-.4px}
.sub{font-size:12.5px;opacity:.95;font-weight:600}
/* gate */
#gate{padding:46px 6px;text-align:center}
#gate h2{font-size:19px;font-weight:900;margin-bottom:6px}
#gate p{color:var(--dim);font-size:13.5px;margin-bottom:20px;line-height:1.65}
#gate input{width:100%;max-width:300px;background:var(--pnl);border:1.5px solid var(--line);
 color:#fff;font-family:inherit;font-size:19px;text-align:center;letter-spacing:5px;
 padding:15px;border-radius:13px}
#gate input:focus{outline:none;border-color:var(--org)}
#gate button{display:block;width:100%;max-width:300px;margin:11px auto 0;
 background:linear-gradient(135deg,var(--org),#C44C28);color:#fff;border:0;
 font-family:inherit;font-weight:900;font-size:15px;letter-spacing:1.4px;
 padding:15px;border-radius:13px;min-height:50px}
#gerr{color:var(--rd);font-size:13.5px;margin-top:12px;font-weight:700;min-height:20px}
/* board */
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
/* min-width:0 - a grid item defaults to min-width:auto, so a long label
   like FREE ON THE GROUND could push the whole row wider than a 360px
   phone. This lets the tile shrink and the label wrap instead. */
.tile{background:var(--pnl);border:1px solid var(--line);border-radius:12px;
 padding:12px 10px;text-align:center;min-width:0}
.tile b{display:block;font-size:24px;font-weight:900;color:var(--neon);line-height:1.1;
 font-variant-numeric:tabular-nums}
.tile.g b{color:var(--gd)}.tile.a b{color:var(--am)}.tile.r b{color:var(--rd)}
.tile span{display:block;font-size:9.5px;color:var(--dim);font-weight:800;
 letter-spacing:.8px;text-transform:uppercase;margin-top:5px;line-height:1.3}
/* tabs */
/* Ten tabs do not fit one row. On a phone they scroll sideways, which is
   the natural thing to do with a thumb - but on a laptop nobody swipes a
   tab strip, so the last tabs (Money among them) sat off the right edge
   where a manager would never find them. Wrap once there is width for it.
   (Caught 29 Jul 2026 in a 1100px screenshot - OUR STANDA... cut in half.) */
.tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;position:sticky;top:0;
 background:var(--ink);z-index:5;
 -webkit-overflow-scrolling:touch;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
@media(min-width:700px){.tabs{flex-wrap:wrap;overflow-x:visible}}
.tab{flex:none;background:var(--pnl);border:1px solid var(--line);color:var(--dim);
 font-family:inherit;font-weight:800;font-size:12.5px;letter-spacing:.5px;
 padding:11px 15px;border-radius:999px;min-height:44px;text-transform:uppercase}
.tab.on{background:var(--org);border-color:var(--org);color:#fff}
.pane{display:none}.pane.on{display:block}
/* rows */
.srch{width:100%;background:var(--pnl);border:1.5px solid var(--line);color:#fff;
 font-family:inherit;font-size:16px;padding:13px 15px;border-radius:12px;margin-bottom:12px}
.srch:focus{outline:none;border-color:var(--org)}
.grp{background:var(--pnl);border:1px solid var(--line);border-radius:12px;
 margin-bottom:9px;overflow:hidden}
.grp>button{width:100%;background:none;border:0;color:var(--txt);font-family:inherit;
 text-align:left;padding:13px 14px;display:flex;align-items:center;gap:12px;min-height:58px}
.grp .gn{flex:1;min-width:0}
.grp .gn b{display:block;font-size:14.5px;font-weight:700}
.grp .gn span{display:block;font-size:11px;color:var(--dim);font-weight:700;
 letter-spacing:.4px;text-transform:uppercase;margin-top:2px}
.grp .gq{flex:none;text-align:right}
.grp .gq b{display:block;font-size:17px;font-weight:900;color:var(--gd);line-height:1}
.grp .gq span{display:block;font-size:9.5px;color:var(--dim);font-weight:800;
 letter-spacing:.7px;text-transform:uppercase;margin-top:2px}
.bar{display:flex;height:8px;border-radius:99px;overflow:hidden;background:#0E1319;
 margin:0 14px 12px}
.bar i{display:block;height:100%}
.bar .ba{background:var(--gd)}.bar .bo{background:var(--org)}
.kids{display:none;padding:0 12px 12px}
.kids.on{display:block}
.kid{background:var(--pnl2);border:1px solid var(--line);border-radius:10px;
 padding:10px 12px;margin-bottom:7px}
.kid .kt{display:flex;gap:10px;align-items:baseline}
.kid .kt b{flex:1;font-size:13.5px;font-weight:700}
.kid .kt em{font-style:normal;font-size:12px;font-weight:800;color:var(--gd)}
.kid .kt em.o{color:var(--org)}
.kid .kw{font-size:11.5px;color:var(--dim);margin-top:5px;line-height:1.6}
.kid .kw b{color:#C7CED8;font-weight:700}
/* .stmore was being used on the plant toggle but never defined here, so it
   rendered as a grey system button in the middle of a Coates page.
   (Caught 29 Jul 2026 in a screenshot.) */
.stmore{background:var(--pnl2);border:1.5px solid var(--org);color:var(--org);
 font-family:inherit;font-weight:800;font-size:12px;letter-spacing:.5px;
 padding:11px 16px;border-radius:999px;min-height:44px;text-transform:uppercase;
 cursor:pointer}
.stmore:hover{background:var(--org);color:#fff}
.kw.cut{color:var(--dim);font-style:italic;padding:9px 2px 2px}
.where{font-size:11px;color:var(--neon);font-weight:800;letter-spacing:.5px;
 text-transform:uppercase;margin-top:5px}
.uhead{font-size:12px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;
 color:var(--org);margin:16px 0 8px;padding-left:9px;border-left:3px solid var(--org)}
.note{background:var(--pnl);border:1px solid var(--line);border-left:4px solid var(--org);
 border-radius:12px;padding:12px 14px;font-size:13px;color:#C7CED8;line-height:1.65;
 margin-bottom:14px}
.note b{color:#fff}
.ring{display:flex;align-items:center;gap:16px;background:var(--pnl);
 border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px}
.ring .rv{font-size:40px;font-weight:900;color:var(--gd);line-height:1}
.ring .rt{flex:1;font-size:13px;color:var(--dim);line-height:1.6}
.ring .rt b{display:block;color:#fff;font-size:15px;font-weight:800;margin-bottom:3px}
.foot{text-align:center;color:#6E7A8A;font-size:11px;padding:24px 8px;line-height:1.8}
/* battle */
.score{display:flex;align-items:stretch;gap:10px;margin-bottom:14px}
.sc{flex:1;background:var(--pnl);border:1px solid var(--line);border-radius:14px;
 padding:14px 10px;text-align:center}
.sc.day{border-color:#F5A623}.sc.night{border-color:#2E9BF0}
.sc b{display:block;font-size:34px;font-weight:900;line-height:1;
 font-variant-numeric:tabular-nums}
.sc.day b{color:#F5A623}.sc.night b{color:#2E9BF0}
.sc span{display:block;font-size:10px;color:var(--dim);font-weight:800;
 letter-spacing:1px;text-transform:uppercase;margin-top:6px}
.sc em{display:block;font-style:normal;font-size:11.5px;color:#C7CED8;
 font-weight:700;margin-top:4px}
.vs{display:flex;align-items:center;font-size:13px;font-weight:900;color:var(--dim)}
.brow{background:var(--pnl);border:1px solid var(--line);border-radius:12px;
 padding:11px 13px;margin-bottom:8px}
.brow .bd{display:flex;justify-content:space-between;align-items:baseline;
 font-size:12.5px;font-weight:800;margin-bottom:7px}
.brow .bd .win{font-size:10.5px;font-weight:900;letter-spacing:.8px;
 text-transform:uppercase;padding:3px 8px;border-radius:99px}
.win.d{background:#F5A623;color:#2a1e05}.win.n{background:#2E9BF0;color:#04223b}
.win.t{background:#3A4553;color:#C7CED8}.win.x{background:none;color:#6E7A8A}
.bb{display:flex;height:22px;border-radius:7px;overflow:hidden;background:#0E1319}
.bb i{display:flex;align-items:center;justify-content:center;font-size:10.5px;
 font-weight:900;color:#151A22;min-width:0}
.bb .bd2{background:linear-gradient(90deg,#F5A623,#e0940f)}
.bb .bn{background:linear-gradient(90deg,#2E9BF0,#1c7fcc);color:#fff}
.bnums{display:flex;justify-content:space-between;font-size:10.5px;color:var(--dim);
 font-weight:700;margin-top:5px}
/* standards */
.std{background:var(--pnl);border:1px solid var(--line);border-left:4px solid var(--org);
 border-radius:12px;padding:14px 15px;margin-bottom:10px}
.std h3{font-size:14.5px;font-weight:900;margin-bottom:7px;letter-spacing:-.2px}
.std p{font-size:13.5px;color:#C7CED8;line-height:1.7}
.std p.ref{font-size:12px;color:var(--dim);margin-top:10px;
 border-left:2px solid var(--org);padding-left:10px}
.std p.ref b{color:#C7CED8}
.std p b{color:#fff}
.sop{background:var(--pnl2);border:1px solid var(--line);border-radius:10px;
 padding:11px 13px;margin-top:9px}
.sop .n{display:inline-block;background:var(--org);color:#fff;font-size:11px;
 font-weight:900;padding:2px 9px;border-radius:99px;margin-bottom:6px}
.sop>b{display:block;font-size:13.5px;margin-bottom:4px}
/*  only the SOP's own title is a block - a nested bold inside the
    body must stay inline or the procedure reads as a column of
    fragments instead of a sentence  */
.sop span b{display:inline;color:#fff}
.sop span{font-size:12.5px;color:var(--dim);line-height:1.65}
.rule{display:flex;gap:10px;align-items:flex-start;padding:9px 0;
 border-top:1px solid var(--line);font-size:13px;color:#C7CED8;line-height:1.6}
.rule:first-of-type{border-top:0}
.rule i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--org);
 margin-top:7px}
</style></head><body>
<div class="wrap">
<header><div class="brand"><span>COATES</span>STORES TEAM</div>
<h1>The counter's view</h1>
<div class="sub">Cement Australia K2 &middot; __ASOF__</div></header>

<div id="gate">
  <h2>Coates stores staff</h2>
  <p>Enter the store code to open the board.<br>
  This page is for the team behind the counter.</p>
  <input id="code" type="password" inputmode="text" autocomplete="off"
         autocapitalize="none" autocorrect="off" spellcheck="false"
         placeholder="CODE" aria-label="Store code">
  <button onclick="unlock()" type="button">OPEN THE BOARD</button>
  <div id="gerr"></div>
</div>

<div id="app" style="display:none"></div>
</div>
<script>
var PAYLOAD="__PAYLOAD__",TAG="__TAG__";
var MPAY="__MPAYLOAD__",MTAG="__MTAG__",MKEY="__MKEY__";
var MGR=null,SHOW_PLANT=true;
function xmur3(s){for(var i=0,h=1779033703^s.length;i<s.length;i++){
 h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}
 return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);
 h^=h>>>16;return h>>>0}}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;
 var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;
 return((t^t>>>14)>>>0)/4294967296}}
function tagOf(c){return(xmur3(c+'|CoatesK2storestag2026')()>>>0).toString(16)}
function dec(c,b64){var rnd=mulberry32(xmur3(c+'|CoatesK2stores2026')());
 var raw=atob(b64),o='';for(var i=0;i<raw.length;i++){
 o+=String.fromCharCode(raw.charCodeAt(i)^Math.floor(rnd()*256))}return o}
/* The manager layer is a SECOND payload under its own code. Money is not
   the counter's business, so it is not merely hidden on the stores view -
   it is not decryptable with the stores code at all. */
function mtagOf(c){return(xmur3(c+'|CoatesK2mgrtag2026')()>>>0).toString(16)}
function mdec(c,b64){var rnd=mulberry32(xmur3(c+'|CoatesK2mgr2026')());
 var raw=atob(b64),o='';for(var i=0;i<raw.length;i++){
 o+=String.fromCharCode(raw.charCodeAt(i)^Math.floor(rnd()*256))}return o}
var D=null;
function unlock(){
  /* The stores code is a word - upper-casing it means a bloke on a wet
     tablet at 5am does not fail the gate over a lower-case letter. The
     MANAGER code is a password with deliberate mixed case, so upper-casing
     it destroyed it - the lower-case half arrived upper-case and the tag
     never matched. Keep the raw string for the manager check.
     (Caught 29 Jul 2026, in the browser probe - the manager path had been
     "verified" in Python, where the upper-casing does not happen.) */
  var raw=(document.getElementById('code').value||'').trim();
  var c=raw.toUpperCase();
  if(!raw){return}
  if(MTAG){
    var mc=(mtagOf(raw)===MTAG)?raw:((mtagOf(c)===MTAG)?c:null);
    if(mc){ try{ MGR=JSON.parse(mdec(mc,MPAY)); }catch(e){ MGR=null; }
            if(MGR){ c=mc; } }
  }
  if(tagOf(c)!==TAG && !MGR){document.getElementById('gerr').textContent=
    'That code does not open this board. Ask Andrew.';return}
  if(MGR && tagOf(c)!==TAG){
    /* The manager code opens the board as well - it is a superset, not a
       second door to remember. It gets there by decrypting the STORES
       code out of a tiny key blob: writing the stores code into the page
       so the manager could reach the board would have handed it to
       anyone who opened View Source, which is the whole gate gone.
       (Caught 29 Jul 2026, in the build.) */
    try{ D=JSON.parse(dec(mdec(c,MKEY),PAYLOAD)); }catch(e){}
    if(D){ document.getElementById('gate').style.display='none';
           document.getElementById('app').style.display='block';
           render(); return; }
  }
  try{ D=JSON.parse(dec(c,PAYLOAD)); }catch(e){
    document.getElementById('gerr').textContent='Could not open the board.';return}
  document.getElementById('gate').style.display='none';
  var a=document.getElementById('app'); a.style.display='block';
  render();
}
document.getElementById('code').addEventListener('keydown',function(e){
  if(e.key==='Enter') unlock();});
/* Came through the override on the crew page? Open straight up. The code
   travels in sessionStorage, never the address bar, and is cleared the
   moment it is used so a shared tablet does not stay unlocked. */
(function(){ try{
  var h=sessionStorage.getItem('k2stores');
  if(h){ sessionStorage.removeItem('k2stores');
         document.getElementById('code').value=h; unlock(); }
}catch(e){} })();

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function tile(v,l,cls){return '<div class="tile '+(cls||'')+'"><b>'+v+'</b><span>'+l+'</span></div>'}
/* Long lists are cut short so the page stays quick on a tablet. A cut list
   that says nothing is a lie by omission - a storeman scrolling 80 of 253
   idle machines would swear the other 173 are not on site. Every cut says
   so. (29 Jul 2026.) */
function more(shown,total,word){
  return total>shown?'<div class="kw cut">Showing the first '+shown+' of '
    +total.toLocaleString()+' '+(word||'lines')+' &mdash; the rest are in SiteIQ.</div>':'';
}

function render(){
  var t=D.tiles;
  var h='<div class="tiles">'
   +tile(t.avail.toLocaleString(),'On the shelf','g')
   +tile(t.onhire.toLocaleString(),'Out with crews')
   +tile(t.lines.toLocaleString(),'Different things')
   +tile(t.chase,'Chase up','a')
   +tile(t.stockPct+'%','Counted in 7 days','g')
   +tile(t.stale,'Not counted','r')
   +'</div>'
   +'<div class="tabs">'
   +'<button class="tab on" data-p="groups" onclick="tab(this)">Product groups</button>'
   +'<button class="tab" data-p="chase" onclick="tab(this)">Chase up ('+t.chase+')</button>'
   +'<button class="tab" data-p="stock" onclick="tab(this)">Stocktake</button>'
   +'<button class="tab" data-p="aisle" onclick="tab(this)">Walk an aisle</button>'
   +'<button class="tab" data-p="battle" onclick="tab(this)">Day v Night</button>'
   +'<button class="tab" data-p="std" onclick="tab(this)">Our standards</button>'
   +(t.arrivals?'<button class="tab" data-p="arr" onclick="tab(this)">Arriving ('
     +t.arrivals+')</button>':'')
   +(D.hasPlant?'<button class="tab" data-p="plant" onclick="tab(this)">Plant</button>':'')
   +(MGR?'<button class="tab" data-p="mgr" onclick="tab(this)">Money</button>':'')
   +'<button class="tab" data-p="idle" onclick="tab(this)">Idle plant ('+t.idle+')</button>'
   +'</div>'
   +'<div class="pane on" id="p-groups">'+paneGroups()+'</div>'
   +'<div class="pane" id="p-chase">'+paneChase()+'</div>'
   +'<div class="pane" id="p-stock">'+paneStock()+'</div>'
   +'<div class="pane" id="p-aisle">'+paneAisle()+'</div>'
   +'<div class="pane" id="p-battle">'+paneBattle()+'</div>'
   +'<div class="pane" id="p-std">'+paneStd()+'</div>'
   +(t.arrivals?'<div class="pane" id="p-arr">'+paneArr()+'</div>':'')
   +(D.hasPlant?'<div class="pane" id="p-plant">'+panePlant()+'</div>':'')
   +(MGR?'<div class="pane" id="p-mgr">'+paneMgr()+'</div>':'')
   +'<div class="pane" id="p-idle">'+paneIdle()+'</div>'
   +'<div class="foot">Built from this morning\\'s SiteIQ exports &middot; '
   +'read-only &middot; POWERED BY SITEIQ<br>Author: Andrew Fisher</div>';
  document.getElementById('app').innerHTML=h;
}
function tab(el){
  var all=document.querySelectorAll('.tab');
  for(var i=0;i<all.length;i++) all[i].className='tab';
  el.className='tab on';
  var panes=document.querySelectorAll('.pane');
  for(var j=0;j<panes.length;j++) panes[j].className='pane';
  document.getElementById('p-'+el.getAttribute('data-p')).className='pane on';
  window.scrollTo(0,0);
}
function paneGroups(){
  var cats={};
  D.groups.forEach(function(g){ (cats[g.c]=cats[g.c]||[]).push(g); });
  var h='<input class="srch" id="gq" placeholder="Search everything the store holds" '
       +'oninput="filterGroups()">' + '<div id="glist">';
  Object.keys(cats).sort().forEach(function(c){
    var list=cats[c], av=0, oh=0;
    list.forEach(function(g){av+=g.av;oh+=g.oh});
    var tot=av+oh||1;
    h+='<div class="grp" data-cat="'+esc(c)+'">'
      +'<button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(c)+'</b><span>'+list.length+' different things</span></div>'
      +'<div class="gq"><b>'+av+'</b><span>on shelf</span></div>'
      +'<div class="gq"><b style="color:var(--org)">'+oh+'</b><span>out</span></div>'
      +'</button>'
      +'<div class="bar"><i class="ba" style="width:'+(100*av/tot)+'%"></i>'
      +'<i class="bo" style="width:'+(100*oh/tot)+'%"></i></div>'
      +'<div class="kids">'+list.map(kid).join('')+'</div></div>';
  });
  return h+'</div>';
}
function kid(g){
  var units=Object.keys(g.u||{}).map(function(u){return u+' ('+g.u[u]+')'}).join(' &middot; ');
  var who='';
  if(g.who && g.who.length){
    who='<div class="kw">'+g.who.slice(0,12).map(function(w){
      return '<b>'+esc(w.w)+'</b> &middot; '+esc(w.co)
        +(w.d==null?'':' &middot; '+w.d+(w.d===1?' day':' days')+' out');
    }).join('<br>')+(g.who.length>12?'<br>+ '+(g.who.length-12)+' more':'')+'</div>';
  }
  return '<div class="kid"><div class="kt"><b>'+esc(g.n)+'</b>'
    +'<em>'+g.av+' free</em>'+(g.oh?'<em class="o">'+g.oh+' out</em>':'')+'</div>'
    +(units?'<div class="where">'+esc(units)+'</div>':'')+who+'</div>';
}
function tog(b){
  var k=b.parentNode.querySelector('.kids');
  k.className = k.className.indexOf('on')>=0 ? 'kids' : 'kids on';
}
function filterGroups(){
  var q=(document.getElementById('gq').value||'').toLowerCase().trim();
  var grps=document.querySelectorAll('#glist .grp');
  for(var i=0;i<grps.length;i++){
    var g=grps[i], txt=g.textContent.toLowerCase();
    var hit=!q||txt.indexOf(q)>=0;
    g.style.display=hit?'':'none';
    if(q&&hit) g.querySelector('.kids').className='kids on';
  }
}
function paneChase(){
  var c=D.chase;
  var h='<div class="note"><b>Gear out longer than three days.</b> Walk the aisle, '
   +'check the shelf, then chase the name. Site plant, barriers and chutes are '
   +'listed separately below &mdash; they live on site by design and are not lost.</div>';
  h+='<div class="uhead">Tools to chase &mdash; '+c.tools.length+'</div>';
  var byU={};
  c.tools.forEach(function(x){(byU[x.u]=byU[x.u]||[]).push(x)});
  c.toolUnits.forEach(function(p){
    var u=p[0], list=byU[u]||[];
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>go and look here</span></div>'
      +'<div class="gq"><b style="color:var(--am)">'+list.length+'</b><span>items</span></div>'
      +'</button><div class="kids">'
      +list.map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div>'
          +'<div class="kw"><b>'+esc(x.w)+'</b> &middot; '+esc(x.co)+'</div></div>';
      }).join('')+'</div></div>';
  });
  h+='<div class="uhead">Site plant, barriers &amp; chutes &mdash; '+c.plant.length
    +' (normal)</div><div class="note">Out for days because that is where they '
    +'live. Kept out of the chase list so it stays worth reading.</div>';
  return h;
}
function paneStock(){
  var s=D.stock, t=D.tiles;
  var h='<div class="ring"><div class="rv">'+t.stockPct+'%</div>'
   +'<div class="rt"><b>of the store counted in the last 7 days</b>'
   +s.w1.toLocaleString()+' counted in the last day &middot; '
   +s.w3.toLocaleString()+' in three &middot; '+s.total.toLocaleString()+' on the register'
   +'</div></div>';
  h+='<div class="note"><b>'+s.stale.length+' assets have not been laid eyes on '
   +'in over a week.</b> That is the missing-asset hunt list &mdash; grouped by '
   +'where they are meant to live, so you can walk it.</div>';
  var byU={};
  s.stale.forEach(function(x){(byU[x.u]=byU[x.u]||[]).push(x)});
  Object.keys(byU).sort(function(a,b){return byU[b].length-byU[a].length})
   .forEach(function(u){
    var list=byU[u];
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>not counted in 7 days</span></div>'
      +'<div class="gq"><b style="color:var(--rd)">'+list.length+'</b><span>assets</span></div>'
      +'</button><div class="kids">'
      +list.slice(0,60).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div>'
          +(x.by?'<div class="kw">last sighted by <b>'+esc(x.by)+'</b></div>':'')+'</div>';
      }).join('')+more(60,list.length,'assets')
      +'</div></div>';
  });
  return h;
}
/* WALK AN AISLE - one screen per aisle, for a bloke standing in it.
   Everything about that aisle in one place: what should be on the shelf,
   what is out, what to chase, what has not been counted. He is holding
   the phone in the aisle, so the aisle is the unit of thought - not the
   product group. (Andrew, 29 Jul 2026: "when we walk the aisle, be good
   to click on it and it gives you the detailed list of what you're
   looking for and in which aisle") */
function paneAisle(){
  var A={};
  function slot(u){ return A[u]=A[u]||{shelf:[],out:[],chase:[],stale:[]}; }
  D.groups.forEach(function(g){
    Object.keys(g.u||{}).forEach(function(u){
      slot(u).shelf.push({n:g.n,q:g.u[u]});
    });
    (g.who||[]).forEach(function(w){ slot(w.u).out.push({n:g.n,w:w.w,co:w.co,d:w.d}); });
  });
  D.chase.tools.forEach(function(x){ slot(x.u).chase.push(x); });
  D.chase.plant.forEach(function(x){ slot(x.u).chase.push(x); });
  (D.stock.stale||[]).forEach(function(x){ slot(x.u).stale.push(x); });

  var h='<div class="note"><b>Pick the aisle you are standing in.</b> '
   +'Everything about it in one place &mdash; what should be on the shelf, '
   +'what is out, what to chase, and what has not been counted.</div>';
  Object.keys(A).sort(function(a,b){
    return (A[b].shelf.length+A[b].chase.length)-(A[a].shelf.length+A[a].chase.length);
  }).forEach(function(u){
    var a=A[u];
    var onShelf=a.shelf.reduce(function(s,x){return s+x.q},0);
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>'+a.shelf.length+' lines &middot; '
      +a.out.length+' out</span></div>'
      +'<div class="gq"><b>'+onShelf+'</b><span>on shelf</span></div>'
      +(a.chase.length?'<div class="gq"><b style="color:var(--am)">'+a.chase.length
        +'</b><span>chase</span></div>':'')
      +(a.stale.length?'<div class="gq"><b style="color:var(--rd)">'+a.stale.length
        +'</b><span>uncounted</span></div>':'')
      +'</button><div class="kids">';
    if(a.chase.length){
      h+='<div class="uhead">Look for these first &mdash; out over 3 days</div>';
      h+=a.chase.slice(0,40).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div>'
          +'<div class="kw"><b>'+esc(x.w)+'</b> &middot; '+esc(x.co)+'</div></div>';
      }).join('')+more(40,a.chase.length,'items');
    }
    if(a.stale.length){
      h+='<div class="uhead">Not counted in over a week</div>';
      h+=a.stale.slice(0,40).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +'<em class="o">'+x.d+' days</em></div></div>';
      }).join('')+more(40,a.stale.length,'assets');
    }
    h+='<div class="uhead">Should be on this shelf</div>';
    h+=a.shelf.sort(function(x,y){return y.q-x.q}).slice(0,80).map(function(x){
      return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
        +'<em>'+x.q+'</em></div></div>';
    }).join('');
    h+=more(80,a.shelf.length,'lines');
    h+='</div></div>';
  });
  return h;
}
/* DAY v NIGHT - the power bar. Issues counted at the start, returns at
   the end, so a tool taken on days and dropped back at night scores one
   for each crew: both did a piece of work. */
function paneBattle(){
  var b=D.battle;
  if(!b) return '<div class="note">No transaction export this morning, so '
    +'the ladder could not be built.</div>';
  var h='<div class="score">'
   +'<div class="sc day"><b>'+b.dayWins+'</b><span>Day shift</span>'
   +'<em>'+b.dayTotal.toLocaleString()+' movements</em></div>'
   +'<div class="vs">v</div>'
   +'<div class="sc night"><b>'+b.nightWins+'</b><span>Night shift</span>'
   +'<em>'+b.nightTotal.toLocaleString()+' movements</em></div></div>';
  h+='<div class="note"><b>Every issue and every return, shift by shift, '
   +'since the shut started.</b> Nights run 18:00 to 06:00, so a movement at '
   +'two in the morning counts for the night before &mdash; the crew that was '
   +'actually standing there.'
   +(b.nightsFrom?' Nights started '+b.nightsFrom+', so only the days both '
     +'crews were running are scored.':'')+'</div>';
  b.days.slice().reverse().forEach(function(x){
    var tot=x.D+x.N||1;
    var w=x.w==='D'?'<span class="win d">Day</span>'
        :x.w==='N'?'<span class="win n">Night</span>'
        :x.w==='T'?'<span class="win t">Tie</span>'
        :'<span class="win x">days only</span>';
    h+='<div class="brow"><div class="bd"><span>'+x.d+'</span>'+w+'</div>'
      +'<div class="bb">'
      +(x.D?'<i class="bd2" style="width:'+(100*x.D/tot)+'%">'+(x.D>tot*0.12?x.D:'')+'</i>':'')
      +(x.N?'<i class="bn" style="width:'+(100*x.N/tot)+'%">'+(x.N>tot*0.12?x.N:'')+'</i>':'')
      +'</div>'
      +'<div class="bnums"><span>DAY '+x.di+' out &middot; '+x.dr+' back</span>'
      +'<span>NIGHT '+x.ni+' out &middot; '+x.nr+' back</span></div></div>';
  });
  return h;
}
/* OUR STANDARDS - quoted from SWMS-CTS-001 Rev 4, not paraphrased. The
   store's own procedure is the authority; this screen is a reminder of
   it at the counter, never a replacement for signing on to it. */
function paneStd(){
  return '<div class="note"><b>SWMS-CTS-001 Rev 4</b> &middot; Tool Store '
   +'Operation, Cement Australia K2 2026 &middot; issued 15 Jul 2026. '
   +'This is the reminder at the counter. The SWMS itself is the document '
   +'you sign on to.</div>'
   +'<div class="std"><h3>The one that never bends</h3>'
   +'<p><b>Nothing issues or returns without scanning.</b> No exceptions, '
   +'no doing it later, no verbal hand-outs.</p></div>'
   +'<div class="std"><h3>The two SOPs</h3>'
   +'<div class="sop"><span class="n">SOP 1</span><b>Issue</b>'
   +'<span>Verify the hirer and their company. Inspect tools and leads; '
   +'confirm electrical tags, rigging inspection status, torque and '
   +'hydraulic compliance, and gas monitor bump and charge status. '
   +'<b style="color:#fff">Do not issue non-compliant gear.</b> '
   +'Scan every issue in SiteIQ.</span></div>'
   +'<div class="sop"><span class="n">SOP 2</span><b>Return &mdash; two stages, '
   +'two scans</b>'
   +'<span><b style="color:#fff">Stage 1:</b> receive, identify and '
   +'<b style="color:#fff">scan immediately</b>; place in the controlled '
   +'returns bay. Confirm condition with the returning person and record '
   +'faults.<br><b style="color:#fff">Stage 2:</b> inspect, clean, test, '
   +'charge and confirm compliance, then <b style="color:#fff">scan it '
   +'available</b>.<br>Never bypass either stage. Task gloves and P2 where '
   +'contamination or dust requires it.</span></div></div>'
   +'<div class="std"><h3>Why two scans</h3>'
   +'<p>The first scan says <b>it is back and it is ours again</b>. The '
   +'second says <b>it is fit to go out</b>. One scan cannot say both, and '
   +'the gap between them is where a faulty tool would otherwise walk '
   +'straight back onto a job.</p>'
   +'<p class="ref">Same words as the two A3 posters at the counter &mdash; '
   +'<b>Issue: Double Scan</b> and <b>Return: Double Scan</b>. If the poster '
   +'and this page ever disagree, the SWMS wins.</p></div>'
   +'<div class="std"><h3>Faults &mdash; every time</h3>'
   +'<p>Out of Service tag, photograph, written report, SiteIQ status and '
   +'physical quarantine. Record the asset, the fault, who reported it and '
   +'their company and contact, the location, date and time, the action and '
   +'who was notified.</p></div>'
   +'<div class="std"><h3>Handover</h3>'
   +'<p>Communicate open risks, faults, deliveries, equipment status, client '
   +'actions and owners to the incoming shift.</p></div>'
   +'<div class="std"><h3>The Coates Way at the counter</h3>'
   +'<div class="rule"><i></i><span><b>Care Deeply</b> &mdash; check in on '
   +'your workmates. A smile and "how are you?" matters. Concerns and '
   +'fatigue get raised, not carried.</span></div>'
   +'<div class="rule"><i></i><span><b>Stop Work Authority</b> &mdash; '
   +'anyone can stop the job. If it is not safe, stop, make the call, '
   +'ask.</span></div>'
   +'<div class="rule"><i></i><span><b>Best Service &amp; Value</b> &mdash; '
   +'gear that leaves this window bumped, charged and understood is a crew '
   +'that walks straight to the job.</span></div></div>';
}
function paneArr(){
  var h='<div class="note"><b>On its way, or stuck.</b> Not on a shelf and '
   +'not out with a crew &mdash; ordered, in transit, or held up in Baseplan. '
   +'Worth knowing before you tell someone we have not got one.</div>';
  var by={};
  D.arrivals.forEach(function(x){(by[x.s]=by[x.s]||[]).push(x)});
  Object.keys(by).sort().forEach(function(st){
    var list=by[st];
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(st)+'</b><span>status in SiteIQ</span></div>'
      +'<div class="gq"><b style="color:var(--am)">'+list.length+'</b>'
      +'<span>items</span></div></button><div class="kids">'
      +list.map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b></div>'
          +'<div class="kw">bound for '+esc(x.u)+'</div></div>';
      }).join('')+'</div></div>';
  });
  return h;
}
/* PLANT - shown only where there is plant, because not every store has
   it. (Andrew, 29 Jul 2026: "some sites will be different so maybe a
   toggle on and off for when we have plant onsite") */
function panePlant(){
  var p=D.plant, t=D.tiles;
  var h='<div class="note"><b>Plant on this site.</b> Out with a crew, idle '
   +'on charge, or free on the ground. Turn it off if this store is tools '
   +'only.<br><button class="stmore" style="margin-top:10px" type="button" '
   +'onclick="togglePlant()">Hide plant from this board</button></div>'
   +'<div class="tiles">'
   +tile(t.plantOn,'Out with crews')
   +tile(t.plantIdle,'Idle on charge','a')
   +tile(t.plantFree,'Free on the ground','g')
   +'</div>';
  [['Out with crews',p.out],['Idle - on charge, not out',p.idle],
   ['Free on the ground',p.free]].forEach(function(pair){
    if(!pair[1].length) return;
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+pair[0]+'</b><span>plant</span></div>'
      +'<div class="gq"><b>'+pair[1].length+'</b><span>items</span></div>'
      +'</button><div class="kids">'
      +pair[1].slice(0,80).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +(x.d!=null?'<em class="o">'+x.d+' days</em>':'')+'</div>'
          +'<div class="kw">'+esc(x.u)+(x.w?' &middot; <b>'+esc(x.w)+'</b>':'')+'</div></div>';
      }).join('')+more(80,pair[1].length,'machines')+'</div></div>';
  });
  return h;
}
function togglePlant(){
  SHOW_PLANT=!SHOW_PLANT;
  D.hasPlant=SHOW_PLANT;
  render();
}
/* MONEY - the manager layer. A day rate against every line so a wrong
   one shows itself. */
function paneMgr(){
  var m=MGR;
  if(!m||!m.perDay) return '<div class="note">No rate data in the on-hire export.</div>';
  var h='<div class="ring"><div class="rv" style="font-size:30px">$'
   +m.perDay.toLocaleString(undefined,{minimumFractionDigits:2})+'</div>'
   +'<div class="rt"><b>on hire, per day</b>'
   +'$'+m.week.toLocaleString(undefined,{maximumFractionDigits:0})
   +' a week at today&rsquo;s rates. Every figure is SiteIQ&rsquo;s own '
   +'SHIFT_RATE &mdash; nothing here is estimated.</div></div>';
  if(m.zeroN){
    h+='<div class="note" style="border-left-color:var(--rd)"><b>'+m.zeroN
     +' items are on hire at a zero rate.</b> Earning nothing while they sit '
     +'with a crew. Worth a look &mdash; it is usually a rate that never got '
     +'set, not gear that is meant to be free.</div>'
     +'<div class="grp"><button type="button" onclick="tog(this)">'
     +'<div class="gn"><b>Zero-rate lines</b><span>check these first</span></div>'
     +'<div class="gq"><b style="color:var(--rd)">'+m.zeroN+'</b><span>items</span></div>'
     +'</button><div class="kids">'
     +m.zero.map(function(x){
       return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b></div>'
         +'<div class="kw">'+esc(x.co)+(x.w?' &middot; '+esc(x.w):'')+'</div></div>';
     }).join('')+'</div></div>';
  }
  function money(v){return '$'+v.toLocaleString(undefined,{maximumFractionDigits:0})}
  function barlist(title,rows,sub){
    if(!rows.length) return '';
    var max=rows[0][1]||1;
    var o='<div class="uhead">'+title+'</div>';
    rows.slice(0,14).forEach(function(r){
      o+='<div class="brow"><div class="bd"><span>'+esc(r[0])+'</span>'
        +'<span>'+money(r[1])+sub+'</span></div>'
        +'<div class="bb"><i class="bd2" style="width:'+(100*r[1]/max)+'%"></i></div></div>';
    });
    return o+more(14,rows.length,'groups');
  }
  h+=barlist('By product group',m.cats,'/day');
  h+=barlist('By company',m.firms,'/day');
  h+='<div class="uhead">Dearest lines &mdash; per day</div>';
  m.top.slice(0,30).forEach(function(x){
    h+='<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
      +'<em>'+money(x.v)+'/day</em></div>'
      +'<div class="kw">'+x.q+' out &middot; '+money(x.r)+' each</div></div>';
  });
  h+=more(30,m.top.length,'lines');
  return h;
}
function paneIdle(){
  var h='<div class="note"><b>Held by the site plant pool.</b> On charge, on site, '
   +'not out with a crew &mdash; the cost-saving watch list.</div>';
  var byU={};
  D.idle.forEach(function(x){(byU[x.u]=byU[x.u]||[]).push(x)});
  Object.keys(byU).sort(function(a,b){return byU[b].length-byU[a].length})
   .forEach(function(u){
    var list=byU[u];
    h+='<div class="grp"><button type="button" onclick="tog(this)">'
      +'<div class="gn"><b>'+esc(u)+'</b><span>idle but on charge</span></div>'
      +'<div class="gq"><b>'+list.length+'</b><span>items</span></div>'
      +'</button><div class="kids">'
      +list.slice(0,60).map(function(x){
        return '<div class="kid"><div class="kt"><b>'+esc(x.n)+'</b>'
          +(x.d==null?'':'<em class="o">'+x.d+' days</em>')+'</div></div>';
      }).join('')+more(60,list.length,'machines')+'</div></div>';
  });
  return h;
}
</script></body></html>"""


def menc(code, s):
    r = _mulberry32(_xmur3(code + '|CoatesK2mgr2026')())
    return base64.b64encode(
        bytes((ord(c) ^ (r() >> 24)) & 0xFF for c in s)).decode('ascii')


def mtag(code):
    return format(_xmur3(code + '|CoatesK2mgrtag2026')(), 'x')


def build(data, code, asof, pricing=None, mgr_code=None):
    """The finished, gated page. Neither code appears in the file.

    Two payloads under two codes: the stores board, and the money. A
    manager code opens both - it is a superset, not a second door to
    remember - but the stores code cannot reach the money at all,
    because it is separately encrypted rather than merely hidden.
    """
    blob = json.dumps(data, separators=(',', ':'), ensure_ascii=True)
    page = (PAGE.replace('__PAYLOAD__', enc(code, blob))
                .replace('__TAG__', tag(code))
                .replace('__ASOF__', asof or 'this morning'))
    if pricing and mgr_code:
        mblob = json.dumps(pricing, separators=(',', ':'), ensure_ascii=True)
        page = (page.replace('__MPAYLOAD__', menc(mgr_code, mblob))
                    .replace('__MTAG__', mtag(mgr_code))
                    #  the stores code, encrypted under the manager code -
                    #  never the code itself
                    .replace('__MKEY__', menc(mgr_code, code)))
    else:
        page = (page.replace('__MPAYLOAD__', '').replace('__MTAG__', '')
                    .replace('__MKEY__', ''))
    return page
