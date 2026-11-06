"""Author: Andrew Fisher. Restore seven reviewed FWF hire source lines."""
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from fix_advisory1225 import apply as fix_advisory


BASE = '0dbb968dd75f92d159f41e2d29849a1d9c283ba950d3f572a31db4e32c14f340'
INPUT_SHA = '8e846b67148b900b154e804983e6b8f75f70fac86174b67c17fddb2789e03ea0'
SOURCE = 'review_25Oct2026_baseplan7/GC500_Baseplan7_vs_Site_25Oct2026.xlsx'
SOURCE_SHA = '8184c8f704d6efc9419411d211a191724c306e8ed22d4db3598dfc83206d2b5c'
BASIS = 'Financial hire source only; native quantity, ownership and work records are unchanged.'

# Only fields already shared in Every line are transcribed. Missing export fields
# stay unknown. Neither its status nor its source start overwrites a site receipt.
# line, item, description, quantity, Rate 1, Price, source row, reference
ADDITIONS = (
    (151, 'MISCITEM', 'PG01 FWF Toilet', 1, 90.07, 0, 125, 'PG01'),
    (152, 'MISCITEM', 'PG03 FWF Toilet', 1, 90.07, 0, 126, 'PG03'),
    (153, 'MISCITEM', 'PG05 FWF Toilet', 1, 90.07, 0, 127, 'PG05'),
    (155, 'MISCITEM', 'WC42 FWF Toilet', 1, 90.07, 0, 129, 'WC42'),
    (156, 'MISCITEM', 'WC53 FWF Toilet', 3, 90.07, 0, 130, 'WC53'),
    (157, 'MISCITEM', 'WC81 FWF Toilet', 1, 90.07, 0, 131, 'WC81'),
    (158, '1211963', 'WC12 Toilet Portable - Fresh Water Flush', 1, 90.07, 0, 132, 'WC12'),
)


def source_row(values):
    line, item, description, quantity, rate, price, sheet_row, ref = values
    row = dict.fromkeys(('item_type_code', 'serial', 'booked_delivery_date', 'delivery_number',
        'return_number', 'expected_term_date', 'term_date', 'booked_pickup_date', 'location',
        'start_date', 'start_time', 'demob_date', 'rate_2', 'rate_3', 'rate_4', 'rate_5',
        'flat_monthly_charge', 'rate_type', 'rate_classification', 'rate_id', 'sell_price',
        'number_of_days', 'minimum_days', 'term_number', 'billing_option', 'start_time_as_written',
        'expected_offrental_time', 'package_name', 'swap_from_line', 'billed_amount',
        'last_total_amount', 'billed_units', 'total_inc_sd_dw_gst', 'supplier_sub_rental'))
    row.update(rental_contract='9968955', branch_code='KINP', line=line, item=item,
        asset_no=item, asset_no_is_plant_number=item != 'MISCITEM', description=description,
        what=description[len(ref) + 1:], register_type='FWF', family='toilet', kind='toilet',
        quantity=quantity, rate_1=rate, price=price, status_as_written='Delivered',
        contract_start='2026-10-22', delivered=False, hold_billing=False, main_item=False,
        sales_analysis_code='KINP-HIR', subhired=False, subhire_rule=None, charge_line=False,
        match={'state': 'explicit source reference', 'to': 'asset', 'key': ref,
            'task_id': None, 'via': 'reference and item',
            'basis': 'Shared source explicitly names ' + ref + ' FWF; current site identity and receipt remain authoritative.'},
        sourceAddition1225={'source': SOURCE, 'sha256': SOURCE_SHA, 'sheet': 'Every line',
            'row': sheet_row, 'ref': ref, 'basis': BASIS})
    return row


def add_source_rows(data):
    source = data['rental_on_hire']
    digest = hashlib.sha256(json.dumps(source, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()
    if digest != INPUT_SHA:
        raise SystemExit('v12.25 requires the exact reviewed contract source')
    keys = [(str(r['rental_contract']), int(r['line'])) for r in source['rows']]
    if len(keys) != len(set(keys)) or any(('9968955', row[0]) in keys for row in ADDITIONS):
        raise SystemExit('v12.25 refuses an existing or duplicate contract line')
    matches = [c for c in source['contracts'] if str(c['rental_contract']) == '9968955']
    if len(matches) != 1 or matches[0]['branch_code'] != 'KINP':
        raise SystemExit('v12.25 requires the existing KINP contract metadata')
    rows = [source_row(values) for values in ADDITIONS]
    metadata = matches[0]
    source['rows'].extend(rows)
    metadata['lines'] += len(rows)
    metadata['matched'] += len(rows)
    metadata['assets'] = sorted(set(metadata['assets']) | {r['match']['key'] for r in rows})
    metadata['plant_numbers'] = sorted(set(metadata['plant_numbers']) | {r['asset_no'] for r in rows if r['asset_no_is_plant_number']})
    metadata['start_dates'] = sorted(set(metadata['start_dates']) | {r['contract_start'] for r in rows})
    summary = source['summary']
    summary['lines'] += len(rows)
    summary['miscellaneous_lines'] += sum(not r['asset_no_is_plant_number'] for r in rows)
    existing_numbers = {r['asset_no'] for r in source['rows'][:-len(rows)] if r['asset_no_is_plant_number']}
    summary['plant_numbers'] += len({r['asset_no'] for r in rows if r['asset_no_is_plant_number']} - existing_numbers)
    source['source_additions1225'] = {'source': SOURCE, 'sha256': SOURCE_SHA,
        'sheet': 'Every line', 'rows': [v[6] for v in ADDITIONS], 'basis': BASIS}


def apply(text):
    if '"source_additions1225"' in text:
        raise SystemExit('v12.25 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE:
        raise SystemExit('v12.25 requires the exact verified v12.24 base')
    start = text.index('const DATA = ') + len('const DATA = ')
    data, length = json.JSONDecoder().raw_decode(text[start:])
    previous = text[start:start + length]
    add_source_rows(data)
    text = rep(text, 'const DATA = ' + previous,
        'const DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')),
        'Restore shared FWF hire source rows', str(HERE), True)
    text = fix_advisory(text)
    return rep(text, "+' · v12.24'; /* v8.19 release922:", "+' · v12.25'; /* v8.19 release922:",
        'Release footer', str(HERE), True)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text()))
