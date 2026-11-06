"""Author: Andrew Fisher. Bounded public source fields and exact preservation."""
import copy
import hashlib
import importlib.util
import json
import os
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('source_movements1255', Path(__file__).resolve().parents[1] / 'source_movements.py')
source = importlib.util.module_from_spec(spec); spec.loader.exec_module(source)


def fixture():
    rows = []
    for (contract, line), edits in source.EXISTING_EDITS.items():
        row = {'rental_contract': contract, 'line': line, 'branch_code': source.BRANCHES[contract],
               'match': {'key': 'SYNTHETIC-SITE'}, 'start_date': '2026-01-02', 'demob_date': '2026-03-04',
               'kind': 'keep', 'sales_analysis_code': 'KEEP', 'quantity': 1.25, 'supplier_sub_rental': 'keep'}
        row.update({field: before for field, (before, _after) in edits.items()}); rows.append(row)
    rows += [{'rental_contract': '9987005', 'line': 8, 'branch_code': 'MEAD', 'price': 0, 'rate_1': 0},
             {'rental_contract': '9999999', 'line': 1, 'branch_code': 'NVAC', 'price': 123.45, 'quantity': 7.25, 'match': {'key': 'UNRULED'}}]
    removed = copy.deepcopy(source.REMOVED_SOURCE_FIELDS)
    removed['match'] = {'state': 'unmatched', 'to': None, 'key': None, 'task_id': None, 'via': None}
    rows.append(removed)
    ids = sorted({r['rental_contract'] for r in rows})
    contracts = [{'rental_contract': c, 'lines': sum(r['rental_contract'] == c for r in rows), 'other': 'retain'} for c in ids]
    next(c for c in contracts if c['rental_contract'] == '9961976')['plant_numbers'] = ['1210921']
    return {'rental_on_hire': {'rows': rows, 'contracts': contracts, 'assignments': {'native': 'retain'},
            'summary': {'contracts': ids, 'lines': len(rows), 'miscellaneous_lines': 14, 'unmatched': 14, 'delivered_lines': 9, 'plant_numbers': 1, 'numbers_the_schedule_did_not_have': ['1210921']}},
            'plant_lines': {'lines': [{'rental': ['unchanged']} ]}, 'assets': [{'site': 'unchanged'}]}


