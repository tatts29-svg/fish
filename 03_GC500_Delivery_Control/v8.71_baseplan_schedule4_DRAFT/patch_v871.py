# Author: Andrew Fisher. v8.71 - the 6 Oct 2026 Baseplan export and Schedule 4, onto the page's own sources.
#
# Andrew (6 Oct 2026, with Baseplan_SuperCars.xlsx and GC500_26_Schedule_4.xlsx): "Please review and Update and go
# Live when done".
#
# 1. CONTRACTS - DATA.rental_on_hire moves from the 24 Sep export (plus the 1 Oct accessory supplement) to the 6 Oct
#    export: every line the export still has is refreshed field by field from it, the lines it adds are added, the
#    lines it no longer has are taken off. The rules are the source's own, as it states them and as its rows show:
#    a delivered (or returned) line is on hire from its booked delivery date; demob is the booked pick-up date; a rate
#    of 0 is no rate (unknown, never nought); an item code starting SUB is subhired; a line is joined to the register
#    by asset number first, then by a shared delivery docket - the reference at the head of a description and the
#    Status column are never evidence. Lines whose number did not change keep their join.
# 2. SCHEDULE 4 - the register rows Schedule 4 changed against Schedule 3: the TPORT COST figures now written on the
#    Week 3 and Week 2 loads (carrier charges Coates pays), dockets, load times and carriers where the register has
#    none, the generator asset numbers it now names, and the four fencing semi loads it adds.
#
# Inputs are the two workbooks as Andrew sent them, read from private paths and bound by SHA-256 (they carry
# contract rates, so they are not in this public repository in the clear - see the README). Schedule 3 is the
# committed copy in review_01Oct2026_schedule_3/.
import datetime, hashlib, json, os, re, sys
from pathlib import Path
import openpyxl

HERE = Path(__file__).resolve().parent
BASE_SHA = 'b6475604c95adcf0399735db292d26815c8a0101caee73131801bcb55977643e'
BASEPLAN_SHA = '5f9e83aa63a76c31bc974d85d963800d7872191ffc18ef4e9ee255339aece090'
SCHED4_SHA = '129d27290d6a86aa44dc3a933eca41086f7005e7138919fad20087a077c985c7'
SCHED3_SHA = 'ed10b89dac530f63e6a6df9926a121cdd79c77a7783e127085e3d3c877d46c4c'
EXPORT_DAY = '2026-10-06'

page = Path(sys.argv[1])
raw = page.read_bytes()
assert hashlib.sha256(raw).hexdigest() == BASE_SHA, 'base is not live v8.70'


def bound(env, sha, default=None):
    p = Path(os.environ.get(env) or default or '')
    if not p.is_file():
        sys.exit(f'{env} must name the workbook (SHA-256 {sha[:16]}...)')
    got = hashlib.sha256(p.read_bytes()).hexdigest()
    if got != sha:
        sys.exit(f'{env}: checksum mismatch ({got[:16]}...)')
    return p


BP = bound('V871_BASEPLAN', BASEPLAN_SHA)
S4 = bound('V871_SCHEDULE4', SCHED4_SHA)
S3 = bound('V871_SCHEDULE3', SCHED3_SHA, str(HERE.parent / 'review_01Oct2026_schedule_3' / 'GC500_26_Schedule_3.xlsx'))

text = raw.decode('utf-8-sig')
bom = raw.startswith(b'\xef\xbb\xbf')
m = re.search(r'const DATA = (\{.*?\});\n', text)
assert m, 'DATA not found'
D = json.loads(m.group(1))
ORIG = json.loads(m.group(1))
R = D['rental_on_hire']
LOG = {'added': [], 'removed': [], 'changed': [], 'rejoined': [], 'plant_line_copies': [], 'schedule': [], 'flags': []}


# ------------------------------------------------------------------ helpers
def iso(v):
    if isinstance(v, datetime.datetime):
        return v.date().isoformat()
    if isinstance(v, datetime.date):
        return v.isoformat()
    return None


def txt(v):
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = re.sub(r'\s+', ' ', str(v)).strip()
    return s or None


def rate(v):
    return None if v in (None, '', 0, 0.0) else float(v)


def num_or_none(v):
    return None if v in (None, '') else v


PLANT = re.compile(r'^\d{5,8}$')
LEAD = re.compile(r'^(?:(?:[A-Z]{1,4}-?\s?\d{1,3}[A-Z]?(?:-\d{1,3})*(?:-S\d{1,3})?)|COATES|SUPPLY|EVENTS?|Supply|Event)\s*-?\s*')


PRODUCT = re.compile(r'\b(FWF|WCTV|Toilet|Portable|Lighting|Generator|Variable|Forklift|Telehandler|Container|Barrier|Refrigerator|Steps|Transport|Delivery|Cleaning|Desk|Chairs?|Microwave|Trakmat|Sewage|Sink|Urn|Scissor|Knuckle|Ticket|Pickup|Distribution|Commentary)\b')


