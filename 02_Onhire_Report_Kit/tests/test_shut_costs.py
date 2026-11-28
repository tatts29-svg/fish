"""shut_costs: labour is hours times the typed rate, charges are as typed,
and "to date" stops at the day of the pull. Made-up figures only."""
import datetime as dt
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import shut_costs  # noqa: E402

SPEC = {
    "rates": {"Day": 10.0, "Night": 20.0},
    "roster": [
        {"date": "2030-01-01", "type": "Mobilisation", "name": "A Person", "shift": "Day", "start": "06:00", "finish": "18:00", "hours": 12},
        {"date": "2030-01-02", "type": "Shutdown", "name": "A Person", "shift": "Day", "start": "06:00", "finish": "18:00", "hours": 12},
        {"date": "2030-01-02", "type": "Shutdown", "name": "B Person", "shift": "Night", "start": "18:00", "finish": "06:00", "hours": 12},
        {"date": "2030-01-03", "type": "Shutdown", "name": "B Person", "shift": "Night", "start": "18:00", "finish": "06:00", "hours": 6},
    ],
    "charges": [{"date": "2030-01-02", "tooling": 100.5, "services": 5}, {"date": "2030-01-03", "tooling": 100.5, "services": 5},
                {"date": "2030-01-01", "flights": 50}],
    "starts": {"labour": "2030-01-01", "nights": "2030-01-02"},
}


class ShutCosts(unittest.TestCase):
    def setUp(self):
        self.c = shut_costs.build(SPEC, dt.date(2030, 1, 2))

    def test_labour_is_hours_times_rate(self):
        self.assertEqual([r["cost"] for r in self.c["roster"]], [120.0, 120.0, 240.0, 120.0])

    def test_totals_by_category(self):
        cats = {c["key"]: c for c in self.c["cats"]}
        self.assertEqual(cats["labour"]["total"], 600.0)
        self.assertEqual(cats["tooling"]["total"], 201.0)
        self.assertEqual(cats["services"]["total"], 10.0)
        self.assertEqual(cats["flights"]["total"], 50.0)
        self.assertEqual(self.c["total"], 861.0)

    def test_to_date_stops_at_the_pull_day(self):
        self.assertEqual(self.c["sofar"], 120 + 50 + 120 + 240 + 100.5 + 5)
        self.assertEqual([d["done"] for d in self.c["days"]], [True, True, False])
        self.assertEqual(self.c["hours_done"], 36)
        self.assertEqual(self.c["hours"], 42)

    def test_running_total_ends_at_the_total(self):
        self.assertEqual(self.c["days"][-1]["running"], self.c["total"])
        self.assertEqual(sum(d["total"] for d in self.c["days"]), self.c["total"])

    def test_people(self):
        p = {x["name"]: x for x in self.c["people"]}
        self.assertEqual((p["B Person"]["hours"], p["B Person"]["cost"], p["B Person"]["night"]), (18, 360.0, 2))
        self.assertEqual(p["B Person"]["cost_done"], 240.0)

    def test_a_shift_without_a_rate_stops_the_build(self):
        bad = dict(SPEC, roster=[dict(SPEC["roster"][0], shift="Swing")])
        with self.assertRaises(ValueError):
            shut_costs.build(bad, dt.date(2030, 1, 2))


