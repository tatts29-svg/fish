"""Import past MMG Dugald River SiteIQ exports as anonymous shutdown aggregates."""
from datetime import date, datetime, time, timedelta
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

from openpyxl import load_workbook

from build_onhire_workbook import read_aliases
from consumable_usage import JOB, shut_key, summarise_rows
from stocktake_store import QUEENSLAND, published_report
from upload_policy import MMG_SCHEDULE
from utilisation import archived_average, stamp
from variant_history import requested_time

HIRE_FILE = "hire-interval-history.json"
SALES_FILE = "consumable_usage_history.json"
# Both verified October exports have a generic schedule and no project field.
# The hire totals match the MMG job archive. Every sales row names the MMG owner.
VERIFIED_FILES = {
    "f1be9f8e90a7704cf7ef133780f7238906dc1b1f4269eb3a2ebeb5dd50930f34": "september shutdown 2025",
    "a0d0f7d315a2bb6efe2844dc8b448f742c59bb068ef1360a47286157ed83d2ff": "september shutdown 2025",
}
# This project-less schedule was independently reconciled to MMG equipment and
# the job's archive. A fresh export with the same genuine schedule is supported.
KNOWN_SCHEDULES = {"mmg shutdown july 2026": (date(2026, 7, 1), date(2026, 7, 31))}
SITE_NAMES = {"mmg dugald river", "mmg dugald river mine", "dugald river", "dugald river mine"}
HIRES = {"TRANSACTION_CHARGES", "TRANSACTION_WITHOUT_CHARGES", "CUSTOMER_CONTRACTOR_EQUIP"}


def normal(value):
    return " ".join(str(value or "").casefold().split())


def options(query):
    if set(query) != {"label", "start", "end", "complete"} or any(len(v) != 1 for v in query.values()):
        raise ValueError("Choose the historical month, first and last operating dates and completion status.")
    label, first, last, complete = (query[k][0].strip() for k in ("label", "start", "end", "complete"))
    try:
        start, end = date.fromisoformat(first), date.fromisoformat(last)
        if start > end or start.isoformat() != first or end.isoformat() != last or complete not in ("0", "1"):
            raise ValueError
        # Keep a single canonical archive label for a month instead of creating
        # duplicates through spelling, whitespace or different capitalisation.
        if label.casefold() not in (start.strftime("%b %Y").casefold(), start.strftime("%B %Y").casefold()):
            raise ValueError
    except ValueError as exc:
        raise ValueError("The month must match the first operating date. Use valid inclusive dates.") from exc
    return start.strftime("%b %Y"), start, end, complete == "1"


def current_period(data_dir):
    try:
        record = published_report(Path(data_dir) / "report.html")["stocktake"]
        if record["schedule"] != MMG_SCHEDULE:
            raise ValueError
        return date.fromisoformat(record["arrival"])
    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise ValueError("The published MMG shutdown dates are needed to verify an earlier shutdown.") from exc