def what_of(desc):
    # the thing, without the reference or crew word the project manager writes in front of it (as the source's own
    # 'what' reads on every line it already had - checked against all 308)
    d = desc or ''
    mm = PRODUCT.search(d)
    if mm and mm.start() > 0 and re.fullmatch(r'[A-Za-z0-9/ \-]*', d[:mm.start()]):
        return d[mm.start():].strip()
    w = LEAD.sub('', d, count=1).strip()
    return w or d


# ------------------------------------------------------------------ 1. the 6 Oct export, as read
wb = openpyxl.load_workbook(BP, data_only=True, read_only=True)
NEW, TABS = {}, {}
for ws in wb.worksheets:
    tab = ws.title.replace('Hre Contract-', '').strip()
    con, br = tab.split('-')
    TABS[con] = (br, tab)
    rows = list(ws.iter_rows(values_only=True))
    H = rows[0]
    for r in rows[1:]:
        if r[0] is None:
            continue
        d = dict(zip(H, r))
        NEW[(con, int(d['Line']))] = d
wb.close()

OLDROWS = R['rows']
OLD = {(str(r['rental_contract']), int(r['line'])): r for r in OLDROWS}
ASSETS = D['assets']


def raw_fields(d, con, br):
    item = txt(d['Item'])
    st = txt(d['Status'])
    bdd, bpu, etd = iso(d['Booked Delivery Date']), iso(d['Booked Pickup Date']), iso(d['Expected Term Date'])
    delivered = st in ('Delivered', 'Returned')
    started = st in ('Delivered', 'Returned', 'Applied')
    sub = bool(item and item.upper().startswith('SUB'))
    return {
        'rental_contract': con, 'branch_code': br, 'line': int(d['Line']),
        'item': item, 'asset_no': item, 'asset_no_is_plant_number': bool(item and PLANT.match(item)),
        'description': txt(d['Description']), 'quantity': int(d['Quantity']) if d['Quantity'] is not None else None,
        'status_as_written': st, 'booked_delivery_date': bdd, 'delivery_number': txt(d['Delivery Number']),
        'return_number': txt(d['Return Number']), 'expected_term_date': etd, 'term_date': iso(d['Term Date']),
        'booked_pickup_date': bpu, 'delivered': delivered, 'start_date': bdd if started else None,
        'demob_date': bpu or etd,
        'rate_1': rate(d['Rate 1']), 'rate_2': rate(d['Rate 2']), 'rate_3': rate(d['Rate 3']),
        'rate_4': rate(d['Rate 4']), 'rate_5': rate(d['Rate 5']), 'flat_monthly_charge': rate(d['Flat Monthly Charge']),
        'sales_analysis_code': txt(d['Sales Analysis Code']), 'supplier_sub_rental': txt(d['Supplier Sub Rental']),
        'subhired': sub, 'subhire_rule': 'the item code starts with SUB' if sub else None,
    }


# fields a refresh may carry from the export onto a line the page already has
CARRY = ['item', 'asset_no', 'asset_no_is_plant_number', 'description', 'quantity', 'status_as_written',
         'booked_delivery_date', 'delivery_number', 'return_number', 'expected_term_date', 'term_date',
         'booked_pickup_date', 'delivered', 'start_date', 'demob_date', 'rate_1', 'rate_2', 'rate_3', 'rate_4',
         'rate_5', 'flat_monthly_charge', 'sales_analysis_code', 'supplier_sub_rental', 'subhired', 'subhire_rule']

# ------------------------------------------------------------------ 2. Schedule 4 against Schedule 3 (read first:
# its generator numbers are the register's numbers the contract lines join to)


def read_sched(p):
    w = openpyxl.load_workbook(p, data_only=True, read_only=True)
    out = {}
    for ws in w.worksheets:
        rs, blank = [], 0
        for i, r in enumerate(ws.iter_rows(max_col=16, values_only=True), start=1):
            t = tuple((v.strip() if isinstance(v, str) else v) for v in r)
            if all(v in (None, '') for v in t):
                blank += 1
                if blank > 50:
                    break
                continue
            blank = 0
            rs.append((i, t))
        out[ws.title] = rs
    w.close()
    return out


SC3, SC4 = read_sched(S3), read_sched(S4)


def key_of(row):
    return tuple(v.isoformat() if isinstance(v, (datetime.datetime, datetime.date)) else v for v in row)


changed4 = {}
for sheet, rows in SC4.items():
    before = {key_of(t) for _, t in SC3.get(sheet, [])}
    changed4[sheet] = [(i, t) for i, t in rows if key_of(t) not in before]

REF = re.compile(r'^\s*([A-Z]{1,4})\s?-?\s?(\d{1,3}[A-Z]?)\b')


def ref_of(local):
    mm = REF.match(str(local or ''))
    return (mm.group(1) + mm.group(2)) if mm else None


def cost_of(v):
    s = txt(v)
    if not s:
        return None
    if s.lower() == 'na':
        return {'amount': 0.0, 'plus': False, 'internal': False, 'as_written': s,
                'note': 'na - no separate carrier charge on this row (Schedule 4)'}
    mm = re.match(r'^\$?\s*([\d,]+(?:\.\d+)?)\s*(\+)?$', s)
    if mm:
        return {'amount': float(mm.group(1).replace(',', '')), 'plus': bool(mm.group(2)), 'internal': False, 'as_written': s}
    if s.lower() == 'internal':
        return {'amount': None, 'plus': False, 'internal': True, 'as_written': s}
    return {'amount': None, 'plus': False, 'internal': False, 'as_written': s}


