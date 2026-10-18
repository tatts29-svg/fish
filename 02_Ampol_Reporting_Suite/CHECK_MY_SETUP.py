#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | CHECK MY SETUP - new computer, one honest answer
#  Ampol Tool Store (Lytton Refinery)
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Run me FIRST on any new machine, or any time something says it
#  "cannot access" a file. I check the things that actually break a
#  new setup - every workbook really being in Data\ (and really on
#  this disk, not a OneDrive cloud-only placeholder), Python's
#  libraries, Excel, and a browser for the PDFs - and I say in plain
#  words what to fix.
# =====================================================================
import glob
import os
import sys

import ampol_paths  # WHY (12 Aug 2026): every input lives in the one Data area

HERE = ampol_paths.suite_dir()
DATA = ampol_paths.data_dir()
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
            problems.append("{} is missing from Data\\.".format(what))
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
        #  lock file, a read-only flag or old NTFS permissions.
        #  WHY (12 Aug 2026): no separate fix button in this suite -
        #  the read-only sweep at the top of this check clears the
        #  usual cause, so the advice is to run me again.
        say(BAD, "{} is PERMISSION DENIED - {}".format(what, name))
        problems.append(
            "{} is blocked by Windows (permission denied). Close Excel, "
            "run 10_CHECK_MY_SETUP.bat again (it clears the read-only "
            "flag), and if it still shows: right-click the suite folder "
            "> Properties > untick Read-only > apply to all subfolders "
            "and files.".format(what))
        return False
    except Exception as e:
        say(BAD, "{} CANNOT BE READ - {} ({})".format(what, name, e))
        problems.append("{} exists but will not open: {}".format(what, e))
        return False
    say(OK, "{} - {} ({:,} KB)".format(what, name, size // 1024))
    return True


#  Every Excel the suite reads, all living in Data\ - the one area.
#  (patterns tried in order, plain-words name, what degrades without it)
# WHY (03 Sep 2026): the three .xlsm workbooks are no longer expected -
# no report reads them (button 14 parks them in Data\_Archive_workbooks).
EXPECTED = [
    # (patterns, plain-words name, what degrades without it, legacy?)
    # WHY (03 Sep 2026, Andrew): two folders under Data - the three SiteIQ
    # pulls in Data\SiteIQ, everything Andrew edits in Data\Editable, and
    # ONE master workbook in place of the four small files. A legacy file
    # is only wanted while the master does not exist (button 16 builds it).
    (("RENTAL_STOCK*.xlsx",), "SiteIQ RENTAL_STOCK export (Data\SiteIQ)",
     "tooling, radio and stocktake reports run on stale gear positions", False),
    (("STOCKTAKE*.xlsx",), "SiteIQ STOCKTAKE export (Data\SiteIQ)",
     "the stocktake compliance report and tooling compliance pages", False),
    (("TRANSACTIONS*.xlsx",), "SiteIQ TRANSACTIONS export (Data\SiteIQ)",
     "tooling charge pages and the gas monitor analytics pages", False),
    (("Ampol_Master*.xlsx",), "Master workbook - descriptions, pricing, serials (Data\Editable)",
     "the four legacy files are read instead - run 16_TIDY_DATA_FOLDER to build it", False),
    (("Gas_Monitor_Serial_Numbers*.xlsx",), "Gas serial lookup (legacy)",
     "gas reports lose the serial-number matching", True),
    (("radio_register*.xlsx",), "Radio serial register (legacy)",
     "the radio report loses its serial joins", True),
    (("Tooling_Description_Mapping*.xlsx",), "Tooling description map (legacy)",
     "tooling reports fall back to raw SiteIQ descriptions", True),
    (("Ampol_ToolStore_Pricing*.xlsx",), "Pricing master (legacy)",
     "tooling and stocktake reports lose their value figures", True),
    (("New_Descriptions*.xlsx",), "Description corrections (legacy)",
     "the stocktake report loses Andrew's description fixes", True),
    (("Ampol_Calibration_Register*.xlsx",), "Calibration register (Data\Editable)",
     "the calibration report (06) cannot build at all", False),
    (("Rigging Register*.xlsx", "Rigging*Register*.xlsx"), "Rigging register (Data\Editable)",
     "the rigging report (07) cannot build at all", False),
]


def find_ci(*patterns):
    """ampol_paths.find_data, but case-blind.
    WHY (12 Aug 2026): the gas workbook is saved as 'Ampol Gas Monitor
    Report.xlsm' and the engines match it as *gas monitor*.xlsm. On
    Windows that just works; anywhere else glob minds its capitals and
    the check would cry wolf about a file that is sitting right there.
    Same rules as find_data - newest wins, ~$ locks and Source_
    archives are never candidates."""
    import fnmatch
    for pat in patterns:
        hits = []
        for folder in ampol_paths.data_dirs():
            for n in os.listdir(folder):
                if n.startswith("~$") or n.lower().startswith("source_"):
                    continue
                p = os.path.join(folder, n)
                if os.path.isfile(p) and fnmatch.fnmatch(n.lower(), pat.lower()):
                    hits.append(p)
        if hits:
            hits.sort(key=os.path.getmtime, reverse=True)
            return hits[0]
    return ""


def main():
    print("=" * 62)
    print(" COATES | CHECK MY SETUP - Ampol Tool Store (Lytton)")
    print(" Folder: " + HERE)
    print("=" * 62)

    # ---- 0. is this folder itself marked read-only? ----------------------
    #  A folder copied from another machine carries Read-only with it
    #  and hands it to every file inside - the classic new-laptop
    #  "permission denied". The check can simply fix it: clear the
    #  attribute on the folder and everything in it, then prove it took.
    if os.name == "nt":
        try:
            import ctypes
            a = ctypes.windll.kernel32.GetFileAttributesW(str(HERE))
            if a != -1 and (a & 0x1):     # FILE_ATTRIBUTE_READONLY
                say(BAD, "THIS FOLDER is marked READ-ONLY - fixing it "
                         "for you now...")
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

    # ---- 0b. living under OneDrive? --------------------------------------
    #  The suite RUNS fine under OneDrive - IF the folder is pinned to
    #  the device and the workbooks' AutoSave is off. Unpinned, OneDrive
    #  keeps files as cloud-only placeholders that Excel and Python both
    #  fail on, and it can lock files mid-run while it syncs.
    if "onedrive" in HERE.lower():
        say(WARN, "This folder lives under OneDrive - three settings "
                  "keep it safe:")
        print("        1. Right-click this suite folder in Explorer >")
        print("           'Always keep on this device' - so every file is")
        print("           really on the disk, not a cloud placeholder.")
        print("        2. In Excel, AutoSave OFF for the report workbooks")
        print("           in Data\\ - AutoSave moves them out from under")
        print("           the suite.")
        print("        3. Move old dated folders from Reports\\ into")
        print("           _Archive\\ now and then - keeps OneDrive from")
        print("           syncing gigabytes of old days.")

    # ---- 0c. leftover Excel lock files in Data ----------------------------
    #  A copied folder brings the hidden ~$ lock markers with it, and
    #  Excel then swears a workbook is "locked for editing by you". If
    #  Excel isn't running, the markers are stale and safe to remove -
    #  so remove them. WHY (12 Aug 2026): the locks live where the
    #  workbooks live, and in this suite that is Data\.
    locks = [f for d in ampol_paths.data_dirs() for f in glob.glob(os.path.join(d, "~$*.xls*"))]
    if locks and os.name == "nt":
        import subprocess
        try:
            r = subprocess.run(["tasklist", "/FI", "IMAGENAME eq EXCEL.EXE"],
                               capture_output=True, text=True, timeout=30)
            excel_running = "EXCEL.EXE" in (r.stdout or "").upper()
        except Exception:
            excel_running = True     # can't tell - don't touch them
        if excel_running:
            say(WARN, "{} Excel lock file(s) in Data\\ and Excel is open - "
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
    elif locks:
        say(WARN, "{} Excel lock file(s) (~$...) in Data\\ - close Excel "
                  "and delete them if a workbook claims to be locked."
                  .format(len(locks)))

    # ---- 1. every Excel the reports read ----------------------------------
    #  Missing is a WARN, not a STOP - each report says plainly what it
    #  could not find and the rest of the suite still runs.
    print("-" * 62)
    master_here = bool(ampol_paths.find_data("Ampol_Master*.xlsx") or find_ci("Ampol_Master*.xlsx"))
    for patterns, what, degrades, legacy in EXPECTED:
        hit = ampol_paths.find_data(*patterns) or find_ci(*patterns)
        if hit and legacy and master_here:
            say(WARN, "{} still in Data - the master workbook carries it now; "
                      "run 16_TIDY_DATA_FOLDER to park it".format(what))
        elif hit:
            check_file(hit, what)
        elif legacy and master_here:
            say(OK, "{} not needed - the master workbook carries it".format(what))
        else:
            say(WARN, "{} not in Data - {}".format(what, degrades))
    layout = ("two-folder layout (Data\\SiteIQ + Data\\Editable)" if os.path.isdir(ampol_paths.SITEIQ)
              else "single Data folder - run 16_TIDY_DATA_FOLDER when ready")
    say(OK, "Data layout: " + layout)

    # ---- 2. python's libraries --------------------------------------------
    print("-" * 62)
    say(OK, "Python {}.{}.{}".format(*sys.version_info[:3]))
    for mod, why in [("openpyxl", "reading the Excel exports and lookup files"),
                     ("PIL", "sharper report images (optional)"),
                     ("pymupdf", "PDF bookmarks and Author properties (optional - pip install pymupdf)")]:
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

    # ---- 3. Excel + a browser ---------------------------------------------
    if os.name == "nt":
        try:
            import winreg
            winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, "Excel.Application")
            say(OK, "Microsoft Excel is installed (handy for the lookup "
                    "files; no report needs a refresh)")
        except Exception:
            say(WARN, "Microsoft Excel NOT found - fine, every report "
                      "counts from the SiteIQ exports without it")
    b = find_browser()
    if b:
        say(OK, "Browser for the print PDFs - " + os.path.basename(b))
    else:
        say(WARN, "No Edge/Chrome found - reports build as HTML, no PDFs")

    # ---- verdict ----------------------------------------------------------
    print("=" * 62)
    if not problems:
        print(" ALL GOOD. This machine is ready - run the morning as normal.")
        return 0
    print(" {} thing(s) to fix, in plain words:".format(len(problems)))
    for i, p in enumerate(problems, 1):
        print("   {}. {}".format(i, p))
    print("=" * 62)
    return 1


def find_browser():
    """Edge or Chrome, wherever this machine keeps it - the same probe
    the report engines use for their print PDFs."""
    import shutil
    if os.name == "nt":
        for env, tail in (("ProgramFiles(x86)",
                           r"Microsoft\Edge\Application\msedge.exe"),
                          ("ProgramFiles",
                           r"Microsoft\Edge\Application\msedge.exe"),
                          ("LocalAppData",
                           r"Microsoft\Edge\Application\msedge.exe"),
                          ("ProgramFiles(x86)",
                           r"Google\Chrome\Application\chrome.exe"),
                          ("ProgramFiles",
                           r"Google\Chrome\Application\chrome.exe")):
            base = os.environ.get(env, "")
            if base and os.path.isfile(os.path.join(base, tail)):
                return os.path.join(base, tail)
    for name in ("msedge", "chrome", "chromium", "chromium-browser",
                 "google-chrome"):
        p = shutil.which(name)
        if p:
            return p
    return None


if __name__ == "__main__":
    sys.exit(main())
