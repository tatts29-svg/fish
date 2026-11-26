#!/usr/bin/env python3
"""Draft plain names for SiteIQ tool descriptions, for a person to check.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python draft_tool_names.py REPORT.html OUT.csv [--keep EXISTING.csv]

Reads the tool descriptions out of a built report page and writes a two-column
list: the SiteIQ description and a plain name. The plain name only reorders
and tidies the words SiteIQ already has ("Socket - Impact - Long 24mm 1/2in
Drive" becomes "24mm long impact socket, 1/2in drive"). It adds nothing that
is not in the description. The list is the lookup build_showcase.py reads with
--tool-names, so anything a person changes in it is what the page shows; with
--keep, names already in an existing list are carried over untouched.
"""
import argparse
import csv
import json
import os
import re
import sys

DRIVE = r"(1/2|3/4|3/8|1)\s?(?:inch|in)?\s*-?\s*(?:Drive|Dr)\b"
UPPER = {"led": "LED", "swl": "SWL", "mmg": "MMG", "tig": "TIG", "unf": "UNF", "unc": "UNC", "msa": "MSA", "roe": "ROE", "af": "AF", "m18": "M18"}
BRANDS = ("Milwaukee", "Motorola", "Ridgid", "Kincrome", "Suttontools", "Greener Choice", "Lifeguard", "Ryco", "Thor", "Minsup", "Nitto", "V-TECH", "Gotcha")
FIX = (("Stilsen", "Stilson"), ("Duel Power", "Dual Power"), ("hig performance", "high performance"), ("Screw Driver", "Screwdriver"),
       ("Rivetgun", "rivet gun"), ("Quickclamp", "Quick clamp"), ("Combo", "combination"), ("Callipers", "calipers"), ("Lanyards", "lanyard"))


def units(t):
    """mm, kg, in and friends written one way."""
    t = t.replace("–", "-")
    t = re.sub(r"(\d)\s?Mm\b", r"\1mm", t)
    t = re.sub(r"(\d)\s?MM\b", r"\1mm", t)
    t = re.sub(r"(\d)\s?Kg\b", r"\1kg", t, flags=re.I)
    t = re.sub(r"(\d)\s?(?:Lb|lb)\b", r"\1lb", t)
    t = re.sub(r"(\d)\s?Oz\b", r"\1oz", t)
    t = re.sub(r"(\d)\s?M\b", r"\1m", t)
    t = re.sub(r"(\d)\s?(?:inch|Inch)\b", r"\1in", t)
    t = re.sub(r"\b(\d+)Pc\b", r"\1pc", t)
    t = re.sub(r"(\d)\s?[Xx]\s?(\d)", r"\1 x \2", t)
    t = re.sub(r"(\d)\s?A[Hh]\b", r"\1Ah", t)
    return t


def size(t):
    """An imperial or metric size written plainly: '1 - 1/16' -> '1 1/16in'."""
    t = units(t.strip(" -()"))
    t = re.sub(r"(\d)\s*-\s*(\d+/\d+)", r"\1 \2", t)            # 1-1/16, 1 - 1/16
    t = re.sub(r"\s+", " ", t)
    if re.fullmatch(r"\d+( \d+/\d+)?|\d+/\d+", t):              # a bare number or fraction is inches
        t += "in"
    return t.replace("in/", "in / ").replace(" / ", " / ")


def words(t):
    """Sentence case, keeping brands, units and known capitals."""
    out = []
    for i, w in enumerate(t.split()):
        core = w.strip("(),:")
        if core.lower() in UPPER:
            w = w.replace(core, UPPER[core.lower()])
        elif any(core.lower() == b.lower() for b in BRANDS) or re.search(r"\d", core) or (core.isupper() and len(core) > 1):
            pass
        else:
            w = w.lower()
        out.append(w)
    t = " ".join(out)
    for b in BRANDS:
        t = re.sub(re.escape(b), b, t, flags=re.I)
    return t[:1].upper() + t[1:]


def socket(d):
    m = list(re.finditer(DRIVE, d))
    drive = (m[-1].group(1) + "in drive") if m else ""
    rest = (d[:m[-1].start()] + " " + d[m[-1].end():]) if m else d
    low = rest.lower()
    rest = re.sub(r"\b(socket|impact|long|metric|imperial|set|extension|adaptor|inhex|torque|universal joint|breaker bar|ratchet bar|met|af|to)\b", " ", rest, flags=re.I)
    sz = size(re.sub(r"\s*-\s*", " - ", rest).strip(" -"))
    sz = re.sub(r"\s*-\s*$", "", re.sub(r"^\s*-\s*", "", re.sub(r"( - )+", " - ", sz))).strip()
    sz = re.sub(r"^(\d+(?: \d+/\d+)?|\d+/\d+)$", r"\1in", sz)
    has = lambda w: re.search(r"\b" + w + r"\b", low) is not None
    tail = (", " + drive) if drive else ""
    if has("breaker bar"):
        return "Breaker bar" + tail
    if has("ratchet bar"):
        return "Ratchet bar" + tail
    if has("universal joint"):
        return "Universal joint" + tail
    if has("adaptor"):
        return "Socket adaptor, {}{}".format(sz + " to " if sz else "", drive or "")
    if has("extension"):
        return "{}{}extension bar{}".format(sz + " " if sz else "", "impact " if has("impact") else "", tail)
    kind = ("long " if has("long") else "") + ("impact " if has("impact") else "") + ("inhex " if has("inhex") else "") + ("torque " if has("torque") else "")
    if has("set"):
        extra = ", AF" if has("af") else ", metric" if has("met") else ""
        return words("{}socket set{}{}".format(kind, tail, extra))
    return "{}{}socket{}".format(sz + " " if sz else "", kind, tail)


