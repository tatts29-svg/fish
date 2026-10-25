"""Author: Andrew Fisher. Independent source, preservation and refusal checks.

Run with BASE=<verified v12.24 HTML> PAGE=<v12.25 candidate HTML> python3 this_file.
Set ADVISORY=1 when checking the final build with contract-work scope advisories.
Fixtures below were read independently from the already-shared comparison workbook;
they do not import the production row list or constructor.
"""
import hashlib
import importlib.util
import json
import os
import sys
import xml.etree.ElementTree as ET
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile


HERE = Path(__file__).resolve().parent.parent
ROOT = HERE.parent
BASE_SHA = '0dbb968dd75f92d159f41e2d29849a1d9c283ba950d3f572a31db4e32c14f340'
SOURCE = 'review_25Oct2026_baseplan7/GC500_Baseplan7_vs_Site_25Oct2026.xlsx'
SOURCE_SHA = '8184c8f704d6efc9419411d211a191724c306e8ed22d4db3598dfc83206d2b5c'
SOURCE_SHEET = 'Every line'
BASIS = 'Financial hire source only; native quantity, ownership and work records are unchanged.'

# Excel row, contract line, source item, description, quantity, site reference,
# site arrival and the comparison's original check text. Source item 1211963 is
# numeric in Excel; importing it as an identifier string is checked separately.
FIXTURES = (
    (125, 151, 'MISCITEM', 'PG01 FWF Toilet', 1, 'PG01', '2026-10-16',
     'starts Thu 22 Oct, turned up Fri 16 Oct (+6 days)'),
    (126, 152, 'MISCITEM', 'PG03 FWF Toilet', 1, 'PG03', '2026-10-16',
     'starts Thu 22 Oct, turned up Fri 16 Oct (+6 days)'),
    (127, 153, 'MISCITEM', 'PG05 FWF Toilet', 1, 'PG05', '2026-10-16',
     'starts Thu 22 Oct, turned up Fri 16 Oct (+6 days)'),
    (129, 155, 'MISCITEM', 'WC42 FWF Toilet', 1, 'WC42', '2026-09-28',
     'starts Thu 22 Oct, turned up Mon 28 Sep (+24 days)'),
    (130, 156, 'MISCITEM', 'WC53 FWF Toilet', 3, 'WC53', '2026-10-14',
     'starts Thu 22 Oct, turned up Wed 14 Oct (+8 days)'),
    (131, 157, 'MISCITEM', 'WC81 FWF Toilet', 1, 'WC81', '2026-09-14',
     'starts Thu 22 Oct, turned up Mon 14 Sep (+38 days)'),
    (132, 158, 1211963, 'WC12 Toilet Portable - Fresh Water Flush', 1, 'WC12',
     '2026-09-14', 'starts Thu 22 Oct, turned up Mon 14 Sep (+38 days)'),
)
HEADERS = ('Contract', 'Line', 'Status', 'Item', 'Description', 'Qty', 'Rate 1',
           'Price', 'Sales code', 'P&L branch', 'Start', 'Term',
           'Reference on site', 'Turned up', 'Checks')
