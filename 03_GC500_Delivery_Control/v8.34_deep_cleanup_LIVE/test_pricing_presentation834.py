"""Author: Andrew Fisher. Synthetic source-link and unchanged-calculation checks."""
import json
from pathlib import Path
import subprocess
import unittest
import pricing_presentation834 as P
JS=Path(__file__).with_name('pricing_basis834_src.js').read_text()
ESC="const esc=s=>String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));"

def render(assets,group=None):
    source=ESC+'const assets='+json.dumps(assets)+';const group='+json.dumps(group if group is not None else assets)+';const allAssets=()=>assets;'+JS+'\nprocess.stdout.write(JSON.stringify({aliases:pricingAliases834(assets),notice:pricingAliasNotice834(assets),row:pricingAliasRows834(group),cost:pricingAliasCostNote834(),after:assets}));'
    return json.loads(subprocess.check_output(['node','-e',source]))

BASE=('const DATA = {preserve:1};\nfunction moneySummary(){return 123;}\n'
      'function chargeSpanOf(a){return a.exception || a.days;}\n'
      'function renderPricing(){return 1;}\n'
      "const notice = `${CARD_WORD === 'street'\n"+P.NOTICE_START+" synthetic old claim` : `old circuit claim`} ".rstrip()+P.NOTICE_END+"`;\n"
      'const content=`'+P.ROW_OLD+' 1:0}</td>'+P.NOTICE_OLD+P.COST_OLD+P.HEADING_OLD+P.SUBTOTAL_OLD+P.UNITS_OLD+'`;\n'
      'function contractCharge(){return 987;}\n')

class PricingPresentationTests(unittest.TestCase):
    def test_only_explicit_source_link_is_alias(self):
        a=[{'key':'PRIMARY'},{'key':'ALIAS','source_row':'PRIMARY'}]
        x=render(a);self.assertEqual(x['aliases'],[{'ref':'ALIAS','source':'PRIMARY'}]);self.assertEqual(x['after'],a)
        self.assertIn('not a reconciled unique-equipment total',x['notice']);self.assertIn('ALIAS → PRIMARY',x['row'])
    def test_same_number_or_name_is_not_alias_authority(self):
        a=[{'key':'A','asset_numbers':['42'],'name':'Same'},{'key':'B','asset_numbers':['42'],'name':'Same'}]
        self.assertEqual(render(a)['aliases'],[])
    def test_missing_canonical_is_not_classified_or_removed(self):
        a=[{'key':'ALIAS','source_row':'MISSING'}];x=render(a)
        self.assertEqual(x['aliases'],[]);self.assertEqual(x['after'],a);self.assertEqual(x['notice'],'')
    def test_cancelled_canonical_or_alias_does_not_count_active_overlap(self):
        self.assertEqual(render([{'key':'A','_cancelled':True},{'key':'B','source_row':'A'}])['aliases'],[])
        self.assertEqual(render([{'key':'A'},{'key':'B','source_row':'A','_cancelled':True}])['aliases'],[])
    def test_self_link_is_not_an_alias(self):
        self.assertEqual(render([{'key':'A','source_row':'A'}])['aliases'],[])
    def test_group_status_uses_canonical_in_whole_register(self):
        a=[{'key':'PRIMARY','discipline':'Equipment'},{'key':'ALIAS','source_row':'PRIMARY','discipline':'Other'}]
        self.assertIn('ALIAS → PRIMARY',render(a,[a[1]])['row']);self.assertEqual(render(a,[a[0]])['row'],'')
    def test_arbitrary_quantity_changes_do_not_change_source_provenance(self):
        a=[{'key':'A','quantity':2},{'key':'B','source_row':'A','quantity':7}]
        self.assertEqual(render(a)['aliases'],[{'ref':'B','source':'A'}])
    def test_source_labels_are_escaped(self):
        x=render([{'key':'<source>'},{'key':'<alias>','source_row':'<source>'}])
        self.assertIn('&lt;alias&gt;',x['row']);self.assertNotIn('<alias>',x['row'])
    def test_both_selected_card_headings_and_source_years_are_dynamic(self):
        for card in ['street','circuit']:
            for year in [2030,2044]:
                script=ESC+'const RM={card_year:'+str(year)+'};const CARD_WORD='+json.dumps(card)+';process.stdout.write(`'+P.HEADING_NEW+'`);'
                self.assertEqual(subprocess.check_output(['node','-e',script],text=True),'<h3>Rate card — '+str(year)+' '+card+'</h3>')
    def test_missing_source_year_is_not_invented_and_labels_are_escaped(self):
        for metadata,expected in [(None,'street'),({},'street'),({'card_year':'<year>'},'&lt;year&gt; street')]:
            script=ESC+'const RM='+json.dumps(metadata)+';const CARD_WORD="street";process.stdout.write(`'+P.HEADING_NEW+'`);'
            self.assertEqual(subprocess.check_output(['node','-e',script],text=True),'<h3>Rate card — '+expected+'</h3>')
    def test_record_count_label_does_not_claim_physical_equipment_quantity(self):
        out=P.apply_patch(BASE)
        self.assertIn('<div class="v">${assets.length}</div><div class="l">Active schedule records</div>',out)
        self.assertNotIn('Equipment on the job',out)
    def test_old_blanket_days_removed_not_replaced_with_other_fixed_days(self):
        out=P.apply_patch(BASE);self.assertNotIn('70 days',out)
        self.assertIn("each reference's current charge window and exceptions",out)
        self.assertNotIn('2026-10-',out);self.assertNotIn('three days',out)
    def test_source_and_numeric_function_bodies_identical(self):
        out=P.apply_patch(BASE)
        for s in ['const DATA = {preserve:1};','function moneySummary(){return 123;}','function chargeSpanOf(a){return a.exception || a.days;}','function contractCharge(){return 987;}']:
            self.assertEqual(out.count(s),1)
    def test_date_and_exception_basis_remain_owned_by_original_function(self):
        out=P.apply_patch(BASE)
        script=out.split('function renderPricing(){')[0]+"process.stdout.write(JSON.stringify([chargeSpanOf({days:3}),chargeSpanOf({days:8,exception:11})]));"
        self.assertEqual(json.loads(subprocess.check_output(['node','-e',script])),[3,11])
    def test_repeated_patch_is_rejected(self):
        with self.assertRaises(ValueError):P.apply_patch(P.apply_patch(BASE))
    def test_drifted_notice_or_missing_row_is_rejected(self):
        with self.assertRaises(ValueError):P.apply_patch(BASE.replace('70 days','71 days'))
        with self.assertRaises(SystemExit):P.apply_patch(BASE.replace(P.ROW_OLD,'other row'))

if __name__=='__main__':unittest.main()
