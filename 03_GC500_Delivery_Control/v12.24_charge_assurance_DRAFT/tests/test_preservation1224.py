"""Author: Andrew Fisher. Exact unchanged-source checks for the bounded patch."""
import hashlib
import json
import os
import sys
from copy import deepcopy
from html.parser import HTMLParser
from pathlib import Path

class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.blocks = {'script': [], 'style': []}
        self.current = None
    def handle_starttag(self, tag, attrs):
        if tag in self.blocks:
            self.current = [tag, dict(attrs), '']
    def handle_data(self, data):
        if self.current:
            self.current[2] += data
    def handle_endtag(self, tag):
        if self.current and self.current[0] == tag:
            self.blocks[tag].append(self.current)
            self.current = None

base = Path(os.environ['BASE']).read_text()
page = Path(os.environ['PAGE']).read_text()
before, after = Blocks(), Blocks()
before.feed(base)
after.feed(page)
checks = 0
def check(name, yes):
    global checks
    assert yes, name
    checks += 1
    print('PASS', name)

check('Exact verified base', hashlib.sha256(base.encode()).hexdigest() == '8112a63d10c5b6c88206a539af5a59dc1037176e414a95f20d253b16f844e257')
scripts = before.blocks['script']
check('Only two new scripts', len(after.blocks['script']) == len(scripts) + 2)
check('Every existing script identity and order is preserved',
      all(item[:2] == after.blocks['script'][i][:2] for i, item in enumerate(scripts)))
changed = [item for i, item in enumerate(scripts) if item[2] != after.blocks['script'][i][2]]
changed_ids = {item[1].get('id', 'main-model') for item in changed}
check('Only the three intended model blocks changed',
      changed_ids == {'main-model', 'finance-request996-script', 'charge1006-script'})
# Build-artifact integrity is separate from the independent data invariants below:
# no extra edits inside an authorised script are accepted merely because its id matches.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from patch_v1224 import apply as reviewed_patch
expected = Blocks()
expected.feed(reviewed_patch(base))
check('Changed script bytes match only the reviewed patch transformations',
      after.blocks['script'] == expected.blocks['script'])
check('Every existing style is byte-identical', before.blocks['style'] == after.blocks['style'][:-1])
check('One scoped style added', after.blocks['style'][-1][1].get('id') == 'charge-assurance1224-style')
check('Added style exactly matches the reviewed source', after.blocks['style'] == expected.blocks['style'])
check('New script identities', [b[1].get('id') for b in after.blocks['script'][-2:]] == ['charge-checks1224-script', 'charge-assurance1224-script'])
check('Main servicing lock percentage retained', 'var JOBS1123 = [\'pump\', \'clean\', \'refill\', \'lockup\'];' in page)
def source_data(text):
    start = text.index('const DATA = ') + len('const DATA = ')
    data, _ = json.JSONDecoder().raw_decode(text[start:])
    return data

old_data, new_data = source_data(base), source_data(page)
old, new = old_data['rental_on_hire'], new_data['rental_on_hire']
check('All non-rental DATA is unchanged',
      {k: v for k, v in old_data.items() if k != 'rental_on_hire'} ==
      {k: v for k, v in new_data.items() if k != 'rental_on_hire'})
check('All 298 embedded raw contract rows remain unchanged and in order',
      len(old['rows']) == 298 and new['rows'][:298] == old['rows'])
# The 299th current ONHIRE row is the existing native fleet association. It is
# projected from a separate immutable JSON block, not stored in DATA.rows.
association_ids = {'financial-association1105-model', 'financial-association1105-data', 'financial-association1105-browser'}
old_association = {b[1]['id']: b for b in scripts if b[1].get('id') in association_ids}
new_association = {b[1]['id']: b for b in after.blocks['script'] if b[1].get('id') in association_ids}
check('Existing runtime association source, model and adapter are byte-identical',
      set(old_association) == association_ids and new_association == old_association)
association = json.loads(old_association['financial-association1105-data'][2])
check('The unchanged 299th row is exactly the existing EQ0003 association',
      len(association) == 1 and association[0]['binding']['ref'] == 'EQ0003' and
      association[0]['row']['rental_contract'] == '9992300' and
      association[0]['row']['line'] == 12 and association[0]['row']['asset_no'] == '1286482' and
      not any(str(r['rental_contract']) == '9992300' and r['line'] == 12 for r in old['rows']))

