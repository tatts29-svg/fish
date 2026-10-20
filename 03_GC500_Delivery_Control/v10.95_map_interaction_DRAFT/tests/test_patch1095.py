"""Author: Andrew Fisher. Exact-base and unchanged-record guards; private page path supplied by caller."""
import hashlib
import importlib.util
import os
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('patch1095', ROOT / 'patch_v1095.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PatchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = Path(os.environ['BASE_PAGE']).read_text()
        cls.candidate = module.patch(cls.base)

    def test_exact_base(self):
        self.assertEqual(hashlib.sha256(self.base.encode()).hexdigest(), module.BASE)
        self.assertIn('map-pin1095', self.candidate)
        self.assertIn(' · v10.95', self.candidate)

    def test_refuses_reapply_or_changed_base(self):
        for page in (self.candidate, self.base + '\n', self.base.replace('v10.94', 'v10.93')):
            with self.assertRaises(ValueError):
                module.patch(page)

    def test_script_inventory_and_data_preserved(self):
        scripts = lambda s: re.findall(r'<script\b([^>]*)>([\s\S]*?)</script\s*>', s, re.I)
        old, new = scripts(self.base), scripts(self.candidate)
        self.assertEqual(len(old), len(new))
        changed = []
        for (oa, ob), (na, nb) in zip(old, new):
            self.assertEqual(oa, na)
            if ob != nb:
                changed.append(oa)
                self.assertFalse(re.search(r'\bid=["\'][^"\']*data', oa, re.I), 'No embedded data script may change')
        self.assertLessEqual(len(changed), 4)
        for marker in ['shapes926-data', 'servicing-card1067-data']:
            pattern = r'<script[^>]+id=["\']' + re.escape(marker) + r'["\'][^>]*>[\s\S]*?</script>'
            self.assertEqual(re.findall(pattern, self.base), re.findall(pattern, self.candidate))

    def test_marker_is_not_visible_body_text(self):
        self.assertNotIn('/* fencing-evidence-1071; Author: Andrew Fisher */', self.candidate)
        self.assertEqual(self.candidate.count('<!-- fencing-evidence-1071; Author: Andrew Fisher -->'), 1)


if __name__ == '__main__':
    unittest.main()
