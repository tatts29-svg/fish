"""Author: Andrew Fisher. Exact release predecessors and bounded integration.

Native predecessor pages are supplied privately by environment paths. No page
contents, operational values or private source findings are stored in this test.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch as mock_patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import patch_v1255 as release
from finance_patch import reverse_finance


class SourceBoundaryTests(unittest.TestCase):
    def test_canonical_source_is_required(self):
        with self.assertRaisesRegex(ValueError, 'serialization'):
            release.data_span('const DATA = {"synthetic": 1};')

    def test_duplicate_source_declarations_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'one original'):
            release.data_span('const DATA = {};\nconst DATA = {};')

    def test_missing_source_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'one original'):
            release.data_span('const OTHER = {};')


class ExactReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bases = []
        for variable in ('GC500_V1255_TEST_BASE54', 'GC500_V1255_TEST_BASE541'):
            path = os.environ.get(variable)
            if path:
                text = Path(path).read_text(encoding='utf-8')
                digest = hashlib.sha256(text.encode('utf-8')).hexdigest()
                if digest not in release.BASES:
                    raise AssertionError('Test predecessor is not a reviewed release')
                cls.bases.append((digest, text))
        if not cls.bases:
            raise unittest.SkipTest('Private reviewed predecessor pages required')

    def test_exact_predecessor_and_complete_reversal(self):
        for digest, original in self.bases:
            with self.subTest(predecessor=release.BASES[digest]):
                changed = release.patch(original, expected_base_sha=digest)
                self.assertIn(release.NEW_FOOTER, changed)
                self.assertNotEqual(changed, original)
                old_data, old_start, old_end = release.data_span(original)
                new_data, _, _ = release.data_span(changed)
                self.assertEqual(
                    {k: v for k, v in old_data.items() if k != 'rental_on_hire'},
                    {k: v for k, v in new_data.items() if k != 'rental_on_hire'},
                )
                reversed_page = reverse_finance(changed)
                _, new_start, new_end = release.data_span(reversed_page)
                reversed_page = (reversed_page[:new_start] + original[old_start:old_end]
                                 + reversed_page[new_end:])
                reversed_page = reversed_page.replace(
                    release.NEW_FOOTER, "+' · " + release.BASES[digest] + "';", 1)
                self.assertEqual(reversed_page, original)

    def test_unknown_or_mismatched_base_refused(self):
        for digest, original in self.bases:
            wrong_reviewed = next(d for d in release.BASES if d != digest)
            for declared in ('0' * 64, wrong_reviewed):
                with self.subTest(declared=declared), self.assertRaisesRegex(ValueError, 'exact reviewed'):
                    release.patch(original, expected_base_sha=declared)

    def test_tampered_predecessor_refused(self):
        for digest, original in self.bases:
            with self.subTest(predecessor=release.BASES[digest]), self.assertRaisesRegex(ValueError, 'exact reviewed'):
                release.patch(original + '\n', expected_base_sha=digest)

    def test_missing_explicit_base_refused(self):
        with mock_patch.dict(os.environ, {'GC500_V1255_BASE_SHA256': ''}):
            with self.assertRaisesRegex(ValueError, 'explicit exact'):
                release.patch(self.bases[0][1])

    def test_duplicate_application_refused(self):
        digest, original = self.bases[0]
        changed = release.patch(original, expected_base_sha=digest)
        with self.assertRaisesRegex(ValueError, 'already applied'):
            release.patch(changed, expected_base_sha=digest)

    def test_cli_failure_does_not_modify_page(self):
        _, original = self.bases[0]
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'synthetic-release-boundary.html'
            path.write_text(original, encoding='utf-8')
            env = dict(os.environ, GC500_V1255_BASE_SHA256='0' * 64)
            result = subprocess.run([sys.executable, str(ROOT / 'patch_v1255.py'), str(path)],
                                    env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(path.read_text(encoding='utf-8'), original)


if __name__ == '__main__':
    unittest.main()
