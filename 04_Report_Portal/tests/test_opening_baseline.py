"""Exercise adoption, rollback and subsequent builds at the portal's rebuild entry point."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import rebuild
import stocktake


def report(path, rows, rounds=None, schedule=rebuild.MMG_SCHEDULE):
    data = {"asat": "28 Nov 2026 05:39", "sales_asat": "2026-11-28T05:38:00",
            "stocktake": {"schedule": schedule, "rows": rows, "rounds": rounds or []}}
    path.write_text("const D=" + json.dumps(data) + ";\n" + " " * 1100)


class OpeningBaseline(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.volume = Path(tmp.name)
        self.job = self.volume / "job"
        (self.job / "kit/Data_SiteIQ").mkdir(parents=True)
        (self.job / "kit/JOB.txt").write_text("customer: MMG\nlocation: Dugald River")
        (self.job / "job.json").write_text("{}")
        self.prior = self.volume / "report.html"
        self.pin = self.volume / rebuild.OPENING_BASELINE
        self.a = {"kind": "tool", "key": "A", "name": "Original", "who": "sighting actor", "expected": 1,
                  "checks": [], "status": "In store"}
        self.b = {"kind": "cons", "key": "B", "name": "New SKU", "expected": 4}
        self.now = [self.b]
        self.seeds = []
        self.enterContext(patch.object(rebuild, "build", side_effect=self.build))
        self.enterContext(patch.dict(rebuild.os.environ, REBUILD_SKIP_PDF="1", RAILWAY_PROJECT_NAME=""))

    def build(self, job, out):
        dest = Path(out)
        baseline = dest / rebuild.OPENING_BASELINE
        self.seeds.append(baseline.is_file())
        opening = {"tools": {"checked": 0}, "cons": {"checked": 0}}
        stocktake.accepted_opening(opening, baseline if baseline.is_file() else None, rebuild.MMG_SCHEDULE)
        report(dest / "report.html", self.now, [opening])
        (dest / "qr-report-data.json").write_text('{"source": "fixture"}')
        (dest / "onhire").mkdir(exist_ok=True)
        (dest / "onhire/onhire.xlsx").write_bytes(b"r" * 1500)
        for name in ("consumables-usage.xlsx", "consumables-usage.pdf"):
            (dest / name).write_bytes(b"x" * 1200)

    def rebuild(self):
        return rebuild.main(str(self.job), str(self.volume), current=True)

    def test_pins_previous_register_and_preserves_across_later_refreshes(self):
        report(self.prior, [self.a])
        self.assertEqual(self.rebuild(), 0)
        self.assertEqual(self.seeds, [True])
        raw = self.pin.read_bytes()
        saved = json.loads(raw)
        self.assertNotIn(b"sighting actor", raw)
        self.assertEqual([(r["kind"], r["key"]) for r in saved["rows"]], [("tool", "A")])
        self.assertEqual((saved["inventory_asat"], saved["rental_asat"], saved["sales_asat"]),
                         ("", "2026-11-28T05:39", "2026-11-28T05:38"))
        self.assertEqual(self.rebuild(), 0)
        self.assertEqual(self.pin.read_bytes(), raw)
        accepted = rebuild.published_report(self.prior)["stocktake"]["rounds"][0]
        self.assertEqual(accepted["tools"], {"total": 1, "checked": 1})
        self.assertEqual(accepted["cons"], {"total": 0, "checked": 0})
        self.assertEqual(accepted["carry_forward"]["rental_asat"], saved["rental_asat"])

    def test_fresh_install_first_renders_inventory_then_renders_with_its_pin(self):
        self.assertEqual(self.rebuild(), 0)
        self.assertEqual(self.seeds, [False, True])
        self.assertEqual(json.loads(self.pin.read_bytes())["source"], "first_successful_inventory")
        self.assertEqual(rebuild.published_report(self.prior)["stocktake"]["rounds"][0]["cons"]["total"], 1)

    def test_corrupt_or_foreign_private_baseline_never_changes(self):
        report(self.prior, [self.a])
        original = self.prior.read_bytes()
        for raw in (b"", b'{}', json.dumps({"schedule": "Other", "rows": [self.a]}).encode(),
                    json.dumps({"schedule": rebuild.MMG_SCHEDULE, "rows": []}).encode()):
            self.pin.write_bytes(raw)
            self.assertEqual(self.rebuild(), 1)
            self.assertEqual(self.pin.read_bytes(), raw)
            self.assertEqual(self.prior.read_bytes(), original)

    def test_other_job_and_foreign_published_report(self):
        report(self.prior, [self.a], schedule="Other")
        prev = self.prior.read_bytes()
        self.assertEqual(self.rebuild(), 1)
        self.assertFalse(self.pin.exists())
        self.assertEqual(self.prior.read_bytes(), prev)
        (self.job / "kit/JOB.txt").write_text("customer: Another customer")
        self.assertEqual(self.rebuild(), 0)
        self.assertFalse(self.pin.exists())
        self.assertEqual(self.seeds, [False])

    def test_database_and_visible_report_not_changed_when_adoption_fails(self):
        report(self.prior, [self.a])
        before = self.prior.read_bytes()
        original = rebuild.os.link

        def fail_pin(src, dst):
            if Path(dst) == self.pin:
                raise OSError("disk error on create")
            return original(src, dst)

        with patch.object(rebuild.os, "link", side_effect=fail_pin):
            self.assertEqual(self.rebuild(), 1)
        self.assertEqual(self.prior.read_bytes(), before)
        self.assertFalse(self.pin.exists())
        self.assertFalse((self.volume / "onhire.xlsx").exists())

    def test_private_qr_facts_roll_back_with_the_report(self):
        report(self.prior, [self.a])
        self.assertEqual(self.rebuild(), 0)
        private = self.volume / "qr-report-data.json"
        private.write_bytes(b'{"source": "previous successful pull"}')
        previous, original_replace = self.prior.read_bytes(), rebuild.os.replace

        def fail_report(src, dst):
            if Path(dst) == self.prior and Path(src).parent.name.startswith(".build-"):
                raise OSError("report publication interrupted")
            return original_replace(src, dst)

        with patch.object(rebuild.os, "replace", side_effect=fail_report):
            self.assertEqual(self.rebuild(), 1)
        self.assertEqual(self.prior.read_bytes(), previous)
        self.assertEqual(private.read_bytes(), b'{"source": "previous successful pull"}')

    def test_recover_published_opening_rows_instead_of_later_inventory(self):
        opening = {"baseline_rows": [self.a],
                   "carry_forward": {"status": "accepted", "baseline_available": True, "rental_asat": "2026-11-25T08:00"}}
        report(self.prior, [self.b], [opening])
        self.assertEqual(self.rebuild(), 0)
        saved = json.loads(self.pin.read_bytes())
        self.assertEqual(saved["rows"][0]["key"], "A")
        self.assertEqual(saved["rental_asat"], "2026-11-25T08:00")
