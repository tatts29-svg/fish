# =============================================================================
#  COATES | AMPOL TOOL STORE - ON-HIRE, UTILISATION & COMPLIANCE REPORT KIT
#  Author: Andrew Fisher  |  The Coates Way  |  POWERED BY SITEIQ
#
#  Reads everything from the folder this script sits in (never modifies the
#  workbook). Reports: Executive, Quarterly on-hire, Company on-hire,
#  Utilisation & What-to-Buy, Compliance & Trends. Every report ships as
#  PDF + HTML + Outlook-safe email draft (MAKE_OUTLOOK_DRAFTS.bat -> native
#  drafts with full To-field search).
# =============================================================================
import datetime as dt
import html as _html
import json
import os
import re
import subprocess
import sys
from collections import defaultdict

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "Output_Tooling_Reports")
WORKBOOK = "Ampol_Onhire_Tooling_Report.xlsm"

TODAY = dt.date.today()
GENERATED = dt.datetime.now().strftime("%d/%m/%Y %I:%M %p").lstrip("0")
DATESTR = TODAY.strftime("%Y-%m-%d")

ORANGE = "#F26222"
DARK = "#1D1D1B"
GREY = "#555555"
LIGHT = "#F5F1EC"
RED = "#B3261E"
GREEN = "#1E7B34"
AMBER = "#9A6A00"

HIGH_VALUE = 1000.0          # replacement-cost threshold for the high-value chase
NOT_SIGHTED_DAYS = 90        # "not seen in 3 months = potentially out of test date"
OUT_OF_TAG_HIRER = "RIGGING & 240V - OUT OF TAG DATE"

QUARTERS = {
    "Q1": ("Q1 Jan-Mar Onhire", "Q1 (Jan-Mar)", (1, 2, 3)),
    "Q2": ("Q2 Apr-Jun Onhire", "Q2 (Apr-Jun)", (4, 5, 6)),
    "Q3": ("Q3 Jul-Sep Onhire", "Q3 (Jul-Sep)", (7, 8, 9)),
    "Q4": ("Q4 Oct-Dec Onhire", "Q4 (Oct-Dec)", (10, 11, 12)),
}
# legacy tab names (pre-rename workbooks still work)
LEGACY_SHEETS = {
    "Q1 Jan-Mar Onhire": "Jan26-Mar26 Onhire",
    "Q2 Apr-Jun Onhire": "Apr26-Jun26 Onhire",
    "Q3 Jul-Sep Onhire": "Jul26-Sep26 Onhire",
    "Q4 Oct-Dec Onhire": "Oct26-Dec26 Onhire",
}
ELECTRICAL_KW = ["240V", "110V", " LEAD", "EXTENSION LEAD", "RCD", "POWER BOARD",
                 "POWERBOARD", "TRANSFORMER", "DISTRIBUTION BOARD"]
RIGGING_KW = ["SLING", "SHACKLE", "CHAIN BLOCK", "LEVER HOIST", "HOIST", "BEAM CLAMP",
              "BEAM TROLLEY", "TIRFOR", "TURFER", "SPREADER", "LIFTING", "RIGGING",
              "PLATE CLAMP", "DRUM LIFTER"]
HIGH_TORQUE_KW = ["TORQUE", "TENSIONER", "HYTORC", "ENERPAC", "IMPACT WRENCH",
                  "RATTLE GUN", "NUT RUNNER"]
ACRONYMS = {"CR", "HIS", "IPS", "CSA", "BMD", "ARL", "JLG", "PPE", "MMG"}

LSR_LINE = ("Life Saving Rule 5 - Tools and Equipment (SEQ-GL-009): nothing damaged, "
            "defective or out of test date is ever reissued.")
CANON = ["Two scans. Two looks. One standard.",
         "Nothing goes on the shelf unless it is ready for hire.",
         "Right first time. Every item. Every time."]


# ---------------------------------------------------------------- helpers ---
def esc(v):
    return _html.escape(str(v)) if v is not None else ""


def money(v):
    try:
        return "${:,.2f}".format(float(v))
    except (TypeError, ValueError):
        return "-"


def pct(v):
    try:
        return "{:.0f}%".format(float(v) * 100)
    except (TypeError, ValueError):
        return "-"


def clean(v):
    return str(v).strip() if v is not None else ""


def display_company(name):
    n = clean(name)
    if not n:
        return ""
    if n.upper() in ACRONYMS:
        return n.upper()
    words = []
    for w in re.split(r"(\s+)", n):
        words.append(w.upper() if w.strip().upper() in ACRONYMS else w.capitalize())
    return "".join(words)


def safe_date(v):
    if v is None or v == "":
        return None
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    s = str(v).strip().split(" ")[0]
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y"):
        try:
            return dt.datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def matches_any(text, kws):
    t = " " + clean(text).upper() + " "
    return any(k in t for k in kws)


def category_of(desc):
    if matches_any(desc, HIGH_TORQUE_KW):
        return "High Torque"
    if matches_any(desc, RIGGING_KW):
        return "Rigging"
    if matches_any(desc, ELECTRICAL_KW):
        return "Electrical"
    return None


# ---------------------------------------------------------------- loading ---
def find_file(*names):
    for n in names:
        p = os.path.join(HERE, n)
        if os.path.exists(p):
            return p
    return None


def sheet_rows(ws, probe):
    """Read a sheet as dicts, locating the header row by a probe column name."""
    rows = list(ws.iter_rows(values_only=True))
    hdr_i = None
    for i, r in enumerate(rows[:6]):
        if r and any(clean(c) == probe for c in r if c is not None):
            hdr_i = i
            break
    if hdr_i is None:
        return []
    headers = [clean(c) for c in rows[hdr_i]]
    out = []
    for r in rows[hdr_i + 1:]:
        if r is None or all(c is None or clean(c) == "" for c in r):
            continue
        out.append({h: v for h, v in zip(headers, r) if h})
    return out


