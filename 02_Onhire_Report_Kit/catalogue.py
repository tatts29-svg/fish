#!/usr/bin/env python3
"""Categories and sizes for a tool store's stock, read off SiteIQ descriptions.
Author: Andrew Fisher | POWERED BY SITEIQ.

Every tool and every consumable line is put in one category, and inside it
grouped by kind (the description with its size taken out) with the sizes in
order, smallest to largest. Nothing is invented: a description with no size
in it simply has none.
"""
import collections
import re

TOOL_CATS = [
    ("Radios", r"MOTOROLA|\bRADIO\b"),
    ("Height safety and lanyards", r"HARNESS|LANYARD|INERTIA REEL|RESCUE|SAFETY HOLDER|FINGER SAVER|SAFETY STEP"),
    ("Lighting", r"LIGHT LED|LED LIGHT|TOWER LIGHT|PIVOTING LIGHT|LIGHT MAGNETIC|LIGHT STAND|\bLAMPS?\b|\d+ ?LM\b"),
    ("Welding", r"WELD|OXY"),
    ("Sockets and drive tools", r"SOCKET|RATCHET|TORQUE|ALLEN KEY|INHEX"),
    ("Cordless tools and batteries", r"BATTERY|CORDLESS|MILWAUKEE|\b18V\b|\bM18\b"),
    ("Electrical and power", r"EXTENSION LEAD|EARTH LEAKAGE|DISTRIBUTION BOARD|LEAD STAND|CABLE HOOK|240V|415V|ADAPTOR 415"),
    ("Spanners, shifters and stilsons", r"SPANNER|ADJUSTABLE|STILS[EO]N|FLOGGER|PODGER|\bWRENCH\b"),
    ("Hammers, bars and punches", r"HAMMER|MALLET|PINCH BAR|CROW BAR|PODGE BAR|PUNCH|CHISEL|\bSTAMP\b"),
    ("Air tools and hoses", r"\bAIR\b|\bHOSE\b|SCABBLER|NOZZLE"),
    ("Measuring and marking", r"\bRULE\b|COMBINATION SQUARE|FRAMING SQUARE|GAUGE|SPIRIT LEVEL|TAPE MEASURE|VERNIER|CALIPER|CALLIPER|PLUMB|STRAIGHT EDGE|MIRROR"),
    ("Cutting, grinding and drilling", r"GRINDER|\bDRILL|\bSAW\b|HACKSAW|SNIPS|\bBUR\b|CUTTER|TAP AND DIE|RETHREADER|BREAKER"),
    ("Hand tools", r"PLIERS|SCREW ?DRIVER|CLAMP|RIVET"),
]
TOOL_OTHER = "Site and general"

CONS_CATS = [
    ("Gloves", r"^GLOVE"),
    ("PPE and sun safety", r"^(COVERALLS|SPECTACLES|GOGGLES|RESPIRATOR|FILTER|HELMET|HOOD|BRIM|SWEATBAND|GUMBOOTS|SUNSCREEN|LIP BALM|NET|TOWELETTE|SQWINCHER|CLIP)"),
    ("Abrasives and cutting", r"^(WHEEL|DISC|BRUSH,WIRE|BLADE|HACKSAW|SCRAPER|KNIFE)"),
    ("Welding and gas", r"^(ELECTRODE|TIP|IGNITER)"),
    ("Tapes, adhesives and sealants", r"^(TAPE,(?!MEASURE)|ADHESIVE|SILICONE|DISPENSER)"),
    ("Lubricants, cleaners and paint", r"^(CLEANER|PENETRATING OIL|LUBRICANT|ANTISEIZE|GREASE|PAINT|SOAP|MARKER)"),
    ("Slings", r"^SLING"),
    ("Batteries", r"^BATTERY"),
]
CONS_OTHER = "Site supplies, tags and lockout"