def identify(book, digest, first, last):
    if "REFERENCE_INFO" not in book.sheetnames:
        raise ValueError("Choose a SiteIQ workbook with project and export details.")
    rows = iter(book["REFERENCE_INFO"].values)
    headings = [normal(v).replace("_", " ") for v in next(rows, ())]
    if headings.count("project schedule") != 1 or headings.count("project") > 1:
        raise ValueError("The workbook must identify one project schedule.")
    refs = [dict(zip(headings, values)) for values in rows if any(values)]
    if not refs or any(len({normal(ref.get(field)) for ref in refs}) > 1
                       for field in ("project schedule", "report period", "requested date/time (local time)")):
        raise ValueError("The workbook contains missing or conflicting project schedules.")
    schedule = str(refs[0]["project schedule"] or "").strip()
    key = normal(schedule)
    if not key or key == normal(MMG_SCHEDULE):
        raise ValueError("Use an export from a previous MMG Dugald River shutdown.")
    for ref in refs:
        project = normal(ref.get("project"))
        if project and project not in SITE_NAMES:
            raise ValueError("This workbook identifies another site.")
        known = KNOWN_SCHEDULES.get(key)
        if VERIFIED_FILES.get(digest) == "september shutdown 2025":
            known = date(2025, 10, 15), date(2025, 10, 18)
        if known and not (known[0] <= first <= last <= known[1]):
            raise ValueError("Choose dates within the shutdown named in the workbook.")
        if not (project in SITE_NAMES or known or VERIFIED_FILES.get(digest) == key
                or re.search(r"\bmmg\b.*\bdugald river\b|\bdugald river\b.*\bmmg\b", key)):
            raise ValueError("The workbook does not identify a verified MMG Dugald River shutdown.")
    names = set(book.sheetnames)
    has_sales, has_hires = "SALES_STOCK" in names, bool(names & HIRES)
    if has_sales == has_hires or names & {"ON_HIRE", "STOCKTAKE", "RENTAL_STOCK"}:
        raise ValueError("Choose one historical SALES_STOCK or TRANSACTIONS export.")
    return schedule, "SALES_STOCK" if has_sales else "TRANSACTIONS"


def sales_snapshot(book, label, schedule, first, last, start, end, pulled, complete):
    if complete and pulled < end:
        raise ValueError("This export predates the end of the selected shutdown. Record it as partial.")
    rows = iter(book["SALES_STOCK"].values)
    headers = [str(v or "").strip().upper() for v in next(rows, ())]
    if not {"SKU_NUMBER", "SALES_QUANTITY", "RETURN_QUANTITY", "SALES_DATE", "SALES_TIME"} <= set(headers):
        raise ValueError("The sales export needs dated movements and issued and credited quantities.")
    selected = []
    seen_movements = included_movements = 0
    for values in rows:
        row = dict(zip(headers, values))
        if not any(values):
            continue
        activity = any(str(row.get(k) or "").strip() for k in ("COMPANY_NAME", "HIRER", "RETURN_REASON", "SALES_DATE", "SALES_TIME"))
        for key in ("SALES_QUANTITY", "RETURN_QUANTITY"):
            try:
                activity = activity or float(row.get(key) or 0) != 0
            except (TypeError, ValueError):
                activity = True
        if activity:
            seen_movements += 1
            moment = stamp(row.get("SALES_DATE"), row.get("SALES_TIME"))
            if not moment or moment > pulled + timedelta(minutes=1):
                raise ValueError("A sales movement has an incomplete or inconsistent local timestamp.")
            if moment < start or moment > end:
                if complete:
                    raise ValueError("The export includes sales outside the selected dates. Check the shutdown window.")
                continue
            included_movements += 1
        selected.append(row)
    if seen_movements and not included_movements:
        raise ValueError("The selected dates contain none of this workbook's sales movements.")
    summaries = summarise_rows(selected)
    if not summaries:
        raise ValueError("No identifiable sales stock lines fall within these dates.")
    return {"id": shut_key(label), "label": label, "schedule": schedule, "source": "SiteIQ SALES_STOCK",
            "start": first.isoformat(), "end": last.isoformat(), "as_at": pulled.isoformat(),
            "status": "complete" if complete else "partial",
            "rows": [{k: r[k] for k in ("sku", "unit", "issued", "credited", "net")} for r in summaries]}


