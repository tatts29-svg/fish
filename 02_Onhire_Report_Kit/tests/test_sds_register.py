import json
from pathlib import Path
import tempfile
import unittest
from datetime import date
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sds_register import build, review_dates, stock_quantity


class SdsRegister(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.path = Path(temp.name) / "register.json"
        self.library = self.path.parent / "pdfs"
        self.library.mkdir()
        self.line = {"name": "Adhesive", "code": "12345678", "sku": "SKU1", "bar": "2025MMG12345678",
                     "stock_quantity": 2, "owner": "MMG", "bin": "A1", "storage_location": "Tool store"}
        self.data = {"clines": [self.line], "utilisation": {"variants": [{"name": "Radio - Motorola",
                     "history_key": "v:RADIO", "assets": [{"id": "RF12", "owner": "MMG", "status": "Available for Hire"}]}]}}
        self.record = {"status": "verified", "stock_names": ["Adhesive"], "product": "Product",
                       "supplier": "Manufacturer", "issued": "2022-02-01", "url": "https://example.org/au/sds.pdf",
                       "file": "adhesive-a98a143.pdf", "uom": "cartridges"}
        (self.library / self.record["file"]).write_bytes(b"%PDF-1.4")
        self.context = {"SALES_STOCK": "2026-11-27T14:39:00+10:00", "RENTAL_STOCK": "2026-11-26T06:54:00+10:00",
                        "job": "MMG Shutdown", "location": "Dugald River QLD"}
        self.encoded = []

    def rows(self, entries):
        self.path.write_text(json.dumps({"entries": entries, "checked": "2026-11-27"}))

        def encode(url):
            self.encoded.append(url)
            return "21:test-matrix"

        return build(self.data, self.path, context=self.context, encode_qr=encode, today=date(2026, 11, 27))

    def test_only_actual_matched_au_sds(self):
        for changes in [{"status": "unassessed"}, {"status": "label"}, {"status": "article"}, {"status": "review"},
                        {"document_type": "product"}, {"jurisdiction": "US"}, {"url": "https://example.org/landing"},
                        {"file": "../../outside.pdf"}, {"file": "missing.pdf"}, {"url": "javascript:alert(1)"},
                        {"url": "https://trusted.org@invalid.org/sds.pdf"}, {"match_confirmed": False},
                        {"stock_names": ["Different formulation"]}]:
            with self.subTest(changes=changes):
                self.assertEqual(self.rows({"12345678": {**self.record, **changes}}), [])
        (self.library / self.record["file"]).write_bytes(b"HTML error page")
        self.assertEqual(self.rows({"12345678": self.record}), [])

    def test_complete_equipment_and_fitted_batteries_do_not_appear(self):
        battery = {**self.record, "stock_names": ["Radio - Motorola"], "product": "Radio battery"}
        self.assertEqual(self.rows({"asset:RF12": battery, "v:RADIO": battery}), [])

    def test_balance_identity_and_export_provenance(self):
        # A repeated balance is not additional stock; distinct SKU/location balances are.
        self.data["clines"] += [self.line.copy(), {**self.line, "sku": "SKU2", "stock_quantity": 3},
                               {**self.line, "storage_location": "Satellite store", "stock_quantity": 1}]
        row, = self.rows({"12345678": self.record})
        self.assertEqual(row["quantity"], 6)
        self.assertEqual((row["owner"], row["uom"], row["bin"]), ("MMG", "cartridges", "A1"))
        self.assertEqual(row["stock_asat"], self.context["SALES_STOCK"])
        self.assertEqual(row["sku"], "SKU1, SKU2")
        self.assertEqual(row["review_status"], "in_date")
        self.assertEqual(row["review_due"], "2027-02-01")
        self.assertEqual(row["file"], "/sds/" + self.record["file"])
        self.assertEqual(self.encoded, [self.record["url"]])
        self.assertTrue(row["qr"])

    def test_missing_balance_and_old_sheet(self):
        self.data["clines"] += [{**self.line, "stock_quantity": 1}]
        row, = self.rows({"12345678": {**self.record, "issued": "2021-11-27", "status": "review", "match_confirmed": True}})
        self.assertIsNone(row["quantity"])
        self.assertEqual((row["status"], row["review_status"], row["review_due"]), ("verified", "review_required", "2026-11-27"))
        self.assertEqual(review_dates("2020-02-29", date(2025, 2, 28)), ("2025-02-28", "review_required"))

    def test_only_explicit_sheet_fields(self):
        row, = self.rows({"12345678": {**self.record, "issued": "2025-05", "sds_details": {
            "ghs_classification": ["Eye irritation"], "un_number": "UN1234", "unexpected": "x",
            "storage": {"invalid": "shape"}}}})
        self.assertEqual(row["sds_details"], {"ghs_classification": ["Eye irritation"], "un_number": "UN1234"})
        self.assertEqual(row["review_due"], "2030-05")

    def test_parse_recorded_quantities(self):
        for value in (None, "", "unrecorded", "#N/A", True, "1,2", "nan", "inf"):
            self.assertIsNone(stock_quantity(value))
        for value, expected in [("0", 0), ("1,234", 1234), ("2.5", 2.5), (12, 12)]:
            self.assertEqual(stock_quantity(value), expected)

    def test_photo_requires_real_image_and_provenance(self):
        import base64
        import io
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("Pillow is needed for embedded photographs")
        photo = io.BytesIO()
        Image.new("RGB", (2, 2), "#888888").save(photo, format="WEBP")
        metadata = {"photo_caption": "Supplier catalogue image", "photo_source": "https://example.org/p/adhesive",
                    "photo_data": "data:image/webp;base64," + base64.b64encode(photo.getvalue()).decode()}
        row, = self.rows({"12345678": {**self.record, **metadata}})
        self.assertEqual(row["photo"], metadata["photo_data"])
        for bad in [{"photo_caption": ""}, {"photo_source": "javascript:bad"}, {"photo_data": "data:image/webp;base64,AAAA"}]:
            row, = self.rows({"12345678": {**self.record, **metadata, **bad}})
            self.assertNotIn("photo", row)
            self.assertEqual(row["status"], "verified")
