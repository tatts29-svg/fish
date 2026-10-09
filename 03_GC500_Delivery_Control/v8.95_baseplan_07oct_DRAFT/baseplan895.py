# Author: Andrew Fisher. baseplan895 - the v8.71 contract builder as one re-runnable module.
#
# v8.71 (6 Oct 2026) turned a Baseplan export into the page's contract source, DATA.rental_on_hire, and everything the
# page derives from it: the contract lines, the per-contract summaries, the assignments that put a branch and a contract
# on every reference, the summary counts, and the copies of their contract lines the plant lines carry. This module is
# that logic, lifted out of patch_v871.py step for step so it can be run twice: once on the 6 Oct export to prove it
# reproduces the live page's DATA exactly, and once on the 7 Oct export to apply only what the new export changes.
#
# The rules are the source's own, as v8.71 states them: a delivered (or returned) line is on hire from its booked
# delivery date; demob is the booked pick-up date; a rate of 0 is no rate (unknown, never nought); an item code starting
# SUB is sub-hired; a line is joined to the register by Andrew's recorded number first, then by a number the register
# alone holds, then - for a line with no plant number - by its delivery docket; the reference at the head of a
# description and the Status column are never evidence; a line whose number did not change keeps its join; a number
# Baseplan writes on two lines follows only the delivered line (the two-line numbers rule).
#
# ANDREW'S MATCHES WIN. Andrew, 6 Oct 2026: "good chance baseplan and spreadsheet allocation of asset numbers are wrong.
# What I have matched up and completed is correct." His recorded numbers are read from three places: the numbers he
# typed on the shared record, the numbers recorded on site on the shared record, and the numbers recorded as supplied on
# the committed as-supplied record (DATA.ops, recorded by him). The shared record wins where the two disagree, as v8.71
# applied it. A Baseplan number he has recorded on a reference joins that reference and no other; one he has not
# recorded goes where the register puts it, or stays unjoined. The same rule re-makes the join of a numbered line his record
# carries on a reference the page does not yet join it to (rejoin_record): his record is the authority over Baseplan, so
# the line follows his number even when the export did not touch it; those joins are logged apart (record_joined).
import datetime, re
from pathlib import Path

PLANT = re.compile(r'^\d{5,8}$')
LEAD = re.compile(r'^(?:(?:[A-Z]{1,4}-?\s?\d{1,3}[A-Z]?(?:-\d{1,3})*(?:-S\d{1,3})?)|COATES|SUPPLY|EVENTS?|Supply|Event)\s*-?\s*')
PRODUCT = re.compile(r'\b(FWF|WCTV|Toilet|Portable|Lighting|Generator|Variable|Forklift|Telehandler|Container|Barrier|Refrigerator|Steps|Transport|Delivery|Cleaning|Desk|Chairs?|Microwave|Trakmat|Sewage|Sink|Urn|Scissor|Knuckle|Ticket|Pickup|Distribution|Commentary)\b')

# fields a refresh may carry from the export onto a line the page already has (v8.71's list, unchanged)
CARRY = ['item', 'asset_no', 'asset_no_is_plant_number', 'description', 'quantity', 'status_as_written',
         'booked_delivery_date', 'delivery_number', 'return_number', 'expected_term_date', 'term_date',
         'booked_pickup_date', 'delivered', 'start_date', 'demob_date', 'rate_1', 'rate_2', 'rate_3', 'rate_4',
         'rate_5', 'flat_monthly_charge', 'sales_analysis_code', 'supplier_sub_rental', 'subhired', 'subhire_rule']

UNMATCHED_HELD = "no register line carries this number and no unreferenced row is this on the day; its kind puts the register's assets on this contract"
UNMATCHED_OTHER = 'no register line carries this number, no unreferenced row is this on the day, and it is not a kind the register holds'


# ------------------------------------------------------------------ helpers (v8.71)
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


