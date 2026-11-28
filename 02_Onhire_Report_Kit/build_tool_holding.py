#!/usr/bin/env python3
"""Tooling holding levels from past shuts' SiteIQ TRANSACTIONS pulls.
Author: Andrew Fisher | POWERED BY SITEIQ.

    python build_tool_holding.py OUT.xlsx CURRENT_RENTAL_STOCK.xlsx \
        --shut "Feb-Mar 2026=PATH" --shut "July 2026=PATH" [--part "Oct 2025=PATH"]

For every kind of tool (by description) it finds the most that were out at
once in each shut, from each issue and return time. MIN is the most out at
once in any shut; the suggested holding adds a buffer on top (Inputs tab).
It only ever suggests adding or keeping stock - a tool that was not drawn
is kept, because the whole fleet earns its keep on site. No prices.
"""
import argparse
import collections
import datetime as dt
import sys

import openpyxl
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L


def _sheet(wb, name):
    if name not in wb.sheetnames:
        return []
    rows = [r for r in wb[name].iter_rows(values_only=True) if any(c not in (None, "") for c in r)]
    if not rows:
        return []
    head = [str(c or "").strip() for c in rows[0]]
    return [dict(zip(head, r)) for r in rows[1:]]


def _ref(wb):
    rows = list(wb["REFERENCE_INFO"].iter_rows(min_row=1, max_row=2, values_only=True))
    return dict(zip([str(c or "").strip().upper() for c in rows[0]], rows[1]))


def _ts(d, t):
    d, t = str(d or "").strip(), str(t or "").strip()
    if not d:
        return None
    for fd in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            day = dt.datetime.strptime(d[:10], fd).date()
            break
        except ValueError:
            day = None
    if day is None:
        return None
    for ft in ("%H:%M:%S", "%I:%M %p", "%H:%M"):
        try:
            return dt.datetime.combine(day, dt.datetime.strptime(t, ft).time())
        except ValueError:
            pass
    return dt.datetime.combine(day, dt.time(0, 0))


def _key(desc):
    return " ".join(str(desc or "").split()).upper()


