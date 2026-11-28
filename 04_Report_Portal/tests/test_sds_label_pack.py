import json
from concurrent.futures import ThreadPoolExecutor
import io
import zipfile

from test_swms import PortalHTTPCase, archive, documents
import server
import sds_library


class StaffLabelPack(PortalHTTPCase):
    url = "/upload/sds-label-check.zip"

    def test_role_scoped_download_and_atomic_validation(self):
        pdf = documents("test")["swms.pdf"]
        first = archive({"Label check index.pdf": pdf, "Sheets/01 White paint.pdf": pdf})
        status = lambda user: json.loads(self.request("GET", "/upload/status", user)[2])
        self.assertFalse(status("store")["sds_label_check"])
        self.assertNotIn("sds_label_check", status("client"))
        self.assertEqual(self.request("GET", self.url, "store")[0], 404)
        self.assertEqual(self.request("GET", self.url)[0], 303)
        for user in ("store", "client"):
            self.assertEqual(self.request("PUT", self.url, user, first)[0], 403)
        self.assertEqual(self.request("PUT", self.url, "testmanager", first)[0], 200)
        self.assertTrue(status("store")["sds_label_check"])
        self.assertTrue(status("testmanager")["sds_label_check"])
        self.assertNotIn("sds_label_check", status("client"))
        for method in ("GET", "HEAD"):
            self.assertEqual(self.request(method, self.url, "client")[0], 403)
        cookie = {"Cookie": "s=" + server._session("store")}
        code, hdr, body = self.request("GET", self.url, headers=cookie)
        self.assertEqual((code, hdr["Content-Type"], hdr["Cache-Control"], body), (200, "application/zip", "no-store", first))
        code, hdr, body = self.request("HEAD", self.url, "testmanager")
        self.assertEqual((code, int(hdr["Content-Length"]), body), (200, len(first), b""))
        for bad in [{}, {"index.html": b"<html>"}, {"../escape.pdf": pdf}, {"/a.pdf": pdf},
                    {"Windows\\dir.pdf": pdf}, {"C:evil.pdf": pdf}, {"CON.pdf": pdf}, {"bad.pdf": b"abc"},
                    {"a.pdf": pdf, "A.pdf": pdf}]:
            with self.subTest(bad=list(bad)):
                self.assertEqual(self.request("PUT", self.url, "testmanager", archive(bad))[0], 400)
                self.assertEqual(self.request("GET", self.url, "store")[2], first)
        self.assertFalse((self.root / "sds").exists())
        self.assertFalse((self.root / "upload_status.json").exists())
        (self.root / "job/kit/JOB.txt").write_text("customer: Other site")
        self.assertEqual(self.request("GET", self.url, "store")[0], 404)
        self.assertEqual(self.request("PUT", self.url, "testmanager", first)[0], 404)
        self.assertNotIn("sds_label_check", status("store"))

    def test_racing_replacements_leave_one_complete_pack(self):
        packs = [archive({"Sheets/": b"", "Sheets/Supplier A.pdf":documents(str(i))["swms.pdf"]}) for i in range(4)]
        with ThreadPoolExecutor(max_workers=4) as pool:
            counts = list(pool.map(lambda p: sds_library.install_label_check(p, self.root), packs))
        self.assertEqual(counts, [1]*4)
        body = self.request("GET", self.url, "store")[2]
        self.assertIn(body, packs)
        self.assertIsNone(zipfile.ZipFile(io.BytesIO(body)).testzip())
