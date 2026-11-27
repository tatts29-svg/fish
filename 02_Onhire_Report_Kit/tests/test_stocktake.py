import json
import sys
import tempfile
import unittest
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import stocktake


class StocktakeEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        (self.folder / 'stocktake_history').mkdir()
        self.rental = [dict(ITEM_NUMBER='Tool-A', ITEM_DESCRIPTION='Impact socket',
                            PRODUCT_FAMILY='Equipment', TOOLSTORE='MMG', STORAGE_UNIT='Container')]
        self.stock = [dict(SKU_NUMBER='SKU-1', SKU_DESCRIPTION='Gloves', AVAILABLE_QUANTITY=2),
                      dict(SKU_NUMBER='SKU-2', SKU_DESCRIPTION='Gloves', AVAILABLE_QUANTITY=0)]

    def snapshot(self, name, asat, events, schedule=stocktake.NOVEMBER_SCHEDULE):
        path = self.folder / name
        w = openpyxl.Workbook(); ref = w.active; ref.title = 'REFERENCE_INFO'
        ref.append(['PROJECT SCHEDULE', 'REQUESTED_DATE/TIME (LOCAL TIME)']); ref.append([schedule, asat])
        sh = w.create_sheet('STOCKTAKE')
        sh.append(['PRODUCT_CATEGORY', 'ITEM_OR_CONSUMABLE', 'SKU_NUMBER', 'LAST_SIGHTED_DATE_TIME',
                   'LAST_SIGHTED_ACTION', 'LAST_SIGHTED_BY', 'SIGHTED_QUANTITY', 'SHIFT_NAME'])
        for row in events:
            sh.append(row)
        w.save(path); w.close()
        return path

    def build(self, path):
        return stocktake.build(self.folder, path, stocktake.NOVEMBER_SCHEDULE, self.rental, self.stock)

    def test_opening_recounts_and_eligible_closeout_evidence_count_each_identity_once(self):
        first = ('Rental', 'tool-a', '', '23/11/2026 06:00 AM', 'Stocktake', 'Cody', 1)
        same_item_later = ('Rental', 'tool-a', '', '23/11/2026 09:30 AM', 'Stocktake', 'Thomas', 0)
        since = ('Consumable', '', 'SKU-1', '27/11/2026 03:14:12 AM', 'Stocktake', 'Cody', 0)
        self.snapshot('stocktake_history/old.xlsx', '24/11/2026 09:00 AM', [first, same_item_later])
        p = self.snapshot('current.xlsx', '27/11/2026 07:24 PM', [same_item_later, since, since])
        d = self.build(p)
        self.assertEqual(d['arrival'], '2026-11-22')
        self.assertEqual(len(d['physical_counts']), 3)
        self.assertEqual(d['rounds'][0]['physical_checks']['tools'], 1)
        self.assertEqual(d['rounds'][0]['physical_checks']['cons'], 0)
        self.assertEqual(d['rounds'][1]['cons']['checked'], 1)
        self.assertIn({'kind': 'cons', 'category': 'Gloves', 'total': 2, 'checked': 1}, d['categories'])
        event = d['physical_counts'][0]
        self.assertEqual((event['round'], event['sighted'], event['shift_date'], event['shift'], event['quantity']),
                         (1, '2026-11-27T03:14:12', '2026-11-26', 'Night', 0))
        self.assertEqual(event['shift_source'], 'Time of sighting')
        tool = d['rows'][0]
        self.assertEqual((len(tool['checks']), tool['key'], tool['family'], tool['storage_unit']),
                         (2, 'Tool-A', 'Equipment', 'Container'))
        self.assertTrue(all(e['key'] == 'Tool-A' for e in d['physical_counts'] if e['kind'] == 'tool'))

    def test_unattributed_count_has_coverage_but_blank_action_and_invalid_quantity_do_not(self):
        p = self.snapshot('current.xlsx', '27/11/2026 07:24 PM', [
            ('Rental', 'Tool-A', '', '27/11/2026 07:14 PM', '', 'Cody', 1),
            ('Rental', 'Tool-A', '', '27/11/2026 06:00 PM', 'Stocktake', '', 1),
            ('Rental', 'Tool-A', '', '27/11/2026 03:20 PM', 'Stocktake', 'Cody', 3),
            ('Rental', 'Tool-B', '', '21/11/2026 05:54 AM', 'Stocktake', 'Cody', 1, 'Night shift'),
            ('Consumable', '', 'SKU-1', '21/11/2026 09:04 AM', 'Stocktake', 'Cody', 3),
            ('Rental', 'Tool-A', '', '28/11/2026 09:04 AM', 'Stocktake', 'Cody', 1),
        ])
        d = self.build(p)
        self.assertEqual(len(d['sightings']), 5)
        self.assertEqual([x['evidence'] for x in d['sightings'][:3]],
                         ['activity', 'unattributed_count', 'quantity_unconfirmed'])
        self.assertEqual(d['sightings'][1]['who'], '')
        self.assertEqual(sum(row['checked'] for row in d['categories']), 1)
        self.assertEqual(d['physical_counts'][0]['who'], '')
        self.assertEqual(d['physical_counts'][0]['evidence'], 'unattributed_count')
        self.assertEqual(d['rows'][0]['checks'], [])
        self.assertEqual(d['unmatched'], 1)
        self.assertEqual(d['physical_counts'][-1]['current'], False)
        self.assertEqual(d['physical_counts'][-1]['shift_source'], 'SiteIQ')

    def test_distinct_same_minute_observations_survive_repeated_exports(self):
        zero = ('Consumable', '', 'SKU-1', '23/11/2026 10:05 AM', 'Stocktake', 'Cody', 0)
        two = (*zero[:5], 'Thomas', 2)
        self.snapshot('stocktake_history/prior.xlsx', '23/11/2026 11:00 AM', [zero, two])
        current = self.snapshot('current.xlsx', '25/11/2026 09:00 AM', [zero, two, zero])
        d = self.build(current)
        self.assertEqual({(e['who'], e['quantity']) for e in d['physical_counts']}, {('Cody', 0), ('Thomas', 2)})
        self.assertEqual(len(d['physical_counts']), 2)
        self.assertEqual(d['rounds'][0]['physical_checks']['cons'], 1)

    def test_newer_export_correction_replaces_earlier_physical_count(self):
        r = ['Rental', 'Tool-A', '', '24/11/2026 05:30 PM', 'Stocktake', 'Thomas', 1]
        self.snapshot('stocktake_history/first.xlsx', '24/11/2026 06:10 PM', [r]); r[4] = 'Return'
        current = self.snapshot('current.xlsx', '25/11/2026 09:00 AM', [r]); r[4] = 'Stocktake'
        self.snapshot('stocktake_history/foreign.xlsx', '26/11/2026 09:00 AM', [r], 'Other works')
        d = self.build(current)
        self.assertEqual(d['physical_counts'], [])
        self.assertEqual(d['sightings'][0]['action'], 'Return')
        self.assertEqual(len(d['windows']), 2)

    def test_approved_scope_is_frozen_and_keeps_physical_counts_separate(self):
        baseline = self.folder / 'approved.json'
        old = [{'kind': 'tool', 'key': 'Former-A', 'name': 'Socket', 'category': 'Sockets'},
               {'kind': 'cons', 'key': 'SKU-1', 'name': 'Gloves', 'category': 'Gloves'}]
        baseline.write_text(json.dumps({'schedule': stocktake.NOVEMBER_SCHEDULE, 'rows': old,
                                        'rental_asat': '2026-11-28T05:39', 'sales_asat': '2026-11-28T05:30'}))
        p = self.snapshot('current.xlsx', '03/12/2026 09:00 AM', [
            ('Rental', 'Tool-A', '', '25/11/2026 12:00 AM', 'Stocktake', 'Thomas', 1),
            ('Rental', 'Tool-A', '', '27/11/2026 07:20 PM', 'Stocktake', 'Cody', 0),
            ('Consumable', '', 'SKU-2', '02/12/2026 02:40 PM', 'Stocktake', 'Thomas', 0),
            ('Consumable', '', 'SKU-1', '02/12/2026 03:45 PM', 'Stocktake', '', 5),
            ('Rental', 'Tool-A', '', '03/12/2026 12:00 AM', 'Stocktake', 'Cody', 1),
        ])
        d = stocktake.build(self.folder, p, stocktake.NOVEMBER_SCHEDULE, self.rental, self.stock, baseline)
        opening, closeout = d['rounds']
        self.assertEqual(opening['carry_forward']['approved_by'], 'Andrew Fisher')
        self.assertEqual(opening['carry_forward']['approved_on'], '2026-11-28')
        self.assertEqual(opening['carry_forward']['rental_asat'], '2026-11-28T05:39')
        self.assertEqual([r['key'] for r in opening['baseline_rows']], ['Former-A', 'SKU-1'])
        self.assertEqual(opening['physical_checks'], {'tools': 0, 'cons': 0})
        self.assertEqual(opening['tools'], {'total': 1, 'checked': 1})
        self.assertEqual(opening['cons'], {'total': 1, 'checked': 1})
        self.assertEqual(sum(c['checked'] for c in opening['categories']), 2)
        self.assertEqual(closeout['tools'], {'total': 1, 'checked': 1})
        self.assertEqual(closeout['cons'], {'total': 2, 'checked': 1})
        self.assertTrue(closeout['includes_routine_counts'])
        self.assertEqual(len(d['physical_counts']), 5)
        self.assertEqual([e['round'] for e in d['physical_counts']], [None, None, 1, 1, 1])
        self.assertTrue(all(e['who'] != 'Andrew Fisher' for e in d['physical_counts']))

    def test_unavailable_baseline_and_other_jobs(self):
        mmg = self.build(None)
        self.assertFalse(mmg['rounds'][0]['carry_forward']['baseline_available'])
        self.assertIsNone(mmg['rounds'][0]['tools']['total'])
        policy = {'rounds': [{'label': 'Opening', 'start': '2026-11-20', 'end': '2026-11-25'},
                             {'label': 'Closeout', 'start': '2026-11-25', 'end': '2026-12-03',
                              'evidence_start': '2026-12-02'}]}
        (self.folder / 'stocktake.json').write_text(json.dumps(policy))
        other = stocktake.build(self.folder, None, 'Other schedule', self.rental, self.stock)
        self.assertNotIn('carry_forward', other['rounds'][0])
        self.assertEqual(other['rounds'][0]['tools'], {'total': 1, 'checked': 0})
        self.assertEqual(other['rounds'][1]['evidence_start'], '2026-12-02')
        self.assertEqual(self.build(None)['rounds'][1]['evidence_start'], '2026-11-25')

    def test_wrong_empty_or_duplicate_snapshot_never_supplies_coverage(self):
        baseline = self.folder / 'approved.json'
        row = {'kind': 'tool', 'key': 'T1', 'name': 'Wrench'}
        for schedule, rows in [('Foreign', [row]), (stocktake.NOVEMBER_SCHEDULE, []),
                               (stocktake.NOVEMBER_SCHEDULE, [row, dict(row, key='t1')])]:
            with self.subTest(schedule=schedule, rows=rows):
                baseline.write_text(json.dumps({'schedule': schedule, 'rows': rows}))
                with self.assertRaises(ValueError):
                    stocktake.build(self.folder, None, stocktake.NOVEMBER_SCHEDULE, self.rental, self.stock, baseline)
