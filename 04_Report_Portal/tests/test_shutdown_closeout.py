import json
from unittest.mock import patch

from test_swms import PortalHTTPCase
import server
import shutdown_closeout as closeout
from upload_policy import MMG_PROJECT, MMG_SCHEDULE


class ConsumablesCloseout(PortalHTTPCase):
    route = "/upload/consumables-closeout"

    def setUp(self):
        super().setUp()
        host, port = self.httpd.server_address
        self.headers = {"X-Portal": "1", "Origin": f"http://{host}:{port}", "Content-Type": "application/json"}
        self.stamp = "2026-12-01T06:00:37"
        self.policy = dict(night_finish_date="2026-12-01", night_store_finish="06:00", timezone="AEST")
        self.facts = dict(schema=1, project=MMG_PROJECT, schedule=MMG_SCHEDULE,
                          return_instruction=self.policy, sales_asat=self.stamp[:16])
        self.usage = dict(project=closeout.JOB, source=closeout.SOURCE, as_at=self.stamp, rows=[{"sku": "ABC"}])
        self.publish()
        self.archive = self.root / closeout.SALES_FILE
        self.payload = dict(confirmed_by="Andrew Fisher", confirmed_complete=True, sales_as_at=self.stamp)
        self.now = self.enterContext(patch.object(closeout, "clock", return_value=closeout.instant("2026-12-01T06:01:00")))

    def publish(self):
        (self.root / "report.html").write_text("const D=" + json.dumps({"consumable_usage": self.usage}) + ";")
        (self.root / "qr-report-data.json").write_text(json.dumps(self.facts))

    def post(self, payload=None, headers=None, user="testmanager"):
        return self.request("POST", self.route, user, json.dumps(self.payload if payload is None else payload).encode(),
                            self.headers if headers is None else headers)

    def test_named_confirmation_preserves_history_and_is_idempotent(self):
        historical = {"job": closeout.JOB, "shuts": [{"label": "Oct 2025"}], "existing_meta": {"keep": 1}}
        self.archive.write_text(json.dumps(historical))
        code, _, data = self.request("GET", self.route, "testmanager")
        self.assertEqual(code, 200)
        status = json.loads(data)
        self.assertEqual((status["eligible"], status["sales_as_at"], status["final_shift_end"]),
                         (True, self.stamp, "2026-12-01T06:00:00+10:00"))
        for payload in ({**self.payload, "confirmed_by": "Thomas Maher"}, {**self.payload, "confirmed_complete": 1}):
            self.assertEqual(self.post(payload)[0], 400)
        self.assertEqual(self.post({**self.payload, "sales_as_at": self.stamp[:16]})[0], 409)
        self.assertEqual(self.post()[0], 200)
        saved = json.loads(self.archive.read_bytes())
        self.assertEqual({key: saved[key] for key in historical}, historical)
        self.assertEqual(saved["current_closeout"]["sales_as_at"], self.stamp)
        seen = self.archive.read_bytes()
        self.now.return_value = closeout.instant("2026-12-01T12:00:00")
        self.assertEqual(json.loads(self.post()[2])["status"], "confirmed")
        self.assertEqual(self.archive.read_bytes(), seen)
        self.usage["as_at"] = "2026-12-01T06:00:59"
        self.publish()
        self.assertEqual(self.post()[0], 409)
        self.assertTrue(closeout.status(self.root)["eligible"])

    def test_waits_for_both_clocks_and_checks_saved_sources(self):
        self.now.return_value = closeout.instant("2026-11-30T23:59:00")
        self.assertEqual(self.post()[0], 409)
        self.now.return_value = closeout.instant("2026-12-01T06:00:30")
        self.assertEqual(self.post()[0], 409)
        self.now.return_value = closeout.instant("2026-12-02T10:00:00")
        self.usage["as_at"] = "2026-12-01T05:59:59"
        self.facts["sales_asat"] = self.usage["as_at"][:16]
        self.publish()
        self.assertEqual(closeout.status(self.root)["status"], "waiting")
        self.usage["as_at"] = self.stamp
        self.publish()
        self.assertEqual(closeout.status(self.root)["status"], "unavailable")
        self.facts["sales_asat"] = self.stamp[:16]
        self.facts["schedule"] = "Other site"
        self.publish()
        self.assertEqual(self.post()[0], 409)
        self.assertFalse(self.archive.exists())

    def test_access_origin_lock_and_damaged_history(self):
        for user, code in ((None, 401), ("client", 403), ("store", 403)):
            self.assertEqual(self.request("GET", self.route, user)[0], code)
            self.assertEqual(self.post(user=user)[0], code)
        for headers in ({**self.headers, "Origin": "https://elsewhere.invalid"},
                        {**self.headers, "Sec-Fetch-Site": "cross-site"},
                        {k: v for k, v in self.headers.items() if k != "X-Portal"}):
            self.assertEqual(self.post(headers=headers)[0], 403)
        with server._build_lock:
            self.assertEqual(self.post()[0], 409)
        self.archive.write_text('{"job":"wrong","shuts":[]}')
        self.assertEqual(self.post()[0], 409)
        self.assertEqual(self.archive.read_text(), '{"job":"wrong","shuts":[]}')
