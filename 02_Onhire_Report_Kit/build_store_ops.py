#!/usr/bin/env python3
"""How the store runs on an average shut day, from past shuts' SiteIQ pulls.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python build_store_ops.py OUT.json --pair "TRANSACTIONS.xlsx=SALES_STOCK.xlsx" ...
                              [--sales SALES_STOCK.xlsx ...]

Each --pair is one past shut's TRANSACTIONS and SALES_STOCK. Only whole
shift days (05:00 to 04:59) inside the TRANSACTIONS window count. Output is
averages per day only - by hour, by shift (day 06:00 to 18:00, night 18:00
to 06:00), people served, and consumable units per day by type. Extra
--sales pulls add whole days to the consumable averages. No shut names,
dates, people's names or prices go into the output.
"""
import argparse
import collections
import datetime as dt
import importlib.util
import json
import os
import re
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import catalogue  # noqa: E402


def _mod(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def _shift(hour):
    return "day" if 6 <= hour < 18 else "night"


def _who(name):
    return " ".join(str(name or "").replace("-", " ").split()).upper()


def _sd(t):
    return (t - dt.timedelta(hours=5)).date()


def _cons_desc(desc):
    return re.sub(r"^MMG\s+", "", " ".join(str(desc or "").split()), flags=re.I)


def read_pair(th, mm, tx_path, sales_path):
    wb = openpyxl.load_workbook(tx_path, read_only=True, data_only=True)
    ref = th._ref(wb)
    a, b = [x.strip() for x in str(ref.get("REPORT_PERIOD", "")).split(" - ")]
    lo = dt.datetime.strptime(a, "%d/%m/%Y %H:%M:%S")
    hi = dt.datetime.strptime(b, "%d/%m/%Y %H:%M:%S")
    try:
        pulled = dt.datetime.strptime(str(ref.get("REQUESTED_DATE/TIME (LOCAL TIME)", "")).strip(), "%d/%m/%Y %I:%M %p")
    except ValueError:
        pulled = hi
    ev, seen = [], set()        # (time, kind, person, company, qty)
    for sheet in ("TRANSACTION_WITHOUT_CHARGES", "CUSTOMER_CONTRACTOR_EQUIP"):
        for r in th._sheet(wb, sheet):
            tid = r.get("TRANSACTION_ID")
            if tid in seen or str(r.get("PRODUCT_CATEGORY", "")).strip().lower() == "consumable":
                continue
            seen.add(tid)
            who, co = _who(r.get("HIRER_NAME")), _who(r.get("EMPLOYER_NAME"))
            s = th._ts(r.get("TRAN_START_DATE"), r.get("TRAN_START_TIME"))
            e = th._ts(r.get("TRAN_END_DATE"), r.get("TRAN_END_TIME"))
            if s:
                ev.append((s, "issue", who, co, 1))
            if e:
                ev.append((e, "return", who, co, 1))
    wb.close()
    cons = []
    if sales_path:
        _, rows = mm._rows(sales_path)
        for r in rows:
            q = float(r.get("SALES_QUANTITY") or 0)
            if q <= 0 or not str(r.get("COMPANY_NAME") or "").strip():
                continue
            t = mm._when(r.get("SALES_DATE"), r.get("SALES_TIME"))
            if t:
                ev.append((t, "sale", _who(r.get("HIRER") or r.get("PURCHASER_NAME")), _who(r.get("COMPANY_NAME")), q))
                cons.append((t, _cons_desc(r.get("SKU_DESCRIPTION")), q))
    issues = [t for t, k, *_ in ev if k == "issue"]
    if not issues:
        return None
    last = _sd(min(hi, pulled)) - dt.timedelta(days=1)
    if min(hi, pulled) == hi and hi.time() >= dt.time(4, 59):
        last = _sd(hi)
    first = max(_sd(min(issues)), _sd(lo))
    days = [first + dt.timedelta(i) for i in range((min(last, _sd(max(issues))) - first).days + 1)]
    keep = set(days)
    return {"days": days, "ev": [e for e in ev if _sd(e[0]) in keep], "cons": [c for c in cons if _sd(c[0]) in keep]}


def build(out, pairs, extra_sales):
    th, mm = _mod("build_tool_holding"), _mod("build_minmax")
    shuts = [s for s in (read_pair(th, mm, t, s) for t, s in pairs) if s and len(s["days"]) >= 3]
    nd = sum(len(s["days"]) for s in shuts)
    hours = {k: [0.0] * 24 for k in ("issue", "return", "sale")}
    shift = {sh: collections.Counter() for sh in ("day", "night")}
    ppl_day, co_day, ppl_shift, tx_day = [], [], {"day": [], "night": []}, []
    for s in shuts:
        per = collections.defaultdict(lambda: {"p": set(), "c": set(), "day": set(), "night": set(), "n": 0})
        for t, kind, who, co, q in s["ev"]:
            hours[kind][t.hour] += 1
            sh = _shift(t.hour)
            shift[sh][kind] += 1
            if kind == "sale":
                shift[sh]["units"] += q
            d = per[_sd(t)]
            d["n"] += 1
            if who:
                d["p"].add(who)
                d[sh].add(who)
            if co:
                d["c"].add(co)
        for day in s["days"]:
            d = per.get(day, {"p": set(), "c": set(), "day": set(), "night": set(), "n": 0})
            ppl_day.append(len(d["p"]))
            co_day.append(len(d["c"]))
            tx_day.append(d["n"])
            for sh in ("day", "night"):
                ppl_shift[sh].append(len(d[sh]))
    avg = lambda xs: round(sum(xs) / len(xs), 1) if xs else 0
    r1 = lambda v: round(v / nd, 1) if nd else 0
    total_hour = [sum(hours[k][h] for k in hours) / nd for h in range(24)] if nd else [0] * 24

    # consumables per day by type: every whole day on record, pairs plus extra pulls
    cat_units, line_units, cdays = collections.Counter(), collections.Counter(), 0
    for s in shuts:
        cdays += len(s["days"])
        for t, desc, q in s["cons"]:
            cat_units[catalogue.cons_category(desc)] += q
            line_units[catalogue.cons_clean(desc).upper()] += q
    for path in extra_sales:
        info, by, span, stocked = mm.shut_usage(path)
        if len(span) < 1:
            continue
        _, rows = mm._rows(path)
        keep = set(span)
        cdays += len(span)
        for r in rows:
            q = float(r.get("SALES_QUANTITY") or 0)
            t = mm._when(r.get("SALES_DATE"), r.get("SALES_TIME"))
            if q > 0 and t and str(r.get("COMPANY_NAME") or "").strip() and _sd(t) in keep:
                desc = _cons_desc(r.get("SKU_DESCRIPTION"))
                cat_units[catalogue.cons_category(desc)] += q
                line_units[catalogue.cons_clean(desc).upper()] += q
    data = {
        "hours": {k: [round(v / nd, 2) for v in hours[k]] for k in hours} if nd else {},
        "busiest": max(range(24), key=lambda h: total_hour[h]), "quietest": min(range(24), key=lambda h: total_hour[h]),
        "busiest_n": round(max(total_hour), 1), "quietest_n": round(min(total_hour), 1),
        "per_day": {"tx": avg(tx_day), "issues": r1(sum(shift[s]["issue"] for s in shift)),
                    "returns": r1(sum(shift[s]["return"] for s in shift)), "sales": r1(sum(shift[s]["sale"] for s in shift)),
                    "units": r1(sum(shift[s]["units"] for s in shift)), "people": avg(ppl_day), "companies": avg(co_day)},
        "shift": {sh: {"issues": r1(shift[sh]["issue"]), "returns": r1(shift[sh]["return"]), "sales": r1(shift[sh]["sale"]),
                       "units": r1(shift[sh]["units"]), "people": avg(ppl_shift[sh]),
                       "tx": r1(shift[sh]["issue"] + shift[sh]["return"] + shift[sh]["sale"])} for sh in shift},
        "cons_types": [{"name": k, "n": round(v / cdays, 1)} for k, v in cat_units.most_common()] if cdays else [],
        "cons_lines": [{"name": k, "n": round(v / cdays, 1)} for k, v in line_units.most_common(10)] if cdays else [],
    }
    with open(out, "w") as f:
        json.dump(data, f, indent=1)
    return data, nd, cdays


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--pair", action="append", default=[])
    ap.add_argument("--sales", action="append", default=[])
    a = ap.parse_args(argv)
    d, nd, cdays = build(a.out, [tuple(x.split("=", 1)) for x in a.pair], a.sales)
    print("  whole days: {} for transactions, {} for consumables".format(nd, cdays))
    print("  per day", d["per_day"])
    for sh in ("day", "night"):
        print("  " + sh, d["shift"][sh])
    print("  busiest {:02d}:00 ({}/h)  quietest {:02d}:00 ({}/h)".format(d["busiest"], d["busiest_n"], d["quietest"], d["quietest_n"]))
    print("  types", [(c["name"], c["n"]) for c in d["cons_types"]])
    print("  lines", [(c["name"][:28], c["n"]) for c in d["cons_lines"][:5]])
    return 0


if __name__ == "__main__":
    sys.exit(main())
