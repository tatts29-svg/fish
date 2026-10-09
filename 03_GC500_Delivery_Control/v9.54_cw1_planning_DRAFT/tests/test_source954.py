"""Author: Andrew Fisher. Independent source facts, bounded effects and strict release guards."""
import copy
import json
import os
import sys
import unittest
from pathlib import Path

HERE=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(HERE))
from cw1_954 import apply_cw1, totals, CATEGORIES
from patch_v954 import apply_html

BASE=Path(os.environ.get('BASE_PAGE',str(HERE.parent/'build/GC500_v9.52/GC500_Delivery_Control_hosted.html')))
HTML=BASE.read_bytes().decode('utf-8-sig')
START=HTML.index('const DATA = ')+len('const DATA = ')
DATA,_=json.JSONDecoder().raw_decode(HTML[START:])
F=DATA['fencing']
SOURCE=json.loads((HERE/'source954.json').read_text())

class Source954(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original=copy.deepcopy(F);cls.changed=apply_cw1(F)
        cls.old=next(w for w in F['week_sheets'] if w['sheet']=='CON WK1')
        cls.week=next(w for w in cls.changed['week_sheets'] if w['sheet']=='CON WK1')
        cls.plan=cls.week['plan_update'];cls.rows=[r for d in cls.plan['rows_by_day'] for r in d['rows']]
        cls.byid={r['id']:r for r in cls.rows}
    def test_no_input_mutation(self): self.assertEqual(F,self.original)
    def test_other_weeks_identical(self):
        self.assertEqual([w for w in F['week_sheets'] if w['sheet']!='CON WK1'],[w for w in self.changed['week_sheets'] if w['sheet']!='CON WK1'])
    def test_original_programme_rows_and_totals_preserved(self):
        for k in ['programme_rows951','programme_totals','programme_unquantified951','held_rows951','source_statuses_ignored951']:
            self.assertEqual(self.old[k],self.week[k],k)
    def test_prior_installation_plans_unchanged(self):
        self.assertEqual(F['installation_plans']['plans'],self.changed['installation_plans']['plans'][:-1])
    def test_2025_and_September_carryovers_not_activated(self):
        self.assertNotIn(24,[r['source_row951'] for r in self.rows])
        self.assertEqual(F['not_rolled_forward'],self.changed['not_rolled_forward'])
    def test_original_hash_and_pages(self):
        self.assertEqual(self.plan['sha256'],'d7287c2cb05f69677d954c6daf9bd086666ba54535ecb91e7d8fe6e0847fa661')
        self.assertEqual(self.plan['pages'],23)
    def test_same_57_unique_tasks(self):self.assertEqual((len(self.rows),len(self.byid)),(57,57))
    def test_daily_and_weekly_total_from_selected_tasks(self):
        self.assertEqual(self.week['totals'],totals(self.rows))
        for day in self.week['days']:
            self.assertEqual(day['totals'],totals([r for r in self.rows if r['date']==day['date']]))
    def test_independently_expected_week(self):
        self.assertEqual(self.week['totals'],dict(zip(CATEGORIES,[3177,705,142,569,50,21,430,1464,90])))
    def test_bracing_now_not_clean(self):
        self.assertEqual(self.byid['cw1-40']['fields'],{CATEGORIES[1]:185})
        self.assertEqual(self.byid['cw1-41']['fields'],{CATEGORIES[1]:190})
    def test_Cypress_duplicate_once(self):
        rows=[r for r in self.rows if r['source_row951']==62]
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['fields'],{CATEGORIES[0]:240,CATEGORIES[4]:2})
        self.assertEqual(rows[0]['source_pages954'],[18,21,22])
    def test_Pit_Thursday_once_retains_original_date(self):
        row=self.byid['cw1-61'];self.assertEqual(row['date'],'2026-10-15')
        self.assertIn('Friday',row['date_as_written954']);self.assertEqual(row['programme_date954'],'2026-10-16')
        self.assertEqual(row['fields'],{CATEGORIES[2]:45,CATEGORIES[3]:220,CATEGORIES[4]:3})
    def test_Gate6_Thursday_once(self):
        row=self.byid['cw1-gate6'];self.assertEqual(row['date'],'2026-10-15')
        self.assertEqual(row['fields'],{CATEGORIES[0]:45,CATEGORIES[1]:45});self.assertIn('Wednesday',row['date_as_written954'])
    def test_stockpile_not_extra_install(self):
        x=self.plan['stockpile_evidence954'][0];self.assertEqual(x['fields'],{CATEGORIES[6]:50})
        self.assertFalse(x['additional_forecast']);self.assertNotIn('stockpile50',self.byid)
    def test_Spit_prior_scope_pending(self):
        row=self.byid['cw1-60'];self.assertEqual(row['fields'],{CATEGORIES[0]:85,CATEGORIES[2]:35,CATEGORIES[4]:1})
        self.assertEqual(row['review_state954'],'prior allowance pending review')
        issue=next(c for c in self.plan['conflicts'] if c['id']=='spit-scope');self.assertIn('190 m',issue['summary'])
    def test_Monster_strike_not_cancellation(self):
        row=self.byid['cw1-51'];self.assertEqual(row['fields'],{CATEGORIES[0]:135,CATEGORIES[4]:1})
        self.assertIn('monster-struck',row['conflicts']);self.assertEqual(row['review_state954'],'prior allowance pending review')
    def test_legacy_omissions_all_preserved(self):
        expected={28,38,42,48,49,50,52,53,54,55,56,65}
        legacy={r['source_row951']:r for r in self.rows if r['id'].startswith('cw1-programme-')}
        self.assertEqual(set(legacy),expected)
        for n,r in legacy.items():
            before=next(x for x in self.old['programme_rows951'] if x['source_row']==n)
            self.assertEqual(r['fields'],before['quantities']);self.assertEqual(r['date'],before['date'])
    def test_missing_quantity_not_zero(self):self.assertEqual(self.byid['cw1-programme-48']['fields'],{})
    def test_no_prebilled_or_completed_import(self):
        self.assertFalse(self.changed['source_review954']['source_dates_used_as_completion'])
        self.assertFalse(self.plan['printed_totals_used954'])
        self.assertFalse(self.changed['source_review954']['original_uploaded'])
    def test_current_crew_and_access(self):
        requirements=json.dumps(self.byid['cw1-59']['requirements'])
        self.assertIn('Scottie and Wayne',requirements)
        self.assertIn('06:00',requirements)
        self.assertIn('meriton-access',self.byid['cw1-63']['conflicts'])
        for n in [45,46,47]:self.assertIn('after 12:00',self.byid[f'cw1-{n}']['requirements'][0]['text'])
    def test_individual_phase_units_retained(self):
        self.assertEqual(self.byid['cw1-20']['fields'],{CATEGORIES[8]:90})
        self.assertEqual(self.byid['cw1-37']['fields'],{CATEGORIES[6]:30})
    def test_reapply_refused(self):
        with self.assertRaisesRegex(ValueError,'already applied'):apply_cw1(self.changed)
    def test_changed_source_refused(self):
        src=copy.deepcopy(SOURCE);src['sha256']='f'*64
        with self.assertRaisesRegex(ValueError,'Unreviewed'):apply_cw1(F,src)
    def test_invalid_source_quantities_refused(self):
        for value in [True,-1,float('nan'),'100']:
            with self.subTest(value=value):
                src=copy.deepcopy(SOURCE);src['rows'][0]['fields'][CATEGORIES[0]]=value
                with self.assertRaisesRegex(ValueError,'quantity'):apply_cw1(F,src)
    def test_wrong_year_refused(self):
        src=copy.deepcopy(SOURCE);src['rows'][0]['date']='2025-10-12'
        with self.assertRaisesRegex(ValueError,'2026 week'):apply_cw1(F,src)
    def test_fractional_gate_refused(self):
        src=copy.deepcopy(SOURCE);src['rows'][0]['fields']['Ped. Gates']=1.5
        with self.assertRaisesRegex(ValueError,'Fractional'):apply_cw1(F,src)
    def test_duplicate_source_identity_refused(self):
        src=copy.deepcopy(SOURCE);src['rows'][1]['id']=src['rows'][0]['id']
        with self.assertRaisesRegex(ValueError,'identities'):apply_cw1(F,src)
    def test_bad_page_refused(self):
        src=copy.deepcopy(SOURCE);src['rows'][0]['source_pages954']=[24]
        with self.assertRaisesRegex(ValueError,'page'):apply_cw1(F,src)
    def test_intervening_plan_refused(self):
        f=copy.deepcopy(F);next(w for w in f['week_sheets'] if w['sheet']=='CON WK1')['plan_update']={'revision':'newer'}
        with self.assertRaisesRegex(ValueError,'intervening'):apply_cw1(f)
    def test_foreign_programme_refused(self):
        f=copy.deepcopy(F);f['source_sha256']='f'*64
        with self.assertRaisesRegex(ValueError,'programme base'):apply_cw1(f)
    def test_release_requires_953(self):
        if " · v9.52'; /* v8.19" in HTML:
            with self.assertRaisesRegex(ValueError,'preceding release'):apply_html(HTML)
    def test_exact_release_and_no_other_DATA_changes(self):
        version='9.53' if " · v9.53'; /* v8.19" in HTML else '9.52'
        patched=apply_html(HTML,base_version=version,advance_footer=False)
        start=patched.index('const DATA = ')+len('const DATA = ');data,_=json.JSONDecoder().raw_decode(patched[start:])
        self.assertEqual({k:v for k,v in data.items() if k!='fencing'},{k:v for k,v in DATA.items() if k!='fencing'})
        with self.assertRaisesRegex(ValueError,'already applied'):apply_html(patched,base_version=version)

if __name__=='__main__':unittest.main(verbosity=2)
