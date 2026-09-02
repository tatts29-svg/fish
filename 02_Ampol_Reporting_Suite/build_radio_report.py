#!/usr/bin/env python3
"""
Coates Ampol Site Radio On-Hire Report - The Coates Way
Author: Andrew Fisher / POWERED BY SITEIQ

- Current year in full detail (radios + batteries, companies A-Z, serials
  joined from the radio register, STORAGE_UNIT from the master RENTAL_STOCK file)
- Prior years summarised by year and company - the value story
- At-a-glance charts: fleet position, value by company, age of hire
- Verification message: return radios not in use; if still in use, bring
  them to the Ampol Tool Store for a rescan (proof of existence)
- PDF via WeasyPrint or Edge/Chrome headless fallback

WHERE THE NUMBERS COME FROM (changed 02 Sep 2026)
  Every count, date and dollar is read from the SiteIQ RENTAL_STOCK export
  in Data\\ - the live register of what is on hire, to whom, since when,
  and what is on the shelf - as at the export's own request time. The
  Ampol_Radio_Report.xlsm workbook is no longer read: its Power-Query tabs
  only refresh when the file is opened in Excel, and an audit on 02 Sep
  2026 found them 19 days behind the register (every count and every
  "days on hire" figure stale, returned units still listed, one unit in
  Out-of-Service custody counted as on hire to a company).
  Serial numbers come from radio_register.xlsx and, failing that, from
  the serial SiteIQ carries in the item description. Replacement values
  come from Ampol_ToolStore_Pricing.xlsx ("Avg Buy Price (New)").

Inputs come from the suite's one Data area (see ampol_paths):
RENTAL_STOCK*.xlsx (required), radio_register*.xlsx, *Pricing*.xlsx.
Output lands in Reports\\<today>\\Radios\\ - dated, never overwritten.
"""
import re
import sys
from pathlib import Path
from datetime import datetime, date
from collections import defaultdict
import openpyxl
import ampol_paths  # WHY (12 Aug 2026): one Data area in, dated Reports folder out
import gasmon_engine as ge  # one company / person normaliser across the suite

BASE = Path(__file__).resolve().parent
REPORT_DATE = date.today()
CUR_YEAR = REPORT_DATE.year
# WHY (12 Aug 2026): PRIOR_LABEL was computed and never used while the headings
# carried hard-coded years - come January the report would have quietly lied.
# Every heading now derives from these two.
PRIOR_LABEL = f"2023–{CUR_YEAR - 1}"      # reset from the data in main()
PRIOR_SHORT = f"2023-{str(CUR_YEAR - 1)[2:]}"
# The unit prices are READ from the pricing file in main(); these are only
# the fallback if that file is missing, and the page says which was used.
PRICE_RADIO = None
PRICE_BATT = None
PRICE_SOURCE = "TBC"
META = {}
# WHY (12 Aug 2026): named constant so the en dash never sits as a backslash
# escape inside an f-string expression - older Pythons refuse that outright.
EN_DASH = "–"

COATES_PURPOSE = "Supporting Australia's growth with leading equipment solutions"
COATES_OBJECTIVE = "Australia's most trusted equipment partner \u2014 delivering Best Service & Value"
COATES_VALUES = "Care Deeply &nbsp;\u2022&nbsp; Customer Focused &nbsp;\u2022&nbsp; Be Our Best &nbsp;\u2022&nbsp; One Team &nbsp;\u2022&nbsp; Competitive Spirit"

def money(v):
    try: return f"${float(v):,.0f}"
    except (TypeError, ValueError): return "\u2014"

def esc(s):
    """Company names land inside SVG text - keep the markup honest."""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

RADIO_RE = re.compile(r"motorola radio", re.I)
BATT_RE = re.compile(r"radio batter", re.I)
ACCESSORY_RE = re.compile(r"charger", re.I)
SERIAL_IN_DESC = re.compile(r"\b(\d{3}[A-Za-z]{3}\d{4})\b")


def radio_kind(desc):
    """'radio' / 'battery' / None. Chargers are accessories, not fleet."""
    d = str(desc or "")
    if ACCESSORY_RE.search(d):
        return None
    if BATT_RE.search(d):
        return "battery"
    if RADIO_RE.search(d):
        return "radio"
    return None


def hirer_kind(hirer):
    """'oos' = the Out-of-Service custody line; 'account' = a shared site
    account (after-hours, a shutdown account) that is not a person;
    'person' otherwise. Accounts are shown on their own lines, never as
    a person."""
    h = str(hirer or "")
    if re.search(r"out\s*of\s*service", h, re.I):
        return "oos"
    if re.search(r"after\s*hours|tool\s*store|shutdown\s*-\s*20\d\d|\(sfi\)|^alky", h, re.I):
        return "account"
    return "person"


def load_serials(register_path):
    """barcode -> serial from radio_register.xlsx. A blank serial cell is
    left out so the row falls through to the description or a dash."""
    wb = openpyxl.load_workbook(register_path, data_only=True, read_only=True)
    ws = wb["Radio Register"]
    out = {str(r[0]).strip().upper(): str(r[1]).strip()
           for r in ws.iter_rows(min_row=2, values_only=True)
           if r and r[0] and r[1] is not None and str(r[1]).strip()}
    wb.close()
    return out


def _norm_desc(d):
    return re.sub(r"\s+", " ", str(d or "").replace("\xa0", " ")).strip().upper()


