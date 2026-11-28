import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import utilisation


class ConcurrentHires(unittest.TestCase):
    start = datetime(2026, 7, 9, 5)
    end = datetime(2026, 7, 9, 9)
    fields = ["TRANSACTION_ID", "SKU/ITEM_NUMBER", "PRODUCT_CATEGORY", "QUANTITY",
              "TRAN_START_DATE", "TRAN_START_TIME", "TRAN_END_DATE", "TRAN_END_TIME",
              "ITEM_OWNER", "PRODUCT_VARIANT_ID", "SKU/ITEM DESCRIPTION", "PRODUCT_VARIANT"]

    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.directory = Path(directory.name)
        self.book = Workbook()
        self.addCleanup(self.book.close)
        reference = self.book.active
        reference.title = "REFERENCE_INFO"
        reference.append(["REPORT_PERIOD", "PROJECT SCHEDULE", "REQUESTED_DATE/TIME (LOCAL TIME)"])
        reference.append(["09/07/2026 05:00:00 - 09/07/2026 12:00:00", "Approved job", self.end])

    def sheet(self, name, rows):
        sheet = self.book.create_sheet(name)
        sheet.append(self.fields)
        for row in rows:
            sheet.append(row)

    def loan(self, event, asset, start, end, owner="Coates", variant="V4", category="Rental", qty=1):
        return [event, asset, category, qty, "09/07/2026", start,
                "09/07/2026" if end is not None else None, end, owner, variant, "Impact socket", "Human readable name"]

    def save(self):
        path = self.directory / "transactions.xlsx"
        self.book.save(path)
        return path

    def test_elapsed_asset_hours_overlaps_duplicates_and_clipped_open_hires(self):
        # A is out 05:00–07:30 (overlapping records). B is out 06:00–09:00.
        # C is out 07:30–08:00, starting at precisely A's release.
        a = self.loan("a1", "A", "04:00", "07:00")
        self.sheet("TRANSACTION_WITHOUT_CHARGES", [
            a, self.loan("a2", "A", "06:55", "07:30"),
            self.loan("b", "B", "06:00", None, "MMG", ""),
            self.loan("c", "C", "07:30", "08:00"),
            self.loan("x", "sale", "05:00", "09:00", category="Consumable"),
            self.loan("late", "Later", "10:00", None)])
        duplicate = list(a)
        duplicate[8:10] = [None, None]
        self.sheet("CUSTOMER_CONTRACTOR_EQUIP", [duplicate])
        self.sheet("FIXED_CHARGES", [self.loan("y", "Fixed", "05:00", "09:00")])
        row = utilisation.concurrent_hires(self.save(), "Test", self.start, self.end)
        self.assertEqual(row["total"], {"average": 1.5, "peak": 2})
        self.assertEqual(row["variants"]["v:V4"], {"average": .75, "peak": 1})
        self.assertEqual(row["variant_owners"]["d:MMG|IMPACT SOCKET"]["mmg"], {"average": .75, "peak": 1})
        self.assertEqual(row["quality"], "recorded")
        self.assertEqual(row["excluded_rows"], 0)

    def test_bad_dates_conflicting_duplicates_ambiguous_open_and_unknown_owner(self):
        missing_end = self.loan("partial", "P", "05:00", "06:00")
        missing_end[7] = None
        self.sheet("TRANSACTION_WITHOUT_CHARGES", [
            self.loan("open", "B", "05:00", None), self.loan("next", "B", "08:00", "09:00", "", ""),
            self.loan("bad", "C", "08:00", "09:00"),
            self.loan("multi", "Q", "05:00", "09:00", qty=3), missing_end])
        self.sheet("CUSTOMER_CONTRACTOR_EQUIP", [self.loan("bad", "C", "07:50", "09:00")])
        row = utilisation.concurrent_hires(self.save(), "Test", self.start, self.end)
        self.assertEqual(row["quality"], "partial")
        self.assertEqual(row["excluded_rows"], 4)
        self.assertEqual(row["unassigned_owner"], 1)
        self.assertEqual(row["total"], {"average": .25, "peak": 1})
        self.assertEqual(row["owners"], {})
        self.assertEqual(row["variants"], {})

    def test_archive_limits_schedule_and_imported_periods_override_summaries(self):
        self.sheet("TRANSACTION_WITHOUT_CHARGES", [self.loan("a1", "A", "05:00", None)])
        file = self.save()
        with self.assertRaisesRegex(ValueError, "another project"):
            utilisation.archived_average(file, "July", self.start, self.end, expected_schedule="Other")
        with self.assertRaisesRegex(ValueError, "outside"):
            utilisation.archived_average(file, "July", self.end, self.end.replace(hour=10), expected_schedule="Approved job")
        row = utilisation.archived_average(file, "July", self.start.replace(hour=4), self.end.replace(hour=12),
                                         expected_schedule="Approved job", coverage_note="8 of 11 days.")
        self.assertEqual((row["start"], row["end"]), (self.start.isoformat(), self.end.isoformat()))
        self.assertEqual(row["total"], {"average": 1, "peak": 1})
        self.assertEqual(row["quality"], "partial")
        self.assertIn("8 of 11", row["reason"])
        fixture = self.directory / "averages.json"
        fixture.write_text(json.dumps({"schema": 1, "periods": [row]}))
        imported = utilisation.load_interval_history(fixture)
        rows = utilisation.past_concurrency({"tools": [{"label": "July", "peaks": {"x": 99}},
                                                         {"label": "October", "per_day": 12}]}, imported)
        self.assertEqual(rows[0]["total"], row["total"])
        self.assertEqual(rows[1]["quality"], "unavailable")
        self.assertIsNone(rows[1]["total"]["average"])
        fixture.write_text(json.dumps({"schema": 1, "periods": [row, row]}))
        with self.assertRaisesRegex(ValueError, "duplicate"):
            utilisation.load_interval_history(fixture)


if __name__ == "__main__":
    unittest.main()
