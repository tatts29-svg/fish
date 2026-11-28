"""Immutable MMG SWMS pairs and their manager review on the persistent volume."""
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import io
import os
from pathlib import Path
import re
import sqlite3
from xml.etree import ElementTree
import zipfile
import zlib

from upload_policy import uploaders

MIB = 1024 * 1024
MAX_FILE = 16 * MIB
MAX_BUNDLE = 2 * MAX_FILE + 65536
FORMATS = {
    "pdf": ("application/pdf", "inline"),
    "docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "attachment"),
}
FINGERPRINT = re.compile(r"[0-9a-f]{64}")
WORD_MAIN = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
VERSION_FIELDS = "version, reviewed_by, reviewed_at"
ZIP_METHODS = {zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED}


class SwmsError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def check_pdf(data):
    # Check the version and the final cross-reference offset (including PDF xref streams).
    trailer = re.search(rb"startxref\s+([0-9]{1,12})\s+%%EOF\s*\Z", data[-1024:])
    if not re.match(rb"%PDF-(?:1\.[0-7]|2\.0)\s", data) or not trailer:
        raise SwmsError("The PDF header or trailer is invalid.")
    offset = int(trailer[1])
    if not re.match(rb"(?:xref\b|\d+\s+\d+\s+obj\b)", data[offset:offset + 80]):
        raise SwmsError("The PDF cross-reference table is missing.")


