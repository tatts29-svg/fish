import json
import sys
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import consumable_usage as usage


def stock(sku="A", have=10, **changes):
    return {"SKU_NUMBER": sku, "SKU_DESCRIPTION": "Workshop product " + sku, "AVAILABLE_QUANTITY": have,
            "SALES_QUANTITY": 0, "RETURN_QUANTITY": 0, "STORAGE_UNIT": "Bin A", **changes}


def past(key="july-2026", issued=8, **changes):
    return {"id": key, "label": key, "schedule": "MMG " + key, "status": "complete", "source": "SiteIQ closing pull",
            "start": "2026-07-18", "end": "2026-07-21", "as_at": "2026-07-22T07:00:00",
            "rows": [{"sku": "A", "issued": issued, "unit": ""}], **changes}


class ConsumableUsage(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.archive = Path(tmp.name) / "consumable_usage_history.json"
        self.minmax = Path(tmp.name) / "minmax.xlsx"
        self.schedule = "MMG November current shutdown"
        self.as_at = datetime(2026, 12, 1, 6, 4)
        self.closes = datetime(2026, 12, 1, 6)

    def report(self, rows=None, **changes):
        ref = {"schedule": self.schedule, "requested": self.as_at, **changes}
        return usage.build(rows if rows is not None else [stock()], ref, self.schedule, date(2026, 11, 25),
                           self.minmax, self.archive, self.closes)

    def write(self, periods, **extra):
        self.archive.write_text(json.dumps({"job": usage.JOB, "shuts": periods, **extra}))

    def test_real_measures_independent_and_unknowns(self):
        sale = stock(have=90, SALES_QUANTITY="3.5", RETURN_QUANTITY=1, HIRER="Example")
        rows = [sale, sale, stock(have=3), stock(have=3), stock(have=2, STORAGE_UNIT="Bin B"),
                stock("B", have=None), stock("C", have=0),
                stock("D", have=1, COMPANY_NAME="Example", SALES_QUANTITY=3, RETURN_QUANTITY=None)]
        a,b,c,d = self.report(rows)["rows"]
        self.assertEqual((a["issued"], a["credited"], a["net"], a["available_for_mmg"]), (7, 2, 5, 5))
        self.assertEqual((b["issued"], b["credited"], b["available_for_mmg"]), (0, 0, None))
        self.assertEqual((c["available_for_mmg"], d["available_for_mmg"], d["net"]), (0, None, None))
        only_credit = self.report([stock(), stock(have=0, RETURN_QUANTITY=2, RETURN_REASON="Unopened")])["rows"][0]
        self.assertEqual((only_credit["issued"], only_credit["credited"], only_credit["net"], only_credit["available_for_mmg"]), (0, 2, -2, 10))

    def test_invalid_fields_bins_and_mixed_units(self):
        for rows in ([stock(have=1), stock(have=2)], [stock(have=None), stock(have=3, STORAGE_UNIT="B")],
                     [stock(have=2), stock(have=7, STORAGE_UNIT="")], [stock(have=-1)],
                     [stock(have=1, UOM="pack"),stock(have=2, UOM="ea")]):
            self.assertIsNone(self.report(rows)["rows"][0]["available_for_mmg"])
        self.assertEqual(self.report([stock(have="1,000")])["rows"][0]["available_for_mmg"], 1000)
        for value in (-1, None, "NaN", "3,2", True, "unknown"):
            self.assertIsNone(self.report([stock(SALES_QUANTITY=value)])["rows"][0]["issued"])
        self.assertFalse(self.report([stock()], schedule="A different job")["rows"])

    def test_qualified_mean_includes_known_zero_no_unknowns_and_latest_snapshot_only(self):
        second = past("march-2026", 0,start="2026-03-01",end="2026-03-05",as_at="2026-03-06T10:00:00")
        older = past(issued=15, as_at="2026-07-22T06:00:00")
        future = past("future", 50,start="2027-01-01",end="2027-01-05",as_at="2027-01-06T10:00:00")
        current = past("current", 100, schedule=self.schedule)
        missing = past("nov-2025", rows=[{"sku":"B", "issued": 12, "unit":"ea"}])
        unfinished = past("apr-2025", 200, status="partial")
        self.write([past(), past(), second, older, future, current, missing, unfinished])
        a,b = self.report([stock(), stock("B",UOM="litres")])["rows"]
        self.assertEqual((a["average_issued"], a["average_shuts"]), (4,2))
        self.assertEqual((b["average_issued"], b["average_shuts"]), (None,0))

    def test_conflicting_history_and_wrong_job(self):
        self.write([past(),past(issued=7)])
        self.assertIsNone(self.report()["rows"][0]["average_issued"])
        self.write([past(),past(key="same-shut",schedule="MMG july-2026")])
        self.assertIsNone(self.report()["rows"][0]["average_issued"])
        self.write([past()],job="Another MMG mine")
        self.assertIsNone(self.report()["rows"][0]["average_issued"])

    def test_partial_raw_snapshot_displays_observed_issue_without_promoting_it(self):
        self.write([past(status="partial", start="", end="", issued=4)])
        r = self.report()
        self.assertEqual(r["history"][0]["status"], "partial")
        self.assertEqual(r["rows"][0]["history"], [{"id": "july-2026", "issued": 4, "qualified": False}])
        self.assertEqual(r["rows"][0]["average_shuts"], 0)
        self.write([past(issued=8), past(status="partial", as_at="2026-07-25T08:00", start="", end="", issued=4)])
        self.assertEqual(self.report()["rows"][0]["average_issued"], 8)
        self.write([past(job="A different mine")])
        self.assertFalse(self.report()["history"])

    def test_unit_conflict_disqualifies_comparison_even_if_archive_unit_is_missing(self):
        self.write([past()])
        item = self.report([stock(UOM="pack"), stock(UOM="litres")])["rows"][0]
        self.assertEqual((item["average_issued"], item["average_shuts"]), (None, 0))

    def test_minmax_observations_do_not_promote_rounded_zero_or_partial_to_complete(self):
        wb = openpyxl.Workbook();wb.active.title="Min Max";wb.active["A1"]="MMG CONSUMABLES - test"
        sheet=wb.create_sheet("July 2026 Daily")
        for row in ([""],[""],[""],[""],["SKU","Line","Thu 09 Jul","Fri 10 Jul","Total"],
                    ["A","A",None,7,7],["B","B",None,None,0]):
            sheet.append(row)
        wb.save(self.minmax);wb.close()
        r=self.report([stock(),stock("B")])
        self.assertEqual(r["history"][0]["last_observed"], "2026-07-10")
        self.assertEqual([item["history"][0]["issued"] for item in r["rows"]], [7,None])
        self.assertEqual(r["rows"][0]["average_shuts"],0)
        self.write([past(key="jul-2026")]); r=self.report()
        self.assertEqual(len(r["history"]),1)
        self.assertEqual(r["rows"][0]["history"][0]["observations"][0]["issued"],7)
        self.assertEqual((r["rows"][0]["average_issued"], r["rows"][0]["average_shuts"]),(8,1))

    def test_signed_closeout_qualified_by_pull_and_actual_final_shift(self):
        approval={"schedule":self.schedule,"confirmed_by":"Andrew Fisher","sales_as_at":"2026-12-01T06:04+10:00"}
        self.write([],current_closeout=approval)
        self.assertEqual(self.report()["status"],"final")
        self.assertEqual(self.report(requested=datetime(2026,12,1,6,5))["status"],"provisional")
        self.write([],current_closeout={**approval,"confirmed_by":"Unknown"})
        self.assertEqual(self.report()["status"],"provisional")
        t=datetime(2026,11,30,18)
        self.write([], current_closeout={**approval,"sales_as_at":t.isoformat()})
        self.assertEqual(self.report(requested=t)["status"],"provisional")