def what_of(desc):
    # the thing, without the reference or crew word the project manager writes in front of it
    d = desc or ''
    mm = PRODUCT.search(d)
    if mm and mm.start() > 0 and re.fullmatch(r'[A-Za-z0-9/ \-]*', d[:mm.start()]):
        return d[mm.start():].strip()
    w = LEAD.sub('', d, count=1).strip()
    return w or d


def kva_of(desc):
    mm = re.search(r'(\d+(?:\.\d+)?)\s*kva', desc or '', re.I)
    return (mm.group(1) + 'kva') if mm else None


# ------------------------------------------------------------------ the export, as read (v8.71 step 1)
def read_export(path):
    import openpyxl
    wb = openpyxl.load_workbook(Path(path), data_only=True, read_only=True)
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
    return NEW, TABS


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


# the family a line the export adds belongs to: (test on the description / item, family, kind, register_type, charge_line)
# v8.71's rules, plus the generator rule the 7 Oct export needs (its register type is the kVA size, as every generator
# line on the page carries it: '60kva', '150kva', '365kva')
TEMPLATE_RULES = [
    (lambda d, i: i and i.upper().startswith('CLEAN'), 'accessory', 'accessory', None, False),
    (lambda d, i: 'transport charge' in d.lower(), 'transport', 'transport', None, True),
    (lambda d, i: 'variable message' in d.lower(), 'vms', 'vms', 'VMS', False),
    (lambda d, i: 'fork extension' in d.lower(), 'forklift accessory', 'forklift accessory', None, False),
    (lambda d, i: 'forklift' in d.lower(), 'forklift', 'forklift', None, False),
    (lambda d, i: 'refrigerator' in d.lower(), 'furniture', 'furniture', 'Fridge Lge', False),
    (lambda d, i: 'building shell 6.0m' in d.lower(), 'building', 'building', 'Building 6m', False),
    (lambda d, i: 'steps toilet block' in d.lower(), 'accessory', 'accessory', None, False),
    (lambda d, i: 'fresh water flush' in d.lower(), 'toilet', 'toilet', 'FWF', False),
    (lambda d, i: 'generator' in d.lower(), 'generator', 'generator', kva_of, False),
]


def andrew_numbers(D, record_matches):
    """Andrew's recorded numbers -> reference: the shared record (typed, and recorded on site) first, then the committed
    as-supplied record (DATA.ops rows recorded by him) where the shared record has no owner for the number."""
    of, source = {}, {}
    for k, ns in (record_matches or {}).items():
        for n in ns:
            of[str(n)] = k
            source[str(n)] = 'the shared record'
    for r in (D.get('ops') or {}).get('rows') or []:
        if not r.get('recorded_by'):
            continue
        for n in r.get('asset_numbers_supplied') or []:
            n = str(n)
            if n not in of:
                of[n] = r['key']
                source[n] = 'the as-supplied record' + (', ' + r['recorded_on'] if r.get('recorded_on') else '')
    return of, source


def validate_matches(D, matches):
    A = {a['key'] for a in D['assets']}
    known = A | {p['key'] for p in D['plant_lines']['lines']} | {p['task_id'] for p in D.get('unreferenced') or []}
    assert isinstance(matches, dict), 'recorded matches must be a reference map'
    assert all(k in known and isinstance(ns, list) and all(isinstance(n, str) and PLANT.fullmatch(n) for n in ns) for k, ns in matches.items()), 'invalid recorded matches'
    numbers = [n for ns in matches.values() for n in ns]
    assert len(numbers) == len(set(numbers)), 'one recorded number has multiple owners'


