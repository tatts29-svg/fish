"""
COATES | K2 REPORTING SUITE - FIX THIS MACHINE
Author: Andrew Fisher | POWERED BY SITEIQ

What this is for
----------------
The suite was set up on the old laptop, where everything lived at

    C:\\01_Reporting_Suite\\

On the new work laptop it lives under the Coates OneDrive instead:

    C:\\Users\\andrew.fisher\\OneDrive - Coates Hire Operations Pty Limited\\
        Desktop\\Cement\\01_Reporting_Suite

The workbook's Power Query connections still point at the old C:\\ path.
That folder does not exist here, so every query fails and the align run
prints "connection refused a direct refresh" for the lot of them.

This script re-points the machine, not the workbook. It is deliberately
the low-risk way round: it builds a directory junction so the old path
starts working again, rather than cutting into the .xlsm.

Run it with --check first if you want to see what it would do.

Safe to run twice. Nothing is deleted. Anything edited is backed up to
Updates\\machine_fix_backups\\<timestamp>\\ first.
"""

import argparse
import datetime
import os
import shutil
import subprocess
import sys

BRAND = "Author: Andrew Fisher | POWERED BY SITEIQ"
LEGACY_ROOT = r"C:\01_Reporting_Suite"
SUITE_DIRNAME = "01_Reporting_Suite"

# Files that tell us we have found the real suite and not a lookalike folder.
MARKERS = (
    "_align_prep.py",
    "28_PULL_SITEIQ_EXPORTS.bat",
    "BUILD_MY_GEAR.py",
)

# Folders the suite expects to exist under the suite root. MACHINE.txt flagged
# Reports and K2 DAILY REPORTING as "[not there yet]" on this laptop.
EXPECTED_FOLDERS = (
    "Data_SiteIQ",
    "Reports",
    "K2 DAILY REPORTING",
    "Gear_Lookup",
    "Updates",
    os.path.join("Updates", "report_archives"),
)

# Never rewrite anything living under these - they are history, not config.
SKIP_DIRS = {
    ".git",
    "report_archives",
    "excel_backups",
    "machine_fix_backups",
    "__pycache__",
    "reports",
}

# Only these get scanned for a hardcoded old path.
CONFIG_SUFFIXES = (".bat", ".cmd", ".py", ".ps1", ".ini", ".cfg", ".txt", ".json", ".env")

# Files that legitimately contain the old path and must never be rewritten.
# This kit names the old path on purpose - rewriting itself would break the
# fix permanently, and rewriting MACHINE.txt would destroy the one line that
# proves the bridge is in place.
SKIP_FILES = {
    "fix_this_machine.py",
    "fix_this_machine.bat",
    "machine.txt",
    "readme.txt",
}

# Windows file attributes that mean "OneDrive has not actually downloaded this".
FILE_ATTRIBUTE_OFFLINE = 0x00001000
FILE_ATTRIBUTE_RECALL_ON_OPEN = 0x00040000
FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS = 0x00400000
CLOUD_ONLY_MASK = (
    FILE_ATTRIBUTE_OFFLINE
    | FILE_ATTRIBUTE_RECALL_ON_OPEN
    | FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS
)

STEPS = 7
_step_no = 0
_notes = []


def step(title):
    global _step_no
    _step_no += 1
    print("")
    print("[%d/%d] %s" % (_step_no, STEPS, title))


def say(label, message):
    print("  %-10s: %s" % (label, message))


def flag(message):
    """Something Andrew needs to read, collected for the summary at the end."""
    _notes.append(message)
    print("  !          %s" % message)


def banner():
    stamp = datetime.datetime.now().strftime("%d %b %Y %H:%M")
    print("=" * 64)
    print(" COATES | K2 REPORTING SUITE - FIX THIS MACHINE")
    print(" Run: %s" % stamp)
    print(" %s" % BRAND)
    print("=" * 64)


# ----------------------------------------------------------------------
# Finding things
# ----------------------------------------------------------------------

