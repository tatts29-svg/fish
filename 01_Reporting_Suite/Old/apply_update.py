#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | K2 SUITE UPDATER - one click, small updates, no big zips
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  HOW IT WORKS (the whole deal):
#    1. Drop the little K2_UPDATE_*.zip (from chat) into THIS folder
#       or into your Downloads - either works.
#    2. Double-click 19_APPLY_UPDATE.bat.
#    3. It backs up every file it's about to replace into
#       Updates\backup_<timestamp>\, installs the update, then
#       compile-checks every Python file so a broken update can never
#       sneak in silently. Anything wrong: restore from the backup
#       folder by copying the files back. That's the whole rollback.
# =====================================================================
import glob
import os
import py_compile
import shutil
import sys
import time
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))


def newest_update():
    spots = [HERE, os.path.join(os.path.expanduser("~"), "Downloads")]
    cands = []
    for s in spots:
        cands += glob.glob(os.path.join(s, "K2_UPDATE_*.zip"))
    return max(cands, key=os.path.getmtime) if cands else None


def main():
    print("=" * 62)
    print(" COATES | K2 SUITE UPDATER")
    print("=" * 62)
    z = newest_update()
    if not z:
        print(" No K2_UPDATE_*.zip found here or in Downloads.")
        print(" Save the update zip from chat first, then run me again.")
        return 1
    print(" Update   : " + os.path.basename(z))
    ts = time.strftime("%Y%m%d_%H%M%S")
    bdir = os.path.join(HERE, "Updates", "backup_" + ts)
    applied, backed = [], 0
    with zipfile.ZipFile(z) as zf:
        for m in zf.infolist():
            name = m.filename.replace("\\", "/")
            # never allow an update to write outside this folder
            if name.startswith("/") or ".." in name.split("/"):
                print(" ! skipped unsafe path: " + name)
                continue
            if name.endswith("/"):
                continue
            dest = os.path.join(HERE, *name.split("/"))
            if os.path.isfile(dest):
                bak = os.path.join(bdir, *name.split("/"))
                os.makedirs(os.path.dirname(bak), exist_ok=True)
                shutil.copy2(dest, bak)
                backed += 1
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with zf.open(m) as src, open(dest, "wb") as out:
                shutil.copyfileobj(src, out)
            applied.append(name)
    print(" Applied  : {} file(s)".format(len(applied)))
    for a in applied:
        print("            " + a)
    if backed:
        print(" Backup   : {} replaced file(s) saved to".format(backed))
        print("            Updates\\backup_" + ts + "\\")
    # ---- prove the suite still compiles - a broken update never hides
    bad = 0
    for f in sorted(glob.glob(os.path.join(HERE, "*.py"))):
        try:
            py_compile.compile(f, doraise=True)
        except Exception as e:
            bad += 1
            print(" ! COMPILE FAILED: {} - {}".format(os.path.basename(f), e))
    if bad:
        print(" ! {} file(s) failed - restore from the backup folder above"
              " and tell Claude.".format(bad))
        return 1
    print(" Check    : every Python file compiles - update is good.")
    print(" Done. Run the suite as normal.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
