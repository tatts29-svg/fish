import importlib.util
import os
from pathlib import Path
import sys
import tempfile
import unittest

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT))


def _kit():
    spec = importlib.util.spec_from_file_location("kit_owner_aliases", KIT / "build_onhire_workbook.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class OwnerAliasTests(unittest.TestCase):
    def test_owner_alias_renames_owner_columns_only(self):
        kit = _kit()
        with tempfile.TemporaryDirectory() as d:
            with open(os.path.join(d, "OWNER_ALIASES.txt"), "w", encoding="utf-8") as f:
                f.write("# test\nACME HIRE = Coates\n")
            kit._NAMES["owners"] = kit.read_aliases(d, "OWNER_ALIASES.txt")
        try:
            row = kit._fold_owner({"OWNER": "Acme Hire", "ITEM_OWNER": "ACME HIRE",
                                   "COMPANY_NAME": "Acme Hire", "ITEM_DESCRIPTION": "Acme Hire vernier"})
            self.assertEqual(row["OWNER"], "Coates")
            self.assertEqual(row["ITEM_OWNER"], "Coates")
            self.assertEqual(row["COMPANY_NAME"], "Acme Hire")
            self.assertEqual(row["ITEM_DESCRIPTION"], "Acme Hire vernier")
            self.assertEqual(kit._fold_owner({"OWNER": "Acme Hire Pty Ltd"})["OWNER"], "Acme Hire Pty Ltd")
        finally:
            kit._NAMES["owners"] = {}

    def test_no_owner_alias_file_changes_nothing(self):
        kit = _kit()
        with tempfile.TemporaryDirectory() as d:
            kit._NAMES["owners"] = kit.read_aliases(d, "OWNER_ALIASES.txt")
        self.assertEqual(kit._NAMES["owners"], {})
        self.assertEqual(kit._fold_owner({"OWNER": "Anyone"})["OWNER"], "Anyone")


if __name__ == "__main__":
    unittest.main()
