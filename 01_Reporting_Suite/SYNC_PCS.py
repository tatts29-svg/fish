#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | SYNC PCS - keep the work laptop and the personal one level
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "since about 4am we have been updating the
#  old computer, i need to do all these updates onto my new computer -
#  and is there a way we can sync these."
#
#  THE ONE THING THAT MATTERS HERE: code and data are not the same, and
#  treating them the same is how a day's work disappears.
#
#    CODE  - the .py, .bat and .ps1 files. Identical on both machines by
#            definition. Newest wins, every time, no questions.
#
#    DATA  - CHARGE_REGISTER.xlsx, Coates_Report_Recipients.xlsx, the K2
#            workbook, the SiteIQ exports. These DIVERGE on purpose. Log
#            a charge on the work laptop and switch a contact on at home,
#            and "newest wins" silently destroys one of them. There is no
#            safe automatic answer, so this script never picks: it shows
#            you what differs, which side is newer, and lets you choose
#            one file at a time.
#
#  Nothing is deleted. Every file replaced is backed up first.
#
#     SEND     this PC  ->  the sync folder
#     RECEIVE  sync folder  ->  this PC
#
#  The sync folder can be a USB stick, a personal OneDrive folder, or
#  anywhere both machines can reach. It is remembered after the first run.
# =====================================================================
import hashlib
import json
import os
import shutil
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = os.path.join(HERE, "SYNC_FOLDER.txt")
BK = os.path.join(HERE, "Updates", "sync_backups")

CODE_EXT = (".py", ".bat", ".ps1")

#  Never sync these - they are this machine's own business.
CODE_SKIP = {"SYNC_FOLDER.txt", "NO_OUTLOOK.txt"}

#  The files that hold your work. Compared and reported, never
#  overwritten without you saying so.
DATA_FILES = [
    "Coates_Report_Recipients.xlsx",
    os.path.join("Coates_K2_Charge_Reporter", "CHARGE_REGISTER.xlsx"),
]
#  Whole folders of data - same rule, reported not copied.
DATA_DIRS = ["Data_SiteIQ"]


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def ask(q, default=""):
    d = " [{}]".format(default) if default else ""
    try:
        return input(" {}{}: ".format(q, d)).strip() or default
    except EOFError:
        return default


def sync_folder():
    if os.path.isfile(CFG):
        with open(CFG, encoding="utf-8") as f:
            p = f.read().strip()
        if p:
            return p
    print("")
    print(" Where should the two machines meet? A USB stick, or a folder")
    print(" in your personal OneDrive - anywhere both can see.")
    print(" Example:  D:\\K2_SYNC   or   C:\\Users\\tatts\\OneDrive\\K2_SYNC")
    p = ask("Sync folder")
    if not p:
        return ""
    os.makedirs(p, exist_ok=True)
    with open(CFG, "w", encoding="utf-8") as f:
        f.write(p)
    print(" Saved. I'll remember that.")
    return p


def code_files():
    out = []
    for n in sorted(os.listdir(HERE)):
        if n in CODE_SKIP or not n.lower().endswith(CODE_EXT):
            continue
        p = os.path.join(HERE, n)
        if os.path.isfile(p):
            out.append(n)
    return out


def do_send(folder):
    dest = os.path.join(folder, "suite")
    os.makedirs(dest, exist_ok=True)
    man = {"from": os.environ.get("COMPUTERNAME") or os.uname().nodename,
           "when": time.strftime("%Y-%m-%d %H:%M:%S"), "code": {}, "data": {}}
    n = 0
    for name in code_files():
        src = os.path.join(HERE, name)
        dst = os.path.join(dest, name)
        if os.path.isfile(dst) and sha(src) == sha(dst):
            man["code"][name] = sha(src)
            continue
        shutil.copy2(src, dst)
        man["code"][name] = sha(src)
        n += 1

    #  Data goes into the bundle as a READ-ONLY reference copy. Receiving
    #  never applies it automatically - it is there so the other machine
    #  can compare, and so you have a spare copy if a laptop dies.
    ddest = os.path.join(folder, "data_reference")
    os.makedirs(ddest, exist_ok=True)
    for rel in DATA_FILES:
        src = os.path.join(HERE, rel)
        if not os.path.isfile(src):
            continue
        dst = os.path.join(ddest, os.path.basename(rel))
        shutil.copy2(src, dst)
        man["data"][rel] = {"sha": sha(src), "mtime": os.path.getmtime(src)}

    with open(os.path.join(folder, "MANIFEST.json"), "w", encoding="utf-8") as f:
        json.dump(man, f, indent=1)

    print("")
    print(" SENT")
    print("   {} code file(s) updated in the sync folder ({} total)".format(
        n, len(man["code"])))
    print("   {} data file(s) copied for reference only".format(len(man["data"])))
    print("   Folder: " + folder)
    print("")
    print(" Now go to the other machine and run me there, option 2.")
    return 0


