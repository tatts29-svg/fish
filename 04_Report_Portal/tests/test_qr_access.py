from concurrent.futures import ThreadPoolExecutor
from http.cookies import SimpleCookie
import json
import os
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlsplit

from test_swms import PortalHTTPCase
import qr_access
import qr_reports
import qr_roster
import server


class QrViews(PortalHTTPCase):
    def setUp(self):
        super().setUp()
        self.enterContext(patch.object(qr_access, "lookup_budget", qr_access.LookupBudget()))

    def post(self, url, payload, cookie="", **headers):
        return self.request("POST", url, body=json.dumps(payload),
                            headers={"Content-Type": "application/json", "X-Portal": "1", "Cookie": cookie, **headers})

    def activate(self, scope):
        url = urlsplit(qr_access.entry_url(self.root, scope))
        path = f"/qr/{scope}/enter"
        self.assertEqual((url.scheme, url.hostname, url.path, url.query),
                         ("https", "mmg-report-production.up.railway.app", path, ""))
        status, headers, body = self.post(path, {"token": url.fragment})
        self.assertEqual((status, json.loads(body)), (200, {"ok": True}))
        cookie = SimpleCookie(headers["Set-Cookie"])["qr_" + scope]
        self.assertEqual(cookie["path"], f"/qr/{scope}/")
        self.assertTrue(cookie["httponly"] and cookie["secure"])
        self.assertNotIn(url.fragment, cookie.value)
        return f"{cookie.key}={cookie.value}"

    def test_poster_entry_and_report_use_same_hq_identity_without_portal_navigation(self):
        from qr_brand import wordmark
        import base64

        logo = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/"
                                "x8AAwMCAO+jrosAAAAASUVORK5CYII=")
        (self.root / "job" / "logo.png").write_bytes(logo)
        for scope in ("company", "personal"):
            entry = f"/qr/{scope}/"
            guest_status, _, invitation = self.request("GET", entry + "enter")
            self.assertEqual(guest_status, 200)
            cookie = self.activate(scope)
            status, _, view = self.request("GET", entry, headers={"Cookie": cookie})
            self.assertEqual(status, 200)
            self.assertIn(b"data:image/png;base64," + base64.b64encode(logo), invitation)
            self.assertIn(b'src="mmg-logo.png" alt="MMG"', view)
            for page in (invitation, view):
                self.assertIn(wordmark().encode(), page)
                self.assertIn(b"MyGear HQ", page)
                self.assertNotIn(b'href="/hq', page)
                self.assertNotIn(b'href="/upload', page)

    def test_persistent_invitations_and_portal_session_isolation(self):
        self.assertEqual(self.request("GET", "/qr/company/enter")[0], 200)
        self.assertFalse((self.root / qr_access.KEY_FILE).exists())
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _: qr_access.entry_url(self.root, "company"), range(8)))
        self.assertEqual(len(set(results)), 1)
        self.assertEqual(os.stat(self.root / qr_access.KEY_FILE).st_mode & 0o777, 0o600)
        company_url = urlsplit(results[0])
        self.assertNotEqual(results[0], qr_access.entry_url(self.root, "personal"))
        err = self.post("/qr/personal/enter", {"token": company_url.fragment})
        self.assertEqual(err[0], 403)
        self.assertNotIn("Set-Cookie", err[1])
        company_cookie = self.activate("company")
        # An existing staff session still grants access on its own normal portal pages.
        staff_cookie = "s=" + server._session("testmanager")
        self.assertEqual(self.request("GET", "/upload", headers={"Cookie": staff_cookie})[0], 200)
        self.assertEqual(self.request("GET", "/qr/company/companies", headers={"Cookie": staff_cookie})[0], 403)
        self.assertEqual(self.request("GET", "/upload", headers={"Cookie": company_cookie})[0], 303)
        self.assertEqual(self.post("/qr/personal/report", {"barcode": "SAMPLE"}, company_cookie)[0], 403)
        self.assertEqual(self.post("/qr/personal/report", {"barcode": "SAMPLE"}, company_cookie + "; " + staff_cookie)[0], 403)
        (self.root / qr_access.KEY_FILE).write_bytes(b"invalid")
        self.assertEqual(self.request("GET", "/qr/company/companies", headers={"Cookie": company_cookie})[0], 503)
        self.assertEqual((self.root / qr_access.KEY_FILE).read_bytes(), b"invalid")

    def test_staff_posters_job_scope_and_hidden_private_data(self):
        # Mock only the image renderer, so HTTP/auth tests do not require binary image dependencies.
        with patch.object(qr_access, "_png", return_value=b"image") as image:
            url = "/upload/report-qr/personal.png"
            self.assertEqual(self.request("GET", url)[0], 303)
            self.assertEqual(self.request("GET", url, "client")[0], 403)
            self.assertEqual(self.request("GET", url, "store", headers={"Host":"other.test"})[0], 200)
            target = image.call_args.args[0]
            self.assertEqual(urlsplit(target).hostname, "mmg-report-production.up.railway.app")
            for path in ("/qr-report-data.json", "/qr-identities.json", "/" + qr_access.KEY_FILE):
                self.assertEqual(self.request("GET", path)[0], 404)
            (self.root / "job/kit/JOB.txt").write_text("customer: Other")
            self.assertEqual(self.request("GET", url, "store")[0], 404)
            self.assertEqual(self.request("GET", "/qr/personal/enter")[0], 404)

    def test_bundled_live_barcode_reader_is_only_available_in_personal_scope(self):
        personal = self.activate("personal")
        company = self.activate("company")
        self.assertEqual(self.request("GET", "/qr/personal/badge_zxing.js")[0], 403)
        self.assertEqual(self.request("GET", "/qr/company/badge_zxing.js", headers={"Cookie": company})[0], 404)
        code, headers, library = self.request("GET", "/qr/personal/badge_zxing.js", headers={"Cookie": personal})
        self.assertEqual(code, 200)
        self.assertIn("javascript", headers["Content-Type"])
        self.assertIn(b"@zxing/library 0.23.0", library[:100])
        with patch.object(qr_roster, "status", return_value={"linked": 1}):
            status, _, shell = self.request("GET", "/qr/personal/", headers={"Cookie": personal})
            self.assertEqual(status, 200)
            self.assertIn(b"Scan or enter your assigned barcode number", shell)
            self.assertIn(b">Scan barcode</button>", shell)
            self.assertNotIn(b'type="file"', shell)

    def test_personal_setup_has_no_worker_lookup_until_a_roster_is_linked(self):
        cookie = self.activate("personal")
        text = b"Worker barcode access is being set up. Please ask the tool store."
        status, _, page = self.request("GET", "/qr/personal/", headers={"Cookie": cookie})
        self.assertEqual(status, 200)
        self.assertIn(text, page)
        self.assertNotIn(b'id="identity"', page)
        self.assertNotIn(b'id="camera"', page)
        with patch.object(qr_reports, "personal") as lookup:
            for url in ("/qr/personal/report", "/qr/personal/report.pdf"):
                code, _, body = self.post(url, {"barcode": "0001"}, cookie)
                self.assertEqual((code, json.loads(body)), (503, {"error": text.decode()}))
            lookup.assert_not_called()
        with patch.object(qr_roster, "status", side_effect=AssertionError("private roster read from company shell")):
            company = self.activate("company")
            code, _, html = self.request("GET", "/qr/company/", headers={"Cookie": company})
            self.assertEqual(code, 200)
            self.assertNotIn(text, html)

    def test_only_selected_company_and_exact_personal_barcode_are_forwarded(self):
        c, p = self.activate("company"), self.activate("personal")
        ch = {"Cookie": c}
        self.enterContext(patch.object(qr_roster, "status", return_value={"linked": 1}))
        with patch.object(qr_reports, "companies", return_value={"companies":[{"id":"example","name":"Example Inc"}]}), \
             patch.object(qr_reports, "company", return_value={"kind":"company","name":"Example Inc"}) as company, \
             patch.object(qr_reports, "personal", return_value={"kind":"person","name":"Example Worker"}) as personal:
            status, headers, body = self.request("GET", "/qr/company/companies", headers=ch)
            self.assertEqual((status, json.loads(body)["companies"][0]["id"]), (200, "example"))
            self.assertEqual((headers["Cache-Control"], headers["Referrer-Policy"]), ("no-store", "no-referrer"))
            self.assertEqual(self.request("GET", "/qr/company/report?company=example", headers=ch)[0],200)
            company.assert_called_once_with(str(self.root),"example")
            self.assertEqual(self.request("GET", "/qr/company/report?name=Example", headers=ch)[0],400)
            self.assertEqual(self.request("GET", "/qr/personal/companies", headers={"Cookie":p})[0],404)
            self.assertEqual(self.request("GET", "/qr/personal/report?barcode=0001", headers={"Cookie":p})[0],404)
            self.assertEqual(self.post("/qr/personal/report", {"barcode":"0001","name":"Other"},p)[0],400)
            self.assertEqual(self.post("/qr/personal/report", {"barcode":"0001"},p, **{"X-Portal":""})[0],403)
            self.assertEqual(self.post("/qr/personal/report", {"barcode":"0001"},p)[0],200)
            personal.assert_called_once_with(str(self.root),"0001")
            personal.return_value = None
            for i in range(11):
                self.assertEqual(self.post("/qr/personal/report", {"barcode":str(i)},p)[0],404)
            status, hdr, _ = self.post("/qr/personal/report.pdf", {"barcode":"0001"},p)
            self.assertEqual((status, hdr["Retry-After"]), (429,"60"))
            # Ordinary company reports have an independent budget.
            self.assertEqual(self.request("GET", "/qr/company/report?company=example", headers=ch)[0],200)
