#!/usr/bin/env python3
"""Utilisation history across past MMG shuts, for the report page.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python build_shut_history.py OUT.json \
        --sales "Jun 2023=PATH" ... --tx "Jul 2026=PATH" ... [--min-days 3]

Per shut: consumable units per day (SALES_STOCK draws) and tool issues per
day plus the most of each tool out at once (TRANSACTIONS). Only whole shift
days (05:00 to 04:59) count, and a shut is kept only when it holds at least
--min-days of them, so every figure shown is a fair daily figure. No prices.
"""
import argparse
import collections
import datetime as dt
import importlib.util
import json
import os
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))


def _mod(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def tool_days(th, path):
    """Whole shift days in a TRANSACTIONS pull and the tool issues on each."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ref = th._ref(wb)
    a, b = [x.strip() for x in str(ref.get("REPORT_PERIOD", "")).split(" - ")]
    hi = dt.datetime.strptime(b, "%d/%m/%Y %H:%M:%S")
    try:
        pulled = dt.datetime.strptime(str(ref.get("REQUESTED_DATE/TIME (LOCAL TIME)", "")).strip(), "%d/%m/%Y %I:%M %p")
    except ValueError:
        pulled = hi
    cut = min(hi, pulled)
    per, seen = collections.Counter(), set()
    for sheet in ("TRANSACTION_WITHOUT_CHARGES", "CUSTOMER_CONTRACTOR_EQUIP"):
        for r in th._sheet(wb, sheet):
            tid = r.get("TRANSACTION_ID")
            if tid in seen or str(r.get("PRODUCT_CATEGORY", "")).strip().lower() == "consumable":
                continue
            seen.add(tid)
            t = th._ts(r.get("TRAN_START_DATE"), r.get("TRAN_START_TIME"))
            if t:
                per[(t - dt.timedelta(hours=5)).date()] += float(r.get("QUANTITY") or 1)
    wb.close()
    if not per:
        return []
    last_whole = (cut - dt.timedelta(hours=5)).date()
    if cut < hi or (cut - dt.timedelta(hours=5)).time() < dt.time(23, 59):
        last_whole -= dt.timedelta(days=1)
    first = min(per)
    days = [first + dt.timedelta(i) for i in range((min(max(per), last_whole) - first).days + 1)]
    return [(d, int(per.get(d, 0))) for d in days]


def build(out, sales, txs, min_days=3):
    mm, th = _mod("build_minmax"), _mod("build_tool_holding")
    cons = []
    for label, path in sales:
        info, by, span, stocked = mm.shut_usage(path)
        if len(span) >= min_days:
            units = sum(sum(c.values()) for c in by.values())
            daily = [sum(c.get(d, 0) for c in by.values()) for d in span]
            cons.append({"label": label, "days": len(span), "per_day": round(units / len(span), 1), "daily": daily})
    tools = []
    for label, path in txs:
        days = tool_days(th, path)
        if len(days) < min_days:
            continue
        peaks = th.shut_peaks(path)
        tools.append({"label": label, "days": len(days), "per_day": round(sum(n for _, n in days) / len(days), 1),
                      "daily": [n for _, n in days],
                      "peaks": {k: v[0] for k, v in peaks["peaks"].items()},
                      "names": peaks["desc"]})
    data = {"cons": cons, "tools": tools, "min_days": min_days}
    with open(out, "w") as f:
        json.dump(data, f, indent=1)
    return data


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--sales", action="append", default=[])
    ap.add_argument("--tx", action="append", default=[])
    ap.add_argument("--min-days", type=int, default=3)
    a = ap.parse_args(argv)
    sp = lambda xs: [tuple(x.split("=", 1)) for x in xs]
    d = build(a.out, sp(a.sales), sp(a.tx), a.min_days)
    for c in d["cons"]:
        print("  consumables {:<14} {:>3} whole days  {:>6} units/day".format(c["label"], c["days"], c["per_day"]))
    for t in d["tools"]:
        print("  tooling     {:<14} {:>3} whole days  {:>6} issues/day  {} tools".format(t["label"], t["days"], t["per_day"], len(t["peaks"])))
    print("History   " + a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
