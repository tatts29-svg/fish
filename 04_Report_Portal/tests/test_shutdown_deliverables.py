
from test_swms import PortalHTTPCase


class ShutdownDeliverables(PortalHTTPCase):
    def test_only_manager_has_archive_and_closeout_controls(self):
        for user in ("testmanager", "store", "client"):
            code, _, page = self.request("GET", "/upload", user)
            self.assertEqual(code, 200)
            self.assertEqual(b'id="shut-admin"' in page, user == "testmanager")
        (self.root / "job/kit/JOB.txt").write_text("customer: Other")
        self.assertNotIn(b'id="shut-admin"', self.request("GET", "/upload", "testmanager")[2])

    def test_consumable_exports_require_a_signed_in_mmg_session(self):
        for ext, magic in (("xlsx", b"PK"), ("pdf", b"%PDF")):
            route = f"/consumables-usage.{ext}"
            (self.root / route[1:]).write_bytes(magic)
            self.assertIn(self.request("GET", route)[0], (302, 303))
            status, headers, body = self.request("GET", route, "client")
            self.assertEqual((status, body), (200, magic))
            self.assertIn("application/", headers["Content-Type"])
            self.assertEqual(self.request("PUT", "/upload" + route, "testmanager", b"replacement")[0], 404)
        (self.root / "job/kit/JOB.txt").write_text("customer: Other")
        self.assertEqual(self.request("GET", "/consumables-usage.pdf", "testmanager")[0], 404)
