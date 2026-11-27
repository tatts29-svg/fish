"""Poster distribution and worker identity management use existing staff roles."""
import json
from unittest.mock import patch
from test_swms import PortalHTTPCase
import qr_roster


class QRPrintStation(PortalHTTPCase):
    def test_staff_poster_hub_and_manager_only_import(self):
        path = "/upload/qr-reports"
        self.assertEqual(self.request("GET", path)[0], 303)
        self.assertEqual(self.request("GET", path, "client")[0], 403)
        for user in ("store", "testmanager"):
            code, headers, page = self.request("GET", path, user)
            self.assertEqual(headers.get("X-Roster-Add-Endpoint"), "/upload/qr-roster-add.xlsx" if user == "testmanager" else None)
            self.assertEqual(code, 200)
            self.assertIn(b"/upload/report-qr/company.pdf", page)
            self.assertIn(b"/upload/report-qr/personal.pdf", page)
            self.assertEqual(b'<form id="roster">' in page, user == "testmanager")
        endpoint = "/upload/qr-roster.xlsx"
        with patch.object(qr_roster, "import_roster", return_value={"linked": 2, "skipped": 0}) as importer:
            for user in ("store", "client"):
                self.assertEqual(self.request("PUT", endpoint, user, b"test")[0], 403)
            importer.assert_not_called()
            code, _, body = self.request("PUT", endpoint, "testmanager", b"test", {"X-Confirm-MMG": "1"})
            self.assertEqual(code, 200)
            self.assertEqual(json.loads(body)["linked"], 2)
            importer.assert_called_once_with(str(self.root), b"test", confirmed_mmg=True, add_only=False)
            add = "/upload/qr-roster-add.xlsx"
            for role in ("store", "client"):
                self.assertEqual(self.request("PUT", add, role, b"test")[0], 403)
            self.assertEqual(self.request("PUT", endpoint, "testmanager", b"test", {"X-Roster-Mode":"add"})[0], 400)
            self.assertEqual(self.request("PUT", endpoint, "testmanager", b"test", {"X-Roster-Mode":"typo"})[0], 400)
            self.assertEqual(importer.call_count, 1)
            self.assertEqual(self.request("PUT", add, "testmanager", b"test")[0], 200)
            importer.assert_called_with(str(self.root), b"test", confirmed_mmg=False, add_only=True)
        self.assertFalse(json.loads(self.request("GET", "/upload/status", "client")[2]).get("qr_reports_staff"))
        self.assertTrue(json.loads(self.request("GET", "/upload/status", "store")[2])["qr_reports_staff"])