_WORD_SIZE = {"XS": 1, "S": 2, "SMALL": 2, "M": 3, "MEDIUM": 3, "L": 4, "LARGE": 4, "LGE": 4, "XL": 5, "2XL": 6, "XXL": 6, "3XL": 7}
_DRIVE = re.compile(r"(\d+(?:/\d+)?)\s*(?:inch|in|\")?\s*-?\s*Dr(?:ive)?\b", re.I)
_LEAD_DRIVE = re.compile(r"^(3/4\"?|1/2\"?|1 INCH)\s+(?=\d+ ?MM SOCKET)", re.I)


def _tidy(text):
    t = re.sub(r"\(\s*\)", " ", text)
    t = re.sub(r"\s*[-–]\s*(?=[-–]|$)", " ", t)
    t = re.sub(r"\s*-\s*-\s*", " - ", t)
    t = re.sub(r"^[\s\-–,/]+|[\s\-–,/]+$", "", " ".join(t.split()))
    t = re.sub(r"\s+-\s*|\s*-\s+", " – ", t)
    return (t.title() if t.isupper() else t) or "Other"


def _frac(whole, num, den):
    return (int(whole or 0) + int(num) / int(den)) * 25.4


def tool_size(desc):
    """(kind, drive, sort value in mm-ish units or None, size label)."""
    d = " ".join(str(desc or "").split())
    drive = ""
    if re.search(r"adaptor", d, re.I):          # an adaptor names two sizes: keep it whole
        return _tidy(d), "", None, ""
    m = _LEAD_DRIVE.match(d)
    if m:
        drive = m.group(1).replace('"', "").replace(" INCH", "") + "in"
        d = d[m.end():]
    else:
        m = _DRIVE.search(d)
        if m and re.search(r"socket|wrench|ratchet|bar", d, re.I):
            drive = m.group(1) + "in"
            d = (d[:m.start()] + " " + d[m.end():]).strip()
    if re.search(r"\d\s*kg\s*(to|and)\b|\bto\s*\d+(\.\d+)?\s*kg", d, re.I):
        return _tidy(d), drive, None, ""
    tests = [
        (r"(\d+)\s*X\s*(\d+)\s*MM", lambda g: (float(g[0]), "{} x {}mm".format(g[0], g[1]))),
        (r"(\d+(?:\.\d+)?)\s*mm\b", lambda g: (float(g[0]), "{}mm".format(g[0]))),
        (r"(?<![\d/])(\d)\s*-?\s*(\d+)/(\d+)\s*(?:inch|in\b|\")?", lambda g: (_frac(g[0], g[1], g[2]), "{} {}/{}in".format(*g))),
        (r"(?<![\d/])(\d)(\d)/(16)\s*(?:inch|in\b|\")", lambda g: (_frac(g[0], g[1], g[2]), "{} {}/{}in".format(*g))),
        (r"(?<![\d/])(\d+)/(\d+)\s*(?:inch|in\b|\")?(?![\d/])", lambda g: (_frac(0, g[0], g[1]), "{}/{}in".format(*g))),
        (r"(\d+)\s*(?:inch\b|in\b|\")", lambda g: (float(g[0]) * 25.4, "{}in".format(g[0]))),
        (r"(\d+(?:\.\d+)?)\s*KG\b", lambda g: (float(g[0]) * 1000, "{}kg".format(g[0]))),
        (r"(\d+)\s*(?:LB|OZ)\b", None),
        (r"(\d+(?:\.\d+)?)\s*(?:METRES|M)\b", lambda g: (float(g[0]) * 1000, "{}m".format(g[0]))),
        (r"(\d+)\s*A\b", lambda g: (float(g[0]), "{}A".format(g[0]))),
        (r"(\d+(?:\.\d+)?)\s*AH\b", lambda g: (float(g[0]), "{}Ah".format(g[0]))),
        (r"(\d+)\s*LM\b", lambda g: (float(g[0]), "{}lm".format(g[0]))),
        (r"(\d+)\s*L\b", lambda g: (float(g[0]), "{}L".format(g[0]))),
    ]
    for pat, fn in tests:
        m = re.search(pat, d, re.I)
        if not m:
            continue
        if fn is None:
            unit = re.search(r"(LB|OZ)", m.group(0), re.I).group(1).lower()
            val, lab = float(m.group(1)) * (453.6 if unit == "lb" else 28.35), "{}{}".format(m.group(1), unit)
        else:
            val, lab = fn(m.groups())
        kind = (d[:m.start()] + " " + d[m.end():])
        return _tidy(kind), drive, val, lab
    m = re.search(r"\b(Small|Medium|Large)\b", d, re.I)
    if m:
        return _tidy(d[:m.start()] + " " + d[m.end():]), drive, _WORD_SIZE[m.group(1).upper()], m.group(1).title()
    m = re.search(r"(?i)^(Spanner - Combo)\s+(\d)$", d)
    if m:
        return _tidy(m.group(1)), drive, float(m.group(2)) * 25.4, "{}in".format(m.group(2))
    return _tidy(d), drive, None, ""


