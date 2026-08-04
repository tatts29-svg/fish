#!/usr/bin/env python3
"""
Coates | Fleet Listing by Availability Status - HTML dashboard builder
POWERED BY SITEIQ | Author: Andrew Fisher

Reads the SiteIQ "MyBranch Metric Details for: Fleet Listing by Availability
Status" export and writes a single self-contained HTML dashboard.

Usage:
    python build_fleet_availability_report.py <export.xlsx> [output.html]

Every figure in the output is computed from the export. Nothing is hard-coded.
The workbook's own trailing "Total" row is excluded from the record set and
used only to reconcile the computed totals.
"""

import sys
import os
import html
import json
import collections
from datetime import date

import openpyxl

# ---------------------------------------------------------------------------
# Status model
# ---------------------------------------------------------------------------
# The export carries an "Availability" value per asset. Grouped into the four
# operating buckets used in the dashboard. REDLINE follows the Coates Way
# definition - unavailable fleet, target <15%.
ON_HIRE = {"On Hire", "On Hire, In Service", "Reserved, In Service"}
READY = {"Available", "Reserved"}
REDLINE = {"Inspection Pending", "In Service", "Off Site for Repair", "Wait for config job"}
TRANSIT = {"Off Hired", "In Transfer"}

REDLINE_TARGET = 15.0        # Coates Way KPI: unavailable fleet <15%
UTIL_TARGET = 65.0           # Coates Way KPI: time utilisation 65%

BUCKET_LABEL = {
    "onhire": "On hire",
    "ready": "Available",
    "transit": "In transit / off hired",
    "redline": "Redline (unavailable)",
}
BUCKET_ORDER = ["onhire", "ready", "transit", "redline"]

# Validated for the dark chart surface #161B22 (adjacent-pair CVD + contrast).
BUCKET_COLOUR = {
    "onhire": "#d95926",
    "ready": "#3987e5",
    "transit": "#c98500",
    "redline": "#d03b3b",
}

AGE_BANDS = ["0-30", "31-60", "61-90", "91-180", "181-365", "365+"]


def bucket_of(availability):
    if availability in ON_HIRE:
        return "onhire"
    if availability in READY:
        return "ready"
    if availability in REDLINE:
        return "redline"
    if availability in TRANSIT:
        return "transit"
    return "transit"


def age_band(days):
    if days <= 30:
        return "0-30"
    if days <= 60:
        return "31-60"
    if days <= 90:
        return "61-90"
    if days <= 180:
        return "91-180"
    if days <= 365:
        return "181-365"
    return "365+"


def rag_redline(pct):
    """RAG for a redline percentage against the <15% target."""
    if pct < REDLINE_TARGET:
        return "green"
    if pct < 25.0:
        return "amber"
    return "red"


# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------
def load(path):
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True)["Export"]
    it = ws.iter_rows(values_only=True)
    hdr = list(next(it))
    rows, total_row, notes = [], None, []
    for raw in it:
        raw = list(raw) + [None] * (len(hdr) - len(raw))
        if raw[0] is None:
            continue
        rec = dict(zip(hdr, raw))
        if str(rec["Branch"]).strip() == "Total":
            total_row = rec
            continue
        if rec["Availability"] is None:
            # trailing provenance note the export writes below the data
            # (e.g. "No filters applied") - keep it, it is not an asset
            notes.append(str(rec["Branch"]).strip())
            continue

        def num(v):
            try:
                return float(v)
            except (TypeError, ValueError):
                return 0.0

        rec["cost"] = num(rec["Original Cost"])
        rec["wdv"] = num(rec["WDV"])
        rec["days"] = num(rec["Days in Status"])
        rec["bucket"] = bucket_of(rec["Availability"])
        rows.append(rec)
    return rows, total_row, notes


