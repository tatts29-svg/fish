"""COATES | AMPOL TOOL STORE - the path oracle.

Author: Andrew Fisher | POWERED BY SITEIQ

WHY (12 Aug 2026): Andrew asked for two things at once - "one area for
all the Excels so all reports read from one area" and a suite that
"works on all computers". This module is both answers. Every engine asks
it where things are, and it only ever answers relative to the suite
folder itself, so copying the whole folder to any machine keeps every
path true. No Downloads, no C:\\Users, no drive letters, ever.

The layout it promises:

    02_Ampol_Reporting_Suite\
        Data\                    every Excel the reports read - THE area
        Data\previous\           dated backups made before an export is
                                 saved over the top (never overwritten)
        Reports\<YYYY-MM-DD>\    one folder per day, one subfolder per
                                 report family - append-only, dated,
                                 nothing is ever silently replaced
"""

import glob as _glob
import os
from datetime import date

SUITE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(SUITE, "Data")
# WHY (03 Sep 2026): AMPOL_REPORTS_DIR is a TEST hook only - a builder run
# with it set writes into that folder instead of Reports\, so a layout
# test on a history fixture can never land in the real dated folders.
# Nothing in the suite sets it; the buttons never do.
REPORTS = os.environ.get("AMPOL_REPORTS_DIR") or os.path.join(SUITE, "Reports")


def suite_dir():
    """The suite root - the folder this file lives in."""
    return SUITE


def data_dir():
    """The ONE area every report reads its Excels from."""
    os.makedirs(DATA, exist_ok=True)
    return DATA


def previous_dir():
    """Where a fresh export's predecessor is parked, date-stamped."""
    p = os.path.join(DATA, "previous")
    os.makedirs(p, exist_ok=True)
    return p


def day_folder(kit=None):
    """Today's report folder, created on demand.

    Reports\\<YYYY-MM-DD>\\ or Reports\\<YYYY-MM-DD>\\<kit>\\ when a
    report family name is given (Gas_Monitors, Radios, Tooling,
    Stocktake, Calibrations, Rigging).
    """
    d = os.path.join(REPORTS, date.today().isoformat())
    if kit:
        d = os.path.join(d, kit)
    os.makedirs(d, exist_ok=True)
    return d


def find_data(*patterns):
    """Newest file in Data\\ matching the first pattern that hits.

    Excel owner-lock files (~$...) and archived pulls (Source_...) are
    never candidates - a lock file is always the newest file while the
    workbook is open, and grabbing it corrupts the load.
    Returns '' when nothing matches, so callers can degrade politely.
    """
    for pat in patterns:
        hits = []
        for f in _glob.glob(os.path.join(data_dir(), pat)):
            n = os.path.basename(f)
            if n.startswith("~$") or n.lower().startswith("source_"):
                continue
            if os.path.isfile(f):
                hits.append(f)
        if hits:
            hits.sort(key=os.path.getmtime, reverse=True)
            return hits[0]
    return ""


def find_data_all(pattern):
    """Every match in Data\\ for one pattern, newest first, locks skipped."""
    hits = []
    for f in _glob.glob(os.path.join(data_dir(), pattern)):
        n = os.path.basename(f)
        if n.startswith("~$") or n.lower().startswith("source_"):
            continue
        if os.path.isfile(f):
            hits.append(f)
    hits.sort(key=os.path.getmtime, reverse=True)
    return hits
