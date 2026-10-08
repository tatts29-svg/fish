"""Author: Andrew Fisher. Pure source/model guards; optional exact HTML integration. No network writes."""
import copy, json, os, re, sys, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from fencing_extract951 import scalar, date_of, extract, CON, SOURCE_SHA
from fencing951 import refresh_fencing, apply_fencing951
SOURCE=json.loads((ROOT/'fencing_source951.json').read_text())
F='Temporary Fence (m) — '; C='Crowd Control Barriers (m) — '
def baseline():
    return {'source_file':'old.xlsx','programme_year':2026,'installation_plans':{'unchanged':[1,2]},'week_sheets':[{'sheet':w['sheet'],'phase':'Deconstruction' if w['sheet'].startswith('DECON') else 'Construction','year':2025 if w['sheet'].startswith('DECON') else 2026,'rolled_forward':False,'days':[],'totals':{},'plan_update':None} for w in SOURCE['weeks']]}
def byweek(f,name):return next(w for w in f['week_sheets'] if w['sheet']==name)
def sw(name):return next(w for w in SOURCE['weeks'] if w['sheet']==name)
class SourceTests(unittest.TestCase):
    def test_ten_weeks_380_source_rows(self):
        self.assertEqual(len(SOURCE['weeks']),10);self.assertEqual(sum(len(w['rows']) for w in SOURCE['weeks']),380)
    def test_explicit_quantity_columns_no_date_serial(self):
        self.assertEqual(sw('CON WK6')['totals'][F+'Clean'],285)
        self.assertFalse(any('Completed' in k or 'Status' in k for w in SOURCE['weeks'] for k in w['totals']))
        self.assertFalse(any(v>=45000 for w in SOURCE['weeks'] for v in w['totals'].values()))
    def test_cw4_omitted_total_recovered(self):
        x=sw('CON WK4')['totals'];self.assertEqual((x[F+'Clean'],x[F+'Braced for Scrim'],x[C+'Demarcation']),(967,330,1432))
    def test_cw1_not_doublecounted(self):
        x=sw('CON WK1')['totals'];self.assertEqual((x[F+'Clean'],x[F+'Braced for Scrim'],x[C+'Event']),(3302.5,285,430))
    def test_cw1_history_kept_not_reassigned(self):
        r=next(r for r in sw('CON WK1')['rows'] if r['source_row']==24)
        self.assertFalse(r['included']);self.assertEqual(r['date'],'2026-09-24');self.assertEqual(r['quantities'][F+'Clean'],70)
    def test_current_date_wins_over_week_code_without_changing_source(self):
        r=next(r for r in sw('CON WK4')['rows'] if r['source_row']==23)
        self.assertTrue(r['included']);self.assertEqual(r['week_code'],'C2');self.assertTrue(r['source_warnings'])
    def test_pending_rows_excluded_not_deleted(self):
        rows=[r for r in sw('CON WK2')['rows'] if not r['included']]
        self.assertEqual([r['source_row'] for r in rows],list(range(40,47)))
        self.assertIn('NOT REQUIRED',next(r for r in rows if r['source_row']==44)['notes'][0]['text'])
    def test_demob_omitted_removal_recovered(self):self.assertEqual(sw('DECON WK1')['totals'][F+'Removal'],5244)
    def test_demob2_source_rows_not_old_hardcodes(self):
        t=sw('DECON WK2')['totals'];self.assertEqual((t[F+'Relocation'],t[F+'Removal'],t[C+'Removal'],t['Vehicle Gates']),(662,3890,3550,2))
    def test_three_2025_demob_rows_quarantined(self):
        rows=[r for r in sw('DECON WK2')['rows'] if not r['included']]
        self.assertEqual([r['source_row'] for r in rows],[65,66,67]);self.assertTrue(all(r['date'].startswith('2025') for r in rows))
    def test_unknown_is_not_zero(self):
        u=sw('CON WK6')['unquantified'];self.assertEqual(u[0]['cell'],'F9');self.assertEqual(u[0]['written'],'TBC')
        r=next(r for r in sw('CON WK6')['rows'] if r['source_row']==9);self.assertNotIn(F+'Clean',r['quantities'])
    def test_source_status_is_only_audit_count(self):
        self.assertEqual(sw('EVENT WEEK')['ignored_source_status_counts']['Complete'],3)
        self.assertFalse(any({'done','status','complete','completed_at'} & set(r) for w in SOURCE['weeks'] for r in w['rows']))
    def test_explicit_outside_scope_held_with_original_notes(self):
        r=next(r for r in sw('DECON WK3')['rows'] if r['source_row']==6)
        self.assertFalse(r['included']);self.assertEqual(r['quantities'][F+'Removal'],104)
        self.assertEqual(sw('DECON WK3')['totals'][F+'Removal'],2186)
        self.assertTrue(any('Not in iEDM Scope'==n['text'] for n in r['notes']))
    def test_sunday_demob_is_retained_before_label_monday(self):
        self.assertEqual(sw('DECON WK1')['days'][0]['date'],'2026-10-25')
        self.assertGreater(sw('DECON WK1')['days'][0]['totals'][F+'Removal'],0)
    def test_access_gate_and_billing_notes_kept(self):
        notes=' '.join(n['text'] for w in SOURCE['weeks'] for r in w['rows'] for n in r['notes'])
        for term in ['09:30-10:30','KDR inducted','3 wheels','NOT IN iEDM SCOPE','7:01am']:
            self.assertIn(term.lower(),notes.lower())
    def test_arithmetic_uses_formula_not_stale_cache(self):
        self.assertEqual(scalar({'F1':{'formula':'(12+40+21)-H1','value':'900'},'H1':{'formula':None,'value':'40'}},'F1'),33)
    def test_circular_formula_rejected(self):
        with self.assertRaises(ValueError):scalar({'F1':{'formula':'F1+2','value':'999'}},'F1')
    def test_range_formula_rejected(self):
        with self.assertRaises(ValueError):scalar({'F1':{'formula':'SUM(F1:F99)','value':'999'}},'F1')
    def test_arbitrary_formula_rejected(self):
        with self.assertRaises(ValueError):scalar({'F1':{'formula':'__import__("os").system("echo bad")','value':'999'}},'F1')
    def test_negative_unknown_and_zero_quantity(self):
        for v in ['TBC','-','', '-1']:
            with self.assertRaises(ValueError):scalar({'F1':{'value':v}},'F1')
        self.assertEqual(scalar({'F1':{'value':'0'}},'F1'),0)
    def test_dates_no_year_inference(self):
        self.assertEqual(date_of({'display':'Wed 29-Oct-2025'}),'2025-10-29');self.assertIsNone(date_of({'display':'TBC'}))
    def test_unknown_source_hash_rejected(self):
        with self.assertRaises(ValueError):extract({'sha256':'unexpected'})

