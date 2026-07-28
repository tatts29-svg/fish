#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | MOVE TO LOCAL - get the suite out of OneDrive\Desktop
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew's new laptop, 27 Jul 2026): the suite was sitting in
#  OneDrive\Desktop and Windows kept refusing the workbook with
#  "Permission denied". Three things fight you in that one folder:
#
#    - OneDrive holds a file open while it uploads it
#    - Files On-Demand can leave a file cloud-only, not really here
#    - Controlled Folder Access protects Desktop from apps writing
#
#  A plain local folder has none of that. This copies the whole kit to
#  C:\K2\ , checks every file can actually be opened there, and leaves
#  the original exactly where it is - nothing is deleted, so if
#  anything looks wrong the old folder is still your fallback.
# =====================================================================
import glob
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = r"C:\K2"


def onedrive_running():
    try:
        r = subprocess.run(["tasklist", "/FI", "IMAGENAME eq OneDrive.exe"],
                           capture_output=True, text=True, errors="replace")
        return "OneDrive.exe" in (r.stdout or "")
    except Exception:
        return False


def can_read(p):
    try:
        with open(p, "rb") as f:
            f.read(1)
        return True
    except Exception:
        return False


def main():
    print("=" * 62)
    print(" COATES | MOVE TO LOCAL")
    print(" From: " + HERE)
    print(" To  : " + DEST)
    print("=" * 62)
    if os.name != "nt":
        print(" Windows only.")
        return 0

    if "onedrive" not in HERE.lower():
        print(" This folder is already outside OneDrive - nothing to do.")
        return 0

    if onedrive_running():
        print(" HOLD ON - OneDrive is running and may be holding files open.")
        print("")
        print("  1. Click the OneDrive cloud icon (bottom-right, near the clock)")
        print("  2. Gear icon > Pause syncing > 2 hours")
        print("     (or Quit OneDrive entirely - even better)")
        print("  3. Then run me again.")
        print("")
        ans = input(" Carry on anyway? (y/N): ").strip().lower()
        if ans != "y":
            return 1

    os.makedirs(DEST, exist_ok=True)
    target = os.path.join(DEST, os.path.basename(HERE.rstrip("\\/")))
    print(" Copying to: " + target)
    try:
        shutil.copytree(HERE, target, dirs_exist_ok=True)
    except Exception as e:
        print(" ! Copy failed: {}".format(e))
        print(" ! Almost always OneDrive still holding a file - pause it")
        print("   (or quit it) and run me again.")
        return 1

    # prove the copies actually open
    bad = []
    for pat in ("*.xlsm", "*.xlsx", os.path.join("Data_SiteIQ", "*.xlsx")):
        for p in glob.glob(os.path.join(target, pat)):
            if os.path.basename(p).startswith("~$"):
                continue
            if not can_read(p):
                bad.append(os.path.basename(p))
    print("-" * 62)
    if bad:
        print(" Copied, but these still will not open: " + ", ".join(bad))
        print(" Run 22_FIX_FILE_ACCESS.bat inside the NEW folder.")
        return 1
    print(" DONE - everything opens cleanly in the new folder.")
    print("")
    print(" From now on work in:  " + target)
    print(" Open that folder and run 13_ALIGN_EXCEL_DATA.bat from there.")
    print(" Your old folder is untouched - delete it once you are happy.")
    print(" Tip: right-click the new folder > Pin to Quick access.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
