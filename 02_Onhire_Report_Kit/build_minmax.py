#!/usr/bin/env python3
"""Consumables Min / Max from past shuts' SiteIQ SALES_STOCK pulls.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python build_minmax.py OUT.xlsx CURRENT_SALES_STOCK.xlsx \
        --shut "July 2026=PATH" --shut "Feb-Mar 2026=PATH" [...]

Each --shut is a SALES_STOCK pull of a finished shut's own schedule (SiteIQ
returns every draw on the schedule whenever it is pulled). Draws are
counted on shift days (05:00 to 04:59); a shut's days run from its first
draw day to its last. Lines are matched on MMG's stock number (the
digits at the end of SKU_BARCODE), which outlives catalogue changes. The workbook keeps
every Min and Max as a live formula off the Inputs tab. No prices.
"""
import argparse
import collections
import datetime as dt
import re
import sys

import openpyxl
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L


def _rows(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ref = [r for r in wb["REFERENCE_INFO"].iter_rows(values_only=True)]
    rows = [r for r in wb["SALES_STOCK"].iter_rows(values_only=True) if any(c not in (None, "") for c in r)]
    head = [str(c or "").strip() for c in rows[0]]
    info = dict(zip([str(c or "").strip().upper() for c in ref[0]], ref[1]))
    return info, [dict(zip(head, r)) for r in rows[1:]]


def _when(d, t):
    for fd in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            day = dt.datetime.strptime(str(d).strip()[:10], fd).date()
            break
        except ValueError:
            day = None
    if not day:
        return None
    try:
        tm = dt.datetime.strptime(str(t).strip(), "%I:%M %p").time()
    except ValueError:
        tm = dt.time(12, 0)
    return dt.datetime.combine(day, tm)


def stock_no(r):
    """MMG's own stock number, the digits at the end of the barcode. It
    stays the same across catalogues (10419871 then, 2025MMG10419871 now)
    where SKU_NUMBER does not."""
    m = re.findall(r"(\d{6,})\s*$", str(r.get("SKU_BARCODE") or ""))
    return m[0] if m else str(r.get("SKU_NUMBER") or "")


def shut_usage(path):
    info, rows = _rows(path)
    by = collections.defaultdict(collections.Counter)
    days = set()
    for r in rows:
        q = float(r.get("SALES_QUANTITY") or 0)
        if q <= 0 or not str(r.get("COMPANY_NAME") or "").strip():
            continue
        w = _when(r.get("SALES_DATE"), r.get("SALES_TIME"))
        if not w:
            continue
        sd = (w - dt.timedelta(hours=5)).date()
        by[stock_no(r)][sd] += q
        days.add(sd)
    if not days:
        return info, {}, []
    span = [min(days) + dt.timedelta(i) for i in range((max(days) - min(days)).days + 1)]
    return info, by, span


def build(out, current, shuts, nov_days=7, cover=2, asat=""):
    cinfo, cur = _rows(current)
    stock = {stock_no(r): r for r in cur if not str(r.get("COMPANY_NAME") or "").strip()}
    data = [(name,) + shut_usage(p) for name, p in shuts]
    tot = lambda by, s: sum(by.get(s, {}).values())
    lines = sorted(stock, key=lambda s: (-sum(tot(d[2], s) for d in data), str(stock[s]["SKU_DESCRIPTION"])))

    SL, OR = "2A313C", "F26222"
    F = lambda **k: Font(name="Inter", size=k.pop("size", 10), **k)
    slate, orange = PatternFill("solid", fgColor=SL), PatternFill("solid", fgColor=OR)
    inp, band = PatternFill("solid", fgColor="FFF2CC"), PatternFill("solid", fgColor="F4F5F7")
    wb = openpyxl.Workbook()
    src = "   ·   ".join("{}: SiteIQ pull {}".format(n, i.get("REQUESTED_DATE/TIME (LOCAL TIME)", "")) for n, i, _, _ in data)

    def head(ws, title, sub, ncol):
        ws.sheet_view.showGridLines = False
        for c in range(1, ncol + 1):
            ws.cell(1, c).fill = slate
            ws.cell(2, c).fill = orange
        ws["A1"] = title
        ws["A1"].font = F(size=14, bold=True, color="FFFFFF")
        ws["A2"] = sub
        ws["A2"].font = F(size=9, bold=True, color="FFFFFF")
        ws["A3"] = "Author: Andrew Fisher | POWERED BY SITEIQ   ·   " + src + "   ·   On shelf: SiteIQ pull " + str(cinfo.get("REQUESTED_DATE/TIME (LOCAL TIME)", asat))
        ws["A3"].font = F(size=8, italic=True, color="5A6270")
        ws.row_dimensions[1].height = 26

    wi = wb.active
    wi.title = "Inputs"
    head(wi, "MIN / MAX SETTINGS", "Change the yellow cells - every Min and Max on the Min Max tab follows them", 4)
    rows_in = [("{} shift days".format(n), len(span), "First to last draw day, 05:00 to 04:59 - from the data.") for n, _, _, span in data]
    rows_in += [("November counter days", nov_days, "Wed 25 Nov to Tue 01 Dec 2026, from the Coates Labour roster."),
                ("Days of cover for Min", cover, "ASSUMPTION - days to get a line restocked at Dugald River. Set it to the real resupply time.")]
    for j, v in enumerate(("Setting", "Value", "Where it comes from"), 1):
        c = wi.cell(5, j, v)
        c.font = F(bold=True, color="FFFFFF")
        c.fill = slate
    for i, (a, b, c) in enumerate(rows_in, 6):
        wi.cell(i, 1, a).font = F(bold=True)
        cb = wi.cell(i, 2, b)
        cb.font = F(bold=True, color="0000FF")
        cb.alignment = Alignment(horizontal="center")
        wi.cell(i, 3, c).font = F(size=9, color="5A6270")
        if i >= 6 + len(data):
            cb.fill = inp
    nrow = 6 + len(data)
    ND, CD = "Inputs!$B${}".format(nrow), "Inputs!$B${}".format(nrow + 1)
    wi.column_dimensions["A"].width = 30
    wi.column_dimensions["B"].width = 10
    wi.column_dimensions["C"].width = 95

    # one daily tab per shut
    for k, (name, info, by, span) in enumerate(data):
        ws = wb.create_sheet("{} Daily".format(name)[:31])
        head(ws, "{} - UNITS DRAWN EACH SHIFT DAY".format(name.upper()), "Every consumable draw on the shut's SiteIQ schedule, by line and shift day", len(span) + 3)
        hd = ["SKU", "Line"] + [d.strftime("%a %d %b") for d in span] + ["Total"]
        for j, v in enumerate(hd, 1):
            c = ws.cell(5, j, v)
            c.font = F(bold=True, color="FFFFFF")
            c.fill = slate
            c.alignment = Alignment(horizontal="center", wrap_text=True)
        tc = len(span) + 3
        for i, s in enumerate(lines, 6):
            ws.cell(i, 1, str(stock[s]["SKU_NUMBER"])).font = F()
            ws.cell(i, 2, str(stock[s]["SKU_DESCRIPTION"])).font = F()
            for j, d in enumerate(span, 3):
                q = by.get(s, {}).get(d, 0)
                if q:
                    ws.cell(i, j, q).font = F()
                ws.cell(i, j).alignment = Alignment(horizontal="center")
            c = ws.cell(i, tc, "=SUM(C{0}:{1}{0})".format(i, L(tc - 1)))
            c.font = F(bold=True)
            c.alignment = Alignment(horizontal="center")
        last = 5 + len(lines)
        ws.cell(last + 1, 2, "Total").font = F(bold=True)
        for j in range(3, tc + 1):
            c = ws.cell(last + 1, j, "=SUM({0}6:{0}{1})".format(L(j), last))
            c.font = F(bold=True)
            c.alignment = Alignment(horizontal="center")
        ws.column_dimensions["A"].width = 17
        ws.column_dimensions["B"].width = 52
        for j in range(3, tc + 1):
            ws.column_dimensions[L(j)].width = 9
        ws.freeze_panes = "C6"
        data[k] = (name, info, by, span, ws.title, tc)

    wm = wb.create_sheet("Min Max", 0)
    n = len(data)
    hm = ["SKU", "Line"]
    for name, *_ in data:
        hm += ["{} units".format(name), "{} per day".format(name)]
    hm += ["Avg per day", "Busiest day (any shut)", "MIN", "MAX", "On shelf now", "To order (to Max)", "Over Max", "Action"]
    ncol = len(hm)
    head(wm, "MMG CONSUMABLES - MIN / MAX FOR THE NOVEMBER 2026 SHUT",
         "Built from what each line used across {} past shuts. Min = reorder point. Max = what to hold for the whole November shut.".format(n), ncol)
    for j, v in enumerate(hm, 1):
        c = wm.cell(5, j, v)
        c.font = F(bold=True, color="FFFFFF")
        c.fill = orange if v in ("MIN", "MAX") else slate
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    wm.row_dimensions[5].height = 34
    base = 3 + 2 * n
    cA, cB, cMin, cMax, cOn, cOrd, cOver, cAct = [L(base + i) for i in range(8)]
    for i, s in enumerate(lines, 6):
        wm.cell(i, 1, str(stock[s]["SKU_NUMBER"]))
        wm.cell(i, 2, str(stock[s]["SKU_DESCRIPTION"]))
        rates, peaks = [], []
        for k, (name, info, by, span, tab, tc) in enumerate(data):
            cu, cr = L(3 + 2 * k), L(4 + 2 * k)
            wm["{}{}".format(cu, i)] = "='{}'!{}{}".format(tab, L(tc), i)
            wm["{}{}".format(cr, i)] = "={}{}/Inputs!$B${}".format(cu, i, 6 + k)
            wm["{}{}".format(cr, i)].number_format = "0.0"
            rates.append("{}{}".format(cr, i))
            peaks.append("MAX('{}'!C{}:{}{})".format(tab, i, L(tc - 1), i))
        wm["{}{}".format(cA, i)] = "=AVERAGE({})".format(",".join(rates))
        wm["{}{}".format(cA, i)].number_format = "0.0"
        wm["{}{}".format(cB, i)] = "=MAX({})".format(",".join(peaks))
        wm["{}{}".format(cMin, i)] = "=IF({a}{r}=0,0,MAX({b}{r},ROUNDUP({a}{r}*{cd},0)))".format(a=cA, b=cB, r=i, cd=CD)
        wm["{}{}".format(cMax, i)] = "=IF({a}{r}=0,0,MAX({m}{r},ROUNDUP({a}{r}*{nd},0)))".format(a=cA, m=cMin, r=i, nd=ND)
        wm["{}{}".format(cOn, i)] = int(float(stock[s].get("AVAILABLE_QUANTITY") or 0))
        wm["{}{}".format(cOrd, i)] = "=MAX(0,{x}{r}-{o}{r})".format(x=cMax, o=cOn, r=i)
        wm["{}{}".format(cOver, i)] = "=IF({a}{r}=0,0,MAX(0,{o}{r}-{x}{r}))".format(a=cA, o=cOn, x=cMax, r=i)
        wm["{}{}".format(cAct, i)] = ('=IF({a}{r}=0,"No use in these shuts - don\'t reorder; review",IF({o}{r}<{m}{r},"Below Min now - order",'
                                      'IF({d}{r}>0,"Top up to Max","Stocked to Max")))').format(a=cA, o=cOn, m=cMin, d=cOrd, r=i)
        for j in range(1, ncol + 1):
            c = wm.cell(i, j)
            c.font = F(bold=L(j) in (cMin, cMax), color="0000FF" if L(j) == cOn else "000000")
            c.border = Border(bottom=Side(style="thin", color="D0D4DA"))
            if j > 2 and L(j) != cAct:
                c.alignment = Alignment(horizontal="center")
            if i % 2 == 0:
                c.fill = band
    last = 5 + len(lines)
    tr = last + 1
    wm.cell(tr, 2, "Totals (units)").font = F(bold=True)
    for k in range(n):
        col = L(3 + 2 * k)
        wm["{}{}".format(col, tr)] = "=SUM({0}6:{0}{1})".format(col, last)
    for col in (cMin, cMax, cOn, cOrd, cOver):
        wm["{}{}".format(col, tr)] = "=SUM({0}6:{0}{1})".format(col, last)
    for j in range(1, ncol + 1):
        c = wm.cell(tr, j)
        c.font = F(bold=True)
        c.alignment = Alignment(horizontal="center")
        c.border = Border(top=Side(style="medium", color=SL))
    s0 = tr + 2
    for k, (a, f) in enumerate([("Lines below Min right now", '=COUNTIF({0}6:{0}{1},"Below Min now - order")'),
                                ("Lines to top up to Max", '=COUNTIF({0}6:{0}{1},"Top up to Max")'),
                                ("Lines already at or over Max", '=COUNTIF({0}6:{0}{1},"Stocked to Max")'),
                                ("Lines with no use in these shuts", '=COUNTIF({0}6:{0}{1},"No use*")')]):
        wm.cell(s0 + k, 2, a).font = F(bold=True)
        c = wm.cell(s0 + k, 3, f.format(cAct, last))
        c.font = F(bold=True)
        c.alignment = Alignment(horizontal="center")
    wm.cell(s0 + 4, 2, "Units to order to reach Max").font = F(bold=True)
    wm.cell(s0 + 4, 3, "={}{}".format(cOrd, tr)).font = F(bold=True)
    notes = ["How it is worked out (settings on the Inputs tab):",
             "Per day = a shut's units / its shift days. Avg per day = the average of the shuts' per-day figures, so a big shut and a small shut count equally.",
             "MIN = the bigger of: the busiest single day in any of these shuts, or avg per day x days of cover (rounded up). When the shelf drops to Min, reorder.",
             "MAX = the bigger of: Min, or avg per day x November counter days (rounded up).",
             "No use = no draws in any of these shuts: Min and Max 0, hold what is there and do not reorder.",
             "Assumes November runs at the average pace of these shuts. A line that ran out in a past shut may have needed more than it shows."]
    for k, t in enumerate(notes):
        wm.cell(s0 + 6 + k, 1, t).font = F(size=9, bold=(k == 0), italic=(k > 0), color=SL)
    wm.column_dimensions["A"].width = 17
    wm.column_dimensions["B"].width = 50
    for j in range(3, ncol + 1):
        wm.column_dimensions[L(j)].width = 9.5
    wm.column_dimensions[cAct].width = 34
    wm.freeze_panes = "C6"
    wm.auto_filter.ref = "A5:{}{}".format(cAct, last)
    wm.conditional_formatting.add("A6:{}{}".format(cAct, last), FormulaRule(
        formula=['${}6="Below Min now - order"'.format(cAct)], fill=PatternFill("solid", fgColor="FCD9C5"),
        font=Font(name="Inter", bold=True, color="9C3A00")))
    wm.page_setup.orientation = "landscape"
    wm.sheet_properties.pageSetUpPr.fitToPage = True
    wm.page_setup.fitToWidth = 1
    wm.page_setup.fitToHeight = 0
    wm.print_title_rows = "5:5"
    wm.oddFooter.center.text = "Author: Andrew Fisher | POWERED BY SITEIQ   ·   Page &P of &N"
    wb.properties.creator = "Andrew Fisher"
    wb.save(out)
    return [(name, len(span), sum(sum(c.values()) for c in by.values())) for name, info, by, span, *_ in data]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("current")
    ap.add_argument("--shut", action="append", required=True, help='"Name=path to SALES_STOCK.xlsx"')
    ap.add_argument("--cover", type=int, default=2)
    ap.add_argument("--nov-days", type=int, default=7)
    a = ap.parse_args(argv)
    shuts = [tuple(x.split("=", 1)) for x in a.shut]
    for name, days, units in build(a.out, a.current, shuts, a.nov_days, a.cover):
        print("  {:<16} {:>3} shift days  {:>6,.0f} units drawn".format(name, days, units))
    print("Min/Max   " + a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
