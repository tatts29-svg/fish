"""Author: Andrew Fisher. Fail-closed scope and anchor tests for the ripple transform."""
from pathlib import Path
import unittest

import patch_ripple1065 as patcher


class RippleTransformTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = (Path(__file__).resolve().parents[2] / 'build/GC500_v10.64/GC500_Delivery_Control_hosted.html').read_text(encoding='utf-8')

    def test_only_three_intended_substitutions(self):
        expected = self.base.replace(patcher.SELECTION_OLD, patcher.SELECTION_NEW)
        expected = expected.replace(patcher.GUARD, patcher.GUARD + '\n   ' + patcher.START)
        expected = expected.replace(patcher.PHASE_OLD, patcher.PHASE_NEW)
        self.assertEqual(patcher.patch(self.base), expected)

    def test_rejects_reapplication(self):
        with self.assertRaises(ValueError):
            patcher.patch(patcher.patch(self.base))

    def test_rejects_missing_anchors(self):
        for anchor in (patcher.SELECTION_OLD, patcher.GUARD, patcher.PHASE_OLD):
            with self.subTest(anchor=anchor[:40]), self.assertRaises(ValueError):
                patcher.patch(self.base.replace(anchor, '', 1))

    def test_rejects_duplicate_anchors(self):
        for anchor in (patcher.SELECTION_OLD, patcher.GUARD, patcher.PHASE_OLD):
            with self.subTest(anchor=anchor[:40]), self.assertRaises(ValueError):
                patcher.patch(self.base + '\n' + anchor)

    def test_rejects_changed_guard(self):
        with self.assertRaises(ValueError):
            patcher.patch(self.base.replace('if (quiet || moving)', 'if (quiet)', 1))


if __name__ == '__main__':
    unittest.main()
