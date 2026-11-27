"""History imports and successful or failed report rebuilds use real workbook metadata."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import sys
import json

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import rebuild
from upload_policy import MMG_SCHEDULE


def rental(path, stamp, schedule=MMG_SCHEDULE):
    book = openpyxl.Workbook()
    stock = book.active
    stock.title = "RENTAL_STOCK"
    stock.append(["ITEM_NUMBER", "OWNER", "PRODUCT_VARIANT ", "ITEM_STATUS", "ITEM_DESCRIPTION", "HIRER"])
    for asset in ["A", "A", "", "B"]:
        stock.append([asset, "Coates", "X", "On Hire", "Tool", "Example person"])
    stock.append(["C", "Mine", "", "Available", "Spanner", "Another person"])
    ref = book.create_sheet("REFERENCE_INFO")
    ref.append(["PROJECT SCHEDULE", "REQUESTED_DATE/TIME (LOCAL TIME)"])
    ref.append([schedule, stamp])
    book.save(path)


class VariantHistory(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.job = self.root / "job"
        kit = self.job / "kit"
        data = kit / "Data_SiteIQ"
        data.mkdir(parents=True)
        (self.job / "job.json").write_text("{}")
        (kit / "JOB.txt").write_text("customer: MMG\nlocation: Dugald River QLD\n")
        (kit / "OWNER_ALIASES.txt").write_text("Mine=MMG\n")
        self.current = data / "RENTAL_STOCK.xlsx"
        rental(self.current, "27/11/2026 02:39 PM")
        self.old = self.root / "earlier.xlsx"
        rental(self.old, "27/11/2026 06:54 AM")
        self.history = self.root / rebuild.VARIANT_ARCHIVE

    def test_import_keeps_only_counts_and_descriptions(self):
        original = self.current.read_bytes()
        for i in range(2):
            rebuild.import_history(self.job, self.root, self.old, "RENTAL_STOCK")
        history = json.loads(self.history.read_text())
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["counts"], {"v:X": [2, 2], "d:MMG|SPANNER": [1, 0]})
        self.assertNotIn("Example person", self.history.read_text())
        self.assertEqual(original, self.current.read_bytes())

    def test_invalid_and_current_imports_leave_history_untouched(self):
        for stamp, schedule in [("27/11/2026 02:39 PM", MMG_SCHEDULE),
                                ("27/11/2026 06:54 AM", "Other job")]:
            rental(self.old, stamp, schedule)
            with self.assertRaises(ValueError):
                rebuild.import_history(self.job, self.root, self.old, "RENTAL_STOCK")
            self.assertFalse(self.history.exists())

    def test_failed_rebuild_does_not_commit_current_snapshot(self):
        rebuild.import_history(self.job, self.root, self.old, "RENTAL_STOCK")
        original = self.history.read_bytes()
        with patch.object(rebuild, "build", side_effect=rebuild.Stop("test")):
            self.assertEqual(rebuild.main(str(self.job), str(self.root), current=True), 1)
        self.assertEqual(original, self.history.read_bytes())


if __name__ == "__main__":
    unittest.main()
