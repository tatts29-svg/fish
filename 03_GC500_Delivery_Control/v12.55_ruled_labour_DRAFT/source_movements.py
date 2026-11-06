"""Author: Andrew Fisher. Bounded public contract-source movements for v12.55.

No complete source import, physical reconciliation or billing calculation occurs
here. Only named source cells, eight source-only additions and one expressly
ruled zero-charge source removal change. The outer release patch must guard its
exact reviewed predecessor bytes.
"""
from __future__ import annotations

import copy


class SourceMovementError(ValueError):
    pass


SOURCE_BASE_SHA256 = '378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c'
PUBLIC_BASIS = 'Explicit ruled contract movements; public Baseplan9 comparison and PR1 handovers, 29 Oct 2026'

# Public source status/term facts only: these do not change the physical record,
# demob_date, delivery evidence, booked dates, source matching or source rates.
EXISTING_EDITS = {
    ('9961265', 3): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9961265', 5): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9961265', 8): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9961265', 9): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9961265', 43): {'status_as_written': ('Off Rent', 'Return Pending')},
    ('9972648', 3): {'term_date': ('2026-10-25', '2026-09-25'), 'expected_term_date': ('2026-10-25', '2026-09-25')},
    ('9992300', 5): {'status_as_written': ('Off Rent', 'Returned')},
    ('9994954', 12): {'rate_1': (None, 0), 'price': (None, 0)},
    ('9997710', 1): {'status_as_written': ('Pending', 'Returned'), 'term_date': (None, '2026-10-28')},
    ('9997710', 2): {'status_as_written': ('Pending', 'Delivered')},
}

BRANCHES = {'9961265': 'STPS', '9972648': 'STPS', '9992300': 'MEAD', '9994954': 'KINP', '9997710': 'STPS'}
REMOVED_KEY = ('9961976', 27)
REMOVED_SOURCE_FIELDS = {
    'rental_contract': '9961976', 'line': 27, 'branch_code': 'NVAC',
    'item': '1210921', 'asset_no': '1210921', 'asset_no_is_plant_number': True,
    'item_type_code': 1, 'quantity': 1, 'status_as_written': 'Pending',
    'kind': 'forklift', 'family': 'forklift', 'subhired': False, 'charge_line': False,
    'price': None, 'rate_1': None, 'rate_2': None, 'rate_3': None, 'rate_4': None,
    'rate_5': None, 'flat_monthly_charge': None, 'delivered': False, 'start_date': None,
}


def _fail(condition, message):
    if not condition:
        raise SourceMovementError(message)


def _key(row):
    _fail(isinstance(row, dict), 'Invalid source row')
    contract, line = row.get('rental_contract'), row.get('line')
    _fail(isinstance(contract, str) and type(line) is int and line > 0, 'Invalid contract-line identity')
    return contract, line


def _addition(contract, branch, line, item, description, quantity, price, rate,
              status, sales, start, term, item_type, family, register_type, charge_line):
    # Dates below are public contract-source dates. Every physical/site date and
    # association stays unset; null auxiliary source fields mean not imported.
    return {
        'rental_contract': contract, 'branch_code': branch, 'line': line,
        'item': item, 'asset_no': item, 'asset_no_is_plant_number': False,
        'description': description, 'what': description, 'quantity': quantity,
        'price': price, 'rate_1': rate, 'rate_2': None, 'rate_3': None,
        'rate_4': None, 'rate_5': None, 'flat_monthly_charge': None,
        'item_type_code': item_type, 'status_as_written': status,
        'sales_analysis_code': sales, 'contract_start': start, 'term_date': term,
        'booked_delivery_date': None, 'booked_pickup_date': None,
        'expected_term_date': None, 'start_date': None, 'demob_date': None,
        'delivered': None, 'delivery_number': None, 'return_number': None,
        'supplier_sub_rental': None, 'subhired': None, 'subhire_rule': None,
        'register_type': register_type, 'family': family, 'kind': family,
        'charge_line': charge_line,
        'match': {'state': 'unmatched', 'to': None, 'key': None, 'task_id': None,
                  'via': None, 'basis': 'Approved source contract line only; no site allocation inferred'},
        'sourceAddition1255': True, 'source_supplement': PUBLIC_BASIS,
    }


