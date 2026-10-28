"""Scoped Baseplan source reader for v12.54. Author: Andrew Fisher.

This module only refreshes source fields. It does not decide charge coverage,
turn a source line into an operational unit, or infer a reference allocation.
The release patch must separately reconcile its existing financial readers and
contract summaries. A private original and its complete SHA256 are mandatory.
"""
from __future__ import annotations

import copy
import datetime as dt
import hashlib
import json
import math
import re
from dataclasses import dataclass
from pathlib import Path

CONTRACTS = {"9987005": "MEAD", "9973977": "KINP", "9968929": "KINP", "9968955": "KINP", "9968862": "KINP"}
HEADERS = (
    "Line", "Status", "Item Type", "Item", "Bundle Equipment", "Description", "Quantity", "Price", "Prebill Amount",
    "Rate 1", "Rate 2", "Rate 3", "Rate 4", "Rate 5", "Flat Monthly Charge", "Term Date", "Term Time", "Term Number",
    "Expected Term Date", "Expected Offrental Time", "Number of Days", "Sales Analysis Code", "Split Sales Analysis Code",
    "Supplier Sub Rental", "Start Date", "Start Time", "Last Bill Date", "Last Bill Time", "Billed To Date", "Billed To Time",
    "Last Billed Amount", "Last Total Amount", "Billed Amount", "Billed Units", "Tot(inc.SD,DW&GST)", "Swap Date", "Swap Time",
    "Swap From Line No", "Start Meter", "Rate Type", "Split Revenue %", "Memo", "Delivery Number", "Return Number",
    "Return Docket Number", "Booked Delivery Date", "Booked Pickup Date", "Package Name", "Bundle Line Number", "Main Item",
    "Minimum Days", "T Status", "Rate Approver", "Linked EQ Line", "Job Code", "Serial Number", "Rate ID", "Rate Classification",
    "PickUp Request Number", "Package Type", "Sequence #", "Hold Billing", "Group Report Option", "Sort Order", "Sell Price",
    "Quoted Qty", "Quoted Price", "Billing Option", "Display Labor Tickets", "Warehouse",
)


class SourceError(ValueError):
    """The supplied source cannot safely satisfy the scoped refresh."""


def _fail(condition, message):
    if not condition:
        raise SourceError(message)


def _text(value):
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise SourceError("Boolean supplied in text/identity field")
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return re.sub(r"\s+", " ", str(value)).strip() or None


def _number(value):
    if value is None or value == "":
        return None
    _fail(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value), "Non-numeric or non-finite source number")
    return value  # Preserve zero and fractional quantities; never truncate or turn zero into a blank.


def _day(value):
    if value is None or value == "":
        return None
    _fail(isinstance(value, (dt.date, dt.datetime)), "Date column is not an Excel date")
    return value.date().isoformat() if isinstance(value, dt.datetime) else value.isoformat()


def _time(value):
    if value is None or value == "":
        return None
    _fail(isinstance(value, dt.time), "Time column is not an Excel time")
    return value.isoformat(timespec="minutes")


def _flag(value):
    if value is None or value == "":
        return None
    _fail(value in (True, False, 0, 1), "Invalid source flag")
    return bool(value)


TEXT_FIELDS = {
    "item": "Item", "description": "Description", "status_as_written": "Status",
    "sales_analysis_code": "Sales Analysis Code", "supplier_sub_rental": "Supplier Sub Rental", "location": "Memo",
    "delivery_number": "Delivery Number", "return_number": "Return Number", "serial": "Serial Number",
    "rate_type": "Rate Type", "rate_classification": "Rate Classification", "rate_id": "Rate ID",
    "billing_option": "Billing Option", "package_name": "Package Name",
}
NUMBER_FIELDS = {
    "quantity": "Quantity", "price": "Price", "rate_1": "Rate 1", "rate_2": "Rate 2", "rate_3": "Rate 3",
    "rate_4": "Rate 4", "rate_5": "Rate 5", "flat_monthly_charge": "Flat Monthly Charge", "sell_price": "Sell Price",
    "number_of_days": "Number of Days", "minimum_days": "Minimum Days", "term_number": "Term Number",
    "swap_from_line": "Swap From Line No", "billed_amount": "Billed Amount", "last_total_amount": "Last Total Amount",
    "billed_units": "Billed Units", "total_inc_sd_dw_gst": "Tot(inc.SD,DW&GST)",
}
DATE_FIELDS = {
    "booked_delivery_date": "Booked Delivery Date", "booked_pickup_date": "Booked Pickup Date",
    "expected_term_date": "Expected Term Date", "term_date": "Term Date", "contract_start": "Start Date",
}


