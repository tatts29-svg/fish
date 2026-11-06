"""Explicit, bounded contract-source changes for v12.54. Author: Andrew Fisher.

These are the named ruled movements, not a complete Baseplan9 import. Source
quantities and prices already present are retained exactly. In particular the
approved zero charge for the sewer-cleaning line is a financial treatment: its
source Price and Quantity are not rewritten to fabricate a zero source price.
"""
from __future__ import annotations

import copy


class SourceMovementError(ValueError):
    pass


BASE_SHA256 = "69bf04e72a45e084f0ba5227b4a26cf95ffe4078429044946af473120d4e7bb2"
APPROVED_CONTRACTS = frozenset(("9987005", "9973977", "9968929", "9968955", "9968862"))

# Only these existing source cells change. Exact predecessor values are checked.
EXISTING_EDITS = {
    ("9968955", 12): {"rate_1": (237.71, 945)},
    ("9968955", 13): {"rate_1": (237.71, 945)},
    ("9968955", 84): {"quantity": (2, 4)},
    ("9968862", 137): {"rate_1": (None, 0), "price": (None, 0)},
    ("9987005", 8): {"rate_1": (None, 0), "price": (None, 0)},
}

# Price-only charge readers consume these existing source values, not copied
# totals. This also guards quantities corrected by the earlier precision release.
UNCHANGED_PRICE_LINES = {
    ("9973977", 2): ("LABOUR", 1, 707.88),
    ("9968955", 141): ("PUMPOUT", 702, 72.87),
    ("9968955", 142): ("PUMPOUT", 24, 624.6),
    ("9968955", 143): ("CLEAN", 24, 260.25),
    ("9968955", 144): ("LABOUR", 12, 707.88),
    ("9968955", 145): ("LABOUR", 8, 88.49),
    ("9968955", 146): ("LABOUR", 434, 36.44),
    ("9968955", 160): ("LABOUR", 2, 551.73),
    ("9968955", 163): ("TRAVEL EXPENSES", 1, 13850.0),
    ("9968955", 164): ("LABOUR", 15.22, 150.11),
    ("9968955", 165): ("LABOUR", 27.15, 91.14),
    ("9968862", 133): ("LABOUR", 38, 655.83),
    ("9968862", 139): ("LABOUR", 4, 499.68),
    ("9968862", 140): ("TRAVEL EXPENSES", 1, 13850.0),
    ("9968862", 141): ("LABOUR", 15.22, 150.11),
}

IDENTITIES = {
    ("9968955", 12): ("WC100 Toilet Portable - With Trailer", 1, "KINP"),
    ("9968955", 13): ("WC100 Toilet Portable - With Trailer", 1, "KINP"),
    ("9968955", 84): ("WC67 Toilet Portable - Fresh Water Flush", 1, "KINP"),
    ("9968862", 137): ("Stillage Fire Extinguishers", 1, "KINP"),
    ("9987005", 8): ("Laserplane", 1, "MEAD"),
}


def _unmatched():
    return {"state": "unmatched", "to": None, "key": None, "task_id": None,
            "via": None, "basis": "Approved source contract line only; no site allocation inferred"}


def _addition(contract, line, item, description, quantity, price, rate, status,
              sales_code, family, register_type, what, item_type, charge_line):
    # Start is the source contract date in the public comparison. It is not a
    # physical delivery date; unknown booking/arrival/completion fields stay null.
    return {
        "rental_contract": contract, "branch_code": "KINP", "line": line,
        "item": item, "asset_no": item, "asset_no_is_plant_number": False,
        "description": description, "what": what, "quantity": quantity,
        "price": price, "rate_1": rate, "rate_2": None, "rate_3": None,
        "rate_4": None, "rate_5": None, "flat_monthly_charge": None,
        "item_type_code": item_type, "status_as_written": status,
        "sales_analysis_code": sales_code, "contract_start": "2026-10-28",
        "term_date": None, "booked_delivery_date": None,
        "booked_pickup_date": None, "expected_term_date": None,
        "start_date": None, "demob_date": None, "delivered": None,
        "delivery_number": None, "return_number": None,
        "supplier_sub_rental": None, "subhired": None, "subhire_rule": None,
        "register_type": register_type, "family": family, "kind": family,
        "charge_line": charge_line, "match": _unmatched(),
        "sourceAddition1254": True,
        "source_supplement": "Explicit ruled contract-line movement; public Baseplan9 comparison, 29 Oct 2026",
    }


def additions():
    """Fresh unmatched templates containing only the stated source facts."""
    return [
        _addition("9968955", 166, "MISCITEMS", "WC66 Toilet FWF", 2, 0, 90.07,
                  "Delivered", "KINP-HIR", "toilet", "FWF", "Toilet FWF", 1, False),
        _addition("9968955", 167, "TRANSPORT", "Transport Charge Trailer Toilets", 4, 150, None,
                  "Delivered", "KINP-FRI", "transport", None, "Transport Charge Trailer Toilets", 2, True),
        _addition("9968862", 142, "MISCITEMS", "P29 Fridge", 1, 0, 46.84,
                  "Pending", "KINP-HIR", "furniture", "Fridge Lge", "Fridge", 1, False),
        _addition("9968862", 143, "MISCITEMS", "P53 Fridge", 1, 0, 46.84,
                  "Pending", "KINP-HIR", "furniture", "Fridge Lge", "Fridge", 1, False),
    ]


