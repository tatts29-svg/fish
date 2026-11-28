#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | PULL SITEIQ EXPORTS - Downloads -> Data_SiteIQ, safely
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  SiteIQ downloads land in Downloads with long names and a time stamp
#  (RENTAL_STOCK_06_11_2026_11_37_PM.xlsx, TRANSACTIONS06_11_2026_...),
#  and some of what is in Downloads belongs to OTHER jobs. Copying the
#  wrong one in would poison a day of reports, so this never trusts a
#  filename. It OPENS each candidate and checks two things:
#
#    1. WHICH EXPORT - the data sheet inside (RENTAL_STOCK, SALES_STOCK,
#       STOCKTAKE, the two TRANSACTION sheets). That is how SiteIQ builds
#       them, so the download can be called anything and still land right.
#    2. WHICH JOB - REFERENCE_INFO > PROJECT SCHEDULE must match this
#       job: the project named in JOB.txt, or failing that the project of
#       the exports already in Data_SiteIQ. Anything else is left where it
#       is and named on screen.
#
#  Newest of each type wins, by the export's own REQUESTED_DATE/TIME
#  (not the file date). Whatever is already in Data_SiteIQ is moved to
#  Data_SiteIQ\previous\ first - nothing is ever just overwritten.
#
#  Usage:  python pull_siteiq_exports.py            (looks in ~\Downloads)
#          python pull_siteiq_exports.py <folder>   (another folder)
#          --dry-run  shows what it would do and changes nothing
# =====================================================================
import datetime as dt
import glob
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "_lib"))
sys.path.insert(0, HERE)
try:
    import openpyxl
except ImportError:
    print("  STOP | The _lib folder is missing from the kit - extract the zip again.")
    sys.exit(2)

DEST = os.path.join(HERE, "Data_SiteIQ")
BACKUP = os.path.join(DEST, "previous")

#  data sheet inside the file -> the name the kit keeps it under
WANTED = {
    "RENTAL_STOCK": "RENTAL_STOCK.xlsx",
    "SALES_STOCK": "SALES_STOCK.xlsx",
    "STOCKTAKE": "STOCKTAKE.xlsx",
    "TRANSACTION_WITHOUT_CHARGES": "TRANSACTIONS.xlsx",
    "TRANSACTION_CHARGES": "TRANSACTIONS.xlsx",
}
REQUIRED = ("RENTAL_STOCK.xlsx", "SALES_STOCK.xlsx", "TRANSACTIONS.xlsx")


def norm(s):
    return re.sub(r"\s+", " ", str(s or "")).strip().lower()


def parse_when(v):
    """SiteIQ's '06/11/2026 11:37 PM', or a real datetime."""
    if isinstance(v, dt.datetime):
        return v
    m = re.match(r"\s*(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?",
                 str(v or ""), re.I)
    if not m:
        return None
    d, mo, y, h, mi, _sec, ap = m.groups()
    h = int(h)
    if ap:
        if ap.upper() == "PM" and h != 12:
            h += 12
        if ap.upper() == "AM" and h == 12:
            h = 0
    try:
        return dt.datetime(int(y), int(mo), int(d), h, int(mi))
    except ValueError:
        return None


def inspect(path):
    """(kind, project, requested) for an .xlsx, or None if it is not a
    SiteIQ export this kit knows. Never raises."""
    try:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    except Exception:
        return None
    try:
        kind = next((WANTED[n] for n in wb.sheetnames if n in WANTED), None)
        if not kind:
            return None
        project, requested = "", None
        if "REFERENCE_INFO" in wb.sheetnames:
            rows = list(wb["REFERENCE_INFO"].iter_rows(min_row=1, max_row=2, values_only=True))
            if len(rows) >= 2:
                head = [str(c or "").strip().upper() for c in rows[0]]
                vals = list(rows[1]) + [None] * len(head)
                for i, h in enumerate(head):
                    if h in ("PROJECT SCHEDULE", "PROJECT_SCHEDULE") and vals[i]:
                        project = str(vals[i]).strip()
                    if h.startswith("REQUESTED_DATE") and vals[i]:
                        requested = parse_when(vals[i])
        return kind, project, requested
    finally:
        try:
            wb.close()
        except Exception:
            pass


