"""Author: Andrew Fisher. Exact source-anchor guards for the Inventory component."""
import os
from pathlib import Path
import unittest
from patch_inventory1017 import apply

class SourceGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source=Path(os.environ['BASE_PAGE']).read_text()
    def test_applies_once(self):
        self.assertEqual(apply(self.source).count('root.Inventory1017=api'),1)
    def test_rejects_second_application(self):
        with self.assertRaises(ValueError): apply(apply(self.source))
    def test_requires_current_stock_source(self):
        with self.assertRaises(ValueError): apply(self.source.replace('root.VmsAssignment1016=api','root.VmsAssignmentOld=api'))
    def test_refuses_changed_receipt_anchor(self):
        altered=self.source.replace('onsite: on}); R.asked += x.asked;','onsite: on}); R.asked += Number(x.asked);')
        with self.assertRaises(SystemExit): apply(altered)

if __name__=='__main__':unittest.main()