def apply(D, NEW, TABS, record_matches, rejoin_record=True):
    """Refresh D['rental_on_hire'] (and the plant lines' copies of their contract lines) from an export, with v8.71's
    rules. Returns the change log. D is changed in place; nothing outside rental_on_hire and plant_lines is touched."""
    R = D['rental_on_hire']
    LOG = {'added': [], 'removed': [], 'changed': [], 'rejoined': [], 'record_joined': [], 'held': [], 'plant_line_copies': [], 'flags': [],
           'record_would_move': []}
    OLDROWS = R['rows']
    OLD = {(str(r['rental_contract']), int(r['line'])): r for r in OLDROWS}
    ASSETS = D['assets']
    A = {a['key']: a for a in ASSETS}
    validate_matches(D, record_matches or {})
    ANDREW_OF, ANDREW_SRC = andrew_numbers(D, record_matches)

    # every register number -> its reference (the join the contracts use)
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
        # a docket only joins a line that carries no plant number: a numbered line goes where its number is recorded
        dk = set() if row.get('asset_no_is_plant_number') else DOCKET_OWNER.get(str(row.get('delivery_number') or ''), set())
        if len(dk) == 1:
            to, key = next(iter(dk))
            return {'state': 'same delivery docket', 'to': to, 'key': key if to == 'asset' else None,
                    'task_id': key if to != 'asset' else None, 'via': 'delivery docket',
                    'basis': f"delivery docket {row['delivery_number']} is on {key} in the register and on line {row['line']} of contract {row['rental_contract']}"}
        return None

    # ------------------------------------------------------------------ refresh the lines the export still has (v8.71 step 3)
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
            was_what = r.get('what')
            r['what'] = what_of(r['description'])
            if r['what'] != was_what:
                diffs['what'] = [was_what, r['what']]
        old_m = r.get('match') or {}
        # ANDREW'S RECORD RE-MAKES A JOIN TOO (v8.71's own step, kept on): a numbered line whose number he has recorded on
        # a reference joins that reference even when the export did not touch the line. With rejoin_record off, what it
        # would move is listed instead (record_would_move) and nothing moves.
        record_says = r.get('asset_no_is_plant_number') and str(r.get('asset_no')) in ANDREW_OF
        trigger_export = 'asset_no' in diffs or 'delivery_number' in diffs
        trigger_record = bool(rejoin_record and record_says)
        if trigger_export or trigger_record:
            j = join(r)
            if j and (j.get('key'), j.get('task_id')) != (old_m.get('key'), old_m.get('task_id')):
                r['match'] = j
                entry = {'line': f'{k[0]}/{k[1]}', 'was': old_m.get('key') or old_m.get('task_id'), 'now': j.get('key') or j.get('task_id'), 'via': j['via'],
                         'source': ANDREW_SRC.get(str(r.get('asset_no'))) if j['via'] == 'asset number' and str(r.get('asset_no')) in ANDREW_OF else 'the register'}
                if trigger_export:
                    LOG['rejoined'].append(entry)
                else:
                    entry.update({'asset_no': r['asset_no'], 'status': r.get('status_as_written'), 'description': r.get('description'),
                                  'why': "Andrew's record carries this number on " + str(entry['now']) + ' (6 Oct 2026: "What I have matched up and completed is correct"); the export did not touch the line'})
                    LOG['record_joined'].append(entry)
            elif not j and 'asset_no' in diffs and old_m.get('via') == 'asset number':
                r['match'] = {'state': 'unmatched', 'to': None, 'key': None, 'task_id': None, 'via': None, 'basis': UNMATCHED_HELD}
                LOG['rejoined'].append({'line': f'{k[0]}/{k[1]}', 'was': old_m.get('key') or old_m.get('task_id'), 'now': None, 'via': None})
            elif not j and 'asset_no' in diffs and r.get('asset_no_is_plant_number'):
                LOG['held'].append({'line': f'{k[0]}/{k[1]}', 'asset_no': r['asset_no'], 'serial_in_export': txt(NEW[k].get('Serial Number')), 'description': r.get('description'), 'status': r.get('status_as_written'),
                                    'why': 'no reference carries this number - not on the shared record, not on the as-supplied record, not in the register; the line keeps its join by kind',
                                    'join': old_m.get('key') or old_m.get('task_id')})
        elif record_says and not rejoin_record and (old_m.get('key') or old_m.get('task_id')) != ANDREW_OF[str(r['asset_no'])] and andrew_takes(r):
            LOG['record_would_move'].append({'line': f'{k[0]}/{k[1]}', 'asset_no': r['asset_no'], 'status': r.get('status_as_written'), 'description': r.get('description'),
                                             'page_join': old_m.get('key') or old_m.get('task_id'), 'record': ANDREW_OF[str(r['asset_no'])], 'source': ANDREW_SRC[str(r['asset_no'])]})
        if diffs:
            LOG['changed'].append({'line': f'{k[0]}/{k[1]}', 'fields': sorted(diffs), 'status': [diffs['status_as_written'][0], diffs['status_as_written'][1]] if 'status_as_written' in diffs else None})
        rows_out.append(r)

    # ------------------------------------------------------------------ the lines the export adds (v8.71 step 4)
    SKELETON = {k: None for k in OLDROWS[0].keys()}
    for k in sorted(set(NEW) - set(OLD), key=lambda x: (x[0], x[1])):
        br = TABS[k[0]][0]
        d = NEW[k]
        f = raw_fields(d, k[0], br)
        rule = next((t for t in TEMPLATE_RULES if t[0](f['description'] or '', f['item'])), None)
        if not rule:
            raise SystemExit(f'no family rule for added line {k}: {f["description"]!r}')
        reg = rule[3](f['description']) if callable(rule[3]) else rule[3]
        row = dict(SKELETON)
        row.update(f)
        row.update({'item_type_code': num_or_none(d.get('Item Type')), 'serial': txt(d.get('Serial Number')),
                    'what': what_of(f['description']), 'register_type': reg, 'family': rule[1], 'kind': rule[2],
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
                             'basis': UNMATCHED_HELD if row['kind'] in KINDS_HELD else UNMATCHED_OTHER}
        rows_out.append(row)
        LOG['added'].append({'line': f'{k[0]}/{k[1]}', 'branch': br, 'item': row['item'], 'description': row['description'], 'what': row['what'],
                             'kind': row['kind'], 'register_type': row['register_type'],
                             'status': row['status_as_written'], 'booked_delivery_date': row['booked_delivery_date'], 'demob_date': row['demob_date'],
                             'has_rate': isinstance(row['rate_1'], float), 'joined_to': row['match'].get('key') or row['match'].get('task_id'), 'via': row['match'].get('via')})

    rows_out.sort(key=lambda r: (str(r['rental_contract']), int(r['line'])))
    R['rows'] = rows_out
    BYKEY = {(str(r['rental_contract']), int(r['line'])): r for r in rows_out}

    # plant numbers on two contract lines at once, both priced - a possible double charge to settle
    by_no = {}
    for r in rows_out:
        if r['asset_no_is_plant_number'] and not r['charge_line']:
            by_no.setdefault(r['asset_no'], []).append(r)
    for no, rs in sorted(by_no.items()):
        priced = [x for x in rs if isinstance(x.get('rate_1'), float)]
        if len(priced) > 1:
            LOG['flags'].append({'asset_no': no, 'lines': [f"{x['rental_contract']}/{x['line']} {x['status_as_written']} {x['booked_delivery_date']}..{x['demob_date']} {x['description']}" for x in rs],
                                 'why': 'one number on two priced lines: two machines with one misnumbered, or one machine charged twice'})

    # ------------------------------------------------------------------ contracts, assignments, summary (v8.71 step 5)
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
    moved = LOG['rejoined'] + LOG['record_joined']
    touched = {x['now'] for x in moved if x['now']} | {x['was'] for x in moved if x['was']} | {x['joined_to'] for x in LOG['added'] if x['joined_to']}
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

    # ------------------------------------------------------------------ the plant lines carry their own copies of their contract lines
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
        if before != after:
            LOG['plant_line_copies'].append({'line': pl['key'], 'contract_lines_before': len(before), 'after': len(after),
                                             'added': [f'{a}/{b}' for a, b in after if (a, b) not in before],
                                             'gone': [f'{a}/{b}' for a, b in before if (a, b) not in after]})
    return LOG