def _fail(condition, message):
    if not condition:
        raise SourceMovementError(message)


def _key(row):
    contract, line = row.get("rental_contract"), row.get("line")
    _fail(isinstance(contract, str) and isinstance(line, int) and not isinstance(line, bool), "Invalid existing contract-line identity")
    return contract, line


def apply_data(data):
    """Return a new DATA object plus an explicit source-only change manifest.

    The outer patch must require BASE_SHA256. No operational data, joins,
    assignments, plant copies or unrelated source row is changed here. Only
    affected source line-count summaries advance for the four additions.
    """
    _fail(isinstance(data, dict) and isinstance(data.get("rental_on_hire"), dict), "Missing rental source data")
    current = data["rental_on_hire"].get("rows")
    _fail(isinstance(current, list), "Missing rental source rows")
    by_key = {_key(row): row for row in current}
    _fail(len(by_key) == len(current), "Duplicate existing source identity")
    _fail(not any(row.get("sourceAddition1254") for row in current), "Bounded movements already applied")

    for key, expected in IDENTITIES.items():
        row = by_key.get(key)
        _fail(row is not None and (row.get("description"), row.get("item_type_code"), row.get("branch_code")) == expected,
              f"Unexpected source identity {key[0]}/{key[1]}")
        _fail(type(row["item_type_code"]) is int, "Source Item Type must remain numeric")
    for key, edits in EXISTING_EDITS.items():
        for field, (old, _new) in edits.items():
            _fail(field in by_key[key] and by_key[key][field] == old, f"Predecessor field mismatch {key[0]}/{key[1]} {field}")
    for key, expected in UNCHANGED_PRICE_LINES.items():
        row = by_key.get(key)
        _fail(row is not None and row.get("branch_code") == "KINP" and type(row.get("item_type_code")) is int and row["item_type_code"] == 2,
              f"Unexpected Price-only identity {key[0]}/{key[1]}")
        _fail((row.get("item"), row.get("quantity"), row.get("price")) == expected and row.get("rate_1") is None,
              f"Existing source amount or quantity changed {key[0]}/{key[1]}")
    pg29 = by_key.get(("9968955", 154))
    _fail(pg29 is not None and (pg29.get("description"), pg29.get("quantity"), pg29.get("rate_1"), pg29.get("branch_code")) ==
          ("PG29 Toilet FWF", 1, 90.07, "KINP"), "Existing PG29 source charge changed")
    extra = additions()
    _fail(all(_key(row) not in by_key for row in extra), "Named addition already exists")
    contracts = data["rental_on_hire"].get("contracts")
    summary = data["rental_on_hire"].get("summary")
    _fail(isinstance(contracts, list) and all(isinstance(c, dict) for c in contracts) and isinstance(summary, dict), "Missing source count summaries")
    for contract in ("9968955", "9968862"):
        found = [c for c in contracts if str(c.get("rental_contract")) == contract]
        expected_count = sum(str(r["rental_contract"]) == contract for r in current)
        _fail(len(found) == 1 and type(found[0].get("lines")) is int and found[0]["lines"] == expected_count, "Unexpected scoped contract line count")
    _fail(type(summary.get("lines")) is int and summary["lines"] == len(current), "Unexpected total source line count")
    for field in ("miscellaneous_lines", "unmatched"):
        _fail(type(summary.get(field)) is int and summary[field] >= 0, "Invalid source classification count")

    result = copy.deepcopy(data)
    result_rows = result["rental_on_hire"]["rows"]
    result_keys = {_key(row): row for row in result_rows}
    manifest = {"scope": "explicit ruled movements only; not a complete Baseplan9 import", "base_sha256": BASE_SHA256,
                "existing_fields": [], "added": [], "metadata_fields": []}
    for key, edits in EXISTING_EDITS.items():
        for field, (old, new) in edits.items():
            result_keys[key][field] = new
            manifest["existing_fields"].append({"contract": key[0], "line": key[1], "field": field, "before": old, "after": new})
    # Append without resorting: original row order and all existing row values
    # outside the seven named cells remain exactly as supplied.
    result_rows.extend(extra)
    manifest["added"] = [{"contract": r["rental_contract"], "line": r["line"]} for r in extra]
    for c in result["rental_on_hire"]["contracts"]:
        if str(c.get("rental_contract")) in ("9968955", "9968862"):
            before = c["lines"]
            c["lines"] += 2
            manifest["metadata_fields"].append({"collection": "contracts", "contract": str(c["rental_contract"]), "field": "lines", "before": before, "after": c["lines"]})
    for field in ("lines", "miscellaneous_lines", "unmatched"):
        before = result["rental_on_hire"]["summary"][field]
        result["rental_on_hire"]["summary"][field] += 4
        manifest["metadata_fields"].append({"collection": "summary", "field": field, "before": before, "after": before + 4})
    return result, manifest