def additions():
    """Eight new source identities, never inferred physical or supplier records."""
    return [
        _addition('9994248', 'STPS', 1, None, 'Temporary Fence 1.8m (per Meter)', 35, 0, 17.5,
                  'Pending', 'STPS-HIR', '2026-10-20', None, 1, 'other', None, False),
        _addition('9994248', 'STPS', 2, None, 'Barrier - Crowd Control (per Meter)', 45, 0, 14,
                  'Pending', 'STPS-HIR', '2026-10-20', None, 1, 'other', None, False),
        _addition('9994248', 'STPS', 3, 'CHAIRSSTACKING', 'Chairs Stacking', 24, 0, 2.2,
                  'Del Req', 'STPS-HIR', '2026-10-20', None, 1, 'furniture', None, False),
        _addition('9994248', 'STPS', 4, 'DELIVERY', 'Delivery for Line Item(s) 3,4 19 Oct 2026', 1, 250, None,
                  'Quoted', 'STPS-FRI', '2026-10-20', None, 4, 'transport', None, True),
        _addition('9994248', 'STPS', 5, 'PICKUP CHARGE', 'Pickup', 1, 250, None,
                  'Quoted', 'STPS-FRI', '2026-10-20', None, 4, 'transport', None, True),
        _addition('9994954', 'KINP', 19, 'MISCITEM', 'Pee Panels', 6, 0, 672.17,
                  'Delivered', 'KINP-HIR', '2026-10-23', None, 1, 'toilet', 'Pee Panel', False),
        _addition('9994954', 'KINP', 20, 'LABOUR', 'Labour Charge Pee Panel', 6, 551.73, None,
                  'Delivered', 'KINP-INS', '2026-10-23', None, 2, 'toilet', None, False),
        _addition('9997710', 'STPS', 3, 'MISCITEMS', 'Crowd Control Barrier ( for straight boom)', 30, 0, 7.51,
                  'Returned', 'STPS-HIR', '2026-10-28', '2026-10-28', 1, 'other', None, False),
    ]


def _new_contract():
    return {'rental_contract': '9994248', 'branch_code': 'STPS', 'tab': '9994248-STPS',
            'assets': [], 'lines': 5, 'plant_numbers': [], 'locations': [],
            'start_dates': ['2026-10-20'], 'delivered_dates': [], 'demob_dates': [],
            'delivery_numbers': [], 'matched': 0}