def _project(raw):
    out = {k: _text(raw[v]) for k, v in TEXT_FIELDS.items()}
    out.update({k: _number(raw[v]) for k, v in NUMBER_FIELDS.items()})
    out.update({k: _day(raw[v]) for k, v in DATE_FIELDS.items()})
    _fail(out["quantity"] is not None and out["quantity"] >= 0, "Missing or negative source quantity")
    _fail(out["item"] is not None and out["description"] is not None and out["status_as_written"] is not None, "Missing source identity, description or status")
    item_type = _number(raw["Item Type"])
    _fail(item_type is not None and item_type >= 0 and int(item_type) == item_type, "Missing or invalid Item Type")
    out["item_type_code"] = int(item_type)
    out["asset_no"] = out["item"]
    out["asset_no_is_plant_number"] = bool(re.fullmatch(r"\d{5,8}", out["item"]))
    out["start_time_as_written"] = _time(raw["Start Time"])
    out["expected_offrental_time"] = _time(raw["Expected Offrental Time"])
    out["hold_billing"] = _flag(raw["Hold Billing"])
    out["main_item"] = _flag(raw["Main Item"])
    return out


def _digest(rows):
    return hashlib.sha256(json.dumps(rows, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


@dataclass(frozen=True)
class ScopedSource:
    approved_contracts: tuple[tuple[str, str], ...]
    source_sha256: str
    rows: tuple[dict, ...]
    rows_sha256: str


def read_scoped_export(path, expected_sha256, approved_contracts):
    """Validate the private original, then read precisely the supplied approved sheets.

    Unruled sheets are deliberately neither refreshed nor used to infer joins.
    Formula-bearing rows and schema variations require a reviewed reader update.
    """
    import openpyxl

    _fail(isinstance(expected_sha256, str) and re.fullmatch(r"[0-9a-f]{64}", expected_sha256), "Complete lowercase SHA256 is required")
    _fail(isinstance(approved_contracts, dict) and bool(approved_contracts), "Explicit approved-contract map is required")
    allowed = dict(approved_contracts)
    _fail(all(k in CONTRACTS and v == CONTRACTS[k] for k, v in allowed.items()), "Unrecognised approved contract or branch")
    path = Path(path)
    _fail(hashlib.sha256(path.read_bytes()).hexdigest() == expected_sha256, "Source fingerprint mismatch")
    book = openpyxl.load_workbook(path, read_only=True, data_only=False)
    rows, seen, sheets = [], set(), set()
    try:
        for sheet in book.worksheets:
            match = re.fullmatch(r"(?:Hre Contract-)?(\d{7,8})\s*(?:-|\s)\s*([A-Za-z]+)", sheet.title.strip())
            if not match or match.group(1) not in allowed:
                continue
            contract, branch = match.groups()
            _fail(contract not in sheets and branch == allowed[contract], "Duplicate contract sheet or unexpected branch")
            sheets.add(contract)
            source_rows = sheet.iter_rows(values_only=True)
            header = tuple(next(source_rows, ()))
            # This one source sheet uses its contract number as the first header.
            if contract == "9968862" and header and header[0] == 9968862:
                header = ("Line",) + header[1:]
            _fail(header == HEADERS, "Unexpected source columns")
            count = 0
            for values in source_rows:
                if all(value is None for value in values):
                    continue
                _fail(len(values) == len(HEADERS), "Unexpected row width")
                _fail(not any(isinstance(v, str) and v.startswith("=") for v in values), "Formula row requires explicit source review")
                raw = dict(zip(HEADERS, values))
                line = raw["Line"]
                _fail(isinstance(line, (int, float)) and not isinstance(line, bool) and math.isfinite(line) and line > 0 and int(line) == line, "Invalid source line identity")
                key = (contract, int(line))
                _fail(key not in seen, "Duplicate source line")
                seen.add(key)
                row = {"rental_contract": contract, "branch_code": branch, "line": int(line), **_project(raw)}
                rows.append(row)
                count += 1
            _fail(count > 0, "Empty ruled contract sheet")
    finally:
        book.close()
    _fail(sheets == set(allowed), "Missing ruled contract sheet")
    rows.sort(key=lambda r: (r["rental_contract"], r["line"]))
    frozen_rows = tuple(rows)
    return ScopedSource(tuple(sorted(allowed.items())), expected_sha256, frozen_rows, _digest(frozen_rows))


def _key(row):
    contract, line = str(row["rental_contract"]), row["line"]
    _fail(isinstance(line, int) and not isinstance(line, bool) and line > 0, "Invalid existing row identity")
    return contract, line


def refresh_scoped_rows(data, source, new_row_templates=None):
    """Return an isolated DATA copy and a source-only delta manifest.

    Every unruled row, match, assignment and operational collection is preserved.
    A new row needs a reviewed metadata template with an explicitly unmatched
    reference. Removing an existing line is rejected; no deletion policy is
    inferred from an incomplete source. Effective rate overrides also require a
    separate reviewed policy. This function does not refresh contract summaries
    or plant rental copies; callers must reconcile those explicitly before use.
    """
    _fail(isinstance(source, ScopedSource) and _digest(source.rows) == source.rows_sha256, "Source bundle changed after validation")
    _fail(re.fullmatch(r"[0-9a-f]{64}", source.source_sha256), "Invalid source fingerprint")
    allowed = dict(source.approved_contracts)
    _fail(bool(allowed) and len(allowed) == len(source.approved_contracts) and all(k in CONTRACTS and v == CONTRACTS[k] for k, v in allowed.items()), "Invalid approved source scope")
    incoming = {_key(row): row for row in source.rows}
    _fail(len(incoming) == len(source.rows), "Duplicate incoming identity")
    _fail({k[0] for k in incoming} == set(allowed), "Unexpected scoped contracts")
    _fail(all(row["branch_code"] == allowed[key[0]] for key, row in incoming.items()), "Source branch mismatch")
    result = copy.deepcopy(data)
    rental = result["rental_on_hire"]
    current = {_key(row): row for row in rental["rows"]}
    _fail(len(current) == len(rental["rows"]), "Duplicate existing identity")
    scoped = {k for k in current if k[0] in allowed}
    _fail(scoped <= set(incoming), "Source removes existing rows; explicit removal policy required")
    additions = set(incoming) - scoped
    templates = new_row_templates or {}
    _fail(set(templates) == additions, "Every new source row requires exactly one explicit template")
    changed = []
    for key in sorted(incoming):
        fields = incoming[key]
        if key in current:
            row = current[key]
            _fail(row.get("branch_code") == allowed[key[0]], "Existing branch attribution differs from source sheet")
            _fail(not row.get("rate_held1029") and not row.get("fixed12428"), "Effective source override requires separate policy")
        else:
            row = copy.deepcopy(templates[key])
            _fail(_key(row) == key, "Template identity mismatch")
            _fail(row.get("branch_code") == allowed[key[0]], "Template branch mismatch")
            match = row.get("match")
            _fail(isinstance(match, dict) and match.get("state") == "unmatched" and all(match.get(k) is None for k in ("to", "key", "task_id", "via")), "New source row must not infer a site allocation")
            _fail(isinstance(row.get("charge_line"), bool) and isinstance(row.get("family"), str) and isinstance(row.get("kind"), str), "Template lacks reviewed classification")
            rental["rows"].append(row)
        delta = sorted(k for k, v in fields.items() if row.get(k) != v or k not in row)
        row.update(copy.deepcopy(fields))
        row["source1254"] = {"sha256": source.source_sha256, "contract": key[0], "line": key[1]}
        if delta or key in additions:
            changed.append({"contract": key[0], "line": key[1], "fields": delta, "added": key in additions})
    return result, {"source_sha256": source.source_sha256, "rows_sha256": source.rows_sha256, "changed": changed}
