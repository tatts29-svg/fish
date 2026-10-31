"""Author: Andrew Fisher. Production boundaries, exact reversal and failure non-mutation."""
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('patch_v1248', ROOT / 'patch_v1248.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
BASE = Path(os.environ['BASE']).read_text()

class Boundaries(unittest.TestCase):
    def test_round_trip_and_styles(self):
        changed = p.patch(BASE, expected_base_sha=p.BASE_SHA256, expected_base_version=p.BASE_VERSION)
        self.assertEqual(p.reverse(changed), BASE)
        self.assertNotEqual(changed, BASE)
    def test_missing_explicit_base(self):
        old = os.environ.pop('GC500_V1248_BASE_SHA256', None)
        try:
            with self.assertRaises(ValueError): p.patch(BASE, expected_base_version=p.BASE_VERSION)
        finally:
            if old is not None: os.environ['GC500_V1248_BASE_SHA256'] = old
    def test_wrong_base(self):
        with self.assertRaises(ValueError): p.patch(BASE+' ', expected_base_sha=p.BASE_SHA256, expected_base_version=p.BASE_VERSION)
    def test_wrong_version(self):
        with self.assertRaises(ValueError): p.patch(BASE, expected_base_sha=p.BASE_SHA256, expected_base_version='12.46')
    def test_repeat(self):
        changed = p.patch(BASE, expected_base_sha=p.BASE_SHA256, expected_base_version=p.BASE_VERSION)
        with self.assertRaises(ValueError): p.patch(changed, expected_base_sha=p.BASE_SHA256, expected_base_version=p.BASE_VERSION)
    def test_source_guard(self):
        with self.assertRaises(ValueError): p.source('build_departure1248.js','0'*64)
        with self.assertRaises(ValueError): p.source('build_departure1248.css','0'*64)
    def test_source_anchor(self):
        with self.assertRaises(ValueError): p.exact('x x','x','y','test','page')
        with self.assertRaises(ValueError): p.exact('nothing','x','y','test','page')
    def test_failed_cli_leaves_input(self):
        with tempfile.TemporaryDirectory() as tmp:
            page=Path(tmp)/'page.html';page.write_text(BASE)
            env={k:v for k,v in os.environ.items() if not k.startswith('GC500_V1248_BASE_')}
            r=subprocess.run([sys.executable,str(ROOT/'patch_v1248.py'),str(page)],env=env,capture_output=True)
            self.assertNotEqual(r.returncode,0)
            self.assertEqual(page.read_text(),BASE)

if __name__ == '__main__': unittest.main()
