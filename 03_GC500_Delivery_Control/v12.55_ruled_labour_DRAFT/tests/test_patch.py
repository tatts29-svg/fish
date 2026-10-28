"""Author: Andrew Fisher. Fail-closed exact patch boundaries and complete reversal."""
import os
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from finance_patch import patch_finance, replacements, reverse_finance

class Boundaries(unittest.TestCase):
    def setUp(self):
        self.source = '\n/* preserved separator */\n'.join(old for _, old, _ in replacements())

    def test_exact_reversal(self):
        self.assertEqual(reverse_finance(patch_finance(self.source)), self.source)

    def test_repeated_patch_rejected(self):
        with self.assertRaisesRegex(ValueError, 'already applied'):
            patch_finance(patch_finance(self.source))

    def test_missing_or_duplicate_boundaries_rejected(self):
        for label, old, _ in replacements():
            with self.subTest(boundary=label, case='missing'):
                with self.assertRaises(ValueError):
                    patch_finance(self.source.replace(old, '', 1))
            with self.subTest(boundary=label, case='duplicate'):
                with self.assertRaises(ValueError):
                    patch_finance(self.source + '\n' + old)

    @unittest.skipUnless(os.environ.get('GC500_LABOUR55_BASE'), 'private exact predecessor supplied separately')
    def test_native_predecessor_reverses_exactly(self):
        source = Path(os.environ['GC500_LABOUR55_BASE']).read_text()
        self.assertEqual(reverse_finance(patch_finance(source)), source)

if __name__ == '__main__':
    unittest.main()
