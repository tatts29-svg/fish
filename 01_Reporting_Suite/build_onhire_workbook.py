#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | ON-HIRE WORKBOOK - every tab, built from today's exports
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  The shutdown on-hire workbook, rebuilt from the SiteIQ exports for
#  whichever job this computer is running (57_SWITCH_JOB.bat).
#
#  Twelve tabs, and every one of them works:
#
#    Cover                    what this is, what fed it, the headlines
#    Company Summary          per company: tooling, consumables, total
#    Detailed Onhire          every item out right now, who has it
#    Tooling Transactions     every tooling issue and return
#    Tooling Utilisation      per item type: turns, rating, what to do
#    Coates Tooling           the Coates-owned fleet on site
#    Consumable Transactions  every consumable issued
#    Consumables Available    what's left on the shelf
#    Coates Stock             the fleet with its on-hire dates
#    Consumable Utilisation   per line: usage, rating, what to do
#    Coates Labour            the shift roster - CARRIED OVER, not touched
#    Cost Breakdown           the day-by-day cost - CARRIED OVER, not touched
#
#  Two of those tabs are Andrew's own typing - the labour roster and
#  the cost breakdown. They are read out of the existing workbook and
#  written back exactly as they were, formulas and all. Nothing typed
#  by hand is ever recalculated, overwritten or "tidied".
#
#  The existing workbook is never written to. It carries macros, a
#  logo and live query connections that Python cannot round-trip
#  safely, so it stays exactly as it is and a clean dated workbook is
#  built alongside it.
#
#  Output:  <job reports>\<today>\<Job> On-Hire Workbook - <date>.xlsx
#      and  <job folder>\<Job>_Onhire_Workbook_LATEST.xlsx
# =====================================================================

import datetime as dt
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import report_paths                                   # noqa: E402
import site_config                                    # noqa: E402

try:
    import openpyxl
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    print("openpyxl is not installed. Run any numbered button once and it "
          "will put it on for you, or: pip install openpyxl")
    sys.exit(1)

# ---- the Coates look -------------------------------------------------
ORANGE = "FFF26222"
ORANGE_ALT = "FFFA4600"        # the shade the existing workbook uses
NEAR_BLACK = "FF1D1D1B"
WHITE = "FFFFFFFF"
GREY = "FF8B9099"
BAND_ROW_H = 26

TITLE_FONT = Font(name="Calibri", size=14, bold=True, color=WHITE)
HDR_FONT = Font(name="Calibri", size=11, bold=True, color=WHITE)
BODY_FONT = Font(name="Calibri", size=11)
TITLE_FILL = PatternFill("solid", fgColor=NEAR_BLACK)
HDR_FILL = PatternFill("solid", fgColor=ORANGE_ALT)
THIN = Side(style="thin", color="FFD9D9D9")
CELL_BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

DATE_FMT = "dd/mm/yyyy"
TIME_FMT = "hh:mm"
PCT_FMT = "0.0%"
MONEY_FMT = "$#,##0.00"
INT_FMT = "#,##0"

#  Hand-typed tabs. Read out of the old workbook, written back as-is.
CARRIED_OVER = ("Coates Labour", "Cost Breakdown")


# =====================================================================
#  Reading the exports
# =====================================================================
def _rows(path, sheet):
    """A sheet as a list of dicts, keyed on its header row. Blank rows
    dropped - SiteIQ pads its exports out with them."""
    if not path or not os.path.isfile(path):
        return []
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        if sheet not in wb.sheetnames:
            return []
        ws = wb[sheet]
        it = ws.iter_rows(values_only=True)
        try:
            head = next(it)
        except StopIteration:
            return []
        hdr = [str(c or "").strip() for c in head]
        out = []
        for r in it:
            if not any(c not in (None, "") for c in r):
                continue
            out.append(dict(zip(hdr, r)))
        return out
    finally:
        try:
            wb.close()
        except Exception:
            pass


def _s(v):
    """A cell as clean text."""
    return "" if v is None else str(v).strip()


def _n(v):
    """A cell as a number. SiteIQ ships numbers as text more often than
    not, so never trust the type."""
    if v is None or v == "":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", "").replace("$", "").strip())
    except ValueError:
        return 0.0


