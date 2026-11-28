import datetime as dt
import json
import sys
import tempfile
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import stocktake_store as store


class CountLedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.roster = ["Example Controller"]
        row = {"kind": "cons", "key": "007", "name": "Stock line", "expected": 12, "status": ""}
        data = {"stocktake": {"schedule": store.MMG_SCHEDULE, "rows": [row]}}
        (self.folder / "report.html").write_text("const D=" + json.dumps(data) + ", LOGO='';")
        self.entry = {"request_id": str(uuid.uuid4()), "round": "opening", "kind": "cons",
                      "item_id": "007", "quantity": 9, "person": self.roster[0]}

    def test_accepted_opening_keeps_successful_retry_and_blocks_new_opening_counts(self):
        saved = store.record(self.folder, self.entry, self.roster)
        published = self.folder / "report.html"
        data = store.published_report(published)
        data["stocktake"]["rounds"] = [{"carry_forward": {"status": "accepted"}}]
        nxt = self.folder / "new.html"
        nxt.write_text("const D=" + json.dumps(data) + ";")
        nxt.replace(published)
        self.assertEqual(store.record(self.folder, self.entry, self.roster), saved)
        with self.assertRaises(store.CountError) as error:
            store.record(self.folder, dict(self.entry, request_id=str(uuid.uuid4())), self.roster)
        self.assertEqual(error.exception.status, 409)
        for stage in ("routine", "closeout"):
            self.assertEqual(store.record(self.folder, dict(self.entry, request_id=str(uuid.uuid4()), round=stage),
                                          self.roster)["round"], stage)

    def test_routine_checks_remain_distinct_from_formal_rounds(self):
        rows = []
        for stage in ("opening", "routine", "closeout"):
            payload = dict(self.entry, round=stage, request_id=str(uuid.uuid4()))
            entry = store.record(self.folder, payload, self.roster)
            self.assertEqual(store.record(self.folder, payload, self.roster), entry)
            self.assertEqual((entry["round"], entry["person"], entry["quantity"]), (stage, self.roster[0], 9))
            self.assertEqual(store.shift_for(dt.datetime.fromisoformat(entry["counted_at"]))[1:],
                             (entry["shift"], entry["shift_date"]))
            rows.append(entry)
        self.assertEqual(store.all_entries(self.folder), rows)
        with self.assertRaises(store.CountError):
            store.record(self.folder, dict(self.entry, round="since_arrival"), self.roster)
        with self.assertRaises(store.CountError):
            store.record(self.folder, dict(self.entry, round="routine", person="Unlisted Counter"), self.roster)

    def test_concurrent_retries_and_recounts(self):
        recount = dict(self.entry, request_id=str(uuid.uuid4()), quantity=11)
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = [pool.submit(store.record, self.folder, entry, self.roster)
                       for entry in [self.entry] * 4 + [recount]]
            for future in futures:
                self.assertEqual(future.result()["expected_quantity"], 12)
        self.assertEqual(sorted(r["quantity"] for r in store.all_entries(self.folder)), [9, 11])
        with self.assertRaises(store.CountError):
            store.record(self.folder, dict(self.entry, quantity=11), self.roster)
        (self.folder / "report.html").unlink()
        self.assertEqual(store.record(self.folder, self.entry, self.roster)["quantity"], 9)

    def test_night_shift_uses_its_start_date(self):
        for hour, shift, day in ((0, "Night", "01"), (5, "Night", "01"), (6, "Day", "02"),
                                  (17, "Day", "02"), (18, "Night", "02")):
            instant = dt.datetime(2026, 12, 2, hour, tzinfo=store.QUEENSLAND)
            _, actual_shift, actual_day = store.shift_for(instant)
            self.assertEqual((actual_shift, actual_day), (shift, "2026-12-" + day))
