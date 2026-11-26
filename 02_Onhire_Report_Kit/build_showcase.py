#!/usr/bin/env python3
"""MMG tool store showcase - one self-contained, animated web page built
from the same SiteIQ exports (and the same naming rules) as the on-hire
kit. Author: Andrew Fisher | POWERED BY SITEIQ.

    python build_showcase.py KIT_FOLDER OUT.html [--reference REF.json]
                             [--minmax MINMAX.xlsx] [--history HISTORY.json]

KIT_FOLDER is a kit folder (JOB.txt, COMPANY_ALIASES.txt, OWNER_ALIASES.txt,
Data_SiteIQ with the exports, _fonts). Nothing here carries a cost or a
rate: client pages never do. Figures are only what the exports say; a
trend appears once there are pulls to draw it from.
"""
import argparse
import base64
import collections
import datetime as dt
import importlib.util
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import catalogue  # noqa: E402
import shut_costs  # noqa: E402


def _kit():
    spec = importlib.util.spec_from_file_location("onhire_kit", os.path.join(HERE, "build_onhire_workbook.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _ref_time(kit, path):
    """REQUESTED_DATE/TIME off an export's REFERENCE_INFO sheet."""
    wb = kit._open_ro(path)
    try:
        rows = list(wb["REFERENCE_INFO"].iter_rows(min_row=1, max_row=2, values_only=True))
    finally:
        wb.close()
    head = [str(c or "").strip().upper() for c in rows[0]]
    vals = dict(zip(head, rows[1]))
    out = {}
    for k, v in vals.items():
        if k.startswith("REQUESTED_DATE"):
            out["requested"] = dt.datetime.strptime(str(v).strip(), "%d/%m/%Y %I:%M %p")
        if k == "REPORT_PERIOD" and v:
            a, b = [x.strip() for x in str(v).split(" - ")]
            out["period"] = (dt.datetime.strptime(a, "%d/%m/%Y %H:%M:%S"),
                             dt.datetime.strptime(b, "%d/%m/%Y %H:%M:%S"))
        if k == "PROJECT SCHEDULE":
            out["schedule"] = str(v).strip()
    return out


def _date(v):
    if isinstance(v, dt.datetime):
        return v.date()
    s = str(v or "").strip()
    for f in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(s[:10], f).date()
        except ValueError:
            pass
    return None


def _time(v):
    s = str(v or "").strip()
    for f in ("%I:%M %p", "%H:%M:%S", "%H:%M"):
        try:
            return dt.datetime.strptime(s, f).time()
        except ValueError:
            pass
    return None


_KIND_FIX = {"CORDLESS LIGHTS": "Cordless Light", "RADIO BATTERY": "Radio Battery"}


def _kind(product):
    p = " ".join(str(product or "").split())
    if not p:
        return "Other"
    return _KIND_FIX.get(p.upper(), p if not p.isupper() else p.title().replace("&", "&"))


def _family(fam):
    f = " ".join(str(fam or "").split()).upper()
    if f.startswith("INDUSTRIAL TOOLS"):
        return "Industrial Tools & Equipment"
    return f.title().replace(" & ", " & ") if f else "Other"


def _cons_type(desc):
    w = str(desc or "").split(",")[0].strip().upper()
    w = {"GLOVER": "GLOVES"}.get(w, w)
    return w.title() if w else "Other"


def _cons_name(kit, desc):
    d = re.sub(r"\s*2?MMG2025\s*$", "", str(desc or "")).strip()
    try:
        return kit.item_name(d) if hasattr(kit, "item_name") else d
    except Exception:
        return d


def _fonts(kit_folder):
    """Inter, subset to Latin, as base64 WOFF. Empty when the fonts or
    fontTools are not to hand: the page then falls back to the system face."""
    out = {}
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        return out
    for weight, fname in ((400, "Inter-Regular.ttf"), (600, "Inter-SemiBold.ttf"), (700, "Inter-Bold.ttf")):
        p = os.path.join(kit_folder, "_fonts", fname)
        if not os.path.isfile(p):
            continue
        font = TTFont(p)
        opts = subset.Options()
        opts.flavor = "woff"
        opts.layout_features = ["kern", "liga", "tnum", "lnum"]
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=list(range(0x20, 0x7F)) + [0xA0, 0xB7, 0xD7, 0x2013, 0x2014, 0x2018, 0x2019,
                                                         0x201C, 0x201D, 0x2026, 0x2022, 0x2192, 0x2191, 0x2193, 0x25CF])
        sub.subset(font)
        buf = io.BytesIO()
        font.flavor = "woff"
        font.save(buf)
        out[weight] = base64.b64encode(buf.getvalue()).decode("ascii")
    return out


#  Test-and-tag / inspection colour, the standard three-monthly scheme
#  (Andrew, 26 Nov 2026): Dec-Feb red, Mar-May green, Jun-Aug blue, Sep-Nov yellow.
_TAG = [((12, 1, 2), "Red", "#E5322D", "Dec to Feb"), ((3, 4, 5), "Green", "#2FA84F", "Mar to May"),
        ((6, 7, 8), "Blue", "#2F6FE0", "Jun to Aug"), ((9, 10, 11), "Yellow", "#F5C518", "Sep to Nov")]


def tag_colour(day):
    for months, name, hexv, span in _TAG:
        if day.month in months:
            return {"name": name, "hex": hexv, "span": span}


_ELEC = re.compile(r"240V|415V|ELECTRIC|EXTENSION LEAD|EARTH LEAKAGE|POWER PACK|DISTRIBUTION BOARD|WELDER|"
                   r"WELDING EARTH LEAD|GENERATOR|CHARGER|TRANSFORMER|\b(10|15|20|32) ?A\b|\b32 AMP\b", re.I)
_NOT_ELEC = re.compile(r"CABLE HOOK|SOCKET ADAPTOR|AIR HOSE|IMPERIAL ADAPTOR|LEAD STAND|BATTERY|CORDLESS|\b18V\b|\bM18\b", re.I)
_RIG = re.compile(r"SLING|SHACKLE|CHAIN BLOCK|LEVER HOIST|\bHOIST|BEAM CLAMP|PLATE CLAMP|LIFTING|RIGGING|TIRFOR|EYE BOLT|"
                  r"SWIVEL|SPREADER|SNATCH|PULL ?LIFT|COME ?ALONG|HARNESS|INERTIA REEL|FALL ARREST|RESCUE|TRIPOD|"
                  r"ROPE LANYARD|RETRACTABLE LANYARD|LANYARD - RETRACTABLE|SHOCK ABSORB|ANCHOR STRAP|DAVIT", re.I)


def tag_kind(r):
    """'elec', 'rig' or None for one RENTAL_STOCK row (Coates gear only)."""
    desc = " ".join(str(r.get("ITEM_DESCRIPTION") or "").split())
    prod = " ".join(str(r.get("PRODUCT") or "").split()).upper()
    fam = " ".join(str(r.get("PRODUCT_FAMILY") or "").split()).upper()
    if "TOOL LANYARD" in prod or "TOOL LANYARD" in desc.upper():
        return None
    if _RIG.search(desc) or "SLINGS, SHACKLES" in prod or "RESCUE KIT" in prod:
        return "rig"
    if _NOT_ELEC.search(desc):
        return None
    if _ELEC.search(desc) or prod in ("ELECTRICAL LEADS & ACCESSORIES", "WELDERS - ELECTRIC") or fam.startswith("GENERATORS"):
        return "elec"
    return None


class Pictures(object):
    """Tool pictures from a pictures pack (a folder with an index CSV that has
    'Product variant' and 'File in this package' columns), matched to SiteIQ's
    PRODUCT_VARIANT. Kept outside git. Radios and radio batteries get none."""

    def __init__(self, folder, side=112):
        self.files, self.used, self.order, self.side, self.folder = {}, {}, [], side, folder
        if not folder or not os.path.isdir(folder):
            return
        import csv
        for name in os.listdir(folder):
            if name.lower().endswith(".csv"):
                with open(os.path.join(folder, name), encoding="utf-8-sig", newline="") as f:
                    for row in csv.DictReader(f):
                        v, p = (row.get("Product variant") or "").strip().upper(), (row.get("File in this package") or "").strip()
                        if v and p and os.path.isfile(os.path.join(folder, p)):
                            self.files.setdefault(v, p)

    def of(self, row):
        """An index into the page's picture list for this stock row, or None."""
        if "RADIO" in str(row.get("ITEM_DESCRIPTION") or "").upper():
            return None
        v = str(row.get("PRODUCT_VARIANT") or "").strip().upper()
        if v not in self.files:
            return None
        if v not in self.used:
            self.used[v] = len(self.order)
            self.order.append(v)
        return self.used[v]

    def data(self):
        from PIL import Image
        out = []
        for v in self.order:
            im = Image.open(os.path.join(self.folder, self.files[v])).convert("RGB")
            im.thumbnail((self.side, self.side), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=78, optimize=True)
            out.append("data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii"))
        return out