def tool_category(desc):
    u = " ".join(str(desc or "").split()).upper()
    for name, pat in TOOL_CATS:
        if re.search(pat, u):
            return name
    return TOOL_OTHER


def cons_clean(desc):
    d = re.sub(r"\s*(2?MMG ?20\d\d|20\d\dMMG|\bMMG)\s*v?\s*$", "", " ".join(str(desc or "").split()), flags=re.I).strip()
    d = re.sub(r"\bL(\d+MM)\b", r"\1", d)     # L406MM is a length, 406mm
    return re.sub(r"^GLOVER\b", "GLOVES", re.sub(r"\s+v$", "", d))


def cons_category(desc):
    u = cons_clean(desc).upper()
    for name, pat in CONS_CATS:
        if re.search(pat, u):
            return name
    return CONS_OTHER


def cons_size(desc, tidy=None):
    """(kind, sort value or None, size label) for one consumable line."""
    d = cons_clean(desc)
    parts = [p.strip() for p in d.split(",") if p.strip()]
    tests = [
        (r"SIZE-(\w+)/(\d+)", lambda g: (float(g[1]), "Size {}".format(g[1]))),
        (r"SZ[- ](\d+)", lambda g: (float(g[0]), "Size {}".format(g[0]))),
        (r"^(XS|S|M|L|XL|2XL|3XL|LARGE|MEDIUM|SMALL)$", lambda g: (float(_WORD_SIZE[g[0].upper()]), {"LARGE": "L", "MEDIUM": "M", "SMALL": "S"}.get(g[0].upper(), g[0].upper()))),
        (r"^(\d{1,2})$", lambda g: (float(g[0]), "Size {}".format(g[0]))),
        (r"^(\d+)T$", lambda g: (float(g[0]) * 1000, "{}t".format(g[0]))),
        (r"^(AAA|AA)$", lambda g: ({"AAA": 1.0, "AA": 2.0}[g[0].upper()], g[0].upper())),
        (r"(\d+(?:\.\d+)?)\s*X\s*(\d+(?:\.\d+)?)\s*(?:X\s*\d+)?\s*MM", lambda g: (float(g[0]) * 1000 + float(g[1]), "{} x {}mm".format(g[0], g[1]))),
        (r"(\d+)\s*MM\s*X\s*(\d+)\s*MM\b", lambda g: (float(g[0]), "{} x {}mm".format(g[0], g[1]))),
        (r"(\d+)\s*M\s*X\s*(\d+)\s*MM\b", lambda g: (float(g[0]) * 1000, "{}m x {}mm".format(g[0], g[1]))),
        (r"(\d+)\s*MM\s*X\s*(\d+)\s*M\b", lambda g: (float(g[0]), "{}mm x {}m".format(g[0], g[1]))),
        (r"(\d+(?:\.\d+)?)\s*MM\b", lambda g: (float(g[0]), "{}mm".format(g[0]))),
        (r"(\d+)\s*(?:ML|G)\b", lambda g: (float(g[0]), g[0] + ("ml" if "ML" in d.upper() and re.search(g[0] + r"\s*ML", d, re.I) else "g"))),
        (r"(\d+)\s*L\b", lambda g: (float(g[0]) * 1000, "{}L".format(g[0]))),
    ] + ([(r"^(\d+)M$", lambda g: (float(g[0]), "{}m".format(g[0])))] if d.upper().startswith("TAPE") else [])
    word_first = bool(re.match(r"(?i)GLOVE|COVERALLS|GUMBOOTS|SLING|BATTERY", d))
    order = range(len(parts) - 1, 0, -1)
    for pat, fn in tests:
        for i in order:
            m = re.search(pat, parts[i], re.I)
            if m and (word_first or not re.fullmatch(r"\d{1,2}|XS|S|M|L|XL|2XL|3XL", parts[i], re.I)):
                val, lab = fn(m.groups())
                rest = parts[:i] + ([re.sub(pat, "", parts[i], flags=re.I).strip(" -/")] if not re.fullmatch(pat, parts[i], re.I) else []) + parts[i + 1:]
                kind = ", ".join(p for p in rest if p)
                if d.upper().startswith("SLING"):
                    m2 = re.search(r"\b(\d+)M\b", d)
                    if m2:
                        val, lab = val + float(m2.group(1)), "{} x {}m".format(lab, m2.group(1))
                        kind = ", ".join(p for p in rest if p and not re.fullmatch(r"\d+M", p))
                    kind = re.sub(r",?\s*WRS-[\d\-A-Z]+", "", kind)
                return (tidy(kind) if tidy else kind), val, lab
    return (tidy(d) if tidy else d), None, ""


