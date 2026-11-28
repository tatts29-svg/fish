"""The client exports must preserve independent quantities, source gaps and period coverage."""

import tempfile
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from openpyxl import load_workbook
from reportlab import rl_config

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from consumable_usage_export import write_excel, write_exports


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
            self.assertEqual(list(w["Historical issues"].values)[4][5:7], (3, "No"))
            self.assertEqual(list(w["Additional observations"].values)[4][7], 1)
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

    def test_original_stock_codes_include_stock_only_lines_and_separate_sources(self):
        period = {"label": "May 2025", "start": "2025-04-27", "end": "2025-05-07",
                  "status": "partial", "as_at": "2026-11-29T00:13:00"}
        item = {"sku": "00027", "name": "=Discontinued product", "issued": 4, "issue_entries": 2}
        data = {"product_sources": [
            {**period, "kind": "sales", "source": "SiteIQ SALES_STOCK",
             "rows": [{**item, "credited": 1, "net": 3, "unit": "each"},
                      {"sku": "00028", "name": "Stock only", "issued": 0, "credited": 0,
                       "net": 0, "issue_entries": 0}]},
            {**period, "kind": "transactions", "source": "SiteIQ TRANSACTIONS", "rows": [item]},
        ]}
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "products.xlsx"
            write_excel(file, data)
            workbook = load_workbook(file)
            try:
                tab = workbook["Original stock codes"]
                records = list(tab.values)[4:]
                self.assertEqual([r[1] for r in records], ["00027", "00028", "00027"])
                self.assertEqual(records[0][4:9], (4, 1, 3, 2, "SiteIQ SALES_STOCK"))
                self.assertEqual(records[1][4:9], (0, 0, 0, 0, "SiteIQ SALES_STOCK"))
                self.assertEqual(records[2][3:9], (None, 4, None, None, 2, "SiteIQ TRANSACTIONS"))
                self.assertEqual(records[0][9:], ("2025-04-27 to 2025-05-07", "29 Nov 2026 00:13 AEST"))
                self.assertEqual(tab["C5"].data_type, "s")
                self.assertEqual(tab.auto_filter.ref, "A4:K7")
            finally:
                workbook.close()

    def test_changed_codes_and_missing_evidence_in_historical_matches(self):
        records = [
            {"id": "may", "issued": 4, "match_method": "description", "source_sku": "00003",
             "source_name": "Filter 4 mm"},
            {"id": "apr", "issued": 0, "match_method": "barcode", "source_sku": "00004",
             "source_name": "4 mm filter"},
            {"id": "mar", "issued": 6},
            {"id": "feb", "issued": None},
        ]
        report = {"rows": [{"sku": "00600", "name": "Filter 4 mm", "history": records}]}
        with tempfile.TemporaryDirectory() as directory, patch.object(rl_config, "pageCompression", 0):
            write_exports(report, directory)
            path = Path(directory)
            w = load_workbook(path / "consumables-usage.xlsx")
            try:
                history = list(w["Historical issues"].values)
                self.assertIn("unique exact product description", history[2][0])
                self.assertEqual([r[7:] for r in history[4:]], [
                    ("00003", "Filter 4 mm", "Exact product description"),
                    ("00004", "4 mm filter", "Verified barcode"),
                    ("00600", None, "Same stock code"),
                    (None, None, None),
                ])
                self.assertEqual([r[5] for r in history[4:]], [4, 0, 6, None])
            finally:
                w.close()
            self.assertIn(b"product specifications and units", (path / "consumables-usage.pdf").read_bytes())


if __name__ == "__main__":
    unittest.main()
