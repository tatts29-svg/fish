"""Author: Andrew Fisher. Boundary checks; supplied pages stay private and untouched."""
import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('patch_v1249', ROOT / 'patch_v1249.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class BoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.environ.get('BASE'):
            raise RuntimeError('BASE must name the private exact reviewed predecessor')
        cls.base = Path(os.environ['BASE']).read_text()
        if mod.digest(cls.base.encode()) != mod.REVIEWED_BASE_SHA256:
            raise RuntimeError('BASE is not the reviewed predecessor')

    def call(self, text=None, **kw):
        return mod.patch(self.base if text is None else text,
                         expected_base_sha=kw.get('sha', mod.REVIEWED_BASE_SHA256),
                         expected_base_version=kw.get('version', mod.REVIEWED_BASE_VERSION))

    def test_exact_reversal(self):
        candidate = self.call()
        self.assertEqual(mod.reverse(candidate), self.base)
        self.assertIn(mod.NEW_FOOTER, candidate)
        self.assertEqual(candidate.count('const previousContractCharge1249='), 1)

    def test_missing_explicit_inputs(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                mod.patch(self.base)

    def test_wrong_hash_or_modified_page(self):
        with self.assertRaises(ValueError):
            self.call(sha='0' * 64)
        with self.assertRaises(ValueError):
            self.call(self.base + '\n')

    def test_wrong_version(self):
        with self.assertRaises(ValueError):
            self.call(version='0.00')

    def test_repeat_rejected(self):
        with self.assertRaises(ValueError):
            self.call(self.call())

    def test_source_change_rejected(self):
        with tempfile.TemporaryDirectory() as name:
            folder = Path(name)
            (folder / 'contract_labour1249.js').write_text(mod.source() + '\n')
            with patch.object(mod, 'ROOT', folder):
                with self.assertRaises(ValueError):
                    self.call()

    def test_footer_and_anchor_mismatch_rejected(self):
        for text in [self.base.replace(mod.OLD_FOOTER, "+' · wrong';", 1),
                     self.base.replace(mod.CLASSIFIER, 'function changedClassifier(r){', 1)]:
            sha = mod.digest(text.encode())
            with patch.object(mod, 'REVIEWED_BASE_SHA256', sha):
                with self.assertRaises(ValueError):
                    self.call(text, sha=sha)

    def test_failed_cli_does_not_write(self):
        with tempfile.TemporaryDirectory() as name:
            page = Path(name) / 'private-page.html'
            page.write_text(self.base)
            env = dict(os.environ, GC500_V1249_BASE_SHA256='0' * 64,
                       GC500_V1249_BASE_VERSION=mod.REVIEWED_BASE_VERSION)
            result = subprocess.run([sys.executable, str(ROOT / 'patch_v1249.py'), str(page)],
                                    env=env, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(page.read_text(), self.base)


if __name__ == '__main__':
    unittest.main()