def _ops(kit, path):
    """The average-day figures from build_store_ops.py, with consumable names tidied."""
    if not path or not os.path.isfile(path):
        return None
    d = json.load(open(path))
    for c in d.get("cons_lines", []):
        c["name"] = _cons_name(kit, c["name"])
    return d


def _cons_peaks(path):
    """Per consumable line, from the Min/Max workbook's own daily sheets (one
    per past shut): the busiest single day in any shut, the average of each
    shut's busiest day, and the most drawn in one shut. Counted, not estimated."""
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    per = collections.defaultdict(list)                 # sku -> one list of daily units per shut
    for name in wb.sheetnames:
        if not name.endswith(" Daily"):
            continue
        rows = wb[name].iter_rows(min_row=5, values_only=True)
        head = [str(c or "").strip().upper() for c in next(rows)]
        last = head.index("TOTAL") if "TOTAL" in head else len(head)
        for row in rows:
            if row[0]:
                per[str(row[0])].append([float(v) if isinstance(v, (int, float)) else 0.0 for v in row[2:last]])
    out = {}
    for sku, shuts in per.items():
        used = [d for d in shuts if sum(d) > 0]
        if used:
            peaks = [max(d) for d in used]
            out[sku] = {"peak": int(max(peaks)), "avgpeak": round(sum(peaks) / len(peaks), 1),
                        "most": int(max(sum(d) for d in used)), "nshut": len(used)}
    return out