def load_all():
    d = {}
    wb_path = find_file(WORKBOOK)
    if not wb_path:
        sys.exit("Workbook not found beside this script: " + WORKBOOK)
    wb = openpyxl.load_workbook(wb_path, read_only=True, data_only=True)

    d["master"] = sheet_rows(wb["Master Onhire"], "ITEM_BARCODE")
    d["recovery"] = sheet_rows(wb["Quarterly Recovery Summary"], "COMPANY_NAME")
    d["quarters"] = {}
    for qk, (sheet, _label, _m) in QUARTERS.items():
        try:
            d["quarters"][qk] = sheet_rows(wb[sheet], "ITEM_BARCODE")
        except KeyError:
            try:
                d["quarters"][qk] = sheet_rows(wb[LEGACY_SHEETS[sheet]], "ITEM_BARCODE")
            except KeyError:
                d["quarters"][qk] = []
    d["util"] = sheet_rows(wb["Tooling Utilisation"], "Equipment Group")
    d["repairs"] = sheet_rows(wb["Out For Repair"], "ITEM_BARCODE")
    d["available"] = sheet_rows(wb["Available"], "ITEM_BARCODE")
    wb.close()
    d["wb_mtime"] = dt.datetime.fromtimestamp(os.path.getmtime(wb_path))

    # transactions (year to date)
    d["tx"] = []
    tx_path = find_file("TRANSACTIONS_Full.xlsx")
    if tx_path:
        twb = openpyxl.load_workbook(tx_path, read_only=True, data_only=True)
        ws = twb["CUSTOMER_CONTRACTOR_EQUIP"]
        rows = ws.iter_rows(values_only=True)
        headers = [clean(c) for c in next(rows)]
        idx = {h: i for i, h in enumerate(headers)}
        for r in rows:
            if r is None or r[0] is None:
                continue
            d["tx"].append({
                "company": clean(r[idx.get("EMPLOYER_NAME", 0)]),
                "hirer": clean(r[idx.get("HIRER_NAME", 1)]),
                "desc": clean(r[idx.get("SKU/ITEM DESCRIPTION", 4)]),
                "barcode": clean(r[idx.get("LATEST_BARCODE", 5)]),
                "cat": clean(r[idx.get("PRODUCT_CATEGORY", 6)]),
                "start": safe_date(r[idx.get("TRAN_START_DATE", 9)]),
                "end": safe_date(r[idx.get("TRAN_END_DATE", 11)]),
            })
        twb.close()

    # stocktake (last sighted)
    d["stocktake"] = {}
    st_path = find_file("STOCKTAKE.xlsx", "STOCKTAKE (1).xlsx")
    if st_path:
        swb = openpyxl.load_workbook(st_path, read_only=True, data_only=True)
        ws = swb["STOCKTAKE"]
        rows = ws.iter_rows(values_only=True)
        headers = [clean(c) for c in next(rows)]
        idx = {h: i for i, h in enumerate(headers)}
        for r in rows:
            if r is None:
                continue
            bc = clean(r[idx.get("LATEST_BARCODE", 4)])
            if not bc:
                continue
            seen = r[idx.get("LAST_SIGHTED_DATE_TIME", 9)]
            seen_d = safe_date(seen)
            prev = d["stocktake"].get(bc)
            if prev is None or (seen_d and (prev["seen"] is None or seen_d > prev["seen"])):
                d["stocktake"][bc] = {"seen": seen_d,
                                      "by": clean(r[idx.get("LAST_SIGHTED_BY", 10)]),
                                      "unit": clean(r[idx.get("STORAGE_UNIT", 1)])}
        swb.close()

    # pricing (avg buy price / where to buy)
    d["pricing"] = {}
    pr_path = find_file("Ampol ToolStore Pricing.xlsx", "Ampol_ToolStore_Pricing.xlsx")
    if pr_path:
        pwb = openpyxl.load_workbook(pr_path, read_only=True, data_only=True)
        ws = pwb["RENTAL_STOCK"]
        rows = ws.iter_rows(values_only=True)
        next(rows)
        for r in rows:
            if r is None or not r[0]:
                continue
            d["pricing"][clean(r[0]).upper()] = {"buy": num(r[1]),
                                                 "source": clean(r[5]) if len(r) > 5 else ""}
        pwb.close()

    # out-of-tag parked gear straight from RENTAL_STOCK
    d["out_of_tag"] = []
    rs_path = find_file("RENTAL_STOCK.xlsx")
    if rs_path:
        rwb = openpyxl.load_workbook(rs_path, read_only=True, data_only=True)
        ws = rwb["RENTAL_STOCK"]
        rows = ws.iter_rows(values_only=True)
        headers = [clean(c) for c in next(rows)]
        idx = {h: i for i, h in enumerate(headers)}
        for r in rows:
            if r is None:
                continue
            hirer = clean(r[idx.get("HIRER_NAME", 2)]).upper()
            if hirer == OUT_OF_TAG_HIRER:
                d["out_of_tag"].append({
                    "barcode": clean(r[idx.get("ITEM_BARCODE", 7)]),
                    "desc": clean(r[idx.get("ITEM_DESCRIPTION", 6)]),
                    "status": clean(r[idx.get("ITEM_STATUS", 8)]),
                })
        rwb.close()
    return d


# ----------------------------------------------------------------- models ---
def master_row(r):
    return {
        "company": clean(r.get("COMPANY_NAME")),
        "hirer": clean(r.get("HIRER_NAME")),
        "barcode": clean(r.get("ITEM_BARCODE")),
        "desc": clean(r.get("ITEM_DESCRIPTION")),
        "date": safe_date(r.get("ON_HIRE_DATE")),
        "month": clean(r.get("Month")),
        "cost": num(r.get("Replacement Cost")),
    }