# Independent, reviewed source identities and values; this fixture does not import
# the production helper's ADDITIONS or source_row implementation.
source = 'review_25Oct2026_baseplan7/GC500_Baseplan7_vs_Site_25Oct2026.xlsx'
sha = '8184c8f704d6efc9419411d211a191724c306e8ed22d4db3598dfc83206d2b5c'
allowed = [
    ('9994996', 1, 'STPS', 'STPS-INS', 'LABOUR', 'Labour Charge WFB Install & Removal', 1, 7700, 'Pending', '2026-10-23', 351, 'water-filled-barriers', 'installation'),
    ('9994996', 2, 'STPS', 'STPS-FRI', 'TRANSPORT', 'Transport Charge WFB Delivery & Removal', 1, 17900, 'Pending', '2026-10-23', 352, 'water-filled-barriers', 'transport'),
    ('9992300', 13, 'MEAD', 'MEAD-FRI', 'TRANSPORT', "Transport Charge 60' Straight", 2, 500, 'Delivered', '2026-10-19', 335, 'straight-boom-60ft', 'transport'),
    ('9961265', 41, 'STPS', 'STPS-FRI', 'TRANSPORT', 'Transport Charge', 48, 150, 'Pending', '2026-10-19', 312, 'vms-transport', 'transport'),
    ('9968862', 136, 'KINP', 'KINP-MIS', 'MISC', 'Site Shift for Supply', 1, 500, 'Delivered', '2026-10-19', 227, 'site-shift', 'service'),
]
new_rows = new['rows'][298:]
check('Only the five exact source contract identities are appended',
      len(new['rows']) == 303 and len(new['rows']) + len(association) == 304 and
      [(r['rental_contract'], r['line']) for r in new_rows] == [(r[0], r[1]) for r in allowed])
check('No appended identity exists in the original rows',
      not ({(r['rental_contract'], r['line']) for r in old['rows']} & {(r[0], r[1]) for r in allowed}))
null_fields = set('serial register_type booked_delivery_date delivery_number return_number expected_term_date term_date booked_pickup_date location start_date start_time demob_date rate_1 rate_2 rate_3 rate_4 rate_5 flat_monthly_charge rate_type rate_classification rate_id sell_price number_of_days minimum_days term_number billing_option start_time_as_written expected_offrental_time package_name swap_from_line billed_amount last_total_amount billed_units total_inc_sd_dw_gst supplier_sub_rental'.split())
for row, values in zip(new_rows, allowed):
    contract, line, branch, sales, item, description, quantity, price, status, start, sheet_row, scope, category = values
    wanted = dict.fromkeys(null_fields)
    wanted.update(rental_contract=contract, line=line, branch_code=branch, sales_analysis_code=sales,
                  item_type_code=2, item=item, asset_no=item, asset_no_is_plant_number=False,
                  description=description, what=description, family=category, kind=category,
                  quantity=quantity, price=price, status_as_written=status, contract_start=start,
                  delivered=False, hold_billing=False, main_item=False, subhired=False,
                  subhire_rule=None, charge_line=True,
                  match={'state': 'unmatched', 'to': None, 'key': None, 'task_id': None, 'via': None,
                         'basis': 'Priced contract service scope; no per-reference allocation or physical completion inferred.'},
                  sourceAddition1224={'source': source, 'sha256': sha, 'sheet': 'Every line', 'row': sheet_row,
                                     'scope': scope, 'combined': True,
                                     'allocation': 'Whole contract scope; no per-reference or movement split.'})
    check('Exact source row, provenance and no inferred completion ' + contract + ':' + str(line), row == wanted)

expected_contracts = deepcopy(old['contracts'])
by_contract = {str(r['rental_contract']): r for r in expected_contracts}
added_contracts = 0
for contract, _, branch, _, _, _, _, _, _, start, *_ in allowed:
    if contract not in by_contract:
        metadata = {'rental_contract': contract, 'branch_code': branch, 'tab': contract + '-' + branch,
                    'assets': [], 'lines': 0, 'plant_numbers': [], 'locations': [], 'start_dates': [],
                    'delivered_dates': [], 'demob_dates': [], 'delivery_numbers': [], 'matched': 0}
        by_contract[contract] = metadata
        expected_contracts.append(metadata)
        added_contracts += 1
    metadata = by_contract[contract]
    metadata['lines'] += 1
    if start not in metadata['start_dates']:
        metadata['start_dates'].append(start)
check('Contract metadata changes only by exact appended row counts and source starts', new['contracts'] == expected_contracts)
summary = deepcopy(old['summary'])
for field in ('lines', 'miscellaneous_lines', 'unmatched'):
    summary[field] += 5
summary['contracts'] = sorted(set(summary['contracts']) | {r[0] for r in allowed})
check('Summary counters reflect only five unallocated service rows', new['summary'] == summary)
check('Contract count changes only for newly represented contracts',
      new['contracts_count1026'] == old['contracts_count1026'] + added_contracts)
check('Source addition manifest names only the exact reviewed source cells',
      new['source_additions1224'] == {'source': source, 'sha256': sha, 'sheet': 'Every line',
                                    'rows': [r[10] for r in allowed],
                                    'basis': 'Priced service lines; existing site records and completion are unchanged.'})
permitted_keys = {'rows', 'contracts', 'summary', 'contracts_count1026', 'source_additions1224'}
check('Every other rental source field and key is unchanged',
      {k: v for k, v in new.items() if k not in permitted_keys} ==
      {k: v for k, v in old.items() if k not in permitted_keys})
check('Release footer advanced once', page.count("+' · v12.24'; /* v8.19 release922:") == 1 and "+' · v12.23'; /* v8.19 release922:" not in page)
print('PASS', checks, 'preservation checks')
