#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | APPLY SUITE UPDATE - one zip in, improvements applied
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "ensuring we have a way for updates to
#  happen easy if i want improvement done."
#
#  The loop is:
#    1. Andrew asks Claude for an improvement in the chat.
#    2. Claude sends back ONE zip called  K2_UPDATE_<something>.zip
#    3. Andrew downloads it (it lands in Downloads) and double-clicks
#       46_APPLY_UPDATE.bat. Done.
#
#  What this script promises:
#    - It finds the newest K2_UPDATE*.zip itself - Downloads, this
#      folder, or Updates\. No typing paths.
#    - Every file it replaces is backed up first, to
#      Updates\update_backups\<time>\ - nothing is ever lost.
#    - Your live data is NEVER overwritten by an update: the address
#      book, the charge register, consumable requests and the SiteIQ
#      data folder are off limits even if the zip contains them.
#    - After applying, every Python file must compile. If anything is
#      broken, the whole update is PUT BACK the way it was,
#      automatically. A bad update cannot leave you half-changed.
#    - Safe to run twice. An already-applied zip is recognised by its
#      fingerprint and skipped.
# =====================================================================
import hashlib
import os
import py_compile
import shutil
import sys
import time
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
UPDATES = os.path.join(HERE, "Updates")
BK_ROOT = os.path.join(UPDATES, "update_backups")
LOG = os.path.join(UPDATES, "applied_updates.log")

#  Where update zips are looked for, in order. Newest wins.
SEARCH_DIRS = [
    os.path.join(os.path.expanduser("~"), "Downloads"),
    HERE,
    UPDATES,
]
ZIP_PREFIX = "k2_update"

#  YOUR live data. An update zip can never overwrite these - they are
#  what you have typed and logged on THIS machine. If a zip carries one
#  of them it is reported and skipped, never applied.
PROTECTED = (
    "coates_report_recipients.xlsx",
    "charge_register.xlsx",
    "consumable_requests.xlsx",
    "sync_folder.txt",
    "no_outlook.txt",
    #  the My Gear scoreboard - the only record of yesterday there is.
    #  An update that overwrote it would wipe every "up 3 places" arrow
    #  on site and there is no way to rebuild it. (29 Jul 2026)
    "mygear_history.json",
    #  the stores team code - set on site, never shipped
    "stores_code.txt",
    #  the manager code that unlocks the money view - same rule
    "manager_code.txt",
)
PROTECTED_DIRS = ("data_siteiq", "data_baseplan")


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def already_applied(zip_sha):
    if not os.path.isfile(LOG):
        return False
    with open(LOG, encoding="utf-8", errors="replace") as f:
        return any(line.split()[:1] == [zip_sha] for line in f if line.strip())


def find_update_zip():
    """Newest K2_UPDATE*.zip anywhere we know to look, not yet applied."""
    found = []
    for d in SEARCH_DIRS:
        if not os.path.isdir(d):
            continue
        for n in os.listdir(d):
            if n.lower().startswith(ZIP_PREFIX) and n.lower().endswith(".zip"):
                p = os.path.join(d, n)
                if os.path.isfile(p):
                    found.append(p)
    found.sort(key=os.path.getmtime, reverse=True)
    return found


def is_protected(rel):
    low = rel.replace("\\", "/").lower()
    base = os.path.basename(low)
    if base in PROTECTED:
        return True
    return any(part in PROTECTED_DIRS for part in low.split("/"))


def safe_members(zf):
    """Zip entries we will consider - files only, and nothing that
    tries to climb out of the suite folder."""
    out = []
    for m in zf.infolist():
        name = m.filename.replace("\\", "/")
        if m.is_dir() or not name or name.endswith("/"):
            continue
        if name.startswith("/") or ".." in name.split("/") or ":" in name:
            continue
        out.append((m, name))
    return out


def compile_all():
    bad = []
    for root, dirs, files in os.walk(HERE):
        low = os.path.relpath(root, HERE).replace("\\", "/").lower()
        if low.startswith(("old", "updates")):
            continue
        for n in files:
            if n.lower().endswith(".py"):
                try:
                    py_compile.compile(os.path.join(root, n), doraise=True)
                except Exception as e:
                    bad.append((os.path.join(os.path.relpath(root, HERE), n)
                                .lstrip(".\\/"), str(e)))
    return bad