class ModelTests(unittest.TestCase):
    def test_inputs_not_mutated(self):
        old=baseline();before=copy.deepcopy(old);refresh_fencing(old);self.assertEqual(old,before)
    def test_full_installation_metadata_preserved(self):
        old=baseline();new=refresh_fencing(old);self.assertEqual(old['installation_plans'],new['installation_plans'])
    def test_pdf_override_active_comparator_new(self):
        old=baseline();w=byweek(old,'CON WK5');w['plan_update']={'days_covered':['2026-09-14'],'token':'keep'}
        w['days']=[{'date':'2026-09-14','rows':99,'totals':{F+'Clean':777},'basis':'authoritative PDF','custom':'retain'}]
        n=refresh_fencing(old);nw=byweek(n,'CON WK5');d=nw['days'][0]
        self.assertEqual(d['totals'],{F+'Clean':777});self.assertEqual(d['custom'],'retain');self.assertEqual(d['basis'],'authoritative PDF');self.assertEqual(d['rows'],99)
        self.assertEqual(d['programme_totals'],sw('CON WK5')['days'][0]['totals']);self.assertEqual(nw['plan_update'],w['plan_update'])
    def test_missing_pdf_day_fails_closed(self):
        old=baseline();byweek(old,'CON WK5')['plan_update']={'days_covered':['2026-09-14']}
        with self.assertRaises(ValueError):refresh_fencing(old)
    def test_current_demob_dates_and_carryovers(self):
        n=refresh_fencing(baseline());w=byweek(n,'DECON WK2');self.assertEqual(w['year'],2026);self.assertTrue(w['rolled_forward']);self.assertTrue(all(d['date'].startswith('2026') for d in w['days']));self.assertEqual(w['held_rows951'],[65,66,67])
    def test_double_application_refused(self):
        with self.assertRaises(ValueError):refresh_fencing(refresh_fencing(baseline()))
    def test_week_order_guard(self):
        b=baseline();b['week_sheets'].reverse()
        with self.assertRaises(ValueError):refresh_fencing(b)
    def test_future_completion_words_not_actuals(self):
        n=refresh_fencing(baseline());self.assertFalse(n['source_review951']['source_statuses_used_as_actuals']);self.assertNotIn('fenceDone',n)
    def test_week_totals_equal_effective_days(self):
        for w in refresh_fencing(baseline())['week_sheets']:
            for k,v in w['totals'].items():self.assertAlmostEqual(v,sum(d['totals'].get(k,0) for d in w['days']))

