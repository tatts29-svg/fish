"""Build the private, fee-free source for the scoped MMG QR reports."""
import datetime as dt
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

import openpyxl


def text(value):
    return str(value).strip() if value is not None else ''


def units(value):
    try:
        n = float(value)
    except (TypeError, ValueError):
        return 0
    return n if math.isfinite(n) and n > 0 else 0


def rental_transactions(path, *, required=()):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True, keep_links=False)
    try:
        found = False
        for name in ('TRANSACTION_CHARGES', 'TRANSACTION_WITHOUT_CHARGES', 'CUSTOMER_CONTRACTOR_EQUIP'):
            if name in wb.sheetnames:
                found = True
                sh = wb[name]
                sh.reset_dimensions()
                rows = sh.values
                header = [text(c).upper() for c in next(rows, ())]
                if required and not set(required).issubset(header):
                    raise ValueError('The Transactions export is missing rental movement columns.')
                for row in rows:
                    yield dict(zip(header, row))
        if required and not found:
            raise ValueError('No rental movement sheet was found in the Transactions export.')
    finally:
        wb.close()


def reconcile(facts, prior, conflicts):
    """Each snapshot replaces matching observations and keeps evidence from earlier export windows."""
    ranges = []
    if facts['period_start'] and facts['period_end']:
        ranges.append({'start': facts['period_start'], 'end': facts['period_end']})
    if prior and prior.get('project') == facts.get('project') and prior.get('schedule') == facts['schedule'] and prior.get('schema') == facts['schema']:
        if facts['transactions_asat'] >= prior.get('transactions_asat', ''):
            # Current source is authoritative for its transaction keys (and for
            # dates wholly re-exported); conflicting observations are withheld.
            current = {r['event_key'] for r in facts['movements']} | conflicts
            for r in prior.get('movements', []):
                if r.get('event_key') and r['event_key'] not in current:
                    # A fully re-exported interval replaces the previous pull's
                    # records for that interval. Keep an old hire outside it.
                    starts = r['start'] + 'T' + (r['start_time'] or '00:00:00')
                    ends = r['end'] + 'T' + (r['end_time'] or '23:59:59') if r['end'] else ''
                    if not (ranges and ranges[0]['start'] <= starts <= ranges[0]['end']
                            and (not ends or ends <= ranges[0]['end'])):
                        facts['movements'].append(r)
            ranges.extend(prior.get('transaction_periods', []))
        if facts['sales_asat'] and facts['sales_asat'] >= prior.get('sales_asat', ''):
            # SALES_STOCK has no transaction IDs or declared lower window bound.
            # Replace each represented calendar day as a whole, preserving duplicate
            # legitimate sales inside that day's export. Unknown-date rows are current only.
            days = {r['date'] for r in facts['draws'] if r['date']}
            facts['draws'].extend(r for r in prior.get('draws', []) if r['date'] and r['date'] not in days)
    merged = []
    for period in sorted(ranges, key=lambda r: r['start']):
        if not merged or dt.datetime.fromisoformat(period['start']) > dt.datetime.fromisoformat(merged[-1]['end']) + dt.timedelta(seconds=1):
            merged.append(dict(period))
        else:
            merged[-1]['end'] = max(merged[-1]['end'], period['end'])
    facts['transaction_periods'] = merged
    if merged:
        facts['period_start'], facts['period_end'] = merged[0]['start'], merged[-1]['end']


def event_key(transaction, item):
    return hashlib.sha256(json.dumps([transaction, item], separators=(',', ':')).encode()).hexdigest()


