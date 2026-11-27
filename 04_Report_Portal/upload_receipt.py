"""Capture a successful upload on the report file that was published for it."""
import base64
import json
import math
from pathlib import Path
import re

# The stamp is placed immediately after the doctype, before large fonts/data.
# Only the uploader and timestamp are exposed in the browser edition.
HEADER_BYTES = 8192
STAMP = re.compile(rb'<!--mmg-upload-receipt-v1 ([A-Za-z0-9+/=]+)-->')
DOCTYPE = re.compile(rb'\A(\s*<!doctype\s+html\s*>)', re.I)


def _receipt(raw):
    if not isinstance(raw, dict):
        return None
    finished = raw.get("finished")
    if (type(finished) not in (int, float) or not 0 < finished < 253402260000
            or not math.isfinite(finished)):
        return None
    name = raw.get("name")
    name = name.strip() if isinstance(name, str) and name.isprintable() and len(name) <= 256 else ""
    files = raw.get("files")
    files = {k:v for k,v in files.items() if isinstance(k,str) and isinstance(v,str)} if isinstance(files,dict) else {}
    return {"name":name or None, "finished":finished, "files":files, "batch":raw.get("batch")}


def legacy(status):
    if not isinstance(status, dict):
        return None
    if "last_upload" in status:
        return _receipt(status["last_upload"])
    # Old upload files recorded completion time but not the operator. A rebuild
    # with no new exports, a pending batch, and a failure are not uploads.
    if status.get("state") == "ok" and status.get("files"):
        return _receipt({"finished":status.get("finished"), "files":status["files"]})
    return None


def resolve(head, volume, status=None):
    mark = STAMP.search(head)
    if mark:
        try:
            return _receipt(json.loads(base64.b64decode(mark[1],validate=True)))
        except (ValueError, UnicodeError):
            return None
    if status is None:
        try:
            status = json.loads((Path(volume)/"upload_status.json").read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return None
    return legacy(status)


def published(volume, status=None):
    try:
        with (Path(volume)/"report.html").open("rb") as f:
            return resolve(f.read(HEADER_BYTES), volume, status)
    except FileNotFoundError:
        return legacy(status)


def stamp(path, receipt):
    html = path.read_bytes()
    encoded = base64.b64encode(json.dumps(receipt, ensure_ascii=False, separators=(",",":")).encode())
    marker = b"<!--mmg-upload-receipt-v1 " + encoded + b"-->"
    pos = DOCTYPE.match(html)
    pos = pos.end() if pos else 0
    if pos + len(marker) > HEADER_BYTES:
        raise ValueError("Upload receipt is too large for the report header.")
    path.write_bytes(html[:pos] + marker + html[pos:])
