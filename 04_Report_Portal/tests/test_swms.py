import base64
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from datetime import datetime, timezone
import http.client
from http.server import ThreadingHTTPServer
import io
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile
from threading import Barrier, Thread
import unittest
from unittest.mock import patch
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server
import swms_store


def archive(files):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as output:
        for name, data in files.items():
            output.writestr(name, data)
    return stream.getvalue()


def documents(revision):
    pdf = bytearray(f"%PDF-1.7\n%{revision}\n".encode())
    offsets = []
    for n, obj in enumerate([b"<< /Type /Catalog /Pages 2 0 R >>",
                             b"<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
                             b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>"], 1):
        offsets.append(len(pdf))
        pdf.extend(f"{n} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(b"xref\n0 4\n0000000000 65535 f \n")
    for offset in offsets:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(f"trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    docx = archive({
        "[Content_Types].xml": f'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="{swms_store.WORD_MAIN}"/></Types>',
        "_rels/.rels": '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
        "word/document.xml": f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{revision}</w:t></w:r></w:p></w:body></w:document>',
    })
    return {"swms.pdf": bytes(pdf), "swms.docx": docx}


class PortalHTTPCase(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        kit = self.root / "job" / "kit"
        kit.mkdir(parents=True)
        (kit / "JOB.txt").write_text("customer: MMG\nlocation: Dugald River\n")
        (kit / "contacts.json").write_text('[{"name":"Test Manager"}]')
        self.enterContext(patch.multiple(server, DATA_DIR=str(self.root), JOB_DIR=str(kit.parent)))
        self.enterContext(patch.dict(os.environ, {"RAILWAY_PROJECT_NAME": "test", "MANAGER_DISPLAY_NAME": "",
            "MANAGER_USERNAME": "testmanager", "MANAGER_PASSWORD": "test-password",
            "CLIENT_USERNAME": "client", "CLIENT_PASSWORD": "test-password",
            "STORE_USERNAME": "store", "STORE_PASSWORD": "test-password"}))
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        Thread(target=self.httpd.serve_forever, daemon=True).start()
        self.addCleanup(self.httpd.server_close)
        self.addCleanup(self.httpd.shutdown)

    def request(self, method, path, user=None, body=None, headers=None):
        headers = dict(headers or {})
        if user:
            headers["Authorization"] = "Basic " + base64.b64encode((user + ":test-password").encode()).decode()
        with closing(http.client.HTTPConnection(*self.httpd.server_address)) as conn:
            conn.request(method, path, body=body, headers=headers)
            res = conn.getresponse()
            return res.status, dict(res.getheaders()), res.read()



class SwmsDelivery(PortalHTTPCase):
    def put(self, documents, user="testmanager"):
        return self.request("PUT", "/upload/swms.zip", user, archive(documents))

    def status(self, user="testmanager"):
        code, _, body = self.request("GET", "/swms/status", user)
        self.assertEqual(code, 200)
        return json.loads(body)

    def review(self, version, ack=True, user="testmanager", custom=True, extra=None):
        headers = {"Content-Type": "application/json"}
        if custom:
            headers["X-Portal"] = "1"
        body = json.dumps({"version": version, "acknowledged": ack, **(extra or {})})
        return self.request("POST", "/swms/manager-review", user, body, headers)

    def test_upload_read_headers_and_validated_atomic_replacement(self):
        self.assertIsNone(self.status()["version"])
        first = documents("One")
        url = "/swms/current.pdf"
        self.assertEqual(self.request("GET", url)[0], 303)
        self.assertEqual(self.request("GET", url, "client")[0], 404)
        self.assertEqual(self.put(first, "client")[0], 403)
        self.assertEqual(self.put(first, "store")[0], 403)
        self.assertEqual(self.put(first)[0], 200)
        version = self.status()["version"]
        self.assertEqual(len(version), 64)
        for ext, (mime, disp) in swms_store.FORMATS.items():
            path = "/swms/current." + ext
            cookie = {"Cookie": "s=" + server._session("client")}
            code, headers, data = self.request("GET", path, headers=cookie)
            self.assertEqual((code, headers["Content-Type"], data), (200, mime, first["swms." + ext]))
            self.assertTrue(headers["Content-Disposition"].startswith(disp))
            self.assertEqual(headers["Cache-Control"], "no-store")
            self.assertEqual(headers["X-SWMS-Version"], version)
            code, headers, empty = self.request("HEAD", path, "store")
            self.assertEqual((code, int(headers["Content-Length"]), empty), (200, len(data), b""))
        for invalid in [dict(first, **{"unexpected": b"x"}), {**first, "swms.pdf": b"%PDF-1.7\nfake\n%%EOF"},
                        {**first, "swms.docx": archive({"word/document.xml": b"renamed xlsx"})}]:
            self.assertEqual(self.put(invalid)[0], 400)
            self.assertEqual(self.status()["version"], version)
        with patch.object(swms_store, "MAX_FILE", 10):
            self.assertEqual(self.put(first)[0], 413)
        self.assertEqual(self.put(documents("Two"))[0], 200)
        self.assertEqual(self.put(first)[0], 409)
        self.assertEqual(self.request("GET", url + "?version=" + version, "client")[2], first["swms.pdf"])
        self.assertEqual(self.request("GET", url + "?version=invalid", "client")[0], 404)
        (self.root / "job/kit/JOB.txt").write_text("customer: Another site")
        self.assertEqual(self.put(first)[0], 404)
        for path in [url, "/swms/status"]:
            self.assertEqual(self.request("GET", path, "client")[0], 404)

    def test_only_explicit_manager_review_and_only_for_current_version(self):
        self.put(documents("One"))
        before = self.status()
        v = before["version"]
        self.assertTrue(before["can_review"])
        self.assertIsNone(before["reviewed_by"])
        self.assertFalse(self.status("client")["can_review"])
        for args, expected in [({"user": "client"}, 403), ({"user": "store"}, 403), ({"custom": False}, 403),
                               ({"ack": False}, 400), ({"extra": {"reviewed_by": "Someone else"}}, 400)]:
            self.assertEqual(self.review(v, **args)[0], expected)
        self.assertEqual(self.request("GET", "/swms/manager-review", "testmanager")[0], 404)
        self.assertEqual(self.review("f"*64)[0], 409)
        now = datetime.now(timezone.utc).replace(microsecond=0)
        cookie = {"Cookie": "s=" + server._session("testmanager"), "X-Portal": "1", "Content-Type": "application/json"}
        body = json.dumps({"version": v, "acknowledged": True})
        result = self.request("POST", "/swms/manager-review", body=body, headers=cookie)
        self.assertEqual(result[0], 200)
        signed = json.loads(result[2])
        self.assertEqual(signed["reviewed_by"], "Test Manager")
        self.assertFalse(signed["can_review"])
        self.assertGreaterEqual(datetime.fromisoformat(signed["reviewed_at"]), now)
        self.assertEqual(json.loads(self.review(v)[2]), signed)
        self.assertEqual(self.status("client")["reviewed_at"], signed["reviewed_at"])
        self.put(documents("Two"))
        self.assertEqual(self.review(v)[0], 409)
        self.assertIsNone(self.status()["reviewed_at"])
        with closing(sqlite3.connect(self.root / "mmg-swms.sqlite3")) as db:
            self.assertEqual(db.execute("SELECT reviewed_account FROM swms_versions WHERE version=?", (v,)).fetchone()[0],
                             "testmanager")

    def test_parallel_releases_preserve_each_pair(self):
        candidates = [documents(str(i)) for i in range(5)]
        with ThreadPoolExecutor(max_workers=5) as pool:
            versions = list(pool.map(lambda pair: swms_store.publish(self.root, archive(pair)), candidates))
        for version, pair in zip(versions, candidates):
            for ext in swms_store.FORMATS:
                self.assertEqual(swms_store.document(self.root, ext, version)[1], pair["swms." + ext])
        self.assertIn(self.status()["version"], versions)

    def test_concurrent_review_cannot_transfer_to_replacement(self):
        initial = swms_store.publish(self.root, archive(documents("First")))
        replacement = archive(documents("Second"))
        start = Barrier(2)

        def sign():
            start.wait()
            try:
                return swms_store.review(self.root, {"version": initial, "acknowledged": True},
                                         ("testmanager", "Test Manager"))["version"]
            except swms_store.SwmsError as error:
                self.assertEqual(error.status, 409)
                return None

        def replace():
            start.wait()
            return swms_store.publish(self.root, replacement)

        with ThreadPoolExecutor(max_workers=2) as pool:
            action = pool.submit(sign)
            version = pool.submit(replace).result()
            signed_version = action.result()
        self.assertIn(signed_version, (None, initial))
        current = self.status()
        self.assertEqual((current["version"], current["reviewed_at"]), (version, None))
        with closing(sqlite3.connect(self.root / "mmg-swms.sqlite3")) as db:
            reviewed = db.execute("SELECT version FROM swms_versions WHERE reviewed_at IS NOT NULL").fetchall()
            self.assertEqual(reviewed, [(initial,)] if signed_version else [])
