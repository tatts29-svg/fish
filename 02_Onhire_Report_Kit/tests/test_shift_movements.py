import json
import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import shift_movements as moves


SCHEDULE = 'MMG test'
DAY = '25/11/2026'


def movement(key='11', item='A', day=DAY, issued='17:59:59', end=DAY, returned='18:00:00', quantity=1):
    return dict(PRODUCT_CATEGORY='Rental', TRANSACTION_ID=key, QUANTITY=quantity, TRAN_START_DATE=day,
                TRAN_START_TIME=issued, TRAN_END_DATE=end, TRAN_END_TIME=returned, **{'SKU/ITEM_NUMBER':item})


def read(rows, lo='2026-11-25T17:45:00', hi='2026-11-26T06:00:00', pull='2026-11-26T06:00:00', prior=None, **extra):
    ref = dict(period=(datetime.fromisoformat(lo), datetime.fromisoformat(hi)),
               schedule=SCHEDULE, requested=datetime.fromisoformat(pull), **extra)
    with patch.object(moves, 'rental_transactions', return_value=rows):
        return moves.snapshot('file', ref, SCHEDULE, prior)


class ShiftMovements(unittest.TestCase):
    def render(self, snap, pull='2026-11-26T06:00:00'):
        result = moves.report(snap, '2026-11-24', '2026-11-27', datetime.fromisoformat(pull))
        return {(s['day'],s['shift']):s for s in result['shifts']}

    def test_distinct_movement_times_half_hours_and_night_attribution(self):
        rows = [movement(quantity=2), movement(quantity=2), movement('22','B',issued='18:00:01',end='26/11/2026',returned='05:59:59'),
                movement('33','A',day='26/11/2026',issued='06:00:00',end='',returned=''),
                {**movement('999'), 'PRODUCT_CATEGORY':'Consumable'}]
        snap, why = read(rows)
        self.assertEqual(why, '')
        shifts = self.render(snap)
        day = shifts['2026-11-25','Day']
        self.assertEqual((day['issued'], day['returned'], day['covered_minutes']), (2,0,15))
        self.assertEqual((day['bins'][0]['issued'], day['bins'][-1]['issued']), (None,2))
        night = shifts['2026-11-25','Night']
        self.assertEqual((night['issued'], night['returned'], night['first_returned'], night['last_returned']),
                         (1,3,'2026-11-25T18:00:00','2026-11-26T05:59:59'))
        self.assertEqual(night['bins'][1]['issued'],0)
        self.assertEqual(shifts['2026-11-26','Day']['issued'],1)
        self.assertIsNone(shifts['2026-11-26','Night']['returned'])
        public = json.dumps(shifts['2026-11-25','Night'])
        self.assertNotIn('TRANSACTION_ID',public)
        self.assertNotIn(next(iter(snap['rentals'])),public)

    def test_refresh_replaces_revised_moved_deleted_and_preserves_older_windows(self):
        old, _ = read([movement(),movement('22','B',issued='17:46:15',end='',returned=''),
                       movement('33','C',issued='17:49:00',end='',returned='')],hi='2026-11-25T19:00:00')
        old = json.loads(json.dumps(old))   # prior deployed snapshot
        # Old 17:46 remains outside the new window, and 17:49 is reported
        # again with a corrected issue time. No earlier event is double-counted.
        new, _ = read([movement('33','C',issued='17:53:00',end='',returned='')],
                      lo='2026-11-25T17:50:00', hi='2026-11-25T19:00:00',prior=old)
        result = self.render(new)
        self.assertEqual((result['2026-11-25','Day']['issued'],result['2026-11-25','Night']['returned']), (2,0))
        replay, _ = read([movement('33','C',issued='17:53:00',end='',returned='')],
                         lo='2026-11-25T17:50:00',hi='2026-11-25T19:00:00',prior=new)
        self.assertEqual(replay,new)
        newer, _ = read([], lo='2026-11-25T20:00:00',hi='2026-11-25T23:00:00', prior=new)
        night = self.render(newer)['2026-11-25','Night']
        self.assertIsNone(night['bins'][3]['issued'])
        self.assertEqual(len(night['covered_intervals']),2)

    def test_malformed_future_duplicate_conflict_and_scope_keep_unknowns(self):
        rows = [movement('44',quantity=3), movement('44',quantity=1), movement('45',quantity=-1),
                movement('46',quantity=1, issued='16:00',returned='18:15'),movement('47',issued='18:12',returned=''),
                movement('48',issued='18:16',returned='18:40')]
        snap, _ = read(rows, pull='2026-11-25T18:20:00')
        self.assertEqual(snap['excluded'],2)
        night = self.render(snap)['2026-11-25','Night']
        self.assertEqual((night['issued'],night['returned']), (2,1))
        self.assertIsNone(night['bins'][1]['returned'])
        partial, reason = read([],prior=snap,scoped=True)
        self.assertEqual(partial,snap)
        self.assertTrue(reason)
        stale, reason = read([],prior=snap,pull='2026-11-24T00:00')
        self.assertEqual(stale,snap)
        self.assertTrue(reason)

    def test_return_outside_selected_hire_window_proves_only_the_recorded_point(self):
        source = [movement(issued='17:49:00', returned='20:57:12')]
        old, _ = read(source,hi='2026-11-25T18:59:59')
        night = self.render(old)['2026-11-25','Night']
        point = night['bins'][5]
        self.assertEqual((point['issued'],point['returned'],point['covered_minutes']), (None,1,0))
        self.assertIsNone(night['bins'][4]['returned'])
        # Refreshing the return's hour does not erase evidence of an older hire.
        later, _ = read([],lo='2026-11-25T20:00:00',hi='2026-11-25T21:59:59',prior=old)
        self.assertEqual(self.render(later)['2026-11-25','Night']['returned'],1)
        # When the hire-start selection is refreshed without that hire, the
        # authoritative replacement removes both the issue and its later return.
        removed, _ = read([],hi='2026-11-25T18:59:59',prior=later)
        self.assertEqual(self.render(removed)['2026-11-25','Night']['returned'],0)