def apply_data(data):
    """Return a deep copy and a complete bounded source/count change manifest."""
    _fail(isinstance(data, dict) and isinstance(data.get('rental_on_hire'), dict), 'Missing source data')
    on_hire = data['rental_on_hire']
    rows, contracts, summary = (on_hire.get(k) for k in ('rows', 'contracts', 'summary'))
    _fail(isinstance(rows, list) and isinstance(contracts, list) and isinstance(summary, dict), 'Missing source collections')
    keyed = {_key(row): row for row in rows}
    _fail(len(keyed) == len(rows), 'Duplicate source contract-line identity')
    _fail(not any(row.get('sourceAddition1255') for row in rows), 'v12.55 source movements already applied')
    _fail(('9992300', 12) not in keyed, 'Runtime-associated source identity must not be duplicated in DATA')
    for key, edits in EXISTING_EDITS.items():
        row = keyed.get(key)
        _fail(row is not None and row.get('branch_code') == BRANCHES[key[0]], 'Source identity or branch changed: ' + str(key))
        for field, (before, _after) in edits.items():
            _fail(field in row and row[field] == before, 'Source predecessor changed: ' + str(key) + ' ' + field)
    laser = keyed.get(('9987005', 8))
    _fail(laser is not None and (laser.get('branch_code'), laser.get('rate_1'), laser.get('price')) == ('MEAD', 0, 0),
          'Approved laser source zero from v12.54 must already exist')
    # PR1 ruling6481322589 removes this one zero-charge source identity. EQ0004
    # remains on the native site record and its own-use rule is not edited here.
    removed = keyed.get(REMOVED_KEY)
    _fail(removed is not None and all(field in removed and removed[field] == value for field, value in REMOVED_SOURCE_FIELDS.items()),
          'The expressly ruled source removal changed identity, quantity, state or source charges')
    _fail(type(removed['line']) is int and type(removed['item_type_code']) is int and type(removed['quantity']) is int,
          'The ruled source removal must retain its exact numeric identity and quantity')
    match = removed.get('match')
    _fail(isinstance(match, dict) and match.get('state') == 'unmatched' and all(match.get(k) is None for k in ('to', 'key', 'task_id', 'via')),
          'The ruled source removal acquired a physical association')
    _fail(sum(str(row.get('asset_no')) == '1210921' for row in rows) == 1, 'The source number has another contract line')
    extra = additions()
    _fail(all(_key(row) not in keyed for row in extra), 'Approved source addition already exists')
    contract_map = {c.get('rental_contract'): c for c in contracts if isinstance(c, dict)}
    _fail(len(contract_map) == len(contracts) and '9994248' not in contract_map, 'Unexpected source contract summary')
    for contract in ('9961976', '9994954', '9997710'):
        expected = sum(row['rental_contract'] == contract for row in rows)
        _fail(contract in contract_map and type(contract_map[contract].get('lines')) is int and contract_map[contract]['lines'] == expected,
              'Source contract count changed: ' + contract)
    source_numbers = contract_map['9961976'].get('plant_numbers')
    missing_numbers = summary.get('numbers_the_schedule_did_not_have')
    _fail(isinstance(source_numbers, list) and source_numbers.count('1210921') == 1 and isinstance(missing_numbers, list) and missing_numbers.count('1210921') == 1,
          'The ruled source number lists changed')
    unique_source_numbers = {row.get('asset_no') for row in rows if row.get('asset_no_is_plant_number')}
    _fail(type(summary.get('plant_numbers')) is int and summary['plant_numbers'] == len(unique_source_numbers), 'Source plant-number count changed')
    _fail(type(summary.get('lines')) is int and summary['lines'] == len(rows), 'Source total count changed')
    _fail(isinstance(summary.get('contracts'), list) and summary['contracts'] == sorted(contract_map), 'Source contract list changed')
    for field in ('miscellaneous_lines', 'unmatched'):
        _fail(type(summary.get(field)) is int and summary[field] >= 0, 'Invalid source classification count')

    changed = copy.deepcopy(data)
    revised = changed['rental_on_hire']
    after_by_key = {_key(row): row for row in revised['rows']}
    manifest = {'scope': 'Named public source movements only; no full import or billing projection',
                'source_base_sha256': SOURCE_BASE_SHA256, 'existing_fields': [], 'added': [], 'removed': [], 'metadata_fields': []}
    for key, edits in EXISTING_EDITS.items():
        for field, (before, after) in edits.items():
            after_by_key[key][field] = after
            manifest['existing_fields'].append({'contract': key[0], 'line': key[1], 'field': field, 'before': before, 'after': after})
    revised['rows'] = [row for row in revised['rows'] if _key(row) != REMOVED_KEY]
    revised['rows'].extend(extra)
    manifest['added'] = [{'contract': row['rental_contract'], 'line': row['line']} for row in extra]
    manifest['removed'] = [{'contract': REMOVED_KEY[0], 'line': REMOVED_KEY[1], 'row': copy.deepcopy(removed),
                            'basis': 'Explicit source-only removal in PR1 ruling6481322589; native own-use and site records retained'}]
    for c in revised['contracts']:
        amount = {'9961976': -1, '9994954': 2, '9997710': 1}.get(c['rental_contract'], 0)
        if amount:
            before = c['lines']; c['lines'] += amount
            manifest['metadata_fields'].append({'collection': 'contracts', 'contract': c['rental_contract'], 'field': 'lines', 'before': before, 'after': c['lines']})
        if c['rental_contract'] == '9961976':
            before = c['plant_numbers'][:]
            c['plant_numbers'] = [number for number in before if number != '1210921']
            manifest['metadata_fields'].append({'collection': 'contracts', 'contract': '9961976', 'field': 'plant_numbers', 'before': before, 'after': c['plant_numbers'][:]})
    new_contract = _new_contract()
    revised['contracts'].append(new_contract)
    manifest['metadata_fields'].append({'collection': 'contracts', 'added_contract': copy.deepcopy(new_contract)})
    for field in ('lines', 'miscellaneous_lines', 'unmatched'):
        delta = len(extra) - (0 if field == 'miscellaneous_lines' else 1)
        before = revised['summary'][field]; revised['summary'][field] += delta
        manifest['metadata_fields'].append({'collection': 'summary', 'field': field, 'before': before, 'after': before + delta})
    before = revised['summary']['plant_numbers']; revised['summary']['plant_numbers'] -= 1
    manifest['metadata_fields'].append({'collection': 'summary', 'field': 'plant_numbers', 'before': before, 'after': before - 1})
    before = revised['summary']['numbers_the_schedule_did_not_have'][:]
    revised['summary']['numbers_the_schedule_did_not_have'] = [number for number in before if number != '1210921']
    manifest['metadata_fields'].append({'collection': 'summary', 'field': 'numbers_the_schedule_did_not_have', 'before': before, 'after': revised['summary']['numbers_the_schedule_did_not_have'][:]})
    before = revised['summary']['contracts']
    revised['summary']['contracts'] = sorted(before + ['9994248'])
    manifest['metadata_fields'].append({'collection': 'summary', 'field': 'contracts', 'before': before, 'after': revised['summary']['contracts'][:]})
    return changed, manifest
