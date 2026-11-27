"""A named upload is published with its own immutable dashboard receipt."""
import contextlib
import datetime as dt
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import rebuild
import report_delivery
import server
import upload_receipt

SHELL = b"""<!doctype html><html><head></head><body><header class="top"><div class="wrap bar">
<div class="brand">COATES</div><span class="sep" id="lsep"></span><img class="toplogo" id="toplogo" alt="MMG">
<div class="asat">SiteIQ pull <b id="asat"></b><br><span class="au">Author</span></div></div></header>
<main id="generation">GENERATION</main></body></html>""" + b" " * 1500


class UploadReceipt(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.path = self.root / "report.html"
        self.job = self.root / "job"
        kit = self.job / "kit"
        (kit/"Data_SiteIQ").mkdir(parents=True)
        (kit/"JOB.txt").write_text("customer: MMG\nlocation: Dugald River")
        (kit/"contacts.json").write_text('[{"name":"Example Operator"},{"name":"Another Operator"}]')
        (self.job/"job.json").write_text("{}")
        (self.root/rebuild.OPENING_BASELINE).write_text("{}")
        self.status_file = self.root/"upload_status.json"
        self.files = {"RENTAL_STOCK":"stock.xlsx"}
        self.timestamp = dt.datetime(2026,11,27,20,12,tzinfo=dt.timezone.utc).timestamp()
        self.legacy = dict(name="Example Operator", finished=self.timestamp, files=self.files, batch="older-batch")
        self.path.write_bytes(SHELL.replace(b"GENERATION",b"old"))
        self.status_file.write_text(json.dumps(dict(state="ok",last_upload=self.legacy)))
        self.enterContext(patch.multiple(server, DATA_DIR=str(self.root), JOB_DIR=str(self.job)))
        self.enterContext(patch.dict(os.environ, {"REBUILD_SKIP_PDF":"1","RAILWAY_PROJECT_NAME":"test"}))
        self.enterContext(patch.object(rebuild, "sort_incoming", return_value=({},self.files)))
        self.enterContext(patch.object(rebuild, "build", side_effect=self.fake_build))
        self.cache = report_delivery.ReportCache()
        self.next_version = 1

    def fake_build(self, job, out):
        dest = Path(out)
        (dest/"report.html").write_bytes(SHELL.replace(b"GENERATION",str(self.next_version).encode()))
        (dest/"onhire").mkdir()
        (dest/"onhire/onhire.xlsx").write_bytes(b"x"*1400)
        (dest/"qr-report-data.json").write_text("{}")

    def build(self, **kwargs):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            code = rebuild.main(str(self.job), str(self.root), **kwargs)
        self.next_version += 1
        return code, json.loads(output.getvalue().splitlines()[-1])

    def dashboard(self):
        return self.cache.load(self.path, mmg_job=self.job).html

    def test_legacy_and_admin_refresh_preserve_name_and_original_queensland_time(self):
        self.assertIn(b"28 Nov 2026, 06:12 AEST", self.dashboard())
        self.assertIn(b'<b id="asat"></b> AEST',self.dashboard())
        server._set_status(state="running", started=self.timestamp+3600)
        self.assertIn(b"Example Operator", self.dashboard())
        code, result = self.build(current=True)
        self.assertEqual((code, result["last_upload"]),(0,self.legacy))
        self.status_file.write_text(json.dumps(dict(state="failed",finished=self.timestamp+7200)))
        self.assertEqual(server._status()["last_upload"], self.legacy)
        self.assertIn(b"28 Nov 2026, 06:12 AEST",self.dashboard())
        self.assertNotIn(b"older-batch",self.dashboard())
        self.assertNotIn(b"mmg-upload-receipt-v1",self.dashboard())

    def test_success_commit_drives_dashboard_and_status_even_before_status_writer(self):
        with patch.object(rebuild.time, "time", return_value=self.timestamp+3600):
            code,result = self.build(uploader="Another Operator", batch="new-batch")
        self.assertEqual(code,0)
        self.assertEqual(result["last_upload"]["name"], "Another Operator")
        self.assertIn(b"Another Operator",self.dashboard())
        self.assertIn(b"28 Nov 2026, 07:12 AEST",self.dashboard())
        self.assertEqual(server._status()["last_upload"],result["last_upload"])
        server._finish_build(result,self.timestamp)
        server._set_status(state="running", started=self.timestamp+3605)
        self.assertEqual(server._status()["last_upload"],result["last_upload"])
        current = self.path.read_bytes()
        real_replace = os.replace
        def fail_report(src,dest):
            if Path(dest) == self.path:
                raise OSError("cannot publish report")
            return real_replace(src,dest)
        with patch.object(rebuild.os,"replace",side_effect=fail_report):
            code, failure = self.build(uploader="Example Operator",batch="failed")
        self.assertEqual(code,1)
        server._finish_build(failure,self.timestamp)
        self.assertEqual(self.path.read_bytes(),current)
        self.assertIn(b"Another Operator",self.dashboard())
        self.assertEqual(server._status()["last_upload"],result["last_upload"])
        self.assertEqual(self.build(current=True)[1]["last_upload"],result["last_upload"])

    def test_legacy_publication_race_reopens_new_inode_and_escapes_historical_name(self):
        self.status_file.write_text(json.dumps(dict(state="ok",last_upload=dict(self.legacy,name="<Old>"))))
        self.assertIn(b"&lt;Old&gt;",self.dashboard())
        published = self.root/'new-report'
        published.write_bytes(SHELL.replace(b"GENERATION",b"newer"))
        upload_receipt.stamp(published,dict(self.legacy,name="Another Operator",finished=self.timestamp+60))
        original = upload_receipt.resolve
        def replace_between_reads(head,volume,status=None):
            if published.exists():
                os.replace(published,self.path)
            return original(head,volume,status)
        with patch.object(upload_receipt,"resolve",side_effect=replace_between_reads):
            page = self.dashboard()
        self.assertIn(b'newer',page)
        self.assertIn(b'Another Operator',page)
        self.assertNotIn(b'&lt;Old&gt;',page)

    def test_missing_name_or_receipt_never_assigns_administrative_completion(self):
        self.status_file.write_text(json.dumps(dict(state="ok",finished=self.timestamp,files=self.files)))
        self.assertIn(b"Uploader not recorded",self.dashboard())
        self.status_file.write_text(json.dumps(dict(state="ok",finished=self.timestamp,files={})))
        self.assertIn(b"Last successful upload: details unavailable",self.dashboard())
        self.assertIsNone(self.build(current=True)[1]["last_upload"])
        self.status_file.write_text(json.dumps(dict(state="ok",last_upload=self.legacy)))
        self.assertNotIn(b"Example Operator",self.dashboard())

    def test_unknown_uploader_rejected_before_publication(self):
        code,result = self.build(uploader="Unknown Person",batch="x")
        self.assertEqual(code,1)
        self.assertFalse(result["ok"])
        self.assertEqual(server._status()["last_upload"],self.legacy)
