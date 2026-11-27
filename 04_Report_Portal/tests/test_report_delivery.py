"""Exercise the public gate, the browser payload and refresh-on-rebuild together."""
import base64
import gzip
import http.client
import os
from pathlib import Path
import re
import sys
import tempfile
from threading import Thread
import unittest
from unittest.mock import patch
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class ReportDelivery(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.path = self.root / "report.html"
        self.auth = {"Authorization": "Basic " + base64.b64encode(b"test:pass").decode()}
        self.enterContext(patch.multiple(server, DATA_DIR=str(self.root), JOB_DIR=str(self.root / "job")))
        self.enterContext(patch.dict(os.environ, {"CLIENT_USERNAME": "test", "CLIENT_PASSWORD": "pass"}))
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = Thread(target=self.httpd.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self.httpd.server_close)
        self.addCleanup(self.httpd.shutdown)

    def get(self, path, headers=None, method="GET"):
        conn = http.client.HTTPConnection(*self.httpd.server_address)
        self.addCleanup(conn.close)
        conn.request(method, path, headers=headers or {})
        response = conn.getresponse()
        return response, response.read()

    def publish(self, picture):
        inline = b'"data:image/webp;base64,' + base64.b64encode(picture) + b'"'
        original = b"<!doctype html><script>const pics=[" + inline + b"," + inline + b"]</script>"
        staging = self.root / "next.html"
        staging.write_bytes(original)
        staging.replace(self.path)
        return original

    def test_original_and_authenticated_web_edition(self):
        original = self.publish(b"old photo")
        headers = dict(self.auth, **{"Accept-Encoding": "br, gzip"})
        response, body = self.get("/", headers)
        self.assertEqual(response.status, 200)
        self.assertEqual(response.getheader("Content-Encoding"), "gzip")
        self.assertEqual(response.getheader("Cache-Control"), "no-store")
        html = gzip.decompress(body)
        urls = re.findall(rb'"/(report-media/[^"]+)"', html)
        self.assertEqual(len(urls), 2)
        self.assertEqual(urls[0], urls[1])
        path = "/" + urls[0].decode()
        self.assertEqual(self.path.read_bytes(), original)
        identity, uncompressed = self.get("/", dict(self.auth, **{"Accept-Encoding": "gzip;q=0, *;q=1"}))
        self.assertIsNone(identity.getheader("Content-Encoding"))
        self.assertEqual(html, uncompressed)
        image, data = self.get(path, self.auth)
        self.assertEqual((image.getheader("Content-Type"), data), ("image/webp", b"old photo"))
        validator = {"If-None-Match": image.getheader("ETag")}
        self.assertEqual(self.get(path, {**self.auth, **validator})[0].status, 304)
        self.assertEqual(self.get(path, validator)[0].status, 303)
        self.assertEqual(self.get(path, self.auth, "HEAD")[1], b"")
        self.publish(b"new photo")
        self.assertEqual(self.get(path, self.auth)[0].status, 404)
        self.assertNotEqual(self.get("/", self.auth)[1], html)

    def test_empty_portal(self):
        response, body = self.get("/", self.auth)
        self.assertEqual(response.status, 200)
        self.assertIn(b"being prepared", body)
