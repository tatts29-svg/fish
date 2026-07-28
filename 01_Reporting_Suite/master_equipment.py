#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | K2 MASTER EQUIPMENT FILE - one file feeds everything
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  K2_MASTER_EQUIPMENT_PRICING.xlsx is the single source for equipment
#  identity across the whole suite AND the K2 Excel (per A. Fisher,
#  24 Jul 2026): keyed on ITEM_NUMBER (the asset number - "use the item
#  number for everything"), one tab, carrying:
#
#    STORAGE_UNIT | ITEM_NUMBER | PLANT_ID | ITEM_DESCRIPTION |
#    PRODUCT_VARIANT | NEW_DESCRIPTION | REPLACEMENT_COST_AUD |
#    REPLACEMENT_PRICE_SOURCE | EQUIPMENT_CATEGORY |
#    ELECTRICAL_TAG | RIGGING_TAG | LOGBOOK_REQUIRED | RETURN_REQUIREMENT
#
#  Add or edit a row there and the next run updates every report and the
#  Excel true-up alike:
#    * NEW_DESCRIPTION becomes the DISPLAYED name wherever the item
#      appears. The original description is kept alongside so SiteIQ
#      matching, billing counts and pattern rules never break.
#    * REPLACEMENT_COST_AUD (with its SOURCE) prices the item by exact
#      asset identity - stronger than any description match. The old
#      description-keyed schedule stays as the fallback; anything priced
#      nowhere shows TBC and rides the daily gap list. Never guessed.
#    * ELECTRICAL_TAG / RIGGING_TAG / LOGBOOK_REQUIRED / RETURN_REQUIREMENT
#      (added 25 Jul 2026) put the compliance line UNDER the description
#      on every report, every email and My Gear. Y turns a flag on, blank
#      turns it off - no data in the column, nothing in the report. The
#      wording and the current tag colour live in equipment_compliance.py.
#
#  Portable: found beside the suite (root or Data_SiteIQ\), newest wins.
#  Loading is optional-safe: no file -> every report runs exactly as it
#  did before the master existed.
# =====================================================================

import os
import glob
import datetime as dt

MASTER_PATTERN = "K2_MASTER_EQUIPMENT_PRICING*.xlsx"
_HERE = os.path.dirname(os.path.abspath(__file__))


class Master(object):
    def __init__(self):
        self.by_item = {}
        self.path = None
        self.mtime = None
        self.n_renames = 0
        self.n_priced = 0
        self.n_elec = 0
        self.n_rig = 0
        self.n_log = 0
        self.n_ret = 0

    @property
    def loaded(self):
        return bool(self.by_item)

    def rec(self, item_number):
        if item_number is None:
            return None
        return self.by_item.get(str(item_number).strip())

    def disp(self, item_number, fallback):
        """Displayed name: the master's NEW_DESCRIPTION when this asset
        has one, otherwise whatever the export said. Never blank."""
        r = self.rec(item_number)
        if r and r["new_desc"]:
            return r["new_desc"]
        return fallback

    def price(self, item_number):
        """Replacement cost by exact asset identity, or None."""
        r = self.rec(item_number)
        if r and r["repl"] is not None and r["repl"] > 0:
            return r["repl"]
        return None

    def price_source(self, item_number):
        r = self.rec(item_number)
        return r["source"] if r else ""

    def plant_id(self, item_number):
        r = self.rec(item_number)
        return r["plant_id"] if r else ""

    def category(self, item_number):
        r = self.rec(item_number)
        return r["category"] if r else ""

    # -- compliance, added 25 Jul 2026 -------------------------------
    def electrical(self, item_number):
        return _flag(self.rec(item_number), "electrical")

    def rigging(self, item_number):
        return _flag(self.rec(item_number), "rigging")

    def logbook(self, item_number):
        return _flag(self.rec(item_number), "logbook")

    def return_note(self, item_number):
        r = self.rec(item_number)
        return r["ret"] if r else ""

    @property
    def n_compliance(self):
        return self.n_elec + self.n_rig + self.n_log + self.n_ret