def _date(v):
    """A cell as a date. SiteIQ mixes real dates with dd/mm/yyyy text
    inside the same column."""
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    t = _s(v)
    if not t:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S",
                "%d/%m/%Y %I:%M %p", "%Y-%m-%d %H:%M:%S"):
        try:
            return dt.datetime.strptime(t, fmt).date()
        except ValueError:
            continue
    return None


# =====================================================================
#  Usage ratings - the rules, written down
# =====================================================================
#  Tooling is rated on TURNS: how many times each unit went out.
#  One item that went out five times is working; five items that went
#  out once each are sitting there. Utilisation on its own can't tell
#  those apart, which is why the old sheet had a line rated "Low Use"
#  on 36 transactions and another rated "Good Use" on one.
def tooling_rating(transactions, total_qty, utilisation):
    turns = (transactions / total_qty) if total_qty else 0.0
    if turns <= 0:
        return "No Use", "Review / Reduce"
    if turns < 1:
        return "Low Use", "Keep Stock"
    if turns < 2:
        if utilisation >= 0.8:
            return "Good Use", "Monitor / Increase"
        return "Good Use", "Keep Stock"
    return "High Demand", "Increase Stock"


#  Consumables are rated on how much of the position has gone out.
def consumable_rating(usage):
    if usage <= 0:
        return "No Use", "Review / Reduce"
    if usage < 0.4:
        return "Low Use", "Keep Stock"
    if usage < 0.8:
        return "Good Use", "Keep Stock"
    return "High Demand", "Increase Stock"


# =====================================================================
#  Sheet writing
# =====================================================================
def band(ws, title, ncols):
    """The orange-on-black title strip across the top of every tab."""
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=max(ncols, 1))
    c = ws.cell(row=1, column=1, value=title)
    c.font = TITLE_FONT
    c.fill = TITLE_FILL
    c.alignment = Alignment(vertical="center", indent=1)
    ws.row_dimensions[1].height = BAND_ROW_H


def sheet(wb, name, title, columns, rows, widths=None, formats=None):
    """One data tab: title strip, header row, the rows, frozen panes and
    a filter. `formats` maps column index (0-based) to a number format."""
    ws = wb.create_sheet(name)
    band(ws, title, len(columns))
    for i, col in enumerate(columns, start=1):
        c = ws.cell(row=2, column=i, value=col)
        c.font = HDR_FONT
        c.fill = HDR_FILL
        c.alignment = Alignment(vertical="center", wrap_text=True)
    ws.row_dimensions[2].height = 30

    for r, row in enumerate(rows, start=3):
        for i, v in enumerate(row, start=1):
            c = ws.cell(row=r, column=i, value=v)
            c.font = BODY_FONT
            c.border = CELL_BORDER
            fmt = (formats or {}).get(i - 1)
            if fmt:
                c.number_format = fmt

    for i, col in enumerate(columns, start=1):
        letter = get_column_letter(i)
        if widths and (i - 1) in widths:
            ws.column_dimensions[letter].width = widths[i - 1]
        else:
            longest = max([len(str(col))]
                          + [len(_s(r[i - 1])) for r in rows[:400]] or [10])
            ws.column_dimensions[letter].width = min(max(longest + 2, 11), 60)

    ws.freeze_panes = "A3"
    if rows:
        ws.auto_filter.ref = "A2:{}{}".format(
            get_column_letter(len(columns)), len(rows) + 2)
    #  An empty tab still says so out loud rather than looking broken.
    if not rows:
        c = ws.cell(row=3, column=1,
                    value="Nothing to show for this pull - no rows in the "
                          "export matched this tab.")
        c.font = Font(name="Calibri", size=11, italic=True, color=GREY)
    return ws