def write(path, kit, rental, sales, transactions, ref, sales_ref, tx_ref, parse_date, parse_time, tool_names, cons_name, prior_path, approved_name, owner_name, *, return_instruction=None, movement_archive=None):
    schedule = ref.get('schedule')
    if not schedule or sales_ref.get('schedule') != schedule or transactions and tx_ref.get('schedule') != schedule:
        raise ValueError('QR report exports must all identify the same project schedule.')

    def dates(value, clock):
        date, time = parse_date(value), parse_time(clock)
        precision = 'minutes' if text(clock).count(':') == 1 else 'seconds'
        return (date.isoformat() if date else '', time.isoformat(timespec=precision) if time else '')

    def subject(row, employer, name):
        company = text(row.get(employer))
        return dict(employer=company, company=kit.co_name(company), hirer=text(row.get(name)),
                    hirer_id=text(row.get('HIRER_ID')))

    def source_stamp(reference):
        return reference['requested'].isoformat(timespec='minutes') if reference.get('requested') else ''

    hires = {}
    disputed = set()
    asset_owners = defaultdict(set)
    for row in rental:
        who = subject(row, 'COMPANY_NAME', 'HIRER_NAME')
        item = text(row.get('ITEM_NUMBER'))
        raw_name = ' '.join(text(row.get('ITEM_DESCRIPTION')).split())
        if item and raw_name:
            asset_owners[item, raw_name.upper()].add(owner_name(row.get('OWNER')))
        if text(row.get('ITEM_STATUS')).casefold() != 'on hire' or not item or not who['employer']:
            continue
        date, time = dates(row.get('ON_HIRE_DATE'), row.get('ON_HIRE_TIME'))
        fact = dict(who, item=item, name=tool_names.get(raw_name.upper(), raw_name) or 'Unnamed equipment', date=date, time=time[:5])
        if item in hires and hires[item] != fact:
            disputed.add(item)
        hires[item] = fact
    draws = []
    for row in sales:
        who = subject(row, 'COMPANY_NAME', 'HIRER')
        issued, returned = units(row.get('SALES_QUANTITY')), units(row.get('RETURN_QUANTITY'))
        if not who['employer'] or not who['hirer'] or not (issued or returned):
            continue
        date, time = dates(row.get('SALES_DATE'), row.get('SALES_TIME'))
        return_date, return_time = dates(row.get('RETURN_DATE'), row.get('RETURN_TIME'))
        draws.append(dict(who, name=cons_name(row.get('SKU_DESCRIPTION')) or 'Unnamed consumable', date=date,
                          time=time, quantity=issued, returned=returned, return_date=return_date, return_time=return_time))
    moves = {}
    transaction_owners = defaultdict(set)
    conflicts = set()
    if transactions:
        for row in rental_transactions(transactions):
            if text(row.get('PRODUCT_CATEGORY')).casefold() != 'rental':
                continue
            tx_id, item = text(row.get('TRANSACTION_ID')), text(row.get('SKU/ITEM_NUMBER'))
            who = subject(row, 'EMPLOYER_NAME', 'HIRER_NAME')
            if not tx_id or not item or not who['employer'] or not who['hirer']:
                continue
            start, start_time = dates(row.get('TRAN_START_DATE'), row.get('TRAN_START_TIME'))
            end, end_time = dates(row.get('TRAN_END_DATE'), row.get('TRAN_END_TIME'))
            due, _ = dates(row.get('EXPECTED_RETURN_DATE') or row.get('DUE_DATE'), None)
            raw_name = ' '.join(text(row.get('SKU/ITEM DESCRIPTION')).split())
            fact = dict(who, item=item, name=tool_names.get(raw_name.upper(), raw_name) or 'Unnamed equipment',
                        start=start, start_time=start_time, end=end, end_time=end_time, due=due)
            key = event_key(tx_id, item)
            fact['event_key'] = key
            if row.get('ITEM_OWNER'):
                kit._fold_owner(row)
                transaction_owners[key].add(owner_name(row['ITEM_OWNER']))
            if key in moves and moves[key] != fact:
                # Conflicting snapshots cannot support a private identity or return score.
                conflicts.add(key)
            moves[key] = fact
    period = [d.isoformat(timespec='seconds') for d in tx_ref.get('period', ())]
    facts = dict(schema=1, project="MMG Dugald River Mine", schedule=schedule, asat=source_stamp(ref), sales_asat=source_stamp(sales_ref),
                 transactions_asat=source_stamp(tx_ref), period_start=period[0] if period else '',
                 period_end=period[-1] if period else '', hires=[r for k,r in hires.items() if k not in disputed],
                 movements=[r for k,r in moves.items() if k not in conflicts], draws=draws)
    if return_instruction:
        facts["return_instruction"] = return_instruction
    if movement_archive:
        facts["shift_movement_archive"] = movement_archive
    prior = json.loads(Path(prior_path).read_text(encoding='utf-8')) if prior_path else None
    reconcile(facts, prior, conflicts)
    apply_asset_labels(facts, asset_owners, transaction_owners, approved_name)
    workers = {(r['hirer'], r['employer'], r['hirer_id'])
               for rows in (facts['hires'], facts['movements'], facts['draws']) for r in rows if r['hirer']}
    facts['workers'] = [dict(hirer=n, employer=c, hirer_id=i) for n, c, i in sorted(workers)]
    Path(path).write_text(json.dumps(facts, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def apply_asset_labels(facts, asset_owners, transaction_owners, approved_name):
    """Resolve ownership using the exact asset/description or the historical record itself."""
    for row in facts['hires'] + facts['movements']:
        # Older private snapshots stored the SiteIQ display name only. For a
        # retained event, resolve a checked label on that exact source text.
        source = row.get('source_name') or row['name']
        row['source_name'] = source
        if 'source_owner' in row:
            owner = row['source_owner']
        else:
            owners = transaction_owners.get(row.get('event_key')) or asset_owners.get((row['item'], source.upper()), set())
            owner = next(iter(owners)) if len(owners) == 1 else ''
            row['source_owner'] = owner
        row['name'] = approved_name(source, owner)
