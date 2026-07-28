#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | CHECK DATA SOURCES - where is the workbook actually looking?
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (new laptop, 27 Jul 2026): Power Query remembers the path it was
#  built with. Move the kit to a new machine and any query with a
#  hard-coded path sits on "Connecting to datasource" until it times
#  out - looking for a folder that does not exist here.
#
#  I open the workbook like a zip (never through Excel, so I can run
#  while a refresh is going) and list every file path it references.
#  Anything not pointing at THIS folder gets flagged, with the fix.
# =====================================================================
import glob
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
PATH_RE = re.compile(r"[A-Za-z]:\\\\?[^\"'<>|*?\r\n]{3,180}", re.I)


def main():
    print("=" * 62)
    print(" COATES | CHECK DATA SOURCES")
    print(" This folder: " + HERE)
    print("=" * 62)
    wbs = [p for p in glob.glob(os.path.join(HERE, "Cement_Australia_Report*K2*.xlsm"))
           if not os.path.basename(p).startswith("~$")]
    if not wbs:
        print(" No K2 workbook found in this folder.")
        return 1
    wb = max(wbs, key=os.path.getmtime)
    print(" Workbook   : " + os.path.basename(wb))

    found = {}
    try:
        with zipfile.ZipFile(wb) as z:
            for m in z.namelist():
                low = m.lower()
                if not (low.endswith(".xml") or low.endswith(".rels")
                        or "customxml" in low or "item" in low):
                    continue
                try:
                    blob = z.read(m).decode("utf-8", "ignore")
                except Exception:
                    continue
                for hit in PATH_RE.findall(blob):
                    p = hit.replace("\\\\", "\\").strip().rstrip("\\\"' ")
                    #  Only care about folders/files that look like data
                    if not re.search(r"\.(xlsx|xlsm|csv|txt)$", p, re.I) \
                            and not p.rstrip("\\").endswith(("\\", ":")):
                        if "\\" not in p:
                            continue
                    found.setdefault(p, set()).add(m.split("/")[-1])
    except Exception as e:
        print(" Could not read the workbook ({}).".format(e))
        print(" If a refresh is running right now, try again when it ends.")
        return 1

    here_l = HERE.lower().rstrip("\\") + "\\"
    good, bad = [], []
    for p in sorted(found):
        (good if p.lower().startswith(here_l) else bad).append(p)

    if not found:
        print(" No hard-coded paths in the workbook - every query uses the")
        print(" SOURCE_PATH parameter. Nothing to fix.")
        return 0

    for p in good:
        print("  OK   | " + p)
    for p in bad:
        print("  STOP | " + p)

    print("-" * 62)
    if not bad:
        print(" ALL GOOD - every path points at this folder.")
        return 0
    print(" {} path(s) point somewhere else - that is what makes a refresh"
          " hang.".format(len(bad)))
    print("")
    print(" FIX IT IN EXCEL (2 minutes, once):")
    print("   1. Open the workbook")
    print("   2. Data > Get Data > Data Source Settings")
    print("   3. Select each old path > Change Source... > point it at")
    print("      " + HERE)
    print("   4. Close, then Data > Refresh All")
    print("   5. Save. Every morning after that runs silently.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
