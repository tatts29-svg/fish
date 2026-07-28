#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | TIDY THE FOLDER - the suite folder, readable again
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 29 Jul 2026): "there is hundreds of files in there -
#  i wanted it cleaned up."
#
#  What moves (never deleted - moved, so anything can come back):
#    Docs\      the how-to pages and what's-new notes you read once
#    _Archive\  dated one-off outputs and update zips already applied
#
#  What NEVER moves - the suite would stop working or you'd lose data:
#    - every numbered .bat, .py and .ps1 (the buttons and their engines
#      must sit together - that is how the buttons find them)
#    - the live registers and rates files (recipients, charges, master
#      pricing, contracted rates, SDS register, consumable requests)
#    - the six SiteIQ export copies in the root - the K2 workbook's
#      queries read them from HERE
#    - Data_SiteIQ, Data_Baseplan, Reports, K2 DAILY REPORTING,
#      Gear_Lookup, Updates - already organised, already where
#      they belong
#
#  Safe to run any time, safe to run twice. Prints every move.
#  For the report-day folders (the real gigabytes): that is
#  45_ARCHIVE_OLD_REPORTS.bat - one zip per old day, verified,
#  then cleared.
# =====================================================================
import glob
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "Docs")
ARCH = os.path.join(HERE, "_Archive")

#  Read-once paperwork -> Docs\   (checked 29 Jul 2026: nothing in the
#  code reads any of these; the logbook poster and SDS register are
#  referenced by code and deliberately NOT on this list)
TO_DOCS = [
    "HOW_TO_SEND_THE_DAYS_EMAILS.html",
    "HOW_TO_PRINT_MY_GEAR_A4.html",
    "WHATS_NEW_COMPLIANCE_UPGRADE.md",
    "WHATS_NEW_DAILY_EMAIL_PACKS.md",
    "ACTIVITY_ACCOUNTABILITY_DATA_MAPPING.md",
    "READ_ME_workbook_html.txt",
]

#  Dated one-offs and spent update zips -> _Archive\
TO_ARCH_PATTERNS = [
    "Replacement_Costs_GAP_LIST_*.xlsx",   # fresh ones land in Reports\<day>
    "K2_UPDATE*.zip",                      # applied updates (46 logs them)
    "K2_SUITE*.zip",                       # old full-suite packages
]


def move(src, ddir, why):
    os.makedirs(ddir, exist_ok=True)
    dst = os.path.join(ddir, os.path.basename(src))
    if os.path.exists(dst):
        base, ext = os.path.splitext(os.path.basename(src))
        n = 2
        while os.path.exists(dst):
            dst = os.path.join(ddir, "{} ({}){}".format(base, n, ext))
            n += 1
    shutil.move(src, dst)
    print("   {:9} {}  ({})".format(
        os.path.basename(ddir) + "\\", os.path.basename(src), why))
    return 1


def main():
    print("=" * 70)
    print(" COATES | TIDY THE FOLDER")
    print("=" * 70)
    moved = 0
    for n in TO_DOCS:
        p = os.path.join(HERE, n)
        if os.path.isfile(p):
            moved += move(p, DOCS, "read-once paperwork")
    #  An update zip only archives once 46 has actually applied it -
    #  tidying away a zip you haven't run yet would hide it from 46.
    applied_log = ""
    lp = os.path.join(HERE, "Updates", "applied_updates.log")
    if os.path.isfile(lp):
        with open(lp, encoding="utf-8", errors="replace") as f:
            applied_log = f.read()
    for pat in TO_ARCH_PATTERNS:
        for p in sorted(glob.glob(os.path.join(HERE, pat))):
            if not os.path.isfile(p):
                continue
            name = os.path.basename(p)
            if name.upper().startswith("K2_UPDATE") and name not in applied_log:
                print("   left      {}  (not applied yet - run "
                      "46_APPLY_UPDATE.bat first)".format(name))
                continue
            moved += move(p, ARCH, "dated one-off / applied zip")
    print("")
    if moved:
        print(" {} file(s) moved - nothing deleted; Docs\\ and _Archive\\"
              .format(moved))
        print(" hold everything, exactly as it was.")
    else:
        print(" Nothing to tidy - the folder is already clean.")
    print("")
    print(" The report-day folders are the real space: "
          "45_ARCHIVE_OLD_REPORTS.bat")
    print(" zips every day older than today, verifies the zip, then "
          "clears it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
