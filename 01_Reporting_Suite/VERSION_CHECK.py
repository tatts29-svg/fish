#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | WHAT VERSION AM I - which machine is behind, and on what
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): "the work one, the only way i can move
#  files from one to the next is actually through here at the moment."
#
#  So the work laptop has no USB and no shared folder. Fine - the chat
#  is the wire. But that only works if we can both see which machine is
#  carrying which version, without guessing from memory.
#
#  This writes SUITE_VERSION.txt: one short line per script with a
#  fingerprint of its contents. Upload that file to the chat and Claude
#  can say exactly which files are behind and send back a zip with only
#  those in it - instead of re-sending 47 files and hoping.
#
#  If SUITE_VERSION_MASTER.txt is sitting in the folder (Claude sends it
#  with an update), this compares against it and tells you straight out
#  what is missing or out of date on THIS machine. No upload needed.
# =====================================================================
import hashlib
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "SUITE_VERSION.txt")
MASTER = os.path.join(HERE, "SUITE_VERSION_MASTER.txt")
EXT = (".py", ".bat", ".ps1")
#  not scripts, but versioned all the same - the picture audit's
#  blocklist must match across machines or one laptop serves gear
#  pictures the audit binned. Mirrors SYNC_PCS.CODE_EXTRA. (31 Jul 2026)
EXTRA = {"wrong_pictures.json"}
SKIP = {"SUITE_VERSION.txt", "SUITE_VERSION_MASTER.txt", "SYNC_FOLDER.txt"}


def fingerprint(path):
    """Content only - a file copied about keeps its fingerprint even
    though its timestamp changes, so we compare what's IN it."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:10]


def scan():
    out = {}
    for n in sorted(os.listdir(HERE)):
        if n in SKIP or (not n.lower().endswith(EXT) and n not in EXTRA):
            continue
        p = os.path.join(HERE, n)
        if os.path.isfile(p):
            out[n] = fingerprint(p)
    return out


def read_manifest(path):
    got = {}
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            bits = line.split(None, 1)
            if len(bits) == 2:
                got[bits[1].strip()] = bits[0].strip()
    return got


def machine_name():
    """What this laptop is called - 'Andrews Laptop' or 'Work Laptop'.
    Set once by 53_WHICH_MACHINE.bat. This is the file Andrew sends up
    most often, so it should say which machine it came from without
    anyone having to remember. (28 Jul 2026.)"""
    try:
        with open(os.path.join(HERE, "MACHINE.txt"), encoding="utf-8") as f:
            for line in f:
                if line.lower().startswith("machine"):
                    return line.split(":", 1)[1].strip()
    except Exception:
        pass
    return ""


def main():
    print("=" * 70)
    print(" COATES | WHAT VERSION AM I")
    print("=" * 70)
    who = machine_name()
    if who:
        print(" Machine: {}".format(who))
    else:
        print(" Machine: not named yet - run 53_WHICH_MACHINE.bat once")
    print("-" * 70)
    mine = scan()
    theirs = read_manifest(MASTER) if os.path.isfile(MASTER) else {}

    #  The code has to mean "am I carrying the right scripts", not "what
    #  is on this disk". First cut hashed EVERY file, so two machines that
    #  were both perfectly up to date still printed different codes the
    #  moment one had a spare file in the folder - useless for the one
    #  job it had. It now covers the master's file list only, so two
    #  up-to-date machines read the same code and extras are counted
    #  separately. (Found on Andrew's two laptops, 28 Jul 2026.)
    if theirs:
        basis = {k: mine.get(k, "MISSING") for k in sorted(theirs)}
        label = "matched against the master's {} file(s)".format(len(theirs))
    else:
        basis = mine
        label = "this machine's {} file(s) - no master to compare".format(
            len(mine))
    overall = hashlib.sha256(
        "".join("{} {}".format(v, k) for k, v in sorted(basis.items()))
        .encode()).hexdigest()[:8]

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("# Coates K2 suite version - {} files - overall {}\n"
                .format(len(mine), overall))
        #  Name the machine INSIDE the file, not just on screen. This is
        #  the file that gets uploaded, and a version list with no name
        #  on it is the reason we kept having to ask which laptop it came
        #  from. (Andrew, 28 Jul 2026.)
        f.write("# MACHINE: {}\n".format(who or "not named - run 46_"))
        f.write("# {}\n".format(HERE))
        f.write("# taken {}\n".format(time.strftime("%Y-%m-%d %H:%M:%S")))
        for k, v in sorted(mine.items()):
            f.write("{} {}\n".format(v, k))

    print(" This machine : " + HERE)
    print(" Scripts      : {}".format(len(mine)))
    print(" Version code : {}   ({})".format(overall, label))
    print("")
    print(" Written to   : SUITE_VERSION.txt")

    if not theirs:
        print("")
        print(" No master to compare against on this machine.")
        print(" UPLOAD SUITE_VERSION.txt into the chat and Claude will send")
        print(" back a zip with only the files this machine is missing.")
        return 0

    missing = [k for k in theirs if k not in mine]
    stale = [k for k in theirs if k in mine and mine[k] != theirs[k]]
    extra = [k for k in mine if k not in theirs]

    print("")
    print("-" * 70)
    if not missing and not stale:
        print(" UP TO DATE - every script matches the master.")
        if extra:
            print("")
            print(" {} file(s) here the master doesn't have. Not a problem -"
                  " just so".format(len(extra)))
            print(" you can see what they are:")
            for k in sorted(extra):
                print("   " + k)
        return 0

    print(" BEHIND - this machine needs {} file(s):".format(
        len(missing) + len(stale)))
    for k in sorted(missing):
        print("   MISSING    {}".format(k))
    for k in sorted(stale):
        print("   OUT OF DATE {}".format(k))
    if extra:
        print("")
        print(" Only on this machine ({}): {}".format(
            len(extra), ", ".join(sorted(extra)[:6])))
    print("")
    print(" Send that list to Claude - or just upload SUITE_VERSION.txt -")
    print(" and you'll get a zip with exactly those files in it.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
