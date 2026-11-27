import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qr_facts


def snapshot(first, last, movements, draws):
    return dict(schema=1, schedule='MMG test', transactions_asat=last,sales_asat=last,
                period_start=first+'T00:00:00',period_end=last+'T23:59:59',draws=draws,movements=movements)


def move(key,day,end=''):
    return dict(event_key=key,start=day,start_time='05:00:00',end=end,end_time='18:00:00' if end else '')


class Archive(unittest.TestCase):
    def test_expired_records_recounts_and_equal_legitimate_sales_survive_rebuilds(self):
        day0 = '2026-11-22'; day1 = '2026-11-25';day2='2026-11-27'
        old = snapshot(day0,day1,[move('a',day0),move('b',day1),move('withdrawn',day1)],
                       [{'date':day0,'quantity':2},{'date':day1,'quantity':3}])
        qr_facts.reconcile(old,None,set())
        fresh=snapshot(day1,day2,[move('b',day1,day2)], [{'date':day1,'quantity':5},{'date':day1,'quantity':5}])
        fresh_copy=copy.deepcopy(fresh);qr_facts.reconcile(fresh,old,set())
        self.assertEqual([r['event_key'] for r in fresh['movements']],['b','a'])
        self.assertEqual([r['quantity'] for r in fresh['draws']],[5,5,2]);self.assertEqual(len(fresh['transaction_periods']),1)
        qr_facts.reconcile(fresh_copy,fresh,set());self.assertEqual(fresh,fresh_copy)

    def test_gap_and_foreign_schedule(self):
        old=snapshot('2026-11-22','2026-11-23',[],[]);qr_facts.reconcile(old,None,set())
        new=snapshot('2026-11-26','2026-11-27',[],[]);qr_facts.reconcile(new,old,set())
        self.assertEqual(len(new['transaction_periods']),2)
        old['schedule']='other';fresh=snapshot('2026-11-26','2026-11-27',[],[]);qr_facts.reconcile(fresh,old,set())
        self.assertEqual(len(fresh['transaction_periods']),1)

    def test_approved_display_names_use_exact_asset_or_explicit_transaction_ownership(self):
        from build_showcase import _approved_asset_name
        raw = 'Old cordless wrench description'
        label = 'Impact Wrench - Cordless - 3/4 Inch Drive (19mm) - 18V - Milwaukee'
        label_for = lambda source, owner: _approved_asset_name(source, owner, {raw.upper(): label})
        owners = {('A', raw.upper()): {'MMG'}, ('B', raw.upper()): {'Coates'},
                  ('C', raw.upper()): {'MMG', 'Coates'}}
        facts = {'hires': [dict(item=i, name=raw) for i in ('A', 'B', 'C')],
                 'movements': [dict(item='A', name=raw, event_key='tx-A'),
                               dict(item='B', name=raw, event_key='tx-B'),
                               dict(item='A', name='Different item text', event_key='tx-unknown'),
                               dict(item='A', name=raw, event_key='legacy')]}
        qr_facts.apply_asset_labels(facts, owners, {'tx-A': {'Coates'}, 'tx-B': {'Coates','MMG'}}, label_for)
        self.assertEqual([r['name'] for r in facts['hires']], [label+' (MMG Owned)', label, label])
        self.assertEqual([r['name'] for r in facts['movements']], [label, label, 'Different item text', label+' (MMG Owned)'])
        first = copy.deepcopy(facts)
        qr_facts.apply_asset_labels(facts, {}, {}, label_for)
        self.assertEqual(facts, first)
        self.assertEqual([r['event_key'] for r in facts['movements']], ['tx-A','tx-B','tx-unknown','legacy'])