class MmgCloseout(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.job = Path(temp.name)
        self.spec_path = self.job / "costs.json"
        self.spec = {"confirmed": shut_costs.MMG_ORIGINAL_CONFIRMATION, "rates": {"Day": 10, "Night": 20},
                     "role": "Controller", "roster": [], "charges": []}
        for day in ("2026-11-30", "2026-12-01", "2026-12-02"):
            for name in ("Thomas Maher", "Cody Mitchel"):
                fatigue = day == "2026-12-01" and name == "Cody Mitchel"
                self.spec["roster"].append({"date": day, "name": name, "shift": "Day",
                                            "type": "Fatigue day" if fatigue else "Shutdown",
                                            "start": "07:00" if fatigue else "06:00",
                                            "finish": "15:00" if fatigue else "18:00", "hours": 8 if fatigue else 12})
            self.spec["charges"].append({"date": day, "tooling": 100, "services": 5, "flights": 50})
        self.spec_path.write_text(json.dumps(self.spec), encoding="utf-8")

    def load(self, when=dt.date(2026, 11, 28), schedule=shut_costs.MMG_SCHEDULE):
        return shut_costs.load(self.spec_path, when, schedule)

    def test_amend_only_dated_charges_and_rostered_workers(self):
        costs = self.load()
        mon, tue, wed = costs["days"]
        self.assertEqual((mon["total"], tue["type"], tue["tooling"], tue["services"], tue["flights"]),
                         (395, "Demobilisation", 0, 0, 50))
        self.assertEqual((wed["type"], wed["labour"], wed["tooling"], wed["services"], wed["flights"]),
                         ("Fly out", 80, 100, 5, 50))
        cody, thomas = [r for r in costs["roster"] if r["iso"] == tue["iso"]]
        self.assertEqual((cody["note"], cody["hours"], cody["start"], cody["finish"]), ("Fatigue day", 8, "07:00", "15:00"))
        self.assertEqual((thomas["hours"], thomas["start"], thomas["finish"]), (12, "06:00", "18:00"))
        for r in costs["roster"][-2:]:
            self.assertEqual((r["start"], r["finish"], r["hours"], r["rate"]), ("07:00", "11:00", 4, 10))
        self.assertEqual({p["name"] for p in costs["people"]}, {"Cody Mitchell", "Thomas Maher"})
        self.assertEqual(costs["hours"], 52)
        self.assertEqual(self.load(dt.date(2026, 12, 1))["sofar"], mon["total"] + tue["total"])
        self.assertEqual(self.load(dt.date(2026, 12, 2))["sofar"], costs["total"])
        self.assertEqual(json.loads(self.spec_path.read_text()), self.spec)

    def test_historical_other_schedule_and_later_approved_specs_are_preserved(self):
        self.assertEqual(self.load(dt.date(2026, 11, 27))["hours"], 68)
        self.assertEqual(self.load(schedule="Another MMG shutdown")["hours"], 68)
        self.spec["confirmed"] = "Updated roster"
        self.spec["roster"][-1].update(start="08:00", finish="10:00", hours=2)
        self.spec_path.write_text(json.dumps(self.spec), encoding="utf-8")
        self.assertEqual(self.load()["hours"], 58)
        self.assertEqual(self.load()["days"][1]["tooling"], 100)

    def test_native_job_pack_workbook_reads_same_effective_ledger(self):
        import build_onhire_workbook as kit
        import openpyxl
        (self.job / "kit").mkdir()
        (self.job / "job.json").write_text(json.dumps({"paths": {"costs": "costs.json"}}))
        prev = kit.JOB_SEEDS["mmg"]
        seed = kit._packed_mmg_seed(self.job / "kit", shut_costs.MMG_SCHEDULE, dt.date(2026, 11, 28), prev)
        book = openpyxl.Workbook()
        labour = book.active
        labour.title = "Coates Labour"
        charges = book.create_sheet("Cost Breakdown")
        kit.seed_labour(labour, seed)
        kit.seed_costs(charges, seed)
        self.assertEqual([(r[3].value, r[4].value, r[5].value, r[6].value) for r in list(labour.rows)[9:11]],
                         [(n, dt.time(7), dt.time(11), 4) for n in ("Cody Mitchell", "Thomas Maher")])
        self.assertEqual([charges.cell(4, i).value for i in (2, 3, 5, 6)], ["Demobilisation", 0, 0, 50])
        self.assertTrue(kit._same_as_seed(labour, "Coates Labour", seed))
        labour["G6"] = 7
        self.assertFalse(kit._same_as_seed(labour, "Coates Labour", seed))
        book.close()

    def test_native_rerun_updates_an_unedited_legacy_seed_and_preserves_typed_changes(self):
        import build_onhire_workbook as kit
        import openpyxl
        from contextlib import redirect_stdout
        from io import StringIO

        base = self.job / "kit"
        base.mkdir()
        (self.job / "job.json").write_text(json.dumps({"paths": {"costs": "costs.json"}}))
        (base / "JOB.txt").write_text("short: MMG\nproject_schedule: " + shut_costs.MMG_SCHEDULE + "\n")
        site = kit.LooseSite(str(base))
        latest = base / "MMG_Onhire_Workbook_LATEST.xlsx"
        prev = kit.JOB_SEEDS["mmg"]
        book = openpyxl.Workbook()
        book.active.title = "Coates Labour"
        kit.seed_labour(book.active, prev)
        kit.seed_costs(book.create_sheet("Cost Breakdown"), prev)
        book.save(latest)
        book.close()
        when = dt.date(2026, 11, 28)
        with redirect_stdout(StringIO()):
            updated = openpyxl.Workbook()
            _, labour, total, roster = kit.carry_over(updated, site, str(base), "MMG", when)
            self.assertEqual((labour, total, roster["rostered"]), (520, self.load()["total"], 52))
            updated["Coates Labour"]["G6"] = 7
            updated.save(latest)
            updated.close()
            carried = openpyxl.Workbook()
            kit.carry_over(carried, site, str(base), "MMG", when)
            self.assertEqual(carried["Coates Labour"]["G6"].value, 7)
            carried.close()


if __name__ == "__main__":
    unittest.main()
