"""Author: Andrew Fisher. Portable synthetic checks for task-level cartage guards."""
import json
import subprocess
import unittest
from cost_dedup834 import apply_patch, START, END, OLD_INIT, OLD_LIVE, OLD_RAW, OLD_GAP, OLD_OWN

# Synthetic function context; production calculation fragments are taken directly
# from the guarded patch, so these tests execute the code that will be installed.
BASE = '''const DATA = {preserve:'source'};
function moneySummary(){return {current:123};}
function buildingTransportModel831(){return {uncoveredAdditional:456};}
''' + START + '\n' + '\n'.join([OLD_INIT, OLD_OWN, OLD_LIVE, OLD_RAW,
    ' const gaps = []; const gap = (...args) => gaps.push(args);', OLD_GAP,
    ' return {cardCost,cardRefs,loadsNoFig,loadsNoFigNoCard,gaps,total:Math.round((cardCost+loadsNoFigNoCard*50)*100)/100};',
    '}\n' + END + "return 'unchanged UI';}"])

def run_model(inp, patched=True):
    js = apply_patch(BASE) if patched else BASE
    script = '''const input = JSON.parse(process.argv[1]);
const fmtNum = String;
const allAssets = () => input.assets || [];
const assetTotal = a => ({lines:a.lines || []});
const ourCosts = () => (input.ownRefs || []).map(ref => ({kind:'transport',usable:true,amount:25,ref}));
const rowOff = id => (input.off || []).includes(id);
''' + js.replace("const DATA = {preserve:'source'};", "const DATA = {plant_lines:{fencing_rows_not_plant:input.fence || []},unreferenced:input.raw || []};") + '\nprocess.stdout.write(JSON.stringify(cj764Model776Held()));'
    result = subprocess.run(['node','-e',script,json.dumps(inp)],text=True,capture_output=True,check=True)
    return json.loads(result.stdout)

def event(task, **more):
    return dict(task_id=task, carrier='carrier', date='2030-01-01', item='Equipment', **more)
def asset(events, **more):
    return dict(key='REF', events=events, lines=[], **more)
def raw(task, **more):
    return dict(task_id=task, item='Equipment', discipline='Equipment', quantity_display='1', **more)