@unittest.skipUnless(os.environ.get('PAGE'),'PAGE enables exact HTML integration')
class HTMLTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.before=Path(os.environ['PAGE']).read_text();cls.after=apply_fencing951(cls.before,os.environ['PAGE'])
        def data(s):return json.JSONDecoder().raw_decode(s.split('const DATA = ',1)[1])[0]
        cls.bd=data(cls.before);cls.ad=data(cls.after)
    def test_only_fencing_DATA_changed(self):
        self.assertEqual({k:v for k,v in self.bd.items() if k!='fencing'},{k:v for k,v in self.ad.items() if k!='fencing'})
    def test_costs_rates_quotes_original_source_untouched(self):
        self.assertEqual(self.bd['fence'],self.ad['fence']);self.assertEqual(self.bd['fence_contractor'],self.ad['fence_contractor'])
    def test_all_existing_pdf_covered_quantities_preserved(self):
        for before,after in zip(self.bd['fencing']['week_sheets'],self.ad['fencing']['week_sheets']):
            self.assertEqual(before['plan_update'],after['plan_update'])
            covered=set((before['plan_update'] or {}).get('days_covered',[]));bd={d['date']:d for d in before['days']};ad={d['date']:d for d in after['days']}
            for date in covered:self.assertEqual(bd[date]['totals'],ad[date]['totals'])
    def test_unchanged_footer_and_native_sync_code(self):
        self.assertEqual(re.findall(r"\+ ' · v9\.\d+'; /\* v8\.19",self.before),re.findall(r"\+ ' · v9\.\d+'; /\* v8\.19",self.after))
        self.assertEqual(self.before.count('SYNC.db'),self.after.count('SYNC.db'))
    def test_no_duplicate_application(self):
        with self.assertRaises(ValueError):apply_fencing951(self.after)
    def test_source_and_notes_hooks_once(self):
        self.assertEqual(self.after.count('function fencingNotes951('),1);self.assertEqual(self.after.count('${fencingNotes951()}'),1)
    def test_source_notes_moved_into_existing_planning_section(self):
        self.assertIn("const sourceNotes951=children.find(e=>e.id==='fencing-source951'); if(sourceNotes951) working.append(sourceNotes951);",self.after)
    def test_no_stale_demob_claim_in_renderers(self):
        self.assertNotIn('the removal weeks in that file still carry 2025 dates',self.after)
    def test_native_record_literals_unchanged(self):
        # Compare literal COMMITTED data if present: no fenced completion or money history is rewritten.
        marker='const COMMITTED = '
        if marker in self.before:
            d=lambda s:s.split(marker,1)[1].split('\n',1)[0]
            self.assertEqual(d(self.before),d(self.after))
if __name__=='__main__':unittest.main(verbosity=2)
