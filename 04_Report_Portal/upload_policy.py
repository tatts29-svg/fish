"""Identity checks for the MMG Dugald River stock-upload workflow."""
import json
import os
from pathlib import Path

# SiteIQ's schedule name includes this spelling. Compare the full field.
MMG_SCHEDULE = "MMG Shutdown Novermber26-December26"
MMG_PROJECT = "MMG Dugald River Mine"


def uploaders(job):
    try:
        with (Path(job) / "kit/contacts.json").open(encoding="utf-8-sig") as contacts:
            names = [str(row.get("name") or "").strip() for row in json.load(contacts)]
    except (OSError, ValueError, TypeError, AttributeError):
        return []
    return list(dict.fromkeys(name for name in names if len(name.split()) >= 2))


def is_mmg_pack(job):
    try:
        settings = dict(line.split(":", 1) for line in (Path(job) / "kit/JOB.txt").read_text(
            encoding="utf-8-sig").splitlines() if ":" in line and not line.lstrip().startswith("#"))
    except (OSError, UnicodeError):
        return False
    return (settings.get("customer", "").strip().upper() == "MMG"
            and "dugald river" in settings.get("location", "").casefold())


def is_mmg(job):
    return (os.environ.get("RAILWAY_PROJECT_NAME") == "mmg-dugald-river-portal"
            or is_mmg_pack(job))


def check_workbook(source):
    """Require every reference row to identify this exact schedule and, when supplied, project."""
    from openpyxl import load_workbook
    normalize = lambda value: " ".join(str(value or "").casefold().split())
    error = "Choose an MMG Dugald River SiteIQ export. Its project schedule could not be verified."
    try:
        book = load_workbook(source, read_only=True, data_only=True, keep_links=False)
        try:
            sheet = book["REFERENCE_INFO"]
            sheet.reset_dimensions()
            rows = sheet.values
            fields = [normalize(value).replace("_", " ") for value in next(rows)]
            if fields.count("project schedule") != 1 or fields.count("project") > 1:
                raise ValueError(error)
            sched = fields.index("project schedule")
            project = fields.index("project") if "project" in fields else None
            found = False
            for row in rows:
                if not any(row):
                    continue
                if normalize(row[sched]) != normalize(MMG_SCHEDULE):
                    raise ValueError(error)
                if project is not None and normalize(row[project]) != normalize(MMG_PROJECT):
                    raise ValueError(error)
                found = True
            if not found:
                raise ValueError(error)
        finally:
            book.close()
    except Exception as exc:
        raise ValueError(error) from exc
