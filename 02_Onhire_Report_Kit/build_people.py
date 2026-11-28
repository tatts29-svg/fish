#!/usr/bin/env python3
"""People profiles for the report page: a returns rating and consumable flags.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python build_people.py OUT.json --pair "TRANSACTIONS.xlsx=SALES_STOCK.xlsx" ...

Each --pair is one finished shut. The output holds people's names, so it
stays outside git with the rest of the site data.

Returns rating (out of 5), from tools issued and returned:
  - needs at least MIN_ISSUES tools issued on record, else no rating;
  - anything not returned by the end of a shut caps the rating at 2
    (1 if more than a tenth of their tools were left out);
  - otherwise it follows the share of tools back inside 12 hours (the
    same shift): 80%+ = 5, 60%+ = 4.5, 40%+ = 4, 20%+ = 3.5, under = 3.
Consumable flags: a person's units per shut in a type, when above the level
nine in ten people stay under (and at least FLAG_MIN units).
"""
import argparse
import collections
import json
import os
import statistics
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import catalogue  # noqa: E402
import build_store_ops as so  # noqa: E402

MIN_ISSUES = 5
FLAG_MIN = 6


def rating(issued, returned, within12):
    if issued < MIN_ISSUES:
        return None
    left = issued - returned
    if left > 0:
        return 1.0 if left / issued > 0.1 else 2.0
    share = within12 / issued
    return 5.0 if share >= 0.8 else 4.5 if share >= 0.6 else 4.0 if share >= 0.4 else 3.5 if share >= 0.2 else 3.0


def _name(raw):
    parts = [w for w in str(raw or "").replace("-", " ").split() if w]
    return " ".join(w if (w.isupper() and len(w) <= 3) else w.title() for w in parts)


def build(out, pairs, aliases=None):
    th, mm = so._mod("build_tool_holding"), so._mod("build_minmax")
    aliases = aliases or {}
    co_name = lambda c: aliases.get(str(c or "").strip().upper(), str(c or "").strip())
    ppl = collections.defaultdict(lambda: {"iss": 0, "ret": 0, "w12": 0, "hold": [], "cons": collections.Counter(),
                                          "lines": collections.Counter(), "tools": collections.Counter(),
                                          "co": collections.Counter(), "shuts": set(), "name": ""})
    for n, (tx, sales) in enumerate(pairs):
        wb = openpyxl.load_workbook(tx, read_only=True, data_only=True)
        seen = set()
        for sheet in ("TRANSACTION_WITHOUT_CHARGES", "CUSTOMER_CONTRACTOR_EQUIP"):
            for r in th._sheet(wb, sheet):
                if r.get("TRANSACTION_ID") in seen or str(r.get("PRODUCT_CATEGORY", "")).strip().lower() == "consumable":
                    continue
                seen.add(r.get("TRANSACTION_ID"))
                key = so._who(r.get("HIRER_NAME"))
                s = th._ts(r.get("TRAN_START_DATE"), r.get("TRAN_START_TIME"))
                if not key or not s:
                    continue
                p = ppl[key]
                p["name"] = p["name"] or _name(r.get("HIRER_NAME"))
                p["shuts"].add(n)
                p["co"][co_name(r.get("EMPLOYER_NAME"))] += 1
                p["iss"] += 1
                p["tools"][" ".join(str(r.get("SKU/ITEM DESCRIPTION") or "").split())] += 1
                e = th._ts(r.get("TRAN_END_DATE"), r.get("TRAN_END_TIME"))
                if e:
                    hrs = (e - s).total_seconds() / 3600
                    p["ret"] += 1
                    p["hold"].append(hrs)
                    p["w12"] += 1 if hrs <= 12 else 0
        wb.close()
        if sales:
            _, rows = mm._rows(sales)
            for r in rows:
                q = float(r.get("SALES_QUANTITY") or 0)
                key = so._who(r.get("HIRER") or r.get("PURCHASER_NAME"))
                if q <= 0 or not key or not str(r.get("COMPANY_NAME") or "").strip():
                    continue
                p = ppl[key]
                p["name"] = p["name"] or _name(r.get("HIRER") or r.get("PURCHASER_NAME"))
                p["shuts"].add(n)
                p["co"][co_name(r.get("COMPANY_NAME"))] += 1
                desc = so._cons_desc(r.get("SKU_DESCRIPTION"))
                p["cons"][catalogue.cons_category(desc)] += q
                p["lines"][catalogue.cons_clean(desc)] += q
    per = lambda p, c: p["cons"][c] / max(1, len(p["shuts"]))
    cats = sorted({c for p in ppl.values() for c in p["cons"]})
    level, typical = {}, {}
    for c in cats:
        vals = sorted(per(p, c) for p in ppl.values() if p["cons"][c])
        if len(vals) >= 10:
            level[c] = statistics.quantiles(vals, n=10)[8]
            typical[c] = statistics.median(vals)
    people = []
    for key, p in ppl.items():
        flags = []
        for c in cats:
            v = per(p, c)
            if c in level and v > level[c] and v >= FLAG_MIN:
                flags.append({"type": c, "units": round(v, 1), "typical": round(typical[c], 1)})
        flags.sort(key=lambda f: -f["units"] / max(f["typical"], 0.1))
        people.append({
            "key": key, "name": p["name"], "co": p["co"].most_common(1)[0][0] if p["co"] else "",
            "iss": p["iss"], "ret": p["ret"], "left": p["iss"] - p["ret"],
            "w12": round(p["w12"] / p["iss"], 2) if p["iss"] else None,
            "hold": round(statistics.median(p["hold"]), 1) if p["hold"] else None,
            "rating": rating(p["iss"], p["ret"], p["w12"]),
            "cons": [{"type": c, "units": round(per(p, c), 1)} for c, _ in p["cons"].most_common()],
            "lines": [{"name": k, "units": round(v / max(1, len(p["shuts"])), 1)} for k, v in p["lines"].most_common(5)],
            "tools": [{"name": k, "n": v} for k, v in p["tools"].most_common(5)],
            "flags": flags,
        })
    people.sort(key=lambda x: (-(x["iss"] + sum(c["units"] for c in x["cons"])), x["name"]))
    data = {"people": people, "typical": {c: round(v, 1) for c, v in typical.items()},
            "flag_level": {c: round(v, 1) for c, v in level.items()}, "min_issues": MIN_ISSUES}
    with open(out, "w") as f:
        json.dump(data, f, indent=1)
    return data


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--pair", action="append", required=True)
    ap.add_argument("--aliases", help="COMPANY_ALIASES.txt")
    a = ap.parse_args(argv)
    al = {}
    if a.aliases and os.path.isfile(a.aliases):
        for line in open(a.aliases, encoding="utf-8-sig"):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                al[k.strip().upper()] = v.strip()
    d = build(a.out, [tuple(x.split("=", 1)) for x in a.pair], al)
    pp = d["people"]
    rated = [p for p in pp if p["rating"] is not None]
    print("  people {}  rated {}  ratings {}".format(len(pp), len(rated), dict(sorted(collections.Counter(p["rating"] for p in rated).items()))))
    print("  flagged {}  flag levels {}".format(sum(1 for p in pp if p["flags"]), d["flag_level"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
