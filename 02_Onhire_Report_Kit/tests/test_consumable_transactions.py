import json
import sys
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import consumable_usage as usage


SCHEDULE = "MMG Shutdown July 2026"
START = datetime(2026, 7, 9, 5)
END = datetime(2026, 7, 21, 4, 59, 59)
PULLED = datetime(2026, 11, 28, 18, 51)
FIELDS = ["PRODUCT_CATEGORY", "TRANSACTION_ID", "SKU/ITEM_NUMBER", "QUANTITY", "TRAN_START_DATE",
          "TRAN_START_TIME", "SKU/ITEM DESCRIPTION", "HIRER", "TOTAL_CHARGES", "UOM"]


def consumable(tx="0003", sku="0001", qty=2.5, day="09/07/2026", clock="05:00", unit=""):
    return ["Consumable", tx, sku, qty, day, clock, "Example product", "Private name", 50, unit]


class ConsumableTransactions(unittest.TestCase):
    def setUp(self):
        self.book = Workbook()
        ref = self.book.active
        ref.title = "REFERENCE_INFO"
        ref.append(["PROJECT SCHEDULE", "REPORT_PERIOD"])
        ref.append([SCHEDULE, "08/07/2026 00:00:00 - 22/07/2026 23:59:59"])
        for title in [*usage.TRANSACTION_SHEETS, "FIXED_CHARGES"]:
            self.book.create_sheet(title).append(FIELDS)
        self.addCleanup(self.book.close)

    def observe(self, schedule=SCHEDULE):
        return usage.transaction_observations(self.book, "Jul 2026", schedule, START, END, PULLED)

    def test_one_movement_across_sheets_and_overnight_shift_window(self):
        for title in usage.TRANSACTION_SHEETS:
            self.book[title].append(consumable())
        active = self.book["CUSTOMER_CONTRACTOR_EQUIP"]
        active.append(consumable(tx="4", qty=1, day="21/07/2026", clock="04:59"))
        active.append(consumable(tx="5", qty=100, day="21/07/2026", clock="05:00"))
        active.append(consumable(tx="6", qty=100, clock="04:59"))
        active.append(["Rental", *consumable(tx="7")[1:]])
        self.book["FIXED_CHARGES"].append(consumable(tx="8", qty=500))
        snapshot = self.observe()
        self.assertEqual((snapshot["label"], snapshot["id"], snapshot["status"]), ("July 2026", "july-2026", "partial"))
        self.assertEqual((snapshot["first_observed"], snapshot["last_observed"], snapshot["days_observed"]),
                         ("2026-07-09", "2026-07-20", 2))
        self.assertEqual(snapshot["rows"], [{"sku": "0001", "name": "Example product", "unit": "",
                                            "issued": 3.5, "issue_entries": 2}])
        self.assertNotIn("Private name", json.dumps(snapshot))
        self.assertIsNone(self.observe("Another schedule"))

    def test_duplicate_conflicts_missing_fields_and_mixed_units_do_not_guess(self):
        self.assertIsNone(self.observe())
        self.book["TRANSACTION_WITHOUT_CHARGES"].append(consumable(unit="ea"))
        sheet = self.book["CUSTOMER_CONTRACTOR_EQUIP"]
        for bad in [consumable(qty=3), consumable(sku=""), consumable(unit="packs"),
                    consumable(tx=""), consumable(qty=-1), consumable(clock="")]:
            with self.subTest(row=bad):
                sheet.append(bad)
                self.assertIsNone(self.observe())
                sheet.delete_rows(2)

    def test_same_period_retains_all_sources_and_preserves_sales_priority(self):
        self.book["CUSTOMER_CONTRACTOR_EQUIP"].append(consumable())
        self.book["CUSTOMER_CONTRACTOR_EQUIP"].append(consumable(tx="4", sku="RETIRED", qty=18))
        snapshot = self.observe()
        self.assertEqual([p["sku"] for p in snapshot["rows"]], ["0001", "RETIRED"])
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            minmax = root / "minmax.xlsx"
            sales = root / "sales.json"
            wb = Workbook()
            wb.active.title = "Min Max"
            wb.active["A1"] = "MMG CONSUMABLES"
            daily = wb.create_sheet("July 2026 Daily")
            daily["A5"] = "SKU"
            daily["B5"] = "Line"
            daily["C5"] = "Thu 09 Jul"
            daily["D5"] = "Total"
            daily.append(["0001", "Historical sample", 2, 2])
            wb.save(minmax)
            wb.close()
            current = [{"SKU_NUMBER": sku, "SKU_DESCRIPTION": sku, "SALES_QUANTITY": 0,
                        "RETURN_QUANTITY": 0, "AVAILABLE_QUANTITY": 10} for sku in ["0001", "other"]]
            new_schedule = "Current MMG"
            def report():
                return usage.build(current, {"schedule": new_schedule, "requested": PULLED},
                                   new_schedule, date(2026, 11, 25), minmax=minmax, archive=sales,
                                   interval_history=[{"consumable_observations": snapshot}])
            raw = report()
            self.assertEqual(len(raw["history"]), 1)
            row, other = raw["rows"]
            self.assertEqual((row["history"][0]["issued"], row["average_shuts"]), (2.5, 0))
            self.assertIsNone(other["history"][0]["issued"])
            self.assertEqual((row["credited"], row["available_for_mmg"]), (0, 10))
            closeout = {"id": "jul-2026", "label": "July 2026", "schedule": SCHEDULE,
                        "start": "2026-07-09", "end": "2026-07-20", "as_at": "2026-07-22T09:00",
                        "source": usage.SOURCE, "status": "complete",
                        "rows": [{"sku": "0001", "issued": 3.5, "unit": ""},
                                 {"sku": "old", "name": "Former catalogue product", "unit": "ea",
                                  "issued": 0, "credited": 2, "net": -2, "issue_entries": 0,
                                  "hirer": "Private worker", "total_price": 100}]}
            sales.write_text(json.dumps({"job": usage.JOB, "shuts": [closeout]}))
            combined = report()
            self.assertEqual(len(combined["history"]), 1)
            row = combined["rows"][0]
            self.assertEqual(row["average_shuts"], 1)
            self.assertEqual(row["average_issued"], 3.5)
            self.assertEqual([p["issued"] for p in row["history"][0]["observations"]], [2.5, 2])
            self.assertEqual(len(combined["history"][0]["additional_sources"]), 2)
            sales_view, tx_view = combined["product_sources"]
            self.assertEqual([sales_view["kind"], tx_view["kind"]], ["sales", "transactions"])
            self.assertEqual(sales_view["id"], tx_view["id"])
            legacy, retired = sales_view["rows"]
            self.assertIsNone(legacy["credited"])
            self.assertIsNone(legacy["issue_entries"])
            self.assertEqual((retired["name"], retired["issued"], retired["credited"], retired["net"], retired["issue_entries"]),
                             ("Former catalogue product", 0, 2, -2, 0))
            self.assertNotIn("hirer", retired)
            self.assertNotIn("total_price", retired)
            self.assertEqual(tx_view["rows"], snapshot["rows"])
            self.assertNotIn("_products", json.dumps(combined))