def shut_peaks(path):
    """{tool: (most out at once, times issued)} and the window, from one pull."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ref = _ref(wb)
    a, b = [x.strip() for x in str(ref.get("REPORT_PERIOD", "")).split(" - ")]
    lo = dt.datetime.strptime(a, "%d/%m/%Y %H:%M:%S")
    hi = dt.datetime.strptime(b, "%d/%m/%Y %H:%M:%S")
    seen, events, issued, desc = set(), collections.defaultdict(list), collections.Counter(), {}
    for sheet in ("TRANSACTION_WITHOUT_CHARGES", "CUSTOMER_CONTRACTOR_EQUIP"):
        for r in _sheet(wb, sheet):
            tid = r.get("TRANSACTION_ID")
            if tid in seen or str(r.get("PRODUCT_CATEGORY", "")).strip().lower() == "consumable":
                continue
            seen.add(tid)
            k = _key(r.get("SKU/ITEM DESCRIPTION"))
            if not k:
                continue
            start = _ts(r.get("TRAN_START_DATE"), r.get("TRAN_START_TIME"))
            if not start:
                continue
            end = _ts(r.get("TRAN_END_DATE"), r.get("TRAN_END_TIME")) or hi
            q = float(r.get("QUANTITY") or 1)
            events[k].append((max(start, lo), q))
            events[k].append((min(end, hi), -q))
            issued[k] += q
            desc.setdefault(k, " ".join(str(r.get("SKU/ITEM DESCRIPTION")).split()))
    peaks = {}
    for k, ev in events.items():
        cur = peak = 0
        for _, d in sorted(ev, key=lambda e: (e[0], e[1])):
            cur += d
            peak = max(peak, cur)
        peaks[k] = (int(peak), int(issued[k]))
    wb.close()
    return {"from": lo, "to": hi, "pulled": ref.get("REQUESTED_DATE/TIME (LOCAL TIME)", ""), "peaks": peaks, "desc": desc}


def on_site(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ref = _ref(wb)
    rows = _sheet(wb, "RENTAL_STOCK")
    out = collections.defaultdict(lambda: {"site": 0, "ready": 0, "owner": collections.Counter(), "family": collections.Counter(), "desc": ""})
    for r in rows:
        k = _key(r.get("ITEM_DESCRIPTION"))
        if not k:
            continue
        o = out[k]
        o["site"] += 1
        o["ready"] += 1   # every item on site counts as ready (Failed Baseplan is treated as active - Andrew, 26 Nov 2026)
        owner = str(r.get("OWNER", "")).strip()
        o["owner"]["Coates" if "COATES" in owner.upper() or "DYNO" in owner.upper() else "MMG"] += 1
        o["family"][" ".join(str(r.get("PRODUCT_FAMILY") or "").split()).title()] += 1
        o["desc"] = o["desc"] or " ".join(str(r.get("ITEM_DESCRIPTION")).split())
    wb.close()
    return ref.get("REQUESTED_DATE/TIME (LOCAL TIME)", ""), out


def build(out, rental, shuts, parts, buffer=0.2):
    asat, site = on_site(rental)
    data = [(n, shut_peaks(p), False) for n, p in shuts] + [(n, shut_peaks(p), True) for n, p in parts]
    keys = set(site)
    for _, d, _ in data:
        keys |= set(d["peaks"])
    most = lambda k: max([d["peaks"].get(k, (0, 0))[0] for _, d, _ in data] or [0])
    lines = sorted(keys, key=lambda k: (-most(k), -(site[k]["site"] if k in site else 0), k))

    SL, OR = "2A313C", "F26222"
    F = lambda **kw: Font(name="Inter", size=kw.pop("size", 10), **kw)
    slate, orange = PatternFill("solid", fgColor=SL), PatternFill("solid", fgColor=OR)
    inp, band = PatternFill("solid", fgColor="FFF2CC"), PatternFill("solid", fgColor="F4F5F7")
    src = "   ·   ".join("{}{}: {} to {}".format(n, " (part)" if part else "", d["from"].strftime("%d %b %Y %H:%M"),
                                                   d["to"].strftime("%d %b %Y %H:%M")) for n, d, part in data)
    wb = openpyxl.Workbook()

    def head(ws, title, sub, ncol):
        ws.sheet_view.showGridLines = False
        for c in range(1, ncol + 1):
            ws.cell(1, c).fill = slate
            ws.cell(2, c).fill = orange
        ws["A1"] = title
        ws["A1"].font = F(size=14, bold=True, color="FFFFFF")
        ws["A2"] = sub
        ws["A2"].font = F(size=9, bold=True, color="FFFFFF")
        ws["A3"] = "Author: Andrew Fisher | POWERED BY SITEIQ   ·   On site: SiteIQ pull {}   ·   Shuts (TRANSACTIONS windows): {}".format(asat, src)
        ws["A3"].font = F(size=8, italic=True, color="5A6270")
        ws.row_dimensions[1].height = 26

    wi = wb.active
    wi.title = "Inputs"
    head(wi, "TOOLING HOLDING - SETTINGS", "Change the yellow cell - every suggested holding on the Holding tab follows it", 3)
    for j, v in enumerate(("Setting", "Value", "Where it comes from"), 1):
        c = wi.cell(5, j, v)
        c.font = F(bold=True, color="FFFFFF")
        c.fill = slate
    wi["A6"], wi["B6"], wi["C6"] = "Buffer on top of the most out at once", buffer, \
        "ASSUMPTION - spares for tags-out, failed tests and a busier shut. Rounded to the nearest whole tool, so a tool drawn once or twice needs no spare."
    wi["A6"].font = F(bold=True)
    wi["B6"].font = F(bold=True, color="0000FF")
    wi["B6"].fill = inp
    wi["B6"].number_format = "0%"
    wi["B6"].alignment = Alignment(horizontal="center")
    wi["C6"].font = F(size=9, color="5A6270")
    wi.column_dimensions["A"].width = 38
    wi.column_dimensions["B"].width = 10
    wi.column_dimensions["C"].width = 100

    ws = wb.create_sheet("Holding", 0)
    hm = ["Tool", "Owner", "Family", "On site now", "Ready now"]
    for n, d, part in data:
        hm += ["{}{} most out at once".format(n, " (part)" if part else ""), "{}{} times issued".format(n, " (part)" if part else "")]
    hm += ["MIN - keep at least", "SUGGESTED HOLDING", "Add", "Action"]
    ncol = len(hm)
    head(ws, "MMG TOOLING - WHAT TO HOLD ON SITE",
         "MIN = the most of each tool out at once in any past shut. Suggested holding adds the buffer. It only ever suggests adding or keeping stock.", ncol)
    for j, v in enumerate(hm, 1):
        c = ws.cell(5, j, v)
        c.font = F(bold=True, color="FFFFFF")
        c.fill = orange if v in ("MIN - keep at least", "SUGGESTED HOLDING") else slate
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    ws.row_dimensions[5].height = 46
    base = 6 + 2 * len(data)
    cMin, cHold, cAdd, cAct = L(base), L(base + 1), L(base + 2), L(base + 3)
    for i, k in enumerate(lines, 6):
        s = site.get(k)
        name = (s["desc"] if s else None) or next((d["desc"][k] for _, d, _ in data if k in d["desc"]), k)
        ws.cell(i, 1, name)
        ws.cell(i, 2, s["owner"].most_common(1)[0][0] if s else "Not on site now - used before")
        ws.cell(i, 3, s["family"].most_common(1)[0][0] if s else "")
        ws.cell(i, 4, s["site"] if s else 0)
        ws.cell(i, 5, s["ready"] if s else 0)
        peaks = []
        for j, (n, d, part) in enumerate(data):
            p, t = d["peaks"].get(k, (0, 0))
            ws.cell(i, 6 + 2 * j, p)
            ws.cell(i, 7 + 2 * j, t)
            peaks.append("{}{}".format(L(6 + 2 * j), i))
        ws["{}{}".format(cMin, i)] = "=MAX({})".format(",".join(peaks))
        ws["{}{}".format(cHold, i)] = "=IF({m}{r}=0,0,ROUND({m}{r}*(1+Inputs!$B$6),0))".format(m=cMin, r=i)
        ws["{}{}".format(cAdd, i)] = "=MAX(0,{h}{r}-D{r})".format(h=cHold, r=i)
        ws["{}{}".format(cAct, i)] = ('=IF({a}{r}>0,"Add "&{a}{r},IF({m}{r}=0,"Keep - not drawn in these shuts",'
                                      '"Holding is enough"))').format(a=cAdd, m=cMin, r=i)
        for j in range(1, ncol + 1):
            c = ws.cell(i, j)
            c.font = F(bold=L(j) in (cMin, cHold), color="0000FF" if j in (4, 5) else "000000")
            c.border = Border(bottom=Side(style="thin", color="D0D4DA"))
            if j > 3 and L(j) != cAct:
                c.alignment = Alignment(horizontal="center")
            if i % 2 == 0:
                c.fill = band
    last = 5 + len(lines)
    s0 = last + 2
    for n_, (a, f) in enumerate([("Tools to add to", '=COUNTIF({0}6:{0}{1},"Add*")'),
                                 ("Units to add", "=SUM({}6:{}{})".format(cAdd, cAdd, last)),
                                 ("Tools holding enough", '=COUNTIF({0}6:{0}{1},"Holding is enough")'),
                                 ("Tools kept, not drawn in these shuts", '=COUNTIF({0}6:{0}{1},"Keep*")')]):
        ws.cell(s0 + n_, 1, a).font = F(bold=True)
        c = ws.cell(s0 + n_, 4, f.format(cAct, last) if "{0}" in f else f)
        c.font = F(bold=True)
        c.alignment = Alignment(horizontal="center")
    notes = ["How it is worked out:",
             "Most out at once = the highest number of that tool on hire at the same moment, from each issue and return time in the shut's TRANSACTIONS. A tool still out at the end of the window counts as out to the end.",
             "MIN = the most out at once in any of these shuts. SUGGESTED HOLDING = MIN plus the buffer on the Inputs tab, rounded to the nearest whole tool.",
             "Add = how many more to bring to site to reach the suggested holding. Nothing here suggests taking stock off site: a tool not drawn is kept.",
             "(part) = a pull from partway through that shut; its figures are a floor, not the whole shut."]
    for n_, t in enumerate(notes):
        ws.cell(s0 + 5 + n_, 1, t).font = F(size=9, bold=(n_ == 0), italic=(n_ > 0), color=SL)
    ws.column_dimensions["A"].width = 46
    ws.column_dimensions["B"].width = 10
    ws.column_dimensions["C"].width = 22
    for j in range(4, ncol + 1):
        ws.column_dimensions[L(j)].width = 10.5
    ws.column_dimensions[cAct].width = 30
    ws.freeze_panes = "B6"
    ws.auto_filter.ref = "A5:{}{}".format(cAct, last)
    ws.conditional_formatting.add("A6:{}{}".format(cAct, last), FormulaRule(
        formula=['LEFT(${}6,3)="Add"'.format(cAct)], fill=PatternFill("solid", fgColor="FCD9C5"),
        font=Font(name="Inter", bold=True, color="9C3A00")))
    ws.page_setup.orientation = "landscape"
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.print_title_rows = "5:5"
    ws.oddFooter.center.text = "Author: Andrew Fisher | POWERED BY SITEIQ   ·   Page &P of &N"
    wb.properties.creator = "Andrew Fisher"
    wb.save(out)
    return [(n, part, d["from"], d["to"], len(d["peaks"]), sum(t for _, t in d["peaks"].values())) for n, d, part in data]


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("rental")
    ap.add_argument("--shut", action="append", default=[])
    ap.add_argument("--part", action="append", default=[])
    ap.add_argument("--buffer", type=float, default=0.2)
    a = ap.parse_args(argv)
    sp = lambda xs: [tuple(x.split("=", 1)) for x in xs]
    for n, part, lo, hi, tools, issued in build(a.out, a.rental, sp(a.shut), sp(a.part), a.buffer):
        print("  {:<14}{:<7} {} to {}  {:>4} tools  {:>5} issues".format(n, " (part)" if part else "", lo.strftime("%d %b %Y"), hi.strftime("%d %b %Y"), tools, issued))
    print("Holding   " + a.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
