"""Author: Andrew Fisher. Execute the real Finance grouping with synthetic labour rows."""
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from staff_type834 import apply_patch

BASE = ROOT.parent / 'build/GC500_v8.33/GC500_Delivery_Control_hosted.html'

def function(text, name):
    start = text.index('function ' + name + '(')
    end = text.find('\nfunction ', start + 1)
    return text[start:end if end >= 0 else len(text)]

class EmploymentTypeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = BASE.read_text()
        cls.patched = apply_patch(cls.base)

    def test_only_monthly_grouping_and_unknown_split_boundaries_change(self):
        a = function(self.base, 'acc761Model'); b = function(self.patched, 'acc761Model')
        before, after = self.base, self.patched
        for name in ['acc761Model', 'splitHoursFor', 'runPay', 'renderRunsheet_held']:
            before = before.replace(function(self.base, name), '<' + name + '>')
            after = after.replace(function(self.patched, name), '<' + name + '>')
        self.assertEqual(before, after)
        for name in ['fin745Rows', 'fin745Summary', 'runType', 'scopeFigures', 'moneySummary_', 'acc762LabourReview', 'runDay', 'runTotals']:
            self.assertEqual(function(self.base, name), function(self.patched, name), name)
        self.assertIn("! /allocation —/".replace('! ', '!'), b)
        display = function(self.patched, 'renderRunsheet_held')
        self.assertNotIn('paid hours are split on the Coates CNA rule', display)
        self.assertIn('pay basis pending', display)
        self.assertIn('overtime split and calculated wage stay unpriced', display)

    def test_repeat_patch_refused(self):
        with self.assertRaises(ValueError): apply_patch(self.patched)

    def test_real_grouping_preserves_amounts_and_separates_unknown_types(self):
        model = function(self.patched, 'acc761Model')
        start = model.index(" ['hire', 'cna', 'salary', 'unknown'].forEach")
        end = model.index(' /* v7.63 - the fencing:', start)
        loop = model[start:end]
        review = function(self.base, 'acc762LabourReview')
        rounder = function(self.base, 'acc762Round') + '\n' + function(self.base, 'acc762Money')
        rows = []
        for i, type_ in enumerate(['hire', 'cna', 'salary', '', None, 'not-recognised']):
            rows.append({'id': 'fixture-' + str(i), 'person': 'Fixture ' + str(i), 'type': type_, 'status': 'forecast', 'worked': 12, 'paid': 12, 'calculatedCost': 240 if type_ == 'hire' else None, 'actualCost': None, 'allocation': 'unverified'})
        rows.append({'id': 'fixture-actual', 'person': 'Verified fixture', 'type': None, 'status': 'confirmed', 'worked': 5, 'paid': 5, 'calculatedCost': 100, 'actualCost': 110, 'allocation': 'needed'})
        script = rounder + '\n' + review + '\nconst labourRows=' + json.dumps(rows) + ";const captured=[];function addCost(stream,branch,amount,basis,extra){const r={stream,branch,amount,basis,extra};captured.push(r);return r;}\n" + loop + '\nconsole.log(JSON.stringify({captured,total:acc762LabourReview(labourRows)}));'
        result = subprocess.run(['node', '--input-type=commonjs'], input=script, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        actual = json.loads(result.stdout); groups = actual['captured']
        future = {r['extra']['labourType']: r for r in groups if r['extra']['status'] == 'forecast'}
        self.assertEqual(set(future), {'hire', 'cna', 'salary', 'unknown'})
        self.assertEqual(future['unknown']['extra']['labour']['hours'], 36)
        self.assertIsNone(future['unknown']['amount'])
        self.assertEqual(future['cna']['extra']['labour']['hours'], 12)
        self.assertEqual(future['salary']['extra']['labour']['hours'], 12)
        self.assertEqual(future['hire']['amount'], 240)
        self.assertEqual(sum(r['extra']['labour']['hours'] for r in groups), 77)
        self.assertEqual(sum(r['extra']['labour']['actualCost'] for r in groups), 110)
        self.assertEqual(sum(r['extra']['labour']['calculatedCost'] for r in groups), 240)
        self.assertTrue(all('allocation —' in r['stream'] for r in groups if r['extra']['labourType'] == 'unknown'))
        self.assertEqual(actual['total']['forecast']['hours'], 72)
        self.assertEqual(actual['total']['confirmed']['cost'], 110)

    def test_unknown_type_cannot_gain_invented_overtime_from_a_rate_alone(self):
        names = ['runRule', 'runType', 'splitHoursFor', 'runPay']
        source = '\n'.join(function(self.patched, name) for name in names)
        script = "const assert=require('node:assert/strict');const S={runRules:{}};const RUN_DEF={cna_ord:7.6,lh_ord:7.5,ot_x15:2,sat_x15:2,wd_break:30};\n" + source + "\n" + r'''
for (const type of ['', null, undefined, 'not-recognised']) for (const day of ['2026-10-23','2026-10-24','2026-10-25']) {
 const split=splitHoursFor(12,day,type);
 assert.equal(split.ordinary,null);assert.equal(split.at_1_5,null);assert.equal(split.at_2,null);
 assert.equal(runPay(split,50),null);assert.equal(runPay(split,null),null);
}
assert.equal(runPay(splitHoursFor(12,'2026-10-23','External'),55.7),863.35);
assert.equal(runPay(splitHoursFor(12,'2026-10-24','External'),55.7),1281.1);
assert.equal(runPay(splitHoursFor(12,'2026-10-25','External'),55.7),1336.8);
assert.equal(runPay(splitHoursFor(12,'2026-10-23','Salary'),50),600);
assert.equal(runPay(splitHoursFor(12,'2026-10-23','Internal CNA'),50),770);
S.runRules.cna_ord=8;assert.equal(runPay(splitHoursFor(12,'2026-10-23','Internal CNA'),50),750);
console.log('Unknown-type rate-only and explicit known-type rules pass');
'''
        result = subprocess.run(['node', '--input-type=commonjs'], input=script, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)

if __name__ == '__main__': unittest.main()
