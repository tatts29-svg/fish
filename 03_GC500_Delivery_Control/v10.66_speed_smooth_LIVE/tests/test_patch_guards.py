"""Author: Andrew Fisher. Exact source / repeat guards; no network or page writes."""
import importlib.util
from pathlib import Path
import sys
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'patch_v1066.py'
spec = importlib.util.spec_from_file_location('speed_patch', SOURCE)
patcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patcher)

class Guards(unittest.TestCase):
    def test_missing_markers(self):
        with self.assertRaisesRegex(ValueError, 'requires'):
            patcher.patch('<html></html>')

    def test_repeat(self):
        with self.assertRaisesRegex(ValueError, 'already applied'):
            patcher.patch('smooth1066-early')

    def test_wrong_bytes_even_with_version(self):
        with self.assertRaisesRegex(ValueError, 'wrong live base'):
            patcher.patch("+ ' · v10.65' <script id=\"shapes1060-script\"></script>")

if __name__ == '__main__':
    unittest.main()
