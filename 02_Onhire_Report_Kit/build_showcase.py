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


def _band(vals):
    if not vals:
        return []
    return [{"name": "Quietest shut", "n": round(min(vals))},
            {"name": "Typical shut", "n": round(sum(vals) / len(vals))},
            {"name": "Busiest shut", "n": round(max(vals))}]


def build_data(kit, folder, reference=None, minmax=None, history=None, shuts=None):
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
        for row in ws.iter_rows(min_row=6, values_only=True):
            if row[0] and isinstance(row[i_mn], (int, float)):
                mm[str(row[0])] = (row[i_mn], row[i_mx])
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
    tools_util = [{"name": dname.get(k, k), "site": kinds_fleet[k], "on": kinds_on[k], "best": best[k]} for k in cand[:12]]
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
        "hirers": [{"name": k[0], "co": k[1], "n": v} for k, v in by_hirer.most_common()],
        "kinds": [{"name": dname.get(k, k), "on": kinds_on[k], "fleet": kinds_fleet[k]} for k in top_kinds],
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
        "cons_types": [{"name": k, "n": int(v)} for k, v in ctype.most_common(8)],
        "cons_top": [{"name": _cons_name(kit, r.get("SKU_DESCRIPTION")), "n": int(kit._n(r.get("AVAILABLE_QUANTITY")))} for r in top_lines],
        "below": below, "to_max": int(to_max), "mm_lines": mm_lines,
        "history": hist,
        "ref": ({k: v for k, v in json.load(open(reference)).items() if k in ("label", "source", "days", "tool_issued", "cons_units")}
                if reference and os.path.isfile(reference) else None),
    }
    return data