A = {a['key']: a for a in ASSETS}
GEN_NUMS = {}   # Schedule 4's asset column on the generator rows it changed: GN13 -> ('1261271', note)
for sheet, rows in changed4.items():
    for i, t in rows:
        if not isinstance(t[1], str) or t[1].lower() != 'generator':
            continue
        ref = ref_of(t[4])
        a = A.get(ref)
        asset = txt(t[8])
        if not a or not asset:
            continue
        mm = re.match(r'^(\d{6,8})\s*(.*)$', asset)
        if mm:
            GEN_NUMS[ref] = (mm.group(1), txt(mm.group(2)))

for ref, (no, note) in sorted(GEN_NUMS.items()):
    a = A[ref]
    was = list(a.get('asset_numbers') or [])
    if was != [no]:
        a['asset_numbers'] = [no]
        a['asset_notes'] = [note.upper()] if note else []
        a['asset_no_state'] = 'supplied'
        LOG['schedule'].append({'ref': ref, 'what': 'asset number', 'was': was, 'now': [no], 'note': note})

# ------------------------------------------------------------------ 6. Schedule 4 onto the register's rows
HEADS = {}
for sheet, rows in SC4.items():
    if rows and rows[0][1][0] == 'Date':
        HEADS[sheet] = rows[0][1]


def col(sheet, name, t):
    h = HEADS.get(sheet) or ()
    for i, v in enumerate(h):
        if isinstance(v, str) and v.strip().lower() == name:
            return t[i] if i < len(t) else None
    return None


def cost_cell(sheet, t):
    v = col(sheet, 'tport cost', t)
    if v is None and sheet == 'Week 2':
        v = t[12] if len(t) > 12 else None    # Week 2 writes its figures one column past the carrier, unheaded
    return v