def looks_like_suite(path):
    if not os.path.isdir(path):
        return False
    try:
        names = {n.lower() for n in os.listdir(path)}
    except OSError:
        return False
    if any(m.lower() in names for m in MARKERS):
        return True
    # Fall back on shape: the data folder plus one other known folder.
    return "data_siteiq" in names and ("gear_lookup" in names or "updates" in names)


def find_suite(explicit=None):
    """Locate the suite root. Walk up from wherever this script is sitting."""
    if explicit:
        target = os.path.abspath(explicit)
        if looks_like_suite(target):
            return target
        raise SystemExit(
            "  That path does not look like the reporting suite:\n    %s\n"
            "  Expecting a folder holding Data_SiteIQ and the suite scripts." % target
        )

    here = os.path.dirname(os.path.abspath(__file__))
    candidates = []

    # Walk up from the script, then check each level's 01_Reporting_Suite child.
    node = here
    while True:
        candidates.append(node)
        candidates.append(os.path.join(node, SUITE_DIRNAME))
        parent = os.path.dirname(node)
        if parent == node:
            break
        node = parent

    # Then the usual places on a Coates laptop.
    home = os.path.expanduser("~")
    for onedrive in _onedrive_roots(home):
        candidates.append(os.path.join(onedrive, "Desktop", "Cement", SUITE_DIRNAME))
        candidates.append(os.path.join(onedrive, "Desktop", "Cem2026"))
    candidates.append(os.path.join(home, "Desktop", "Cement", SUITE_DIRNAME))
    candidates.append(LEGACY_ROOT)

    for path in candidates:
        if looks_like_suite(path):
            # If we are standing inside the junction, resolve to the real folder
            # so we never point a junction at itself.
            return os.path.realpath(path)

    raise SystemExit(
        "  Could not find the reporting suite.\n"
        "  Put this script inside the 01_Reporting_Suite folder and run it again,\n"
        "  or run:  FIX_THIS_MACHINE.bat --suite \"<full path to 01_Reporting_Suite>\""
    )


def _onedrive_roots(home):
    """Every OneDrive folder in the profile - the Coates one has a long name."""
    roots = []
    for key in ("OneDriveCommercial", "OneDrive"):
        value = os.environ.get(key)
        if value and os.path.isdir(value):
            roots.append(value)
    try:
        for name in os.listdir(home):
            if name.lower().startswith("onedrive"):
                full = os.path.join(home, name)
                if os.path.isdir(full) and full not in roots:
                    roots.append(full)
    except OSError:
        pass
    return roots


# ----------------------------------------------------------------------
# Junction handling
# ----------------------------------------------------------------------

def link_target(path):
    """Return the target if path is a junction/symlink, else None."""
    try:
        return os.readlink(path)
    except (OSError, ValueError, NotImplementedError):
        return None


