"""Author: Andrew Fisher. Production boundary guards; no private fixtures embedded."""
import hashlib
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch as mock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('patch47', ROOT / 'patch_v1247.py')
patch47 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch47)

class ProductionPatch(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = Path(os.environ['BASE']).read_bytes().decode('utf-8')
        cls.sha = hashlib.sha256(cls.base.encode()).hexdigest()
        cls.kw = dict(expected_base_sha=cls.sha, expected_base_version='12.46')
        cls.candidate = patch47.patch(cls.base, **cls.kw)

    def test_explicit_predecessor(self):
        # A release shell may already export valid defaults; missing-input tests
        # must isolate those defaults without changing the production API.
        with mock.dict(os.environ, {'GC500_V1247_BASE_SHA256': '', 'GC500_V1247_BASE_VERSION': ''}):
            for options in ({}, {'expected_base_sha': self.sha}, {'expected_base_version': '12.46'},
                            {**self.kw, 'expected_base_sha': '0'*64}, {**self.kw, 'expected_base_version': '12.45.1'}):
                with self.subTest(options=options), self.assertRaises(ValueError):
                    patch47.patch(self.base, **options)
        with self.assertRaises(ValueError):
            patch47.patch(self.base+' ', **self.kw)

    def test_repeat_refused(self):
        with self.assertRaisesRegex(ValueError, 'already applied'):
            patch47.patch(self.candidate, **self.kw)

    def test_footer_independently_guarded(self):
        for changed in (self.base.replace(patch47.OLD_FOOTER, "+' · v12.45.1';"), self.base + patch47.OLD_FOOTER):
            sha = hashlib.sha256(changed.encode()).hexdigest()
            with mock.object(patch47, 'REVIEWED_BASE_SHA256', sha), self.assertRaisesRegex(ValueError, 'footer'):
                patch47.patch(changed, expected_base_sha=sha, expected_base_version='12.46')

    def test_exact_reversal_and_styles(self):
        self.assertTrue(patch47.reverse(self.candidate) == self.base, 'only the new strip modules and footer may differ')
        kept = [s for s in patch47.styles(self.candidate) if 'id="buildcards1247-style"' not in s]
        self.assertTrue(kept == patch47.styles(self.base), 'every original stylesheet remains byte exact')
        self.assertEqual(len(kept), 149)
        self.assertEqual(self.candidate.count(patch47.NEW_FOOTER), 1)
        self.assertNotIn(patch47.OLD_FOOTER, self.candidate)

    def test_only_preview_notice_removed(self):
        added = patch47.bundle()
        self.assertNotIn('Build map-strip preview · not live', added)
        self.assertNotIn("release:'v12.47 PREVIEW", added)
        self.assertIn("release:'v12.47'", added)
        self.assertIn((ROOT / 'build_cards1247.css').read_text(), added)
        self.assertIn((ROOT / 'build_preview_lifecycle1247.js').read_text(), added)
        original = (ROOT / 'build_cards1247.js').read_text()
        self.assertIn(patch47.PREVIEW_NOTE, original, 'preview source must remain intact')
        self.assertIn("release:'v12.47 PREVIEW — NOT LIVE'", original)

    def test_selected_and_tested_sources_guarded(self):
        names = ('build_cards1247.css', 'build_cards1247.js', 'build_preview_lifecycle1247.js')
        for changed_name in names:
            with self.subTest(changed=changed_name), tempfile.TemporaryDirectory() as directory:
                folder = Path(directory)
                for name in names:
                    shutil.copyfile(ROOT / name, folder / name)
                changed = folder / changed_name
                changed.write_bytes(changed.read_bytes()+b'\n')
                with mock.object(patch47, 'ROOT', folder), self.assertRaisesRegex(ValueError, 'source changed'):
                    patch47.patch(self.base, **self.kw)

    def test_failed_cli_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / 'wrong-base.html'
            page.write_text('<html>synthetic wrong base</html>')
            before = page.read_bytes()
            result = subprocess.run(['python', str(ROOT / 'patch_v1247.py'), str(page)], capture_output=True,
                env={**os.environ, 'GC500_V1247_BASE_SHA256': self.sha, 'GC500_V1247_BASE_VERSION': '12.46'})
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(page.read_bytes(), before)

if __name__ == '__main__':
    unittest.main()
