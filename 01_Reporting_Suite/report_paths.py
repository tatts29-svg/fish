#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | REPORT PATHS - one folder per day
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  Every report generator in this suite asks this module where to save.
#  It answers with Reports\<YYYY-MM-DD>\ for today (created if needed),
#  so each day's reports live together in one folder and nothing gets
#  scattered around the suite. The date format is ISO on purpose - the
#  folders sort in date order in Explorer. The reports themselves still
#  show dates as "24 Jul 2026".
# =====================================================================

import os
import datetime as dt

REPORTS_DIRNAME = "Reports"


def day_folder(base, when=None):
    """Return (and create) Reports\\<date>\\ under `base` for `when` (default today)."""
    when = when or dt.date.today()
    if isinstance(when, dt.datetime):
        when = when.date()
    path = os.path.join(base, REPORTS_DIRNAME, when.strftime("%Y-%m-%d"))
    os.makedirs(path, exist_ok=True)
    return path


SITEIQ_DIR = "Data_SiteIQ"       # the fresh SiteIQ pulls live here (kits
                                 # still accept them in the suite root too)


def siteiq_dirs(base):
    """Where the SiteIQ exports may live: the Data_SiteIQ folder first,
    the suite root second - saving over the top works in either."""
    return [os.path.join(base, SITEIQ_DIR), base]


def out_dirs(base, when=None):
    """The organised day folder: Pages\\ (the reports as framed HTML),
    PDF\\ (print copies), Emails\\ (.eml drafts, their page images and
    manifests). DATA_SOURCES.txt and working registers sit at the day
    root. (A. Fisher, 24 Jul 2026 - a clean structure, everything in
    its place.)"""
    day = day_folder(base, when)
    dirs = {"day": day,
            "pages": os.path.join(day, "Pages"),
            "pdf": os.path.join(day, "PDF"),
            "emails": os.path.join(day, "Emails")}
    for d in dirs.values():
        os.makedirs(d, exist_ok=True)
    return dirs


def find_export(base, pattern):
    """Newest file matching pattern across the SiteIQ data folder and the
    suite root - one honest answer regardless of where it was saved."""
    import glob as _g
    hits = []
    for d in siteiq_dirs(base):
        hits += [p for p in _g.glob(os.path.join(d, pattern))
                 if not os.path.basename(p).startswith("~$")]
    return max(hits, key=os.path.getmtime) if hits else None


def note_sources(folder, entries):
    """Write DATA_SOURCES.txt in the day folder - which files fed the reports,
    and when they were last refreshed. `entries` is a list of file paths;
    missing ones are flagged rather than silently skipped."""
    lines = ["DATA SOURCES FOR THIS DAY'S REPORTS",
             "Generated {}".format(dt.datetime.now().strftime("%d %b %Y - %H:%M")),
             "-" * 60]
    for p in entries:
        name = os.path.basename(p)
        if os.path.isfile(p):
            m = dt.datetime.fromtimestamp(os.path.getmtime(p))
            lines.append("{:<52} refreshed {}".format(name, m.strftime("%d %b %Y - %H:%M")))
        else:
            lines.append("{:<52} NOT FOUND at run time".format(name))
    out = os.path.join(folder, "DATA_SOURCES.txt")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return out
