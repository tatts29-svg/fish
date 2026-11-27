"""Check preservation of MMG stocktakes around the real pack and build entry points."""
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import sys

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import rebuild
import server
from upload_policy import MMG_SCHEDULE


def stocktake(asset, schedule=MMG_SCHEDULE):
    book = openpyxl.Workbook()
    book.active.title = "STOCKTAKE"
    book.active.append(["ITEM_OR_CONSUMABLE"])
    book.active.append([asset])
    ref = book.create_sheet("REFERENCE_INFO")
    ref.append(["PROJECT SCHEDULE"])
    ref.append([schedule])
    with io.BytesIO() as out:
        book.save(out)
        return out.getvalue()


class StocktakeHistory(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.job = self.root / "job"
        self.data = self.job / "kit" / "Data_SiteIQ"
        self.data.mkdir(parents=True)
        self.settings = "customer: MMG\nlocation: Dugald River QLD"
        (self.job / "kit/JOB.txt").write_text(self.settings)
        (self.job / "job.json").write_text("{}")
        self.original = stocktake("A")
        self.current = self.data / "STOCKTAKE.xlsx"
        self.current.write_bytes(self.original)

    def archives(self):
        return [p.read_bytes() for p in (self.job / "kit/stocktake_history").glob("*.xlsx")]

    def test_successful_rebuild_preserves_previous_stocktake(self):
        incoming = self.root / "new.xlsx"
        incoming.write_bytes(stocktake("B"))
        def build(job, out):
            out = Path(out)
            record = {"stocktake": {"schedule": MMG_SCHEDULE, "rows": [{"kind": "tool", "key": "A"}]}}
            (out / "report.html").write_text("const D=" + json.dumps(record) + ";" + "x" * 1200)
            (out / "onhire").mkdir(exist_ok=True)
            (out / "onhire/onhire.xlsx").write_bytes(b"x" * 1200)
        with patch.object(rebuild, "sort_incoming", return_value=({"STOCKTAKE": incoming}, {})), \
             patch.object(rebuild, "build", side_effect=build), \
             patch.dict(rebuild.os.environ, REBUILD_SKIP_PDF="1"):
            self.assertEqual(rebuild.main(str(self.job), str(self.root)), 0)
        self.assertEqual(self.current.read_bytes(), incoming.read_bytes())
        self.assertEqual(self.archives(), [self.original])

    def test_failed_rebuild_restores_sources_and_undoes_archive(self):
        incoming = self.root / "new.xlsx"
        incoming.write_bytes(stocktake("B"))

        def fail_after_copy(job, out):
            self.assertEqual(self.archives(), [self.original])
            self.assertEqual(self.current.read_bytes(), incoming.read_bytes())
            raise rebuild.Stop("intentional test failure")

        with patch.object(rebuild, "sort_incoming", return_value=({"STOCKTAKE": incoming}, {})), \
             patch.object(rebuild, "build", side_effect=fail_after_copy):
            self.assertEqual(rebuild.main(str(self.job), str(self.root)), 1)
        self.assertEqual(self.current.read_bytes(), self.original)
        self.assertEqual(self.archives(), [])

    def test_refresh_merges_deduplicates_and_rejects_other_job(self):
        older = stocktake("older")
        snapshot = self.root / "prior.xlsx"
        snapshot.write_bytes(older)
        rebuild.archive_stocktake(self.job, snapshot)
        new = stocktake("bundled")
        pack = self.root / "pack.zip"
        def load(ref):
            with zipfile.ZipFile(pack, "w") as z:
                z.writestr("job.json", json.dumps({}))
                z.writestr("kit/JOB.txt", self.settings)
                z.writestr("kit/stocktake_history/bundled.xlsx", ref)
                z.writestr("kit/Data_SiteIQ/STOCKTAKE.xlsx", new)
            with patch.object(server, "JOB_DIR", str(self.job)), patch.object(server, "DATA_DIR", str(self.root)):
                server._load_pack(pack)
        load(older)
        load(older)
        with self.assertRaises(ValueError):
            load(stocktake("foreign", "Other job"))
        self.assertCountEqual(self.archives(), [older, new])
        self.assertEqual(self.current.read_bytes(), self.original)


if __name__ == "__main__":
    unittest.main()
