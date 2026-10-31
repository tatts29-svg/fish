"""Bounded source edits and preservation gates. Author: Andrew Fisher."""
import copy
import importlib.util
import json
import os
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "source_movements.py"
spec = importlib.util.spec_from_file_location("source_movements1254", MODULE)
movement = importlib.util.module_from_spec(spec)
spec.loader.exec_module(movement)


def synthetic_data():
    rows = {}
    for key, identity in movement.IDENTITIES.items():
        rows[key] = {"rental_contract": key[0], "line": key[1], "description": identity[0], "item_type_code": identity[1],
                     "branch_code": identity[2], "match": {"key": "SYNTHETIC-RECORDED"}, "private_note": "keep"}
    for key, edits in movement.EXISTING_EDITS.items():
        rows[key].update({field: before for field, (before, _after) in edits.items()})
    for key, values in movement.UNCHANGED_PRICE_LINES.items():
        rows[key] = {"rental_contract": key[0], "line": key[1], "branch_code": "KINP", "item_type_code": 2,
                     "item": values[0], "quantity": values[1], "price": values[2], "rate_1": None,
                     "match": {"state": "unmatched", "key": None}}
    rows[("9968955", 154)] = {"rental_contract": "9968955", "line": 154, "branch_code": "KINP", "description": "PG29 Toilet FWF", "quantity": 1, "rate_1": 90.07}
    rows[("9999999", 1)] = {"rental_contract": "9999999", "line": 1, "branch_code": "STPS", "price": 123.45, "quantity": 9.75, "match": {"key": "UNRULED"}}
    return {"rental_on_hire": {"rows": list(rows.values()), "assignments": {"x": "unchanged"}, "contracts": [{"rental_contract": c, "lines": sum(k[0] == c for k in rows), "other": "keep"} for c in sorted({k[0] for k in rows})], "summary": {"lines": len(rows), "miscellaneous_lines": 20, "unmatched": 20, "delivered_lines": 17, "other": "keep"}},
            "assets": [{"quantity": 7, "asset_numbers": ["synthetic"]}], "plant_lines": {"lines": [{"rental": ["unchanged"]}]}, "ops": {"dates": ["unchanged"]}}


