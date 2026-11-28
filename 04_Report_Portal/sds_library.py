"""Install a manager-supplied MMG document set and publish its index last."""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile

from upload_policy import MMG_PROJECT

PDF_NAME = re.compile(r"[a-z0-9][a-z0-9-]{0,90}-([0-9a-f]{12})\.pdf")
MAX_BUNDLE = 48 * 1024 * 1024


def install(body, data_dir):
    root = Path(data_dir) / "sds"
    pdfs = root / "pdfs"
    pdfs.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(body)) as archive, tempfile.TemporaryDirectory(dir=root) as tmp:
        files = archive.infolist()
        if len(files) > 1000 or sum(f.file_size for f in files) > MAX_BUNDLE:
            raise ValueError("The document library is too large.")
        names = {f.filename for f in files}
        if len(names) != len(files) or "register.json" not in names:
            raise ValueError("A single MMG register index is required.")
        index_bytes = archive.read("register.json")
        index = json.loads(index_bytes)
        if not isinstance(index, dict) or index.get("project") != MMG_PROJECT or not isinstance(index.get("entries"), dict) or not index["entries"]:
            raise ValueError("Choose a document register for MMG Dugald River.")
        required = {"register.json"}
        for row in index["entries"].values():
            if not isinstance(row, dict):
                raise ValueError("Invalid product record.")
            name = row.get("file")
            if not name:
                continue
            if not isinstance(name, str) or not PDF_NAME.fullmatch(name):
                raise ValueError("Invalid document filename.")
            required.add("pdfs/" + name)
        if required != names:
            raise ValueError("Include the PDFs referenced by the register and its index.")
        for entry in sorted(required - {"register.json"}):
            name = entry.split("/")[1]
            data = archive.read(entry)
            if not data.startswith(b"%PDF-") or hashlib.sha256(data).hexdigest()[:12] != PDF_NAME.fullmatch(name)[1]:
                raise ValueError("A document does not match its PDF fingerprint.")
            (Path(tmp) / name).write_bytes(data)
        # Existing report tabs may still reference the previous version of a sheet.
        for doc in Path(tmp).iterdir():
            os.replace(doc, pdfs / doc.name)
        staged_index = Path(tmp) / "register.json"
        staged_index.write_bytes(index_bytes)
        os.replace(staged_index, root / "register.json")
        return len(required) - 1


LABEL_CHECK_NAME = "sds-label-check.zip"


def install_label_check(body, data_dir):
    """Publish a checked staff download separately from the verified register."""
    import stat
    import zlib
    from swms_store import check_pdf

    if len(body) > MAX_BUNDLE:
        raise ValueError("The supplier pack exceeds 48 MiB.")
    try:
        with zipfile.ZipFile(io.BytesIO(body)) as archive:
            entries = archive.infolist()
            if len(entries) > 256 or sum(e.file_size for e in entries) > MAX_BUNDLE:
                raise ValueError("The supplier pack exceeds its size limit.")
            files, paths = 0, set()
            for e in entries:
                name = e.filename.removesuffix("/")
                parts = name.split("/")
                if (not name or len(name) > 240 or e.orig_filename != e.filename or name.casefold() in paths
                        or any(not p or p.startswith(".") or p.endswith((".", " "))
                               or re.search(r'[<>:"\\|?*\x00-\x1f\x7f]', p)
                               or re.fullmatch(r"(?i)(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?", p)
                               for p in parts)
                        or e.flag_bits & 1 or e.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
                        or stat.S_IFMT(e.external_attr >> 16) not in (0, stat.S_IFREG, stat.S_IFDIR)):
                    raise ValueError("Choose a PDF-only ZIP with normal relative filenames.")
                paths.add(name.casefold())
                if e.is_dir() and not e.file_size:
                    continue
                if not name.lower().endswith(".pdf") or not 0 < e.file_size <= 16 * 1024 * 1024:
                    raise ValueError("Include only PDF files of up to 16 MiB each.")
                check_pdf(archive.read(e))
                files += 1
            if not files:
                raise ValueError("Include at least one PDF.")
    except (zipfile.BadZipFile, EOFError, RuntimeError, zlib.error) as exc:
        raise ValueError("The supplier pack is damaged or unsupported.") from exc
    root = Path(data_dir)
    root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=root) as tmp:
        staging = Path(tmp) / LABEL_CHECK_NAME
        staging.write_bytes(body)
        os.replace(staging, root / LABEL_CHECK_NAME)
    return files
