"""The client exports must preserve independent quantities, source gaps and period coverage."""

import tempfile
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from openpyxl import load_workbook
from reportlab import rl_config

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from consumable_usage_export import write_exports


class ConsumableExportTests(unittest.TestCase):
    def test_stock_only_blanks_credits_and_overlapping_archives_remain_distinct(self):
        snapshot = {
            "project": "MMG Dugald River",
            "as_at": "2026-11-28T12:49:00+10:00",
            "status": "provisional",
            "history": [
                {"id": "jul-2026", "label": "July 2026", "status": "partial", "source": "Sales export"}
            ],
            "rows": [
                {
                    "name": "=Example stock",
                    "sku": "00123",
                    "unit": "",
                    "issued": 0,
                    "credited": 0,
                    "net": 0,
                    "available_for_mmg": 8,
                    "average_issued": None,
                    "average_shuts": 0,
                    "history": [
                        {
                            "id": "jul-2026",
                            "issued": 3,
                            "qualified": False,
                            "observations": [
                                {
                                    "source": "Retained observations",
                                    "issued": 1,
                                    "first_observed": "2026-07-03",
                                }
                            ],
                        }
                    ],
                },
                {
                    "name": "Item 2",
                    "sku": "00124",
                    "unit": "boxes",
                    "issued": 6.125,
                    "credited": 2,
                    "net": 4.125,
                    "available_for_mmg": None,
                    "average_issued": None,
                    "average_shuts": 0,
                },
            ],
        }
        with tempfile.TemporaryDirectory() as directory, patch.object(rl_config, "pageCompression", 0):
            root = Path(directory)
            write_exports(snapshot, root)
            w = load_workbook(root / "consumables-usage.xlsx")
            self.addCleanup(w.close)
            self.assertEqual(w.active["A8"].data_type, "s")
            self.assertEqual(
                list(w.active.values)[7],
                ("=Example stock", "00123", "Not recorded", 8, 0, 0, 0, None, 0),
            )
            self.assertEqual(
                list(w.active.values)[8], ("Item 2", "00124", "boxes", None, 6.125, 2, 4.125, None, 0)
            )
            self.assertEqual(list(w["Historical issues"].values)[4][-2:], (3, "No"))
            self.assertEqual(list(w["Additional observations"].values)[4][-1], 1)
            pdf = (root / "consumables-usage.pdf").read_bytes()
            for phrase in (
                b"Provisional",
                b"00123",
                b"00124",
                b"6.125",
                b"4.125",
                b"July 2026",
                b"No verified complete",
            ):
                self.assertIn(phrase, pdf)

    def test_no_rows_is_explicit_in_both_formats(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(rl_config, "pageCompression", 0):
            root = Path(directory)
            write_exports({"rows": [], "history": [], "status": "provisional"}, root)
            wb = load_workbook(root / "consumables-usage.xlsx")
            try:
                self.assertIn("No product records", wb.active["A8"].value)
                self.assertIn("No historical shutdown sources", wb["Source coverage"]["A5"].value)
            finally:
                wb.close()
            pdf = (root / "consumables-usage.pdf").read_bytes()
            self.assertIn(b"No product records", pdf)
            self.assertIn(b"No historical shutdown sources", pdf)


if __name__ == "__main__":
    unittest.main()
