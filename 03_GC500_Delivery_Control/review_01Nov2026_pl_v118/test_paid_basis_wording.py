"""Author: Andrew Fisher. Synthetic-only checks for the review wording helper."""
import ast,importlib.util,unittest
from pathlib import Path

p=Path(__file__).with_name('propose_paid_basis_wording.py')
spec=importlib.util.spec_from_file_location('wording_helper',p);helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
TEXT="""GC500 October month-end: costs by supplier and month, accruals, labour, invoices
Hours from the running sheet, allocated by the job’s rules
Coates wages and salary are hours only.
invoices where received and the running sheet where not
2b · Labour by person: home branch, and where the cost is journaled to
Coates wages and salary are hours (finance applies the pay cost); labour hire is dollars at the record's rates.
Labour journals (hours; Coates wages and salary are hours only): see section 2b, each person from their home branch to the branch of the work, with the contract named outside KINP.
Paid hours are the journal basis (what payroll pays)
A day on more than one branch shares each band pro rata by the hours on each branch.
"""
HEADERS=(['September h']*4+['October h (same period)']*4+['#September h','#October h (same period)']+['#Sep h']*3+['#Oct h (same period)']*3+['Sep h','Oct h (same period)']+['#Total h']*4)
FIXTURE='note = """'+TEXT+'"""\nheaders = '+repr(HEADERS)+'\nvalues = [12.34, 56.78]\ntotal = round(sum(values), 2)\n'

class StripStrings(ast.NodeTransformer):
    def visit_Constant(self,node):
        if isinstance(node.value,str):node.value='<text>'
        return node

class ReviewWordingTests(unittest.TestCase):
    def test_only_text_changes(self):
        revised=helper.change_builder(FIXTURE)
        self.assertEqual(ast.dump(StripStrings().visit(ast.parse(FIXTURE))),ast.dump(StripStrings().visit(ast.parse(revised))))
        a={};b={};exec(FIXTURE,a);exec(revised,b);self.assertEqual(a['values'],b['values']);self.assertEqual(a['total'],b['total'])
    def test_worked_labels_keep_month_qualifier(self):
        ns={};exec(helper.change_builder(FIXTURE),ns)
        self.assertEqual(len(ns['headers']),len(HEADERS))
        self.assertTrue(all('worked h' in h for h in ns['headers']))
        self.assertEqual(sum('(same period)' in h for h in HEADERS),sum('(same period)' in h for h in ns['headers']))
    def test_raw_register_and_paid_basis_are_distinct(self):
        revised=helper.change_builder(FIXTURE)
        self.assertIn('Staff worked-hour rows before the job start date are excluded here',revised)
        self.assertIn('unfiltered source copy, not the paid-hours journal',revised)
        self.assertIn('Calculated paid hours for journal preparation',revised)
    def test_money_is_not_repriced_from_rounded_bands(self):
        revised=helper.change_builder(FIXTURE)
        self.assertIn('Displayed bands are rounded for reporting; do not reprice them',revised)
        self.assertIn('existing dollar amounts and applicable invoice or purchase order basis',revised)
        self.assertIn('the salary allowance is already in Costs',revised)
    def test_ambiguous_or_missing_anchors_refuse(self):
        with self.assertRaises(ValueError):helper.change_builder(FIXTURE+"\n# Coates wages and salary are hours only.\n")
        with self.assertRaises(ValueError):helper.change_builder(FIXTURE.replace("'#Total h'","'#Changed'",1))
    def test_finder_has_local_money_qualification(self):
        before='Coates wages are hours only, not yet costed; the salary allowance is costed (the Salary allowance category). '
        after=helper.change_tab(before)
        self.assertIn('Worked and paid hours are different quantities',after)
        self.assertIn('do not reprice them',after)
        self.assertIn('existing dollar amounts',after)
        with self.assertRaises(ValueError):helper.change_tab(before+before)

if __name__=='__main__':unittest.main()