# =====================================================================
#  The tabs
# =====================================================================
def build(base=HERE, when=None):
    s = site_config.site(base=base)
    when = when or dt.date.today()
    asat = dt.datetime.now()

    def export(stem):
        return report_paths.find_export(base, stem + "*.xlsx")

    p_rental = export("RENTAL_STOCK")
    p_sales = export("SALES_STOCK")
    p_trans = export("TRANSACTIONS")
    p_stock = export("STOCKTAKE")
    sources = [p for p in (p_rental, p_sales, p_trans, p_stock) if p]

    missing = [n for n, p in (("RENTAL_STOCK", p_rental),
                              ("SALES_STOCK", p_sales),
                              ("TRANSACTIONS", p_trans)) if not p]
    if missing:
        print("  STOP | These exports are not in {}:".format(
            os.path.relpath(s.data_dirs(base)[0], base)))
        for m in missing:
            print("       - " + m)
        print("       Pull them out of SiteIQ, save them there, run again.")
        return 1

    #  Right files, right job?
    for p in sources:
        ok, why = site_config.belongs_to_live_job(p, base)
        if not ok:
            print("  STOP | " + why)
            return 1

    rental = _rows(p_rental, "RENTAL_STOCK")
    sales = _rows(p_sales, "SALES_STOCK")
    stocktake = _rows(p_stock, "STOCKTAKE") if p_stock else []

    #  SiteIQ splits transactions across two sheets and which one a job
    #  fills depends on whether charging is switched on. Weipa's land in
    #  TRANSACTION_WITHOUT_CHARGES, K2's in TRANSACTION_CHARGES. Read
    #  both and de-duplicate on the transaction number, so the tabs fill
    #  either way instead of coming out empty on one job.
    tw = []
    seen = set()
    for sheet_name in ("TRANSACTION_CHARGES", "TRANSACTION_WITHOUT_CHARGES"):
        for r in _rows(p_trans, sheet_name):
            tid = _s(r.get("TRANSACTION_ID"))
            if tid and tid in seen:
                continue
            if tid:
                seen.add(tid)
            tw.append(r)

    title = "Coates    |  {}  |  SHUTDOWN TOOLSTORE ON-HIRE REPORT" \
            "        Powered by SITEIQ".format(s.short or s.customer)

    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    # ---- the pieces every tab is cut from -----------------------------
    onhire = [r for r in rental if _s(r.get("ITEM_STATUS")) == "On Hire"]
    coates_owned = [r for r in rental
                    if _s(r.get("OWNER")).upper() == "COATES"]
    tooling_tx = [r for r in tw
                  if _s(r.get("PRODUCT_CATEGORY")).lower() != "consumable"]
    consumable_tx = [r for r in sales if _n(r.get("SALES_QUANTITY")) > 0]
    consumable_stock = [r for r in sales if not _s(r.get("COMPANY_NAME"))]

    tabs = []                      # (name, rows) for the cover index

    # ---- 1. Company Summary -------------------------------------------
    companies = {}
    for r in tw:
        co = _s(r.get("EMPLOYER_NAME")) or "(not named)"
        kind = ("CONSUMABLES"
                if _s(r.get("PRODUCT_CATEGORY")).lower() == "consumable"
                else "TOOLING")
        d = companies.setdefault(co, {
            "TOOLING": {"tx": 0, "qty": 0.0, "types": set(), "open": 0},
            "CONSUMABLES": {"tx": 0, "qty": 0.0, "types": set(), "open": 0}})
        a = d[kind]
        a["tx"] += 1
        a["qty"] += _n(r.get("QUANTITY"))
        a["types"].add(_s(r.get("SKU/ITEM DESCRIPTION")))
        if kind == "TOOLING" and not _s(r.get("TRAN_END_DATE")):
            a["open"] += 1

    live_onhire = {}
    for r in onhire:
        live_onhire[_s(r.get("COMPANY_NAME"))] = \
            live_onhire.get(_s(r.get("COMPANY_NAME")), 0) + 1

    summary_rows = []
    for co in sorted(companies):
        d = companies[co]
        tot = {"tx": 0, "qty": 0.0, "types": 0, "onh": 0, "open": 0}
        for kind in ("TOOLING", "CONSUMABLES"):
            a = d[kind]
            #  Consumables are sold, not returned - nothing is ever
            #  "still out", so those two columns are zero by definition.
            onh = live_onhire.get(co, 0) if kind == "TOOLING" else 0
            opn = a["open"] if kind == "TOOLING" else 0
            summary_rows.append([co, kind, a["tx"], int(a["qty"]),
                                 len([t for t in a["types"] if t]), onh, opn])
            tot["tx"] += a["tx"]
            tot["qty"] += a["qty"]
            tot["types"] += len([t for t in a["types"] if t])
            tot["onh"] += onh
            tot["open"] += opn
        summary_rows.append([co, "TOTAL", tot["tx"], int(tot["qty"]),
                             tot["types"], tot["onh"], tot["open"]])

    sheet(wb, "Company Summary", title,
          ["Company", "Type", "Transactions", "Qty", "Item Types",
           "Currently Onhire Qty", "Items Not Returned"],
          summary_rows,
          widths={0: 26, 1: 15, 2: 14, 3: 10, 4: 13, 5: 21, 6: 20},
          formats={2: INT_FMT, 3: INT_FMT, 4: INT_FMT, 5: INT_FMT, 6: INT_FMT})
    tabs.append(("Company Summary", len(summary_rows),
                 "Per company: what they took, what they still have"))

    # ---- 2. Detailed Onhire -------------------------------------------
    det = sorted(([_s(r.get("COMPANY_NAME")), _s(r.get("HIRER_NAME")),
                   _s(r.get("ITEM_NUMBER")), _s(r.get("ITEM_DESCRIPTION")),
                   _s(r.get("ITEM_STATUS")), _date(r.get("ON_HIRE_DATE")),
                   _s(r.get("ON_HIRE_TIME"))] for r in onhire),
                 key=lambda x: (x[0], x[1], x[3]))
    sheet(wb, "Detailed Onhire", title,
          ["COMPANY_NAME", "HIRER_NAME", "ITEM_NUMBER", "ITEM_DESCRIPTION",
           "ITEM_STATUS", "ON_HIRE_DATE", "ON_HIRE_TIME"],
          det, widths={0: 24, 1: 22, 2: 26, 3: 50, 4: 18, 5: 14, 6: 14},
          formats={5: DATE_FMT})
    tabs.append(("Detailed Onhire", len(det),
                 "Every item out right now and who has it"))

    # ---- 3. Tooling Transactions --------------------------------------
    tt = sorted(([_s(r.get("EMPLOYER_NAME")), _s(r.get("HIRER_NAME")),
                  _s(r.get("SKU/ITEM_NUMBER")),
                  _s(r.get("SKU/ITEM DESCRIPTION")),
                  _date(r.get("TRAN_START_DATE")), _s(r.get("TRAN_START_TIME")),
                  _date(r.get("TRAN_END_DATE")), _s(r.get("TRAN_END_TIME")),
                  _s(r.get("TRANSACTION_ID"))] for r in tooling_tx),
                 key=lambda x: (x[4] or dt.date.min, x[0]))
    sheet(wb, "Tooling Transactions", title,
          ["EMPLOYER_NAME", "HIRER_NAME", "SKU/ITEM_NUMBER",
           "SKU/ITEM DESCRIPTION", "TRAN_START_DATE", "TRAN_START_TIME",
           "TRAN_END_DATE", "TRAN_END_TIME", "TRANSACTION_ID"],
          tt, widths={0: 24, 1: 22, 2: 26, 3: 50, 4: 15, 5: 14, 6: 15,
                      7: 14, 8: 16},
          formats={4: DATE_FMT, 6: DATE_FMT})
    tabs.append(("Tooling Transactions", len(tt),
                 "Every tooling issue and return this period"))

    # ---- 4. Tooling Utilisation ---------------------------------------
    fleet = {}
    for r in rental:
        d = fleet.setdefault(_s(r.get("ITEM_DESCRIPTION")),
                             {"total": 0, "onhire": 0, "avail": 0})
        d["total"] += 1
        st = _s(r.get("ITEM_STATUS"))
        if st == "On Hire":
            d["onhire"] += 1
        elif st == "Available for Hire":
            d["avail"] += 1

    used = {}
    for r in tooling_tx:
        d = used.setdefault(_s(r.get("SKU/ITEM DESCRIPTION")),
                            {"tx": 0, "qty": 0.0, "co": set(), "hi": set(),
                             "first": None, "last": None})
        d["tx"] += 1
        d["qty"] += _n(r.get("QUANTITY"))
        if _s(r.get("EMPLOYER_NAME")):
            d["co"].add(_s(r.get("EMPLOYER_NAME")))
        if _s(r.get("HIRER_NAME")):
            d["hi"].add(_s(r.get("HIRER_NAME")))
        day = _date(r.get("TRAN_START_DATE"))
        if day:
            d["first"] = day if d["first"] is None else min(d["first"], day)
            d["last"] = day if d["last"] is None else max(d["last"], day)

    tu = []
    for desc in sorted(fleet):
        f = fleet[desc]
        u = used.get(desc, {"tx": 0, "qty": 0.0, "co": set(), "hi": set(),
                            "first": None, "last": None})
        util = (f["onhire"] / f["total"]) if f["total"] else 0.0
        rating, rec = tooling_rating(u["tx"], f["total"], util)
        tu.append([desc, f["total"], f["onhire"], f["avail"], util,
                   u["tx"], int(u["qty"]), len(u["co"]), len(u["hi"]),
                   u["first"], u["last"], rating, rec])
    sheet(wb, "Tooling Utilisation", title,
          ["ITEM_DESCRIPTION", "Total Qty", "Qty On Hire", "Qty Available",
           "Current Utilisation %", "Total Transactions", "Total Qty Issued",
           "No. of Companies Using Item", "No. of Hirers Using Item",
           "First Used Date", "Last Used Date", "Usage Rating",
           "Recommendation"],
          tu, widths={0: 55, 1: 11, 2: 12, 3: 13, 4: 15, 5: 14, 6: 14,
                      7: 16, 8: 16, 9: 14, 10: 14, 11: 14, 12: 20},
          formats={1: INT_FMT, 2: INT_FMT, 3: INT_FMT, 4: PCT_FMT,
                   5: INT_FMT, 6: INT_FMT, 7: INT_FMT, 8: INT_FMT,
                   9: DATE_FMT, 10: DATE_FMT})
    tabs.append(("Tooling Utilisation", len(tu),
                 "Per item type: turns, rating, what to do about it"))

    # ---- 5. Coates Tooling --------------------------------------------
    ct = sorted(([_s(r.get("ITEM_NUMBER")), _s(r.get("ITEM_DESCRIPTION")),
                  _s(r.get("ITEM_STATUS"))] for r in coates_owned),
                key=lambda x: (x[1], x[0]))
    sheet(wb, "Coates Tooling", title,
          ["ITEM_NUMBER", "ITEM_DESCRIPTION", "ITEM_STATUS"],
          ct, widths={0: 26, 1: 60, 2: 20})
    tabs.append(("Coates Tooling", len(ct),
                 "The Coates-owned fleet on this site"))

    # ---- 6. Consumable Transactions -----------------------------------
    ctx = sorted(([_s(r.get("COMPANY_NAME")), _s(r.get("HIRER")),
                   _s(r.get("SKU_DESCRIPTION")), _n(r.get("SALES_QUANTITY")),
                   _date(r.get("SALES_DATE")), _s(r.get("SALES_TIME"))]
                  for r in consumable_tx),
                 key=lambda x: (x[0], x[2]))
    sheet(wb, "Consumable Transactions", title,
          ["COMPANY_NAME", "HIRER", "SKU_DESCRIPTION", "SALES_QUANTITY",
           "SALES_DATE", "SALES_TIME"],
          ctx, widths={0: 24, 1: 24, 2: 50, 3: 16, 4: 14, 5: 14},
          formats={3: "#,##0.00", 4: DATE_FMT})
    tabs.append(("Consumable Transactions", len(ctx),
                 "Every consumable issued this period"))

    # ---- 7. Consumables Available -------------------------------------
    ca = sorted(([_s(r.get("SKU_NUMBER")), _s(r.get("SKU_DESCRIPTION")),
                  int(_n(r.get("AVAILABLE_QUANTITY")))]
                 for r in consumable_stock), key=lambda x: x[1])
    sheet(wb, "Consumables Available", title,
          ["SKU_NUMBER", "SKU_DESCRIPTION", "AVAILABLE_QUANTITY"],
          ca, widths={0: 20, 1: 50, 2: 22}, formats={2: INT_FMT})
    tabs.append(("Consumables Available", len(ca),
                 "What's left on the shelf"))

    # ---- 8. Coates Stock ----------------------------------------------
    cs = sorted(([_s(r.get("ITEM_NUMBER")), _s(r.get("ITEM_DESCRIPTION")),
                  _s(r.get("ITEM_STATUS")), _date(r.get("ON_HIRE_DATE")),
                  _s(r.get("ON_HIRE_TIME"))] for r in coates_owned),
                key=lambda x: (x[1], x[0]))
    sheet(wb, "Coates Stock", title,
          ["ITEM_NUMBER", "ITEM_DESCRIPTION", "ITEM_STATUS", "ON_HIRE_DATE",
           "ON_HIRE_TIME"],
          cs, widths={0: 26, 1: 60, 2: 20, 3: 15, 4: 14},
          formats={3: DATE_FMT})
    tabs.append(("Coates Stock", len(cs),
                 "The fleet with its on-hire dates"))

    # ---- 9. Consumable Utilisation ------------------------------------
    shelf, sold = {}, {}
    for r in sales:
        desc = _s(r.get("SKU_DESCRIPTION"))
        if not _s(r.get("COMPANY_NAME")):
            shelf[desc] = shelf.get(desc, 0.0) + _n(r.get("AVAILABLE_QUANTITY"))
        q = _n(r.get("SALES_QUANTITY"))
        if q > 0:
            d = sold.setdefault(desc, {"qty": 0.0, "co": set(), "hi": set(),
                                       "first": None, "last": None})
            d["qty"] += q
            if _s(r.get("COMPANY_NAME")):
                d["co"].add(_s(r.get("COMPANY_NAME")))
            if _s(r.get("HIRER")):
                d["hi"].add(_s(r.get("HIRER")))
            day = _date(r.get("SALES_DATE"))
            if day:
                d["first"] = day if d["first"] is None else min(d["first"], day)
                d["last"] = day if d["last"] is None else max(d["last"], day)

    cu = []
    for desc in sorted(set(list(shelf) + list(sold))):
        avail = shelf.get(desc, 0.0)
        d = sold.get(desc, {"qty": 0.0, "co": set(), "hi": set(),
                            "first": None, "last": None})
        position = avail + d["qty"]
        usage = (d["qty"] / position) if position else 0.0
        rating, rec = consumable_rating(usage)
        cu.append([desc, int(avail), int(d["qty"]), int(position), usage,
                   len(d["co"]), len(d["hi"]), d["first"], d["last"],
                   rating, rec])
    sheet(wb, "Consumable Utilisation", title,
          ["SKU_DESCRIPTION", "Qty Available", "Total Sales Qty",
           "Total Stock Position", "Usage %", "No. of Companies Using Item",
           "No. of Hirers Using Item", "First Sold Date", "Last Sold Date",
           "Usage Rating", "Recommendation"],
          cu, widths={0: 50, 1: 14, 2: 16, 3: 19, 4: 12, 5: 16, 6: 16,
                      7: 14, 8: 14, 9: 14, 10: 20},
          formats={1: INT_FMT, 2: INT_FMT, 3: INT_FMT, 4: PCT_FMT,
                   5: INT_FMT, 6: INT_FMT, 7: DATE_FMT, 8: DATE_FMT})
    tabs.append(("Consumable Utilisation", len(cu),
                 "Per line: usage, rating, what to do about it"))

    # ---- 10/11. the two hand-typed tabs, carried over verbatim --------
    carried, labour_total, cost_total = carry_over(wb, s, base, title)
    for name, n in carried:
        tabs.append((name, n, "Typed by hand - carried over untouched"))

    # ---- 12. Cover ----------------------------------------------------
    cover(wb, s, when, asat, tabs, sources, base,
          headline={
              "Items on hire now": len(onhire),
              "Companies with gear out": len([c for c in live_onhire
                                              if live_onhire[c]]),
              "Coates items on site": len(coates_owned),
              "Tooling transactions": len(tooling_tx),
              "Consumable issues": len(ctx),
              "Consumable lines on shelf": len(ca),
              "Items counted at last stocktake": len(stocktake),
              "Labour cost to date": labour_total,
              "Cost breakdown total": cost_total,
          })
    wb._sheets.insert(0, wb._sheets.pop(wb._sheets.index(wb["Cover"])))

    # ---- save ---------------------------------------------------------
    dirs = report_paths.out_dirs(base, when)
    stem = "{} On-Hire Workbook - {}".format(
        s.short or s.customer, when.strftime("%d %b %Y"))
    out = os.path.join(dirs["day"], stem + ".xlsx")
    wb.save(out)

    latest = os.path.join(base, os.path.dirname(s.workbook_glob or "") or ".",
                          "{}_Onhire_Workbook_LATEST.xlsx".format(
                              (s.short or s.customer).replace(" ", "_")))
    try:
        shutil.copyfile(out, latest)
    except OSError:
        latest = None

    report_paths.note_sources(dirs["day"], sources)

    print("=" * 66)
    print(" COATES | ON-HIRE WORKBOOK - {}".format(s.header_line))
    print("=" * 66)
    for name, n, _why in tabs:
        print("  {:<26} {:>6} rows".format(name, n))
    print("-" * 66)
    print("  Saved  {}".format(os.path.relpath(out, base)))
    if latest:
        print("  Latest {}".format(os.path.relpath(latest, base)))
    print("=" * 66)
    return 0