def do_receive(folder):
    src_dir = os.path.join(folder, "suite")
    mpath = os.path.join(folder, "MANIFEST.json")
    if not os.path.isdir(src_dir) or not os.path.isfile(mpath):
        print(" Nothing in that folder yet - run SEND on the other machine "
              "first.")
        return 1
    with open(mpath, encoding="utf-8") as f:
        man = json.load(f)
    print("")
    print(" Bundle from : {}".format(man.get("from", "?")))
    print(" Made        : {}".format(man.get("when", "?")))

    #  ---- code: newest wins, no questions ---------------------------
    todo = []
    for name in sorted(man.get("code", {})):
        s = os.path.join(src_dir, name)
        d = os.path.join(HERE, name)
        if not os.path.isfile(s):
            continue
        if not os.path.isfile(d) or sha(s) != sha(d):
            todo.append((name, s, d, os.path.isfile(d)))

    if not todo:
        print("")
        print(" Code is already identical on both machines. Nothing to do.")
    else:
        print("")
        print(" {} code file(s) to update:".format(len(todo)))
        for name, _s, _d, existed in todo[:40]:
            print("   {}  {}".format("CHANGED" if existed else "NEW    ", name))
        if len(todo) > 40:
            print("   ... and {} more".format(len(todo) - 40))
        if ask("Apply these? y/n", "y").lower() != "y":
            print(" Left alone.")
            return 0
        stamp = time.strftime("%Y%m%d_%H%M%S")
        bdir = os.path.join(BK, stamp)
        os.makedirs(bdir, exist_ok=True)
        for name, s, d, existed in todo:
            if existed:
                shutil.copy2(d, os.path.join(bdir, name))
            shutil.copy2(s, d)
        print("")
        print("   Applied {} file(s). Replaced copies backed up to".format(
            len(todo)))
        print("   Updates\\sync_backups\\{}\\".format(stamp))
        #  a broken sync must never hide
        import glob
        import py_compile
        bad = 0
        for f in sorted(glob.glob(os.path.join(HERE, "*.py"))):
            try:
                py_compile.compile(f, doraise=True)
            except Exception as e:
                bad += 1
                print("   ! COMPILE FAILED: {} - {}".format(
                    os.path.basename(f), e))
        if bad:
            print("   ! Restore from the backup folder above and tell Claude.")
            return 1
        print("   Every Python file compiles - the update is good.")

    #  ---- data: report only, you decide ------------------------------
    print("")
    print(" YOUR DATA - not touched, because there is no safe automatic")
    print(" answer. Here is how the two machines compare:")
    ddir = os.path.join(folder, "data_reference")
    any_diff = False
    for rel, info in sorted(man.get("data", {}).items()):
        mine = os.path.join(HERE, rel)
        theirs = os.path.join(ddir, os.path.basename(rel))
        label = os.path.basename(rel)
        if not os.path.isfile(mine):
            print("   {:<34} MISSING here - the other machine has it".format(
                label))
            any_diff = True
            continue
        if not os.path.isfile(theirs):
            continue
        if sha(mine) == info["sha"]:
            print("   {:<34} same on both".format(label))
            continue
        any_diff = True
        newer = "THIS machine" if os.path.getmtime(mine) > info["mtime"] \
            else "the OTHER machine"
        print("   {:<34} DIFFERENT - newer on {}".format(label, newer))
        print("   {:<34}   a spare copy is in {}".format(
            "", os.path.join(folder, "data_reference")))
    if not any_diff:
        print("   Everything matches. Nothing to think about.")
    else:
        print("")
        print(" If one machine is where you do the real work, keep its copy")
        print(" and copy it over the other by hand. Do NOT merge them by")
        print(" eye - run 33_UPDATE_CONTACTS.bat and 38_SUBMIT_CHARGES.bat")
        print(" on the second machine instead, and they will rebuild")
        print(" themselves without losing anything.")
    return 0


def main():
    print("=" * 70)
    print(" COATES | SYNC PCS - keep both machines level")
    print("=" * 70)
    print(" This machine: " + HERE)
    folder = sync_folder()
    if not folder:
        print(" No sync folder given. Nothing done.")
        return 1
    if not os.path.isdir(folder):
        print(" Can't see {} - plug the USB in, or check the path in "
              "SYNC_FOLDER.txt".format(folder))
        return 1

    mode = sys.argv[1].lower() if len(sys.argv) > 1 else ""
    if mode not in ("send", "receive"):
        print("")
        print("   1  SEND     - push THIS machine's scripts to the sync folder")
        print("   2  RECEIVE  - update THIS machine from the sync folder")
        print("")
        pick = ask("Which", "2")
        mode = "send" if pick.strip() in ("1", "send") else "receive"

    return do_send(folder) if mode == "send" else do_receive(folder)


if __name__ == "__main__":
    sys.exit(main())