def day_of(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return iso(v)
    return None


def events_for(sheet, date, ref, item):
    a = A.get(ref)
    if not a:
        return []
    return [e for e in a.get('events') or [] if e['sheet'] == sheet and (date is None or e['date'] == date)
            and (item is None or str(e.get('item') or '').lower() == str(item).lower())]


def fmt_dd(v):
    s = txt(v)
    if not s:
        return None
    nums = re.findall(r'\d{8}', s)
    return ' / '.join(nums) if nums else None


TIME = re.compile(r'^(\d{3,4}|\d{1,2}[:.]\d{2})(\s*/\s*(\d{3,4}|\d{1,2}[:.]\d{2}))*$')


def time_of(v):
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        v = '%04d' % int(v)
    s_ = txt(v)
    return s_ if s_ and TIME.match(s_) else None


PLANT_BY_KEY = {p_['key']: p_ for p_ in D['plant_lines']['lines']}


def plant_events_for(sheet, date, product, dd):
    out = []
    for p_ in D['plant_lines']['lines']:
        for e in p_.get('events') or []:
            if e.get('sheet') != sheet or e.get('date') != date:
                continue
            ed = set(re.findall(r'\d{8}', str(e.get('dd') or '')))
            if (dd and ed & set(re.findall(r'\d{8}', dd))) or (not ed and product and str(product).lower() in str(p_.get('name') or '').lower()):
                out.append((p_['key'], e))
    return out


semis, applied, last = [], {}, None
for sheet in ('Week 3', 'Week 2'):
    for i, t in changed4.get(sheet, []):
        if t[0] == 'Date':
            continue
        date, product, item = day_of(t[0]), txt(t[1]), txt(t[2])
        if product and product.lower() == 'fencing':
            semis.append((sheet, i, t))
            continue
        ref = ref_of(t[4])
        tc = cost_of(cost_cell(sheet, t))
        dd = fmt_dd(col(sheet, 'dd', t))
        if date is None and last and ref == last[0]:          # a continuation row: same reference, no date of its own
            hits = [(ref, last[1])]
        else:
            evs = events_for(sheet, date, ref, item)
            if not evs and ref:                               # the register still carries the day it was planned
                evs = events_for(sheet, None, ref, item)
            hits = [(ref, e) for e in evs]
            if not ref:
                hits = plant_events_for(sheet, date, product, dd)
        if len(hits) != 1:
            if tc is not None or dd:
                LOG['schedule'].append({'ref': ref, 'sheet': sheet, 'row': i, 'what': 'not applied', 'why': f'{len(hits)} register rows match'})
            continue
        ref, e = hits[0]
        last = (ref, e)
        done = []
        if tc is not None:
            prev = applied.get(id(e))
            if prev:                                          # more than one truck on the one register row: add them
                amt = (prev['amount'] or 0) + (tc['amount'] or 0)
                tc = {'amount': round(amt, 2), 'plus': prev['plus'] or tc['plus'], 'internal': False,
                      'as_written': prev['as_written'] + ' + ' + tc['as_written']}
            if e.get('transport_cost') != tc:
                e['transport_cost'], e['transport_cost_text'] = tc, tc['as_written']
                done.append('transport ' + tc['as_written'])
            applied[id(e)] = tc
        if dd and not re.search(r'\d{8}', str(e.get('dd') or '')):
            e['dd'] = dd
            done.append('docket ' + dd)
        car = txt(col(sheet, 'carrier', t))
        if car and car.upper() != 'NA' and (not e.get('carrier') or not re.search(r'[A-Za-z]{2}', str(e.get('carrier'))) or 'moved' in str(e.get('carrier')).lower()):
            e['carrier'] = re.sub(r'\s*/\s*', '/', car.upper())
            done.append('carrier ' + e['carrier'])
        lt = time_of(col(sheet, 'load times', t) if sheet == 'Week 2' else col(sheet, 'load time', t))
        if lt and not e.get('load_time'):
            e['load_time'] = lt
            done.append('load time ' + lt)
        if done:
            LOG['schedule'].append({'ref': ref, 'sheet': sheet, 'date': date, 'item': item, 'what': done})

# the fencing semis: four new loads (Phillip Park), held apart from plant as every semi row is
FR = D['plant_lines']['fencing_rows_not_plant']
have_ids = set(re.findall(r'"task_id": ?"(T\d{4})"', json.dumps(D)))
nxt = max(int(x[1:]) for x in have_ids) + 1
for sheet, i, t in semis:
    date = day_of(t[0]) or ('2026-10-02' if 'friday 2nd october' in str(t[0]).lower() else None)
    tc = cost_of(cost_cell(sheet, t))
    qty = t[3]
    notes = ', '.join(x for x in (txt(t[4]) if txt(t[4]) and txt(t[4]).lower() != 'fencing' else None, txt(t[5]) if not re.search(r'park', str(t[5] or ''), re.I) else None) if x)
    loc = next((txt(v) for v in t[4:7] if isinstance(v, str) and re.search(r'park', v, re.I)), 'Phillip Park')
    if any(r['date'] == date and r.get('transport_cost_text') == (tc or {}).get('as_written') for r in FR):
        continue
    tid = 'T%04d' % nxt
    nxt += 1
    FR.append({'task_id': tid, 'date': date, 'item': 'fencing', 'quantity_display': str(qty), 'location': loc,
               'notes': notes or None, 'transport_cost_text': tc['as_written'] if tc else None, 'transport_cost': tc,
               'source': f"Schedule 4 '{sheet}' row {i}"})
    LOG['schedule'].append({'ref': tid, 'sheet': sheet, 'date': date, 'what': [f'fencing semi x{qty} {tc["as_written"] if tc else ""}'.strip()]})
FR.sort(key=lambda r: (r['date'] or '', r['task_id']))

# ANDREW'S MATCHES WIN. Andrew, 6 Oct 2026: "good chance baseplan and spreadsheet allocation of asset numbers are
# wrong. What i have matched up and completed is correct." The asset numbers he has put on each reference, as the
# shared record held them at version 4126 (6 Oct 13:56 AEST), are the authority: each number comes off any other
# reference the schedule gave it to, and a contract line carrying it joins his reference. (The page still reads his
# record live; this takes the files' contrary allocations out of the page's own sources.)
ANDREW_4126 = {"GN01": ["1276507"], "P08": ["421138"], "P13": ["1097346"], "P15": ["1097345"], "P21": ["1327220"], "P41": ["1189412"],
               "P44": ["198481"], "P46": ["1327215"], "P51": ["1322579"],
               "T0001": ["1182999", "1191877", "1211354", "1211359", "1211370", "1211383", "1211404", "1271129"], "T0023": ["1257261"],
               "T0085": ["1272166"], "WC01": ["1211958", "1211967", "1317644"], "WC02": ["1058086"], "WC04": ["1212502"], "WC05": ["1328978"],
               "WC06": ["1195658", "1212523"], "WC100": ["1248439", "1288823"], "WC11": ["1211969", "1211976"],
               "WC12": ["1002565", "1200601", "1211961", "1211963"], "WC21": ["1002747", "1103497", "1211964", "1211971", "1211977", "1212172"],
               "WC27": ["1328979"], "WC50": ["1211974"], "WC60": ["1087500", "1119489", "1328980", "1328981"]}
ANDREW_OF = {n: k for k, ns in ANDREW_4126.items() for n in ns}
for a in ASSETS:
    kept = [n for n in (a.get('asset_numbers') or []) if ANDREW_OF.get(str(n), a['key']) == a['key']]
    if kept != list(a.get('asset_numbers') or []):
        LOG['schedule'].append({'ref': a['key'], 'what': 'number off - Andrew has it elsewhere',
                                'was': a.get('asset_numbers'), 'now': kept,
                                'moved_to': sorted({ANDREW_OF[str(n)] for n in a['asset_numbers'] if str(n) not in kept})})
        a['asset_numbers'] = kept
        if not kept:
            a['asset_no_state'] = 'not supplied'

for coll, idk in ((D['plant_lines']['lines'], 'key'), (D.get('unreferenced') or [], 'task_id')):
    for u in coll:
        k = u[idk]
        was = [str(n) for n in (u.get('asset_numbers') or [])]
        now = list(ANDREW_4126[k]) if k in ANDREW_4126 else [n for n in was if ANDREW_OF.get(n, k) == k]
        if now != was:
            u['asset_numbers'] = now
            LOG['schedule'].append({'ref': k, 'what': "numbers as Andrew matched them", 'was': was, 'now': now})

# every register number -> its reference, after Schedule 4 (the join the contracts use)
NUM_OWNER = {}
for a in ASSETS:
    for n in a.get('asset_numbers') or []:
        NUM_OWNER.setdefault(str(n), []).append(('asset', a['key']))
for u in D.get('unreferenced') or []:
    for n in u.get('asset_numbers') or []:
        NUM_OWNER.setdefault(str(n), []).append(('unreferenced row', u['task_id']))
DOCKET_OWNER = {}
for a in ASSETS:
    for e in a.get('events') or []:
        for dn in re.findall(r'\d{8}', str(e.get('dd') or '')):
            DOCKET_OWNER.setdefault(dn, set()).add(('asset', a['key']))
for pl in D['plant_lines']['lines']:
    for e in pl.get('events') or []:
        for dn in re.findall(r'\d{8}', str(e.get('dd') or '')):
            DOCKET_OWNER.setdefault(dn, set()).add(('unreferenced row', pl['key']))


# Baseplan writes some numbers on more than one line (separate machines, one of them misnumbered). Andrew's number
# then takes the delivered line only; the others keep their own join and are listed for him.
CARRIERS = {}
for (_c, _l), _d in NEW.items():
    _it = txt(_d['Item'])
    if _it and PLANT.match(_it):
        CARRIERS.setdefault(_it, []).append((_c, _l, txt(_d['Status']) in ('Delivered', 'Returned')))


def andrew_takes(row):
    cs = CARRIERS.get(str(row.get('asset_no')), [])
    if len(cs) <= 1:
        return True
    return bool(row.get('delivered')) and sum(1 for c in cs if c[2]) == 1


def join(row):
    """the join a line gets when its number is new to it: Andrew's match, then asset number, then delivery docket"""
    no = str(row.get('asset_no') or '')
    if row.get('asset_no_is_plant_number') and not andrew_takes(row):
        return None   # a number on more than one line: only the delivered line follows it; this one keeps its join
    if row.get('asset_no_is_plant_number') and no in ANDREW_OF:
        k = ANDREW_OF[no]
        to = 'asset' if k in A else 'unreferenced row'
        return {'state': 'same asset number', 'to': to, 'key': k if to == 'asset' else None, 'task_id': None if to == 'asset' else k,
                'via': 'asset number', 'basis': f"asset number {no} is on {k}, matched on site by Andrew Fisher, and on line {row['line']} of contract {row['rental_contract']}"}
    owners = NUM_OWNER.get(no, []) if row.get('asset_no_is_plant_number') else []
    if len(owners) == 1:
        to, key = owners[0]
        return {'state': 'same asset number', 'to': to, 'key': key if to == 'asset' else None,
                'task_id': key if to != 'asset' else None, 'via': 'asset number',
                'basis': f"asset number {no} is on {key} in the register and on line {row['line']} of contract {row['rental_contract']}"}
    if len(owners) > 1:
        return {'state': 'ambiguous', 'to': None, 'key': None, 'task_id': None, 'via': None,
                'basis': f"asset number {no} is on {', '.join(k for _, k in owners)} in the register"}
    # Andrew, 6 Oct 2026: "good chance baseplan and spreadsheet allocation of asset numbers are wrong. What i have
    # matched up and completed is correct." A docket only joins a line that carries no plant number: a numbered line
    # goes where its number is recorded (by Andrew on site, which the page reads live), never where a docket guesses.
    dk = set() if row.get('asset_no_is_plant_number') else DOCKET_OWNER.get(str(row.get('delivery_number') or ''), set())
    if len(dk) == 1:
        to, key = next(iter(dk))
        return {'state': 'same delivery docket', 'to': to, 'key': key if to == 'asset' else None,
                'task_id': key if to != 'asset' else None, 'via': 'delivery docket',
                'basis': f"delivery docket {row['delivery_number']} is on {key} in the register and on line {row['line']} of contract {row['rental_contract']}"}
    return None


# ------------------------------------------------------------------ 3. refresh the lines the export still has
KINDS_HELD = {r.get('kind') for r in OLDROWS if r.get('match') and r['match'].get('via') == 'kind of item'} | {'vms', 'generator', 'toilet', 'building', 'barrier'}
rows_out = []
for r in OLDROWS:
    k = (str(r['rental_contract']), int(r['line']))
    if k not in NEW:
        LOG['removed'].append({'line': f'{k[0]}/{k[1]}', 'item': r.get('item'), 'description': r.get('description'), 'status': r.get('status_as_written')})
        continue
    br = TABS[k[0]][0]
    f = raw_fields(NEW[k], k[0], br)
    diffs = {}
    for c in CARRY:
        if f[c] != r.get(c):
            diffs[c] = [r.get(c), f[c]]
            r[c] = f[c]
    if 'description' in diffs:
        r['what'] = what_of(r['description'])
    if 'asset_no' in diffs or 'delivery_number' in diffs or (r.get('asset_no_is_plant_number') and str(r.get('asset_no')) in ANDREW_OF):
        j = join(r)
        old_m = r.get('match') or {}
        if j and (j.get('key'), j.get('task_id')) != (old_m.get('key'), old_m.get('task_id')):
            r['match'] = j
            LOG['rejoined'].append({'line': f'{k[0]}/{k[1]}', 'was': old_m.get('key') or old_m.get('task_id'), 'now': j.get('key') or j.get('task_id'), 'via': j['via']})
        elif not j and 'asset_no' in diffs and old_m.get('via') == 'asset number':
            r['match'] = {'state': 'unmatched', 'to': None, 'key': None, 'task_id': None, 'via': None,
                          'basis': 'no register line carries this number and no unreferenced row is this on the day; its kind puts the register\'s assets on this contract'}
            LOG['rejoined'].append({'line': f'{k[0]}/{k[1]}', 'was': old_m.get('key') or old_m.get('task_id'), 'now': None, 'via': None})
    if diffs:
        LOG['changed'].append({'line': f'{k[0]}/{k[1]}', 'fields': sorted(diffs)})
    rows_out.append(r)

# ------------------------------------------------------------------ 4. the lines the export adds
TEMPLATE_RULES = [  # (test on the description / item, family, kind, register_type, charge_line)
    # a cleaning fee is a service charged on the contract, not a load: it is never transport coverage
    (lambda d, i: i and i.upper().startswith('CLEAN'), 'accessory', 'accessory', None, False),
    (lambda d, i: 'transport charge' in d.lower(), 'transport', 'transport', None, True),
    (lambda d, i: 'variable message' in d.lower(), 'vms', 'vms', 'VMS', False),
    (lambda d, i: 'fork extension' in d.lower(), 'forklift accessory', 'forklift accessory', None, False),
    (lambda d, i: 'forklift' in d.lower(), 'forklift', 'forklift', None, False),
    (lambda d, i: 'refrigerator' in d.lower(), 'furniture', 'furniture', 'Fridge Lge', False),
    (lambda d, i: 'building shell 6.0m' in d.lower(), 'building', 'building', 'Building 6m', False),
    (lambda d, i: 'steps toilet block' in d.lower(), 'accessory', 'accessory', None, False),
    (lambda d, i: 'fresh water flush' in d.lower(), 'toilet', 'toilet', 'FWF', False),
]
SKELETON = {k: None for k in OLDROWS[0].keys()}
for k in sorted(set(NEW) - set(OLD), key=lambda x: (x[0], x[1])):
    br = TABS[k[0]][0]
    d = NEW[k]
    f = raw_fields(d, k[0], br)
    rule = next((t for t in TEMPLATE_RULES if t[0](f['description'] or '', f['item'])), None)
    if not rule:
        sys.exit(f'no family rule for added line {k}: {f["description"]!r}')
    row = dict(SKELETON)
    row.update(f)
    row.update({'item_type_code': num_or_none(d.get('Item Type')), 'serial': txt(d.get('Serial Number')),
                'what': what_of(f['description']), 'register_type': rule[3], 'family': rule[1], 'kind': rule[2],
                'charge_line': rule[4], 'contract_start': iso(d.get('Start Date')) or f['booked_delivery_date'],
                'location': txt(d.get('Memo')), 'start_time': None, 'start_time_as_written': d['Start Time'].strftime('%H:%M') if isinstance(d.get('Start Time'), datetime.time) else None,
                'rate_type': txt(d.get('Rate Type')), 'rate_classification': txt(d.get('Rate Classification')), 'rate_id': txt(d.get('Rate ID')),
                'price': rate(d.get('Price')), 'sell_price': rate(d.get('Sell Price')), 'number_of_days': num_or_none(d.get('Number of Days')),
                'minimum_days': num_or_none(d.get('Minimum Days')), 'term_number': num_or_none(d.get('Term Number')),
                'billing_option': txt(d.get('Billing Option')), 'hold_billing': bool(d.get('Hold Billing')),
                'expected_offrental_time': d['Expected Offrental Time'].strftime('%H:%M') if isinstance(d.get('Expected Offrental Time'), datetime.time) else None,
                'main_item': bool(d.get('Main Item')), 'package_name': txt(d.get('Package Name')), 'swap_from_line': num_or_none(d.get('Swap From Line No')) or None,
                'billed_amount': rate(d.get('Billed Amount')), 'last_total_amount': rate(d.get('Last Total Amount')),
                'billed_units': d.get('Billed Units') or 0, 'total_inc_sd_dw_gst': rate(d.get('Tot(inc.SD,DW&GST)'))})
    j = join(row) if not row['charge_line'] else None
    row['match'] = j or {'state': 'unmatched', 'to': None, 'key': None, 'task_id': None, 'via': None,
                         'basis': ('no register line carries this number and no unreferenced row is this on the day; its kind puts the register\'s assets on this contract'
                                   if row['kind'] in KINDS_HELD else
                                   'no register line carries this number, no unreferenced row is this on the day, and it is not a kind the register holds')}
    rows_out.append(row)
    LOG['added'].append({'line': f'{k[0]}/{k[1]}', 'branch': br, 'item': row['item'], 'description': row['description'],
                         'status': row['status_as_written'], 'joined_to': row['match'].get('key') or row['match'].get('task_id')})

rows_out.sort(key=lambda r: (str(r['rental_contract']), int(r['line'])))
R['rows'] = rows_out
BYKEY = {(str(r['rental_contract']), int(r['line'])): r for r in rows_out}

# plant numbers on two contract lines at once, both live in the window - a possible double charge to settle
by_no = {}
for r in rows_out:
    if r['asset_no_is_plant_number'] and not r['charge_line']:
        by_no.setdefault(r['asset_no'], []).append(r)
for no, rs in sorted(by_no.items()):
    priced = [x for x in rs if isinstance(x.get('rate_1'), float)]
    if len(priced) > 1:
        LOG['flags'].append({'asset_no': no, 'lines': [f"{x['rental_contract']}/{x['line']} {x['status_as_written']} {x['booked_delivery_date']}..{x['demob_date']} {x['description']}" for x in rs],
                             'why': 'one number on two priced lines: two machines with one misnumbered, or one machine charged twice'})

# ------------------------------------------------------------------ 5. contracts, assignments, summary
CON_OLD = {str(c['rental_contract']): c for c in R['contracts']}
contracts = []
for con in sorted(TABS):
    br, tab = TABS[con]
    rs = [r for r in rows_out if str(r['rental_contract']) == con]
    c = dict(CON_OLD.get(con) or {'rental_contract': con, 'branch_code': br, 'tab': tab, 'assets': []})
    c.update({'branch_code': br, 'tab': tab, 'lines': len(rs),
              'plant_numbers': sorted({r['asset_no'] for r in rs if r['asset_no_is_plant_number']}),
              'locations': sorted({r['location'] for r in rs if r.get('location')}),
              'start_dates': sorted({r['contract_start'] for r in rs if r.get('contract_start')}),
              'delivered_dates': sorted({r['start_date'] for r in rs if r.get('delivered') and r.get('start_date')}),
              'demob_dates': sorted({r['demob_date'] for r in rs if r.get('demob_date')}),
              'delivery_numbers': sorted({r['delivery_number'] for r in rs if r.get('delivery_number')}),
              'matched': sum(1 for r in rs if r.get('match') and r['match'].get('to'))})
    c['assets'] = sorted(set(c.get('assets') or []) | {r['match']['key'] for r in rs if r.get('match') and r['match'].get('to') == 'asset' and r['match'].get('key')})
    contracts.append(c)
R['contracts'] = contracts

AS = R['assignments']
touched = {x['now'] for x in LOG['rejoined'] if x['now']} | {x['was'] for x in LOG['rejoined'] if x['was']} | {x['joined_to'] for x in LOG['added'] if x['joined_to']}
for key in sorted(k for k in touched if k in A):
    lines = [r for r in rows_out if r.get('match') and r['match'].get('to') == 'asset' and r['match'].get('key') == key]
    old = AS.get(key)
    if lines:
        first = lines[0]
        dl = next((r for r in lines if r.get('delivered')), None)
        AS[key] = {'branch_code': first['branch_code'], 'rental_contract': str(first['rental_contract']), 'via': first['match']['via'],
                   'basis': first['match']['basis'], 'lines': [f"{r['rental_contract']}/{r['line']}" for r in lines],
                   'all_contracts': sorted({str(r['rental_contract']) for r in lines}),
                   'delivered': {'date': dl['start_date'], 'delivery_number': dl['delivery_number']} if dl else None}
    elif old and old.get('via') in ('asset number', 'delivery docket'):
        # its numbered line went to another reference: it keeps its contract by what it is, as every such asset does
        AS[key] = {'branch_code': old['branch_code'], 'rental_contract': old['rental_contract'], 'via': 'kind of item',
                   'basis': f"its numbered line now joins another reference; the contract {old['rental_contract']} holds this kind of item", 'lines': [],
                   'all_contracts': [old['rental_contract']], 'delivered': None}

sm = R['summary']
states = [((r.get('match') or {}).get('state') or 'unmatched') for r in rows_out]
sm.update({'lines': len(rows_out), 'contracts': sorted(TABS), 'branches': sorted({b for b, _ in TABS.values()}),
           'plant_numbers': len({r['asset_no'] for r in rows_out if r['asset_no_is_plant_number']}),
           'miscellaneous_lines': sum(1 for r in rows_out if not r['asset_no_is_plant_number']),
           'same_asset_number': states.count('same asset number'), 'same_delivery_docket': states.count('same delivery docket'),
           'same_day_and_kind': states.count('same day and kind'), 'candidate': states.count('candidate'),
           'ambiguous': states.count('ambiguous'), 'unmatched': states.count('unmatched'),
           'assets_assigned': len(AS), 'delivered_lines': sum(1 for r in rows_out if r.get('delivered'))})
by = {}
for v in AS.values():
    by[v.get('via')] = by.get(v.get('via'), 0) + 1
sm['assigned_by'] = dict(sorted(by.items(), key=lambda x: str(x[0])))

R.update({'record_id': 'baseplan-contracts-' + EXPORT_DAY, 'supplied_on': EXPORT_DAY,
          'workbook': 'Baseplan_SuperCars_' + EXPORT_DAY + '.xlsx',
          'source': f'The {len(TABS)} hire contracts exported from Baseplan by the project manager on {EXPORT_DAY}, one tab per contract; the tab name is the contract number and the branch code.',
          })
R['supplements'] = list(R.get('supplements') or []) + [{
    'source': 'Baseplan_SuperCars.xlsx (export of ' + EXPORT_DAY + ')', 'sha256': BASEPLAN_SHA, 'supplied_on': EXPORT_DAY,
    'applied': 'v8.71', 'lines_added': [x['line'] for x in LOG['added']], 'lines_removed': [x['line'] for x in LOG['removed']],
    'lines_changed': len(LOG['changed']),
    'basis': 'Every line refreshed from the export field by field; joins kept where the number did not change, re-made by asset number then delivery docket where it did.'}]

# the plant lines carry their own copies of their contract lines
COPY_KEYS = list(D['plant_lines']['lines'][0]['rental'][0].keys())


def copy_of(r):
    out = {k: r.get(k) for k in COPY_KEYS if k in r}
    m_ = r.get('match') or {}
    out.update({'match_state': m_.get('state'), 'match_basis': m_.get('basis'), 'subhired_machine': r.get('subhired_machine'), 'subhire': r.get('subhire')})
    return {k: out.get(k) for k in COPY_KEYS}


for pl in D['plant_lines']['lines']:
    rental = pl.get('rental') or []
    if not rental:
        continue
    fresh, before = [], [(x['rental_contract'], x['line']) for x in rental]
    for x in rental:
        r = BYKEY.get((str(x['rental_contract']), int(x['line'])))
        if not r:
            continue
        keep = {k: x.get(k) for k in ('match_state', 'match_basis', 'subhired_machine', 'subhire')}
        y = copy_of(r)
        y.update({k: v for k, v in keep.items() if v is not None})
        fresh.append(y)
    nums = {str(n) for n in pl.get('asset_numbers') or []}
    dockets = set(re.findall(r'\d{8}', ' '.join(str(e.get('dd') or '') for e in pl.get('events') or [])))
    have = {(str(y['rental_contract']), int(y['line'])) for y in fresh}
    for r in rows_out:
        k = (str(r['rental_contract']), int(r['line']))
        if k in have or r['charge_line']:
            continue
        if (r['asset_no_is_plant_number'] and r['asset_no'] in nums and andrew_takes(r)) or (not r['asset_no_is_plant_number'] and r.get('delivery_number') and r['delivery_number'] in dockets):
            fresh.append(copy_of(r))
    fresh.sort(key=lambda y: (str(y['rental_contract']), int(y['line'])))
    after = [(y['rental_contract'], y['line']) for y in fresh]
    pl['rental'] = fresh
    starts = sorted(y['start_date'] for y in fresh if y.get('start_date'))
    offs = sorted(y['demob_date'] for y in fresh if y.get('demob_date'))
    if starts:
        pl['on_site_from'] = starts[0]
    if offs:
        pl['off_hire'] = offs[-1]
    if before != after or True:
        LOG['plant_line_copies'].append({'line': pl['key'], 'contract_lines_before': len(before), 'after': len(after),
                                         'added': [f'{a}/{b}' for a, b in after if (a, b) not in before],
                                         'gone': [f'{a}/{b}' for a, b in before if (a, b) not in after]})
LOG['plant_line_copies'] = [x for x in LOG['plant_line_copies'] if x['added'] or x['gone']]

# ------------------------------------------------------------------ write back
SOURCES = ('rental_on_hire', 'assets', 'plant_lines', 'unreferenced')
assert {k: v for k, v in D.items() if k not in SOURCES} == {k: v for k, v in ORIG.items() if k not in SOURCES}
out = text[:m.start(1)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + text[m.end(1):]
out = out.replace("· v8.70", "· v8.71", 1) if "· v8.70" in out else out
page.write_bytes((b'\xef\xbb\xbf' if bom else b'') + out.encode('utf-8'))
log = Path(os.environ.get('V871_LOG') or (HERE / 'evidence' / 'changes_v871.json'))
log.parent.mkdir(parents=True, exist_ok=True)
log.write_text(json.dumps(LOG, indent=1, ensure_ascii=False, default=str))
print(f"v8.71: contracts {len(TABS)}, lines {len(rows_out)} (+{len(LOG['added'])} -{len(LOG['removed'])}, {len(LOG['changed'])} changed, "
      f"{len(LOG['rejoined'])} rejoined); schedule {len(LOG['schedule'])} entries; flags {len(LOG['flags'])}")