def carry_over(wb, s, base, title):
    """Copy Andrew's hand-typed tabs out of the existing workbook,
    values, formulas, dates and times exactly as he left them. If the
    old workbook isn't there the tabs are still created, headed and
    ready to type into - an empty tab that works beats a missing one."""
    src = s.workbook(base)
    carried, labour_total, cost_total = [], 0.0, 0.0

    old = None
    if src and os.path.isfile(src):
        try:
            old = openpyxl.load_workbook(src, data_only=False)
        except Exception as e:
            print("  WARN | Could not read {} ({}). The two hand-typed "
                  "tabs come through blank.".format(os.path.basename(src), e))

    #  The typed values, read a second time with formulas resolved, so
    #  the cover can show a total without re-implementing his sums.
    vals = None
    if src and os.path.isfile(src):
        try:
            vals = openpyxl.load_workbook(src, data_only=True)
        except Exception:
            vals = None

    for name in CARRIED_OVER:
        ws = wb.create_sheet(name)
        n = 0
        if old is not None and name in old.sheetnames:
            o = old[name]
            for row in o.iter_rows():
                filled = False
                for c in row:
                    if c.value is None:
                        continue
                    filled = True
                    nc = ws.cell(row=c.row, column=c.column, value=c.value)
                    nc.font = Font(name=c.font.name or "Calibri",
                                   size=c.font.sz or 11, bold=c.font.b)
                    if c.number_format:
                        nc.number_format = c.number_format
                if filled:
                    n += 1
            for rng in list(o.merged_cells.ranges):
                try:
                    ws.merge_cells(str(rng))
                except ValueError:
                    pass
            for k, dim in o.column_dimensions.items():
                if dim.width:
                    ws.column_dimensions[k].width = dim.width
        if n == 0:
            band(ws, title, 9)
            ws.cell(row=2, column=1,
                    value="Nothing typed in this tab yet - it is yours to "
                          "fill in and the rebuild never overwrites it.")
        else:
            #  Re-brand the title strip so it matches the other tabs.
            band(ws, title, max(5, ws.max_column))
        carried.append((name, n))

    #  Totals for the cover, straight off the values copy.
    if vals is not None:
        if "Coates Labour" in vals.sheetnames:
            #  Shift lines only. The sheet carries its own grand total on
            #  a row with no date in it - counting that as well doubles
            #  the labour bill, which is exactly what it did first go.
            o = vals["Coates Labour"]
            for row in o.iter_rows(min_row=6, min_col=1, max_col=9,
                                   values_only=True):
                if _date(row[0]) is None:
                    continue
                labour_total += _n(row[8])
        if "Cost Breakdown" in vals.sheetnames:
            o = vals["Cost Breakdown"]
            for row in o.iter_rows(min_row=3, max_row=19, min_col=3,
                                   max_col=5, values_only=True):
                for v in row:
                    cost_total += _n(v)
        try:
            vals.close()
        except Exception:
            pass
    if old is not None:
        try:
            old.close()
        except Exception:
            pass
    return carried, labour_total, cost_total