def load_prices(pricing_path):
    """Normalised description -> 'Avg Buy Price (New)' from the pricing
    master, plus the generic radio and battery prices for descriptions
    that carry a serial suffix."""
    prices = {}
    if not pricing_path:
        return prices, None, None
    wb = openpyxl.load_workbook(pricing_path, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r and r[0] and r[1] not in (None, ""):
            try:
                prices.setdefault(_norm_desc(r[0]), float(r[1]))
            except (TypeError, ValueError):
                pass
    wb.close()
    radio = prices.get("AMPOL MOTOROLA RADIO")
    batt = prices.get("AMPOL MOTOROLA RADIO BATTERY")
    return prices, radio, batt


def price_for(desc, kind, prices):
    p = prices.get(_norm_desc(desc))
    if p is None:
        p = PRICE_RADIO if kind == "radio" else PRICE_BATT
    return p


def company_name(raw):
    """One company, one name: Ampol / Ampol Refineries (Qld) / Caltex are
    the client; employer suffixes (FCCU, SATGAS/MOL) fold into the company."""
    u = str(raw or "").strip().upper()
    if u.startswith("CALTEX"):
        return "Ampol"
    return ge.norm_company(raw)


def load_from_register(master_path, serials, prices):
    """Every radio and battery on the live register, classified.

    Returns dict with r_cur, r_prev, b_cur, b_prev (on hire, by issue
    year), oos (Out-of-Service custody), r_avail, b_avail, asat (export
    request time), and coverage counts for the page notes."""
    wb = openpyxl.load_workbook(master_path, data_only=True, read_only=True)
    asat = None
    if "REFERENCE_INFO" in wb.sheetnames:
        rows = list(wb["REFERENCE_INFO"].iter_rows(values_only=True))
        if len(rows) > 1:
            for i, h in enumerate(rows[0]):
                if h and "REQUESTED_DATE" in str(h).upper():
                    asat = ge.parse_stamp(rows[1][i])
    if asat is None:
        asat = datetime.fromtimestamp(Path(master_path).stat().st_mtime)
    ws = wb["RENTAL_STOCK"]
    hdr = [str(c or "").strip().upper() for c in next(ws.iter_rows(min_row=1, max_row=1, values_only=True))]
    col = {h: i for i, h in enumerate(hdr)}

    def g(r, name):
        i = col.get(name)
        return r[i] if i is not None and i < len(r) else None

    out = {"r_cur": [], "r_prev": [], "b_cur": [], "b_prev": [], "oos": [],
           "r_avail": [], "b_avail": [], "asat": asat,
           "n_radio": 0, "n_batt": 0, "serial_hits": 0, "serial_total": 0,
           "unpriced": 0, "years": set(), "accounts": 0, "turnaround": 0}
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r or r[0] is None:
            continue
        desc = g(r, "ITEM_DESCRIPTION")
        kind = radio_kind(desc)
        if not kind:
            continue
        out["n_radio" if kind == "radio" else "n_batt"] += 1
        bc = str(g(r, "ITEM_BARCODE") or "").strip()
        if bc.upper().startswith("SATGAS"):
            out["turnaround"] += 1
        status = str(g(r, "ITEM_STATUS") or "").strip()
        on = ge.parse_dt(g(r, "ON_HIRE_DATE"), g(r, "ON_HIRE_TIME"))
        serial = serials.get(bc.upper(), "")
        if not serial:
            mm = SERIAL_IN_DESC.search(str(desc or ""))
            serial = mm.group(1).upper() if mm else ""
        cost = price_for(desc, kind, prices)
        if cost is None:
            out["unpriced"] += 1
        hk = hirer_kind(g(r, "HIRER_NAME"))
        raw_h = str(g(r, "HIRER_NAME") or "").strip()
        hirer = raw_h if hk != "person" else ge.norm_person(raw_h)[1]
        if hk == "account":
            hirer = f"{raw_h} (site account)"
            out["accounts"] += 1
        item = {"company": company_name(g(r, "COMPANY_NAME")), "hirer": hirer,
                "barcode": bc, "serial": serial or "\u2014", "kind": kind,
                "year": str(on.year) if on else "", "desc": str(desc or "").strip(),
                "days": (asat.date() - on.date()).days if on else 0,
                "cost": cost, "date": on.date() if on else None,
                "time": on.strftime("%H:%M") if on else "",
                "unit": str(g(r, "STORAGE_UNIT") or "").strip() or "\u2014"}
        if status.lower() != "on hire":
            out["r_avail" if kind == "radio" else "b_avail"].append(item)
            continue
        out["serial_total"] += 1 if kind == "radio" else 0
        out["serial_hits"] += 1 if (kind == "radio" and serial) else 0
        if hk == "oos":
            out["oos"].append(item)
            continue
        if on:
            out["years"].add(on.year)
        cur = bool(on) and on.year == CUR_YEAR
        key = ("r_" if kind == "radio" else "b_") + ("cur" if cur else "prev")
        out[key].append(item)
    wb.close()
    return out


def val(rs): return sum(x["cost"] for x in rs if x["cost"])

def svg_hbars(rows, width=700, label_w=180, val_w=130, bar_h=14, gap=5):
    """Inline-SVG horizontal bars - self-contained, print-safe, house colours.

    WHY (12 Aug 2026): the report carried its whole story in tables; these
    small charts put the position on one page without touching the tables.
    rows = (label, number, display text, colour). A zero draws a grey hairline
    so the category still shows - nothing is hidden.
    """
    mx = max((r[1] for r in rows), default=0) or 1
    span = width - label_w - val_w - 10
    h = len(rows) * (bar_h + gap) + 2
    p = [f'<svg width="{width}" height="{h}" viewBox="0 0 {width} {h}" '
         f'xmlns="http://www.w3.org/2000/svg" style="font-family:Calibri,Arial,sans-serif">']
    y = 1
    for label, num, txt, colour in rows:
        w = max(round(span * (num / mx)), 2) if num else 2
        fill = colour if num else "#cccccc"
        ty = y + bar_h - 4
        p.append(f'<text x="{label_w - 6}" y="{ty}" text-anchor="end" font-size="10" fill="#333">{esc(label)}</text>')
        p.append(f'<rect x="{label_w}" y="{y}" width="{w}" height="{bar_h}" fill="{fill}"/>')
        p.append(f'<text x="{label_w + w + 5}" y="{ty}" font-size="10" font-weight="bold" fill="#1a1a1a">{esc(txt)}</text>')
        y += bar_h + gap
    p.append("</svg>")
    return "".join(p)

def detail_rows(items, serial_col=True):
    """Company blocks A-Z, items longest-held first, on house tables whose
    header row repeats on every printed page."""
    import k2flow as kf
    from k2shell import esc, num
    by_comp = defaultdict(list)
    for i in items:
        by_comp[i["company"]].append(i)
    parts = []
    hdr = (["Barcode", "Serial", "Price", "Hirer", "On hire since", "Days", "Storage unit"] if serial_col
           else ["Barcode", "Price", "Hirer", "On hire since", "Days", "Storage unit"])
    al = (["", "", "r", "", "", "r", ""] if serial_col else ["", "r", "", "", "r", ""])
    for comp in sorted(by_comp, key=str.upper):
        rows = sorted(by_comp[comp], key=lambda i: (-i["days"], i["barcode"]))
        cval = val(rows)
        trs = []
        for i in rows:
            d_txt = i["date"].strftime("%d %b %Y") if i["date"] else "-"
            if i["time"]:
                d_txt += f" {i['time']}"
            days = (f'<span class="rd">{i["days"]}</span>' if i["days"] >= 30 else str(i["days"]))
            r = [esc(i["barcode"]),
                 *([esc(i["serial"] or "-")] if serial_col else []),
                 money(i["cost"]), esc(i["hirer"]), d_txt, days, esc(i["unit"])]
            trs.append(r)
        head = (f'<div class="sub-h">{esc(comp)} <span class="thin">&mdash; '
                f'{len(rows)} unit{"s" if len(rows) != 1 else ""} &middot; '
                f'{money(cval) if cval else "unpriced"}</span></div>')
        # one table per company; the heading will not be left alone at the
        # foot of a page (sub-h carries break-after: avoid) and a long table
        # repeats its header row on every page it spans
        block = head + kf.dtable_flow(hdr, trs, al, "cp")
        parts.append(f'<div class="keep">{block}</div>' if len(trs) <= 12 else block)
    return "".join(parts)


def build_html(r26, rprev, b26, bprev, oos, ravail, bavail, data_asat=""):
    """The client PDF on the Coates house frame (k2flow): the position, the
    ask, the pictures, then the register - companies A-Z, oldest first."""
    import k2flow as kf
    import k2shell as sh
    from k2shell import esc, num
    refresh = datetime.now().strftime("%d %b %Y %H:%M")
    total_exposure = val(r26) + val(rprev) + val(b26) + val(bprev)
    prev_all = rprev + bprev
    prev_val = val(prev_all)
    oldest = max(i["days"] for i in prev_all) if prev_all else 0
    all_on = r26 + rprev + b26 + bprev
    by_year = defaultdict(lambda: [0, 0.0])
    for i in prev_all:
        by_year[i["year"]][0] += 1
        by_year[i["year"]][1] += i["cost"] or 0
    years = sorted(by_year)
    comp_year = defaultdict(lambda: defaultdict(lambda: [0, 0.0]))
    comp_oldest = defaultdict(int)
    for i in prev_all:
        comp_year[i["company"]][i["year"]][0] += 1
        comp_year[i["company"]][i["year"]][1] += i["cost"] or 0
        comp_oldest[i["company"]] = max(comp_oldest[i["company"]], i["days"])
    oos_r = [i for i in oos if "batter" not in i["desc"].lower()]
    oos_b = [i for i in oos if "batter" in i["desc"].lower()]
    n_radio = META.get("n_radio", len(r26) + len(rprev) + len(ravail) + len(oos_r))
    n_batt = META.get("n_batt", len(b26) + len(bprev) + len(bavail) + len(oos_b))
    comp_tot = defaultdict(float)
    for i in all_on:
        comp_tot[i["company"]] += i["cost"] or 0
    top10 = sorted(comp_tot.items(), key=lambda kv: -kv[1])[:10]
    rest_n = len(comp_tot) - len(top10)
    rest_v = sum(comp_tot.values()) - sum(v for _, v in top10)
    age_defs = [("0-30 days", lambda d: d <= 30), ("31-90 days", lambda d: 31 <= d <= 90),
                ("91-365 days", lambda d: 91 <= d <= 365), ("Over 365 days", lambda d: d > 365)]
    age_rows = []
    for lbl, test in age_defs:
        grp = [i for i in all_on if test(i["days"])]
        pct = round(100 * len(grp) / (len(all_on) or 1))
        age_rows.append((lbl, len(grp), f"{len(grp)} units - {money(val(grp))} - {pct}%"))
    asat_s = data_asat or "TBC"
    unpriced = sum(1 for i in all_on if not i["cost"])
    cfg = {
        "client": "Ampol", "title": "Site Radio On-Hire Report",
        "kicker": "COATES · TOOL STORE · SITE RADIO ON-HIRE REPORT",
        "project": "Ampol Lytton Refinery · Permanent Tool Store",
        "asat_note": "(SiteIQ register pull)",
        "key_items": [("orange", "RETURN IT", "not in use? back to the store - scanned in on the spot"),
                      ("blue", "RESCAN IT", "still in use? bring it past the counter - proof of existence"),
                      ("amber", "30+ DAYS", "shown in red - due for a return or a rescan")],
        "team": [{"name": "Andrew Fisher", "role": "Shutdown Manager", "shift": "",
                  "email": "andrew.fisher@coates.com.au",
                  "blurb": "Oversees the store and the radio fleet - anything at all, start here",
                  "lead": True}],
    }
    P = []
    # ---- page 1: the position, the numbers, the ask ----------------------
    pos = (f'<div class="callout"><span class="lead">The position.</span> <b class="o">{money(total_exposure)}</b> '
           f'of site radio equipment is on hire per the SiteIQ pull as at {esc(asat_s)}: '
           f'<b>{num(len(r26) + len(rprev))} radios</b> and <b>{num(len(b26) + len(bprev))} batteries</b>. '
           f'Of that, <b class="o">{money(prev_val)}</b> across <b>{num(len(prev_all))} units</b> has been out since '
           f'{esc(PRIOR_LABEL)} - the oldest for <b>{num(oldest)} days</b>. Every one of those is working hard on site, '
           f'sitting unused in a crib room or ute, or no longer accounted for; this report tells those three apart. '
           f'<b>Not in use? Return it. Still in use? Bring it past the counter for a rescan.</b> Either way the record '
           f'updates the moment it is scanned.</div>')
    tiles1 = sh.tiles([
        ("shield", money(total_exposure), "On-hire value", f"{num(len(all_on))} units on hire", "grey"),
        ("swap", num(len(r26) + len(rprev)), "Radios on hire", money(val(r26) + val(rprev)), ""),
        ("swap", num(len(b26) + len(bprev)), "Batteries on hire", money(val(b26) + val(bprev)), ""),
        ("warn", num(len(prev_all)), f"On hire since {PRIOR_LABEL}", money(prev_val), "red" if prev_all else "green"),
    ])
    tiles2 = sh.tiles([
        ("check", f"{len(ravail)} / {len(bavail)}", "Available in store", "radios / batteries", "green" if ravail else "amber"),
        ("clock", num(oldest), "Oldest hire (days)", "", "amber"),
        ("box", num(len(oos)), "Out of service", money(val(oos)) if val(oos) else "", "grey"),
        ("bars", f"{num(n_radio)} / {num(n_batt)}", "On the register", "radios / batteries", "grey"),
    ])
    ask = ('<div class="alerts"><div class="ah">What we are asking - please read first</div><table class="al">'
           '<tr><td class="al-dot d-amber">&#9679;</td><td><div class="al-t">Not in use? Return it to the Ampol Tool Store (Coates managed).</div>'
           '<div class="al-s">It is scanned in on the spot and comes straight off this report. Returned radios go back into the available pool for the next shutdown.</div></td></tr>'
           '<tr><td class="al-dot d-blue">&#9679;</td><td><div class="al-t">Still in use? Bring it past the store for a rescan.</div>'
           '<div class="al-s">Proof of existence: a thirty-second scan verifies the unit is on site, in whose hands, and resets the record. Nothing is taken off you.</div></td></tr>'
           f'<tr><td class="al-dot d-red">&#9679;</td><td><div class="al-t">Replacement value: radios {money(PRICE_RADIO)} each, batteries {money(PRICE_BATT)} ({esc(PRICE_SOURCE)}).</div>'
           '<div class="al-s">Units that can be neither returned nor verified are ultimately chargeable at replacement value under the hire arrangement, applied consistently to all companies. Verification protects everyone from charges for equipment that is actually on site.</div></td></tr>'
           '<tr><td class="al-dot d-green">&#9679;</td><td><div class="al-t">Something look wrong? Tell the Ampol Tool Store.</div>'
           '<div class="al-s">We review and correct the record with you - no charge is finalised without that review.</div></td></tr>'
           '</table></div>')
    assure = (f'<div class="note">These records are protected by daily stock takes (30-day full-coverage cycle, on-hire verification of the '
              f'radio charging bays) and the double-check return process - every return is inspected and scanned on receipt, then '
              f'stock-taken to its storage unit before going back on charge. <b>The moment a unit is scanned, the record updates.</b> '
              f'Every count on this report is read from the SiteIQ register as at <b>{esc(asat_s)}</b> - nothing comes from a summary tab. '
              f'Serial numbers: {esc(META.get("serial_note", "from the radio register"))}.</div>')
    P.append(pos + tiles1 + tiles2 + ask + assure)
    # ---- the pictures -----------------------------------------------------
    radio_rows = [(f"On hire - issued {CUR_YEAR}", len(r26)), (f"On hire - issued {PRIOR_LABEL}", len(rprev)),
                  ("Available in store", len(ravail)), ("Out of service", len(oos_r))]
    batt_rows = [(f"On hire - issued {CUR_YEAR}", len(b26)), (f"On hire - issued {PRIOR_LABEL}", len(bprev)),
                 ("Available in store", len(bavail)), ("Out of service", len(oos_b))]
    exp_rows = [(c, v, money(v)) for c, v in top10]
    exp_note = (f"Ranked by value - the top {len(top10)} of {len(comp_tot)} companies; the remaining {rest_n} hold "
                f"{money(rest_v)} between them." if rest_n > 0 else f"Ranked by value - all {len(comp_tot)} companies shown.")
    P.append(
        '<div class="sect"><h3>Fleet position at a glance</h3></div>'
        '<div class="callout tight">Three pictures of the same truth - where the fleet sits, who holds the value, and how long it '
        'has been out. Every count and dollar here comes straight from the register tables that follow; nothing is replaced or rounded.</div>'
        '<table class="two"><tr>'
        f'<td style="width:50%;padding-right:6px"><div class="sub-h">Site radios <span class="thin">&mdash; {num(n_radio)} on the register</span></div>'
        f'<div class="chartpanel">{sh.hbars(radio_rows, w=300, lab_w=150, rowh=26)}</div></td>'
        f'<td style="width:50%;padding-left:6px"><div class="sub-h">Radio batteries <span class="thin">&mdash; {num(n_batt)} on the register</span></div>'
        f'<div class="chartpanel">{sh.hbars(batt_rows, w=300, lab_w=150, rowh=26)}</div></td>'
        '</tr></table>'
        f'<div class="sub-h">Replacement-value exposure by company <span class="thin">&mdash; {money(sum(comp_tot.values()))} across '
        f'{len(comp_tot)} companies (ranked by value)</span></div>'
        f'<div class="chartpanel">{sh.hbars(exp_rows, w=636, lab_w=190, rowh=24, right=90)}</div>'
        f'<div class="note">{esc(exp_note)}</div>'
        f'<div class="sub-h">Age of hire <span class="thin">&mdash; how long the {num(len(all_on))} on-hire units have been out</span></div>'
        f'<div class="chartpanel">{sh.hbars(age_rows, w=636, lab_w=120, rowh=24, right=200)}</div>'
        f'<div class="note">Everything beyond 30 days is due for a return or a rescan; {esc(PRIOR_LABEL)} issues drive the over-365 band.</div>')
    # ---- prior years: the value story ------------------------------------
    yt = [("clock", num(cnt), f"Issued {y} - still on hire", money(v), "red") for y, (cnt, v) in sorted(by_year.items())]
    ordered = sorted(comp_year.items(), key=lambda kv: -sum(v[1] for v in kv[1].values()))
    yrows = []
    for comp, ymap in ordered:
        tot_n = sum(v[0] for v in ymap.values())
        tot_v = sum(v[1] for v in ymap.values())
        cells = [esc(comp)] + [(num(ymap.get(y, [0, 0])[0]) if ymap.get(y, [0, 0])[0] else '<span class="tbc">-</span>') for y in years]
        cells += [f"<b>{num(tot_n)}</b>",
                  (f'<b class="rd">{money(tot_v)}</b>' if tot_v >= 100000 else f"<b>{money(tot_v)}</b>"),
                  f'<span class="rd">{num(comp_oldest[comp])}</span>']
        yrows.append(cells)
    P.append(
        f'<div class="sect"><h3>{esc(PRIOR_LABEL)} - the value story</h3></div>'
        f'<div class="callout tight"><b class="o">{num(len(prev_all))} radios and batteries issued in prior years remain on hire</b> - '
        f'{money(prev_val)} of equipment. Rather than listing {num(len(prev_all))} lines, this section summarises by year and company '
        f'(line-item detail is available from the Tool Store on request). Any unit still in use: bring it past the store for a rescan. '
        f'Any unit not in use: return it.</div>'
        + (sh.tiles(yt) if yt else "")
        + kf.dtable_flow(["Company (ranked by value)"] + [str(y) for y in years] + ["Units", "Value", "Oldest (days)"],
                         yrows, [""] + ["r"] * len(years) + ["r", "r", "r"], "cp")
        + f'<div class="note">Values in red carry {money(100000)} or more of equipment. The fastest way off this table is a return or a rescan.</div>')
    # ---- the register: this year, full detail ----------------------------
    P.append(
        f'<div class="pb"></div><div class="sect"><h3>{CUR_YEAR} - radios on hire, full detail</h3></div>'
        f'<div class="note"><b>{num(len(r26))} radios</b> issued in {CUR_YEAR} are on hire - {money(val(r26))}. Companies A to Z, '
        f'one customer one name; inside a company, longest-held first. 30 days or more shows in red.</div>'
        + detail_rows(r26, serial_col=True))
    P.append(
        f'<div class="pb"></div><div class="sect"><h3>{CUR_YEAR} - radio batteries on hire, full detail</h3></div>'
        f'<div class="note"><b>{num(len(b26))} batteries</b> issued in {CUR_YEAR} are on hire - {money(val(b26))}. Companies A to Z, '
        f'longest-held first.</div>' + detail_rows(b26, serial_col=False))
    # ---- out of service -----------------------------------------------------
    orows = [[esc(i["barcode"]), esc(i["serial"] or "-"), money(i["cost"]),
              (i["date"].strftime("%d %b %Y") if i["date"] else "-"), f'<span class="rd">{i["days"]}</span>']
             for i in sorted(oos, key=lambda x: -x["days"])]
    P.append(
        f'<div class="pb"></div><div class="sect"><h3>Out of service - {num(len(oos))} units ({money(val(oos))})</h3></div>'
        '<div class="note">Units tagged Out of Service under the Tool Store SOP - tagged, photographed, reported and quarantined '
        'pending repair or replacement. Longest first.</div>'
        + (kf.dtable_flow(["Barcode", "Serial", "Price", "Status since", "Days"], orows, ["", "", "r", "", "r"], "cp")
           if orows else '<div class="note">Nothing is out of service at the pull time.</div>'))
    # ---- close: data and method, the standard, the team -------------------
    cards = sh.info_cards([
        ("Return it or rescan it",
         "Not in use - back to the store, scanned in on the spot. Still in use - a thirty-second rescan at the counter is proof "
         "of existence. Either way the record updates immediately."),
        ("Replacement value, applied consistently",
         f"Radios {money(PRICE_RADIO)}, batteries {money(PRICE_BATT)} ({esc(PRICE_SOURCE)}). Units that can be neither returned "
         f"nor verified are chargeable at that value under the hire arrangement - the same rule for every company. "
         f"{esc(META.get('unpriced_note', '').strip())}"),
        ("Two scans, two looks",
         "Every unit is scanned and sighted going out, and scanned and sighted coming back. Radios are charge-checked on return. "
         "Life Saving Rule 5 - Tools and Equipment (SEQ-GL-009): nothing damaged, defective or flat is ever reissued."),
        ("Numbers you can challenge",
         f"Every count on every page is read from the SiteIQ RENTAL_STOCK export as at {esc(asat_s)} - never a summary tab. "
         f"{esc(META.get('coverage', '').strip())} {esc(META.get('serial_note', 'Serial numbers from the radio register'))}. "
         f"Unpriced units ({num(unpriced)}) show a dash and are never estimated."),
    ])
    P.append(
        '<div class="pb"></div><div class="sect"><h3>Data and method</h3></div>'
        f'<div class="note">Source: the SiteIQ RENTAL_STOCK export requested {esc(asat_s)} - every Motorola site radio and radio '
        f'battery on the register, with its status, company, hirer, on-hire date and storage unit. Report built {esc(refresh)}. '
        f'{CUR_YEAR} issues are shown in full; {esc(PRIOR_LABEL)} issues are summarised by year and company. Companies are one '
        f'customer one name (project accounts roll up to their parent). Replacement values: {esc(PRICE_SOURCE)}.</div>'
        '<div class="sect"><h3>How the radio fleet is run</h3></div>' + cards
        + '<div class="sect"><h3>Meet the tool store team</h3></div>' + sh.team_cards(cfg["team"]))
    return kf.flow_doc(cfg, refresh, asat_s, "".join(P))



RADIO_EMAIL_TO = (
    '"Ampol Store" <Ampolstore@coates.com.au>, "Mitchell, Cody" <Cody.mitchell@coates.com.au>, '
    '"Riki Nicholls" <rxnicho@ampol.com.au>, "Steve Webster" <swebste@ampol.com.au>, '
    '"Lucas Riddell" <lxridde@ampol.com.au>, "Michael McEvoy" <mxmcevo@ampol.com.au>, '
    '"Fabian Wong" <fwong@ampol.com.au>, "Lyle Mildenhall" <lmilden@ampol.com.au>, '
    '"Steve Costanzo" <scostan@ampol.com.au>, "Virginia Harding" <vhardin@ampol.com.au>, '
    '"Tn Nam" <tnam@ampol.com.au>, "Thiago Lucca" <txlucca@ampol.com.au>, '
    '"John Strano" <jstrano@ampol.com.au>, "David McGurk" <dmcgurk@ampol.com.au>, '
    '"Kail Linehan" <kxlineh@ampol.com.au>, "Eamon Rees" <erees@ampol.com.au>, '
    '"William Potter" <wxpotte@ampol.com.au>, "Jonathon Giudice" <jgiudic@ampol.com.au>, '
    '"Jason Waddell" <jwaddel@ampol.com.au>, "Paul Henry" <phenry@ampol.com.au>, '
    '"Jarred Bishop" <jxbisho@ampol.com.au>, "Simon Phillips" <sxphill@ampol.com.au>, '
    '"Darren Parker" <dparker@ampol.com.au>, "Ross Comerford" <rcommer@ampol.com.au>, '
    '"Arron Pelling" <ajpelli@ampol.com.au>, '
    '"Robbie Glyde (robbie.glyde@universalcranes.com)" <robbie.glyde@universalcranes.com>, '
    '"Saad Khan" <szkhan1@ampol.com.au>, "Sean Wong" <czwong1@ampol.com.au>, '
    '"LytRefMaintReporting@ampol.com.au" <LytRefMaintReporting@ampol.com.au>, '
    '"John Martin" <jzmarti1@ampol.com.au>, "Chris Jurlina" <cjurlin@ampol.com.au>, '
    '"Sam Robson" <srobers@ampol.com.au>, "Sims, Akira (North)" <Akira.sims@coates.com.au>, '
    '"Logan Ferguson-rudolph (External)" <lyfergu@ampol.com.au>, '
    '"Jay Purcell (External)" <jypurce@ampol.com.au>'
)


def build_email_summary(r26, rprev, b26, bprev, oos, ravail, bavail, data_asat="", pdf_ok=True):
    """High-level summary email body - all data summarised, full detail in the attached PDF."""
    refresh = datetime.now().strftime("%d %b %Y %H:%M")
    O = "#e07000"
    total_exposure = val(r26) + val(rprev) + val(b26) + val(bprev)
    prev_all = rprev + bprev
    prev_val = val(prev_all)
    oldest = max(i["days"] for i in prev_all) if prev_all else 0

    by_year = defaultdict(lambda: [0, 0.0])
    for i in prev_all:
        by_year[i["year"]][0] += 1
        by_year[i["year"]][1] += i["cost"] or 0
    years = sorted(by_year)

    # per company: prior-year units/value + 2026 units/value, oldest days
    agg = defaultdict(lambda: {"prev_n": 0, "prev_v": 0.0, "n26": 0, "v26": 0.0, "old": 0})
    for i in prev_all:
        a = agg[i["company"]]; a["prev_n"] += 1; a["prev_v"] += i["cost"] or 0; a["old"] = max(a["old"], i["days"])
    for i in r26 + b26:
        a = agg[i["company"]]; a["n26"] += 1; a["v26"] += i["cost"] or 0; a["old"] = max(a["old"], i["days"])
    ordered = sorted(agg.items(), key=lambda kv: -(kv[1]["prev_v"] + kv[1]["v26"]))

    p = [f"""<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:Calibri,Arial,sans-serif;color:#1a1a1a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:16px 10px">
<table role="presentation" width="820" cellspacing="0" cellpadding="0" style="width:820px;max-width:820px;border-collapse:collapse">
<tr><td style="border-left:6px solid {O};padding:6px 12px">
<div style="font-size:12px;font-weight:bold;color:{O}">{COATES_PURPOSE}</div>
<div style="font-size:22px;font-weight:bold">AMPOL SITE RADIO ON-HIRE REPORT</div>
<div style="font-size:11px;color:#555">Ampol Tool Store \u2013 Coates managed &nbsp;|&nbsp; Motorola site radios &amp; batteries &nbsp;|&nbsp; Refreshed: {refresh}</div></td></tr>

<tr><td style="padding:10px 0 4px;font-size:12px;line-height:1.6">Good morning all,<br><br>
Please find below the summary of the Ampol site radio position{", with the full report attached as a PDF (" + str(CUR_YEAR) + " in complete line-item detail with serial numbers; prior years summarised by company)" if pdf_ok else " - the full line-item report follows separately"}.
This is about visibility, not blame \u2014 the ask is simple and it applies to every company equally.</td></tr>

<tr><td bgcolor="#fdf0f0" style="background-color:#fdf0f0;border:1px solid #f0c0c0;padding:10px 14px">
<div style="font-size:15px;font-weight:bold;color:#c00000">{money(total_exposure)} of radio equipment is currently on hire.</div>
<div style="font-size:11px;padding-top:3px">Of this, <b style="color:#c00000">{money(prev_val)}</b> across <b>{len(prev_all)} units</b> has been on hire since <b>{PRIOR_LABEL}</b> \u2014 the oldest for <b>{oldest} days</b>.
Every one of these radios and batteries is either working on site, sitting unused, or no longer accounted for \u2014 this report exists to tell those three apart.</div></td></tr>

<tr><td style="padding:8px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
<tr><td width="20%" style="border:1px solid #ccc;padding:7px 10px"><div style="font-size:8px;color:#666;letter-spacing:1px">RADIOS ON HIRE</div><div style="font-size:15px;font-weight:bold;color:{O}">{len(r26)+len(rprev)} \u00b7 {money(val(r26)+val(rprev))}</div></td>
<td width="20%" style="border:1px solid #ccc;padding:7px 10px"><div style="font-size:8px;color:#666;letter-spacing:1px">BATTERIES ON HIRE</div><div style="font-size:15px;font-weight:bold;color:{O}">{len(b26)+len(bprev)} \u00b7 {money(val(b26)+val(bprev))}</div></td>
<td width="22%" style="border:1px solid #ccc;padding:7px 10px"><div style="font-size:8px;color:#666;letter-spacing:1px">FROM {PRIOR_LABEL}</div><div style="font-size:15px;font-weight:bold;color:#c00000">{len(prev_all)} \u00b7 {money(prev_val)}</div></td>
<td width="19%" style="border:1px solid #ccc;padding:7px 10px"><div style="font-size:8px;color:#666;letter-spacing:1px">AVAILABLE IN STORE</div><div style="font-size:15px;font-weight:bold;color:#1e7d32">{len(ravail)} radios \u00b7 {len(bavail)} batt.</div></td>
<td style="border:1px solid #ccc;padding:7px 10px"><div style="font-size:8px;color:#666;letter-spacing:1px">OUT OF SERVICE</div><div style="font-size:15px;font-weight:bold;color:#b07700">{len(oos)}</div></td></tr></table></td></tr>

<tr><td bgcolor="#fdf4ea" style="background-color:#fdf4ea;border:1px solid #f0d5b8;padding:10px 14px;font-size:11px">
<div style="font-weight:bold;color:#b35a00;letter-spacing:0.5px;font-size:12px">WHAT WE ARE ASKING \u2013 RETURN IT OR RESCAN IT</div>
<ul style="margin:4px 0 0;padding-left:16px">
<li style="margin:3px 0"><b>Not in use?</b> Return it to the <b>Ampol Tool Store (Coates managed)</b> \u2014 it is scanned in on the spot, comes straight off this report, and goes back into the available pool for the next shutdown.</li>
<li style="margin:3px 0"><b>Still in use?</b> Bring it past the Ampol Tool Store for a <b>rescan \u2014 proof of existence</b>. A thirty-second scan verifies the unit is on site and in whose hands, and resets the record. Nothing is taken off anyone.</li>
<li style="margin:3px 0">Site radios are <b>{money(PRICE_RADIO)}</b> each to replace and batteries {money(PRICE_BATT)} ({PRICE_SOURCE}). Units that can be neither returned nor verified are ultimately chargeable at replacement value under the hire arrangement \u2014 applied consistently to all companies, and <b>no charge is finalised without review</b>. Verification protects everyone from charges for equipment that is actually on site.</li>
<li style="margin:3px 0">Anything look incorrect? Contact the Ampol Tool Store and we will review and correct the record with you.</li>
</ul></td></tr>

<tr><td style="padding:14px 0 4px"><div style="font-size:15px;font-weight:bold;color:{O};text-transform:uppercase;border-bottom:2px solid {O};padding-bottom:3px">{PRIOR_LABEL} \u2013 The Value Story</div></td></tr>
<tr><td style="padding:4px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse"><tr>"""]
    for y in years:
        cnt, v = by_year[y]
        p.append(f"""<td width="33%" style="border:1px solid #ccc;padding:7px 10px"><div style="font-size:8px;color:#666;letter-spacing:1px">ISSUED {y} \u2013 STILL ON HIRE</div>
<div style="font-size:14px;font-weight:bold;color:#c00000">{cnt} units \u00b7 {money(v)}</div></td>""")
    # WHY (13 Aug 2026): this block carries the year variables, so it must be
    # an f-string - as a plain string the {placeholders} printed literally in
    # the email body. Caught by 09_CHECK_REPORTS.
    p.append(f"""</tr></table></td></tr>
<tr><td style="padding:6px 0"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #ccc;font-size:10.5px">
<tr bgcolor="#fafafa"><td style="padding:5px 10px;font-size:9px;color:#555;border-bottom:1px solid #ccc">COMPANY</td>
<td align="right" style="padding:5px 10px;font-size:9px;color:#555;border-bottom:1px solid #ccc">{PRIOR_SHORT} UNITS</td>
<td align="right" style="padding:5px 10px;font-size:9px;color:#555;border-bottom:1px solid #ccc">{PRIOR_SHORT} VALUE</td>
<td align="right" style="padding:5px 10px;font-size:9px;color:#555;border-bottom:1px solid #ccc">{CUR_YEAR} UNITS</td>
<td align="right" style="padding:5px 10px;font-size:9px;color:#555;border-bottom:1px solid #ccc">{CUR_YEAR} VALUE</td>
<td align="right" style="padding:5px 10px;font-size:9px;color:#555;border-bottom:1px solid #ccc">TOTAL VALUE</td>
<td align="right" style="padding:5px 10px;font-size:9px;color:#555;border-bottom:1px solid #ccc">OLDEST (DAYS)</td></tr>""")
    for comp, a in ordered:
        tot_v = a["prev_v"] + a["v26"]
        bg = ' bgcolor="#fdf0f0" style="background-color:#fdf0f0"' if a["prev_v"] >= 100000 else ''
        p.append(f"""<tr{bg}><td style="padding:5px 10px;border-bottom:1px solid #eee"><b>{comp}</b></td>
<td align="right" style="padding:5px 10px;border-bottom:1px solid #eee">{a['prev_n'] or EN_DASH}</td>
<td align="right" style="padding:5px 10px;border-bottom:1px solid #eee;color:#c00000;font-weight:bold">{money(a['prev_v']) if a['prev_v'] else EN_DASH}</td>
<td align="right" style="padding:5px 10px;border-bottom:1px solid #eee">{a['n26'] or EN_DASH}</td>
<td align="right" style="padding:5px 10px;border-bottom:1px solid #eee">{money(a['v26']) if a['v26'] else EN_DASH}</td>
<td align="right" style="padding:5px 10px;border-bottom:1px solid #eee;font-weight:bold;color:#b35a00">{money(tot_v)}</td>
<td align="right" style="padding:5px 10px;border-bottom:1px solid #eee;color:#c00000;font-weight:bold">{a['old']}</td></tr>""")
    p.append(f"""</table>
<div style="font-size:10px;color:#555;padding-top:4px">Rows shaded red carry {money(100000)}+ of prior-year equipment. Full line-item detail \u2014 every barcode, serial number, hirer, on-hire date and storage unit for {CUR_YEAR}, plus prior-year detail on request \u2014 is in the {"attached PDF" if pdf_ok else "full report"}.</div></td></tr>

<tr><td bgcolor="#eef5fc" style="background-color:#eef5fc;border:1px solid #b8d4f0;padding:10px 14px;font-size:11px">
<div style="font-weight:bold;color:#1f5c99;letter-spacing:0.5px;font-size:12px">STORE CONTROLS &amp; ASSURANCE</div>
<div style="padding-top:4px">These records are protected by daily stock takes at the Ampol Tool Store (completed without exception, 30-day full-coverage cycle including the radio charging bays)
and the double-check return process \u2014 every return is inspected and scanned on receipt, then stock-taken to its storage unit before going back on charge.
<b>The moment a unit is scanned, the record updates.</b> Every count here is read from the SiteIQ register as at {data_asat} - nothing comes from a summary tab. {META.get("serial_note", "Serial numbers from the radio register")}.</div></td></tr>

<tr><td style="padding:14px 0 6px;font-size:12px;line-height:1.6">
Thanks all \u2014 radios are the backbone of safe communication on site, and getting the idle ones back (or a quick rescan of the ones in use)
keeps the fleet available for everyone's next shutdown. Any questions, come see us at the Ampol Tool Store or reply here.<br><br>
Kind regards,<br><b>Andrew Fisher</b><br>Ampol Tool Store \u00b7 Coates</td></tr>
<tr><td style="border-top:1px solid #ccc;padding:10px 0;font-size:10px;color:#555;text-align:center">
<b>Author: Andrew Fisher</b> &nbsp;\u2022&nbsp; <b style="color:{O}">POWERED BY SITEIQ</b><br>
<span style="color:{O};font-weight:bold">{COATES_VALUES}</span><br>{COATES_OBJECTIVE}<br>
Data as at {data_asat or "TBC"} (SiteIQ RENTAL_STOCK export) &nbsp;\u2022&nbsp; Report built {refresh}</td></tr>
</table></td></tr></table></body></html>""")
    return "".join(p)


LSR_LINE = ("Life Saving Rule 5 - Tools and Equipment (SEQ-GL-009) &nbsp;|&nbsp; "
            "Two scans. Two looks. One standard. &nbsp;|&nbsp; Radios are charge-checked "
            "on return - flat means on charge before ready.")


def frame_email(inner):
    """Standard Coates email frame: 2px dark border, dark hero, LSR footer."""
    return f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0"
 style="background:#EFECE7"><tr><td align="center" style="padding:16px 8px">
<table role="presentation" width="860" cellspacing="0" cellpadding="0"
 style="width:860px;max-width:860px;background:#ffffff;border:2px solid #1D1D1B;border-collapse:collapse">
<tr><td style="background:#1D1D1B;padding:18px 24px;font-family:Arial,sans-serif">
 <div style="font-size:21px;font-weight:900;color:#ffffff">Coates &nbsp;|&nbsp; Ampol Site Radios</div>
 <div style="font-size:12px;font-weight:700;color:#F26222;margin-top:4px">Return it or rescan it &mdash; On-Hire &amp; Recovery Report</div>
 <div style="font-size:10px;color:#bbbbbb;margin-top:6px">The Coates Way &nbsp;|&nbsp; POWERED BY SITEIQ &nbsp;|&nbsp; Author: Andrew Fisher</div>
</td></tr>
<tr><td style="padding:14px 20px">{inner}</td></tr>
<tr><td style="background:#F5F1EC;border-top:3px solid #F26222;padding:10px 20px;
 font-family:Arial,sans-serif;font-size:9px;color:#555555;line-height:1.7">{LSR_LINE}<br/>
 Coates Hire Operations Pty Limited | ABN 50 009 779 338 | www.coates.com.au | POWERED BY SITEIQ<br/>
 Care Deeply &middot; Customer Focused &middot; Be Our Best &middot; One Team &middot; Competitive Spirit</td></tr>
</table></td></tr></table>"""


def write_eml(r26, rprev, b26, bprev, oos, ravail, bavail, pdf_path, eml_path, data_asat=""):
    import json
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.application import MIMEApplication
    body = frame_email(build_email_summary(r26, rprev, b26, bprev, oos, ravail, bavail, data_asat,
                                           pdf_ok=Path(pdf_path).exists()))
    subject = f"Ampol Tool Store \u2013 Site Radio Report \u2013 {REPORT_DATE.strftime('%d %b %Y')}"
    msg = MIMEMultipart("mixed")
    msg["To"] = RADIO_EMAIL_TO
    msg["Subject"] = subject
    msg["X-Unsent"] = "1"
    msg.attach(MIMEText(body, "html", "utf-8"))
    pdf = Path(pdf_path)
    if pdf.exists():
        part = MIMEApplication(pdf.read_bytes(), _subtype="pdf")
        part.add_header("Content-Disposition", "attachment",
                        filename=f"Ampol_Radio_OnHire_Report_{REPORT_DATE.strftime('%d-%m-%Y')}.pdf")
        msg.attach(part)
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())
    # sidecar for MAKE_OUTLOOK_DRAFTS: NATIVE Outlook draft, To pre-filled
    # WHY (12 Aug 2026): the manifest used to carry only the regexed-out bare
    # addresses, silently dropping any recipient ever added without angle
    # brackets. It now carries the FULL To line, semicolon-separated the way
    # Outlook wants it, so the draft matches the .eml recipient for recipient.
    to_line = RADIO_EMAIL_TO.replace(">, ", ">; ")
    n_to = to_line.count(";") + 1
    stem = str(eml_path)[:-4] if str(eml_path).lower().endswith(".eml") else str(eml_path)
    with open(stem + ".body.html", "w", encoding="utf-8") as f:
        f.write(body)
    with open(stem + ".draft.json", "w", encoding="utf-8") as f:
        json.dump({"subject": subject, "to": to_line,
                   "body": Path(stem + ".body.html").name,
                   "attachments": [pdf.name] if pdf.exists() else []}, f, indent=1)
    print(f"Wrote {eml_path} + native-draft manifest (To: {n_to} recipients, PDF attached: {pdf.exists()})")


def write_pdf_robust(html_path, pdf_path):
    # WHY (12 Aug 2026): an old PDF sitting on the target name used to make a
    # failed browser print look like a success - the only check is 'file
    # exists'. The target is deleted up front, so the only PDF that can pass
    # that check now is the one this run actually wrote.
    tgt = Path(pdf_path)
    try:
        if tgt.exists(): tgt.unlink()
    except OSError as e:
        raise SystemExit(f"Cannot replace {tgt.name} - close it if it is open, then run again. ({e})")
    try:
        from weasyprint import HTML
        HTML(filename=str(html_path)).write_pdf(str(pdf_path))
        return True
    except Exception as e:
        print(f"WeasyPrint unavailable ({type(e).__name__}) - trying Edge/Chrome headless...")
    import subprocess, os, time, tempfile
    for exe in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                "msedge", "chrome", "chromium", "chromium-browser", "google-chrome"]:
        if exe.endswith(".exe") and not os.path.exists(exe): continue
        for attempt in range(3):
            # unique profile per attempt: a live browser with the same profile
            # makes headless print exit 0 without writing the PDF
            # WHY (13 Aug 2026): fall back to the system temp dir, not the
            # suite folder - a machine without TEMP set was leaving throwaway
            # browser profiles next to the scripts.
            profile = os.path.join(os.environ.get("TEMP", tempfile.gettempdir()),
                                   f"coates_edge_pdf_{os.getpid()}_{attempt}")
            try:
                subprocess.run([exe, "--headless", "--disable-gpu",
                                "--user-data-dir=" + profile, "--no-first-run",
                                f"--print-to-pdf={Path(pdf_path).resolve()}",
                                "--no-pdf-header-footer", Path(html_path).resolve().as_uri()],
                               capture_output=True, timeout=180)
            except FileNotFoundError:
                break        # not installed here - straight on to the next candidate
            except Exception:
                pass
            if Path(pdf_path).exists():
                print(f"PDF generated via {Path(exe).name}")
                return True
            time.sleep(1.5)
        # WHY (12 Aug 2026): an unconditional break used to sit here, so if the
        # first browser found kept failing the rest were never tried. Now every
        # candidate on the list gets its turn before we give up.
    print("No PDF engine found - HTML written; PDF skipped.")
    return False

def find_workbook(patterns, arg=None):
    # WHY (12 Aug 2026): inputs now come from the suite's one Data area via
    # ampol_paths - newest file wins, Excel ~$ lock files and archived
    # Source_ pulls are never candidates. An explicit path argument still
    # overrides everything, exactly as before.
    if arg: return arg
    return ampol_paths.find_data(*patterns) or None

def main():
    global PRIOR_LABEL, PRIOR_SHORT, PRICE_RADIO, PRICE_BATT, PRICE_SOURCE, META
    master = find_workbook(["RENTAL_STOCK*.xlsx"], sys.argv[1] if len(sys.argv) > 1 else None)
    register = find_workbook(["radio_register*.xlsx", "*radio*register*.xlsx"], sys.argv[2] if len(sys.argv) > 2 else None)
    pricing = find_workbook(["Ampol_ToolStore_Pricing*.xlsx", "*Pricing*.xlsx"], sys.argv[3] if len(sys.argv) > 3 else None)
    if not master:
        raise SystemExit("No RENTAL_STOCK.xlsx in the Data folder - download the SiteIQ export, "
                         "run 12_PULL_SITEIQ_EXPORTS, and press the radio button again.")
    print(f"Register (source)  : {master}")
    print(f"Radio serial list  : {register or 'NOT FOUND in Data - serials fall back to the description, else dashes'}")
    print(f"Pricing master     : {pricing or 'NOT FOUND in Data - replacement values show as dashes'}")
    print("Radio workbook     : not read (02 Sep 2026) - the register is the source")
    out = Path(ampol_paths.day_folder("Radios"))  # dated folder, created on demand

    serials = load_serials(register) if register else {}
    prices, PRICE_RADIO, PRICE_BATT = load_prices(pricing)
    PRICE_SOURCE = (f"new replacement price per {Path(pricing).name}" if pricing and PRICE_RADIO
                    else "replacement price not in the pricing master - shown as TBC")
    d = load_from_register(master, serials, prices)
    r26, rprev, b26, bprev = d["r_cur"], d["r_prev"], d["b_cur"], d["b_prev"]
    oos, ravail, bavail = d["oos"], d["r_avail"], d["b_avail"]
    data_asat = d["asat"].strftime("%d %b %Y %H:%M")
    prior_years = sorted(y for y in d["years"] if y < CUR_YEAR)
    if prior_years:
        PRIOR_LABEL = f"{prior_years[0]}{EN_DASH}{CUR_YEAR - 1}" if prior_years[0] != CUR_YEAR - 1 else str(CUR_YEAR - 1)
        PRIOR_SHORT = f"{prior_years[0]}-{str(CUR_YEAR - 1)[2:]}" if prior_years[0] != CUR_YEAR - 1 else str(CUR_YEAR - 1)
    hits, tot = d["serial_hits"], d["serial_total"]
    META = {
        "n_radio": d["n_radio"], "n_batt": d["n_batt"],
        "serial_note": (f"serial numbers from the radio register or the serial SiteIQ carries in the "
                        f"item description - {hits} of the {tot} radios on hire have one, "
                        f"{tot - hits} show a dash"),
        "coverage": (f"Fleet on the register: {d['n_radio']} radios and {d['n_batt']} batteries"
                     + (f", including {d['turnaround']} SATGAS turnaround units" if d["turnaround"] else "")
                     + (f"; {d['accounts']} units are held on shared site accounts, shown as such." if d["accounts"] else ".")),
        "unpriced_note": (f" {d['unpriced']} unit(s) have no price in the master and are excluded from every "
                          f"value total, never estimated." if d["unpriced"] else ""),
    }
    html_str = build_html(r26, rprev, b26, bprev, oos, ravail, bavail, data_asat)
    base = out / "Ampol_Radio_OnHire_Report"
    with open(f"{base}.html", "w", encoding="utf-8") as f:
        f.write(html_str)
    write_pdf_robust(f"{base}.html", f"{base}.pdf")
    write_eml(r26, rprev, b26, bprev, oos, ravail, bavail, f"{base}.pdf", f"{base}_OUTLOOK.eml", data_asat)
    tot_v = val(r26) + val(rprev) + val(b26) + val(bprev)
    print(f"Data as at         : {data_asat}  (RENTAL_STOCK request time)")
    print(f"Radios {CUR_YEAR}: {len(r26)} | prior: {len(rprev)} | Batteries {CUR_YEAR}: {len(b26)} | prior: {len(bprev)} | "
          f"OOS: {len(oos)} | available {len(ravail)} radios / {len(bavail)} batteries | TOTAL EXPOSURE: ${tot_v:,.0f}")
    print(f"Serials            : {hits} of {tot} radios on hire | unpriced units: {d['unpriced']}")
    print(f"Output: {out}")

if __name__ == "__main__":
    main()
