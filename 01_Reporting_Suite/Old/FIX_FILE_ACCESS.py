#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | FIX FILE ACCESS - "Permission denied" on the workbook
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY THIS EXISTS (Andrew's new laptop, 27 Jul 2026)
#  Excel said "cannot access the file" and Python said
#  PermissionError [Errno 13] on the SAME workbook. When both are
#  refused it is Windows saying no, not Excel being stubborn. On a
#  folder that has been copied from another computer or user profile
#  it is nearly always one of these, and this script clears all of
#  them in order - safely, without deleting any of your work:
#
#    1. a leftover Excel lock file  (~$Workbook.xlsm)
#    2. the READ-ONLY attribute on the file
#    3. Mark-of-the-Web  (the "this came from another computer" block)
#    4. NTFS permissions still pointing at the OLD user account
#    5. a hidden EXCEL.EXE still holding the file open
#
#  It only ever touches the ~$ lock files. Everything else is a
#  permission change on files you own.
# =====================================================================
import ctypes
import glob
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True,
                              errors="replace", shell=False)
    except Exception:
        return None


def targets():
    out = []
    for pat in ("Cement_Australia_Report*K2*.xlsm", "*.xlsx", "*.xlsm"):
        for p in glob.glob(os.path.join(HERE, pat)):
            if not os.path.basename(p).startswith("~$") and p not in out:
                out.append(p)
    for p in glob.glob(os.path.join(HERE, "Data_SiteIQ", "*.xlsx")):
        if not os.path.basename(p).startswith("~$"):
            out.append(p)
    return out


def can_read(path):
    try:
        with open(path, "rb") as f:
            f.read(1)
        return True
    except Exception:
        return False


def main():
    print("=" * 62)
    print(" COATES | FIX FILE ACCESS")
    print(" Folder: " + HERE)
    print("=" * 62)
    if os.name != "nt":
        print(" This one is for Windows only.")
        return 0

    files = targets()
    blocked = [f for f in files if not can_read(f)]
    print(" Checked  : {} Excel file(s) here".format(len(files)))
    if not blocked:
        print(" Good news: every file opens fine already.")
        print(" If the align still fails, close all Excel windows and")
        print(" run 21_CHECK_MY_SETUP.bat.")
        return 0
    print(" BLOCKED  : {} file(s) Windows will not open:".format(len(blocked)))
    for b in blocked:
        print("            " + os.path.basename(b))

    # ---- 1. leftover Excel lock files ---------------------------------
    locks = glob.glob(os.path.join(HERE, "~$*")) + \
        glob.glob(os.path.join(HERE, "Data_SiteIQ", "~$*"))
    for lk in locks:
        try:
            os.remove(lk)
            print(" Step 1   : removed stale Excel lock " + os.path.basename(lk))
        except Exception as e:
            print(" Step 1   : could not remove {} ({})".format(
                os.path.basename(lk), e))
    if not locks:
        print(" Step 1   : no stale Excel lock files - good")

    # ---- 2. is Excel still running? ------------------------------------
    r = run(["tasklist", "/FI", "IMAGENAME eq EXCEL.EXE"])
    if r and "EXCEL.EXE" in (r.stdout or ""):
        n = (r.stdout or "").count("EXCEL.EXE")
        print(" Step 2   : {} Excel process(es) STILL RUNNING - close every"
              " Excel window".format(n))
        print("            (Task Manager > Details > EXCEL.EXE > End task)")
    else:
        print(" Step 2   : no Excel running - good")

    # ---- 3. read-only attribute + Mark-of-the-Web ----------------------
    #  THE ONE THAT GOT US (Andrew, 27 Jul 2026): the FOLDER carried
    #  Read-only across from the old machine, and Windows pushed it down
    #  onto every file inside - Excel and Python both got "permission
    #  denied" on the workbook. Clear it on the whole tree (/S files,
    #  /D folders), not just the file we noticed.
    run(["attrib", "-R", os.path.join(HERE, "*"), "/S", "/D"])
    for f in blocked:
        run(["attrib", "-R", f])
    print(" Step 3   : read-only cleared on this folder AND everything in it")
    ps = ("Get-ChildItem -LiteralPath '{}' -Recurse -File | "
          "Unblock-File -ErrorAction SilentlyContinue").format(HERE)
    run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
         "-Command", ps])
    print(" Step 4   : 'came from another computer' block removed")

    # ---- 5. NTFS permissions for THIS user -----------------------------
    user = os.environ.get("USERNAME") or ""
    granted = 0
    for f in blocked:
        r = run(["icacls", f, "/grant", "{}:(F)".format(user)])
        if r and r.returncode == 0:
            granted += 1
    print(" Step 5   : full control granted to {} on {} of {} file(s)".format(
        user or "this user", granted, len(blocked)))
    if granted < len(blocked):
        print("            Some needed admin - right-click"
              " 22_FIX_FILE_ACCESS.bat > Run as administrator")

    # ---- verdict --------------------------------------------------------
    print("-" * 62)
    still = [f for f in blocked if not can_read(f)]
    if not still:
        print(" FIXED. Every file opens now - run 13_ALIGN_EXCEL_DATA.bat.")
        return 0
    print(" STILL BLOCKED: " + ", ".join(os.path.basename(s) for s in still))
    print("")
    print(" Two things left to try, in order:")
    print("  1. Windows Security > Virus & threat protection > Manage")
    print("     ransomware protection > CONTROLLED FOLDER ACCESS - if it is")
    print("     ON, it blocks apps writing to Desktop. Turn it off, or add")
    print("     Excel and Python under 'Allow an app through'.")
    print("  2. Move the whole folder OUT of OneDrive\\Desktop to a plain")
    print("     local folder - C:\\K2\\  - and run from there. That sidesteps")
    print("     OneDrive locks and folder protection in one go.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