def store(path, kind, entry):
    key = "shuts" if kind == "SALES_STOCK" else "periods"
    archive = {"job": JOB, key: []}
    if key == "periods":
        archive["schema"] = 1
    if path.exists():
        archive = json.loads(path.read_text(encoding="utf-8"))
        if (not isinstance(archive, dict) or archive.get("job") != JOB or not isinstance(archive.get(key), list)
                or (key == "periods" and archive.get("schema") != 1)):
            raise ValueError("The existing history could not be verified. No changes were saved.")
    for i, old in enumerate(archive[key]):
        if old["label"] != entry["label"] and normal(old["schedule"]) != normal(entry["schedule"]):
            continue
        if old["label"] != entry["label"] or normal(old["schedule"]) != normal(entry["schedule"]):
            raise ValueError("That month or schedule is already recorded under a different shutdown.")
        if old == entry:
            return False
        if entry["start"] > old["start"] or entry["end"] < old["end"]:
            raise ValueError("A wider or different period is already recorded for this shutdown.")
        if (entry["as_at"] < old["as_at"] or (old.get("status") == "complete" and entry.get("status") != "complete")
                or (old.get("quality") == "recorded" and entry.get("quality") == "partial")):
            raise ValueError("A newer or more complete record is already stored.")
        if (entry["as_at"] == old["as_at"] and entry["start"] == old["start"] and entry["end"] == old["end"]
                and not (entry.get("status") == "complete" and old.get("status") == "partial"
                         and entry.get("rows") == old.get("rows"))):
            raise ValueError("This export disagrees with the saved figures for the same pull.")
        archive[key][i] = entry
        break
    else:
        archive[key].append(entry)
    archive[key].sort(key=lambda value: value["start"])
    write_archive(path, archive)
    return True


def write_archive(path, archive):
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".shutdown-history-", mode="w", encoding="utf-8", delete=False) as tmp:
        tmpname = tmp.name
        try:
            json.dump(archive, tmp, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
            tmp.flush()
            os.fsync(tmp.fileno())
        except BaseException:
            os.unlink(tmpname)
            raise
    try:
        os.replace(tmpname, path)
    finally:
        Path(tmpname).unlink(missing_ok=True)


def import_workbook(job_dir, data_dir, path, query):
    label, first, last, complete = options(query)
    if last >= current_period(data_dir):
        raise ValueError("The last operating date must precede the current shutdown.")
    start = datetime.combine(first, time(5))
    end = datetime.combine(last + timedelta(days=1), time(5)) - timedelta(seconds=1)
    digest = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    book = load_workbook(path, read_only=True, data_only=True, keep_links=False)
    try:
        schedule, kind = identify(book, digest, first, last)
        pulled = requested_time(book)
        if pulled > datetime.now(QUEENSLAND).replace(tzinfo=None):
            raise ValueError("The export has a future SiteIQ pull time.")
        if pulled < start:
            raise ValueError("The export was pulled before this shutdown window.")
        if kind == "SALES_STOCK":
            entry = sales_snapshot(book, label, schedule, first, last, start, end, pulled, complete)
    finally:
        book.close()
    if kind == "TRANSACTIONS":
        if complete:
            raise ValueError("Completion confirmation applies to SALES_STOCK exports only.")
        kit = str(Path(job_dir) / "kit")
        aliases = {"MMG AUSTRALIA LIMITED": "MMG", **read_aliases(kit, "COMPANY_ALIASES.txt")}
        owners = read_aliases(kit, "OWNER_ALIASES.txt")
        def display_owner(raw):
            corrected = owners.get(raw.upper(), raw)
            return aliases.get(corrected.upper(), corrected)
        note = ""
        days = (last - first).days + 1
        if normal(schedule) == "mmg shutdown july 2026" and days < 11:
            note = f"This comparison covers {days} of the 11 operating days in the July archive."
        elif digest in VERIFIED_FILES and (first, last) != (date(2025, 10, 15), date(2025, 10, 17)):
            note = "The selected dates differ from the three operating days verified in the October archive."
        entry = archived_average(path, label, start, end, expected_schedule=schedule, owner_label=display_owner, coverage_note=note)
        if entry.get("quality") == "unavailable":
            raise ValueError("No measured rental intervals were found for the selected dates.")
        entry.update(schedule=schedule, source="SiteIQ TRANSACTIONS", as_at=pulled.isoformat())
    changed = store(Path(data_dir) / (SALES_FILE if kind == "SALES_STOCK" else HIRE_FILE), kind, entry)
    return {"kind": kind, "label": label, "start": entry["start"], "end": entry["end"], "changed": changed,
            "status": entry.get("status") or entry["quality"], "as_at": entry["as_at"]}
