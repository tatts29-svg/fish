"""Author: Andrew Fisher. Exact reviewed fencing catalogue snapshots.

Usage: patch_v1093.py INPUT [OUTPUT]
Private input is supplied through GC500_FENCING_EVIDENCE_INPUT.
This patch neither writes native records nor changes the matching algorithm.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import json
import os
import re
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "toolchain"))
from rep import rep

BASE_VERSION = "v10.92"
# Frozen against the verified predecessor and reviewed private correction input.
BASE_SHA256 = "4a94062d014c4c3c56cb94faba9622d75ed445cc1d5f1b625cb9a54845533da9"
PRIVATE_INPUT_SHA256 = "7ad727591872ec5ee1a61ed4b838adc2c4593a625026452425290237688c52c9"
MARKER = "reviewed fencing catalogue snapshots v10.93"
EXPECTED_FIELDS = {
    "id", "docket_no", "date", "week", "programme_sheet", "location",
    "quantities", "components", "note", "source",
}
IDENTITY_FIELDS = {"id", "docket_no", "date", "week", "programme_sheet", "source"}
ROW_FIELDS = {"record_id", "before", "after", "basis_before", "basis_after"}


def canonical(value):
    """Compare JSON values without losing type distinctions or list ordering."""
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(",", ":"), allow_nan=False)


def _unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON property in the reviewed input")
        result[key] = value
    return result


def _reject_constant(value):
    raise ValueError("Non-finite JSON number in the reviewed input")


def _require_pin(value, label):
    if not isinstance(value, str) or re.fullmatch(r"[a-f0-9]{64}", value) is None:
        raise ValueError(label + " has not been frozen")


def load_private_input():
    _require_pin(PRIVATE_INPUT_SHA256, "Private input SHA-256")
    _require_pin(BASE_SHA256, "Verified predecessor SHA-256")
    location = os.environ.get("GC500_FENCING_EVIDENCE_INPUT")
    if not location:
        raise ValueError("GC500_FENCING_EVIDENCE_INPUT must name the reviewed private JSON")
    path = Path(location).resolve(strict=True)
    if not path.is_file():
        raise ValueError("Private evidence input must be a file")
    if any((parent / ".git").exists() for parent in path.parents):
        raise ValueError("Private evidence input must stay outside Git checkouts")
    if path.is_relative_to(HERE.parents[1]):
        raise ValueError("Private evidence input must stay outside the source checkout")
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != PRIVATE_INPUT_SHA256:
        raise ValueError("Private evidence input SHA-256 mismatch")
    data = json.loads(raw, object_pairs_hook=_unique_pairs, parse_constant=_reject_constant)
    if not isinstance(data, dict) or type(data.get("schema")) is not int or data["schema"] != 1:
        raise ValueError("Private evidence input schema mismatch")
    if data.get("source_sha256") != BASE_SHA256:
        raise ValueError("Private evidence input names a different predecessor")
    if not isinstance(data.get("rows"), list) or not data["rows"]:
        raise ValueError("Private evidence input has no reviewed catalogue rows")
    return data


def patch_catalogue(catalogue, corrections):
    """Apply only explicitly reviewed expected/basis pairs to existing rows."""
    if not isinstance(catalogue, dict) or catalogue.get("schema") != 1:
        raise ValueError("Unexpected fencing catalogue schema")
    rows = catalogue.get("rows")
    if not isinstance(rows, list) or not isinstance(corrections, list) or not corrections:
        raise ValueError("Reviewed catalogue rows are missing")
    result = copy.deepcopy(catalogue)
    seen = set()
    for correction in corrections:
        if not isinstance(correction, dict) or set(correction) != ROW_FIELDS:
            raise ValueError("Unexpected reviewed catalogue correction fields")
        record_id = correction["record_id"]
        if not isinstance(record_id, str) or not record_id.strip() or record_id in seen:
            raise ValueError("Reviewed catalogue identity is empty or duplicated")
        seen.add(record_id)
        matches = [r for r in result["rows"] if r.get("record_id") == record_id]
        if len(matches) != 1:
            raise ValueError("Reviewed catalogue identity is missing or duplicated")
        row = matches[0]
        before, after = correction["before"], correction["after"]
        if any(not isinstance(value, dict) or set(value) != EXPECTED_FIELDS
               for value in (before, after)):
            raise ValueError("Reviewed expected snapshot fields changed")
        if before["id"] != record_id or after["id"] != record_id:
            raise ValueError("Reviewed expected snapshot names another record")
        if row.get("docket_no") != before["docket_no"]:
            raise ValueError("Reviewed docket identity does not match the catalogue")
        if any(canonical(before[key]) != canonical(after[key]) for key in IDENTITY_FIELDS):
            raise ValueError("Identity, date, work week or source cannot change in this patch")
        if row.get("attribution") is not None:
            raise ValueError("Forecast-attribution rows are outside this correction scope")
        if canonical(row.get("expected")) != canonical(before):
            raise ValueError("Catalogue expected snapshot differs from the reviewed before state")
        if row.get("basis") != correction["basis_before"]:
            raise ValueError("Catalogue basis differs from the reviewed before state")
        if any(not isinstance(correction[key], str) or not correction[key].strip()
               for key in ("basis_before", "basis_after")):
            raise ValueError("Reviewed catalogue basis must be explicit and nonempty")
        if canonical(before) == canonical(after) and correction["basis_before"] == correction["basis_after"]:
            raise ValueError("Reviewed catalogue correction has no change")
        row["expected"] = copy.deepcopy(after)
        row["basis"] = correction["basis_after"]

    # Undo just the permitted fields and prove everything else is identical.
    restored = copy.deepcopy(result)
    for correction in corrections:
        row = next(r for r in restored["rows"] if r["record_id"] == correction["record_id"])
        row["expected"] = copy.deepcopy(correction["before"])
        row["basis"] = correction["basis_before"]
    if canonical(restored) != canonical(catalogue):
        raise ValueError("Unreviewed catalogue content changed")
    return result


def patch(text, path="page.html"):
    if MARKER in text:
        raise ValueError("v10.93 already applied")
    _require_pin(BASE_SHA256, "Verified predecessor SHA-256")
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError("Exact verified v10.92 predecessor required")
    private = load_private_input()
    declaration = "const FENCE_PROGRAMME958 = "
    if text.count(declaration) != 1:
        raise ValueError("Fencing programme catalogue is missing or duplicated")
    start = text.index(declaration) + len(declaration)
    catalogue, end = json.JSONDecoder().raw_decode(text, start)
    if text[end:end + 1] != ";":
        raise ValueError("Fencing programme catalogue declaration changed")
    updated = patch_catalogue(catalogue, private["rows"])
    encoded = json.dumps(updated, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    encoded = encoded.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    encoded = encoded.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    new_declaration = (
        "/* Author: Andrew Fisher. " + MARKER + ". */\n"
        + declaration + encoded + ";"
    )
    # Catalogue replacement uses the exact parsed span. Apply the shared helper
    # to the isolated version token so its whitespace tolerance cannot consume
    # a neighbouring space from the source page.
    text = text[:start - len(declaration)] + new_declaration + text[end + 1:]
    old_footer = "' · " + BASE_VERSION + "'"
    if text.count(old_footer) != 1:
        raise ValueError("Release footer is missing or duplicated")
    new_footer = rep(old_footer, old_footer, "' · v10.93'",
                     "release version", path)
    text = text.replace(old_footer, new_footer, 1)
    return text


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path, nargs="?")
    args = parser.parse_args()
    result = patch(args.input.read_text(), str(args.input))
    output = args.output or args.input
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(result)
    print(json.dumps({
        "sha256": hashlib.sha256(result.encode()).hexdigest(),
        "bytes": len(result.encode()),
    }))
