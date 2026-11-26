#!/usr/bin/env python3
"""Tool names in the Coates house style, for a person to check.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python draft_tool_names.py REPORT.html OUT.csv [--approved INDEX.csv] [--keep EXISTING.csv]

The house style is the one already signed off on the Phosphate job:
"Socket - Impact - Long - 30mm - 3/4 Inch Drive", "Spanner - Combo - 1 1/16
Inch (27.0mm)", "Battery - Cordless - 18V - 6Ah - Milwaukee".

For each tool description in a built report page this writes one row:

  * Source "Approved": the product variant is in the approved list (a CSV with
    'Product variant' and 'Item' columns, such as a pictures pack index), so
    the name is the approved one, word for word.
  * Source "Drafted": no approved name exists. The name is SiteIQ's own words
    set out in the house style. Nothing is added but the millimetre equal of
    an imperial size, which is arithmetic. A person checks these.

The list is the lookup build_showcase.py reads with --tool-names. With --keep,
names in an existing list are carried over untouched.
"""
import argparse
import csv
import json
import os
import re
import sys
from decimal import ROUND_HALF_UP, Decimal
from fractions import Fraction

DRIVE = r"(1/2|3/4|3/8|1)\s?(?:inch|in)?\s*-?\s*(?:Drive|Dr)\b"
FIX = (("Stilsens", "Stillson"), ("Stilsen", "Stillson"), ("Stilsons", "Stillson"), ("Screw Driver", "Screwdriver"), ("Led", "LED"),
       ("Swl", "SWL"), ("Tig", "TIG"), ("Unf", "UNF"), ("Unc", "UNC"), ("Roe", "ROE"), ("insulated", "Insulated"), ("inhex", "Inhex"), ("internal", "Internal"))


def units(t):
    """mm, kg, Inch, Metre and friends written the house way."""
    t = t.replace("–", "-")
    t = re.sub(r"(\d)\s?[Mm]{2}\b", r"\1mm", t)
    t = re.sub(r"(\d)\s?Kg\b", r"\1kg", t, flags=re.I)
    t = re.sub(r"(\d)\s?[Ll]b\b", r"\1lb", t)
    t = re.sub(r"(\d)\s?[Oo]z\b", r"\1oz", t)
    t = re.sub(r"(\d)\s?A[Hh]\b", r"\1Ah", t)
    t = re.sub(r"(\d)\s?(?:inch|Inch|in)\b", r"\1 Inch", t)
    t = re.sub(r"(\d)\s?[Mm]\b", r"\1 Metre", t)
    t = re.sub(r"\b(\d+)Pc\b", r"\1 Piece", t)
    t = re.sub(r"(\d)\s?[Xx]\s?(\d)", r"\1 x \2", t)
    for a, b in FIX:
        t = re.sub(r"\b" + a + r"\b", b, t)
    return t


def inches(text):
    """'1 1/16' -> '1 1/16 Inch (27.0mm)'. None when the text is not an inch size."""
    t = re.sub(r"\s*-\s*", " ", text.strip())
    if not re.fullmatch(r"\d+( \d+/\d+)?|\d+/\d+", t):
        return None
    val = sum(Fraction(p) for p in t.split())
    mm = (Decimal(val.numerator) / Decimal(val.denominator) * Decimal("25.4")).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
    return "{} Inch ({}mm)".format(t, mm)


def size(t):
    """One size in the house style: metric as it is, imperial with its millimetre equal."""
    t = re.sub(r"\s+", " ", t.replace("–", "-").strip(" -()"))
    t = re.sub(r"(\d)\s?[Mm]{2}\b", r"\1mm", t)
    t = re.sub(r"\s?(?:inch|Inch|in)\b", "", t)
    if "/" in t and "mm" in t and re.search(r"\d/\d+\s*/\s*\d+mm|mm\s*/\s*\d", t) and not re.fullmatch(r"\d+mm\s*/\s*\d+mm", t):
        t = re.split(r"\s*/\s*(?=\d+mm)", t)[0]                    # 1 1/4inch/32mm: the inch size, with its exact mm
    return inches(t) or t


def socket(d):
    low = d.lower()
    m = list(re.finditer(DRIVE, d))
    drive = (m[-1].group(1) + " Inch Drive") if m else ""
    rest = (d[:m[-1].start()] + " " + d[m[-1].end():]) if m else d
    has = lambda w: re.search(r"\b" + w + r"\b", low) is not None
    rest = re.sub(r"\b(socket|impact|long|metric|imperial|set|extension|adaptor|inhex|torque|universal joint|breaker bar|ratchet bar|met|af)\b", " ", rest, flags=re.I)
    rest = re.sub(r"\s+", " ", re.sub(r"\s-\s|\s-|-\s", " ", rest)).strip(" -")
    out = ["Socket Set" if has("set") else "Socket"]
    if has("adaptor"):
        ends = [inches(x.replace("inch", "").replace("in", "").strip()) for x in re.split(r"\bto\b", rest, flags=re.I)] if rest else []
        frm = (ends[0] or "").split(" (")[0] if ends else ""
        return "Socket - Adaptor - {}{}".format(frm + " to " if frm else "", drive)
    for word, label in (("impact", "Impact"), ("long", "Long"), ("extension", "Extension"), ("inhex", "Inhex"), ("torque", "Torque"),
                        ("universal joint", "Universal Joint"), ("breaker bar", "Breaker Bar"), ("ratchet bar", "Ratchet Bar")):
        if has(word):
            out.append(label)
    sz = size(rest) if rest else ""
    if sz and len(out) == 1 and out[0] == "Socket":
        out.append("Imperial" if "Inch" in sz else "Metric")       # a plain hand socket says which
    if sz:
        out.append(sz)
    if drive:
        out.append(drive)
    if has("set") and (has("af") or has("met")):
        out.append("AF" if has("af") else "Metric")
    return " - ".join(out)


