"""Import past MMG Dugald River SiteIQ exports as anonymous shutdown aggregates."""
from collections import Counter
from datetime import date, datetime, time, timedelta
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

from openpyxl import load_workbook

from build_onhire_workbook import read_aliases
from consumable_usage import JOB, quantity, shut_key, summarise_rows, transaction_observations
from stocktake_store import QUEENSLAND, published_report
from upload_policy import MMG_SCHEDULE
from utilisation import archived_average, stamp
from variant_history import requested_time

HIRE_FILE = "hire-interval-history.json"
SALES_FILE = "consumable_usage_history.json"
OCTOBER_2025_EARLY_PULLS = {
    "f1be9f8e90a7704cf7ef133780f7238906dc1b1f4269eb3a2ebeb5dd50930f34",
    "a0d0f7d315a2bb6efe2844dc8b448f742c59bb068ef1360a47286157ed83d2ff",
}
# These original exports lack a PROJECT field. Schedules, tool-store locations,
# hirers, employers and operating dates were checked against the Dugald River archive.
# Matching a generic schedule name alone does not establish a site identity.
VERIFIED_FILES = {
    "80c5b68d791906123de0fa09f02466ecb7134a5a633309ecb05820ef09a44cea": "april - shutdown 2024",
    "ae63af07136bfbfb65a1d79a77f55e6ada684d5ec751c949b9566b08b845f3e8": "outm2402 december shutdown 2024",
    "f807d602958fa2b0250c7e3226dd300e129fb91905e4e5bf6e8fab8c742dc26a": "may shutdown 2025",
    "ff9ad11d3616bcbdc27b07fcbd9784a53527e6d3c2967a0b757c87f74a88dd32": "mmg shutdown 2026 february-march",
    **dict.fromkeys(OCTOBER_2025_EARLY_PULLS, "september shutdown 2025"),
    "e7e965a5b8432a27b3e13c207c77b8de9014dfe4281201cb5a2e8ea762d4b420": "outm2103 april 2022 shutdown",
    "424da9540ee62eb14ddd296a15589d1aed9b3593baf23e29ca81644e88ba53ef": "outm2103 - october 2022 shutdown",
    "419edd314565e9a7400e166f3254336e90b2b2283d22dfe5abe2f75642af8aea": "outm2303 - june shutdown 2023",
    "c42a120346363166891c638f6df533370713f284ea889a7dd2fd8e565cd2e0ef": "outm2402 december shutdown 2024",
    "7bb3a831834e52e8babd6bb6ba451f276135b760da7dbfe6a1674912568b02f9": "may shutdown 2025",
    "9fbd4826b728cd52dba7ae65e62a427946ce102aa9b35d8a4d196f53d94f1feb": "september shutdown 2025",
}
# This project-less schedule was independently reconciled to MMG equipment and
# the job's archive. A fresh export with the same genuine schedule is supported.
KNOWN_SCHEDULES = {"mmg shutdown july 2026": (date(2026, 7, 1), date(2026, 7, 31))}
# Scope the denominator to verified operating dates. May includes mobilisation
# on the roster; July includes a further dated hire on the 20th in the later pull.
OPERATING_WINDOWS = {
    "april - shutdown 2024": ("Apr 2024", date(2024, 4, 8), date(2024, 4, 14)),
    "outm2402 december shutdown 2024": ("Dec 2024", date(2024, 12, 11), date(2024, 12, 15)),
    "may shutdown 2025": ("May 2025", date(2025, 4, 27), date(2025, 5, 7)),
    "september shutdown 2025": ("Oct 2025", date(2025, 10, 15), date(2025, 10, 17)),
    "mmg shutdown 2026 february-march": ("Feb 2026", date(2026, 2, 25), date(2026, 3, 3)),
    "mmg shutdown july 2026": ("Jul 2026", date(2026, 7, 9), date(2026, 7, 20)),
}
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
        # A shutdown can start in April and be recorded by the site as May.
        # Require the label to match the identified schedule below.
        for pattern in ("%b %Y", "%B %Y"):
            try:
                month = datetime.strptime(label, pattern).strftime("%b %Y")
                break
            except ValueError:
                continue
        else:
            raise ValueError
    except ValueError as exc:
        raise ValueError("Enter a shutdown month and valid inclusive dates.") from exc
    return month, start, end, complete == "1"


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
        if digest in OCTOBER_2025_EARLY_PULLS:
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
    issue_entries = Counter()
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
            if (quantity(row.get("SALES_QUANTITY")) or 0) > 0:
                issue_entries[str(row.get("SKU_NUMBER") or "").strip()] += 1
        selected.append(row)
    if seen_movements and not included_movements:
        raise ValueError("The selected dates contain none of this workbook's sales movements.")
    summaries = summarise_rows(selected)
    if not summaries:
        raise ValueError("No identifiable sales stock lines fall within these dates.")
    return {"id": shut_key(label), "label": label, "schedule": schedule, "source": "SiteIQ SALES_STOCK",
            "start": first.isoformat(), "end": last.isoformat(), "as_at": pulled.isoformat(),
            "status": "complete" if complete else "partial",
            "rows": [{**{k: r[k] for k in ("sku", "name", "unit", "issued", "credited", "net", "product_barcode")},
                      "issue_entries": issue_entries[r["sku"]]} for r in summaries]}


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
        if kind == "TRANSACTIONS" and old.get("consumable_observations") and "consumable_observations" not in entry:
            entry = {**entry, "consumable_observations": old["consumable_observations"]}
        if old == entry:
            return False
        if entry["start"] > old["start"] or entry["end"] < old["end"]:
            raise ValueError("A wider or different period is already recorded for this shutdown.")
        if (entry["as_at"] < old["as_at"] or (old.get("status") == "complete" and entry.get("status") != "complete")
                or (old.get("quality") == "recorded" and entry.get("quality") == "partial")):
            raise ValueError("A newer or more complete record is already stored.")
        if kind == "SALES_STOCK" and all("name" not in row and "issue_entries" not in row for row in old["rows"]):
            legacy_rows = [{k: v for k, v in row.items() if k not in ("name", "issue_entries", "product_barcode")} for row in entry["rows"]]
            if old["rows"] == legacy_rows and {**old, "rows": entry["rows"], "status": entry["status"]} == entry:
                archive[key][i] = entry
                break
        previous_facts = {k: v for k, v in entry.items() if k != "consumable_observations"}
        adds_issues = kind == "TRANSACTIONS" and "consumable_observations" in entry and previous_facts == old
        if (entry["as_at"] == old["as_at"] and entry["start"] == old["start"] and entry["end"] == old["end"]
                and not adds_issues and not (entry.get("status") == "complete" and old.get("status") == "partial"
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
        window = OPERATING_WINDOWS.get(normal(schedule))
        canonical = window[0] if window else first.strftime("%b %Y")
        if label not in (canonical, first.strftime("%b %Y")):
            raise ValueError(f"Use {canonical} for this shutdown.")
        label = canonical
        if window and (last < window[1] or first > window[2]):
            raise ValueError("The selected dates fall outside this shutdown.")
        pulled = requested_time(book)
        if pulled > datetime.now(QUEENSLAND).replace(tzinfo=None):
            raise ValueError("The export has a future SiteIQ pull time.")
        if pulled < start:
            raise ValueError("The export was pulled before this shutdown window.")
        if kind == "SALES_STOCK":
            entry = sales_snapshot(book, label, schedule, first, last, start, end, pulled, complete)
        else:
            if complete:
                raise ValueError("Completion confirmation applies to SALES_STOCK exports only.")
            observations = transaction_observations(book, label, schedule, start, end, pulled)
    finally:
        book.close()
    if kind == "TRANSACTIONS":
        kit = str(Path(job_dir) / "kit")
        aliases = {"MMG AUSTRALIA LIMITED": "MMG", **read_aliases(kit, "COMPANY_ALIASES.txt")}
        owners = read_aliases(kit, "OWNER_ALIASES.txt")
        def display_owner(raw):
            corrected = owners.get(raw.upper(), raw)
            return aliases.get(corrected.upper(), corrected)
        note = ""
        if window and (first, last) != window[1:]:
            note = f"The selected dates differ from the verified {window[1]:%d %b} to {window[2]:%d %b %Y} comparison window."
        entry = archived_average(path, label, start, end, expected_schedule=schedule, owner_label=display_owner, coverage_note=note)
        if entry.get("quality") == "unavailable":
            raise ValueError("No measured rental intervals were found for the selected dates.")
        entry.update(schedule=schedule, source="SiteIQ TRANSACTIONS", as_at=pulled.isoformat())
        if observations:
            entry["consumable_observations"] = observations
    changed = store(Path(data_dir) / (SALES_FILE if kind == "SALES_STOCK" else HIRE_FILE), kind, entry)
    return {"kind": kind, "label": label, "start": entry["start"], "end": entry["end"], "changed": changed,
            "status": entry.get("status") or entry["quality"], "as_at": entry["as_at"]}