def cover(wb, s, when, asat, tabs, sources, base, headline):
    """The tab that was blank. Says what this workbook is, what fed it,
    the headline numbers, and how the two ratings are worked out - so
    nobody has to take the recommendations on trust."""
    ws = wb.create_sheet("Cover")
    ws.sheet_view.showGridLines = False
    band(ws, "Coates    |  {}  |  SHUTDOWN TOOLSTORE ON-HIRE REPORT"
             "        Powered by SITEIQ".format(s.short or s.customer), 6)

    def put(row, col, value, bold=False, size=11, color=None, fmt=None):
        c = ws.cell(row=row, column=col, value=value)
        c.font = Font(name="Calibri", size=size, bold=bold,
                      color=color or "FF000000")
        if fmt:
            c.number_format = fmt
        return c

    def rule(row, text):
        c = put(row, 1, text, bold=True, size=12, color=WHITE)
        c.fill = PatternFill("solid", fgColor=ORANGE_ALT)
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=6)
        return row + 1

    r = 3
    put(r, 1, s.customer, bold=True, size=20); r += 1
    put(r, 1, "{} · {}".format(s.job, s.location), size=13,
        color="FF595959"); r += 2
    put(r, 1, "As at"); put(r, 2, asat.strftime("%d %b %Y  %H:%M"), bold=True); r += 1
    put(r, 1, "Report date"); put(r, 2, when.strftime("%d %b %Y"), bold=True); r += 1
    put(r, 1, "Prepared by"); put(r, 2, s.author or "Andrew Fisher", bold=True); r += 1
    put(r, 1, "SiteIQ project"); put(r, 2, s.project_schedule or "-", bold=True); r += 2

    r = rule(r, "THE HEADLINES")
    for k, v in headline.items():
        put(r, 1, k)
        money = "cost" in k.lower()
        put(r, 2, round(v, 2) if money else int(v), bold=True,
            fmt=MONEY_FMT if money else INT_FMT)
        r += 1
    r += 1

    r = rule(r, "WHAT'S IN THIS WORKBOOK")
    put(r, 1, "Tab", bold=True); put(r, 2, "Rows", bold=True)
    put(r, 3, "What it tells you", bold=True); r += 1
    for name, n, why in tabs:
        put(r, 1, name)
        put(r, 2, n, fmt=INT_FMT)
        put(r, 3, why, color="FF595959")
        r += 1
    r += 1

    r = rule(r, "WHERE THE NUMBERS CAME FROM")
    for p in sources:
        put(r, 1, os.path.basename(p))
        put(r, 2, dt.datetime.fromtimestamp(os.path.getmtime(p))
            .strftime("%d %b %Y  %H:%M"), color="FF595959")
        r += 1
    r += 1

    r = rule(r, "HOW THE RATINGS ARE WORKED OUT")
    for line in [
        "Tooling is rated on TURNS - transactions divided by how many of",
        "that item are on site. One item that went out five times is",
        "working; five items that went out once each are sitting there.",
        "   no turns          No Use        Review / Reduce",
        "   under 1 turn      Low Use       Keep Stock",
        "   1 to 2 turns      Good Use      Keep Stock  (Monitor / Increase",
        "                                   if 80% or more are out right now)",
        "   2 turns or more   High Demand   Increase Stock",
        "",
        "Consumables are rated on how much of the position has gone out -",
        "sales divided by sales plus what's left on the shelf.",
        "   nothing sold      No Use        Review / Reduce",
        "   under 40%         Low Use       Keep Stock",
        "   40% to 80%        Good Use      Keep Stock",
        "   over 80%          High Demand   Increase Stock",
    ]:
        put(r, 1, line, color="FF404040")
        r += 1
    r += 1

    r = rule(r, "WHAT IS TYPED BY HAND")
    for line in [
        "Coates Labour and Cost Breakdown are yours. The rebuild reads",
        "them out of the previous workbook and writes them straight back -",
        "it never recalculates them and never overwrites your typing.",
        "Everything else on every other tab is built from the SiteIQ",
        "exports listed above, so a fresh pull refreshes the lot.",
    ]:
        put(r, 1, line, color="FF404040")
        r += 1

    for col, w in ((1, 46), (2, 24), (3, 52), (4, 12), (5, 12), (6, 12)):
        ws.column_dimensions[get_column_letter(col)].width = w
    return ws


def main(argv):
    when = None
    if len(argv) > 1:
        try:
            when = dt.datetime.strptime(argv[1], "%Y-%m-%d").date()
        except ValueError:
            print("Date must look like 2026-08-10. Leave it off for today.")
            return 1
    return build(HERE, when)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