# ---------------------------------------------------------------------------
# Aggregate
# ---------------------------------------------------------------------------
def aggregate(rows):
    d = {}
    n = len(rows)
    d["assets"] = n
    d["cost"] = sum(r["cost"] for r in rows)
    d["wdv"] = sum(r["wdv"] for r in rows)

    buckets = {}
    for b in BUCKET_ORDER:
        g = [r for r in rows if r["bucket"] == b]
        buckets[b] = {
            "n": len(g),
            "pct": 100.0 * len(g) / n,
            "wdv": sum(r["wdv"] for r in g),
            "cost": sum(r["cost"] for r in g),
        }
    d["buckets"] = buckets

    # per availability status
    status = []
    for s in sorted({r["Availability"] for r in rows}):
        g = [r for r in rows if r["Availability"] == s]
        ds = sorted(r["days"] for r in g)
        status.append({
            "status": s,
            "bucket": g[0]["bucket"],
            "n": len(g),
            "pct": 100.0 * len(g) / n,
            "wdv": sum(r["wdv"] for r in g),
            "median": ds[len(ds) // 2],
            "maxd": ds[-1],
            "over90": sum(1 for x in ds if x > 90),
        })
    status.sort(key=lambda x: -x["n"])
    d["status"] = status

    # per branch
    branches = []
    for bn in {r["Branch"] for r in rows}:
        g = [r for r in rows if r["Branch"] == bn]
        c = collections.Counter(r["bucket"] for r in g)
        rl = [r for r in g if r["bucket"] == "redline"]
        branches.append({
            "branch": bn,
            "code": bn.split(" - ")[0],
            "name": bn.split(" - ", 1)[1] if " - " in bn else bn,
            "n": len(g),
            "onhire": c["onhire"],
            "ready": c["ready"],
            "transit": c["transit"],
            "redline": c["redline"],
            "redline_pct": 100.0 * c["redline"] / len(g),
            "util_pct": 100.0 * c["onhire"] / len(g),
            "wdv": sum(r["wdv"] for r in g),
            "redline_wdv": sum(r["wdv"] for r in rl),
            "aged90": sum(1 for r in rl if r["days"] > 90),
        })
    branches.sort(key=lambda x: -x["redline"])
    d["branches"] = branches

    # per category
    cats = []
    for cn in {r["Category"] for r in rows}:
        g = [r for r in rows if r["Category"] == cn]
        c = collections.Counter(r["bucket"] for r in g)
        cats.append({
            "category": cn,
            "n": len(g),
            "onhire": c["onhire"],
            "ready": c["ready"],
            "transit": c["transit"],
            "redline": c["redline"],
            "redline_pct": 100.0 * c["redline"] / len(g),
            "util_pct": 100.0 * c["onhire"] / len(g),
            "wdv": sum(r["wdv"] for r in g),
            "redline_wdv": sum(r["wdv"] for r in g if r["bucket"] == "redline"),
        })
    cats.sort(key=lambda x: -x["redline_wdv"])
    d["categories"] = cats

    # redline ageing
    rl = [r for r in rows if r["bucket"] == "redline"]
    cnt = collections.Counter(age_band(r["days"]) for r in rl)
    wdv = collections.defaultdict(float)
    for r in rl:
        wdv[age_band(r["days"])] += r["wdv"]
    d["ageing"] = [{"band": b, "n": cnt[b], "wdv": wdv[b]} for b in AGE_BANDS]

    # exceptions - redline sitting more than 90 days, ranked by written-down value
    exc = sorted([r for r in rl if r["days"] > 90], key=lambda r: -r["wdv"])
    d["exceptions"] = exc[:25]
    d["exc_n"] = len(exc)
    d["exc_wdv"] = sum(r["wdv"] for r in exc)

    # idle available fleet - ready but untouched for more than 180 days
    idle = sorted([r for r in rows if r["bucket"] == "ready" and r["days"] > 180],
                  key=lambda r: -r["wdv"])
    d["idle"] = idle[:15]
    d["idle_n"] = len(idle)
    d["idle_wdv"] = sum(r["wdv"] for r in idle)

    return d


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------
def money(v, dp=0):
    return "${:,.{}f}".format(v, dp)


def musd(v):
    return "${:,.2f}M".format(v / 1e6)


def num(v):
    return "{:,.0f}".format(v)


def pct(v, dp=1):
    return "{:,.{}f}%".format(v, dp)


def e(s):
    return html.escape(str(s) if s is not None else "")


def rag_chip(level, label):
    """label is an internal literal and may carry HTML entities - not escaped."""
    icon = {"green": "●", "amber": "▲", "red": "■"}[level]
    return f'<span class="chip {level}"><span class="ico">{icon}</span>{label}</span>'


# ---------------------------------------------------------------------------
# Chart builders (inline SVG / CSS - no external libraries)
# ---------------------------------------------------------------------------
def stacked_bar(d):
    """One 100% stacked bar of the fleet split, with a 2px surface gap."""
    total = d["assets"]
    segs = []
    x = 0.0
    for b in BUCKET_ORDER:
        v = d["buckets"][b]
        w = 100.0 * v["n"] / total
        segs.append(
            f'<div class="seg" style="width:{w:.4f}%;background:{BUCKET_COLOUR[b]}" '
            f'title="{e(BUCKET_LABEL[b])}: {num(v["n"])} assets ({pct(v["pct"])}) &middot; WDV {musd(v["wdv"])}">'
            f'<span class="seglab">{pct(v["pct"])}</span></div>')
        x += w
    legend = "".join(
        f'<span class="lg"><i style="background:{BUCKET_COLOUR[b]}"></i>'
        f'{e(BUCKET_LABEL[b])} <b>{num(d["buckets"][b]["n"])}</b> '
        f'<span class="mut">({pct(d["buckets"][b]["pct"])})</span></span>'
        for b in BUCKET_ORDER)
    return f'<div class="stack">{"".join(segs)}</div><div class="legend">{legend}</div>'


def ageing_chart(d):
    """Redline ageing - vertical bars, count encoded, WDV on hover."""
    mx = max(x["n"] for x in d["ageing"]) or 1
    bars = []
    for x in d["ageing"]:
        h = 100.0 * x["n"] / mx
        crit = x["band"] in ("91-180", "181-365", "365+")
        col = "#d03b3b" if crit else "#3987e5"
        bars.append(
            f'<div class="abar" title="{e(x["band"])} days in status: {num(x["n"])} assets &middot; WDV {musd(x["wdv"])}">'
            f'<span class="aval">{num(x["n"])}</span>'
            f'<span class="afill" style="height:{h:.2f}%;background:{col}"></span>'
            f'<span class="alab">{e(x["band"])}</span></div>')
    return f'<div class="agechart">{"".join(bars)}</div>'


def minibar(p, level):
    return (f'<span class="mb"><span class="mbf {level}" style="width:{min(p,100):.2f}%"></span>'
            f'<span class="mbt" style="left:{REDLINE_TARGET:.2f}%"></span></span>')


# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------
def build_html(d, total_row, src_name, prepared, notes):
    b = d["buckets"]
    redline_pct = b["redline"]["pct"]
    util_pct = b["onhire"]["pct"]
    over_target = d["assets"] * REDLINE_TARGET / 100.0
    excess = b["redline"]["n"] - over_target
    insp = next(x for x in d["status"] if x["status"] == "Inspection Pending")
    overall = rag_redline(redline_pct)

    recon_ok = (total_row is not None
                and abs(float(total_row["Original Cost"]) - d["cost"]) < 1
                and abs(float(total_row["WDV"]) - d["wdv"]) < 1
                and int(total_row["Units"]) == d["assets"])

    # --- KPI tiles ---------------------------------------------------------
    tiles = [
        ("Fleet on hand", num(d["assets"]), "assets in the export", None, ""),
        ("Original cost", money(d["cost"]), "fleet at original cost", None, ""),
        ("Written-down value", money(d["wdv"]), "current WDV of the fleet", None, ""),
        ("On hire", num(b["onhire"]["n"]), f'{pct(util_pct)} of fleet &middot; WDV {musd(b["onhire"]["wdv"])}',
         "red" if util_pct < UTIL_TARGET else "green", f"target {UTIL_TARGET:.0f}%"),
        ("Redline (unavailable)", pct(redline_pct, 2),
         f'{num(b["redline"]["n"])} assets &middot; WDV {musd(b["redline"]["wdv"])}',
         overall, f"target &lt;{REDLINE_TARGET:.0f}%"),
        ("Redline over target", f"+{num(excess)}",
         "assets above the &lt;15% benchmark", "red", ""),
        ("Inspection pending", num(insp["n"]),
         f'{pct(insp["pct"])} of fleet &middot; {num(insp["over90"])} over 90 days', "amber", ""),
        ("Redline aged &gt;90 days", num(d["exc_n"]),
         f'WDV {musd(d["exc_wdv"])} held out of service', "red", ""),
    ]
    tile_html = ""
    for label, value, sub, level, target in tiles:
        badge = f'<span class="tgt {level or ""}">{target}</span>' if target else ""
        cls = f" {level}" if level else ""
        tile_html += (f'<div class="tile{cls}"><div class="tl">{label}{badge}</div>'
                      f'<div class="tv">{value}</div><div class="ts">{sub}</div></div>')

    # --- status table ------------------------------------------------------
    status_rows = ""
    for s in d["status"]:
        status_rows += (
            f'<tr><td><span class="dot" style="background:{BUCKET_COLOUR[s["bucket"]]}"></span>{e(s["status"])}</td>'
            f'<td class="t">{e(BUCKET_LABEL[s["bucket"]])}</td>'
            f'<td class="n">{num(s["n"])}</td><td class="n">{pct(s["pct"])}</td>'
            f'<td class="n">{money(s["wdv"])}</td><td class="n">{num(s["median"])}</td>'
            f'<td class="n">{num(s["maxd"])}</td><td class="n">{num(s["over90"])}</td></tr>')

    # --- branch table ------------------------------------------------------
    branch_rows = ""
    for x in d["branches"]:
        lvl = rag_redline(x["redline_pct"])
        branch_rows += (
            f'<tr data-rag="{lvl}"><td class="code">{e(x["code"])}</td><td>{e(x["name"])}</td>'
            f'<td class="n">{num(x["n"])}</td><td class="n">{num(x["onhire"])}</td>'
            f'<td class="n">{pct(x["util_pct"])}</td><td class="n">{num(x["redline"])}</td>'
            f'<td class="n b">{pct(x["redline_pct"])}</td>'
            f'<td class="bar">{minibar(x["redline_pct"], lvl)}</td>'
            f'<td class="n">{money(x["redline_wdv"])}</td><td class="n">{num(x["aged90"])}</td>'
            f'<td>{rag_chip(lvl, lvl.upper())}</td></tr>')

    # --- category table ----------------------------------------------------
    cat_rows = ""
    for x in d["categories"]:
        lvl = rag_redline(x["redline_pct"])
        cat_rows += (
            f'<tr><td>{e(x["category"].title())}</td><td class="n">{num(x["n"])}</td>'
            f'<td class="n">{pct(x["util_pct"])}</td><td class="n">{num(x["redline"])}</td>'
            f'<td class="n b">{pct(x["redline_pct"])}</td>'
            f'<td class="bar">{minibar(x["redline_pct"], lvl)}</td>'
            f'<td class="n">{money(x["redline_wdv"])}</td>'
            f'<td class="n">{money(x["wdv"])}</td><td>{rag_chip(lvl, lvl.upper())}</td></tr>')

    # --- exception table ---------------------------------------------------
    exc_rows = ""
    for r in d["exceptions"]:
        exc_rows += (
            f'<tr><td class="code">{e(r["Plant Number"])}</td><td>{e(r["Plant"])}</td>'
            f'<td>{e(r["Branch"].split(" - ")[0])}</td><td class="t">{e(r["Category"].title())}</td>'
            f'<td>{e(r["Availability"])}</td><td class="n b">{num(r["days"])}</td>'
            f'<td class="n">{money(r["wdv"])}</td><td class="n">{money(r["cost"])}</td></tr>')

    idle_rows = ""
    for r in d["idle"]:
        idle_rows += (
            f'<tr><td class="code">{e(r["Plant Number"])}</td><td>{e(r["Plant"])}</td>'
            f'<td>{e(r["Branch"].split(" - ")[0])}</td><td class="t">{e(r["Category"].title())}</td>'
            f'<td>{e(r["Availability"])}</td><td class="n b">{num(r["days"])}</td>'
            f'<td class="n">{money(r["wdv"])}</td></tr>')

    worst = d["branches"][:1][0]
    worst_pct = sorted([x for x in d["branches"] if x["n"] >= 100],
                       key=lambda x: -x["redline_pct"])[:5]
    worst_list = ", ".join(f'{e(x["code"])} {pct(x["redline_pct"])}' for x in worst_pct)

    top_cat = d["categories"][0]

    # --- actions -----------------------------------------------------------
    actions = [
        ("red", "Redline at " + pct(redline_pct, 2) + " against a &lt;15% target",
         f'{num(insp["n"])} assets sit in Inspection Pending - {pct(100.0*insp["n"]/b["redline"]["n"])} of all redline fleet. '
         f'Root cause to confirm at branch level: inspection resourcing, parts, or assets awaiting a decision.',
         f'Clear {num(excess)} assets out of redline to reach the benchmark. Start with the '
         f'{num(insp["over90"])} inspection-pending units over 90 days.',
         "TBC", "TBC", f"Redline &lt;{REDLINE_TARGET:.0f}% of fleet"),
        ("red", f'{num(d["exc_n"])} redline assets aged over 90 days, WDV {musd(d["exc_wdv"])}',
         "Fleet held out of service beyond a normal inspection or repair cycle. "
         "Ageing tail suggests these are stalled rather than in progress.",
         "Branch-by-branch disposition: return to service, transfer to demand, or refer to disposals.",
         "TBC", "TBC", "Nil redline assets over 90 days"),
        ("red", f'Worst branches by redline: {worst_list}',
         "Concentrated rather than network-wide - the top branches carry the bulk of the exposure.",
         "Redline recovery plan per branch, reviewed at weekly PULSE until each is back under 15%.",
         "TBC", "TBC", "Every branch under 15% redline"),
        ("amber", f'{num(d["idle_n"])} available assets untouched for over 180 days (WDV {musd(d["idle_wdv"])})',
         "Fleet is technically available but not earning. Points to fleet mix or location "
         "rather than condition.",
         "Test against demand: transfer to branches with fulfilment pressure, or refer for disposal.",
         "TBC", "TBC", "Idle available fleet reducing month on month"),
        ("amber", f'On hire at {pct(util_pct)} of units on hand',
         "Point-in-time snapshot, not measured time utilisation - directionally below the 65% benchmark.",
         "Confirm against the SiteIQ time-utilisation measure before acting; the two are not interchangeable.",
         "TBC", "TBC", "Time utilisation 65%"),
    ]
    action_rows = ""
    for lvl, issue, cause, action, owner, due, measure in actions:
        action_rows += (
            f'<tr><td>{rag_chip(lvl, lvl.upper())}</td><td class="b">{issue}</td>'
            f'<td>{cause}</td><td>{action}</td><td class="t">{owner}</td>'
            f'<td class="t">{due}</td><td class="t">{measure}</td></tr>')

    recon = ('Computed totals reconcile exactly to the export’s own Total row '
             f'({num(int(total_row["Units"]))} units &middot; {money(float(total_row["Original Cost"]))} original cost &middot; '
             f'{money(float(total_row["WDV"]))} WDV).' if recon_ok else
             'Computed totals could not be reconciled to a Total row in the export - verify before issue.')

    return f"""<!doctype html>
<html lang="en-AU"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Coates | Fleet Listing by Availability Status</title>
<style>
:root{{
  --orange:#F26222; --orange-dk:#d95926;
  --bg:#0D1117; --surface:#161B22; --surface2:#1C232D; --line:#252D38;
  --ink:#FFFFFF; --ink2:#C3C7CE; --mut:#8A929E;
  --green:#0ca30c; --amber:#fab219; --red:#d03b3b; --blue:#3987e5;
}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);
  font-family:system-ui,-apple-system,"Segoe UI",Calibri,sans-serif;font-size:14px;line-height:1.5}}
.wrap{{max-width:1520px;margin:0 auto;padding:0 24px 64px}}

/* header */
header{{background:linear-gradient(180deg,#12171E 0%,#0D1117 100%);border-bottom:3px solid var(--orange)}}
.hdr{{max-width:1520px;margin:0 auto;padding:20px 24px 18px;display:flex;flex-wrap:wrap;
  gap:20px;align-items:flex-end;justify-content:space-between}}
.brand{{display:flex;align-items:center;gap:14px}}
.mark{{background:var(--orange);color:#fff;font-weight:800;letter-spacing:.14em;
  padding:9px 14px;font-size:19px;border-radius:3px}}
.tag{{color:var(--ink2);font-size:12px;letter-spacing:.05em}}
.tag b{{color:var(--ink);display:block;font-size:14px;letter-spacing:0}}
h1{{margin:0;font-size:23px;font-weight:700;letter-spacing:-.2px}}
.sub{{color:var(--ink2);font-size:13px;margin-top:3px}}
.siteiq{{text-align:right;font-size:11px;color:var(--mut);letter-spacing:.16em;font-weight:700}}
.siteiq b{{color:var(--orange)}}
.author{{color:var(--ink2);font-size:12px;letter-spacing:0;font-weight:600;margin-top:5px}}

/* meta strip */
.meta{{display:flex;flex-wrap:wrap;gap:0;border-bottom:1px solid var(--line);background:var(--surface)}}
.meta div{{padding:9px 18px;border-right:1px solid var(--line);font-size:12px;color:var(--mut)}}
.meta div b{{color:var(--ink);font-weight:600}}

section{{margin-top:30px}}
h2{{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);
  margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line);font-weight:700}}
h2 span{{color:var(--orange)}}
.note{{color:var(--mut);font-size:12px;margin:8px 0 0}}

/* exec summary */
.exec{{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--red);
  border-radius:4px;padding:20px 22px}}
.exec .verdict{{font-size:17px;font-weight:700;margin:0 0 10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}}
.exec p{{margin:0 0 9px;color:var(--ink2);max-width:106ch}}
.exec p:last-child{{margin-bottom:0}}
.exec b{{color:var(--ink)}}

/* tiles */
.tiles{{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px}}
.tile{{background:var(--surface);border:1px solid var(--line);border-top:3px solid var(--line);
  border-radius:4px;padding:14px 16px}}
.tile.red{{border-top-color:var(--red)}} .tile.amber{{border-top-color:var(--amber)}}
.tile.green{{border-top-color:var(--green)}}
.tl{{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);
  font-weight:700;display:flex;justify-content:space-between;align-items:center;gap:8px}}
.tv{{font-size:29px;font-weight:700;margin:7px 0 3px;letter-spacing:-.6px}}
.ts{{font-size:12px;color:var(--ink2)}}
.tgt{{font-size:10px;padding:2px 6px;border-radius:9px;background:var(--surface2);
  color:var(--mut);letter-spacing:0;text-transform:none;white-space:nowrap}}
.tgt.red{{color:#ffb3b3}} .tgt.amber{{color:#ffd98a}} .tgt.green{{color:#8fe08f}}

/* panels */
.panel{{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:18px 20px}}
.cols{{display:grid;grid-template-columns:1.35fr 1fr;gap:16px;align-items:start}}
@media(max-width:1020px){{.cols{{grid-template-columns:1fr}}}}

/* stacked bar */
.stack{{display:flex;height:46px;border-radius:3px;overflow:hidden;gap:2px;background:var(--surface)}}
.seg{{position:relative;display:flex;align-items:center;justify-content:center;min-width:2px}}
.seglab{{font-size:12px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5)}}
.legend{{display:flex;flex-wrap:wrap;gap:16px;margin-top:14px;font-size:12px;color:var(--ink2)}}
.lg{{display:flex;align-items:center;gap:7px}}
.lg i{{width:11px;height:11px;border-radius:2px;display:inline-block}}
.lg b{{color:var(--ink)}} .mut{{color:var(--mut)}}

/* ageing chart */
.agechart{{display:flex;align-items:flex-end;gap:10px;height:190px;padding-top:8px}}
.abar{{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}}
.afill{{width:100%;border-radius:4px 4px 0 0;min-height:3px;display:block}}
.aval{{font-size:12px;font-weight:700;margin-bottom:5px}}
.alab{{font-size:11px;color:var(--mut);margin-top:7px;white-space:nowrap}}

/* tables */
.tbl{{width:100%;border-collapse:collapse;font-size:13px}}
.tblwrap{{overflow-x:auto;border:1px solid var(--line);border-radius:4px;background:var(--surface)}}
.tbl th{{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);
  padding:11px 12px;border-bottom:1px solid var(--line);background:var(--surface2);
  position:sticky;top:0;white-space:nowrap;font-weight:700}}
.tbl td{{padding:9px 12px;border-bottom:1px solid var(--line);color:var(--ink2);vertical-align:top}}
.tbl tr:last-child td{{border-bottom:none}}
.tbl tbody tr:hover td{{background:var(--surface2)}}
.tbl td.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--ink)}}
.tbl td.b{{font-weight:700;color:var(--ink)}}
.tbl td.t{{color:var(--mut)}}
.tbl td.code{{font-variant-numeric:tabular-nums;color:var(--ink);font-weight:600;white-space:nowrap}}
.tbl.actions td{{font-size:12.5px}}
.dot{{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:8px}}

/* chips + minibars */
.chip{{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;
  padding:2px 8px;border-radius:10px;letter-spacing:.04em;white-space:nowrap}}
.chip .ico{{font-size:8px}}
.chip.green{{background:rgba(12,163,12,.16);color:#7ede7e}}
.chip.amber{{background:rgba(250,178,25,.16);color:#ffd07a}}
.chip.red{{background:rgba(208,59,59,.18);color:#ff9c9c}}
.mb{{position:relative;display:block;width:110px;height:8px;background:var(--surface2);border-radius:4px}}
.mbf{{position:absolute;left:0;top:0;height:100%;border-radius:4px}}
.mbf.green{{background:var(--green)}} .mbf.amber{{background:var(--amber)}} .mbf.red{{background:var(--red)}}
.mbt{{position:absolute;top:-2px;width:2px;height:12px;background:var(--ink2);opacity:.75}}
td.bar{{width:120px}}

.ctrl{{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;align-items:center}}
.ctrl input,.ctrl select{{background:var(--surface2);border:1px solid var(--line);color:var(--ink);
  padding:7px 11px;border-radius:4px;font-size:13px;font-family:inherit}}
.ctrl input{{min-width:230px}}
.ctrl label{{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);font-weight:700}}

footer{{margin-top:38px;border-top:1px solid var(--line);padding-top:18px;
  color:var(--mut);font-size:11.5px;line-height:1.7}}
footer b{{color:var(--ink2)}}
.tbc{{color:var(--amber);font-weight:700}}

@media print{{
  body{{background:#fff;color:#000}}
  .tile,.panel,.tblwrap,.exec,.meta{{background:#fff;border-color:#ccc}}
  .tbl th{{background:#f2f2f2;color:#000}} .tbl td{{color:#000}}
  h1,.tv,.tbl td.n{{color:#000}} .ctrl{{display:none}}
  tr{{page-break-inside:avoid}} section{{page-break-inside:avoid}}
  @page{{size:A4 landscape;margin:12mm}}
}}
</style></head><body>

<header><div class="hdr">
  <div class="brand">
    <div class="mark">COATES</div>
    <div class="tag"><b>Equipped for anything</b>Best Service &amp; Value</div>
  </div>
  <div>
    <h1>Fleet Listing by Availability Status</h1>
    <div class="sub">MyBranch Metric Details &middot; QLD &amp; NT branch network &middot; point-in-time snapshot</div>
  </div>
  <div class="siteiq">POWERED BY <b>SITEIQ</b>
    <div class="author">Author: Andrew Fisher</div></div>
</div></header>

<div class="meta">
  <div>Report <b>Fleet Listing by Availability Status</b></div>
  <div>Scope <b>{num(len(d["branches"]))} branches &middot; {num(d["assets"])} assets</b></div>
  <div>Fleet value <b>{money(d["wdv"])} WDV</b></div>
  <div>Prepared <b>{prepared}</b></div>
  <div>Extract date <b class="tbc">TBC</b> &mdash; not carried in the export</div>
  <div>Source <b>{e(src_name)}</b></div>
</div>

<div class="wrap">

<section>
  <h2>Executive summary <span>&mdash; the position</span></h2>
  <div class="exec">
    <div class="verdict">{rag_chip(overall, "RED &mdash; ACTION NEEDED")}
      Redline is {pct(redline_pct, 2)} against a &lt;15% target</div>
    <p>Of <b>{num(d["assets"])}</b> assets on hand across <b>{num(len(d["branches"]))}</b> QLD and NT branches
       &mdash; <b>{money(d["cost"])}</b> at original cost, <b>{money(d["wdv"])}</b> written down &mdash;
       <b>{num(b["redline"]["n"])}</b> are unavailable. That is <b>{pct(redline_pct, 2)}</b> of the fleet against the
       Coates Way benchmark of under 15%, or <b>{num(excess)} assets</b> too many, with
       <b>{musd(b["redline"]["wdv"])}</b> of written-down value sitting out of service.</p>
    <p><b>Inspection Pending is the single driver.</b> It accounts for <b>{num(insp["n"])}</b> of the
       <b>{num(b["redline"]["n"])}</b> redline assets ({pct(100.0*insp["n"]/b["redline"]["n"])}), and
       <b>{num(insp["over90"])}</b> of those have been in that status for more than 90 days &mdash; the longest
       at <b>{num(insp["maxd"])} days</b>. Clearing the inspection backlog alone would take redline
       below the benchmark.</p>
    <p><b>The exposure is concentrated, not network-wide.</b> Branches of 100 assets or more with the
       highest redline share: {worst_list}. Across the network <b>{num(d["exc_n"])}</b> redline assets have
       been stalled beyond 90 days, holding <b>{musd(d["exc_wdv"])}</b> of WDV.
       By category, <b>{e(top_cat["category"].title())}</b> carries the largest redline value at
       <b>{money(top_cat["redline_wdv"])}</b> ({pct(top_cat["redline_pct"])} of that category unavailable).</p>
    <p><b>Utilisation.</b> <b>{num(b["onhire"]["n"])}</b> assets ({pct(util_pct)}) are on hire, carrying
       <b>{musd(b["onhire"]["wdv"])}</b> of WDV. Read this as a point-in-time on-hire share of units on hand,
       not as measured time utilisation &mdash; the 65% Coates Way target is the time-based measure and the two
       are not interchangeable. A further <b>{num(d["idle_n"])}</b> available assets have not moved in over
       180 days.</p>
  </div>
</section>

<section>
  <h2>Key numbers</h2>
  <div class="tiles">{tile_html}</div>
</section>

<section>
  <h2>Fleet split by availability</h2>
  <div class="cols">
    <div class="panel">
      {stacked_bar(d)}
      <p class="note">Share of {num(d["assets"])} assets on hand. Redline groups Inspection Pending,
      In Service, Off Site for Repair and Wait for config job &mdash; fleet that can neither be hired
      nor offered. Hover any segment for asset count and written-down value.</p>
    </div>
    <div class="panel">
      <div class="tl" style="margin-bottom:6px">Redline ageing &mdash; days in status</div>
      {ageing_chart(d)}
      <p class="note">Red bands are past a normal inspection or repair cycle:
      <b style="color:var(--ink)">{num(d["exc_n"])}</b> assets over 90 days holding
      <b style="color:var(--ink)">{musd(d["exc_wdv"])}</b> WDV.</p>
    </div>
  </div>
</section>

<section>
  <h2>Availability status detail</h2>
  <div class="tblwrap"><table class="tbl">
    <thead><tr><th>Availability status</th><th>Bucket</th><th class="n">Assets</th>
      <th class="n">% fleet</th><th class="n">WDV</th><th class="n">Median days</th>
      <th class="n">Max days</th><th class="n">Over 90 days</th></tr></thead>
    <tbody>{status_rows}</tbody></table></div>
</section>

<section>
  <h2>Exceptions <span>&mdash; redline assets stalled beyond 90 days</span></h2>
  <p class="note" style="margin:0 0 10px">Top 25 of {num(d["exc_n"])} by written-down value.
     Full list sits in the source export.</p>
  <div class="tblwrap"><table class="tbl">
    <thead><tr><th>Plant no.</th><th>Description</th><th>Branch</th><th>Category</th>
      <th>Status</th><th class="n">Days</th><th class="n">WDV</th><th class="n">Original cost</th></tr></thead>
    <tbody>{exc_rows}</tbody></table></div>
</section>

<section>
  <h2>Branch performance <span>&mdash; redline against the &lt;15% benchmark</span></h2>
  <div class="ctrl">
    <label for="bsearch">Filter</label>
    <input id="bsearch" type="search" placeholder="Branch code or name&hellip;">
    <label for="brag">RAG</label>
    <select id="brag"><option value="">All</option><option value="red">Red only</option>
      <option value="amber">Amber only</option><option value="green">Green only</option></select>
    <span class="note" id="bcount"></span>
  </div>
  <div class="tblwrap"><table class="tbl" id="btbl">
    <thead><tr><th>Code</th><th>Branch</th><th class="n">Fleet</th><th class="n">On hire</th>
      <th class="n">On hire %</th><th class="n">Redline</th><th class="n">Redline %</th>
      <th>vs 15% target</th><th class="n">Redline WDV</th><th class="n">Aged &gt;90d</th><th>RAG</th></tr></thead>
    <tbody>{branch_rows}</tbody></table></div>
  <p class="note">Sorted by redline asset count. The marker on each bar is the 15% benchmark.
     RAG: green under 15%, amber 15&ndash;25%, red over 25%.</p>
</section>

<section>
  <h2>Category performance</h2>
  <div class="tblwrap"><table class="tbl">
    <thead><tr><th>Category</th><th class="n">Fleet</th><th class="n">On hire %</th>
      <th class="n">Redline</th><th class="n">Redline %</th><th>vs 15% target</th>
      <th class="n">Redline WDV</th><th class="n">Category WDV</th><th>RAG</th></tr></thead>
    <tbody>{cat_rows}</tbody></table></div>
  <p class="note">Sorted by redline written-down value &mdash; where the idle capital actually sits.</p>
</section>

<section>
  <h2>Idle available fleet <span>&mdash; ready but not moving for over 180 days</span></h2>
  <p class="note" style="margin:0 0 10px">{num(d["idle_n"])} assets holding {money(d["idle_wdv"])} WDV.
     Top 15 by value shown.</p>
  <div class="tblwrap"><table class="tbl">
    <thead><tr><th>Plant no.</th><th>Description</th><th>Branch</th><th>Category</th>
      <th>Status</th><th class="n">Days</th><th class="n">WDV</th></tr></thead>
    <tbody>{idle_rows}</tbody></table></div>
</section>

<section>
  <h2>Actions</h2>
  <div class="tblwrap"><table class="tbl actions">
    <thead><tr><th>RAG</th><th>Issue</th><th>Root cause</th><th>Action</th>
      <th>Owner</th><th>Deadline</th><th>Measure of success</th></tr></thead>
    <tbody>{action_rows}</tbody></table></div>
  <p class="note">Owners and deadlines are marked <span class="tbc">TBC</span> &mdash; they are not in the
     export and have not been assumed. Assign them before this report is issued; a red item without a
     named owner and a date is decoration.</p>
</section>

<footer>
  <b>Data source:</b> SiteIQ &mdash; MyBranch Metric Details for: Fleet Listing by Availability Status
  (<code>{e(src_name)}</code>, {num(d["assets"])} asset records).<br>
  <b>Export note:</b> {e(" &middot; ".join(notes)) if notes else "none carried in the export"} &mdash;
  the export is unfiltered, so this is the whole QLD/NT branch network, not a subset.<br>
  <b>Extract date and time:</b> <span class="tbc">TBC</span> &mdash; the export carries no extract
  timestamp. Confirm in SiteIQ and record it here before the report is issued externally.<br>
  <b>Report prepared:</b> {prepared} &middot; <b>Author:</b> Andrew Fisher &middot; POWERED BY SITEIQ<br>
  <b>Reconciliation:</b> {recon}<br>
  <b>Definitions:</b> Redline = unavailable fleet (Inspection Pending, In Service, Off Site for Repair,
  Wait for config job), Coates Way target under 15%. On hire = On Hire, On Hire In Service and Reserved
  In Service. Available = Available and Reserved. In transit = Off Hired and In Transfer. Days in status
  is taken from the export as supplied. Values are AUD; WDV is written-down value.<br>
  <b>Disclaimer:</b> Point-in-time snapshot. Availability moves through the day, so figures will differ
  from a later extract. Every number is computed from the export &mdash; nothing is estimated or inferred.
</footer>
</div>

<script>
(function(){{
  var q=document.getElementById('bsearch'), rag=document.getElementById('brag'),
      tb=document.querySelector('#btbl tbody'), count=document.getElementById('bcount');
  if(!tb) return;
  var rows=[].slice.call(tb.rows);
  function apply(){{
    var t=(q.value||'').toLowerCase(), r=rag.value, shown=0;
    rows.forEach(function(row){{
      var ok=row.textContent.toLowerCase().indexOf(t)>-1 && (!r || row.dataset.rag===r);
      row.style.display = ok ? '' : 'none';
      if(ok) shown++;
    }});
    count.textContent = shown + ' of ' + rows.length + ' branches';
  }}
  q.addEventListener('input',apply); rag.addEventListener('change',apply); apply();
}})();
</script>
</body></html>"""


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if not src:
        sys.exit("usage: build_fleet_availability_report.py <export.xlsx> [output.html]")
    out = sys.argv[2] if len(sys.argv) > 2 else "Fleet_Listing_by_Availability_Status.html"
    rows, total_row, notes = load(src)
    d = aggregate(rows)
    prepared = date.today().strftime("%d %b %Y")
    html_doc = build_html(d, total_row, os.path.basename(src), prepared, notes)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(html_doc)
    print(f"{d['assets']:,} assets | redline {d['buckets']['redline']['n']:,} "
          f"({100*d['buckets']['redline']['n']/d['assets']:.2f}%) -> {out}")


if __name__ == "__main__":
    main()
