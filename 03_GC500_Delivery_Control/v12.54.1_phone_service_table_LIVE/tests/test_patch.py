"""Author: Andrew Fisher. Exact source boundaries for the phone table repair."""
import os
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import patch_v12541 as patch


@unittest.skipUnless(os.environ.get('BASE'), 'BASE must name the private exact v12.54 predecessor')
class PatchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = Path(os.environ['BASE']).read_text(encoding='utf-8')
        cls.candidate = patch.patch(cls.base, expected_base_sha=patch.BASE_SHA256)

    def test_explicit_exact_base_required(self):
        with self.assertRaises(ValueError):
            patch.patch(self.base, expected_base_sha='wrong')
        with self.assertRaises(ValueError):
            patch.patch(self.base + ' ', expected_base_sha=patch.BASE_SHA256)

    def test_duplicate_rejected(self):
        with self.assertRaises(ValueError):
            patch.patch(self.candidate, expected_base_sha=patch.BASE_SHA256)

    def test_only_added_style_and_footer_change(self):
        restored = self.candidate.replace(patch.style_block(), '', 1).replace(patch.NEW_FOOTER, patch.OLD_FOOTER, 1)
        self.assertEqual(restored, self.base)

    def test_all_existing_styles_and_scripts_preserved(self):
        styles = lambda s: re.findall(r'<style\b[^>]*>[\s\S]*?</style>', s)
        self.assertEqual(styles(self.candidate.replace(patch.style_block(), '', 1)), styles(self.base))
        scripts = lambda s: re.findall(r'<script\b[^>]*>[\s\S]*?</script>', s)
        self.assertEqual(scripts(self.candidate.replace(patch.NEW_FOOTER, patch.OLD_FOOTER, 1)), scripts(self.base))

    def test_mobile_screen_only_and_exact_card_scope(self):
        css = (patch.ROOT / 'phone_service12541.css').read_text()
        self.assertIn('@media screen and (max-width:640px)', css)
        self.assertEqual(re.findall(r'#[\w-]+', css), ['#card748'])
        self.assertIn(':has(> table.t748 > thead > tr > th:nth-child(2).num)', css)
        self.assertIn('position:static;box-shadow:none', css)


if __name__ == '__main__':
    unittest.main()
