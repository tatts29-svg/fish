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

    def test_in_round_recounts_and_between_round_evidence_count_each_identity_once(self):
        first = ('Rental', 'tool-a', '', '23/11/2026 06:00 AM', 'Stocktake', 'Cody', 1)
        same_item_later = ('Rental', 'tool-a', '', '23/11/2026 09:30 AM', 'Stocktake', 'Thomas', 0)
        since = ('Consumable', '', 'SKU-1', '27/11/2026 03:14:12 AM', 'Stocktake', 'Cody', 0)
        self.snapshot('stocktake_history/old.xlsx', '24/11/2026 09:00 AM', [first, same_item_later])
        p = self.snapshot('current.xlsx', '27/11/2026 07:24 PM', [same_item_later, since, since])
        d = self.build(p)
        self.assertEqual(d['arrival'], '2026-11-22')
        self.assertEqual(len(d['physical_counts']), 3)
        self.assertEqual(d['rounds'][0]['tools'], {'total': 1, 'checked': 1})
        self.assertEqual(d['rounds'][0]['cons'], {'total': 2, 'checked': 0})
        self.assertEqual(d['rounds'][1]['cons']['checked'], 0)
        self.assertIn({'kind': 'cons', 'category': 'Gloves', 'total': 2, 'checked': 1}, d['categories'])
        event = d['physical_counts'][0]
        self.assertEqual((event['round'], event['sighted'], event['shift_date'], event['shift'], event['quantity']),
                         (None, '2026-11-27T03:14:12', '2026-11-26', 'Night', 0))
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
        self.assertEqual(d['rounds'][0]['cons']['checked'], 1)

    def test_newer_export_correction_replaces_earlier_physical_count(self):
        r = ['Rental', 'Tool-A', '', '24/11/2026 05:30 PM', 'Stocktake', 'Thomas', 1]
        self.snapshot('stocktake_history/first.xlsx', '24/11/2026 06:10 PM', [r]); r[4] = 'Return'
        current = self.snapshot('current.xlsx', '25/11/2026 09:00 AM', [r]); r[4] = 'Stocktake'
        self.snapshot('stocktake_history/foreign.xlsx', '26/11/2026 09:00 AM', [r], 'Other works')
        d = self.build(current)
        self.assertEqual(d['physical_counts'], [])
        self.assertEqual(d['sightings'][0]['action'], 'Return')
        self.assertEqual(len(d['windows']), 2)