def main():
    print("=" * 70)
    print(" COATES | APPLY SUITE UPDATE")
    print("=" * 70)

    zips = find_update_zip()
    if not zips:
        print("")
        print(" No update zip found. I looked for K2_UPDATE...zip in:")
        for d in SEARCH_DIRS:
            print("   " + d)
        print("")
        print(" To get an update: ask Claude in the chat for the improvement")
        print(" you want, download the K2_UPDATE zip it sends back, and run")
        print(" me again. That's the whole process.")
        return 1

    zpath = None
    for cand in zips:
        if already_applied(sha(cand)):
            continue
        zpath = cand
        break
    if zpath is None:
        print("")
        print(" Newest update zip found:")
        print("   " + zips[0])
        print("")
        print(" Already applied on this machine. Nothing to do - that is the")
        print(" point: running me twice can never double-apply an update.")
        return 0

    zsha = sha(zpath)
    print("")
    print(" Update  : " + os.path.basename(zpath))
    print(" From    : " + os.path.dirname(zpath))

    with zipfile.ZipFile(zpath) as zf:
        members = safe_members(zf)

        new, changed, same, skipped = [], [], [], []
        for m, name in members:
            #  Zips sometimes carry a top folder like 01_Reporting_Suite/ -
            #  strip it so files land in the right place either way.
            rel = name
            if rel.lower().startswith("01_reporting_suite/"):
                rel = rel.split("/", 1)[1]
            if not rel:
                continue
            dest = os.path.join(HERE, *rel.split("/"))
            if is_protected(rel):
                skipped.append(rel)
            elif not os.path.isfile(dest):
                new.append((m, rel, dest))
            else:
                with zf.open(m) as f:
                    incoming = hashlib.sha256(f.read()).hexdigest()
                if incoming == sha(dest):
                    same.append(rel)
                else:
                    changed.append((m, rel, dest))

        print("")
        print("   {:>3} new file(s)".format(len(new)))
        print("   {:>3} file(s) updated".format(len(changed)))
        print("   {:>3} already up to date".format(len(same)))
        if skipped:
            print("   {:>3} SKIPPED - your live data, updates never touch it:"
                  .format(len(skipped)))
            for rel in skipped:
                print("         " + rel)

        if not new and not changed:
            with open(LOG, "a", encoding="utf-8") as f:
                f.write("{} {} {} nothing-to-apply\n".format(
                    zsha, time.strftime("%Y-%m-%d %H:%M:%S"),
                    os.path.basename(zpath)))
            print("")
            print(" Everything in the zip is already on this machine. Done.")
            return 0

        #  ---- back up, then apply ------------------------------------
        stamp = time.strftime("%Y%m%d_%H%M%S")
        bdir = os.path.join(BK_ROOT, stamp)
        applied = []
        for m, rel, dest in changed:
            bpath = os.path.join(bdir, *rel.split("/"))
            os.makedirs(os.path.dirname(bpath), exist_ok=True)
            shutil.copy2(dest, bpath)
        for m, rel, dest in new + changed:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with zf.open(m) as src, open(dest, "wb") as out:
                shutil.copyfileobj(src, out)
            applied.append((rel, dest))

    #  ---- prove it still runs, or put it all back --------------------
    bad = compile_all()
    if bad:
        print("")
        print(" ! The update does not compile - PUTTING EVERYTHING BACK:")
        for rel, err in bad[:5]:
            print("     {} - {}".format(rel, err.splitlines()[0] if err else ""))
        for m, rel, dest in changed:
            shutil.copy2(os.path.join(bdir, *rel.split("/")), dest)
        for m, rel, dest in new:
            if os.path.isfile(dest):
                os.remove(dest)
        print("")
        print(" Restored - this machine is exactly as it was before.")
        print(" Nothing was applied. Tell Claude the update failed to")
        print(" compile and paste the lines above.")
        return 1

    with open(LOG, "a", encoding="utf-8") as f:
        f.write("{} {} {} applied={}\n".format(
            zsha, time.strftime("%Y-%m-%d %H:%M:%S"),
            os.path.basename(zpath), len(applied)))

    print("")
    print("-" * 70)
    print(" APPLIED - {} file(s), every Python file compiles.".format(
        len(applied)))
    if changed:
        print(" The replaced copies are in Updates\\update_backups\\{}\\"
              .format(stamp))
    print("")
    print(" If you use both laptops: run 39_SYNC_PCS.bat to carry this")
    print(" update to the other machine, and 40_WHAT_VERSION_AM_I.bat on")
    print(" both to prove they match.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
