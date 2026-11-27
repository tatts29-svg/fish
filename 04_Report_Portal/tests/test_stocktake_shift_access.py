import gzip
import json
from unittest.mock import patch

import server
import stocktake_store
from test_swms import PortalHTTPCase


class ShiftReviewAccess(PortalHTTPCase):
    def test_manager_can_open_review_and_other_screens_keep_their_existing_permissions(self):
        endpoint = "/stocktake/shift-review"
        with patch.object(stocktake_store, "shift_review", return_value={"shifts": []}) as review:
            self.assertEqual(self.request("GET", endpoint)[0], 401)
            for user, can_record in (("client", False), ("store", True)):
                self.assertEqual(self.request("GET", endpoint, user)[0], 403)
                ledger = json.loads(self.request("GET", "/stocktake/entries", user)[2])
                self.assertEqual(ledger["can_record"], can_record)
                self.assertFalse(ledger["can_review_shifts"])
            review.assert_not_called()
            headers = {"X-Portal": "1", "Cookie": "s=" + server._session("testmanager")}
            ledger = json.loads(self.request("GET", "/stocktake/entries", headers=headers)[2])
            self.assertTrue(ledger["can_review_shifts"])
            status, response, data = self.request("GET", endpoint, headers=headers)
            self.assertEqual((status, json.loads(data)), (200, {"shifts": []}))
            self.assertEqual(response["Cache-Control"], "no-store")
            review.assert_called_once_with(str(self.root))
            _, response, data = self.request("GET", endpoint, headers={**headers, "Accept-Encoding": "gzip"})
            self.assertEqual(response["Content-Encoding"], "gzip")
            self.assertEqual(json.loads(gzip.decompress(data)), {"shifts": []})

    def test_review_is_only_served_for_the_published_mmg_job(self):
        path = self.root / "report.html"
        path.write_text('const D={"stocktake":{"schedule":"Another job"}};')
        self.assertEqual(self.request("GET", "/stocktake/shift-review", "testmanager")[0], 409)
        (self.root / "job" / "kit" / "JOB.txt").write_text("customer: Other")
        self.assertEqual(self.request("GET", "/stocktake/shift-review", "testmanager")[0], 404)

    def test_new_upload_and_portal_count_are_visible_without_restarting(self):
        endpoint = "/stocktake/shift-review"
        path = self.root / "report.html"
        def publish(asat):
            model = {"stocktake": {"schedule": stocktake_store.MMG_SCHEDULE, "asat": asat},
                     "costs": {"roster": [{"name": "Example Controller"}]}}
            tmp = self.root / "new.html"
            tmp.write_text("<html><head></head><body><script>const D=" + json.dumps(model) + ";</script></body></html>")
            tmp.replace(path)

        with patch("stocktake.shift_analysis", return_value={}) as analysis, \
                patch.object(stocktake_store, "all_entries", side_effect=[[], [{"quantity": 1}]]):
            versions = []
            for asat in ("2026-11-27T15:14", "2026-11-28T07:17"):
                publish(asat)
                status, _, review = self.request("GET", endpoint, "testmanager")
                self.assertEqual(status, 200)
                version = json.loads(review)["report_version"]
                page = self.request("GET", "/", "testmanager")[2]
                self.assertIn(f'<meta name="mmg-report-version" content="{version}">'.encode(), page)
                versions.append(version)
            self.assertNotEqual(*versions)
        first, latest = (call.args for call in analysis.call_args_list)
        self.assertEqual((first[0]["asat"], first[2]), ("2026-11-27T15:14", []))
        self.assertEqual((latest[0]["asat"], latest[2]), ("2026-11-28T07:17", [{"quantity": 1}]))
        self.assertEqual(latest[1], [{"name": "Example Controller"}])
        self.assertTrue(latest[3].endswith("+10:00"))