def _band(vals):
    if not vals:
        return []
    return [{"name": "Quietest shut", "n": round(min(vals))},
            {"name": "Typical shut", "n": round(sum(vals) / len(vals))},
            {"name": "Busiest shut", "n": round(max(vals))}]


def build_data(kit, folder, reference=None, minmax=None, history=None, shuts=None, ops=None, keepers=("", ""), pictures=None, people=None):
    s = kit.the_site(folder)
    kit._NAMES["aliases"] = kit.read_aliases(folder)
    kit._NAMES["owners"] = kit.read_aliases(folder, "OWNER_ALIASES.txt")
    kit._NAMES["statuses"] = kit.read_aliases(folder, "STATUS_ALIASES.txt")
    kit._NAMES["tidy"] = s.tidy_names
    kit._NAMES["acronyms"] = s.acronyms
    find = lambda stem: kit.find_export(folder, stem + "*.xlsx", s)
    p_rental, p_sales, p_trans = find("RENTAL_STOCK"), find("SALES_STOCK"), find("TRANSACTIONS")
    rental = kit._rows(p_rental, "RENTAL_STOCK", must_have=True)
    sales = kit._rows(p_sales, "SALES_STOCK", must_have=True)
    ref = _ref_time(kit, p_rental)
    tref = _ref_time(kit, p_trans) if p_trans else {}
    asat = ref["requested"]
    today = asat.date()

    coates = [r for r in rental if "COATES" in kit._s(r.get("OWNER")).upper()]
    others = [r for r in rental if "COATES" not in kit._s(r.get("OWNER")).upper()]
    other_owner = collections.Counter(kit.co_name(r.get("OWNER")) for r in others).most_common(1)
    other_owner = other_owner[0][0] if other_owner else "Customer"
    on = [r for r in rental if kit._s(r.get("ITEM_STATUS")) == "On Hire"]
    held = [r for r in coates if kit._s(r.get("ITEM_STATUS")) == "Failed Baseplan"]

    by_co = collections.Counter(kit.co_name(r.get("COMPANY_NAME")) for r in on)
    by_hirer = collections.Counter((kit.person_name(r.get("HIRER_NAME")), kit.co_name(r.get("COMPANY_NAME"))) for r in on)

    dkey = lambda r: " ".join(str(r.get("ITEM_DESCRIPTION") or "").split()).upper()
    dname = {}
    for r in rental:
        raw = " ".join(str(r.get("ITEM_DESCRIPTION") or "").split())
        dname.setdefault(dkey(r), raw.title() if raw.isupper() else raw)
    pix = Pictures(pictures)
    dpic = {}
    for r in rental:
        if dkey(r) not in dpic:
            p_ = pix.of(r)
            if p_ is not None:
                dpic[dkey(r)] = p_
    kinds_fleet = collections.Counter(dkey(r) for r in rental)
    kinds_on = collections.Counter(dkey(r) for r in on)
    fam_fleet = collections.Counter(_family(r.get("PRODUCT_FAMILY")) for r in coates)
    fam_on = collections.Counter(_family(r.get("PRODUCT_FAMILY")) for r in on if r in coates)

    issued_today, back_today = [], []
    for r in rental:
        d, t = _date(r.get("ON_HIRE_DATE")), _time(r.get("ON_HIRE_TIME"))
        if d == today and t:
            issued_today.append((t, r))
    hours = list(range(5, 24))
    hour_out = [0] * len(hours)
    hour_back = [0] * len(hours)
    for t, r in issued_today:
        if t.hour in hours:
            i = hours.index(t.hour)
            hour_out[i] += 1
            if kit._s(r.get("ITEM_STATUS")) != "On Hire":
                hour_back[i] += 1
    still_out_today = sum(1 for t, r in issued_today if kit._s(r.get("ITEM_STATUS")) == "On Hire")

    stock = [r for r in sales if not kit._s(r.get("COMPANY_NAME"))]
    drawn = [r for r in sales if kit._n(r.get("SALES_QUANTITY")) > 0]
    units = sum(kit._n(r.get("AVAILABLE_QUANTITY")) for r in stock)
    ctype = collections.Counter()
    for r in stock:
        ctype[_cons_type(r.get("SKU_DESCRIPTION"))] += kit._n(r.get("AVAILABLE_QUANTITY"))
    top_lines = sorted(stock, key=lambda r: -kit._n(r.get("AVAILABLE_QUANTITY")))[:8]

    below, to_max, mm_lines = [], 0, 0
    if minmax and os.path.isfile(minmax):
        import openpyxl
        ws = openpyxl.load_workbook(minmax, data_only=True, read_only=True)["Min Max"]
        mm = {}
        hdr = [str(c or "").strip().upper() for c in next(ws.iter_rows(min_row=5, max_row=5, values_only=True))]
        i_mn, i_mx = hdr.index("MIN"), hdr.index("MAX")
        i_pd = next((i for i, v in enumerate(hdr) if v.startswith("PER DAY")), None)
        mm_pd = {}
        for row in ws.iter_rows(min_row=6, values_only=True):
            if row[0] and isinstance(row[i_mn], (int, float)):
                mm[str(row[0])] = (row[i_mn], row[i_mx])
                if i_pd is not None and isinstance(row[i_pd], (int, float)):
                    mm_pd[str(row[0])] = row[i_pd]
        for r in stock:
            sku = kit._s(r.get("SKU_NUMBER"))
            if sku in mm and mm[sku][1]:
                mm_lines += 1
                have = kit._n(r.get("AVAILABLE_QUANTITY"))
                mn, mx = mm[sku]
                to_max += max(0, mx - have)
                if have < mn:
                    below.append({"line": _cons_name(kit, r.get("SKU_DESCRIPTION")), "have": int(have), "min": int(mn), "max": int(mx)})
        below.sort(key=lambda x: x["have"] - x["min"])
        peaks = _cons_peaks(minmax)
    else:
        mm, mm_pd, peaks = {}, {}, {}
    clines = []
    for r in stock:
        sku = kit._s(r.get("SKU_NUMBER"))
        clines.append({"name": _cons_name(kit, r.get("SKU_DESCRIPTION")), "type": catalogue.cons_category(r.get("SKU_DESCRIPTION")),
                       "word": _cons_type(r.get("SKU_DESCRIPTION")), "have": int(kit._n(r.get("AVAILABLE_QUANTITY"))),
                       "min": int(mm[sku][0]) if sku in mm else None, "max": int(mm[sku][1]) if sku in mm else None,
                       "pd": round(mm_pd[sku], 1) if sku in mm_pd else None,
                       "peak": peaks.get(sku, {}).get("peak"), "avgpeak": peaks.get(sku, {}).get("avgpeak"),
                       "most": peaks.get(sku, {}).get("most")})
    clines.sort(key=lambda c: c["name"].lower())

    counter_start = dt.date(2026, 11, 25)
    counter_days = 7
    day_no = (today - counter_start).days + 1

    snap = {"asat": asat.strftime("%Y-%m-%d %H:%M"), "on_hire": len(on), "issued_today": len(issued_today),
            "coates_out": sum(1 for r in on if r in coates), "other_out": sum(1 for r in on if r not in coates),
            "cons_units": int(units)}
    hist = []
    if history:
        try:
            hist = json.load(open(history))
        except (OSError, ValueError):
            hist = []
        hist = [h for h in hist if h.get("asat") != snap["asat"]] + [snap]
        hist.sort(key=lambda h: h["asat"])
        json.dump(hist, open(history, "w"), indent=1)
    else:
        hist = [snap]

    # every item on hire, for the detail sheets and the on-hire downloads
    pkey = lambda r: " ".join(str(r.get("HIRER_NAME") or "").replace("-", " ").split()).upper()
    onhire_rows = []
    for r in on:
        t_ = _time(r.get("ON_HIRE_TIME"))
        d_ = _date(r.get("ON_HIRE_DATE"))
        onhire_rows.append({"co": kit.co_name(r.get("COMPANY_NAME")), "who": kit.person_name(r.get("HIRER_NAME")), "pk": pkey(r),
                            "item": kit._s(r.get("ITEM_NUMBER")), "desc": dname.get(dkey(r), ""), "dk": dkey(r),
                            "date": d_.strftime("%d %b %Y") if d_ else "", "time": t_.strftime("%H:%M") if t_ else "",
                            "own": "Coates" if r in coates else other_owner})
    onhire_rows.sort(key=lambda x: (x["co"].lower(), x["who"].lower(), x["desc"].lower()))
    phist = json.load(open(people)) if people and os.path.isfile(people) else {"people": [], "typical": {}}
    ptyp = phist.get("typical", {})
    now_n = collections.Counter(x["pk"] for x in onhire_rows)
    people_rows, seen_p = [], set()
    for p_ in phist["people"]:
        seen_p.add(p_["key"])
        q_ = dict(p_)
        q_["now"] = now_n.get(p_["key"], 0)
        q_["co"] = kit.co_name(q_.get("co"))
        for ln in q_.get("lines", []):
            ln["name"] = _cons_name(kit, ln["name"])
        people_rows.append(q_)
    for x in onhire_rows:
        if x["pk"] not in seen_p:
            seen_p.add(x["pk"])
            people_rows.append({"key": x["pk"], "name": x["who"], "co": x["co"], "iss": 0, "ret": 0, "left": 0, "w12": None, "hold": None,
                                "rating": None, "cons": [], "lines": [], "tools": [], "flags": [], "now": now_n[x["pk"]]})
    for r in drawn:
        k_ = " ".join(str(r.get("HIRER") or "").replace("-", " ").split()).upper()
        if k_ and k_ not in seen_p:
            seen_p.add(k_)
            people_rows.append({"key": k_, "name": kit.person_name(r.get("HIRER")), "co": kit.co_name(r.get("COMPANY_NAME")), "iss": 0, "ret": 0, "left": 0,
                                "w12": None, "hold": None, "rating": None, "cons": [], "lines": [], "tools": [], "flags": [], "now": 0})
    people_rows.sort(key=lambda p_: (-p_["now"], -(p_["iss"] + sum(c["units"] for c in p_["cons"])), p_["name"]))
    # consumable draws recorded so far this shut
    dl, dt_, dp, dco = collections.Counter(), collections.Counter(), collections.defaultdict(collections.Counter), collections.Counter()
    for r in drawn:
        q_ = kit._n(r.get("SALES_QUANTITY"))
        nm_ = _cons_name(kit, r.get("SKU_DESCRIPTION"))
        dl[nm_] += q_
        dt_[catalogue.cons_category(r.get("SKU_DESCRIPTION"))] += q_
        dco[kit.co_name(r.get("COMPANY_NAME"))] += q_
        dp[" ".join(str(r.get("HIRER") or "").replace("-", " ").split()).upper()][nm_] += q_
    draws = {"n": len(drawn), "units": int(sum(dl.values())), "people": len(dp),
             "lines": [{"name": k, "n": int(v)} for k, v in dl.most_common(10)],
             "types": [{"name": k, "n": int(v)} for k, v in dt_.most_common()],
             "cos": [{"name": k, "n": int(v)} for k, v in dco.most_common()],
             "by": {k: [{"name": n_, "n": int(v)} for n_, v in c.most_common()] for k, c in dp.items()}}
    tagc = tag_colour(dt.date(2026, 11, 25))   # tagged before the shut: the colour of the quarter the counter opened in
    tg = {"elec": collections.Counter(), "rig": collections.Counter()}
    tgo = {"elec": 0, "rig": 0}
    for r in coates:
        k = tag_kind(r) if r not in held else None   # held back = not cleared, so no tested tag
        if k:
            tg[k][" ".join(str(r.get("ITEM_DESCRIPTION")).split())] += 1
            tgo[k] += 1 if r in on else 0
    tagged = {"colour": tagc,
              "groups": [{"key": k, "title": t, "n": sum(tg[k].values()), "out": tgo[k],
                          "kinds": [{"name": n, "n": v} for n, v in tg[k].most_common()]}
                         for k, t in (("elec", "Electrical"), ("rig", "Rigging, lifting and fall arrest"))]}
    tag_of = {}
    for r in coates:
        k = tag_kind(r)
        if k:
            tag_of[dkey(r)] = k

    def held_groups():
        g = collections.Counter(kit._s(r.get("ITEM_DESCRIPTION")) for r in held)
        return [{"name": k, "n": v} for k, v in g.most_common()]

    top_kinds = [k for k, _ in kinds_on.most_common(6)]
    sh = json.load(open(shuts)) if shuts and os.path.isfile(shuts) else None
    best = collections.Counter()
    if sh:
        for t in sh["tools"]:
            for k, v in t["peaks"].items():
                best[k] = max(best[k], v)
    cand = [k for k in kinds_fleet if kinds_on[k] or best[k]]
    cand.sort(key=lambda k: (-max(kinds_on[k], best[k]), -kinds_on[k], k))
    tools_util = [{"name": dname.get(k, k), "site": kinds_fleet[k], "on": kinds_on[k], "best": best[k], "pic": dpic.get(k)} for k in cand[:12]]
    data = {
        "job": {"title": "MMG Dugald River", "sub": "Shutdown Tool Store · November 2026 shut",
                "schedule": ref.get("schedule", ""), "day": day_no, "days": counter_days,
                "window": "Counter open Wed 25 Nov to Tue 01 Dec 2026"},
        "asat": asat.strftime("%d %b %Y %H:%M").lstrip("0"),
        "asat_day": asat.strftime("%A"),
        "tx_window": ("{} to {}".format(tref["period"][0].strftime("%d %b %H:%M"), tref["period"][1].strftime("%d %b %H:%M"))
                      if tref.get("period") else ""),
        "k": {"on": len(on), "issued_today": len(issued_today), "still_out_today": still_out_today,
              "back_today": len(issued_today) - still_out_today, "companies": len(by_co), "people": len(by_hirer),
              "store": len(rental), "coates": len(coates), "coates_out": snap["coates_out"],
              "coates_ready": len(coates) - len(held), "held": len(held), "other": len(others),
              "other_out": snap["other_out"], "other_owner": other_owner,
              "cons_lines": len(stock), "cons_units": int(units), "cons_drawn": len(drawn)},
        "hours": ["{:02d}:00".format(h) for h in hours], "hour_out": hour_out, "hour_back": hour_back,
        "companies": [{"name": k, "n": v} for k, v in by_co.most_common()],
        "hirers": [{"name": k[0], "co": k[1], "n": v, "pk": " ".join(k[0].split()).upper()} for k, v in by_hirer.most_common()],
        "kinds": [{"name": dname.get(k, k), "on": kinds_on[k], "fleet": kinds_fleet[k], "pic": dpic.get(k)} for k in top_kinds],
        "comm": {"on": sum(v for k, v in kinds_on.items() if "RADIO" in k),
                 "fleet": sum(v for k, v in kinds_fleet.items() if "RADIO" in k)},
        "tools_util": tools_util,
        #  Past shuts go to the page as a range only - quietest, typical and
        #  busiest per day - with no shut names or dates, so the page never
        #  shows which shuts are on record.
        "shuts": ({"cons": _band([c["per_day"] for c in sh["cons"]]),
                   "tools": _band([t["per_day"] for t in sh["tools"]]), "min_days": sh["min_days"]}
                  if sh else None),
        "families": [{"name": k, "on": fam_on.get(k, 0), "fleet": v} for k, v in fam_fleet.most_common(8)],
        "held": held_groups(),
        "tagged": tagged,
        "onhire": onhire_rows,
        "draws": draws,
        "tools": {k: {"name": dname.get(k, k), "site": kinds_fleet[k], "on": kinds_on[k], "best": best[k], "pic": dpic.get(k)}
                  for k in kinds_fleet},
        "clines": clines,
        "people": people_rows, "ptyp": ptyp,
        "ops": _ops(kit, ops),
        "pics": None,   # filled last, once every picture in use is known
        "_pix": pix,
        "shifts": {"day": {"name": "Day shift", "hours": "06:00 to 18:00", "who": keepers[0]},
                   "night": {"name": "Night shift", "hours": "18:00 to 06:00", "who": keepers[1]}},
        "cat": {"tools": catalogue.tool_catalogue(rental, lambda r: kit._s(r.get("ITEM_STATUS")) == "On Hire", pix.of),
                "cons": catalogue.cons_catalogue(stock, lambda r: kit._n(r.get("AVAILABLE_QUANTITY")),
                                                 lambda k: _cons_name(kit, k))},
        "cons_types": [{"name": k, "n": int(v)} for k, v in ctype.most_common(8)],
        "cons_top": [{"name": _cons_name(kit, r.get("SKU_DESCRIPTION")), "n": int(kit._n(r.get("AVAILABLE_QUANTITY")))} for r in top_lines],
        "below": below, "to_max": int(to_max), "mm_lines": mm_lines,
        "history": hist,
        "ref": ({k: v for k, v in json.load(open(reference)).items() if k in ("label", "source", "days", "tool_issued", "cons_units")}
                if reference and os.path.isfile(reference) else None),
    }
    return data