class SourceMovementTests(unittest.TestCase):
    def test_exact_named_scalar_changes(self):
        before = synthetic_data()
        result, manifest = movement.apply_data(before)
        rows = {(r["rental_contract"], r["line"]): r for r in result["rental_on_hire"]["rows"]}
        self.assertEqual(rows[("9968955", 12)]["rate_1"], 945)
        self.assertEqual(rows[("9968955", 13)]["rate_1"], 945)
        self.assertEqual(rows[("9968955", 84)]["quantity"], 4)
        for key in [("9987005", 8), ("9968862", 137)]:
            self.assertEqual(rows[key]["rate_1"], 0)
            self.assertEqual(rows[key]["price"], 0)
        self.assertEqual(len(manifest["existing_fields"]), 7)

    def test_no_source_fabrication_or_duplicate_aggregate_change(self):
        before = synthetic_data(); result, _ = movement.apply_data(before)
        b = {(r["rental_contract"], r["line"]): r for r in before["rental_on_hire"]["rows"]}
        a = {(r["rental_contract"], r["line"]): r for r in result["rental_on_hire"]["rows"]}
        for key in [("9968955", 143), ("9968955", 154), ("9968955", 146), ("9968955", 163), ("9968955", 164), ("9968955", 165), ("9968862", 140), ("9968862", 141)]:
            self.assertEqual(a[key], b[key])
        self.assertEqual(a[("9968955", 143)]["price"], 260.25)
        self.assertEqual(a[("9968955", 143)]["quantity"], 24)
        self.assertEqual(a[("9968955", 164)]["quantity"], 15.22)
        self.assertEqual(a[("9968955", 165)]["quantity"], 27.15)

    def test_added_charges_have_expected_source_amounts_and_no_site_allocations(self):
        before = synthetic_data(); result, manifest = movement.apply_data(before)
        new = result["rental_on_hire"]["rows"][len(before["rental_on_hire"]["rows"]):]
        self.assertEqual([(r["rental_contract"], r["line"]) for r in new], [("9968955", 166), ("9968955", 167), ("9968862", 142), ("9968862", 143)])
        self.assertEqual([round(r["quantity"] * (r["rate_1"] if r["rate_1"] is not None else r["price"]), 2) for r in new], [180.14, 600, 46.84, 46.84])
        for row in new:
            self.assertEqual(row["branch_code"], "KINP")
            self.assertIs(type(row["item_type_code"]), int)
            self.assertFalse(row["asset_no_is_plant_number"])
            self.assertEqual(row["match"]["state"], "unmatched")
            for key in ["key", "to", "task_id", "via"]: self.assertIsNone(row["match"][key])
            for key in ["start_date", "demob_date", "delivered", "delivery_number", "return_number", "booked_delivery_date", "booked_pickup_date"]: self.assertIsNone(row[key])
        self.assertEqual(len(manifest["added"]), 4)

    def test_unrelated_data_and_input_preserved(self):
        before = synthetic_data(); frozen = copy.deepcopy(before); result, _ = movement.apply_data(before)
        self.assertEqual(before, frozen)
        for key in ["assets", "plant_lines", "ops"]: self.assertEqual(result[key], before[key])
        self.assertEqual(result["rental_on_hire"]["assignments"], before["rental_on_hire"]["assignments"])
        for old, new in zip(before["rental_on_hire"]["contracts"], result["rental_on_hire"]["contracts"]):
            expected = copy.deepcopy(old)
            if old["rental_contract"] in ("9968955", "9968862"): expected["lines"] += 2
            self.assertEqual(new, expected)
        expected_summary = copy.deepcopy(before["rental_on_hire"]["summary"])
        for field in ("lines", "miscellaneous_lines", "unmatched"): expected_summary[field] += 4
        self.assertEqual(result["rental_on_hire"]["summary"], expected_summary)
        for old, new in zip(before["rental_on_hire"]["rows"], result["rental_on_hire"]["rows"]):
            edits = movement.EXISTING_EDITS.get((old["rental_contract"], old["line"]), {})
            self.assertEqual({k: v for k, v in old.items() if k not in edits}, {k: v for k, v in new.items() if k not in edits})

    def test_wrong_identity_quantity_rate_or_branch_rejected(self):
        for contract, line, field, bad in [("9968955", 12, "rate_1", 1), ("9968955", 84, "quantity", 3), ("9968955", 164, "quantity", 15), ("9968862", 141, "branch_code", "NVAC"), ("9973977", 2, "item_type_code", "2")]:
            data = synthetic_data()
            row = next(r for r in data["rental_on_hire"]["rows"] if (r["rental_contract"], r["line"]) == (contract, line))
            row[field] = bad
            with self.subTest(contract=contract, line=line, field=field), self.assertRaises(movement.SourceMovementError): movement.apply_data(data)

    def test_repeat_or_duplicate_source_rejected(self):
        data = synthetic_data(); result, _ = movement.apply_data(data)
        with self.assertRaises(movement.SourceMovementError): movement.apply_data(result)
        data["rental_on_hire"]["rows"].append(copy.deepcopy(data["rental_on_hire"]["rows"][0]))
        with self.assertRaises(movement.SourceMovementError): movement.apply_data(data)

    @unittest.skipUnless(os.environ.get("SOURCE_PAGE"), "Exact live predecessor supplied privately")
    def test_exact_predecessor_source_guards(self):
        import hashlib
        raw = Path(os.environ["SOURCE_PAGE"]).read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), movement.BASE_SHA256)
        html = raw.decode(); start = html.index("const DATA = ") + len("const DATA = ")
        data, _ = json.JSONDecoder().raw_decode(html[start:])
        result, manifest = movement.apply_data(data)
        self.assertEqual(len(manifest["existing_fields"]), 7)
        self.assertEqual(len(result["rental_on_hire"]["rows"]), len(data["rental_on_hire"]["rows"]) + 4)


if __name__ == "__main__":
    unittest.main()