def spanner(d):
    low = d.lower()
    rest = re.sub(r"\b(spanner|combo|flogging|flat|offset|podger|ratchet|shifter|ring|adjustable|roe|open\s*-?\s*end)\b", " ", d, flags=re.I)
    paren = re.search(r"\((\d+)\s?in\s*\)", rest)                  # Shifter - 150mm (6in)
    rest = re.sub(r"\(\d+\s?in\s*\)", " ", rest)
    rest = re.sub(r"\s+", " ", re.sub(r"[()]", " ", rest)).strip(" -")
    if re.search(r"\d+\s?mm\s*[/xX]\s*\d+\s?mm", rest):            # two-ended: 21mm / 24mm
        sz = re.sub(r"\s*[/xX]\s*", " / ", re.sub(r"(\d)\s?[Mm]{2}", r"\1mm", rest))
    else:
        sz = size(rest) if rest else ""
    has = lambda w: w in low
    out = ["Spanner"]
    for word, label in (("combo", "Combo"), ("flogging", "Flogging"), ("podger", "Podger"), ("shifter", "Shifter"), ("ring", "Ring"),
                        ("adjustable", "Adjustable"), ("roe", "ROE"), ("flat", "Flat"), ("offset", "Offset"), ("ratchet", "Ratchet")):
        if has(word):
            out.append(label)
    if re.search(r"open\s*-?\s*end", low):
        out.append("Open End")
    if sz:
        out.append(sz + (" ({} Inch)".format(paren.group(1)) if paren else ""))
    return " - ".join(out)


def general(d):
    d = units(d)
    d = re.sub(r"\s*-\s*", " - ", d)                               # one kind of dash, spaced
    d = re.sub(r"^(.*[A-Za-z)])\s+(\d[\d./]*\s?(?:mm|kg|lb|oz|L|A|Ah|V| Metre| Inch)\b)$", r"\1 - \2", d)   # a trailing size gets its own part
    return re.sub(r"\s+", " ", d).strip(" -")


def draft(desc):
    d = " ".join(str(desc).split())
    low = d.lower()
    try:
        m = re.match(r"^(1 inch|3/4\"?)\s+(\d+)\s?mm socket$", low)
        if m:
            return "Socket - Metric - {}mm - {} Inch Drive".format(m.group(2), "1" if m.group(1).startswith("1") else "3/4")
        if low.startswith("socket"):
            return socket(d)
        if low.startswith("spanner") or re.search(r"\b(roe|adjustable) spanner$", low):
            return spanner(d)
        return general(d)
    except Exception:
        return d


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("report")
    ap.add_argument("out")
    ap.add_argument("--approved", help="CSV with 'Product variant' and 'Item': names already signed off")
    ap.add_argument("--keep", help="an existing list whose names are carried over as they are")
    a = ap.parse_args(argv)
    page = open(a.report, encoding="utf-8").read()
    data = json.JSONDecoder().raw_decode(page[page.index("const D=") + 8:])[0]
    approved, kept = {}, {}
    if a.approved:
        with open(a.approved, encoding="utf-8-sig", newline="") as f:
            approved = {r["Product variant"].strip().upper(): r["Item"].strip() for r in csv.DictReader(f)
                        if r.get("Item", "").strip() and (r.get("Product variant") or "").strip()}   # a blank variant matches nothing
    if a.keep and os.path.isfile(a.keep):
        with open(a.keep, encoding="utf-8-sig", newline="") as f:
            kept = {r["SiteIQ description"].strip().upper(): (r["Plain name"].strip(), r.get("Source", "Checked")) for r in csv.DictReader(f)}
    rows = []
    for key, t in sorted(data["tools"].items(), key=lambda kv: kv[1].get("raw", kv[1]["name"]).lower()):
        raw = t.get("raw", t["name"])
        var = str(t.get("var") or "").upper()
        if raw.upper() in kept:
            name, src = kept[raw.upper()]
        elif var and var in approved:
            name, src = approved[var], "Approved"
        else:
            name, src = draft(raw), "Drafted"
        rows.append((raw, name, src, t.get("var") or "", t["site"]))
    with open(a.out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["SiteIQ description", "Plain name", "Source", "Product variant", "Items on the job"])
        w.writerows(rows)
    n = sum(1 for r in rows if r[2] == "Approved")
    print("{} tool descriptions: {} approved names, {} drafted  ->  {}".format(len(rows), n, len(rows) - n, a.out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
