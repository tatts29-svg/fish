import json
from urllib.parse import urlsplit
from unittest.mock import patch
from test_swms import PortalHTTPCase
import qr_access
import qr_reports
import qr_work_notes


class CompanyNotes(PortalHTTPCase):
    def test_company_submission_review_and_withdrawal(self):
        a, b = "a" * 32, "b" * 32
        notes = "/qr/company/work-note"
        admin = "/upload/qr-work-review"
        headers = {"Content-Type": "application/json", "X-Portal": "1"}
        self.enterContext(patch.object(qr_reports, "companies", return_value={"companies": [{"id": a, "name": "A"}]}))
        self.enterContext(patch.object(qr_reports, "company", return_value={"kind": "company"}))
        def session(scope):
            token = urlsplit(qr_access.entry_url(self.root, scope)).fragment
            return qr_access._exchange(self.root, scope, token).split(";", 1)[0]
        company = {**headers, "Cookie": session("company")}
        personal = {**headers, "Cookie": session("personal")}
        def post(fields, auth=company):
            return self.request("POST", notes, body=json.dumps(fields), headers=auth)[0]
        def visible(key):
            code, _, content = self.request("GET", "/qr/company/report?company=" + key, headers=company)
            self.assertEqual(code, 200)
            return json.loads(content)["work_notes"]
        def moderate(action, user="testmanager"):
            return self.request("POST", admin, user, json.dumps({"id": 1, "action": action}), headers)[0]
        sample = {"date": "2026-02-20", "title": "Pump service", "description": "Completed <inspection>.", "company": a}
        self.assertEqual(post(sample, personal), 403)
        self.assertEqual(post(sample, {}), 403)
        self.assertEqual(post(dict(sample, company=b)), 404)
        self.assertEqual(post(dict(sample, date="2999-01-01")), 400)
        self.assertEqual(post(sample), 202)
        self.assertEqual(post(sample), 202)
        self.assertEqual(len(qr_work_notes.entries(self.root)), 1)
        self.assertEqual(visible(a), [])
        self.assertEqual(moderate("publish", "store"), 403)
        self.assertEqual(moderate("publish", "client"), 403)
        self.assertNotIn(b"Pump service", self.request("GET", "/upload/qr-reports", "store")[2])
        self.assertIn(b"&lt;inspection&gt;", self.request("GET", "/upload/qr-reports", "testmanager")[2])
        self.assertEqual(moderate("publish"), 200)
        self.assertEqual(moderate("publish"), 409)
        self.assertEqual(visible(a), [{k: sample[k] for k in ("date", "title", "description")}])
        self.assertEqual(visible(b), [])
        self.assertEqual(moderate("withdraw"), 200)
        self.assertEqual(visible(a), [])
        self.assertEqual(self.request("GET", "/qr-company-notes.sqlite3")[0], 404)