def make_junction(link, target, check_only):
    """Point the old hardcoded path at the real suite folder.

    A junction is used rather than a symlink because junctions do not need
    administrator rights, and rather than editing the .xlsm because the
    workbook stays untouched and this is reversible with one rmdir.
    """
    existing = link_target(link)
    if existing:
        if os.path.normcase(os.path.normpath(existing.rstrip("\\"))) == os.path.normcase(
            os.path.normpath(target.rstrip("\\"))
        ):
            say("Junction", "already correct -> %s" % existing)
            return True
        flag("%s is a junction to the wrong place:" % link)
        flag("    it points at  %s" % existing)
        flag("    it should be  %s" % target)
        flag("    remove it with:  rmdir \"%s\"   then run this again" % link)
        return False

    if os.path.isdir(link):
        # A real folder is sitting there. Do not touch it - that would be
        # deleting whatever is inside.
        try:
            contents = os.listdir(link)
        except OSError:
            contents = []
        flag("%s already exists as a real folder (%d items)." % (link, len(contents)))
        flag("    Not touching it. If it is an old copy of the suite, rename it")
        flag("    and run this again so the junction can be made.")
        return False

    if check_only:
        say("Junction", "WOULD create %s -> %s" % (link, target))
        return True

    result = subprocess.run(
        ["cmd", "/c", "mklink", "/J", link, target],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        say("Junction", "created %s -> %s" % (link, target))
        return True

    detail = (result.stderr or result.stdout or "").strip().splitlines()
    detail = detail[-1] if detail else "no message from mklink"
    flag("Could not create the junction at %s" % link)
    flag("    Windows said: %s" % detail)
    flag("    This usually means the C:\\ root is locked down on this laptop.")
    flag("    Right-click FIX_THIS_MACHINE.bat -> Run as administrator, or ask IT.")
    return False


# ----------------------------------------------------------------------
# OneDrive placeholders
# ----------------------------------------------------------------------

def is_cloud_only(path):
    try:
        attrs = os.stat(path, follow_symlinks=False).st_file_attributes
    except (OSError, AttributeError):
        return False
    return bool(attrs & CLOUD_ONLY_MASK)


def pin_local(path, check_only):
    """Ask OneDrive to keep the file on disk. Power Query cannot refresh from
    a placeholder that has not been downloaded."""
    if check_only:
        return True
    result = subprocess.run(
        ["cmd", "/c", "attrib", "-U", "+P", path],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


# ----------------------------------------------------------------------
# Config repointing
# ----------------------------------------------------------------------

def backup_dir(suite, check_only):
    stamp = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    path = os.path.join(suite, "Updates", "machine_fix_backups", stamp)
    if not check_only:
        os.makedirs(path, exist_ok=True)
    return path


def scan_and_repoint(suite, check_only, backups):
    """Find files that hardcode the old C:\\01_Reporting_Suite path and point
    them at this machine's real suite folder."""
    legacy_lower = LEGACY_ROOT.lower()
    touched = 0
    scanned = 0
    myself = os.path.normcase(os.path.abspath(__file__))

    for root, dirs, files in os.walk(suite):
        dirs[:] = [d for d in dirs if d.lower() not in SKIP_DIRS]
        for name in files:
            if not name.lower().endswith(CONFIG_SUFFIXES):
                continue
            if name.lower() in SKIP_FILES:
                continue
            full = os.path.join(root, name)
            # Belt and braces: never rewrite this script, wherever it sits.
            if os.path.normcase(os.path.abspath(full)) == myself:
                continue
            try:
                if os.path.getsize(full) > 2_000_000:
                    continue
            except OSError:
                continue
            scanned += 1
            try:
                # newline="" keeps CRLF intact - without it Python folds line
                # endings to \n on read and the .bat files go back Unix-style,
                # which breaks goto labels in cmd.
                with open(full, "r", encoding="utf-8-sig", errors="strict",
                          newline="") as fh:
                    text = fh.read()
            except (OSError, UnicodeDecodeError):
                continue
            if legacy_lower not in text.lower():
                continue

            rel = os.path.relpath(full, suite)
            if check_only:
                say("Would fix", rel)
                touched += 1
                continue

            # Back the file up before touching it, keeping its folder shape.
            dest = os.path.join(backups, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy2(full, dest)

            # Case-insensitive replace, preserving everything else byte for byte.
            out = []
            low = text.lower()
            i = 0
            while True:
                j = low.find(legacy_lower, i)
                if j == -1:
                    out.append(text[i:])
                    break
                out.append(text[i:j])
                out.append(suite)
                i = j + len(LEGACY_ROOT)
            new_text = "".join(out)

            with open(full, "w", encoding="utf-8", newline="") as fh:
                fh.write(new_text)
            say("Repointed", rel)
            touched += 1

    return scanned, touched


# ----------------------------------------------------------------------
# MACHINE.txt
# ----------------------------------------------------------------------

def disk_free(path):
    try:
        usage = shutil.disk_usage(path)
    except OSError:
        return "unknown"
    gb = 1024 ** 3
    return "%d GB of %d GB" % (usage.free // gb, usage.total // gb)


def write_machine_txt(suite, check_only):
    stamp = datetime.datetime.now().strftime("%d %b %Y - %H:%M")
    home = os.path.expanduser("~")
    downloads = os.path.join(home, "Downloads")

    def mark(path):
        return path if os.path.isdir(path) else path + "   [not there yet]"

    lines = [
        "COATES K2 REPORTING SUITE - MACHINE DETAILS",
        "",
        "Machine     : Work Laptop",
        "Recorded    : %s" % stamp,
        "",
        "WINDOWS SAYS",
        "  Computer  : %s" % os.environ.get("COMPUTERNAME", "unknown"),
        "  Signed in : %s" % os.environ.get("USERNAME", "unknown"),
        "  Home      : %s" % home,
        "",
        "WHERE THINGS ARE ON THIS MACHINE",
        "  Suite     : %s" % suite,
        "  Downloads : %s" % downloads,
        "              ^ 28_PULL_SITEIQ_EXPORTS.bat reads from here",
        "  SiteIQ in : %s" % mark(os.path.join(suite, "Data_SiteIQ")),
        "  Reports   : %s" % mark(os.path.join(suite, "Reports")),
        "  Filed     : %s" % mark(os.path.join(suite, "K2 DAILY REPORTING")),
        "  My Gear   : %s" % mark(os.path.join(suite, "Gear_Lookup")),
        "  Archives  : %s" % mark(os.path.join(suite, "Updates", "report_archives")),
        "",
        "OLD PATH BRIDGE",
    ]

    target = link_target(LEGACY_ROOT)
    if target:
        lines.append("  %s -> %s" % (LEGACY_ROOT, target))
    elif os.path.isdir(LEGACY_ROOT):
        lines.append("  %s exists as a real folder (not a junction)" % LEGACY_ROOT)
    else:
        lines.append("  %s   [not there - queries using it will fail]" % LEGACY_ROOT)

    lines += [
        "",
        "PYTHON",
        "  Version   : %d.%d.%d" % sys.version_info[:3],
        "  Runs from : %s" % sys.executable,
        "",
        "DISK (the drive the suite is on)",
        "  Free      : %s" % disk_free(suite),
        "",
        "Send this file up and there is no question which machine it is.",
        "",
    ]

    out = os.path.join(suite, "MACHINE.txt")
    if check_only:
        say("MACHINE", "would refresh %s" % out)
        return out
    with open(out, "w", encoding="utf-8", newline="\r\n") as fh:
        fh.write("\n".join(lines))
    say("MACHINE", "refreshed %s" % out)
    return out


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Re-point the K2 Reporting Suite at this machine."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="show what would change without changing anything",
    )
    parser.add_argument(
        "--suite",
        default=None,
        help="full path to 01_Reporting_Suite if it cannot be found automatically",
    )
    args = parser.parse_args()

    banner()
    if args.check:
        print(" CHECK ONLY - nothing on this machine will be changed.")
        print("=" * 64)

    if os.name != "nt":
        print("")
        print("  This is a Windows fix - it needs to run on the laptop itself.")
        return 2

    # 1 ---------------------------------------------------------------
    step("FIND THE SUITE")
    suite = find_suite(args.suite)
    say("Suite", suite)
    say("Computer", os.environ.get("COMPUTERNAME", "unknown"))
    say("Signed in", os.environ.get("USERNAME", "unknown"))
    say("Python", "%d.%d.%d" % sys.version_info[:3])
    if os.path.normcase(suite).startswith(os.path.normcase(LEGACY_ROOT)):
        say("Note", "suite already lives at the old path - nothing to bridge")

    backups = backup_dir(suite, args.check)

    # 2 ---------------------------------------------------------------
    step("MAKE THE MISSING FOLDERS")
    made = 0
    for rel in EXPECTED_FOLDERS:
        full = os.path.join(suite, rel)
        if os.path.isdir(full):
            say("Have", rel)
            continue
        if args.check:
            say("Would make", rel)
        else:
            os.makedirs(full, exist_ok=True)
            say("Made", rel)
        made += 1
    if not made:
        say("Folders", "all present")

    # 3 ---------------------------------------------------------------
    step("BRIDGE THE OLD C:\\ PATH")
    say("Old path", LEGACY_ROOT)
    say("Points to", suite)
    bridged = make_junction(LEGACY_ROOT, suite, args.check)

    # 4 ---------------------------------------------------------------
    step("REPOINT ANY HARDCODED PATHS")
    scanned, touched = scan_and_repoint(suite, args.check, backups)
    say("Scanned", "%d config/script files" % scanned)
    if touched:
        say("Changed", "%d file(s)" % touched)
        if not args.check:
            say("Backups", backups)
    else:
        say("Changed", "none - nothing hardcodes the old path")

    # 5 ---------------------------------------------------------------
    step("CHECK ONEDRIVE HAS THE FILES ON DISK")
    # Power Query cannot open a OneDrive placeholder. On a new laptop this is
    # the second thing that breaks a refresh, after the path.
    cloud = []
    for rel in ("", "Data_SiteIQ"):
        folder = os.path.join(suite, rel) if rel else suite
        if not os.path.isdir(folder):
            continue
        try:
            names = os.listdir(folder)
        except OSError:
            continue
        for name in names:
            full = os.path.join(folder, name)
            if not os.path.isfile(full):
                continue
            if name.lower().endswith((".xlsm", ".xlsx", ".csv")) and is_cloud_only(full):
                cloud.append(full)
    if not cloud:
        say("OneDrive", "workbook and exports are on disk")
    else:
        say("OneDrive", "%d file(s) are cloud-only and cannot be refreshed" % len(cloud))
        pinned = 0
        for full in cloud:
            if pin_local(full, args.check):
                pinned += 1
            say("Pinned" if not args.check else "Would pin", os.path.basename(full))
        if not args.check and pinned < len(cloud):
            flag("Some files would not pin. In File Explorer, right-click the")
            flag("    01_Reporting_Suite folder and choose 'Always keep on this device'.")

    # 6 ---------------------------------------------------------------
    step("VERIFY")
    ok = True

    workbooks = []
    for folder in (suite, os.path.join(suite, "Reports")):
        if os.path.isdir(folder):
            workbooks += [
                n for n in os.listdir(folder) if n.lower().endswith((".xlsm", ".xlsb"))
            ]
    if workbooks:
        say("Workbook", ", ".join(sorted(set(workbooks))[:3]))
    else:
        say("Workbook", "none found in the suite root")
        flag("No .xlsm found. Check the workbook has synced down from OneDrive.")
        ok = False

    probe = os.path.join(LEGACY_ROOT, "Data_SiteIQ")
    if os.path.isdir(probe):
        say("Old path", "resolves - %s is readable" % probe)
    else:
        say("Old path", "does NOT resolve yet")
        if bridged and args.check:
            say("Note", "expected in check mode - the junction was not made")
        else:
            ok = False

    exports = os.path.join(suite, "Data_SiteIQ")
    if os.path.isdir(exports):
        count = len([n for n in os.listdir(exports) if n.lower().endswith((".xlsx", ".csv"))])
        say("Exports", "%d file(s) in Data_SiteIQ" % count)
        if count == 0:
            flag("Data_SiteIQ is empty - run 28_PULL_SITEIQ_EXPORTS.bat before aligning.")

    # 7 ---------------------------------------------------------------
    step("WRITE MACHINE.TXT")
    machine_file = write_machine_txt(suite, args.check)

    # Summary ---------------------------------------------------------
    print("")
    print("=" * 64)
    if args.check:
        print(" CHECK COMPLETE - nothing was changed.")
        print(" Run FIX_THIS_MACHINE.bat with no options to apply it.")
    elif ok and not _notes:
        print(" MACHINE FIXED.")
        print("")
        print(" Open the workbook and run the align again. The queries that")
        print(" were refusing should now refresh - they were pointing at")
        print(" %s, which now leads here." % LEGACY_ROOT)
    else:
        print(" PARTLY DONE - read the ! lines above.")
    if _notes:
        print("")
        print(" Needs your eyes:")
        for note in _notes:
            print("   - %s" % note)
    print("")
    print(" Machine details : %s" % machine_file)
    print(" %s" % BRAND)
    print("=" * 64)
    return 0 if ok else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except KeyboardInterrupt:
        print("\n  Stopped.")
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001 - a stack trace at 05:00 is not a message
        print("")
        print("  Something went wrong and the fix did not finish.")
        print("  %s: %s" % (type(exc).__name__, exc))
        print("")
        print("  Nothing was deleted. Send this window up with MACHINE.txt.")
        sys.exit(1)
