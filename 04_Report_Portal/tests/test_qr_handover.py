import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qr_reports as qr


def movement(item, start, end='', person='Worker A', employer='Acme', company='Acme'):
    date, _, clock = start.partition('T')
    returned, _, return_clock = end.partition('T')
    return dict(hirer=person, employer=employer, company=company, hirer_id='', item=item,
                name='Tool '+item, start=date, start_time=clock, end=returned, end_time=return_clock)


def hire(item, at, person='Worker A', employer='Acme', profile=None):
    date, _, clock = at.partition('T')
    return dict(item=item, name='Tool '+item, hirer=person, employer=employer, company='Acme',
                hirer_id=profile or '', date=date, time=clock)


class Handover(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.data = dict(schema=1, project=qr.MMG_PROJECT, schedule=qr.MMG_SCHEDULE,
                         asat='2026-09-05T07:15', transactions_asat='2026-09-05T07:09',
                         sales_asat='2026-09-05T06:55', period_start='2026-09-02T05:00:00',
                         period_end='2026-09-05T04:59:59', hires=[], movements=[], draws=[])
        person=dict(hirer='Worker A', name='Worker A', company='Acme', barcode='worker-card')
        (self.root/'qr-identities.json').write_text(json.dumps(dict(schedule=qr.MMG_SCHEDULE, people=[person])))

    def reports(self):
        (self.root/'qr-report-data.json').write_text(json.dumps(self.data))
        key=next(r['id'] for r in qr.companies(self.root)['companies'] if r['name']=='Acme')
        return qr.company(self.root,key), qr.personal(self.root,'worker-card')

    def test_company_and_worker_scoping_and_exact_returns(self):
        self.data['hires']=[hire('new','2026-09-05T06:15'), hire('old','2026-09-02T07:15','Crew B','Acme Engineering'),
                            hire('same-minute','2026-09-02T07:15','Crew B','Acme Engineering')]
        self.data['movements']=[
            movement('old','2026-09-02T07:15:01',person='Crew B',employer='Acme Engineering'),
            movement('same-minute','2026-09-02T07:15:20',person='Crew B',employer='Acme Engineering'),
            movement('A','2026-09-04T06:00:00','2026-09-04T17:59:59'),
            movement('B','2026-09-04T17:00:00','2026-09-04T17:59:59'),
            movement('C','2026-09-04T18:00:00'),movement('BAD','2026-09-04T11:00:00','2026-09-04T10:59:59'),
            movement('away','2026-09-04T10:00:00','2026-09-04T17:59:59','Outside Person','Other','Other')]
        company,worker=self.reports()
        h=company['handover'];shift=h['shift']
        self.assertEqual((shift['start'],shift['end'],shift['issued'],shift['returned']),
                         ('2026-09-04T06:00','2026-09-04T18:00',2,2))
        self.assertEqual(shift['peak_issue_hours'], ['2026-09-04T06:00','2026-09-04T17:00'])
        self.assertEqual(shift['peak_return_hours'], ['2026-09-04T17:00'])
        self.assertEqual(len(shift['hourly']),12)
        self.assertEqual((h['oldest']['issued_at'],h['oldest']['elapsed_minutes'],h['oldest']['tied_count']),
                         ('2026-09-02T07:15:01',4320,1))
        self.assertEqual((h['current_holders'],h['unassigned_assets'],h['oldest']['holder']), (2,0,'Crew B'))
        self.assertEqual(company['return_rating'],dict(score=None,eligible=2,same_day=2))
        self.assertEqual(company['handover']['latest_return'],worker['handover']['latest_return'])
        self.assertEqual(worker['handover']['last_activity_date'],'2026-09-05')
        self.assertEqual(worker['handover']['latest_return']['count'],2)
        self.assertEqual(worker['handover']['latest_return']['returned_at'],'2026-09-04T17:59:59')
        self.assertEqual([r['item'] for r in worker['handover']['latest_return']['items']],['A','B'])
        self.assertNotIn('holder',worker['hires'][0]['items'][0])
        self.assertNotIn('Crew B',json.dumps(worker));self.assertNotIn('Outside Person',json.dumps(company))
        self.assertNotIn('away',json.dumps(company));self.assertNotIn('worker-card',json.dumps(company))

    def test_night_coverage_gaps_and_empty_observed_shift(self):
        start=dt.datetime(2026,9,4,18); end=dt.datetime(2026,9,5,6)
        self.data['transaction_periods']=[dict(start='2026-09-04T18:00:00',end='2026-09-04T23:59:59'),
                                         dict(start='2026-09-05T00:00:00',end='2026-09-05T05:59:59')]
        self.assertEqual(qr._completed_shift(self.data),(start,end))
        quiet=qr._shift_counts(self.data,[])
        self.assertEqual((quiet['name'],quiet['issued'],quiet['returned'],quiet['peak_issue_hours']),('Night',0,0,[]))
        self.data['transaction_periods'][1]['start']='2026-09-05T00:00:01'
        self.assertIsNone(qr._completed_shift(self.data))
        self.data['transaction_periods'][1]['start']='2026-09-05T00:00:00'
        self.data['transactions_asat']='2026-09-05T05:59'
        self.assertIsNone(qr._completed_shift(self.data))

    def test_partial_coverage_and_missing_clocks_prevent_false_zero_or_exact_receipt(self):
        self.data['hires']=[hire('e','2026-09-03')]
        self.data['movements']=[movement('e','2026-09-04T07:00:00','2026-09-04'),
                                movement('f','2026-09-04T08:00:00','2026-09-04T12:01:08')]
        c,w=self.reports()
        sh=c['handover']['shift'];self.assertIsNone(sh['returned'])
        self.assertEqual(sh['issued'],2);self.assertTrue(all(r['returned'] is None for r in sh['hourly']))
        self.assertEqual(sh['peak_return_hours'],[])
        self.assertEqual((w['handover']['latest_return']['precision'],w['handover']['latest_return']['count']),('date',2))
        self.assertIsNone(c['handover']['oldest']['elapsed_minutes'])
        self.data['transaction_periods']=[dict(start='2026-09-04T06:00:00',end='2026-09-04T17:59:59')]
        self.assertIsNone(self.reports()[0]['handover']['shift']['returned'])
        self.data.update(asat='', transaction_periods=[])
        c,w=self.reports()
        self.assertIsNone(c['handover']['shift']);self.assertIsNone(c['handover']['oldest'])
        self.assertIsNone(c['handover']['current_holders']);self.assertIsNone(w['handover']['latest_return'])

    def test_named_profiles_shared_accounts_and_ambiguous_names(self):
        records=dict(hires=[hire('a','2026-09-02T09:15','Taylor - Smith',profile='1'),
                           hire('b','2026-09-02T09:15','Taylor Smith',profile='2'),
                           hire('c','2026-09-02T09:15','Taylor Smith'), hire('d','2026-09-02T09:15',''),
                           hire('e','2026-09-02T09:15','Tool Store Consumables Issue')],
                     movements=[],draws=[])
        self.data.update(records)
        c,_=self.reports(); h=c['handover']
        self.assertEqual((h['current_holders'], h['unassigned_assets'], h['oldest']['tied_count']), (2,3,5))
        self.assertEqual({r['item']:r['holder'] for g in c['hires'] for r in g['items']},
                         {'a':'Taylor Smith','b':'Taylor Smith','c':None,'d':None,'e':None})
        self.assertEqual([(g['holder'],[a['item'] for a in g['items']]) for g in c['return_groups']],
                         [('Taylor Smith (record 1 of 2)', ['a']), ('Taylor Smith (record 2 of 2)', ['b']),
                          (None, ['c','d','e'])])
        self.assertNotIn('"hirer_id"',json.dumps(c))
        self.data['hires'].append(hire('f',''))
        self.assertIsNone(self.reports()[0]['handover']['oldest'])

    def test_uncovered_later_transaction_not_reported_as_last_receipt(self):
        self.data['movements']=[movement('a','2026-09-04T09:00:00','2026-09-04T15:12:40'),
                                movement('b','2026-09-04T09:30:00','2026-09-05T05:30:20')]
        c,w=self.reports();self.assertEqual(w['handover']['latest_return']['returned_at'],'2026-09-04T15:12:40')
        self.assertEqual(c['handover']['latest_return']['count'],1)

    def test_store_frequency_collapses_one_holder_minute_across_sources(self):
        self.data['hires']=[hire('a','2026-09-04T09:00','Worker A'),hire('c','2026-09-05T06:30')]
        self.data['movements']=[movement('a','2026-09-04T09:00:05'),movement('b','2026-09-04T09:00:22',
                                '2026-09-04T13:12:05'),movement('second-profile','2026-09-04T09:00:22',person='Crew B')]
        def draw(date,**kw):
            row=dict(hirer='Worker A',employer='Acme',company='Acme',name='Gasket',quantity=3,returned=0,date=date)
            row.update(kw);return row
        self.data['draws']=[draw('2026-09-04',time='09:00'),draw('2026-09-04',time='13:12',returned=1),
                            draw('2026-09-04',time='17:00',return_date='2026-09-05',return_time='06:30',returned=1),
                            draw('2026-09-03'),draw('',quantity=4)]
        company,person=self.reports()
        a=person['store_activity']
        self.assertTrue(a['has_coverage'])
        self.assertEqual((a['active_days'],a['first_at'],a['last_at']), (3,'2026-09-03','2026-09-05T06:30'))
        self.assertEqual((a['interactions'],a['timed_events'],a['date_only_events'],a['undated_events']), (4,8,1,2))
        self.assertEqual((a['first_timed_at'],a['hourly'][9],a['busiest_hours']),
                         ('2026-09-04T09:00',dict(hour=9,interactions=1,events=3),[6,9,13,17]))
        self.assertEqual(company['store_activity']['hourly'][9],dict(hour=9,interactions=2,events=4))
        self.assertEqual(company['store_activity']['busiest_hours'],[9])
        self.assertEqual(sum(r['interactions'] for r in a['daily']), a['interactions'])
        self.assertEqual(a['daily'][0],dict(date='2026-09-03',interactions=0,timed_events=0,date_only_events=1,
                         first_timed_at=None,last_timed_at=None,first_at='2026-09-03',last_at='2026-09-03'))
        self.assertEqual((a['daily'][1]['first_timed_at'], a['daily'][1]['last_timed_at']),
                         ('2026-09-04T09:00','2026-09-04T17:00'))
        self.assertNotIn('timed_minutes',company['store_activity'])
        self.assertEqual(a['timed_minutes'],[dict(at='2026-09-05T06:30',events=2),
                         dict(at='2026-09-04T17:00',events=1), dict(at='2026-09-04T13:12',events=2),
                         dict(at='2026-09-04T09:00',events=3)])
        self.assertEqual(sum(r['events'] for r in a['timed_minutes']),a['timed_events'])

    def test_store_date_only_last_record_and_undated_export(self):
        self.data['movements']=[movement('old','2026-09-03T08:10:15','2026-09-04T09:55:05')]
        self.data['draws']=[dict(hirer='Worker A',employer='Acme',company='Acme',name='Part',quantity=1,returned=0,date='2026-09-04')]
        a=self.reports()[0]['store_activity']
        self.assertEqual((a['last_at'],a['last_timed_at'],a['date_only_events']),('2026-09-04','2026-09-04T09:55:05',1))
        self.data.update(asat='',transactions_asat='',sales_asat='',period_start='',period_end='',
                         draws=[],movements=[],hires=[hire('m','','')])
        a=self.reports()[0]['store_activity']
        self.assertFalse(a['has_coverage'])
        self.assertEqual((a['active_days'],a['interactions'],a['first_at'],a['busiest_hours']), (0,0,None,[]))

    def test_store_shared_profile_events_and_stock_clock_enrichment(self):
        self.data['hires']=[hire('a','2026-09-04T06:35')]
        self.data['movements']=[movement('a','2026-09-04'),movement('b','2026-09-04T13:05:38',person='Tool Store Consumables Issue')]
        a=self.reports()[0]['store_activity']
        self.assertEqual((a['timed_events'],a['date_only_events'],a['interactions'],a['unattributed_timed_events']), (2,0,1,1))
        self.assertEqual(a['busiest_hours'],[6]);self.assertEqual(a['hourly'][13],dict(hour=13,interactions=0,events=1))
