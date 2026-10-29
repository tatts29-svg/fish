"""Author: Andrew Fisher. Bounded contract-source movements for v12.55 (to the cent against Baseplan (10)).

Six source-only additions (the two Baseplan (10) lines the page did not carry: contract 9994248, five lines, and
9997710 line 3) and the Baseplan (10) status and term facts on five existing lines. No physical record, assignment,
delivery evidence, rate or supplier figure changes. The outer patch guards the exact live predecessor bytes.
"""
from __future__ import annotations

import copy


class SourceMovementError(ValueError):
    pass


PUBLIC_BASIS = 'Baseplan (10) line the page did not carry; Andrew Fisher, 29 Oct 2026 ("Fix your bits")'

# Baseplan (10) facts on existing lines: status and term only. Predecessor values are checked exactly.
EXISTING_EDITS = {
    ('9961265', 3): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9961265', 5): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9961265', 8): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9961265', 9): {'status_as_written': ('Delivered', 'Return Pending'), 'term_date': (None, '2026-10-28')},
    ('9997710', 1): {'status_as_written': ('Pending', 'Returned'), 'term_date': (None, '2026-10-28')},
}
BRANCHES = {'9961265': 'STPS', '9997710': 'STPS'}


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
    # Dates are the contract source's dates. Every physical date and association stays unset.
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
                  'via': None, 'basis': 'Baseplan (10) contract line only; no site allocation inferred'},
        'sourceAddition1255': True, 'source_supplement': PUBLIC_BASIS,
    }


def additions():
    """The six Baseplan (10) lines the page did not carry (STPS)."""
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
        _addition('9997710', 'STPS', 3, 'MISCITEMS', 'Crowd Control Barrier ( for straight boom)', 30, 0, 7.51,
                  'Returned', 'STPS-HIR', '2026-10-28', '2026-10-28', 1, 'other', None, False),
    ]


def _new_contract():
    return {'rental_contract': '9994248', 'branch_code': 'STPS', 'tab': '9994248-STPS',
            'assets': [], 'lines': 5, 'plant_numbers': [], 'locations': [],
            'start_dates': ['2026-10-20'], 'delivered_dates': [], 'demob_dates': [],
            'delivery_numbers': [], 'matched': 0}


def apply_data(data):
    """Return a deep copy of DATA with the movements applied, plus the manifest of every change."""
    _fail(isinstance(data, dict) and isinstance(data.get('rental_on_hire'), dict), 'Missing source data')
    on_hire = data['rental_on_hire']
    rows, contracts, summary = (on_hire.get(k) for k in ('rows', 'contracts', 'summary'))
    _fail(isinstance(rows, list) and isinstance(contracts, list) and isinstance(summary, dict), 'Missing source collections')
    keyed = {_key(row): row for row in rows}
    _fail(len(keyed) == len(rows), 'Duplicate source contract-line identity')
    _fail(not any(row.get('sourceAddition1255') for row in rows), 'v12.55 source movements already applied')
    for key, edits in EXISTING_EDITS.items():
        row = keyed.get(key)
        _fail(row is not None and row.get('branch_code') == BRANCHES[key[0]], 'Source identity or branch changed: ' + str(key))
        for field, (before, _after) in edits.items():
            _fail(field in row and row[field] == before, 'Source predecessor changed: ' + str(key) + ' ' + field)
    extra = additions()
    _fail(all(_key(row) not in keyed for row in extra), 'Baseplan (10) addition already exists')
    contract_map = {c.get('rental_contract'): c for c in contracts if isinstance(c, dict)}
    _fail(len(contract_map) == len(contracts) and '9994248' not in contract_map, 'Unexpected source contract summary')
    for contract in ('9997710',):
        expected = sum(row['rental_contract'] == contract for row in rows)
        _fail(contract in contract_map and type(contract_map[contract].get('lines')) is int and contract_map[contract]['lines'] == expected,
              'Source contract count changed: ' + contract)
    _fail(type(summary.get('lines')) is int and summary['lines'] == len(rows), 'Source total count changed')
    _fail(isinstance(summary.get('contracts'), list) and summary['contracts'] == sorted(contract_map), 'Source contract list changed')
    for field in ('miscellaneous_lines', 'unmatched'):
        _fail(type(summary.get(field)) is int and summary[field] >= 0, 'Invalid source classification count')

    changed = copy.deepcopy(data)
    revised = changed['rental_on_hire']
    after_by_key = {_key(row): row for row in revised['rows']}
    manifest = {'scope': 'Baseplan (10) lines the page did not carry, and Baseplan (10) status/term facts; no full import',
                'existing_fields': [], 'added': [], 'metadata_fields': []}
    for key, edits in EXISTING_EDITS.items():
        for field, (before, after) in edits.items():
            after_by_key[key][field] = after
            manifest['existing_fields'].append({'contract': key[0], 'line': key[1], 'field': field, 'before': before, 'after': after})
    revised['rows'].extend(extra)
    manifest['added'] = [{'contract': row['rental_contract'], 'line': row['line']} for row in extra]
    for c in revised['contracts']:
        if c['rental_contract'] == '9997710':
            before = c['lines']; c['lines'] += 1
            manifest['metadata_fields'].append({'collection': 'contracts', 'contract': '9997710', 'field': 'lines', 'before': before, 'after': c['lines']})
    new_contract = _new_contract()
    revised['contracts'].append(new_contract)
    manifest['metadata_fields'].append({'collection': 'contracts', 'added_contract': copy.deepcopy(new_contract)})
    for field in ('lines', 'miscellaneous_lines', 'unmatched'):
        before = revised['summary'][field]; revised['summary'][field] += len(extra)
        manifest['metadata_fields'].append({'collection': 'summary', 'field': field, 'before': before, 'after': before + len(extra)})
    before = revised['summary']['contracts']
    revised['summary']['contracts'] = sorted(before + ['9994248'])
    manifest['metadata_fields'].append({'collection': 'summary', 'field': 'contracts', 'before': before, 'after': revised['summary']['contracts'][:]})
    return changed, manifest
