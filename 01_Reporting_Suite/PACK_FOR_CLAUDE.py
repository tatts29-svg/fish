#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | PACK FOR CLAUDE - gather the reconcile files, one click
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 29 Jul 2026): two update streams touched the two
#  laptops and the version masters fell out of step. Claude needs the
#  CURRENT copies of a handful of files from each machine to merge
#  everything into one master - this packs them, so nobody is
#  hand-picking files in Explorer.
#
#  What it does, on whichever machine you run it:
#    1. Freshens SUITE_VERSION.txt (runs the version check quietly).
#    2. Zips it together with every reconcile file this machine has -
#       missing ones are simply noted, that is expected.
#    3. Drops ONE zip in Downloads, named after this machine.
#  Then you upload that zip to the chat. Run it on BOTH laptops.
# =====================================================================
import datetime as dt
import os
import subprocess
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))

#  Everything either machine might need to send - the union of both
#  lists. A file this machine doesn't have is skipped and said.
WANTED = [
    "SUITE_VERSION.txt",
    "SUITE_VERSION_MASTER.txt",
    "SERVE_GEAR_HTTPS.py",
    "SYNC_PCS.py",
    "UPDATE_POSTERS.py",
    "VERSION_CHECK.py",
    "WHY_NO_CONNECT.py",
    "build_posters.py",
    "net_pick.py",
    "MACHINE_ID.py",
    "46_WHICH_MACHINE.bat",
    "CHECK_MY_SETUP.py",
]


def main():
    print("=" * 70)
    print(" COATES | PACK FOR CLAUDE - reconcile pack, one click")
    print("=" * 70)

    #  1. freshen the fingerprints so Claude sees exactly what is here NOW
    vc = os.path.join(HERE, "VERSION_CHECK.py")
    if os.path.isfile(vc):
        try:
            subprocess.run([sys.executable, vc], capture_output=True,
                           timeout=120, cwd=HERE)
            print(" Fingerprints refreshed (SUITE_VERSION.txt).")
        except Exception:
            print(" Couldn't refresh fingerprints - packing what's here.")

    machine = (os.environ.get("COMPUTERNAME") or "this-machine").strip()
    stamp = dt.datetime.now().strftime("%Y%m%d_%H%M")
    downloads = os.path.join(os.path.expanduser("~"), "Downloads")
    if not os.path.isdir(downloads):
        downloads = HERE
    out = os.path.join(downloads,
                       "CLAUDE_PACK_{}_{}.zip".format(machine, stamp))

    packed, missing = [], []
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for name in WANTED:
            p = os.path.join(HERE, name)
            if os.path.isfile(p):
                z.write(p, name)
                packed.append(name)
            else:
                missing.append(name)

    print("")
    print(" Packed {} file(s):".format(len(packed)))
    for n in packed:
        print("   " + n)
    if missing:
        print(" Not on this machine (that's fine, expected):")
        for n in missing:
            print("   " + n)
    print("")
    print("-" * 70)
    print(" YOUR ZIP IS READY - upload this file to the chat:")
    print("")
    print("   " + out)
    print("")
    print(" It's in your Downloads folder. Run me on the OTHER laptop")
    print(" too, and upload both zips - Claude merges them into one")
    print(" master so 40 reads UP TO DATE on both machines.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
