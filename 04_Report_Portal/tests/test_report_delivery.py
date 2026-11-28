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

    def test_mmg_existing_and_rebuilt_reports_share_authenticated_brand_and_search_header(self):
        job = self.root / "job"
        (job/"kit").mkdir(parents=True)
        (job/"kit/JOB.txt").write_text("customer: MMG\nlocation: Dugald River\n")
        logo = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/qooAAAAASUVORK5CYII=")
        template = (b'<!doctype html><html><head><title>MMG Tool Store Report</title></head><body>'
                    b'<header class="top"><div class="wrap bar"><div class="brand">COATES</div>'
                    b'<span class="sep" id="lsep"></span><img class="toplogo" id="toplogo" alt="MMG">'
                    b'<input id="gs-q"><button id="full-screen">Full screen</button></div><nav>Stock</nav></header>'
                    b'<main>VERSION</main></body></html>')
        self.path.write_bytes(template.replace(b"VERSION", b"first"))
        self.assertIn(b'<span class="brand-client">MMG</span>', self.get("/",self.auth)[1])
        (job/"logo.png").write_bytes(logo)
        for ver in (b"first",b"next"):
            if ver == b"next":
                replacement = self.root/"rebuilt"
                replacement.write_bytes(template.replace(b"VERSION",ver))
                replacement.replace(self.path)
            response, data = self.get("/",dict(self.auth, **{"Accept-Encoding":"gzip"}))
            self.assertEqual(response.status,200)
            body = gzip.decompress(data)
            self.assertIn(b'<span class="wm">My<span>Gear</span> <i>HQ</i>',body)
            self.assertIn(b'<b>COATES</b><span>Dugald River</span>',body)
            self.assertIn(b'<input id="gs-q">',body)
            self.assertIn(b'<nav>Stock</nav>',body)
            self.assertIn(b'<main>'+ver+b'</main>',body)
            url = re.search(rb'<span class="brand-client"><img src="([^"]+)" alt="MMG">',body)[1].decode()
            self.assertEqual(self.get(url,self.auth)[1], logo)
            self.assertEqual(self.get(url)[0].status,303)
            self.assertEqual(self.path.read_bytes(),template.replace(b"VERSION",ver))
        for path in ("/upload","/install"):
            response, body = self.get(path,self.auth)
            self.assertEqual(response.status,200)
            self.assertIn(b'class="portal-masthead"',body)
            self.assertIn(b'<img src="data:image/png;base64,',body)
        (job/"kit/JOB.txt").write_text("customer: Another client\nlocation: Elsewhere\n")
        self.assertNotIn(b'class="portal-masthead"',self.get("/",self.auth)[1])
        self.assertNotIn(b'class="portal-masthead"',self.get("/upload",self.auth)[1])

    def test_empty_portal(self):
        response, body = self.get("/", self.auth)
        self.assertEqual(response.status, 200)
        self.assertIn(b"being prepared", body)