def quarter_model(d, qk):
    label = QUARTERS[qk][1] if qk != "YEAR" else "Year " + str(TODAY.year)
    rows = ([master_row(r) for r in d["master"]] if qk == "YEAR"
            else [master_row(r) for r in d["quarters"][qk]])
    rows = [r for r in rows if r["barcode"]]
    by_co = defaultdict(list)
    for r in rows:
        by_co[display_company(r["company"]) or "(No Company Recorded)"].append(r)
    total_val = sum(r["cost"] or 0 for r in rows)
    priced = sum(1 for r in rows if r["cost"] is not None)
    return {"key": qk, "label": label, "rows": rows, "by_co": dict(sorted(by_co.items())),
            "total_val": total_val, "priced": priced,
            "companies": len([k for k in by_co if k != "(No Company Recorded)"])}


def company_model(d, name):
    disp = display_company(name)
    mine = [r for r in (master_row(x) for x in d["master"])
            if display_company(r["company"]) == disp]
    per_q = {}
    for qk in QUARTERS:
        per_q[qk] = [r for r in (master_row(x) for x in d["quarters"][qk])
                     if display_company(r["company"]) == disp]
    tx = [t for t in d["tx"] if display_company(t["company"]) == disp]
    tx_ytd = len(tx)
    same_day = sum(1 for t in tx if t["end"] and t["start"] and t["end"] == t["start"])
    people = sorted({t["hirer"] for t in tx if t["hirer"]})
    high_val = sorted([r for r in mine if (r["cost"] or 0) >= HIGH_VALUE],
                      key=lambda r: -(r["cost"] or 0))
    compliance = [r for r in mine if category_of(r["desc"])]
    total_val = sum(r["cost"] or 0 for r in mine)
    return {"name": disp, "items": sorted(mine, key=lambda r: (r["date"] or TODAY)),
            "per_q": per_q, "tx_ytd": tx_ytd, "same_day": same_day,
            "same_day_pct": (same_day / tx_ytd) if tx_ytd else None,
            "people": people, "high_val": high_val, "compliance": compliance,
            "total_val": total_val}


def util_model(d):
    rows = []
    for r in d["util"]:
        g = clean(r.get("Equipment Group"))
        if not g:
            continue
        price = d["pricing"].get(g.upper(), {})
        rows.append({
            "group": g,
            "qty": num(r.get("Total Qty")) or 0,
            "on_hire": num(r.get("Qty On Hire")) or 0,
            "avail": num(r.get("Qty Available")) or 0,
            "live": num(r.get("Live Utilisation %")),
            "tx": num(r.get("Total Transactions")) or 0,
            "hirers": num(r.get("No. of Hirers Using Item")) or 0,
            "days": num(r.get("Total Hire Days")) or 0,
            "ytd": num(r.get("YTD Utilisation %")),
            "rec": clean(r.get("Recommendation")),
            "buy": price.get("buy"),
            "source": price.get("source", ""),
        })
    buy = sorted([r for r in rows if r["rec"] in
                  ("High Priority - No Available Stock", "Consider Additional Stock")],
                 key=lambda r: (-(r["live"] or 0), -r["days"]))
    overstock = sorted([r for r in rows if r["rec"] == "Potential Overstock"],
                       key=lambda r: (r["ytd"] or 0))
    top_used = sorted([r for r in rows if r["days"] > 0],
                      key=lambda r: -r["days"])[:15]
    return {"rows": rows, "buy": buy, "overstock": overstock, "top_used": top_used}


def compliance_model(d):
    cutoff = TODAY - dt.timedelta(days=NOT_SIGHTED_DAYS)
    chase = []
    for r in (master_row(x) for x in d["master"]):
        cat = category_of(r["desc"])
        if not cat or not r["barcode"]:
            continue
        st = d["stocktake"].get(r["barcode"])
        seen = st["seen"] if st else None
        if seen is None or seen < cutoff:
            chase.append({**r, "cat": cat, "seen": seen})
    chase.sort(key=lambda r: (r["cat"], r["seen"] or dt.date(2000, 1, 1)))
    by_cat = defaultdict(list)
    for c in chase:
        by_cat[c["cat"]].append(c)
    high_val = sorted([r for r in (master_row(x) for x in d["master"])
                       if (r["cost"] or 0) >= HIGH_VALUE], key=lambda r: -(r["cost"] or 0))
    # monthly movement trend from transactions
    trend = defaultdict(int)
    for t in d["tx"]:
        if t["start"] and t["start"].year == TODAY.year:
            trend[t["start"].strftime("%b")] += 1
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    trend_rows = [(m, trend.get(m, 0)) for m in months if trend.get(m, 0) or
                  months.index(m) < TODAY.month]
    return {"chase": chase, "by_cat": dict(by_cat), "out_of_tag": d["out_of_tag"],
            "high_val": high_val, "trend": trend_rows}


def exec_model(d):
    master = [master_row(r) for r in d["master"]]
    total_val = sum(r["cost"] or 0 for r in master)
    companies = sorted({display_company(r["company"]) for r in master if r["company"]})
    um = util_model(d)
    cm = compliance_model(d)
    qcounts = {qk: len(d["quarters"][qk]) for qk in QUARTERS}
    tx_ytd = len(d["tx"])
    same_day = sum(1 for t in d["tx"] if t["end"] and t["start"] and t["end"] == t["start"])
    return {"on_hire": len(master), "total_val": total_val, "companies": companies,
            "available": len(d["available"]), "repairs": len(d["repairs"]),
            "qcounts": qcounts, "tx_ytd": tx_ytd, "same_day": same_day,
            "same_day_pct": (same_day / tx_ytd) if tx_ytd else None,
            "buy_n": len(um["buy"]), "overstock_n": len(um["overstock"]),
            "chase_n": len(cm["chase"]), "out_of_tag_n": len(cm["out_of_tag"]),
            "high_val_n": len(cm["high_val"]),
            "high_val_sum": sum(r["cost"] or 0 for r in cm["high_val"]),
            "recovery": d["recovery"]}