# The page itself lives beside this script, so it can be read and edited as a page.
PAGE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "showcase_page.html")


def _logo(path):
    """A client logo as a data URI, or None. The file stays outside git."""
    if not path or not os.path.isfile(path):
        return None
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("ascii")


def write_onhire(data, folder):
    """The on-hire report as an Excel file and a printable page. No costs."""
    import openpyxl
    from openpyxl.styles import Alignment, Font, PatternFill
    os.makedirs(folder, exist_ok=True)
    rows = data["onhire"]
    head = "Author: Andrew Fisher | POWERED BY SITEIQ   ·   SiteIQ pull " + data["asat"]
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "On hire"
    F = lambda **k: Font(name="Inter", size=k.pop("size", 10), **k)
    slate, orange = PatternFill("solid", fgColor="2A313C"), PatternFill("solid", fgColor="F26222")
    cols = ["Company", "Person", "Item number", "Description", "Owner", "Issued", "Time"]
    for c in range(1, len(cols) + 1):
        ws.cell(1, c).fill = slate
        ws.cell(2, c).fill = orange
    ws["A1"] = "{} - ON-HIRE REPORT".format(data["job"]["title"].upper())
    ws["A1"].font = F(size=14, bold=True, color="FFFFFF")
    ws["A2"] = "{} items on hire to {} companies".format(len(rows), len({r["co"] for r in rows}))
    ws["A2"].font = F(size=9, bold=True, color="FFFFFF")
    ws["A3"] = head
    ws["A3"].font = F(size=8, italic=True, color="5A6270")
    for j, v in enumerate(cols, 1):
        c = ws.cell(5, j, v)
        c.font = F(bold=True, color="FFFFFF")
        c.fill = slate
    for i, r in enumerate(rows, 6):
        for j, v in enumerate((r["co"], r["who"], r["item"], r["desc"], r["own"], r["date"], r["time"]), 1):
            ws.cell(i, j, v).font = F()
    for col, w in zip("ABCDEFG", (22, 24, 24, 48, 12, 14, 9)):
        ws.column_dimensions[col].width = w
    ws.freeze_panes = "A6"
    ws.auto_filter.ref = "A5:G{}".format(max(6, 5 + len(rows)))
    w2 = wb.create_sheet("By company")
    for c in range(1, 4):
        w2.cell(1, c).fill = slate
    w2["A1"] = "ON HIRE BY COMPANY"
    w2["A1"].font = F(size=14, bold=True, color="FFFFFF")
    w2["A2"] = head
    w2["A2"].font = F(size=8, italic=True, color="5A6270")
    for j, v in enumerate(("Company", "Items on hire", "People"), 1):
        c = w2.cell(4, j, v)
        c.font = F(bold=True, color="FFFFFF")
        c.fill = slate
    by = collections.OrderedDict()
    for r in rows:
        by.setdefault(r["co"], []).append(r)
    for i, (co, rs) in enumerate(sorted(by.items(), key=lambda kv: -len(kv[1])), 5):
        w2.cell(i, 1, co).font = F()
        w2.cell(i, 2, len(rs)).font = F()
        w2.cell(i, 3, len({r["who"] for r in rs})).font = F()
    w2.cell(5 + len(by), 1, "Total").font = F(bold=True)
    w2.cell(5 + len(by), 2, "=SUM(B5:B{})".format(4 + len(by))).font = F(bold=True)
    for col, w in zip("ABC", (28, 16, 12)):
        w2.column_dimensions[col].width = w
    wb.properties.creator = "Andrew Fisher"
    wb.save(os.path.join(folder, "onhire.xlsx"))
    esc = lambda t: str(t).replace("&", "&amp;").replace("<", "&lt;")
    body = ""
    for co, rs in sorted(by.items(), key=lambda kv: -len(kv[1])):
        body += "<h2>{} <span>{} on hire</span></h2><table><tr><th>Person</th><th>Description</th><th>Item number</th><th>Owner</th><th>Issued</th></tr>".format(esc(co), len(rs))
        body += "".join("<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{} {}</td></tr>".format(esc(r["who"]), esc(r["desc"]), esc(r["item"]), esc(r["own"]), r["date"], r["time"]) for r in rs) + "</table>"
    page = ("<!doctype html><html lang=\"en-AU\"><meta charset=\"utf-8\"><title>On-hire report</title><style>"
            "@page{size:A4;margin:14mm}body{font-family:Inter,Arial,sans-serif;color:#1B2028;font-size:10.5px}"
            ".top{background:#2A313C;color:#fff;padding:14px 18px;border-bottom:4px solid #F26222}.top b{color:#F26222;letter-spacing:.18em}"
            "h1{font-size:20px;margin:6px 0 2px}.sub{color:#cfd6df;font-size:11px}h2{font-size:14px;margin:18px 0 6px;border-bottom:2px solid #F26222;padding-bottom:3px}"
            "h2 span{font-weight:400;color:#5A6270;font-size:11px;margin-left:8px}table{width:100%;border-collapse:collapse;break-inside:auto}"
            "th{text-align:left;background:#F4F5F7;padding:5px 6px;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em}td{padding:5px 6px;border-bottom:1px solid #E3E6EA}"
            "tr{break-inside:avoid}.ft{margin-top:18px;color:#5A6270;font-size:9.5px}</style>"
            "<div class=\"top\"><b>COATES</b><h1>@T · On-hire report</h1><div class=\"sub\">@N items on hire to @C companies · SiteIQ pull @A</div></div>@B"
            "<div class=\"ft\">Author: Andrew Fisher | POWERED BY SITEIQ · SiteIQ pull @A</div></html>")
    for k_, v_ in (("@T", esc(data["job"]["title"])), ("@N", str(len(rows))), ("@C", str(len(by))), ("@A", data["asat"]), ("@B", body)):
        page = page.replace(k_, v_)
    with open(os.path.join(folder, "onhire.html"), "w", encoding="utf-8") as f:
        f.write(page)


