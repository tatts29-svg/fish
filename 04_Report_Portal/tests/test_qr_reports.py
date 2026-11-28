import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qr_reports as qr


class ScopedReports(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.dir = Path(temp.name)
        self.a = dict(hirer='Alex Smith', employer='A LTD', company='A Ltd', hirer_id='')
        self.b = dict(hirer='Alex Smith', employer='B LTD', company='B Ltd', hirer_id='')
        self.other = dict(hirer='Other Worker', employer='A LTD', company='A Ltd', hirer_id='')
        self.facts = dict(schema=1, project=qr.MMG_PROJECT, schedule=qr.MMG_SCHEDULE, asat='2026-11-28T05:30', sales_asat='2026-11-28T04:45',
                          transactions_asat='2026-11-28T05:00', period_start='2026-11-24T05:00:00', period_end='2026-11-28T04:59:59',
                          hires=[], movements=[], draws=[], workers=[self.a,self.b,self.other]);
        for who, asset in [(self.a,'A-1'),(self.b,'B-CONFIDENTIAL'),(self.other,'OTHER-PRIVATE')]:
            self.facts['hires'].append(dict(who,item=asset,name='Battery',date='2026-11-25',time='06:00'))
        for i, day in enumerate(['25','25','25','25','26']):
            self.facts['movements'].append(dict(self.a,item=f'A-{i}',name='Battery',start='2026-11-25',start_time='06:00:00',
                                                end='2026-11-'+day,end_time='11:00:00'))
        self.facts['movements'].append(dict(self.b,item='B-MOVEMENT',name='Other company tool',start='2026-11-25',start_time='06:00:00',end='',end_time=''))
        self.facts['draws']=[dict(self.a,name='Gloves',quantity=5,returned=1,date='2026-11-25'), dict(self.a,name='Gloves',quantity=3,returned=0,date=''),
                             dict(self.b,name='B-CONSUMABLE',quantity=112,returned=0,date='2026-11-25')]
        self.person=dict(hirer='Alex Smith',name='Alex Smith',company='A LTD',barcode='00-aA',person_id='stable-A')
        self.roster={'schedule':qr.MMG_SCHEDULE,'people':[self.person]}
        self.save()

    def save(self):
        for name, data in [('qr-report-data.json',self.facts),('qr-identities.json',self.roster)]:
            (self.dir/name).write_text(json.dumps(data),encoding='utf-8')

    def test_company_selector_and_selected_company_projection(self):
        directory = qr.companies(self.dir)['companies']
        self.assertEqual([r['name'] for r in directory],['A Ltd','B Ltd'])
        self.assertTrue(all(set(r)=={'id','name'} for r in directory))
        a = qr.company(self.dir,directory[0]['id'])
        self.assertEqual(a['hire_count'],2)
        self.assertEqual(a['hires'][0]['count'],2)
        serialized=json.dumps(a)
        self.assertEqual({item['holder'] for group in a['hires'] for item in group['items']},
                         {'Alex Smith', 'Other Worker'})
        for secret in ('B-CONFIDENTIAL','B-MOVEMENT','B-CONSUMABLE','barcode','hirer_id','movements'):
            self.assertNotIn(secret,serialized)
        self.assertIsNone(qr.company(self.dir,'A Ltd'))

    def test_crew_return_list_revision_tracks_published_shift_instructions(self):
        company_id = qr.companies(self.dir)['companies'][0]['id']
        before = qr.company(self.dir, company_id)
        self.facts['return_instruction'] = dict(day_shift_date='2026-11-30', night_shift_date='2026-11-30',
            night_finish_date='2026-12-01', day_store_finish='18:00', night_store_finish='06:00',
            timezone='AEST', snapshot_stage='before_final_shifts')
        self.save()
        revised = qr.company(self.dir, company_id)
        self.assertEqual(before['return_groups'], revised['return_groups'])
        self.assertNotEqual(before['return_list_revision'], revised['return_list_revision'])
        self.facts['return_instruction']['private_note'] = 'Excluded from scoped reports'
        self.save()
        same = qr.company(self.dir, company_id)
        self.assertNotIn('private_note', same['return_instruction'])
        self.assertEqual(same['return_list_revision'], revised['return_list_revision'])

    def test_exact_person_only_and_score_discloses_denominator(self):
        a=qr.personal(self.dir,'00-aA'); raw=json.dumps(a)
        for secret in ('B-CONFIDENTIAL','B-MOVEMENT','B-CONSUMABLE','OTHER-PRIVATE','Other Worker','00-aA','stable-A'):
            self.assertNotIn(secret,raw)
        self.assertEqual(a['hire_count'],1)
        self.assertEqual((a['returns']['eligible'],a['returns']['same_day'],a['returns']['score']),(5,4,4.0))
        self.assertFalse(a['returns']['due_dates_available'])
        self.assertEqual(a['consumable_summary']['units'],8)
        self.assertEqual(a['consumable_summary']['units_per_draw_day'],5)
        self.assertEqual(a['consumable_summary']['returned_units'],1)
        self.assertEqual(sum(row['consumable_returns'] for row in a['activity']),0)
        self.assertEqual(a['history'],[])
        for bad in ('00-AA','00-aA ','aA',' B LTD','Alex Smith','A-1',12,None):
            self.assertIsNone(qr.personal(self.dir,bad))

    def test_open_short_and_impossible_records_do_not_create_a_return_score(self):
        records=self.facts['movements']; records[0]['end']='';records[1]['end']='2026-11-20';records[2]['start']='2026-11-20'
        records[3]['due']='2026-11-24'; self.save(); stats=qr.personal(self.dir,'00-aA')['returns']
        self.assertEqual((stats['eligible'],stats['same_day'],stats['score']),(2,1,None))
        self.assertEqual((stats['due_assessed'],stats['returned_by_due']),(1,0))

    def test_duplicate_badges_or_same_employer_names_or_wrong_schedule_are_denied(self):
        for peer in [dict(self.person,barcode='different'),dict(self.person,company='B LTD')]:
            self.roster['people']=[self.person,peer]; self.save()
            self.assertIsNone(qr.personal(self.dir,'00-aA'))
        self.roster['people']=[self.person]; self.roster['schedule']='Other';self.save()
        self.assertIsNone(qr.personal(self.dir,'00-aA'))
        self.roster['schedule']=qr.MMG_SCHEDULE
        self.facts['workers'] += [dict(self.a,hirer_id='123'),dict(self.a,hirer_id='321')]; self.save()
        self.assertIsNone(qr.personal(self.dir,'00-aA'))

    def test_prior_history_requires_an_explicit_verified_link_to_matching_snapshot(self):
        old='MMG Shutdown September'; folder=self.dir/'qr_history';folder.mkdir()
        filename=hashlib.sha256(old.encode()).hexdigest()+'.json'
        (folder/filename).write_text(json.dumps(dict(self.facts,schedule=old)))
        self.assertEqual(qr.personal(self.dir,'00-aA')['history'],[])
        self.person['history']=[{'schedule':old,'hirer':'Alex Smith','company':'A LTD'}]; self.save()
        history=qr.personal(self.dir,'00-aA')['history']
        self.assertEqual([(row['schedule'],row['eligible']) for row in history],[(old,5)])
        self.roster['people'].append(dict(name='Other',hirer='Other Worker',company='A LTD',person_id='other',barcode='123',history=self.person['history']))
        self.save(); self.assertEqual(qr.personal(self.dir,'00-aA')['history'],[])

    def test_high_usage_requires_anonymised_comparators_in_same_period(self):
        self.assertEqual(qr.personal(self.dir,'00-aA')['consumable_summary']['benchmark']['status'],'insufficient')
        for i in range(10):
            self.facts['draws'].append(dict(self.other,hirer=f'PrivateComparator-{i}',name='Unlisted',quantity=2,
                                            returned=0,date='2026-11-26'))
        self.save(); personal=qr.personal(self.dir,'00-aA'); benchmark=personal['consumable_summary']['benchmark']
        self.assertEqual((benchmark['status'],benchmark['own_units']),('high',5))
        self.assertNotIn('threshold_units', benchmark)
        self.assertNotIn('reference_users', benchmark)
        self.assertNotIn('PrivateComparator', json.dumps(personal))
        self.assertNotIn('Unlisted', json.dumps(personal))

    def test_missing_sections_in_export_coverage_are_preserved(self):
        self.facts['transaction_periods'] = [{'start':'2026-11-24T05:00:00','end':'2026-11-25T00:00:00'},
                                             {'start':'2026-11-26T00:00:00','end':'2026-11-28T04:59:59'}]
        self.save(); personal=qr.personal(self.dir,'00-aA');self.assertEqual(personal['returns']['eligible'],0)
        self.assertEqual(personal['returns']['issues'],0);self.assertEqual(personal['returns']['returned'],1)

    def test_company_timeline_includes_returned_work_and_privately_scopes_every_aggregate(self):
        self.facts['hires'] = [r for r in self.facts['hires'] if r['company'] != 'A Ltd']
        self.save()
        selected = next(row['id'] for row in qr.companies(self.dir)['companies'] if row['name']=='A Ltd')
        report=qr.company(self.dir,selected)
        self.assertEqual(report['hire_count'],0)
        story=report['story'][0];self.assertTrue(story['current'])
        self.assertEqual((story['issues'], story['returned'], story['consumable_units'], story['consumable_returns']), (5,5,8,1))
        self.assertEqual(story['equipment'],[{'name':'Battery','issued':5,'returned':5}])
        self.assertEqual((story['first_date'], story['last_date'], story['activity_days']), ('2026-11-25','2026-11-26',2))
        serialized=json.dumps(story)
        for withheld in ('A-1','B-MOVEMENT','B-CONSUMABLE','B LTD','B Ltd','Other Worker','Alex Smith', 'hirer_id'):
            self.assertNotIn(withheld,serialized)

    def test_archives_must_prove_same_project_employer_and_scope(self):
        archived = self.dir/'qr_history';archived.mkdir()
        def put(label,data):
            path=archived/(hashlib.sha256(label.encode()).hexdigest()+'.json')
            path.write_text(json.dumps(dict(data,schedule=label)))
        old='MMG earlier works';other='Foreign site'; moved='Moved company'
        # Historical label differs; the raw legal employer is identical.
        earlier = dict(self.facts)
        for source in ('hires','draws','movements'):
            earlier[source] = [dict(r, company='Historic A Display') if r['employer']=='A LTD' else r
                               for r in self.facts[source]]
        put(old,earlier)
        only=dict(self.other,hirer='Never disclose',company='Prior only',employer='PRIOR ONLY LEGAL')
        put('Another earlier MMG shut',dict(self.facts,hires=[],draws=[],movements=[dict(self.facts['movements'][0],**only)]))
        put(other,dict(self.facts,project='Not MMG Dugald'))
        put(moved,dict(self.facts,hires=[],draws=[],movements=[dict(self.facts['movements'][0],employer='DIFFERENT EMPLOYER WITH SAME DISPLAY')]))
        directory={row['name']:row['id'] for row in qr.companies(self.dir)['companies']}
        self.assertNotIn('Historic A Display',directory)
        history=qr.company(self.dir,directory['A Ltd'])['story']
        self.assertEqual([r['schedule'] for r in history],[qr.MMG_SCHEDULE,old]);self.assertTrue(history[0]['current']);self.assertFalse(history[1]['current'])
        prior=qr.company(self.dir,directory['Prior only']);self.assertEqual(prior['hire_count'],0)
        self.assertEqual([r['issues'] for r in prior['story']],[0,1]);self.assertNotIn('Never disclose',json.dumps(prior))
        personal=qr.personal(self.dir,'00-aA')
        self.assertEqual([s['schedule'] for s in personal['story']],[qr.MMG_SCHEDULE])
        self.assertNotIn('DIFFERENT EMPLOYER',json.dumps(history))
