import json
from pathlib import Path
import tempfile
import unittest
from datetime import date
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sds_register import build


class SdsRegister(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.path = Path(temp.name) / "register.json"
        (self.path.parent / "pdfs").mkdir()
        self.data = {"clines": [{"name": "Adhesive", "code": "12345678", "sku": "SKU1",
                                 "bar": "2025MMG12345678", "stock_quantity": 0, "owner": "MMG"},
                                {"name": "Oil", "code": "", "sku": "SKU2", "stock_quantity": None}],
                     "utilisation": {"variants": [
                         {"name": "Battery - 18V - Milwaukee", "variant": "M18HB6", "history_key": "v:M18HB6",
                          "owner": "Coates", "fleet": 3},
                         {"name": "Light - LED - Battery - Milwaukee", "variant": "L", "history_key": "v:L",
                          "owner": "MMG", "fleet": 6},
                         {"name": "Battery - 12Ah - Milwaukee", "variant": "", "history_key": "d:MMG|12AH",
                          "owner": "MMG", "fleet": 2}]}}
        self.record = {"status": "verified", "stock_names": ["Adhesive"], "product": "Product",
                       "supplier": "Manufacturer", "issued": "2022-02-01", "url": "https://example.org/au/sds.pdf",
                       "file": "adhesive-a98a143.pdf"}
        (self.path.parent / "pdfs" / self.record["file"]).write_bytes(b"%PDF-1.4")

    def rows(self, entries=None):
        if entries is not None:
            self.path.write_text(json.dumps({"entries": entries, "checked": "2026-11-27"}))
        return build(self.data, self.path, today=date(2026, 11, 27))

    def test_all_holdings_without_a_register(self):
        rows = self.rows()
        self.assertEqual([r["quantity"] for r in rows], [0, None, 3, 6, 2])
        self.assertTrue(all(r["status"] == "unassessed" and not r["checked"] for r in rows))

    def test_stale_missing_unmatched_and_unsafe_document(self):
        for changes, expected in [({}, "verified"), ({"issued": "2021-11-27"}, "review"),
                                  ({"issued": "2027-03-02"}, "review"), ({"issued": ""}, "review"),
                                  ({"file": "../../outside.pdf"}, "review"), ({"url": "javascript:alert(1)"}, "review"),
                                  ({"url": "https://trusted.org@invalid.org/sds"}, "review"),
                                  ({"stock_names": ["Other product"]}, "label")]:
            with self.subTest(changes=changes):
                row = self.rows({"12345678": {**self.record, **changes}})[0]
                self.assertEqual(row["status"], expected)
                if expected == "verified":
                    self.assertTrue(row["file"].startswith("/sds/"))
                if expected == "label":
                    self.assertFalse(row["file"] or row["url"])
                if changes.get("file"):
                    self.assertFalse(row["file"])

    def test_lookup_by_fallback_sku_and_exact_battery_model(self):
        rows = self.rows({"sku:SKU2": {"status": "label", "product": "Brand unknown"},
                          "__milwaukee": {**self.record, "stock_names": ["Battery - 18V - Milwaukee"],
                                          "variants": ["M18HB6"], "source": "https://example.org/guide"}})
        self.assertEqual(rows[1]["status"], "label")
        self.assertEqual(rows[2]["status"], "verified")
        self.assertEqual(rows[3]["status"], "unassessed")
        self.assertEqual(rows[4]["status"], "label")
        self.assertEqual(rows[4]["source"], "https://example.org/guide")
        self.assertFalse(rows[4]["url"] or rows[4]["file"])

    def test_product_sheet_keeps_its_status_and_printed_month(self):
        row = self.rows({"12345678": {**self.record, "issued": "2025-05", "status": "article",
                                      "document_type": "technical"}})[0]
        self.assertEqual((row["status"], row["document_type"], row["issued"]), ("article", "technical", "2025-05"))
        self.assertTrue(row["url"] and row["file"])

    def test_no_supplier_sheet_claim_for_a_product_guide(self):
        row = self.rows({"12345678": {**self.record, "document_type": "guide"}})[0]
        self.assertEqual((row["status"], row["document_type"]), ("article", "guide"))
