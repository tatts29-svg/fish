#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES | AMPOL - TIDY THE DATA FOLDER (button 16)
=====================================================================
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (03 Sep 2026, Andrew): the three SiteIQ pulls go into one folder and
the workbooks Andrew edits into another, and the four small editable
files become ONE master workbook.

    Data\\SiteIQ\\      RENTAL_STOCK.xlsx, TRANSACTIONS.xlsx, STOCKTAKE.xlsx
                      previous\\  dated copies of earlier pulls
    Data\\Editable\\    Ampol_Master.xlsx  (Descriptions, Pricing,
                                          Gas serials, Radio serials)
                      Ampol_Calibration_Register.xlsx
                      Rigging Register.xlsx
                      store_layout.template.json / store_layout.json

What this button does, in order - moves only, nothing is ever deleted,
safe to run again (a second run finds nothing left to do):
  1. makes the two folders
  2. moves the SiteIQ exports (and Data\\previous) into Data\\SiteIQ
  3. moves the calibration and rigging registers and the store layout
     into Data\\Editable
  4. builds Data\\Editable\\Ampol_Master.xlsx from the four legacy files
     (values only, every row kept) - unless a master already exists
  5. parks the four legacy files in Data\\_Archive_workbooks with a note
Then run 10_CHECK_MY_SETUP and 00_RUN_EVERYTHING.
"""
import glob
import os
import shutil
from datetime import datetime

import ampol_master
import ampol_paths

ROOT = ampol_paths.data_dir()
SITEIQ = ampol_paths.siteiq_dir()
EDIT = ampol_paths.editable_dir()
ARCH = os.path.join(ROOT, "_Archive_workbooks")

SITEIQ_PATTERNS = ("RENTAL_STOCK*.xlsx", "TRANSACTIONS*.xlsx", "STOCKTAKE*.xlsx")
EDITABLE_PATTERNS = ("Ampol_Calibration_Register*.xlsx", "Rigging*Register*.xlsx", "Ampol_Master*.xlsx",
                     "store_layout*.json")
LEGACY = {
    "mapping": ("Tooling_Description_Mapping*.xlsx",),
    "new_desc": ("New_Descriptions*.xlsx",),
    "pricing": ("Ampol_ToolStore_Pricing*.xlsx", "Ampol ToolStore Pricing*.xlsx"),
    "gas": ("Gas_Monitor_Serial*.xlsx",),
    "radio": ("radio_register*.xlsx",),
}


def _files(folder, pattern):
    return sorted(f for f in glob.glob(os.path.join(folder, pattern))
                  if os.path.isfile(f) and not os.path.basename(f).startswith("~$"))


def _move(src, dst_dir, note=""):
    dst = os.path.join(dst_dir, os.path.basename(src))
    if os.path.abspath(src) == os.path.abspath(dst):
        return None
    if os.path.exists(dst):
        # never overwrite: the older of the two is parked with a stamp
        older, newer = sorted([src, dst], key=os.path.getmtime)
        stamp = datetime.fromtimestamp(os.path.getmtime(older)).strftime("%Y%m%d_%H%M")
        park = os.path.join(ampol_paths.previous_dir(), f"{stamp}_{os.path.basename(older)}")
        shutil.move(older, park)
        print(f"  parked   {os.path.basename(older)} (older copy) -> SiteIQ\\previous\\{os.path.basename(park)}")
        if newer == dst:
            return None
    shutil.move(src, dst)
    print(f"  moved    {os.path.basename(src)} -> {os.path.relpath(dst_dir, ROOT)}\\{note}")
    return dst


def main():
    print("=" * 66)
    print(" COATES | AMPOL - TIDY THE DATA FOLDER")
    print(f" Data: {ROOT}")
    print("=" * 66)
    done = 0
    # 1-2. SiteIQ exports and their earlier copies
    print("\nSiteIQ exports -> Data\\SiteIQ")
    for pat in SITEIQ_PATTERNS:
        for f in _files(ROOT, pat):
            done += bool(_move(f, SITEIQ))
    old_prev = os.path.join(ROOT, "previous")
    if os.path.isdir(old_prev):
        for f in _files(old_prev, "*"):
            done += bool(_move(f, ampol_paths.previous_dir()))
        try:
            os.rmdir(old_prev)
            print("  removed  the empty Data\\previous folder")
        except OSError:
            pass
    # 3. the editable registers and the layout
    print("\nEditable workbooks -> Data\\Editable")
    for pat in EDITABLE_PATTERNS:
        for f in _files(ROOT, pat):
            done += bool(_move(f, EDIT))
    # 4. the master
    print("\nThe master workbook")
    legacy = {k: (ampol_paths.find_data(*pats) or "") for k, pats in LEGACY.items()}
    master = ampol_paths.find_data(*ampol_master.MASTER_PATTERNS)
    if master:
        print(f"  present  {os.path.relpath(master, ROOT)} - not rebuilt (edit it in place)")
    elif any(legacy.values()):
        out = os.path.join(EDIT, ampol_master.MASTER_NAME)
        counts = ampol_master.build(out, mapping=legacy["mapping"], new_desc=legacy["new_desc"],
                                    pricing=legacy["pricing"], gas=legacy["gas"], radio=legacy["radio"])
        for k, v in counts.items():
            print(f"  built    {k:44} {v:,} rows")
        print(f"  written  Editable\\{ampol_master.MASTER_NAME}")
        master = out
        done += 1
    else:
        print("  none of the legacy files found and no master - nothing to build")
    # 5. park the legacy files once the master carries them
    if master:
        parked = []
        for k, f in legacy.items():
            if f and os.path.dirname(os.path.abspath(f)) != os.path.abspath(ARCH):
                os.makedirs(ARCH, exist_ok=True)
                dst = os.path.join(ARCH, os.path.basename(f))
                if os.path.exists(dst):
                    stamp = datetime.now().strftime("%Y%m%d_%H%M")
                    dst = os.path.join(ARCH, f"{stamp}_{os.path.basename(f)}")
                shutil.move(f, dst)
                parked.append(os.path.basename(f))
                done += 1
        if parked:
            print("\nLegacy files parked in Data\\_Archive_workbooks (the master carries them now):")
            for p in parked:
                print(f"  parked   {p}")
            with open(os.path.join(ARCH, "WHY_THESE_ARE_HERE.txt"), "a", encoding="utf-8") as fh:
                fh.write(f"\n{datetime.now():%d %b %Y %H:%M} - button 16 parked {', '.join(parked)}: their rows "
                         f"live in Data\\Editable\\{ampol_master.MASTER_NAME} now. Nothing deleted.\n")
    print("\n" + ("Nothing left to tidy - the folder is already in the two-folder layout." if not done
                  else f"Done - {done} change(s). Next: 10_CHECK_MY_SETUP, then 00_RUN_EVERYTHING."))
    print("The Coates Way - consistent execution, every day.")


if __name__ == "__main__":
    main()