class SourceMovementTests(unittest.TestCase):
    def test_exact_scalar_fields_and_no_other_existing_changes(self):
        before = fixture(); frozen = copy.deepcopy(before); after, manifest = source.apply_data(before)
        self.assertEqual(before, frozen)
        self.assertEqual(len(manifest['existing_fields']), 17)
        after_keys = {(r['rental_contract'], r['line']): r for r in after['rental_on_hire']['rows']}
        for b in before['rental_on_hire']['rows']:
            key = (b['rental_contract'], b['line'])
            if key == source.REMOVED_KEY: continue
            a = after_keys[key]
            expected = copy.deepcopy(b)
            for field, (_old, new) in source.EXISTING_EDITS.get((b['rental_contract'], b['line']), {}).items(): expected[field] = new
            self.assertEqual(a, expected)

    def test_eight_additions_only_without_runtime_duplicate(self):
        before = fixture(); after, manifest = source.apply_data(before)
        expected = [('9994248', i) for i in range(1, 6)] + [('9994954', 19), ('9994954', 20), ('9997710', 3)]
        new = after['rental_on_hire']['rows'][len(before['rental_on_hire']['rows']) - 1:]
        self.assertEqual([(r['rental_contract'], r['line']) for r in new], expected)
        self.assertEqual(len(manifest['added']), 8)
        self.assertNotIn(('9992300', 12), expected)
        for r in new:
            self.assertIs(type(r['item_type_code']), int)
            self.assertEqual(r['match']['state'], 'unmatched')
            for key in ('key', 'to', 'task_id', 'via'): self.assertIsNone(r['match'][key])
            for key in ('start_date', 'demob_date', 'delivered', 'delivery_number', 'return_number', 'booked_delivery_date', 'booked_pickup_date', 'supplier_sub_rental', 'subhired'):
                self.assertIsNone(r[key])
            self.assertFalse(r['asset_no_is_plant_number'])

    def test_blank_source_items_and_transport_classification(self):
        new = source.additions()
        for r in new[:2]:
            self.assertIsNone(r['item']); self.assertIsNone(r['asset_no'])
        for r in new[3:5]:
            self.assertEqual((r['item_type_code'], r['kind'], r['charge_line'], r['sales_analysis_code']), (4, 'transport', True, 'STPS-FRI'))
        labour = new[6]
        self.assertEqual((labour['item_type_code'], labour['quantity'], labour['price'], labour['rate_1']), (2, 6, 551.73, None))

    def test_operational_data_and_plant_copies_exact(self):
        before = fixture(); after, _ = source.apply_data(before)
        for key in ('plant_lines', 'assets'): self.assertEqual(after[key], before[key])
        self.assertEqual(after['rental_on_hire']['assignments'], before['rental_on_hire']['assignments'])

    def test_only_derived_source_counts_change(self):
        before = fixture(); after, manifest = source.apply_data(before)
        a, b = after['rental_on_hire'], before['rental_on_hire']
        for field in ('lines', 'miscellaneous_lines', 'unmatched'): self.assertEqual(a['summary'][field], b['summary'][field] + (8 if field == 'miscellaneous_lines' else 7))
        self.assertEqual(a['summary']['plant_numbers'], b['summary']['plant_numbers'] - 1)
        self.assertEqual(a['summary']['numbers_the_schedule_did_not_have'], [])
        self.assertEqual(a['summary']['delivered_lines'], b['summary']['delivered_lines'])
        self.assertEqual(a['summary']['contracts'], sorted(b['summary']['contracts'] + ['9994248']))
        for old, new in zip(b['contracts'], a['contracts']):
            expected = copy.deepcopy(old); expected['lines'] += {'9961976': -1, '9994954': 2, '9997710': 1}.get(old['rental_contract'], 0)
            if old['rental_contract'] == '9961976': expected['plant_numbers'] = []
            self.assertEqual(new, expected)
        self.assertEqual(a['contracts'][-1]['rental_contract'], '9994248'); self.assertEqual(a['contracts'][-1]['lines'], 5)
        self.assertEqual(len(manifest['metadata_fields']), 11)

    def test_only_explicit_zero_source_identity_removed(self):
        before = fixture(); after, manifest = source.apply_data(before)
        keys = {(r['rental_contract'], r['line']) for r in after['rental_on_hire']['rows']}
        self.assertNotIn(source.REMOVED_KEY, keys)
        self.assertEqual([(r['contract'], r['line']) for r in manifest['removed']], [source.REMOVED_KEY])
        self.assertEqual(manifest['removed'][0]['row'], before['rental_on_hire']['rows'][-1])
        for field, value in [('branch_code', 'MEAD'), ('quantity', 2), ('status_as_written', 'Delivered'), ('rate_1', 1), ('price', 1), ('asset_no', 'different')]:
            changed = fixture(); changed['rental_on_hire']['rows'][-1][field] = value
            with self.subTest(field=field), self.assertRaises(source.SourceMovementError): source.apply_data(changed)
        linked = fixture(); linked['rental_on_hire']['rows'][-1]['match']['key'] = 'EQ0004'
        with self.assertRaises(source.SourceMovementError): source.apply_data(linked)

    def test_repeats_duplicates_wrong_branch_or_prior_values_rejected(self):
        before = fixture(); after, _ = source.apply_data(before)
        with self.assertRaises(source.SourceMovementError): source.apply_data(after)
        duplicate = fixture(); duplicate['rental_on_hire']['rows'].append(copy.deepcopy(duplicate['rental_on_hire']['rows'][0]))
        with self.assertRaises(source.SourceMovementError): source.apply_data(duplicate)
        for field, value in [('branch_code', 'OTHER'), ('status_as_written', 'Changed')]:
            bad = fixture(); bad['rental_on_hire']['rows'][0][field] = value
            with self.assertRaises(source.SourceMovementError): source.apply_data(bad)

    @unittest.skipUnless(os.environ.get('SOURCE_PAGE'), 'Private exact54 source page required')
    def test_exact_predecessor_and_all_unruled_rows_preserved(self):
        raw = Path(os.environ['SOURCE_PAGE']).read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), source.SOURCE_BASE_SHA256)
        text = raw.decode(); start = text.index('const DATA = ') + len('const DATA = ')
        before, _ = json.JSONDecoder().raw_decode(text[start:]); after, manifest = source.apply_data(before)
        self.assertEqual(len(after['rental_on_hire']['rows']), 388)
        self.assertEqual(len(manifest['existing_fields']), 17)
        after_keys = {(r['rental_contract'], r['line']): r for r in after['rental_on_hire']['rows']}
        for old in before['rental_on_hire']['rows']:
            key = (old['rental_contract'], old['line'])
            if key == source.REMOVED_KEY: continue
            new = after_keys[key]
            edits = source.EXISTING_EDITS.get((old['rental_contract'], old['line']), {})
            self.assertEqual({k: v for k, v in old.items() if k not in edits}, {k: v for k, v in new.items() if k not in edits})


if __name__ == '__main__':
    unittest.main()