def render(data, fonts, logo=None, client="MMG"):
    face = "".join("@font-face{{font-family:Inter;font-weight:{w};font-style:normal;src:url(data:font/woff;base64,{b}) format('woff')}}\n"
                   .format(w=w, b=b) for w, b in sorted(fonts.items()))
    pix = data.pop("_pix", None)
    data["pics"] = pix.data() if pix else []
    blob = json.dumps(data, ensure_ascii=False, default=str).replace("</", "<\\/")
    with open(PAGE_FILE, encoding="utf-8") as f:
        page = f.read()
    return (page.replace("__FONTS__", face).replace("__CLIENT__", client)
            .replace("__LOGO__", logo or "").replace("__DATA__", blob))


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("kit_folder")
    ap.add_argument("out_html")
    ap.add_argument("--reference")
    ap.add_argument("--shuts")
    ap.add_argument("--ops", help="average-day figures from build_store_ops.py")
    ap.add_argument("--pictures", help="folder of a tool pictures pack (kept outside git)")
    ap.add_argument("--people", help="people profiles from build_people.py (kept outside git)")
    ap.add_argument("--onhire-out", help="folder to write onhire.xlsx and onhire.html (the downloadable on-hire report)")
    ap.add_argument("--day-keeper", default="")
    ap.add_argument("--night-keeper", default="")
    ap.add_argument("--minmax")
    ap.add_argument("--costs", help="typed roster and charges for the shut (kept outside git); adds the Labour and costs tab")
    ap.add_argument("--history")
    ap.add_argument("--logo", help="client logo PNG with a transparent background")
    a = ap.parse_args(argv)
    kit = _kit()
    data = build_data(kit, a.kit_folder, a.reference, a.minmax, a.history, a.shuts, a.ops, (a.day_keeper, a.night_keeper), a.pictures, a.people)
    data["costs"] = None
    if a.costs:
        data["costs"] = shut_costs.load(a.costs, dt.datetime.strptime(data["asat"], "%d %b %Y %H:%M").date())
    if a.onhire_out:
        write_onhire(data, a.onhire_out)
    html = render(data, _fonts(a.kit_folder), _logo(a.logo))
    with open(a.out_html, "w", encoding="utf-8") as f:
        f.write(html)
    print("Showcase  {}  ({:,} KB)  pull {}".format(a.out_html, len(html.encode()) // 1024, data["asat"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