def _check_docx(data):
    with zipfile.ZipFile(io.BytesIO(data)) as docx:
        parts = docx.infolist()
        names = {entry.filename for entry in parts}
        if (len(parts) > 2048 or len(parts) != len(names)
                or any(entry.compress_type not in ZIP_METHODS for entry in parts)
                or sum(entry.file_size for entry in parts) > 80 * MIB):
            raise SwmsError("The Word document exceeds the allowed package size.")
        for name in ("[Content_Types].xml", "_rels/.rels", "word/document.xml"):
            if name not in names or docx.getinfo(name).file_size > 6 * MIB:
                raise SwmsError("A required Word document part is invalid.")
        types = ElementTree.fromstring(docx.read("[Content_Types].xml"))
        rels = ElementTree.fromstring(docx.read("_rels/.rels"))
        document = ElementTree.fromstring(docx.read("word/document.xml"))
        office_types = {"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
                        "http://purl.oclc.org/ooxml/officeDocument/relationships/officeDocument"}
        word_namespaces = ("http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                           "http://purl.oclc.org/ooxml/wordprocessingml/main")
        if not (any(part.get("PartName") == "/word/document.xml" and part.get("ContentType") == WORD_MAIN
                    for part in types)
                and any(rel.get("Type") in office_types and rel.get("Target", "").lstrip("/") == "word/document.xml"
                        and rel.get("TargetMode", "Internal") == "Internal" for rel in rels)
                and any(document.tag == f"{{{ns}}}document" and document.find(f"{{{ns}}}body") is not None
                        for ns in word_namespaces)):
            raise SwmsError("Use a Word .docx document.")
        if docx.testzip() is not None:
            raise SwmsError("The Word document is damaged.")


def _connect(data_dir):
    root = Path(data_dir)
    root.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(root / "mmg-swms.sqlite3", timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("""CREATE TABLE IF NOT EXISTS swms_versions (
        id INTEGER PRIMARY KEY, version TEXT NOT NULL UNIQUE, pdf BLOB NOT NULL, docx BLOB NOT NULL,
        reviewed_by TEXT, reviewed_account TEXT, reviewed_at TEXT)""")
    return conn


def publish(data_dir, bundle):
    if len(bundle) > MAX_BUNDLE:
        raise SwmsError("The SWMS bundle is too large.", 413)
    try:
        with zipfile.ZipFile(io.BytesIO(bundle)) as files:
            parts = files.infolist()
            if len(parts) != 2 or {p.filename for p in parts} != {"swms.pdf", "swms.docx"}:
                raise SwmsError("Include exactly swms.pdf and swms.docx at the root of the ZIP.")
            if any(p.compress_type not in ZIP_METHODS for p in parts):
                raise SwmsError("Use a standard stored or deflated ZIP.")
            if any(not 0 < p.file_size <= MAX_FILE for p in parts):
                raise SwmsError("Each document must be between 1 byte and 16 MiB.", 413)
            pdf, docx = files.read("swms.pdf"), files.read("swms.docx")
        check_pdf(pdf)
        _check_docx(docx)
    except (zipfile.BadZipFile, EOFError, RuntimeError, ElementTree.ParseError, LookupError, zlib.error) as exc:
        raise SwmsError("The SWMS ZIP or Word document is damaged or unsupported.") from exc
    version = hashlib.sha256(hashlib.sha256(pdf).digest() + hashlib.sha256(docx).digest()).hexdigest()
    with closing(_connect(data_dir)) as conn, conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute("INSERT INTO swms_versions(version, pdf, docx) VALUES(?, ?, ?) ON CONFLICT(version) DO NOTHING",
                     (version, pdf, docx))
        if conn.execute("SELECT version FROM swms_versions ORDER BY id DESC LIMIT 1").fetchone()[0] != version:
            raise SwmsError("This pair was superseded by a later publication.", 409)
    return version


def current_status(data_dir):
    with closing(_connect(data_dir)) as conn:
        rec = conn.execute(f"SELECT {VERSION_FIELDS} FROM swms_versions ORDER BY id DESC LIMIT 1").fetchone()
        return dict(rec) if rec else {"version": None, "reviewed_by": None, "reviewed_at": None}


def document(data_dir, ext, version, headers_only=False):
    if ext not in FORMATS or (version is not None and not FINGERPRINT.fullmatch(version)):
        raise SwmsError("Document version not found.", 404)
    # Both selects return a single committed version. A HEAD never loads the document BLOB.
    value = f"length({ext})" if headers_only else ext
    where, params = ("WHERE version = ?", (version,)) if version is not None else ("ORDER BY id DESC LIMIT 1", ())
    with closing(_connect(data_dir)) as conn:
        row = conn.execute(f"SELECT version, {value} FROM swms_versions {where}", params).fetchone()
        if row is None:
            raise SwmsError("The requested SWMS has not been published.", 404)
        return row[0], row[1]


def manager_identity(job):
    account = os.environ.get("MANAGER_USERNAME", "").strip().lower()
    configured = " ".join(os.environ.get("MANAGER_DISPLAY_NAME", "").split())
    if configured and account:
        return account, configured
    local = re.sub(r"[^\w]", "", account.partition("@")[0].replace("_", "")).casefold()
    names = [name for name in uploaders(job) if re.sub(r"[^\w]", "", name.replace("_", "")).casefold() == local]
    return (account, names[0]) if len(names) == 1 else None


def review(data_dir, payload, identity):
    if not identity:
        raise SwmsError("Set the manager display name before recording a review.", 409)
    if (not isinstance(payload, dict) or set(payload) != {"version", "acknowledged"}
            or not isinstance(payload.get("version"), str) or not FINGERPRINT.fullmatch(payload["version"])
            or payload["acknowledged"] is not True):
        raise SwmsError("Acknowledge the review of the displayed document version.")
    with closing(_connect(data_dir)) as conn, conn:
        conn.execute("BEGIN IMMEDIATE")
        row = conn.execute(f"SELECT {VERSION_FIELDS} FROM swms_versions ORDER BY id DESC LIMIT 1").fetchone()
        if not row or payload["version"] != row["version"]:
            raise SwmsError("The current SWMS has changed. Open the latest documents before recording a review.", 409)
        if row["reviewed_at"]:
            return dict(row)
        account, name = identity
        stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
        conn.execute("UPDATE swms_versions SET reviewed_by=?, reviewed_account=?, reviewed_at=? WHERE version=?",
                     (name, account, stamp, row["version"]))
        return {"version": row["version"], "reviewed_by": name, "reviewed_at": stamp}