def _pack(groups, cat_order, pics=None, descs=None):
    """{cat: {kind: [(value, label, n, out)]}} -> the list the page reads."""
    out = []
    for cat in sorted(groups, key=lambda c: (cat_order.index(c) if c in cat_order else 99)):
        kinds = []
        for kind, sizes in groups[cat].items():
            merged = collections.OrderedDict()
            for val, lab, n, o in sorted(sizes, key=lambda s: (s[0] is None, s[0] or 0, s[1])):
                key = lab
                if key in merged:
                    merged[key][1] += n
                    merged[key][2] += o
                else:
                    merged[key] = [val, n, o]
            chips = [{"s": lab, "n": int(v[1]), "o": int(v[2])} for lab, v in merged.items()]
            vals = [v[0] for v in merged.values() if v[0] is not None]
            kinds.append({"name": kind, "n": sum(c["n"] for c in chips), "o": sum(c["o"] for c in chips),
                          "min": min(vals) if vals else None, "sizes": chips, "pic": (pics or {}).get((cat, kind)),
                          "d": sorted((descs or {}).get((cat, kind), []))})
        kinds.sort(key=lambda k: (k["name"].lower(), k["min"] or 0))
        out.append({"name": cat, "n": sum(k["n"] for k in kinds), "o": sum(k["o"] for k in kinds),
                    "kinds": kinds, "lines": sum(len(k["sizes"]) for k in kinds)})
    return out


def tool_catalogue(rows, is_on, pic_of=None):
    groups = collections.defaultdict(lambda: collections.defaultdict(list))
    pics, descs = {}, collections.defaultdict(set)
    for r in rows:
        desc = r.get("ITEM_DESCRIPTION")
        kind, drive, val, lab = tool_size(desc)
        name = kind + (" · {} drive".format(drive) if drive else "")
        cat = tool_category(desc)
        groups[cat][name].append((val, lab, 1, 1 if is_on(r) else 0))
        descs[(cat, name)].add(" ".join(str(desc or "").split()).upper())
        if pic_of and (cat, name) not in pics:
            p = pic_of(r)
            if p is not None:
                pics[(cat, name)] = p
    return _pack(groups, [c for c, _ in TOOL_CATS] + [TOOL_OTHER], pics, descs)


def cons_catalogue(rows, qty, tidy=None):
    groups = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in rows:
        desc = r.get("SKU_DESCRIPTION")
        kind, val, lab = cons_size(desc, tidy)
        groups[cons_category(desc)][kind].append((val, lab, qty(r), 0))
    return _pack(groups, [c for c, _ in CONS_CATS] + [CONS_OTHER])
