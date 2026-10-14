"""Author: Andrew Fisher. Local exact-replacement and repeat guards."""
import importlib.util
import os
from pathlib import Path
import unittest

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('recovery_patch', HERE/'patch_recovery1016.py')
patch=importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)

class RecoveryPatchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source=Path(os.environ['BASE_PAGE']).read_text()
        cls.result=patch.apply(cls.source)
    def test_contains_one_helper(self):
        self.assertEqual(self.result.count('function docsRecovery1016('),1)
    def test_three_native_recovery_triggers(self):
        self.assertEqual(self.result.count('docsRecovery1016();'),2)
        self.assertEqual(self.result.count('docsRecovery1016(true);'),1)
    def test_no_new_poller(self):
        self.assertEqual(self.result.count('setInterval('),self.source.count('setInterval('))
    def test_reject_repeat(self):
        with self.assertRaises(ValueError): patch.apply(self.result)
    def test_requires_cache_dependency(self):
        with self.assertRaises(ValueError): patch.apply(self.source.replace('function sharedCache975()', 'function absentCache()'))
    def test_requires_exact_success_hook(self):
        with self.assertRaises(SystemExit): patch.apply(self.source.replace('if (!force && v.version === version) { syncFooter(); return; }','if (!force && v.version === version) return;'))

if __name__=='__main__':unittest.main()