PAGE = r"""<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MMG Tool Store Report</title>
<style>
__FONTS__
:root{--g0:#0B0E12;--g1:#151A21;--g2:#1B2028;--g3:#232A34;--tx:#DCE3EC;--mu:#8B96A6;--dim:#5C6676;
--or:#F26222;--lit:#FF7A3D;--si:#B9C3D0;--ok:#7FD1A8}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--g0)}
body{background:var(--g0);color:var(--tx);font-family:Inter,"Segoe UI",system-ui,sans-serif;font-feature-settings:"tnum","lnum";
-webkit-font-smoothing:antialiased;line-height:1.45;overflow-x:hidden}
.wrap{max-width:1240px;margin:0 auto;padding:0 28px}
header.top{position:sticky;top:0;z-index:5;background:rgba(11,14,18,.86);backdrop-filter:blur(10px);border-bottom:1px solid var(--g3)}
header.top .wrap{display:flex;align-items:center;gap:16px;height:58px}
.brand{font-weight:700;letter-spacing:.18em;font-size:15px}
.brand b{color:var(--or)}
.sep{width:1px;height:22px;background:var(--g3)}
.top .what{font-size:13px;color:var(--mu)}
.top .asat{margin-left:auto;font-size:12px;color:var(--mu);text-align:right}
.top .asat b{color:var(--tx);font-weight:600}
.rule{height:3px;background:linear-gradient(90deg,var(--or),var(--lit) 40%,rgba(242,98,34,0) 100%)}
.hero{padding:56px 0 26px;position:relative}
body{background:radial-gradient(900px 380px at 12% 120px,rgba(242,98,34,.13),transparent 70%),radial-gradient(800px 360px at 92% 40px,rgba(185,195,208,.06),transparent 70%),var(--g0);background-repeat:no-repeat}
.eyebrow{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--or);font-weight:600}
h1{font-size:44px;line-height:1.08;font-weight:700;letter-spacing:-.02em;margin:12px 0 10px}
h1 span{color:var(--mu);font-weight:600}
.lead{font-size:17px;color:#B7C1CE;max-width:860px}
.daybar{margin-top:26px;display:flex;align-items:center;gap:14px;font-size:12px;color:var(--mu)}
.days{display:flex;gap:6px}
.days i{width:38px;height:8px;border-radius:5px;background:var(--g3);position:relative;overflow:hidden}
.days i.done{background:var(--or)}
.days i.now{background:var(--g3)}
.days i.now:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--or),var(--lit));transform-origin:left;animation:fillx 1.6s .5s ease-out both}
@keyframes fillx{from{transform:scaleX(0)}to{transform:scaleX(.55)}}
.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin:30px 0 8px}
.kpi{background:linear-gradient(180deg,var(--g2),var(--g1));border:1px solid var(--g3);border-radius:16px;padding:18px 18px 16px;position:relative;overflow:hidden}
.kpi:after{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,var(--or),transparent);opacity:.0;transition:opacity .8s}
.in .kpi:after,.kpi.in:after{opacity:.9}
.kpi .n{font-size:38px;font-weight:700;letter-spacing:-.02em;line-height:1}
.kpi .n small{font-size:15px;color:var(--mu);font-weight:600;margin-left:4px}
.kpi .l{font-size:12px;color:var(--mu);margin-top:8px;text-transform:uppercase;letter-spacing:.08em;font-weight:600}
.kpi .s{font-size:12px;color:#9AA5B4;margin-top:6px}
.kpi.hot .n{color:var(--lit);text-shadow:0 0 24px rgba(255,122,61,.35)}
section{padding:46px 0 10px}
.sh{display:flex;align-items:baseline;gap:14px;margin-bottom:6px}
.sh .no{font-size:12px;color:var(--or);font-weight:700;letter-spacing:.16em}
h2{font-size:26px;font-weight:700;letter-spacing:-.01em}
.sd{color:#AEB8C5;font-size:14px;max-width:900px;margin:4px 0 20px}
.grid{display:grid;gap:16px}
.g2{grid-template-columns:1.35fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g2e{grid-template-columns:1fr 1fr}
.card{background:linear-gradient(180deg,var(--g1),#12161C);border:1px solid var(--g3);border-radius:18px;padding:22px 22px 18px;position:relative}
.card h3{font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:var(--mu);font-weight:600;margin-bottom:14px}
.card .foot{font-size:12px;color:var(--dim);margin-top:12px}
.legend{display:flex;gap:16px;font-size:12px;color:var(--mu);margin-bottom:8px}
.legend i{display:inline-block;width:18px;height:3px;border-radius:2px;margin-right:6px;vertical-align:middle}
svg text{font-family:inherit}
.bars .row{display:grid;grid-template-columns:minmax(120px,190px) 1fr 48px;align-items:center;gap:12px;margin:9px 0}
.bars .nm{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bars .nm small{display:block;color:var(--dim);font-size:11.5px}
.bars .tr{height:12px;border-radius:7px;background:var(--g3);overflow:hidden}
.bars .fl{height:100%;border-radius:7px;width:0;background:linear-gradient(90deg,#B9481A,var(--or) 60%,var(--lit));box-shadow:0 0 14px rgba(242,98,34,.45);transition:width 1.3s cubic-bezier(.2,.8,.2,1)}
.bars.wide .row{grid-template-columns:minmax(150px,290px) 1fr 48px}
.bars.silver .fl{background:linear-gradient(90deg,#6E7987,var(--si));box-shadow:0 0 12px rgba(185,195,208,.25)}
.bars .v{font-weight:700;text-align:right;font-size:15px}
.tu .row{display:grid;grid-template-columns:minmax(150px,280px) 1fr 110px;align-items:center;gap:12px;margin:10px 0}
.tu .nm{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tu .tr{position:relative;height:14px;border-radius:8px;background:var(--g3);overflow:hidden}
.tu .best{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:8px;background:linear-gradient(90deg,#55606E,var(--si));opacity:.55;transition:width 1.4s cubic-bezier(.2,.8,.2,1)}
.tu .fl{position:absolute;left:0;top:3px;bottom:3px;width:0;border-radius:6px;background:linear-gradient(90deg,#B9481A,var(--or) 60%,var(--lit));box-shadow:0 0 12px rgba(242,98,34,.5);transition:width 1.4s .2s cubic-bezier(.2,.8,.2,1)}
.tu .v{text-align:right;font-size:13px;color:var(--mu)}.tu .v b{color:var(--tx);font-size:15px}
.static .tu .best,.static .tu .fl{transition:none!important}
.cyls{display:flex;justify-content:space-between;align-items:flex-start;gap:4px;flex-wrap:nowrap}
.cyl{text-align:center;width:88px}
.cyl .cap{font-size:12px;color:#C4CDD8;margin-top:6px;min-height:34px;line-height:1.3}
.cyl .val{font-size:20px;font-weight:700;margin-top:4px}
.cyl .val small{font-size:12px;color:var(--mu);font-weight:600}
.dials{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.dial{text-align:center}
.dial .big{font-size:30px;font-weight:700;margin-top:-62px}
.dial .of{font-size:12px;color:var(--mu);margin-top:2px}
.dial .cap{font-size:13px;margin-top:22px;color:#C4CDD8;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{border:1px solid var(--g3);background:var(--g2);border-radius:999px;padding:7px 13px;font-size:13px}
.chip b{color:var(--lit);margin-right:6px}
.tagwrap{display:grid;grid-template-columns:230px 1fr 1fr;gap:22px;align-items:start}
.tagbig{text-align:center}.tagbig .cn{font-size:26px;font-weight:700;margin-top:6px}.tagbig .sp{font-size:12px;color:var(--mu)}
.tagbig .tb{font-size:12.5px;color:#C4CDD8;margin-top:8px;font-weight:600;letter-spacing:.04em}
.tg h4{font-size:15px;margin-bottom:4px}.tg .sub{font-size:12px;color:var(--mu);margin-bottom:12px}
.tg .chip{display:inline-flex;align-items:center;gap:8px;margin:0 6px 8px 0}
.tg .dot{width:12px;height:12px;border-radius:3px;box-shadow:0 0 10px var(--tc)}
.swing{transform-origin:115px 18px;animation:swing 2.6s ease-in-out .6s both}
@keyframes swing{0%{transform:rotate(-14deg)}35%{transform:rotate(9deg)}60%{transform:rotate(-5deg)}80%{transform:rotate(2deg)}100%{transform:rotate(0)}}
.static .swing{animation:none}
@media (max-width:980px){.tagwrap{grid-template-columns:1fr}}
table.t{width:100%;border-collapse:collapse;font-size:13.5px}
table.t th{text-align:left;color:var(--mu);font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;padding:8px 10px;border-bottom:1px solid var(--g3)}
table.t td{padding:9px 10px;border-bottom:1px solid #1E242D}
table.t td.n{text-align:right;font-weight:600}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:600;background:rgba(242,98,34,.14);color:var(--lit)}
.big-stat{display:grid;grid-template-columns:repeat(6,1fr);gap:18px;margin:6px 0 4px}
.big-stat .n{font-size:32px;font-weight:700}
.big-stat .l{font-size:11.5px;color:var(--mu);text-transform:uppercase;letter-spacing:.08em}
.note{font-size:12.5px;color:#9AA5B4;border-left:2px solid var(--or);padding:4px 0 4px 12px;margin-top:14px}
.empty{color:var(--mu);font-size:14px;padding:28px 6px;text-align:center;border:1px dashed var(--g3);border-radius:12px}
.defs{columns:2;column-gap:36px;font-size:13px;color:#AEB8C5}
.defs p{break-inside:avoid;margin:0 0 10px}
.defs b{color:var(--tx)}
footer{margin:56px 0 0;border-top:1px solid var(--g3);padding:22px 0 40px;font-size:12px;color:var(--mu);display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
footer b{color:var(--tx)}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .9s ease,transform .9s cubic-bezier(.2,.8,.2,1)}
.reveal.in{opacity:1;transform:none}
.draw{stroke-dasharray:var(--len);stroke-dashoffset:var(--len)}
.in .draw{transition:stroke-dashoffset 2.2s cubic-bezier(.4,.1,.2,1);stroke-dashoffset:0}
.area{opacity:0;transition:opacity 1.6s .9s}
.in .area{opacity:1}
.dot{opacity:0;transition:opacity .4s}
.in .dot{opacity:1;transition-delay:calc(var(--i)*60ms + 1.2s)}
.arc{transition:stroke-dashoffset 2s cubic-bezier(.2,.8,.2,1)}
.fillrect{transition:y 1.8s cubic-bezier(.2,.8,.2,1),height 1.8s cubic-bezier(.2,.8,.2,1)}
@media (max-width:980px){.big-stat{grid-template-columns:repeat(3,1fr)}.cyls{flex-wrap:wrap;justify-content:space-around}.kpis{grid-template-columns:repeat(3,1fr)}.g2,.g3,.g2e,.dials{grid-template-columns:1fr}.defs{columns:1}h1{font-size:34px}}
@media (max-width:560px){.daybar{flex-direction:column;align-items:flex-start;gap:8px}.days{width:100%}.days i{flex:1;width:auto}.top .asat{font-size:10.5px}.tscroll{overflow-x:auto}.big-stat{grid-template-columns:repeat(2,1fr)}.wrap{padding:0 16px}.kpis{grid-template-columns:repeat(2,1fr)}.top .what{display:none}.kpi .n{font-size:30px}}
@media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}.draw{stroke-dashoffset:0!important;transition:none!important}.bars .fl,.arc,.fillrect{transition:none!important}}
.static .reveal{opacity:1;transform:none;transition:none}
.static .draw{stroke-dashoffset:0!important;transition:none!important}
.static .area,.static .dot{opacity:1!important;transition:none!important}
.static .bars .fl,.static .arc,.static .fillrect{transition:none!important}
.static header.top{position:static}
@page{size:A4 landscape;margin:0}
@media print{html,body{background:var(--g0)!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{padding:6mm 4mm 0}footer{margin-top:14px;padding-bottom:0}section{break-inside:avoid;padding-top:18px}.card{break-inside:avoid}.pb{break-before:page}header.top{position:static}.hero{padding-top:26px}}
</style></head>
<body>
<header class="top"><div class="wrap">
<div class="brand"><b>COATES</b></div><div class="sep"></div>
<div class="what">MMG Dugald River · Shutdown Tool Store</div>
<div class="asat">SiteIQ pull <b id="asat"></b><br>Author: Andrew Fisher | POWERED BY SITEIQ</div>
</div><div class="rule"></div></header>

<main class="wrap">
<div class="hero reveal">
<div class="eyebrow">Tool store report · November 2026 shut</div>
<h1>MMG Dugald River <span>— day <span id="dayno"></span> at the counter</span></h1>
<p class="lead" id="lead"></p>
<div class="daybar"><div class="days" id="days"></div><div id="dayword"></div></div>
<div class="kpis" id="kpis"></div>
</div>

<section class="reveal"><div class="sh"><div class="no">01</div><h2>Today at the counter</h2></div>
<p class="sd" id="sd1"></p>
<div class="grid g2">
<div class="card"><h3>Items issued, hour by hour</h3>
<div class="legend"><span><i style="background:var(--or)"></i>Issued</span><span><i style="background:var(--si)"></i>Already back</span></div>
<div id="hourly"></div><div class="foot" id="hourfoot"></div></div>
<div class="card"><h3>Who has the gear now</h3><div class="bars" id="cos"></div><div class="foot" id="cofoot"></div></div>
</div></section>

<section class="reveal pb"><div class="sh"><div class="no">02</div><h2>Utilisation</h2></div>
<p class="sd" id="sd2"></p>
<div class="card"><div class="dials" id="dials"></div></div>
<div class="card" style="margin-top:16px"><h3>Utilisation by tool</h3>
<div class="legend"><span><i style="background:var(--or)"></i>Out now</span><span><i style="background:var(--si)"></i>Busiest seen at MMG</span></div>
<div id="tutil"></div><div class="foot">Out now and the most ever out at once at MMG, each against the number of that tool in the store now.</div></div>
</section>

<section class="reveal"><div class="sh"><div class="no">03</div><h2>What the crews are using</h2></div>
<p class="sd" id="sd3"></p>
<div class="grid g2e">
<div class="card"><h3>On hire now, by tool</h3><div class="cyls" id="kinds"></div></div>
<div class="card"><h3>People holding gear</h3><div class="bars silver" id="hirers"></div><div class="foot">Each person's count is the items SiteIQ shows against their name right now.</div></div>
</div></section>

<section class="reveal pb"><div class="sh"><div class="no">04</div><h2>Coates tooling — ready for work</h2></div>
<p class="sd" id="sd4"></p>
<div class="grid g2">
<div class="card"><h3>The fleet by family</h3><div class="bars silver wide" id="fams"></div></div>
<div class="card" id="heldcard"><h3>Held back from issue</h3><div id="held"></div><div class="note" id="heldnote"></div></div>
</div>
<div class="card tagcard" style="margin-top:16px"><h3>Tested by Coates</h3><div id="tagged"></div></div>
</section>

<section class="reveal pb"><div class="sh"><div class="no">05</div><h2>Consumables</h2></div>
<p class="sd" id="sd5"></p>
<div class="grid g2e">
<div class="card"><h3>On the shelf, by type</h3><div class="cyls" id="ctypes"></div></div>
<div class="card"><h3>Best-stocked lines</h3><div class="bars wide" id="ctop"></div></div>
</div>
<div class="card" style="margin-top:16px"><h3>Below minimum now — top up first</h3><div id="below"></div></div>
</section>

<section class="reveal pb"><div class="sh"><div class="no">06</div><h2>Trends</h2></div>
<p class="sd" id="sd6"></p>
<div class="grid g2e">
<div class="card"><h3>This shut, pull by pull</h3><div id="trend"></div><div class="foot" id="trendfoot"></div></div>
<div class="card"><h3>Consumable units drawn per day — the MMG range</h3><div class="cyls" id="hcons"></div><div class="foot" id="hconsfoot"></div></div>
</div>
<div class="card" style="margin-top:16px"><h3>Tool issues per day — the MMG range</h3><div class="cyls" id="htools" style="justify-content:space-around"></div><div class="foot" id="htoolsfoot"></div></div>
</section>

<section class="reveal"><div class="sh"><div class="no">07</div><h2>What each figure means</h2></div>
<div class="defs" id="defs"></div></section>

<footer><div><b>Author: Andrew Fisher | POWERED BY SITEIQ</b><br>Built from SiteIQ exports for MMG Shutdown November 2026. No figure on this page is estimated.</div>
<div id="srcs" style="text-align:right"></div></footer>
</main>

<script>
const D=__DATA__;
const $=s=>document.querySelector(s), fmt=n=>Number(n).toLocaleString('en-AU');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STATIC=/[?&]static/.test(location.search)||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(/[?&]static/.test(location.search))document.documentElement.classList.add('static');
const K=D.k;
$('#asat').textContent=D.asat;
$('#dayno').textContent=D.job.day;
// day strip
let ds='';for(let i=1;i<=D.job.days;i++)ds+=`<i class="${i<D.job.day?'done':i==D.job.day?'now':''}"></i>`;
$('#days').innerHTML=ds;$('#dayword').textContent=`Day ${D.job.day} of ${D.job.days} counter days · ${D.job.window}`;
$('#lead').innerHTML=`By ${D.asat.split(' ').slice(-1)} on ${D.asat_day}, <b>${fmt(K.issued_today)}</b> items had gone over the counter today and <b>${fmt(K.on)}</b> are out with <b>${K.companies}</b> companies. <b>${fmt(K.coates_ready)}</b> of ${fmt(K.coates)} Coates tools are ready for work, and <b>${fmt(K.cons_units)}</b> consumable units are on the shelf across ${K.cons_lines} lines.`;
const kp=[
 {n:K.on,l:'On hire now',s:`${K.companies} companies · ${K.people} people`,hot:1},
 {n:K.issued_today,l:'Issued today',s:`${K.still_out_today} still out · ${K.back_today} already back`},
 {n:K.coates_ready,l:'Coates tools ready',s:K.held?`of ${fmt(K.coates)} on site · ${K.held} held back`:`of ${fmt(K.coates)} on site · all ready`},
 {n:K.other,l:`${K.other_owner}-owned items`,s:`${K.other_out} out now, looked after at the counter`},
 {n:K.cons_units,l:'Consumable units',s:`${K.cons_lines} lines on the shelf`},
 {n:K.store,l:'Items in the store',s:'every one tracked in SiteIQ'}];
$('#kpis').innerHTML=kp.map(k=>`<div class="kpi${k.hot?' hot':''}"><div class="n" data-n="${k.n}">0</div><div class="l">${esc(k.l)}</div><div class="s">${esc(k.s)}</div></div>`).join('');

// smooth path
function smooth(pts,yb){const cl=v=>yb===undefined?v:Math.min(yb,v);if(pts.length<2)return'';let d=`M${pts[0][0]},${pts[0][1]}`;for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;const t=.18;
d+=` C${p1[0]+(p2[0]-p0[0])*t},${cl(p1[1]+(p2[1]-p0[1])*t)} ${p2[0]-(p3[0]-p1[0])*t},${cl(p2[1]-(p3[1]-p1[1])*t)} ${p2[0]},${p2[1]}`}return d}
let uid=0;
function nice(v){const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;return ([1,1.5,2,2.5,3,4,5,6,8,10].find(x=>m<=x))*p}
function lines(el,labels,series,opt={}){const W=opt.w||640,H=opt.h||250,L=34,R=14,T=16,B=30;const max=nice(Math.max(1,...series.flatMap(s=>s.v))*1.12);
const x=i=>L+(W-L-R)*(labels.length<2?.5:i/(labels.length-1)),y=v=>T+(H-T-B)*(1-v/max);
let g='';const ticks=4;for(let i=0;i<=ticks;i++){const v=max/ticks*i,yy=y(v);g+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="#222831"/>`+`<text x="${L-8}" y="${yy+4}" fill="#5C6676" font-size="10" text-anchor="end">${Math.round(v)}</text>`}
const every=Math.ceil(labels.length/(opt.nlab||10));labels.forEach((l,i)=>{if(i%every==0||i==labels.length-1)g+=`<text x="${x(i)}" y="${H-8}" fill="#6B7585" font-size="10" text-anchor="middle">${esc(l)}</text>`});
let s='';series.forEach((se,k)=>{const id='g'+(++uid);const pts=se.v.map((v,i)=>[x(i),y(v)]);const d=smooth(pts,y(0));
s+=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${se.c}" stop-opacity=".28"/><stop offset="1" stop-color="${se.c}" stop-opacity="0"/></linearGradient>
<filter id="f${id}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
if(se.area!==false)s+=`<path class="area" d="${d} L${x(se.v.length-1)},${y(0)} L${x(0)},${y(0)} Z" fill="url(#${id})"/>`;
s+=`<path class="draw" d="${d}" fill="none" stroke="${se.c}" stroke-width="${se.w||3}" stroke-linecap="round" filter="url(#f${id})"/>`;
pts.forEach((p,i)=>{if(se.v[i]>0||opt.dots)s+=`<circle class="dot" style="--i:${i}" cx="${p[0]}" cy="${p[1]}" r="${se.w?3:4}" fill="${se.c}"><title>${esc(labels[i])}: ${se.v[i]}</title></circle>`});
if(opt.peak&&k==0){const m=Math.max(...se.v),i=se.v.indexOf(m);if(m>0)s+=`<text class="dot" style="--i:${labels.length}" x="${x(i)}" y="${y(m)-12}" fill="#FF7A3D" font-size="11" font-weight="700" text-anchor="middle">${opt.peak(i,m)}</text>`}});
el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(opt.label||'chart')}">${g}${s}</svg>`;
el.querySelectorAll('.draw').forEach(p=>{const len=p.getTotalLength();p.style.setProperty('--len',len)})}

function bars(el,items,opt={}){const max=Math.max(1,...items.map(i=>i.n));
el.innerHTML=items.map(i=>`<div class="row"><div class="nm" title="${esc(i.name)}">${esc(i.name)}${i.sub?`<small>${esc(i.sub)}</small>`:''}</div><div class="tr"><div class="fl" data-w="${(i.n/max*100).toFixed(1)}"></div></div><div class="v" data-n="${i.n}">0</div></div>`).join('')||'<div class="empty">Nothing to show in this pull.</div>'}

function cyl(item,opt){const H=140,W=64,ry=9,id='c'+(++uid);const share=opt.share?item.on/Math.max(1,item.fleet):item.n/opt.max;
const top=18,bot=top+H,fh=H*Math.max(.02,Math.min(1,share));
return `<div class="cyl"><svg viewBox="0 0 ${W+10} ${H+46}" width="${W+10}" height="${H+46}">
<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#B9481A"/><stop offset=".45" stop-color="#FF7A3D"/><stop offset="1" stop-color="#C24D17"/></linearGradient>
<linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".10"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".02"/><stop offset=".75" stop-color="#ffffff" stop-opacity=".0"/><stop offset="1" stop-color="#ffffff" stop-opacity=".08"/></linearGradient>
<clipPath id="${id}k"><rect x="5" y="${top}" width="${W}" height="${H}"/><ellipse cx="${5+W/2}" cy="${bot}" rx="${W/2}" ry="${ry}"/></clipPath></defs>
<ellipse cx="${5+W/2}" cy="${bot}" rx="${W/2}" ry="${ry}" fill="#11151B" stroke="#2C3440"/>
<rect x="5" y="${top}" width="${W}" height="${H}" fill="#151A21"/>
<g clip-path="url(#${id}k)"><rect class="fillrect" x="5" y="${bot}" width="${W}" height="0" data-y="${bot-fh}" data-h="${fh+ry}" fill="url(#${id})" style="filter:drop-shadow(0 0 10px rgba(255,122,61,.5))"/></g>
<ellipse class="fillcap" cx="${5+W/2}" cy="${bot}" data-cy="${bot-fh}" rx="${W/2}" ry="${ry}" fill="#FF8C55" opacity=".85" style="transition:cy 1.8s cubic-bezier(.2,.8,.2,1)"/>
<rect x="5" y="${top}" width="${W}" height="${H}" fill="url(#${id}g)"/>
<line x1="5" y1="${top}" x2="5" y2="${bot}" stroke="#3A4452"/><line x1="${W+5}" y1="${top}" x2="${W+5}" y2="${bot}" stroke="#3A4452"/>
<ellipse cx="${5+W/2}" cy="${top}" rx="${W/2}" ry="${ry}" fill="rgba(255,255,255,.04)" stroke="#4A5564"/>
</svg><div class="val" data-n="${opt.share?item.on:item.n}">0</div><div class="cap">${esc(item.name)}${opt.share?`<br><small style="color:#6B7585">of ${fmt(item.fleet)} in the store</small>`:''}</div></div>`}

function dial(v,of,cap,sub){const r=70,c=Math.PI*r,share=of?v/of:0,id='d'+(++uid);
return `<div class="dial"><svg viewBox="0 0 180 104" width="220"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#B9481A"/><stop offset="1" stop-color="#FF7A3D"/></linearGradient></defs>
<path d="M20,95 A70,70 0 0 1 160,95" fill="none" stroke="#232A34" stroke-width="14" stroke-linecap="round"/>
<path class="arc" d="M20,95 A70,70 0 0 1 160,95" fill="none" stroke="url(#${id})" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c*(1-Math.min(1,share))}" style="filter:drop-shadow(0 0 8px rgba(255,122,61,.55))"/></svg>
<div class="big" data-n="${(share*100).toFixed(1)}" data-dec="1" data-suf="%">0%</div><div class="of">${fmt(v)} of ${fmt(of)}</div><div class="cap">${esc(cap)}</div><div class="of">${esc(sub)}</div></div>`}

// 01 hourly
const firstH=D.hour_out.findIndex(v=>v>0);
$('#sd1').textContent=`What went over the counter on ${D.asat_day}, by the hour it was issued, and who is holding gear right now.`;
const hl=D.hours.slice(0,Math.max(14,D.hour_out.length-6));
lines($('#hourly'),hl,[{v:D.hour_out.slice(0,hl.length),c:'#F26222'},{v:D.hour_back.slice(0,hl.length),c:'#B9C3D0',w:2,area:false}],{label:'Items issued by hour',nlab:8,peak:(i,m)=>`${m} at ${hl[i]}`});
$('#hourfoot').textContent=`Peak at shift start. ${K.issued_today} issued today; ${K.back_today} of them are already back on the shelf.`;
bars($('#cos'),D.companies);
$('#cofoot').textContent=`${K.on} items out with ${K.companies} companies. Every item is on a named person.`;
// 02 dials
const comm=D.comm;
$('#sd2').textContent=`The share of each fleet out with crews at the time of the pull. Day ${D.job.day} is early: these build as the shut ramps up.`;
$('#dials').innerHTML=dial(K.coates_out,K.coates,'Coates tooling on hire','the Coates fleet in the store')+dial(K.other_out,K.other,`${K.other_owner}-owned equipment out`,'radios, batteries, lights and tools')+dial(comm.on,comm.fleet,'Radios and radio batteries out','the busiest gear today');
$('#tutil').innerHTML=`<div class="tu">${D.tools_util.map(t=>{const m=Math.max(t.site,t.best,1);return `<div class="row"><div class="nm" title="${esc(t.name)}">${esc(t.name)}</div><div class="tr"><div class="best" data-w="${(Math.min(t.best,m)/m*100).toFixed(1)}"></div><div class="fl" data-w="${(t.on/m*100).toFixed(1)}"></div></div><div class="v"><b data-n="${t.on}">0</b> of ${fmt(t.site)} out${t.best?`<br><span style="color:#B9C3D0">busiest ${t.best}</span>`:''}</div></div>`}).join('')}</div>`;
// 03
$('#sd3').textContent=`The tools crews are taking, against how many of each the store holds.`;
$('#kinds').innerHTML=D.kinds.map(k=>cyl(k,{share:1})).join('');
bars($('#hirers'),D.hirers.map(h=>({name:h.name,sub:h.co,n:h.n})));
// 04
$('#sd4').textContent=K.held?`${fmt(K.coates)} Coates tools on site. ${fmt(K.coates_ready)} are ready for work; ${K.held} are held back from issue until they pass inspection.`:`${fmt(K.coates)} Coates tools on site, every one ready for work.`;
if(!K.held){$('#heldcard').remove();$('#fams').closest('.grid').style.gridTemplateColumns='1fr'}
bars($('#fams'),D.families.map(f=>({name:f.name,n:f.fleet})));
$('#held').innerHTML=D.held.length?`<div class="chips">${D.held.map(h=>`<span class="chip"><b>${h.n}</b>${esc(h.name)}</span>`).join('')}</div>`:'<div class="empty">Nothing held back.</div>';
$('#heldnote').textContent=`Held in the store, not issued, until checked and cleared.`;
{const T=D.tagged,C=T.colour;
const tagsvg=`<svg viewBox="0 0 230 150" width="210"><defs><linearGradient id="tgf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${C.hex}"/><stop offset="1" stop-color="${C.hex}" stop-opacity=".78"/></linearGradient></defs>
<path d="M115 4 C 100 14, 96 22, 92 30" stroke="#8B96A6" stroke-width="2" fill="none"/>
<g class="swing"><path d="M70 30 H160 L176 46 V136 a6 6 0 0 1 -6 6 H60 a6 6 0 0 1 -6 -6 V46 Z" fill="url(#tgf)" style="filter:drop-shadow(0 0 18px ${C.hex}66)"/>
<circle cx="115" cy="46" r="7" fill="#151A21" stroke="rgba(0,0,0,.35)"/>
<text x="115" y="86" text-anchor="middle" font-size="15" font-weight="700" fill="#1B2028" letter-spacing="2">TESTED</text>
<text x="115" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="#1B2028" letter-spacing="1.5">BY COATES</text>
<text x="115" y="127" text-anchor="middle" font-size="11" font-weight="600" fill="#1B2028">${C.span}</text></g></svg>`;
$('#tagged').innerHTML=`<div class="tagwrap"><div class="tagbig">${tagsvg}<div class="cn" style="color:${C.hex}">${C.name}</div><div class="sp">this quarter's tag colour · ${C.span}</div><div class="tb">Tested by Coates</div></div>`+
T.groups.map(g=>`<div class="tg" style="--tc:${C.hex}"><h4><span data-n="${g.n}">0</span> ${esc(g.title.toLowerCase())} items</h4><div class="sub">${g.out} out with crews now · every one tested by Coates and tagged ${C.name.toLowerCase()}</div>${g.kinds.slice(0,10).map(k=>`<span class="chip"><span class="dot" style="background:${C.hex}"></span><b>${k.n}</b>${esc(k.name)}</span>`).join('')}${g.kinds.length>10?`<span class="chip">+ ${g.kinds.length-10} more kinds</span>`:''}</div>`).join('')+`</div>`}
// 05
$('#sd5').textContent=`${K.cons_lines} MMG consumable lines with ${fmt(K.cons_units)} units on the shelf. ${K.cons_drawn?`${K.cons_drawn} lines drawn so far.`:'No draws are recorded in SiteIQ yet; usage shows here from the first one.'}`;
const cmax=Math.max(...D.cons_types.map(c=>c.n));
$('#ctypes').innerHTML=D.cons_types.slice(0,6).map(c=>cyl(c,{max:cmax})).join('');
bars($('#ctop'),D.cons_top);
$('#below').innerHTML=D.below.length?`<div class="tscroll"><table class="t"><tr><th>Line</th><th style="text-align:right">On shelf</th><th style="text-align:right">Minimum</th><th style="text-align:right">Maximum</th><th></th></tr>${D.below.map(b=>`<tr><td>${esc(b.line)}</td><td class="n">${b.have}</td><td class="n">${b.min}</td><td class="n">${b.max}</td><td><span class="pill">Top up</span></td></tr>`).join('')}</table></div><div class="note">Minimum and maximum for each line are set from what MMG's recent shuts drew per day: the minimum covers the busiest day seen or two days of use, the maximum covers seven counter days. ${fmt(D.to_max)} units would bring every line to its maximum.</div>`:'<div class="empty">Every line is at or above its minimum.</div>';
// 06 trends
const H=D.history;
$('#sd6').textContent=`This shut as it builds, against the range MMG's tool store usually runs at: quietest, typical and busiest shut, each a daily average over whole shift days, 05:00 to 04:59.`;
if(H.length>1){lines($('#trend'),H.map(h=>h.asat.slice(5).replace('-','/')),[{v:H.map(h=>h.on_hire),c:'#F26222'},{v:H.map(h=>h.issued_today),c:'#B9C3D0',w:2,area:false}],{label:'On hire by pull',dots:1});$('#trendfoot').textContent='Orange: items on hire at each pull. Silver: items issued that day.'}
else{$('#trend').innerHTML=`<div class="empty">This is the first pull of the shut: ${K.on} on hire, ${K.issued_today} issued today.<br>The line starts drawing from the next pull.</div>`}
if(D.shuts){const S=D.shuts,mc=Math.max(...S.cons.map(x=>x.n)),mt=Math.max(...S.tools.map(x=>x.n));
$('#hcons').innerHTML=S.cons.map(c=>cyl(c,{max:mc})).join('');
$('#htools').innerHTML=S.tools.map(c=>cyl(c,{max:mt})).join('');
$('#hconsfoot').textContent=`Units drawn per shift day across MMG shuts. This shut joins once it has ${S.min_days} whole days.`;
$('#htoolsfoot').textContent=`Tools issued per shift day across MMG shuts, Coates and MMG-owned gear. This shut joins once it has ${S.min_days} whole days.`}
else{$('#hcons').innerHTML='<div class="empty">No shut history loaded.</div>'}
// 07 defs
$('#defs').innerHTML=[
['On hire now','Items SiteIQ shows as "On Hire" at the pull, each against a company and a person.'],
['Issued today',`Items whose last issue time in SiteIQ falls on ${D.asat_day}. "Already back" are those issued today and since returned to the shelf.`],
['Tested by Coates','Coates electrical gear, and rigging, lifting and fall-arrest gear, is tested by Coates and carries the quarter\'s tag colour: Dec to Feb red, Mar to May green, Jun to Aug blue, Sep to Nov yellow.'],
['Coates tools ready','Coates-owned items in the store that are ready to issue.'],
[`${K.other_owner}-owned items`,`${K.other_owner}'s own radios, batteries, lights and tools, run through the same counter and tracked the same way.`],
['Utilisation','Items out with crews as a share of the items of that kind in the store, at the time of the pull. By tool, \'busiest seen\' is the most of that tool ever out at once at MMG.'],
['The MMG range','Each shut\'s units drawn or tools issued per whole shift day (05:00 to 04:59); quietest and busiest are the lowest and highest of those, typical is their average.'],
['Consumable units','Units on the shelf across MMG\'s consumable lines, from SiteIQ sales stock.'],
['Minimum and maximum','Set per line from what recent MMG shuts drew per day: minimum = the busiest day seen or two days\' use; maximum = seven counter days.'],
['Trends','Each pull adds a point. Nothing is drawn for a pull that has not happened.']].map(d=>`<p><b>${d[0]}.</b> ${esc(d[1])}</p>`).join('');
$('#srcs').innerHTML=`SiteIQ pull ${esc(D.asat)}${D.tx_window?`<br>Transactions ${esc(D.tx_window)}`:''}`;

// motion
function countUp(el){const t=parseFloat(el.dataset.n),dec=+(el.dataset.dec||0),suf=el.dataset.suf||'';if(STATIC){el.textContent=(dec?t.toFixed(dec):fmt(t))+suf;return}
const t0=performance.now(),dur=1600;(function f(now){const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3),v=t*e;el.textContent=(dec?v.toFixed(dec):fmt(Math.round(v)))+suf;if(p<1)requestAnimationFrame(f)})(t0)}
function play(root){root.querySelectorAll('[data-n]').forEach(countUp);
root.querySelectorAll('.fl,.best').forEach(b=>b.style.width=b.dataset.w+'%');
root.querySelectorAll('.arc').forEach(a=>a.style.strokeDashoffset=a.dataset.off);
root.querySelectorAll('.fillrect').forEach(r=>{r.setAttribute('y',r.dataset.y);r.setAttribute('height',r.dataset.h)});
root.querySelectorAll('.fillcap').forEach(c=>c.setAttribute('cy',c.dataset.cy))}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');setTimeout(()=>play(e.target),STATIC?0:120);io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(s=>{if(STATIC){s.classList.add('in');play(s)}else io.observe(s)});
</script></body></html>"""


def render(data, fonts):
    face = "".join("@font-face{{font-family:Inter;font-weight:{w};font-style:normal;src:url(data:font/woff;base64,{b}) format('woff')}}\n"
                   .format(w=w, b=b) for w, b in sorted(fonts.items()))
    blob = json.dumps(data, ensure_ascii=False, default=str).replace("</", "<\\/")
    return PAGE.replace("__FONTS__", face).replace("__DATA__", blob)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("kit_folder")
    ap.add_argument("out_html")
    ap.add_argument("--reference")
    ap.add_argument("--shuts")
    ap.add_argument("--minmax")
    ap.add_argument("--history")
    a = ap.parse_args(argv)
    kit = _kit()
    data = build_data(kit, a.kit_folder, a.reference, a.minmax, a.history, a.shuts)
    html = render(data, _fonts(a.kit_folder))
    with open(a.out_html, "w", encoding="utf-8") as f:
        f.write(html)
    print("Showcase  {}  ({:,} KB)  pull {}".format(a.out_html, len(html.encode()) // 1024, data["asat"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
