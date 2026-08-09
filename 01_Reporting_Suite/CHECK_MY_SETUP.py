#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | CHECK MY SETUP - new computer, one honest answer
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Run me FIRST on any new machine, or any time something says it
#  "cannot access" a file. I check the things that actually break a
#  new setup - the workbook really being here (not a OneDrive
#  cloud-only placeholder), Python's libraries, Excel, and the
#  exports - and I say in plain words what to fix.
# =====================================================================
import glob
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

try:
    import site_config
    SITE = site_config.site(base=HERE)
except Exception:                                  # pragma: no cover
    site_config, SITE = None, None
OK, WARN, BAD = "  OK   ", "  WARN ", "  STOP "
problems = []


def say(tag, msg):
    print(tag + "| " + msg)


def check_file(path, what, required=True):
    """Exists, has real bytes, and is genuinely on this disk."""
    name = os.path.basename(path)
    if not os.path.isfile(path):
        say(BAD if required else WARN, "{} NOT FOUND - {}".format(what, name))
        if required:
            problems.append("{} is missing from this folder.".format(what))
        return False
    size = os.path.getsize(path)
    if size == 0:
        say(BAD, "{} is ZERO BYTES - {}".format(what, name))
        problems.append("{} is 0 bytes - OneDrive has not finished "
                        "downloading it.".format(what))
        return False
    #  Cloud-only placeholder? Windows marks it OFFLINE /
    #  RECALL_ON_DATA_ACCESS. Excel and Python both fail on these with
    #  'cannot access the file' - the file LOOKS present in Explorer.
    if os.name == "nt":
        try:
            import ctypes
            attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
            FILE_ATTRIBUTE_OFFLINE = 0x1000
            FILE_ATTRIBUTE_RECALL_ON_OPEN = 0x40000
            FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS = 0x400000
            if attrs != -1 and (attrs & (FILE_ATTRIBUTE_OFFLINE
                                         | FILE_ATTRIBUTE_RECALL_ON_OPEN
                                         | FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS)):
                say(BAD, "{} is CLOUD-ONLY (not downloaded) - {}".format(
                    what, name))
                problems.append(
                    "{} is a OneDrive cloud-only placeholder. Right-click "
                    "it > 'Always keep on this device', wait for the green "
                    "tick, then run again.".format(what))
                return False
        except Exception:
            pass
    #  Final proof: actually read a byte.
    try:
        with open(path, "rb") as f:
            f.read(1)
    except PermissionError:
        #  Both Excel and Python refused = Windows is saying no. On a
        #  folder copied from another machine or user profile this is a
        #  lock file, a read-only flag, old NTFS permissions or folder
        #  protection. The fix is in the message below.
        say(BAD, "{} is PERMISSION DENIED - {}".format(what, name))
        problems.append(
            "{} is blocked by Windows (permission denied). Close Excel, "
            "then right-click the suite folder > Properties > untick "
            "Read-only > OK > apply to all subfolders and files. If it "
            "came off another machine, also right-click the file > "
            "Properties > tick Unblock.".format(what))
        return False
    except Exception as e:
        say(BAD, "{} CANNOT BE READ - {} ({})".format(what, name, e))
        problems.append("{} exists but will not open: {}".format(what, e))
        return False
    say(OK, "{} - {} ({:,} KB)".format(what, name, size // 1024))
    return True


def main():
    print("=" * 62)
    print(" COATES | CHECK MY SETUP")
    print(" Folder: " + HERE)
    if SITE is not None:
        print(" Job:    " + SITE.header_line)
        print("         (change it with 57_SWITCH_JOB.bat)")
    print("=" * 62)

    # ---- 0. is this folder itself marked read-only? ----------------------
    #  A folder copied from another machine carries Read-only with it and
    #  hands it to every file inside - the exact cause of Andrew's
    #  "permission denied" on the new laptop, 27 Jul 2026.
    if os.name == "nt":
        try:
            import ctypes
            a = ctypes.windll.kernel32.GetFileAttributesW(str(HERE))
            if a != -1 and (a & 0x1):     # FILE_ATTRIBUTE_READONLY
                say(BAD, "THIS FOLDER is marked READ-ONLY - fixing it "
                         "for you now...")
                #  A copied folder carries Read-only with it and hands it
                #  to every file inside - it has bitten every new machine
                #  so far (27 Jul, again 29 Jul 2026). The check can
                #  simply fix it: clear the attribute on the folder and
                #  everything in it, then prove it took.
                import subprocess
                try:
                    subprocess.run(["attrib", "-R", str(HERE)],
                                   capture_output=True, timeout=60)
                    subprocess.run(["attrib", "-R",
                                    os.path.join(str(HERE), "*"),
                                    "/S", "/D"],
                                   capture_output=True, timeout=300)
                except Exception:
                    pass
                a2 = ctypes.windll.kernel32.GetFileAttributesW(str(HERE))
                if a2 != -1 and not (a2 & 0x1):
                    say(OK, "Read-only cleared on the folder and "
                            "everything in it - fixed.")
                else:
                    problems.append(
                        "This folder has Read-only ticked and I couldn't "
                        "clear it myself. Right-click the folder > "
                        "Properties > untick Read-only > OK > apply to "
                        "all subfolders and files.")
        except Exception:
            pass

    # ---- 0b. living under OneDrive? (the work laptop does) ---------------
    #  The suite RUNS fine under OneDrive - IF the folder is pinned to
    #  the device and the workbook's AutoSave is off. Unpinned, OneDrive
    #  keeps files as cloud-only placeholders that Excel and Python both
    #  fail on, and it can lock files mid-run while it syncs. Andrew's
    #  work laptop lives at OneDrive...\Desktop\Cement\ (29 Jul 2026).
    if "onedrive" in HERE.lower():
        say(WARN, "This folder lives under OneDrive - three settings "
                  "keep it safe:")
        print("        1. Right-click the Cement folder in Explorer >")
        print("           'Always keep on this device' - so every file is")
        print("           really on the disk, not a cloud placeholder.")
        print("        2. In Excel, AutoSave OFF for the K2 workbook -")
        print("           AutoSave breaks the workbook's folder path")
        print("           (then run 13_ALIGN_EXCEL_DATA.bat once).")
        print("        3. Run 45_ARCHIVE_OLD_REPORTS.bat weekly - keeps")
        print("           OneDrive from syncing gigabytes of old days.")

    # ---- 0c. leftover Excel lock files ------------------------------------
    #  A copied folder brings the hidden ~$ lock markers with it, and
    #  Excel then swears the workbook is "locked for editing by you"
    #  (bit Andrew's laptop 29 Jul 2026). If Excel isn't running, the
    #  markers are stale and safe to remove - so remove them.
    locks = glob.glob(os.path.join(HERE, "~$*.xls*"))
    if locks and os.name == "nt":
        import subprocess
        try:
            r = subprocess.run(["tasklist", "/FI", "IMAGENAME eq EXCEL.EXE"],
                               capture_output=True, text=True, timeout=30)
            excel_running = "EXCEL.EXE" in (r.stdout or "").upper()
        except Exception:
            excel_running = True     # can't tell - don't touch them
        if excel_running:
            say(WARN, "{} Excel lock file(s) here and Excel is open - "
                      "close Excel, run me again, and I'll clear them."
                      .format(len(locks)))
        else:
            for p in locks:
                try:
                    os.remove(p)
                    say(OK, "Stale Excel lock removed - "
                            + os.path.basename(p))
                except OSError:
                    say(WARN, "Couldn't remove " + os.path.basename(p)
                        + " - delete it by hand (View > Hidden items).")

    # ---- 1. the workbook ------------------------------------------------
    #  Whichever job this computer is set to - the workbook, the export
    #  list and the folders all come from Sites\<job>.json.
    pattern = (SITE.workbook_glob if SITE and SITE.workbook_glob
               else "Cement_Australia_Report*K2*.xlsm")
    label = "{} workbook".format(SITE.short if SITE and SITE.short else "K2")
    wbs = [p for p in glob.glob(os.path.join(HERE, pattern))
           if not os.path.basename(p).startswith("~$")]
    if not wbs:
        say(BAD, label.upper() + " NOT FOUND")
        problems.append("The {} ({}) is not where the job expects it. "
                        "Copy it in.".format(label, pattern))
    else:
        check_file(max(wbs, key=os.path.getmtime), label)

    # ---- 2. today's exports ---------------------------------------------
    need = list(SITE.exports) if SITE and SITE.exports else [
        "RENTAL_STOCK", "ON_HIRE", "TRANSACTIONS", "SALES_STOCK",
        "STOCKTAKE", "DAILY_SUMMARY"]
    folders = SITE.data_dirs(HERE) if SITE else [
        os.path.join(HERE, "Data_SiteIQ"), HERE]
    for stem in need:
        hits = []
        for d in folders:
            hits += [p for p in glob.glob(os.path.join(d, stem + "*.xlsx"))
                     if not os.path.basename(p).startswith("~$")]
        if not hits:
            say(WARN, "Export {} not found (some reports will say "
                      "'unavailable')".format(stem))
            continue
        newest = max(hits, key=os.path.getmtime)
        if not check_file(newest, "Export " + stem):
            continue
        #  Right file, wrong job? An export carries the SiteIQ project
        #  name. Building Weipa reports off Gladstone data is the sort
        #  of mistake that gets all the way to a customer.
        if site_config is not None:
            ok, why = site_config.belongs_to_live_job(newest, HERE)
            if not ok:
                say(BAD, "Export {} belongs to a DIFFERENT job".format(stem))
                problems.append(why)

    # ---- 3. python's libraries ------------------------------------------
    print("-" * 62)
    say(OK, "Python {}.{}.{}".format(*sys.version_info[:3]))
    for mod, why in [("openpyxl", "reading and writing the workbook"),
                     ("PIL", "sharper email images (optional)")]:
        try:
            __import__(mod)
            say(OK, "Library {} - {}".format(mod, why))
        except ImportError:
            if mod == "openpyxl":
                say(BAD, "Library openpyxl MISSING - nothing can read Excel")
                problems.append("Install it: open Command Prompt and run"
                                "   pip install openpyxl")
            else:
                say(WARN, "Library {} not installed - {} (fine without "
                          "it)".format(mod, why))

    # ---- 4. Excel + a browser -------------------------------------------
    if os.name == "nt":
        try:
            import winreg
            winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, "Excel.Application")
            say(OK, "Microsoft Excel is installed (needed for the align)")
        except Exception:
            say(BAD, "Microsoft Excel NOT found - the align steps need it")
            problems.append("Desktop Excel is not installed on this machine. "
                            "Everything except the Excel align still runs.")
    try:
        import browser_engine
        b = browser_engine.find_browser()
        if b:
            say(OK, "Browser for PDFs and email images - " + os.path.basename(b))
        else:
            say(WARN, "No Edge/Chrome found - reports build as HTML, no PDFs")
    except Exception:
        say(WARN, "Could not check for a browser")

    # ---- verdict ---------------------------------------------------------
    print("=" * 62)
    if not problems:
        print(" ALL GOOD. This machine is ready - run the morning as normal.")
        return 0
    print(" {} thing(s) to fix, in plain words:".format(len(problems)))
    for i, p in enumerate(problems, 1):
        print("   {}. {}".format(i, p))
    print("=" * 62)
    return 1


if __name__ == "__main__":
    sys.exit(main())
