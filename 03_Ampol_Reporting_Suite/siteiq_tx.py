#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COATES | AMPOL - the TRANSACTIONS log, however many files it arrives in.
Author: Andrew Fisher | POWERED BY SITEIQ

WHY (07 Nov 2026, Andrew): SiteIQ caps the period one TRANSACTIONS export
can cover, so a long year arrives in two (or more) files - 01 Jan to 30 Jun
and 01 Jul to 07 Nov. Every reader in the suite used to open ONE file; this
module reads every TRANSACTIONS*.xlsx in Data/SiteIQ as one log:

  - files are read in order of their REPORT_PERIOD start;
  - rows are joined and de-duplicated on TRANSACTION_ID (every SiteIQ row
    carries one) - when two files hold the same transaction, the file whose
    period starts later wins, because it carries the later return stamp; a
    row with no id is matched on barcode + start + end + hirer + employer;
  - the combined window is the earliest period start to the latest period
    end, the requested time is the latest of the files;
  - a GAP between one period's end and the next's start, or an OVERLAP, is
    reported, never hidden - the data page prints it.

read() returns one dict every reader can iterate; label() is the one-line
description the data pages print ("TRANSACTIONS - 2 files joined: ...").
"""
import glob
import os
from datetime import datetime, timedelta

import ampol_paths

SHEET = "CUSTOMER_CONTRACTOR_EQUIP"
_CACHE = {}


def _stamp(v):
    """SiteIQ's own stamps: '07/11/2026 09:01 AM', '01/01/2026 04:00:00'."""
    if isinstance(v, datetime):
        return v
    s = str(v or "").strip()
    for f in ("%d/%m/%Y %I:%M %p", "%d/%m/%Y %I:%M:%S %p", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y",
              "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, f)
        except ValueError:
            continue
    return None


def info(path):
    """REFERENCE_INFO of one export: {'period': (start, end), 'requested': dt}."""
    import openpyxl
    out = {"period": (None, None), "requested": None}
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        if "REFERENCE_INFO" in wb.sheetnames:
            rows = list(wb["REFERENCE_INFO"].iter_rows(values_only=True))
            if len(rows) > 1:
                hdr = [str(h or "").upper() for h in rows[0]]
                for i, h in enumerate(hdr):
                    v = rows[1][i] if i < len(rows[1]) else None
                    if "REPORT_PERIOD" in h and v:
                        bits = [b.strip() for b in str(v).split(" - ")]
                        if len(bits) == 2:
                            out["period"] = (_stamp(bits[0]), _stamp(bits[1]))
                    elif "REQUESTED_DATE" in h and v:
                        out["requested"] = _stamp(v)
    finally:
        wb.close()
    return out


def files(data_dir=None):
    """Every TRANSACTIONS*.xlsx in the Data area (not Data\\SiteIQ\\previous,
    not Excel lock files, not archived Source_ pulls), in period order;
    [(path, info)]."""
    hits = []
    dirs = [data_dir] if data_dir else list(ampol_paths.data_dirs())
    seen = set()
    for d in dirs:
        for f in sorted(glob.glob(os.path.join(d, "TRANSACTIONS*.xlsx")) + glob.glob(os.path.join(d, "transactions*.xlsx"))):
            n = os.path.basename(f)
            if n.startswith("~$") or n.lower().startswith("source_") or not os.path.isfile(f):
                continue
            key = os.path.normcase(os.path.abspath(f))
            if key in seen:
                continue
            seen.add(key)
            hits.append((f, info(f)))
    far = datetime.max
    hits.sort(key=lambda fi: (fi[1]["period"][0] or far, fi[1]["requested"] or far, fi[0]))
    return hits


def read(paths=None, force=False):
    """The joined log. {'header': [...], 'rows': [tuple, ...], 'files': [...],
    'window': (start, end), 'requested': dt, 'gaps': [(end, start)],
    'overlaps': [(start, end)], 'dropped': n, 'path': first file, 'n_files': n}
    - None when no file is in Data. Read once per run unless force."""
    import openpyxl
    ck = tuple(paths) if paths else "data"
    if ck in _CACHE and not force:
        return _CACHE[ck]
    fl = [(p, info(p)) for p in paths] if paths else files()
    if not fl:
        return None
    far = datetime.max
    fl.sort(key=lambda fi: (fi[1]["period"][0] or far, fi[1]["requested"] or far, fi[0]))
    header, cols0 = None, None
    by_id, order = {}, []       # id -> row; ids in first-seen order
    out_files, dropped = [], 0
    for path, meta in fl:
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            if SHEET not in wb.sheetnames:
                out_files.append({"path": path, "name": os.path.basename(path), **meta, "rows": 0, "kept": 0, "replaced": 0,
                                  "note": f"no {SHEET} sheet"})
                continue
            it = wb[SHEET].iter_rows(values_only=True)
            hdr = [str(h or "").strip() for h in next(it, [])]
            if header is None:
                header = hdr
                cols0 = {h: i for i, h in enumerate(hdr)}
            # map this file's columns onto the first file's order, by name
            idx = [None] * len(header)
            this = {h: i for i, h in enumerate(hdr)}
            for h, i in cols0.items():
                idx[i] = this.get(h)
            id_i = this.get("TRANSACTION_ID")
            kf = [this.get(k) for k in ("LATEST_BARCODE", "TRAN_START_DATE", "TRAN_START_TIME", "TRAN_END_DATE",
                                        "TRAN_END_TIME", "HIRER_NAME", "EMPLOYER_NAME")]
            n = kept = replaced = 0
            for r in it:
                if not r or r[0] is None:
                    continue
                n += 1
                row = tuple(r[j] if (j is not None and j < len(r)) else None for j in idx)
                rid = r[id_i] if (id_i is not None and id_i < len(r)) else None
                key = ("id", str(rid).strip()) if rid not in (None, "") else \
                    ("row",) + tuple(str(r[j]).strip() if (j is not None and j < len(r) and r[j] is not None) else "" for j in kf)
                if key in by_id:
                    replaced += 1       # the later period's copy wins (a later return stamp)
                    dropped += 1
                else:
                    order.append(key)
                    kept += 1
                by_id[key] = row
            out_files.append({"path": path, "name": os.path.basename(path), **meta, "rows": n, "kept": kept,
                              "replaced": replaced, "note": ""})
        finally:
            wb.close()
    rows = [by_id[k] for k in order]
    periods = sorted(f["period"] for f in out_files if f["period"][0] and f["period"][1])
    # a GAP is a hole in the union of every period (a third file may cover
    # what two others leave out); an OVERLAP is any pair that intersects
    gaps, overlaps = [], []
    merged = []
    for a, b in periods:
        if merged and a <= merged[-1][1] + timedelta(seconds=1):
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    for (a1, b1), (a2, b2) in zip(merged, merged[1:]):
        gaps.append((b1, a2))
    for i, (a, b) in enumerate(periods):
        for a2, b2 in periods[i + 1:]:
            if a2 < b and a < b2:
                overlaps.append((max(a, a2), min(b, b2)))
    window = (min((p[0] for p in periods), default=None), max((p[1] for p in periods), default=None))
    req = max((f["requested"] for f in out_files if f["requested"]), default=None)
    out = {"header": header or [], "rows": rows, "files": out_files, "window": window, "requested": req,
           "gaps": gaps, "overlaps": overlaps, "dropped": dropped, "path": out_files[0]["path"] if out_files else "",
           "n_files": len(out_files)}
    _CACHE[ck] = out
    return out


def period_text(w):
    """'01/01/2026 04:00:00 - 07/11/2026 03:59:59' in SiteIQ's own form."""
    a, b = w if w else (None, None)
    f = "%d/%m/%Y %H:%M:%S"
    return f"{a.strftime(f) if a else '?'} - {b.strftime(f) if b else '?'}"


def label(tx=None, short=False):
    """One line for the data page. One file: its name. Several: how they
    were joined, with any gap or overlap said plainly."""
    tx = tx or read()
    if not tx:
        return "TRANSACTIONS (not in Data)"
    if tx["n_files"] == 1:
        return tx["files"][0]["name"]
    parts = []
    for f in tx["files"]:
        a, b = f["period"]
        span = f"{a:%d %b}-{b:%d %b %Y}" if (a and b) else "period unknown"
        parts.append(f"{f['name']} ({span}, {f['rows']:,} rows)" if not short else span)
    s = f"TRANSACTIONS - {tx['n_files']} files joined: " + "; ".join(parts)
    if tx["dropped"]:
        s += f"; {tx['dropped']:,} rows present in more than one file counted once"
    for a, b in tx["gaps"]:
        s += (f"; GAP in the log from {(a + timedelta(seconds=1)):%d %b %Y %H:%M} to {b:%d %b %Y %H:%M} - "
              f"movements in that span are missing, pull TRANSACTIONS for it")
    for a, b in tx["overlaps"]:
        s += f"; the files overlap {a:%d %b %Y %H:%M} to {b:%d %b %Y %H:%M} (rows counted once)"
    return s


def console_lines(tx=None):
    """What the builders print about the log."""
    tx = tx or read()
    if not tx:
        return ["TRANSACTIONS         : not in Data"]
    out = []
    for f in tx["files"]:
        a, b = f["period"]
        out.append(f"TRANSACTIONS file    : {f['name']} - {a:%d %b %Y %H:%M} to {b:%d %b %Y %H:%M}, "
                   f"{f['rows']:,} rows" + (f", {f['replaced']:,} also in an earlier file" if f["replaced"] else "")
                   + (f", requested {f['requested']:%d %b %Y %H:%M}" if f["requested"] else ""))
    if tx["n_files"] > 1:
        w = tx["window"]
        out.append(f"TRANSACTIONS joined  : {tx['n_files']} files, {len(tx['rows']):,} transactions, "
                   f"{w[0]:%d %b %Y %H:%M} to {w[1]:%d %b %Y %H:%M}"
                   + (f"; {tx['dropped']:,} duplicate rows counted once" if tx["dropped"] else "; no row in two files"))
    for a, b in tx["gaps"]:
        out.append(f"WARNING              : GAP in the log {(a + timedelta(seconds=1)):%d %b %Y %H:%M} to {b:%d %b %Y %H:%M} - "
                   f"movements in that span are missing; pull TRANSACTIONS for it (SiteIQ's period ends at 03:59:59 "
                   f"on the last day, so the next pull must START on that day)")
    for a, b in tx["overlaps"]:
        out.append(f"TRANSACTIONS overlap : {a:%d %b %Y %H:%M} to {b:%d %b %Y %H:%M} - rows counted once")
    return out


if __name__ == "__main__":
    import sys
    tx = read(sys.argv[1:] or None)
    for line in console_lines(tx):
        print(line)
    if tx:
        print("label:", label(tx))
        print("columns:", tx["header"][:8], "...")