# -------------------------------------------------------------- rendering ---
def page(title, subtitle, body, limits):
    lim = "".join("<li>" + esc(x) + "</li>" for x in limits)
    canon = "  |  ".join(CANON)
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{esc(title)}</title>
<style>
 body{{font-family:Segoe UI,Arial,sans-serif;color:{DARK};margin:0;background:#fff;}}
 .band{{background:{DARK};color:#fff;padding:26px 34px;}}
 .band h1{{margin:0;font-size:24px;letter-spacing:.5px;}}
 .band .sub{{color:{ORANGE};font-weight:700;margin-top:6px;font-size:13px;}}
 .band .meta{{color:#bbb;font-size:11px;margin-top:8px;}}
 .wrap{{padding:22px 34px;}}
 h2{{font-size:15px;border-left:5px solid {ORANGE};padding-left:10px;margin:26px 0 10px 0;text-transform:uppercase;letter-spacing:1px;}}
 p.story{{font-size:12.5px;line-height:1.75;margin:8px 0;}}
 table{{border-collapse:collapse;width:100%;font-size:11px;margin:8px 0;}}
 th{{background:{DARK};color:#fff;text-align:left;padding:6px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;}}
 td{{padding:5px 8px;border-bottom:1px solid #e5e0da;}}
 tr:nth-child(even) td{{background:{LIGHT};}}
 .tiles{{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0;}}
 .tile{{border:1px solid #e0dad2;border-bottom:3px solid {ORANGE};padding:12px 16px;min-width:130px;}}
 .tile .v{{font-size:22px;font-weight:800;color:{ORANGE};}}
 .tile .l{{font-size:10px;color:{GREY};text-transform:uppercase;letter-spacing:1px;margin-top:3px;}}
 .good{{color:{GREEN};font-weight:700;}} .warn{{color:{AMBER};font-weight:700;}} .bad{{color:{RED};font-weight:700;}}
 .footer{{margin-top:30px;border-top:3px solid {ORANGE};padding:14px 34px;font-size:10px;color:{GREY};line-height:1.7;}}
 .cochip{{background:{DARK};color:#fff;padding:4px 10px;font-size:11px;font-weight:700;display:inline-block;margin-top:14px;}}
</style></head><body>
<div class="band"><h1>Coates &nbsp;|&nbsp; Ampol Tool Store</h1>
<div class="sub">{esc(subtitle)}</div>
<div class="meta">Generated {esc(GENERATED)} &nbsp;|&nbsp; The Coates Way &nbsp;|&nbsp; POWERED BY SITEIQ &nbsp;|&nbsp; Author: Andrew Fisher</div></div>
<div class="wrap">{body}
<h2>Our Standard</h2>
<p class="story">{esc(LSR_LINE)} Every issue and every return runs through the double scan
&mdash; {esc(canon)} Daily stocktakes keep eyes on the fleet: nothing in the store goes
over 30 days without being scanned, and anything damaged is tagged Out of Service on the
spot. We are here to help &mdash; if gear is finished with, hand it back to the tool store
and it comes off your list the same day.</p>
<h2>Honest Limits</h2>
<ul style="font-size:11px;color:{GREY};line-height:1.7;">{lim}</ul>
</div>
<div class="footer">Coates Hire Operations Pty Limited | ABN 50 009 779 338 | www.coates.com.au |
POWERED BY SITEIQ | Care Deeply &middot; Customer Focused &middot; Be Our Best &middot; One Team &middot; Competitive Spirit</div>
</body></html>"""


def tiles(pairs):
    return ('<div class="tiles">' +
            "".join(f'<div class="tile"><div class="v">{esc(v)}</div>'
                    f'<div class="l">{esc(l)}</div></div>' for v, l in pairs) +
            "</div>")


def table(headers, rows):
    h = "".join("<th>" + esc(x) + "</th>" for x in headers)
    b = "".join("<tr>" + "".join("<td>" + (c if str(c).startswith("<span") else esc(c)) +
                                 "</td>" for c in r) + "</tr>" for r in rows)
    return f"<table><tr>{h}</tr>{b}</table>"


def item_rows(items, with_company=False, limit=None):
    out = []
    for r in items[:limit] if limit else items:
        row = []
        if with_company:
            row.append(display_company(r["company"]) or "-")
        row += [r["hirer"] or "-", r["barcode"], r["desc"],
                r["date"].strftime("%d/%m/%Y") if r["date"] else "-",
                money(r["cost"]) if r["cost"] is not None else "-"]
        out.append(row)
    return out


def render_quarter(d, qk):
    m = quarter_model(d, qk)
    story = (f"This is the {esc(m['label'])} on-hire position for the Ampol tool store. "
             f"Gear on hire in this window that has not come home is billable at "
             f"replacement cost at quarter close, and gear no longer needed is removed "
             f"from hire at the same point &mdash; so this list is the one to walk before "
             f"the quarter ticks over. Everything here is easy to fix: bring it back to "
             f"the counter, it is double-scanned off your name in seconds, and it "
             f"disappears from this report the same day. We are not chasing blame "
             f"&mdash; we are helping everyone finish the quarter clean.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(len(m["rows"]), "Items on hire"), (m["companies"], "Companies"),
                   (money(m["total_val"]), "Replacement value"),
                   (m["priced"], "Items priced")])
    for co, items in m["by_co"].items():
        val = sum(r["cost"] or 0 for r in items)
        body += (f'<div class="cochip">{esc(co)} &mdash; {len(items)} item'
                 f'{"s" if len(items) != 1 else ""} | {money(val)}</div>')
        body += table(["Hirer", "Barcode", "Description", "On Hire Since", "Replacement"],
                      item_rows(sorted(items, key=lambda r: (r["date"] or TODAY))))
    limits = ["Counts come from the workbook quarter tabs (SiteIQ RENTAL_STOCK refresh "
              + d["wb_mtime"].strftime("%d/%m/%Y %I:%M %p") + "). Radios, gas monitors "
              "and Drager equipment are excluded - they are reported separately.",
              "Unpriced items show a dash and are excluded from value totals - never "
              "guessed."]
    return ("Quarterly On-Hire Report - " + m["label"],
            f"Quarterly On-Hire &amp; Recovery | {esc(m['label'])} | "
            f"{len(m['rows'])} items | {money(m['total_val'])}",
            page("Ampol Tooling - " + m["label"], "Quarterly On-Hire Report - "
                 + m["label"], body, limits),
            f"Ampol Tool Store - Quarterly On-Hire Report - {m['label']} - "
            f"{len(m['rows'])} items")


def render_company(d, name):
    m = company_model(d, name)
    sd = pct(m["same_day_pct"]) if m["same_day_pct"] is not None else "-"
    story = (f"Thanks for working with the Coates tool store &mdash; here is exactly "
             f"where things stand for <b>{esc(m['name'])}</b>. Your crews have run "
             f"{m['tx_ytd']:,} tool store transactions this year, and "
             f"{m['same_day']:,} of those came back the same day ({sd}) &mdash; that "
             f"is the habit that keeps gear available for everyone. Right now "
             f"{len(m['items'])} items are on hire to your team. Anything not needed: "
             f"hand it in, and it is off your list the same day. If it IS needed, "
             f"perfect &mdash; this list is simply your record of where it all is.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(len(m["items"]), "Items on hire"),
                   (money(m["total_val"]), "Replacement value"),
                   (m["tx_ytd"], "Transactions YTD"), (sd, "Same-day returns"),
                   (len(m["people"]), "People using store")])
    qbits = " &nbsp;|&nbsp; ".join(f"{QUARTERS[qk][1]}: <b>{len(m['per_q'][qk])}</b>"
                                   for qk in QUARTERS)
    body += f"<p class='story'>On hire by quarter: {qbits}</p>"
    if m["items"]:
        body += "<h2>On Hire Now (oldest first)</h2>"
        body += table(["Hirer", "Barcode", "Description", "On Hire Since", "Replacement"],
                      item_rows(m["items"]))
    if m["high_val"]:
        body += "<h2>High-Value Items In Your Care</h2>"
        body += ("<p class='story'>These carry the highest replacement cost - worth a "
                 "quick check they are secure and still needed.</p>")
        body += table(["Hirer", "Barcode", "Description", "On Hire Since", "Replacement"],
                      item_rows(m["high_val"]))
    if m["compliance"]:
        body += "<h2>Electrical / Rigging / High-Torque In Your Care</h2>"
        body += ("<p class='story'>Test and tag gear: if it has been out a while, swing "
                 "it past the counter for a quick check - we will make sure the tags are "
                 "current and hand it straight back if you still need it.</p>")
        body += table(["Hirer", "Barcode", "Description", "On Hire Since", "Replacement"],
                      item_rows(m["compliance"]))
    limits = ["On-hire lines from the workbook Master Onhire tab; transactions from the "
              "SiteIQ CUSTOMER_CONTRACTOR_EQUIP export (year to date).",
              "Replacement costs shown are for awareness only - unpriced items show a "
              "dash and are never estimated."]
    return ("Company On-Hire Report - " + m["name"],
            f"Company On-Hire Report | {esc(m['name'])} | {len(m['items'])} items",
            page("Ampol Tooling - " + m["name"], "Company On-Hire Report - "
                 + m["name"], body, limits),
            f"Ampol Tool Store - {m['name']} - On-Hire Report - "
            f"{len(m['items'])} items")


def render_util(d):
    um = util_model(d)
    buy_spend = sum((r["buy"] or 0) for r in um["buy"])
    story = ("Utilisation is measured two ways: <b>live</b> (what share of a group is on "
             "hire right now) and <b>year-to-date</b> (actual hire days against days "
             "available). Groups running hot are where crews wait for gear; groups "
             "running cold are capital sitting still. The buy list below is evidence-"
             "based - every line shows the demand that justifies it.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(len(um["rows"]), "Equipment groups"), (len(um["buy"]), "Buy signals"),
                   (money(buy_spend), "Est. buy spend (1 ea)"),
                   (len(um["overstock"]), "Right-size candidates")])
    body += "<h2>What To Buy - Demand-Backed</h2>"
    rows = []
    for r in um["buy"]:
        rows.append([r["group"], int(r["qty"]), int(r["on_hire"]), int(r["avail"]),
                     pct(r["live"]), pct(r["ytd"]), int(r["hirers"]), int(r["days"]),
                     money(r["buy"]) if r["buy"] else "-", r["source"] or "-", r["rec"]])
    body += table(["Equipment Group", "Qty", "On Hire", "Avail", "Live %", "YTD %",
                   "Hirers", "Hire Days", "Buy Price", "Source", "Recommendation"], rows)
    body += "<h2>Working Hardest (by hire days)</h2>"
    body += table(["Equipment Group", "Qty", "Live %", "YTD %", "Hire Days", "Hirers"],
                  [[r["group"], int(r["qty"]), pct(r["live"]), pct(r["ytd"]),
                    int(r["days"]), int(r["hirers"])] for r in um["top_used"]])
    body += "<h2>Potential Overstock - Right-Size Candidates</h2>"
    body += table(["Equipment Group", "Qty", "On Hire", "Avail", "YTD %"],
                  [[r["group"], int(r["qty"]), int(r["on_hire"]), int(r["avail"]),
                    pct(r["ytd"])] for r in um["overstock"][:40]])
    limits = ["Utilisation comes from the workbook Tooling Utilisation engine: SiteIQ "
              "transactions + current stock, grouped by corrected descriptions "
              "(items without a mapping are not yet included - the mapping now covers "
              "3,415 barcodes and grows as descriptions are corrected).",
              "Buy prices are catalogue averages from Ampol ToolStore Pricing; groups "
              "without a price show a dash."]
    return ("Utilisation & What To Buy",
            f"Utilisation &amp; What-To-Buy | {len(um['buy'])} buy signals",
            page("Ampol Tooling - Utilisation", "Utilisation & What-To-Buy Report",
                 body, limits),
            f"Ampol Tool Store - Utilisation & What-To-Buy - "
            f"{len(um['buy'])} buy signals")


def render_compliance(d):
    cm = compliance_model(d)
    story = ("Electrical, rigging and high-torque gear carries test and inspection "
             "dates. Anything in those families that has not been through our hands "
             f"in {NOT_SIGHTED_DAYS} days is potentially out of test date - not a "
             "problem, just a reason for a five-minute visit to the counter. We check "
             "the tags, and if it is current it goes straight back with you. That is "
             "us doing the compliance work so your crews do not have to think about it.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(len(cm["chase"]), "Not seen 3+ months"),
                   (len(cm["out_of_tag"]), "Caught & parked (out of tag)"),
                   (len(cm["high_val"]), "High-value items out"),
                   (money(sum(r['cost'] or 0 for r in cm['high_val'])),
                    "High-value exposure")])
    for cat in ("Electrical", "Rigging", "High Torque"):
        items = cm["by_cat"].get(cat, [])
        if not items:
            continue
        body += f"<h2>{esc(cat)} - Not Sighted In {NOT_SIGHTED_DAYS}+ Days</h2>"
        rows = []
        for r in items:
            rows.append([display_company(r["company"]) or "-", r["hirer"] or "-",
                         r["barcode"], r["desc"],
                         r["seen"].strftime("%d/%m/%Y") if r["seen"] else "Never sighted",
                         money(r["cost"]) if r["cost"] is not None else "-"])
        body += table(["Company", "Hirer", "Barcode", "Description", "Last Sighted",
                       "Replacement"], rows)
    if cm["out_of_tag"]:
        body += "<h2>Already Caught - Parked Out Of Tag (our checks working)</h2>"
        body += ("<p class='story'>These items were caught by our checks and parked "
                 "under 'Rigging &amp; 240V - Out Of Tag Date' so they cannot be "
                 "issued. Nothing goes on the shelf unless it is ready for hire.</p>")
        body += table(["Barcode", "Description", "Status"],
                      [[r["barcode"], r["desc"], r["status"] or "-"]
                       for r in cm["out_of_tag"]])
    body += "<h2>High-Value Items On Hire</h2>"
    body += table(["Company", "Hirer", "Barcode", "Description", "On Hire Since",
                   "Replacement"], item_rows(cm["high_val"], with_company=True, limit=40))
    if cm["trend"]:
        body += "<h2>Tool Store Activity By Month (transactions)</h2>"
        body += table(["Month", "Transactions"],
                      [[m, f"{n:,}"] for m, n in cm["trend"]])
    limits = [f"'Not sighted' uses the SiteIQ STOCKTAKE export (last sighted date per "
              f"barcode). An item on hire cannot be sighted in store - which is exactly "
              f"the point: {NOT_SIGHTED_DAYS}+ days out means we have not had hands on "
              f"it to verify tags.",
              "Category matching is by description keywords (electrical / rigging / "
              "high torque) - anything misfiled, tell us and we correct the mapping.",
              "High-value = replacement cost " + money(HIGH_VALUE) + " or more."]
    return ("Compliance & Trends",
            f"Compliance &amp; Trends | {len(cm['chase'])} to sight | "
            f"{len(cm['out_of_tag'])} caught",
            page("Ampol Tooling - Compliance", "Compliance & Trends Report", body,
                 limits),
            f"Ampol Tool Store - Compliance & Trends - {len(cm['chase'])} items to "
            f"sight")


def render_exec(d):
    x = exec_model(d)
    sd = pct(x["same_day_pct"]) if x["same_day_pct"] is not None else "-"
    story = (f"The Ampol tool store is running the Coates Way. {x['on_hire']:,} items "
             f"are on hire across {len(x['companies'])} companies with "
             f"{money(x['total_val'])} of replacement value in the field, "
             f"{x['available']:,} items ready on the shelf and {x['repairs']:,} in the "
             f"repair loop (tagged, tracked, never reissued until right). Crews have "
             f"run {x['tx_ytd']:,} transactions this year and {sd} came back same-day "
             f"&mdash; the double scan working exactly as designed. The quarterly "
             f"recovery cycle keeps the fleet honest: gear not returned by quarter "
             f"close is billable at replacement cost, and this report gives every "
             f"company the list to beat before that happens.")
    body = f"<p class='story'>{story}</p>"
    body += tiles([(f"{x['on_hire']:,}", "On hire"), (money(x["total_val"]), "Value out"),
                   (f"{x['available']:,}", "Available"), (x["repairs"], "In repair"),
                   (f"{x['tx_ytd']:,}", "Transactions YTD"), (sd, "Same-day returns")])
    body += "<h2>On Hire By Quarter Started</h2>"
    body += table(["Quarter", "Items Still On Hire"],
                  [[QUARTERS[qk][1], x["qcounts"][qk]] for qk in QUARTERS])
    real = [r for r in x["recovery"]
            if clean(r.get("COMPANY_NAME"))
            and not clean(r.get("COMPANY_NAME")).upper().startswith("TOTAL")]
    if real:
        body += "<h2>Quarterly Recovery Summary (by company)</h2>"
        hdrs = list(real[0].keys())
        rows = []
        for r in sorted(real, key=lambda r: clean(r.get("COMPANY_NAME"))):
            row = []
            for h in hdrs:
                v = r.get(h)
                if h.lower().find("value") >= 0 and num(v) is not None:
                    row.append(money(v))
                elif h == "COMPANY_NAME":
                    row.append(display_company(v))
                else:
                    row.append(v if v is not None else "-")
            rows.append(row)
        totals = []
        for h in hdrs:
            if h == "COMPANY_NAME":
                totals.append("TOTAL")
            else:
                vals = [num(r.get(h)) for r in real]
                s = sum(v for v in vals if v is not None)
                totals.append(money(s) if h.lower().find("value") >= 0
                              else (int(s) if s == int(s) else s))
        rows.append(totals)
        body += table([h.replace("_", " ").title() for h in hdrs], rows)
    body += "<h2>Signals</h2>"
    body += tiles([(x["buy_n"], "Buy signals (demand-backed)"),
                   (x["overstock_n"], "Right-size candidates"),
                   (x["chase_n"], "Test-date sightings due"),
                   (x["out_of_tag_n"], "Caught & parked out-of-tag"),
                   (money(x["high_val_sum"]), "High-value exposure")])
    body += ("<p class='story'>Detail sits in the companion reports: Quarterly "
             "On-Hire, Utilisation &amp; What-To-Buy, and Compliance &amp; Trends "
             "&mdash; each one client-ready, each one emailable from this kit.</p>")
    limits = ["Figures are counted from the refreshed workbook tables and SiteIQ "
              "exports beside this report - never from hardcoded summary cells.",
              "Unpriced items are excluded from value totals."]
    return ("Executive Summary",
            f"Executive Summary | {x['on_hire']:,} on hire | {money(x['total_val'])}",
            page("Ampol Tooling - Executive Summary", "Executive Summary", body,
                 limits),
            f"Ampol Tool Store - Executive Summary - {x['on_hire']:,} items on hire")


# ------------------------------------------------------------------ email ---
def email_html(subtitle, inner_note, html_doc):
    """Outlook-safe like-for-like body: reuse the report body inside a bordered
    680px card. We inline the full report HTML converted to nested-table-safe
    markup by keeping our simple structure (tables + divs render acceptably in
    Outlook's Word engine because all styling is inline-safe)."""
    # extract body content between wrap div and footer
    m = re.search(r"<div class=\"wrap\">(.*)</div>\n<div class=\"footer\">", html_doc,
                  re.S)
    inner = m.group(1) if m else html_doc
    # convert class-styled elements to inline styles for Outlook
    inner = inner.replace('<div class="tiles">',
                          '<div style="margin:12px 0;">')
    inner = inner.replace('<div class="tile">',
                          '<div style="display:inline-block;border:1px solid #e0dad2;'
                          'border-bottom:3px solid ' + ORANGE + ';padding:10px 14px;'
                          'margin:0 6px 6px 0;">')
    inner = inner.replace('<div class="v">',
                          '<div style="font-size:20px;font-weight:800;color:'
                          + ORANGE + ';">')
    inner = inner.replace('<div class="l">',
                          '<div style="font-size:9px;color:' + GREY +
                          ';text-transform:uppercase;letter-spacing:1px;">')
    inner = inner.replace('<p class=\'story\'>',
                          '<p style="font-size:12px;line-height:1.7;color:' + DARK +
                          ';">').replace('<p class="story">',
                          '<p style="font-size:12px;line-height:1.7;color:' + DARK +
                          ';">')
    inner = inner.replace('<h2>', '<h2 style="font-size:13px;border-left:5px solid '
                          + ORANGE + ';padding-left:9px;text-transform:uppercase;'
                          'letter-spacing:1px;color:' + DARK + ';margin:22px 0 8px 0;">')
    inner = inner.replace('<table>', '<table cellspacing="0" cellpadding="0" '
                          'width="100%" style="border-collapse:collapse;font-size:10px;'
                          'margin:8px 0;">')
    inner = inner.replace('<th>', '<th style="background:' + DARK + ';color:#fff;'
                          'text-align:left;padding:5px 7px;font-size:9px;'
                          'text-transform:uppercase;">')
    inner = inner.replace('<td>', '<td style="padding:4px 7px;border-bottom:1px solid '
                          '#e5e0da;font-size:10px;color:' + DARK + ';">')
    inner = inner.replace('<div class="cochip">',
                          '<div style="background:' + DARK + ';color:#fff;padding:4px '
                          '10px;font-size:11px;font-weight:700;display:inline-block;'
                          'margin-top:12px;">')
    inner = inner.replace('<ul style=', '<ul style=')
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
 style="background:#EFECE7;"><tr><td align="center" style="padding:18px 8px;">
<table role="presentation" width="680" cellspacing="0" cellpadding="0"
 style="width:680px;max-width:680px;background:#ffffff;border:2px solid {DARK};
 border-collapse:collapse;">
<tr><td style="background:{DARK};padding:20px 26px;">
  <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:#fff;">Coates &nbsp;|&nbsp; Ampol Tool Store</div>
  <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:{ORANGE};margin-top:5px;">{subtitle}</div>
  <div style="font-family:Arial,sans-serif;font-size:10px;color:#bbbbbb;margin-top:6px;">Generated {esc(GENERATED)} &nbsp;|&nbsp; The Coates Way &nbsp;|&nbsp; POWERED BY SITEIQ &nbsp;|&nbsp; Author: Andrew Fisher</div>
</td></tr>
<tr><td style="padding:18px 26px;font-family:Arial,sans-serif;">
  <p style="font-size:11px;color:{GREY};margin:0 0 10px 0;">{inner_note}</p>
  {inner}
</td></tr>
<tr><td style="background:{LIGHT};border-top:3px solid {ORANGE};padding:12px 26px;
 font-family:Arial,sans-serif;font-size:9px;color:{GREY};line-height:1.7;">
 Coates Hire Operations Pty Limited | ABN 50 009 779 338 | www.coates.com.au |
 POWERED BY SITEIQ<br/>Care Deeply &middot; Customer Focused &middot; Be Our Best &middot;
 One Team &middot; Competitive Spirit</td></tr>
</table></td></tr></table>"""


def edge_pdf(html_path, pdf_path):
    import time
    base_profile = os.path.join(os.environ.get("TEMP", HERE), "coates_edge_pdf")
    edge_pdf._n = getattr(edge_pdf, "_n", 0) + 1
    for edge in (r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                 r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"):
        if not os.path.exists(edge):
            continue
        for attempt in range(3):
            profile = f"{base_profile}_{os.getpid()}_{edge_pdf._n}_{attempt}"
            try:
                subprocess.run([edge, "--headless", "--disable-gpu",
                                "--user-data-dir=" + profile,
                                "--no-first-run", "--no-pdf-header-footer",
                                "--print-to-pdf=" + pdf_path,
                                "file:///" + html_path.replace("\\", "/")],
                               timeout=120, capture_output=True)
            except Exception:
                pass
            if os.path.exists(pdf_path):
                return True
            time.sleep(1.5)
        return False
    return False


def write_outputs(stem, title, subtitle, html_doc, subject):
    os.makedirs(OUT_DIR, exist_ok=True)
    base = os.path.join(OUT_DIR, f"{stem}_{DATESTR}")
    html_path = base + ".html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_doc)
    pdf_path = base + ".pdf"
    pdf_ok = edge_pdf(html_path, pdf_path)
    note = ("The full report PDF is attached. This email is the same report, "
            "formatted for reading in place.")
    body = email_html(subtitle, note, html_doc)
    with open(base + ".body.html", "w", encoding="utf-8") as f:
        f.write(body)
    attach = [os.path.basename(pdf_path) if pdf_ok else os.path.basename(html_path)]
    with open(base + ".draft.json", "w", encoding="utf-8") as f:
        json.dump({"subject": subject, "body": os.path.basename(base + ".body.html"),
                   "attachments": attach}, f, indent=1)
    print(f"  {title}: HTML" + (" + PDF" if pdf_ok else " (PDF skipped)")
          + " + email draft manifest")
    return base


# ------------------------------------------------------------------- main ---
INTERNAL_CUSTODY = {"REPAIRS"}   # internal custody rows, never a client report


def company_list(d):
    names = sorted({display_company(master_row(r)["company"]) for r in d["master"]
                    if clean(r.get("COMPANY_NAME"))})
    return [n for n in names if n and n.upper() not in INTERNAL_CUSTODY]


def run_quarter(d, qk):
    title, subtitle, doc, subject = render_quarter(d, qk)
    write_outputs("Quarterly_OnHire_" + qk, title, subtitle, doc, subject)


def run_company(d, name):
    title, subtitle, doc, subject = render_company(d, name)
    stem = "Company_" + re.sub(r"[^\w]+", "_", name)[:40]
    write_outputs(stem, title, subtitle, doc, subject)


def run_util(d):
    title, subtitle, doc, subject = render_util(d)
    write_outputs("Utilisation_WhatToBuy", title, subtitle, doc, subject)


def run_compliance(d):
    title, subtitle, doc, subject = render_compliance(d)
    write_outputs("Compliance_Trends", title, subtitle, doc, subject)


def run_exec(d):
    title, subtitle, doc, subject = render_exec(d)
    write_outputs("Executive_Summary", title, subtitle, doc, subject)


def main():
    print("=" * 68)
    print("COATES | AMPOL TOOL STORE REPORT KIT | The Coates Way")
    print("=" * 68)
    d = load_all()
    print(f"Workbook refreshed  : {d['wb_mtime'].strftime('%d/%m/%Y %I:%M %p')}")
    print(f"Master on hire      : {len(d['master']):,}")
    print(f"Transactions YTD    : {len(d['tx']):,}")
    print(f"Stocktake barcodes  : {len(d['stocktake']):,}")
    print(f"Priced descriptions : {len(d['pricing']):,}")

    args = [a for a in sys.argv[1:]]
    if args:
        if "--exec" in args:
            run_exec(d)
        if "--quarter" in args:
            qv = args[args.index("--quarter") + 1].upper()
            for q in ([k for k in QUARTERS] + ["YEAR"] if qv == "ALL" else [qv]):
                run_quarter(d, q)
        if "--utilisation" in args or "--util" in args:
            run_util(d)
        if "--compliance" in args:
            run_compliance(d)
        if "--company" in args:
            run_company(d, args[args.index("--company") + 1])
        if "--all" in args:
            for n in company_list(d):
                run_company(d, n)
        if "--everything" in args:
            run_exec(d)
            for q in list(QUARTERS) + ["YEAR"]:
                run_quarter(d, q)
            run_util(d)
            run_compliance(d)
            for n in company_list(d):
                run_company(d, n)
        print("\nDone. Run MAKE_OUTLOOK_DRAFTS.bat to load these into Outlook Drafts.")
        return

    companies = company_list(d)
    while True:
        print("\n--- REPORT MENU -------------------------------------------")
        print("  E = Executive Summary          U = Utilisation & What-To-Buy")
        print("  T = Compliance & Trends        Y = Year on-hire report")
        print("  1 = Q1 (Jan-Mar)   2 = Q2 (Apr-Jun)   3 = Q3 (Jul-Sep)   4 = Q4 (Oct-Dec)")
        print("  A = every company report       X = everything")
        print("  Or pick a company:")
        for i, n in enumerate(companies, 1):
            print(f"   C{i:<3} {n}")
        print("  Q = quit")
        choice = input("> ").strip().upper()
        if choice == "Q":
            break
        elif choice == "E":
            run_exec(d)
        elif choice == "U":
            run_util(d)
        elif choice == "T":
            run_compliance(d)
        elif choice == "Y":
            run_quarter(d, "YEAR")
        elif choice in ("1", "2", "3", "4"):
            run_quarter(d, "Q" + choice)
        elif choice == "A":
            for n in companies:
                run_company(d, n)
        elif choice == "X":
            run_exec(d)
            for q in list(QUARTERS) + ["YEAR"]:
                run_quarter(d, q)
            run_util(d)
            run_compliance(d)
            for n in companies:
                run_company(d, n)
        elif choice.startswith("C") and choice[1:].isdigit() \
                and 1 <= int(choice[1:]) <= len(companies):
            run_company(d, companies[int(choice[1:]) - 1])
        else:
            print("  (not recognised)")
        print("\nOutputs in Output_Tooling_Reports. MAKE_OUTLOOK_DRAFTS.bat loads the")
        print("emails into Outlook Drafts - full To search, attachments included.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        print(e)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("\nERROR:", e)
