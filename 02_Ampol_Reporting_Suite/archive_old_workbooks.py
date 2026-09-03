"""COATES | AMPOL TOOL STORE - park the old workbooks (button 14).

Author: Andrew Fisher | POWERED BY SITEIQ

WHY (03 Sep 2026): the three .xlsm workbooks in Data\\ stopped being a
source of numbers in v1.1 to v1.4 - every report counts from the SiteIQ
exports. Left in Data\\ they invite a refresh that changes nothing and
a question about which file fed the report. This button moves them to
Data\\_Archive_workbooks\\ with a note saying why. Nothing is deleted,
nothing is overwritten (a name already in the archive gets a date
suffix), and running it twice is harmless.

A code update never moves data by itself - that is why this is a button
you press, not a step inside the update.
"""

import os
import shutil
import sys
from datetime import datetime

import ampol_paths

WORKBOOKS = ["Ampol Gas Monitor Report.xlsm", "Ampol_Gas_Monitor_Report.xlsm",
             "Ampol_Radio_Report.xlsm", "Ampol_Onhire_Tooling_Report.xlsm"]

NOTE = """These workbooks were parked here on {when} by 14_ARCHIVE_OLD_WORKBOOKS.

They are no longer read by any report. Since suite v1.1 (gas), v1.2 (radio)
and v1.3 (tooling) every figure is counted from the SiteIQ exports in Data\\:
RENTAL_STOCK.xlsx, TRANSACTIONS.xlsx and STOCKTAKE.xlsx, plus the small
lookup files (pricing, descriptions, serial registers, calibration and
rigging registers). Refreshing these workbooks changes nothing on any page.

They are kept, not deleted, in case an old tab is ever wanted for reference.
Author: Andrew Fisher | POWERED BY SITEIQ
"""


def main():
    data = ampol_paths.data_dir()
    arch = os.path.join(data, "_Archive_workbooks")
    print("=" * 68)
    print(" COATES | ARCHIVE OLD WORKBOOKS - Ampol tool store")
    print("=" * 68)
    moved = []
    for name in sorted(os.listdir(data)):
        low = name.lower()
        if not low.endswith(".xlsm") or name.startswith("~$"):
            continue
        src = os.path.join(data, name)
        os.makedirs(arch, exist_ok=True)
        dst = os.path.join(arch, name)
        if os.path.exists(dst):
            stem, ext = os.path.splitext(name)
            dst = os.path.join(arch, f"{stem}_{datetime.now():%Y%m%d_%H%M}{ext}")
        try:
            shutil.move(src, dst)
        except OSError as e:
            print(f" COULD NOT MOVE {name}: {e}")
            print("   Close it in Excel and press the button again.")
            continue
        moved.append(name)
        print(f" parked  {name}  ->  Data\\_Archive_workbooks\\{os.path.basename(dst)}")
    if moved:
        with open(os.path.join(arch, "WHY_THESE_ARE_HERE.txt"), "w", encoding="utf-8") as f:
            f.write(NOTE.format(when=datetime.now().strftime("%d %b %Y %H:%M")))
        print(f"\n {len(moved)} workbook(s) parked. No report reads them; nothing was deleted.")
    else:
        print(" Nothing to park - no .xlsm workbooks in Data\\ (already done, or never there).")
    print(" Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