# Independently reviewed, frozen shell scope. These hashes constrain the exact
# old and new fragments; helper.apply() is deliberately not the shell oracle.
ADVISORY_TRANSFORMS = (
    ('Classify existing combined contract work', '1cfa22ba928e8bb9633686741881a9a23e7c43073aa34abcad800c5fa97f6220', '74d08ab19c03469cae2b93f01df58214d66ad4bf6f25221cf8a1b682cdc0a4b5'),
    ('Keep card-priced work precedence', 'd8dca9686037d33de459ae34df21af8804063eaf5a8a435551c147d601b8784b', '9bbcc52371557c3461a894a3aff0396760ab4d84b73acb78f04a15fa69c12e8a'),
    ('Read current source charge coverage for barrier work', '80b7dbf240b7668e0fb27c6c54f58102b14cb0b527294e9ea6375a7f5dc750fc', 'f1761f70b005febd2841eb81eba1ad0ba5a3a0c0d51c63db13571a9d99c108db'),
    ('Keep only unpriced work in missing charges', 'bf3a2c4e36b85ce9c760728e8dcfbe03d551c4b48f5c4b43f901dc5382594fbb', '46ede1c0a7d2c94cd5211fb71c1f802929027de13d28debd71dd50aef4e7eab7'),
    ('Retain contract allocation and physical-work advisories', '1d9c8c39ee1d71039246927eb31cb1c51743309d6d43e11338e1da5bd76a2719', 'c8d45938ac7ebf1b418b8ebc02ead698d0a468fb2d58e87f3c57fe10c555c9ab'),
    ('Use the shared work classification in the drawer', 'b9dff0dfdeee9602a5350412daf1421de6faaeaddbfa0e8cc39cf6fe22e24a7a', '25cc5da613eb2165086bd38800002e8101f8539ae2d79f6522e55988006e90f0'),
    ('Keep covered work allocation in charge review', 'cfdb2c7ec042acfa03f1481ef34ccb3672c722e2a03b4a9d08953a233b986228', 'd7815cae27e0d34eb3b33c320dcf14a0cd60035d0987fffea0973035e07b3bf4'),
)
CHECKS = 0


def check(name, passed):
    global CHECKS
    assert passed, name
    CHECKS += 1
    print('PASS', name)


def source_data(text):
    marker = 'const DATA = '
    assert text.count(marker) == 1, 'Exactly one DATA declaration is required'
    start = text.index(marker) + len(marker)
    data, length = json.JSONDecoder().raw_decode(text[start:])
    return data, text[:start] + '<SOURCE_DATA>' + text[start + length:]