class CartageGuardTests(unittest.TestCase):
    def test_repeated_source_task_is_counted_once(self):
        inp={'assets':[asset([event('TASK-A')])], 'raw':[raw('TASK-A')]}
        self.assertEqual(run_model(inp,False)['total'],100)
        self.assertEqual(run_model(inp)['total'],50)
    def test_repeated_card_priced_task_does_not_get_average_added(self):
        a=asset([event('TASK-A')]);a['lines']=[{'transport_cost':80,'qty':2}]
        x=run_model({'assets':[a],'raw':[raw('TASK-A')]})
        self.assertEqual((x['cardCost'],x['loadsNoFigNoCard'],x['total']),(160,0,160))
    def test_distinct_task_same_reference_keeps_both_movements(self):
        x=run_model({'assets':[asset([event('DELIVERY'),event('PICKUP')])], 'raw':[raw('DELIVERY'),raw('PICKUP'),raw('LATER-PICKUP')]})
        self.assertEqual((x['loadsNoFigNoCard'],x['total']),(3,150))
    def test_same_date_item_and_quantity_different_ids_are_not_duplicates(self):
        self.assertEqual(run_model({'assets':[asset([event('ONE')])],'raw':[raw('TWO')]})['total'],100)
    def test_missing_id_is_not_guessed(self):
        self.assertEqual(run_model({'assets':[asset([event(None)])],'raw':[raw(None)]})['total'],100)
    def test_case_and_spacing_do_not_create_second_identity(self):
        self.assertEqual(run_model({'assets':[asset([event(' task-a ')])],'raw':[raw('TASK-A')]})['total'],50)
    def test_authoritative_cancellation_removes_raw_fallback(self):
        self.assertEqual(run_model({'raw':[raw('OFF')],'off':['OFF']})['total'],0)
    def test_reinstated_task_is_counted_again(self):
        self.assertEqual(run_model({'raw':[raw('OFF')],'off':[]})['total'],50)
    def test_cancel_word_without_cancellation_is_not_authority(self):
        self.assertEqual(run_model({'raw':[raw('A',location='Collect cancelled hire paperwork')]})['total'],50)
    def test_accreditation_unknown_quantity_held_and_explained(self):
        r=raw('PASS');r.update(discipline='Passes',item=None,quantity_display='blank',quantity_flag='unknown, not zero')
        inp={'raw':[r]}; before=json.dumps(inp,sort_keys=True);x=run_model(inp)
        self.assertEqual(x['total'],0);self.assertEqual(len(x['gaps']),2)
        self.assertIn('remain',x['gaps'][1][1]);self.assertIn('unknown',x['gaps'][1][1])
        self.assertEqual(json.dumps(inp,sort_keys=True),before)
    def test_real_collect_word_and_pickup_are_preserved(self):
        self.assertEqual(run_model({'raw':[raw('P',location='Collect building from event',phase='Demob')]})['total'],50)
    def test_pass_category_with_identified_equipment_is_preserved(self):
        r=raw('P');r['discipline']='Passes'
        self.assertEqual(run_model({'raw':[r]})['total'],50)
    def test_unknown_equipment_quantity_not_treated_as_zero(self):
        r=raw('Q');r['quantity_display']='blank'
        self.assertEqual(run_model({'raw':[r]})['total'],50)
    def test_zero_cost_and_internal_stay_known_not_missing(self):
        self.assertEqual(run_model({'raw':[raw('Z',transport_cost={'amount':0}),raw('I',transport_cost={'internal':True})]})['total'],0)
    def test_fencing_fallback_distinct_task_preserved(self):
        self.assertEqual(run_model({'assets':[asset([event('A')])],'fence':[raw('B')]})['total'],100)
    def test_paid_live_event_does_not_reenter_via_stale_raw_fallback(self):
        self.assertEqual(run_model({'assets':[asset([event('A',transport_cost={'amount':75})])],'raw':[raw('A')]})['total'],0)
    def test_internal_live_event_does_not_reenter_via_stale_raw_fallback(self):
        self.assertEqual(run_model({'assets':[asset([event('A',transport_cost={'internal':True})])],'raw':[raw('A')]})['total'],0)
    def test_typed_own_cost_coverage_does_not_get_fallback_again(self):
        self.assertEqual(run_model({'assets':[asset([event('A')])],'ownRefs':['REF'],'raw':[raw('A')]})['total'],0)
    def test_cancelled_asset_event_identity_does_not_need_task_tombstone(self):
        self.assertEqual(run_model({'assets':[asset([event('TASK')],_cancelled={'why':'authorised'})],'raw':[raw('TASK')]})['total'],0)
    def test_same_source_id_across_fallback_lists_is_used_once(self):
        self.assertEqual(run_model({'fence':[raw('ONE')],'raw':[raw('ONE')]})['total'],50)
    def test_promoted_task_without_carrier_fields_retains_fallback(self):
        a=asset([dict(task_id='ONE',item='Equipment',phase='Demob')])
        self.assertEqual(run_model({'assets':[a],'raw':[raw('ONE')]})['total'],50)
    def test_paid_fallback_source_then_unpriced_copy_does_not_add_estimate(self):
        self.assertEqual(run_model({'fence':[raw('ONE',transport_cost={'amount':75})],'raw':[raw('ONE')]})['total'],0)
    def test_model_patch_cannot_touch_other_financial_or_source_functions(self):
        new=apply_patch(BASE);a=BASE.index(START);b=BASE.index(END)
        self.assertEqual(new[:new.index(START)],BASE[:a]);self.assertEqual(new[new.index(END):],BASE[b:])
    def test_reapply_and_wrong_boundary_refused(self):
        with self.assertRaises(ValueError):apply_patch(apply_patch(BASE))
        with self.assertRaises(ValueError):apply_patch(BASE.replace(START,'function other(){'))
    def test_drift_in_model_fragment_refused(self):
        with self.assertRaises(SystemExit):apply_patch(BASE.replace('loadsNoFigNoCard++;','loadsNoFigNoCard += 2;'))

if __name__ == '__main__':unittest.main()
