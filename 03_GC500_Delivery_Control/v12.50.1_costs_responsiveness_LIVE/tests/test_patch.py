"""Author: Andrew Fisher. Exact predecessor and bounded edit guards."""
import importlib.util
import os
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('patch', Path(__file__).resolve().parents[1] / 'patch_v12501.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class PatchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = Path(os.environ['BASE']).read_text()
        cls.candidate = m.patch(cls.base, expected_base_sha=m.BASE_SHA256)

    def test_reversal(self):
        self.assertEqual(m.reverse(self.candidate), self.base)

    def test_requires_explicit_exact_base(self):
        with self.assertRaises(ValueError):
            m.patch(self.base, expected_base_sha='wrong')
        with self.assertRaises(ValueError):
            m.patch(self.base + ' ', expected_base_sha=m.BASE_SHA256)

    def test_no_double_patch(self):
        with self.assertRaises(ValueError):
            m.patch(self.candidate, expected_base_sha=m.BASE_SHA256)

    def test_reverse_tamper_rejected(self):
        with self.assertRaises(ValueError):
            m.reverse(self.candidate.replace('const fwf1244ByBranch = {};', 'const fwf1244ByBranch = {x:1};'))

    def test_only_original_body_and_wrapper(self):
        original = self.base.split(m.OLD_START,1)[1].split(m.OLD_END,1)[0]
        actual = self.candidate.split(m.NEW_START,1)[1].split(m.NEW_END,1)[0]
        self.assertEqual(actual, original)
        self.assertEqual(self.candidate.count('pl760Ticks12501'), 1)
        self.assertEqual(self.candidate.count(m.NEW_FOOTER), 1)

    def test_branch_projection_arithmetic_unchanged(self):
        original = self.base.split(m.OLD_BRANCH, 1)[1].split(m.OLD_BRANCH_END, 1)[0]
        actual = self.candidate.split(m.NEW_BRANCH, 1)[1].split(m.NEW_BRANCH_END, 1)[0]
        self.assertEqual(actual, original)

    def test_finance_arithmetic_and_checks_unchanged(self):
        original = self.base.split(m.OLD_FINANCE, 1)[1].split('</script>', 1)[0]
        actual = self.candidate.split(m.NEW_FINANCE, 1)[1].split('</script>', 1)[0]
        self.assertEqual(actual, original)

    def test_native_branch_model_unchanged(self):
        marker = '/* Author: Andrew Fisher. Allocation view only; preserves every combined ledger amount. */'
        original = self.base.split(marker, 1)[1].split(m.BRANCH_SCOPE, 1)[0]
        actual = self.candidate.split(marker, 1)[1].split(m.BRANCH_SCOPE, 1)[0]
        self.assertEqual(actual, original)

if __name__ == '__main__':
    unittest.main()
