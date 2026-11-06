"""Author: Andrew Fisher. Release-boundary checks use a private exact predecessor."""
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import patch_v1254 as patch
from finance_patch import reverse_finance


@unittest.skipUnless(os.environ.get('BASE'), 'BASE must name the private exact live50.1 predecessor')
class PatchBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base=Path(os.environ['BASE']).read_text(encoding='utf-8')
        cls.changed=patch.patch(cls.base, expected_base_sha=patch.BASE_SHA256)

    def test_explicit_base_required(self):
        with self.assertRaises(ValueError):
            patch.patch(self.base, expected_base_sha='incorrect')

    def test_changed_predecessor_rejected(self):
        with self.assertRaises(ValueError):
            patch.patch(self.base+' ', expected_base_sha=patch.BASE_SHA256)

    def test_duplicate_application_rejected(self):
        with self.assertRaises(ValueError):
            patch.patch(self.changed, expected_base_sha=patch.BASE_SHA256)

    def test_only_reviewed_source_finance_and_footer_change(self):
        restored=reverse_finance(self.changed.replace(patch.NEW_FOOTER,patch.OLD_FOOTER))
        _,old_start,old_end=patch.data_span(self.base)
        _,new_start,new_end=patch.data_span(restored)
        restored=restored[:new_start]+self.base[old_start:old_end]+restored[new_end:]
        self.assertEqual(restored,self.base)


if __name__=='__main__':
    unittest.main()