def spanner(d):
    low = d.lower()
    rest = re.sub(r"\b(spanner|combo|flogging|flat|offset|podger|ratchet|shifter|ring|open\s*-?\s*end)\b", " ", d, flags=re.I)
    paren = re.search(r"\((\d+ ?in)\s*\)", rest)                      # Shifter - 150mm (6in)
    rest = re.sub(r"\(\d+ ?in\s*\)", " ", rest)
    sz = size(re.sub(r"[()]", " ", rest))
    sz = re.sub(r"\s+", " ", sz.replace(" x ", " / ")).strip(" -")
    sz = re.sub(r"^(\d+(?: \d+/\d+)?|\d+/\d+)$", r"\1in", sz)
    has = lambda w: w in low
    mods = ("flat " if has("flat") else "") + ("offset " if has("offset") else "") + ("ratchet " if has("ratchet") else "") + ("open end " if re.search(r"open\s*-?\s*end", low) else "")
    kind = "shifter" if has("shifter") else "podger spanner" if has("podger") else "flogging spanner" if has("flogging") else \
        "combination spanner" if has("combo") else "ring spanner" if has("ring") else "spanner"
    return "{}{}{}{}".format(sz + " " if sz else "", mods, kind, " ({})".format(paren.group(1).replace(" ", "")) if paren else "")


def general(d):
    d = units(d)
    for a, b in FIX:
        d = re.sub(a, b, d, flags=re.I)
    green = bool(re.search(r"greener choice", d, re.I))
    d = re.sub(r"\s*-?\s*greener choice", "", d, flags=re.I)
    parts = [p.strip(" :") for p in re.split(r"\s+-\s*|\s*-\s+", d) if p.strip(" :")]
    if len(parts) > 1:
        head, rest = parts[0], parts[1:]
        sizes = [p for p in rest if re.match(r"^[\d.(]", p)]
        other = [p for p in rest if p not in sizes]
        d = " ".join(sizes + other[::-1] + [head])
    else:
        m = re.match(r"^(.*?\D)\s+(\d[\d./]*\s?(?:mm|m|kg|lb|oz|L|A|in)\b)(.*)$", d)   # trailing size to the front
        if m and not any(b.lower() in d.lower() for b in BRANDS):
            d = "{} {}{}".format(m.group(2), m.group(1), m.group(3))
    d = re.sub(r"\s+", " ", d)
    return words(d) + (", Greener Choice" if green else "")


def plain(desc):
    d = " ".join(str(desc).split())
    low = d.lower()
    try:
        if re.match(r"^(1 inch|3/4\"?)\s+\d+\s?mm socket$", low):
            m = re.match(r"^(1 inch|3/4\"?)\s+(\d+)\s?mm", low)
            return "{}mm socket, {} drive".format(m.group(2), "1in" if m.group(1).startswith("1") else "3/4in")
        if low.startswith("socket") and not low.startswith("socket set - torque") or low.startswith("socket set"):
            out = socket(units(d))
        elif low.startswith("spanner"):
            out = spanner(units(d))
        else:
            out = general(d)
    except Exception:
        return d
    out = re.sub(r"\s+", " ", out).strip(" ,-")
    return out[:1].upper() + out[1:]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("report")
    ap.add_argument("out")
    ap.add_argument("--keep", help="an existing list whose plain names are carried over as they are")
    a = ap.parse_args(argv)
    page = open(a.report, encoding="utf-8").read()
    data = json.JSONDecoder().raw_decode(page[page.index("const D=") + 8:])[0]
    kept = {}
    if a.keep and os.path.isfile(a.keep):
        with open(a.keep, encoding="utf-8-sig", newline="") as f:
            kept = {r["SiteIQ description"].strip().upper(): r["Plain name"].strip() for r in csv.DictReader(f)}
    rows = []
    for key, t in sorted(data["tools"].items(), key=lambda kv: kv[1].get("raw", kv[1]["name"]).lower()):
        raw = t.get("raw", t["name"])
        rows.append((raw, kept.get(raw.upper()) or plain(raw), t["site"]))
    with open(a.out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["SiteIQ description", "Plain name", "Items on the job"])
        w.writerows(rows)
    print("{} tool descriptions  ->  {}".format(len(rows), a.out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