def _clean(v):
    return "" if v is None else str(v).strip()


_TRUE = ("y", "yes", "true", "1", "x", "req", "required")


def _isyes(v):
    return _clean(v).lower() in _TRUE


def _flag(rec, key):
    return bool(rec and rec.get(key))


def _num(v):
    if v is None or v == "":
        return None
    try:
        return float(str(v).replace("$", "").replace(",", ""))
    except Exception:
        return None


def load(base_dir=None, quiet=False):
    """Load the master file. Empty Master (never None) when absent -
    callers just fall back to pre-master behaviour."""
    base = base_dir or _HERE
    hits = []
    for d in (base, os.path.join(base, "Data_SiteIQ")):
        hits += [p for p in glob.glob(os.path.join(d, MASTER_PATTERN))
                 if not os.path.basename(p).startswith("~$")]
    m = Master()
    if not hits:
        if not quiet:
            print("  Master file : (not found - descriptions and prices run "
                  "as before)")
        return m
    path = max(hits, key=os.path.getmtime)
    try:
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb[wb.sheetnames[0]]
        rows = ws.iter_rows(values_only=True)
        hdr = [_clean(c).upper() for c in next(rows)]

        def col(name):
            return hdr.index(name) if name in hdr else None

        c_item = col("ITEM_NUMBER")
        c_orig = col("ITEM_DESCRIPTION")
        c_new = col("NEW_DESCRIPTION")
        c_repl = col("REPLACEMENT_COST_AUD")
        c_src = col("REPLACEMENT_PRICE_SOURCE")
        c_pid = col("PLANT_ID")
        c_cat = col("EQUIPMENT_CATEGORY")
        c_su = col("STORAGE_UNIT")
        c_elec = col("ELECTRICAL_TAG")
        c_rig = col("RIGGING_TAG")
        c_log = col("LOGBOOK_REQUIRED")
        c_ret = col("RETURN_REQUIREMENT")
        if c_item is None:
            if not quiet:
                print("  Master file : found but no ITEM_NUMBER column - "
                      "skipped ({}).".format(os.path.basename(path)))
            wb.close()
            return m
        for row in rows:
            item = _clean(row[c_item]) if c_item < len(row) else ""
            if not item:
                continue

            def g(ci):
                return _clean(row[ci]) if ci is not None and ci < len(row) else ""

            rec = {
                "item": item,
                "orig_desc": g(c_orig),
                "new_desc": g(c_new),
                "repl": _num(row[c_repl]) if c_repl is not None and c_repl < len(row) else None,
                "source": g(c_src),
                "plant_id": g(c_pid),
                "category": g(c_cat),
                "su": g(c_su),
                "electrical": _isyes(g(c_elec)),
                "rigging": _isyes(g(c_rig)),
                "logbook": _isyes(g(c_log)),
                "ret": g(c_ret),
            }
            m.by_item[item] = rec
            if rec["new_desc"] and rec["new_desc"] != rec["orig_desc"]:
                m.n_renames += 1
            if rec["repl"] is not None and rec["repl"] > 0:
                m.n_priced += 1
            if rec["electrical"]:
                m.n_elec += 1
            if rec["rigging"]:
                m.n_rig += 1
            if rec["logbook"]:
                m.n_log += 1
            if rec["ret"]:
                m.n_ret += 1
        wb.close()
        m.path = path
        m.mtime = dt.datetime.fromtimestamp(os.path.getmtime(path))
        if not quiet:
            print("  Master file : {}  ({:,} items | {:,} priced | {:,} "
                  "renamed)".format(os.path.basename(path), len(m.by_item),
                                    m.n_priced, m.n_renames))
            print("  Compliance  : {:,} electrical | {:,} rigging | {:,} "
                  "logbook | {:,} return-daily".format(
                      m.n_elec, m.n_rig, m.n_log, m.n_ret))
    except Exception as e:
        if not quiet:
            print("  Master file : couldn't read it ({}) - descriptions and "
                  "prices run as before.".format(e))
        m.by_item = {}
    return m
