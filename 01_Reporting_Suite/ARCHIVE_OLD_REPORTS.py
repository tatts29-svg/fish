#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | ARCHIVE OLD REPORTS - one zip, then clear the space
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "previous days can go."
#
#  A shutdown generates about a gigabyte of report output a week and
#  none of it is needed once the day is sent. But "delete the old days"
#  is a one-way door, and some of those folders turned out to be the
#  ONLY copy of a company's reports - so this never deletes anything it
#  has not first put in a zip and read back.
#
#  Order of work, and it does not vary:
#     1. find every dated folder older than today
#     2. write them all into ONE zip
#     3. open that zip again and check every file is in it
#     4. only then remove the originals
#
#  Settings are not reports. '02 EMAIL CONTROL' and '03 CONTACTS &
#  SETTINGS' hold the email routing and stay put whatever their date.
# =====================================================================
import datetime
import os
import re
import shutil
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Updates", "report_archives")
DATED = re.compile(r"^20\d\d-\d\d-\d\d$")
#  Where dated day-folders live. Anything not listed here is left alone.
TREES = ["Reports", "K2 DAILY REPORTING"]
#  Never touch these, whatever is inside them.
KEEP = ("02 EMAIL CONTROL", "03 CONTACTS & SETTINGS")


def ask(label, default=""):
    d = " [{}]".format(default) if default else ""
    try:
        v = input(" {}{}: ".format(label, d)).strip()
    except EOFError:
        v = ""
    return v or default


def folder_size(path):
    n = 0
    for dp, _dn, fs in os.walk(path):
        for f in fs:
            try:
                n += os.path.getsize(os.path.join(dp, f))
            except OSError:
                pass
    return n


def mb(n):
    return "{:,.0f} MB".format(n / 1048576.0)


def find_old(today):
    """Every dated folder older than today, across both trees."""
    out = []
    for tree in TREES:
        root = os.path.join(HERE, tree)
        if not os.path.isdir(root):
            continue
        for dp, dn, _fs in os.walk(root):
            if any(k in dp for k in KEEP):
                dn[:] = []
                continue
            for d in list(dn):
                if not DATED.match(d) or d >= today:
                    continue
                out.append(os.path.join(dp, d))
                dn.remove(d)          # don't walk into it, we take it whole
    return sorted(out)


def main():
    print("=" * 66)
    print(" COATES | ARCHIVE OLD REPORTS")
    print("=" * 66)
    today = datetime.date.today().isoformat()
    old = find_old(today)
    if not old:
        print("")
        print(" Nothing older than {} to archive. All clear.".format(today))
        return 0

    total = sum(folder_size(p) for p in old)
    print("")
    print(" Today is {} - anything dated before that is fair game."
          .format(today))
    print("")
    print(" FOUND {} day-folder(s), {}:".format(len(old), mb(total)))
    for p in old:
        print("   {:<52} {:>10}".format(
            os.path.relpath(p, HERE)[:52], mb(folder_size(p))))
    print("")
    print(" Staying put: today's folders, and the settings folders")
    print(" ({}).".format(", ".join(KEEP)))
    print("")
    print(" These go into ONE zip. Nothing is deleted until that zip has")
    print(" been opened again and checked file by file.")
    print("")
    if ask("Go ahead? y/n", "n").lower() != "y":
        print(" Stopped. Nothing changed.")
        return 1

    os.makedirs(OUT, exist_ok=True)
    zpath = os.path.join(OUT, "K2_Reports_before_{}.zip".format(today))
    #  Never write over an existing archive - that would destroy the very
    #  thing this is meant to protect.
    n = 2
    while os.path.exists(zpath):
        zpath = os.path.join(
            OUT, "K2_Reports_before_{}_{}.zip".format(today, n))
        n += 1

    print("")
    print(" Writing {} ...".format(os.path.basename(zpath)))
    written = {}
    try:
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            for p in old:
                for dp, _dn, fs in os.walk(p):
                    for f in fs:
                        full = os.path.join(dp, f)
                        rel = os.path.relpath(full, HERE).replace("\\", "/")
                        try:
                            z.write(full, rel)
                            written[rel] = os.path.getsize(full)
                        except Exception as e:
                            print("   ! could not add {} ({})".format(rel, e))
                            print("   STOPPING - nothing has been deleted.")
                            return 1
    except Exception as e:
        print(" Could not write the archive: {}".format(e))
        print(" STOPPING - nothing has been deleted.")
        return 1
    print(" Wrote {:,} files, {}".format(
        len(written), mb(os.path.getsize(zpath))))

    # ---- read it back before removing a single thing ------------------
    print("")
    print(" Checking the archive can be opened and holds every file...")
    try:
        with zipfile.ZipFile(zpath) as z:
            inside = {i.filename: i.file_size for i in z.infolist()}
            bad = z.testzip()
    except Exception as e:
        print(" ! The archive will not open ({}).".format(e))
        print(" NOTHING DELETED. Your reports are untouched.")
        return 1
    if bad:
        print(" ! Corrupt entry in the archive: {}".format(bad))
        print(" NOTHING DELETED. Your reports are untouched.")
        return 1
    missing = [r for r in written if r not in inside]
    wrong = [r for r in written if r in inside and inside[r] != written[r]]
    if missing or wrong:
        print(" ! {} file(s) missing, {} the wrong size."
              .format(len(missing), len(wrong)))
        for r in (missing + wrong)[:5]:
            print("     {}".format(r))
        print(" NOTHING DELETED. Your reports are untouched.")
        return 1
    print(" All {:,} files verified inside the archive.".format(len(inside)))

    # ---- only now ------------------------------------------------------
    print("")
    freed, gone = 0, 0
    for p in old:
        sz = folder_size(p)
        try:
            shutil.rmtree(p)
            freed += sz
            gone += 1
        except Exception as e:
            print("   ! could not remove {}: {}".format(
                os.path.relpath(p, HERE), e))
    print(" Removed {} folder(s). Freed {}.".format(gone, mb(freed)))
    print("")
    print("-" * 66)
    print(" Archive: Updates\\report_archives\\{}"
          .format(os.path.basename(zpath)))
    print("")
    print(" If a charge gets queried, everything is in that one file -")
    print(" double-click it and browse. If you want the space back for")
    print(" good, delete it; there is no other copy after that.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
