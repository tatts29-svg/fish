"""The MMG on-hire report is an output, including for files staged before a deployment."""
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import sys

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import rebuild
import server


def workbook(*sheets):
    book = openpyxl.Workbook()
    book.remove(book.active)
    for sheet in sheets:
        book.create_sheet(sheet)
    dest = io.BytesIO()
    book.save(dest)
    return dest.getvalue()


class DailyExports(unittest.TestCase):
    def test_on_hire_rejected_by_name_sheet_or_both(self):
        for name, sheets in [("on-hire.xlsx", ["RENTAL_STOCK"]),
                             ("RENTAL_STOCK.xlsx", ["ON_HIRE"]),
                             ("RENAMED.xlsx", ["RENTAL_STOCK", "On Hire"])]:
            with self.subTest(name=name):
                payload = workbook(*sheets)
                req = Mock()
                req.path = "/upload/export?name=" + name
                req._body.return_value = payload
                req._batch_identity.return_value = ("Tester Name", "token", "unused")
                with patch.object(server, "is_mmg", return_value=True):
                    server.Handler._put_export(req)
                self.assertEqual(req._send.call_args.args[0], 400)
                self.assertIn(b"on-hire file", req._send.call_args.args[1])

    def test_daily_filename_matches_workbook(self):
        for kind in rebuild.MMG_DAILY_KINDS:
            doc = workbook(rebuild.SHEET.get(kind, kind), "REFERENCE_INFO")
            self.assertEqual(rebuild.mmg_daily_kind(io.BytesIO(doc), kind + ".xlsx"), kind)
        with self.assertRaisesRegex(rebuild.Stop, "disagree"):
            rebuild.mmg_daily_kind(io.BytesIO(workbook("SALES_STOCK")), "RENTAL_STOCK.xlsx")

    def test_staged_legacy_on_hire_rejected_for_mmg_only(self):
        with tempfile.TemporaryDirectory() as root:
            p = Path(root)
            (p / "incoming").mkdir()
            (p / "incoming/ON_HIRE__stock.xlsx").write_bytes(workbook("ON_HIRE"))
            data = p / "kit/Data_SiteIQ"
            data.mkdir(parents=True)
            for k in rebuild.NEEDED:
                (data / (k + ".xlsx")).touch()
            with patch.object(rebuild, "is_mmg", return_value=True):
                with self.assertRaisesRegex(rebuild.Stop, "on-hire file"):
                    rebuild.sort_incoming(root)
            with patch.object(rebuild, "is_mmg", return_value=False):
                got, _ = rebuild.sort_incoming(root)
                self.assertEqual(set(got), {"ON_HIRE"})


if __name__ == "__main__":
    unittest.main()