def this_job():
    """The project this kit reports on: JOB.txt first, else whatever is
    already in Data_SiteIQ. '' when nothing says."""
    try:
        import build_onhire_workbook as kit
        s = kit.the_site(HERE)
        if getattr(s, "project_schedule", ""):
            return str(s.project_schedule).strip()
    except Exception:
        pass
    for p in sorted(glob.glob(os.path.join(DEST, "*.xlsx"))):
        info = inspect(p)
        if info and info[1]:
            return info[1]
    return ""


def main(argv):
    dry = "--dry-run" in argv
    args = [a for a in argv[1:] if not a.startswith("--")]
    src = args[0] if args else os.path.join(os.path.expanduser("~"), "Downloads")
    print("=" * 66)
    print("  COATES | PULL SITEIQ EXPORTS")
    print("=" * 66)
    if not os.path.isdir(src):
        print("  STOP | Can't see a folder at {}".format(src))
        print("         Drag your Downloads folder onto 6_PULL_EXPORTS.bat, or pass it as the argument.")
        return 1
    job = this_job()
    print("  Looking in {}".format(src))
    print("  This job   {}".format(job or "(not known yet - the first pull takes what it finds)"))
    print()
    best = {}
    skipped = []
    for p in sorted(glob.glob(os.path.join(glob.escape(src), "*.xlsx"))):
        if os.path.basename(p).startswith("~$"):
            continue
        info = inspect(p)
        if not info:
            continue
        kind, project, requested = info
        if job and project and norm(project) != norm(job):
            skipped.append((os.path.basename(p), project))
            continue
        stamp = requested or dt.datetime.fromtimestamp(os.path.getmtime(p))
        #  newest by the export's own stamp; on a tie (a copy of the same
        #  download) the most recently written file wins
        key = (stamp, os.path.getmtime(p))
        if kind not in best or key > best[kind][3]:
            best[kind] = (stamp, p, project, key)
    if not best:
        print("  STOP | No SiteIQ exports for this job in that folder.")
        if skipped:
            print("         Other jobs' files seen and left alone:")
            for name, project in skipped[:8]:
                print("           - {}  ({})".format(name, project))
        print("         Pull RENTAL_STOCK, SALES_STOCK, TRANSACTIONS and STOCKTAKE out of SiteIQ,")
        print("         let them land in Downloads, and press this button again.")
        return 1
    os.makedirs(DEST, exist_ok=True)
    moved = 0
    for kind in ("RENTAL_STOCK.xlsx", "SALES_STOCK.xlsx", "TRANSACTIONS.xlsx", "STOCKTAKE.xlsx"):
        if kind not in best:
            continue
        stamp, p, project, _key = best[kind]
        target = os.path.join(DEST, kind)
        age = dt.datetime.now() - stamp
        old = " (pulled {} - {} days old)".format(stamp.strftime("%d %b %Y %H:%M"), age.days) if age.days >= 1 \
            else " (pulled {})".format(stamp.strftime("%d %b %Y %H:%M"))
        print("  {:<18} <- {}{}".format(kind, os.path.basename(p), old))
        if dry:
            continue
        if os.path.isfile(target):
            os.makedirs(BACKUP, exist_ok=True)
            keep = os.path.join(BACKUP, "{}_{}.xlsx".format(
                kind[:-5], dt.datetime.fromtimestamp(os.path.getmtime(target)).strftime("%Y-%m-%d_%H%M")))
            try:
                shutil.move(target, keep)
            except OSError:
                shutil.copyfile(target, keep)
        shutil.copyfile(p, target)
        moved += 1
    missing = [k for k in REQUIRED if k not in best]
    print()
    if skipped:
        print("  Left alone (another job's exports): {}".format(
            ", ".join(sorted({project for _n, project in skipped}))))
    if missing:
        print("  NOTE | Not found in Downloads: {}. The report needs them - pull them from SiteIQ "
              "and press this again.".format(", ".join(m[:-5] for m in missing)))
    if "STOCKTAKE.xlsx" not in best:
        print("  NOTE | No STOCKTAKE in Downloads; the report runs without it and says so.")
    if dry:
        print("  Dry run - nothing was copied.")
    else:
        print("  {} export{} filed into Data_SiteIQ{}.".format(
            moved, "" if moved == 1 else "s", " (the previous ones are in Data_SiteIQ\\previous)" if os.path.isdir(BACKUP) else ""))
    print("=" * 66)
    return 1 if missing else 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv))
    except KeyboardInterrupt:
        sys.exit(1)