def workbook_cells(path):
    """Read source cells directly from OOXML, without a production parser."""
    ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with ZipFile(path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            for si in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('x:si', ns):
                shared.append(''.join(node.text or '' for node in si.findall('.//x:t', ns)))
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        sheet = next(node for node in workbook.findall('x:sheets/x:sheet', ns)
                     if node.attrib['name'] == SOURCE_SHEET)
        relation_id = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        relations = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        target = next(node.attrib['Target'] for node in relations if node.attrib['Id'] == relation_id)
        member = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        sheet_xml = ET.fromstring(archive.read(member))
        cells = {}
        for cell in sheet_xml.findall('x:sheetData/x:row/x:c', ns):
            typ, raw = cell.attrib.get('t'), cell.find('x:v', ns)
            if typ == 'inlineStr':
                value = ''.join(node.text or '' for node in cell.findall('.//x:t', ns))
            elif raw is None or raw.text is None:
                value = None
            elif typ == 's':
                value = shared[int(raw.text)]
            elif typ == 'b':
                value = raw.text == '1'
            elif typ in ('str', 'e'):
                value = raw.text
            else:
                value = float(raw.text)
                if value.is_integer():
                    value = int(value)
            cells[cell.attrib['r']] = value
        return cells


def verify_shared_fixtures():
    workbook = Path(os.environ.get('SOURCE_WORKBOOK', str(ROOT / SOURCE)))
    check('Independent fixture workbook has the reviewed exact hash',
          hashlib.sha256(workbook.read_bytes()).hexdigest() == SOURCE_SHA)
    cells = workbook_cells(workbook)
    columns = 'ABCDEFGHIJKLMNO'
    check('Every line keeps the independently reviewed source columns',
          tuple(cells.get(c + '1') for c in columns) == HEADERS)
    for excel_row, line, item, description, quantity, ref, arrived, wording in FIXTURES:
        expected = ('9968955', line, 'Delivered', item, description, quantity,
                    90.07, 0, 'KINP-HIR', 'KINP', '2026-10-22', None,
                    ref, arrived, wording)
        check('Independent source cells for contract line ' + str(line),
              tuple(cells.get(c + str(excel_row)) for c in columns) == expected)
    check('Source fixtures are seven ordinary hire lines with quantity nine',
          len(FIXTURES) == 7 and sum(row[4] for row in FIXTURES) == 9)


def load_patch():
    sys.path.insert(0, str(HERE))
    spec = importlib.util.spec_from_file_location('reviewed_patch1225', HERE / 'patch_v1225.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def expected_advisory_shell(text):
    spec = importlib.util.spec_from_file_location('reviewed_advisory1225', HERE / 'fix_advisory1225.py')
    module = importlib.util.module_from_spec(spec)
    sys.path.insert(0, str(ROOT / 'toolchain'))
    spec.loader.exec_module(module)
    check('Advisory has exactly seven reviewed fragment transformations',
          len(module.CHANGES) == len(ADVISORY_TRANSFORMS))
    for (before, after, label), expected in zip(module.CHANGES, ADVISORY_TRANSFORMS):
        actual = (label, hashlib.sha256(before.encode()).hexdigest(),
                  hashlib.sha256(after.encode()).hexdigest())
        check('Frozen advisory fragment: ' + expected[0], actual == expected)
        # The shared rep() consumes the complete leading indentation at these
        # two anchors. Exact source inspection found one additional space at
        # each; permit those two bytes explicitly, never normalise whitespace.
        prefix = ' ' if label in {
            'Read current source charge coverage for barrier work',
            'Keep covered work allocation in charge review',
        } else ''
        anchor = prefix + before
        check('Unique original advisory anchor: ' + expected[0], text.count(anchor) == 1)
        text = text.replace(anchor, after)
    return text


def refusal(name, action, unchanged=None):
    before = deepcopy(unchanged)
    try:
        action()
    except SystemExit:
        check(name, True)
    else:
        raise AssertionError(name + ': operation did not refuse')
    if unchanged is not None:
        check(name + ' leaves its input unchanged', unchanged == before)


def expected_row(fixture):
    """Independent schema oracle: unavailable workbook fields remain unknown."""
    excel_row, line, item, description, quantity, ref, _, _ = fixture
    row = {
        'rental_contract': '9968955', 'branch_code': 'KINP', 'line': line,
        'item': str(item), 'asset_no': str(item),
        'asset_no_is_plant_number': line == 158,
        'description': description,
        'what': 'Toilet Portable - Fresh Water Flush' if line == 158 else 'FWF Toilet',
        'register_type': 'FWF', 'family': 'toilet', 'kind': 'toilet',
        'quantity': quantity, 'rate_1': 90.07, 'price': 0,
        'sales_analysis_code': 'KINP-HIR', 'status_as_written': 'Delivered',
        'contract_start': '2026-10-22', 'delivered': False,
        'hold_billing': False, 'main_item': False, 'subhired': False,
        'subhire_rule': None, 'charge_line': False,
        'match': {
            'state': 'explicit source reference', 'to': 'asset', 'key': ref,
            'task_id': None, 'via': 'reference and item',
            'basis': 'Shared source explicitly names ' + ref +
                     ' FWF; current site identity and receipt remain authoritative.'},
        'sourceAddition1225': {
            'source': SOURCE, 'sha256': SOURCE_SHA, 'sheet': SOURCE_SHEET,
            'row': excel_row, 'ref': ref, 'basis': BASIS},
    }
    # These columns are absent from the shared comparison. In particular,
    # neither a rate type nor native receipt may be borrowed from a neighbour.
    unknown = (
        'item_type_code', 'serial', 'booked_delivery_date', 'delivery_number',
        'return_number', 'expected_term_date', 'term_date', 'booked_pickup_date',
        'location', 'start_date', 'start_time', 'demob_date', 'rate_2', 'rate_3',
        'rate_4', 'rate_5', 'flat_monthly_charge', 'rate_type',
        'rate_classification', 'rate_id', 'sell_price', 'number_of_days',
        'minimum_days', 'term_number', 'billing_option', 'start_time_as_written',
        'expected_offrental_time', 'package_name', 'swap_from_line',
        'billed_amount', 'last_total_amount', 'billed_units',
        'total_inc_sd_dw_gst', 'supplier_sub_rental',
    )
    row.update({key: None for key in unknown})
    return row


def digest_source(data):
    return hashlib.sha256(json.dumps(data['rental_on_hire'], sort_keys=True,
                                    separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def verify_helper_refusals(module, old_data, new_data):
    changed = deepcopy(old_data)
    changed['rental_on_hire']['rows'][0]['rate_1'] = 987654.32
    refusal('Different source data is refused', lambda: module.add_source_rows(changed), changed)
    repeated = deepcopy(new_data)
    refusal('Repeated source helper is refused', lambda: module.add_source_rows(repeated), repeated)

    cases = []
    duplicate = deepcopy(old_data)
    duplicate['rental_on_hire']['rows'].append(deepcopy(duplicate['rental_on_hire']['rows'][0]))
    cases.append(('Existing duplicate source identity', duplicate))
    for fixture in FIXTURES:
        duplicate = deepcopy(old_data)
        duplicate['rental_on_hire']['rows'].append(expected_row(fixture))
        cases.append(('Pre-existing target line ' + str(fixture[1]), duplicate))
    no_contract = deepcopy(old_data)
    no_contract['rental_on_hire']['contracts'] = [c for c in no_contract['rental_on_hire']['contracts']
                                                if str(c['rental_contract']) != '9968955']
    cases.append(('Missing target contract metadata', no_contract))
    double_contract = deepcopy(old_data)
    target = next(c for c in double_contract['rental_on_hire']['contracts']
                  if str(c['rental_contract']) == '9968955')
    double_contract['rental_on_hire']['contracts'].append(deepcopy(target))
    cases.append(('Duplicate target contract metadata', double_contract))
    wrong_branch = deepcopy(old_data)
    next(c for c in wrong_branch['rental_on_hire']['contracts']
         if str(c['rental_contract']) == '9968955')['branch_code'] = 'NVAC'
    cases.append(('Wrong target contract branch', wrong_branch))
    for name, fixture in cases:
        # Isolate the second-stage safeguards. Real apply() and the unmodified
        # helper still refuse anything other than the exact reviewed source.
        with patch.object(module, 'INPUT_SHA', digest_source(fixture)):
            refusal(name + ' is refused by its own guard',
                    lambda fixture=fixture: module.add_source_rows(fixture), fixture)


def main():
    verify_shared_fixtures()
    base_bytes = Path(os.environ['BASE']).read_bytes()
    base = base_bytes.decode('utf-8')
    page = Path(os.environ['PAGE']).read_bytes().decode('utf-8')
    check('Exact verified v12.24 base', hashlib.sha256(base_bytes).hexdigest() == BASE_SHA)
    old_data, old_shell = source_data(base)
    new_data, new_shell = source_data(page)
    old_footer = "+' · v12.24'; /* v8.19 release922:"
    new_footer = "+' · v12.25'; /* v8.19 release922:"
    check('Release footer advances exactly once', old_shell.count(old_footer) == 1 and
          new_shell.count(new_footer) == 1 and old_footer not in new_shell)
    advisory_present = 'function contractWork1225(' in new_shell
    if os.environ.get('ADVISORY') == '1':
        check('Final release includes the contract-work advisory', advisory_present)
    expected_shell = old_shell.replace(old_footer, new_footer)
    if advisory_present:
        expected_shell = expected_advisory_shell(expected_shell)
    check('All page code, styles and markup outside DATA, footer and reviewed advisory fragments are byte-identical',
          new_shell == expected_shell)
    wrapper_start = ' const previousRows1007=arrivedChargeRows975;'
    wrapper_end = ' const previousBranches1007=pl752Rows;'
    check('Per-reference arrived-charge calculation and null attribution remain byte-identical',
          old_shell[old_shell.index(wrapper_start):old_shell.index(wrapper_end)] ==
          new_shell[new_shell.index(wrapper_start):new_shell.index(wrapper_end)])
    check('Every non-rental DATA field is unchanged',
          {k: v for k, v in old_data.items() if k != 'rental_on_hire'} ==
          {k: v for k, v in new_data.items() if k != 'rental_on_hire'})
    old, new = old_data['rental_on_hire'], new_data['rental_on_hire']
    check('All 303 previous source rows and their order are unchanged',
          len(old['rows']) == 303 and new['rows'][:303] == old['rows'])
    additions = new['rows'][303:]
    check('Only the seven independent source identities were appended, in order',
          len(new['rows']) == 310 and
          [(str(r['rental_contract']), r['line']) for r in additions] ==
          [('9968955', row[1]) for row in FIXTURES])
    check('Appended identities are unique across the complete source',
          len({(str(r['rental_contract']), r['line']) for r in new['rows']}) == len(new['rows']))
    check('The existing service import manifest is unchanged',
          new['source_additions1224'] == old['source_additions1224'])
    check('Ordinary hire additions cannot activate the bulk-service marker',
          all('sourceAddition1224' not in row for row in additions))
    for row, fixture in zip(additions, FIXTURES):
        check('Full independent field truth and unknowns for line ' + str(fixture[1]),
              row == expected_row(fixture))
    check('Source start does not become a native arrival or delivery claim',
          all(r['contract_start'] == '2026-10-22' and r['start_date'] is None and
              r['delivered'] is False and r['status_as_written'] == 'Delivered' for r in additions))
    check('The one physical source number is an identifier; six miscellaneous rows remain unnumbered',
          [r['asset_no'] for r in additions if r['asset_no_is_plant_number']] == ['1211963'] and
          sum(not r['asset_no_is_plant_number'] for r in additions) == 6)
    expected_contracts = deepcopy(old['contracts'])
    target = next(c for c in expected_contracts if str(c['rental_contract']) == '9968955')
    target['lines'] += 7
    target['matched'] += 7
    target['assets'] = sorted(set(target['assets']) | {r[5] for r in FIXTURES})
    target['plant_numbers'] = sorted(set(target['plant_numbers']) | {'1211963'})
    target['start_dates'] = sorted(set(target['start_dates']) | {'2026-10-22'})
    check('Contract metadata has exactly the supported seven-line delta and preserves all other contracts',
          new['contracts'] == expected_contracts)
    expected_summary = deepcopy(old['summary'])
    expected_summary['lines'] += 7
    expected_summary['miscellaneous_lines'] += 6
    expected_summary['plant_numbers'] += 1
    check('Summary has exactly seven lines, six miscellaneous lines and one new plant number added',
          new['summary'] == expected_summary)
    check('Source addition manifest names only the seven independently verified worksheet rows',
          new['source_additions1225'] == {
              'source': SOURCE, 'sha256': SOURCE_SHA, 'sheet': SOURCE_SHEET,
              'rows': [r[0] for r in FIXTURES], 'basis': BASIS})
    permitted = {'rows', 'contracts', 'summary', 'source_additions1225'}
    check('Assignments, prior imports and all other rental metadata remain unchanged',
          {k: v for k, v in new.items() if k not in permitted} ==
          {k: v for k, v in old.items() if k not in permitted})
    module = load_patch()
    check('Candidate is exactly the reviewed patch result', module.apply(base) == page)
    refusal('Wrong base is refused', lambda: module.apply(base + '\n'))
    refusal('Repeated patch application is refused', lambda: module.apply(page))
    helper_data = deepcopy(old_data)
    module.add_source_rows(helper_data)
    check('The source helper produces exactly the independently checked DATA', helper_data == new_data)
    verify_helper_refusals(module, old_data, new_data)
    print('PASS', CHECKS, 'preservation and refusal checks')


if __name__ == '__main__':
    main()
