#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | BASEPLAN CHARGES TRACKER - the OTHER invoice stream
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  WHY (Andrew, 28 Jul 2026): some K2 gear is billed out of Baseplan,
#  not SiteIQ - radios, gas monitors, welders, the forklift, crib
#  fridges, and its own transport. "We wanna keep these costs seperate
#  from what ill invoice through SiteIQ... both invoices will have
#  seperate transport charges too."
#
#  THE RULES, exactly as Andrew set them:
#    - Start dates are right - trusted.
#    - End dates change all the time - Expected Term is treated as the
#      current plan, never as truth. Spend to date runs to TODAY.
#    - Rates are right - Rate 1 is the daily rate (the 70 radios at
#      $12.81 match the site rule to the cent).
#    - The Prebill column is NOT used - ignored entirely.
#    - Baseplan invoices CALENDAR MONTHLY - July bills to and including
#      31 Jul, August starts its own invoice. Every line is split by
#      month here so each invoice can be checked when it lands.
#    - Minimum Days (the crib fridges carry a 42-day minimum) is
#      honoured: a line never bills fewer days than its minimum, and
#      the minimum's overflow sits on the line's FIRST invoice month.
#
#  This stream NEVER mixes with SiteIQ numbers. The page says so on
#  every screen, and no total here feeds any SiteIQ report.
# =====================================================================
import datetime as dt
import io
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "Data_Baseplan")

import build_company_onhire_report as B
import report_paths

esc = B.esc
money = B.fmt_money


def find_pull():
    """Newest Baseplan export - Data_Baseplan\\, the suite folder, or
    Downloads - filed into Data_Baseplan\\ with the previous pull kept,
    dated. Same drop-and-go pattern as the SiteIQ exports."""
    cands = []
    for d in (DATA_DIR, HERE,
              os.path.join(os.path.expanduser("~"), "Downloads")):
        if not os.path.isdir(d):
            continue
        for n in os.listdir(d):
            if (n.lower().startswith("baseplan") and
                    n.lower().endswith(".xlsx") and
                    not n.startswith("~")):
                cands.append(os.path.join(d, n))
    if not cands:
        return None
    newest = max(cands, key=os.path.getmtime)
    os.makedirs(DATA_DIR, exist_ok=True)
    home = os.path.join(DATA_DIR, "BASEPLAN_CHARGES.xlsx")
    if os.path.abspath(newest) != os.path.abspath(home):
        if os.path.isfile(home):
            prev = os.path.join(DATA_DIR, "previous")
            os.makedirs(prev, exist_ok=True)
            stamp = dt.datetime.fromtimestamp(
                os.path.getmtime(home)).strftime("%Y%m%d_%H%M")
            shutil.copy2(home, os.path.join(
                prev, "{}_BASEPLAN_CHARGES.xlsx".format(stamp)))
        shutil.copy2(newest, home)
    return home


def _d(v):
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    s = str(v or "").strip()
    #  Every shape a date cell has been seen to take - Excel serial text
    #  aside, junk parses to None and the line is reported, not guessed.
    for f in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y",
              "%d/%m/%Y %H:%M", "%d/%m/%Y %I:%M %p", "%d/%m/%y"):
        try:
            return dt.datetime.strptime(s, f).date()
        except ValueError:
            continue
    return None


def _n(v):
    try:
        return float(str(v).replace(",", "").replace("$", ""))
    except (TypeError, ValueError):
        return 0.0


def load_lines(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    hdr = [str(c or "").strip() for c in rows[0]]
    ix = {h.upper(): i for i, h in enumerate(hdr)}

    def col(r, name):
        i = ix.get(name.upper())
        return r[i] if i is not None and i < len(r) else None

    out = []
    for r in rows[1:]:
        desc = str(col(r, "Description") or "").strip()
        item = str(col(r, "Item") or "").strip()
        if not desc and not item:
            continue
        out.append({
            "line": str(col(r, "Line") or "").strip(),
            "item": item,
            "desc": desc,
            "qty": _n(col(r, "Quantity")) or 1.0,
            "price": _n(col(r, "Price")),
            "rate": _n(col(r, "Rate 1")),
            "rate2": _n(col(r, "Rate 2")),
            "start": _d(col(r, "Start Date")),
            "term": _d(col(r, "Expected Term Date")),
            "min_days": int(_n(col(r, "Minimum Days"))),
            "code": str(col(r, "Sales Analysis Code") or "").strip().upper(),
            "supplier": str(col(r, "Supplier Sub Rental") or "").strip(),
            "serial": str(col(r, "Serial Number") or "").strip(),
        })
    return out


def incl_days(a, b):
    """Hire day counting, the suite rule: inclusive of both ends."""
    return max(0, (b - a).days + 1) if (a and b and b >= a) else 0


def overlap_days(a, b, m_first, m_last):
    """Inclusive days of [a..b] falling inside [m_first..m_last]."""
    lo = max(a, m_first)
    hi = min(b, m_last)
    return incl_days(lo, hi)


def month_span(d):
    first = d.replace(day=1)
    nxt = (first + dt.timedelta(days=32)).replace(day=1)
    return first, nxt - dt.timedelta(days=1)


def classify(x):
    if x["code"] == "GLST-FRI" or x["item"].upper() == "TRANSPORT":
        return "transport"
    if x["rate"] > 0 and x["start"]:
        return "hire"
    return "misc"


def build(today=None):
    today = today or dt.date.today()
    path = find_pull()
    if not path:
        print(" No Baseplan export found. Save the Baseplan pull as an")
        print(" .xlsx starting with 'Baseplan' into Downloads or this")
        print(" folder and run me again. Nothing was invented.")
        return 1
    lines = load_lines(path)
    if not lines:
        print(" The Baseplan file has no charge lines - nothing built.")
        return 1
    asof = dt.datetime.fromtimestamp(os.path.getmtime(path))
    date_tag = today.strftime("%Y-%m-%d")
    hire = [x for x in lines if classify(x) == "hire"]
    trans = [x for x in lines if classify(x) == "transport"]
    misc = [x for x in lines if classify(x) == "misc"]

    #  ---- the day and month maths, line by line ----------------------
    months = set()
    for x in hire:
        x["live"] = (x["term"] is None) or (x["term"] >= today)
        bill_to = min(today, x["term"]) if x["term"] else today
        x["days"] = incl_days(x["start"], bill_to)
        #  end of the line for invoice projection: the current plan
        #  (term), or today if the plan date has already passed
        x["proj_end"] = x["term"] if (x["term"] and x["term"] >= x["start"]) \
            else bill_to
        x["spend"] = x["qty"] * x["rate"] * x["days"]
        x["runrate"] = x["qty"] * x["rate"] if x["live"] else 0.0
        #  minimum-days overflow (crib gear carries a 42-day minimum):
        #  billed on top of actual days, attributed to the first month
        total_at_term = incl_days(x["start"], x["proj_end"])
        x["min_extra"] = max(0, x["min_days"] - total_at_term) \
            if x["min_days"] else 0
        x["by_month"] = {}
        d = x["start"]
        while d <= x["proj_end"]:
            mf, ml = month_span(d)
            months.add(mf)
            x["by_month"][mf] = {
                "todate": overlap_days(x["start"],
                                       min(bill_to, x["proj_end"]), mf, ml),
                "proj": overlap_days(x["start"], x["proj_end"], mf, ml),
            }
            d = ml + dt.timedelta(days=1)
    for x in trans + misc:
        x["spend"] = x["qty"] * x["price"]
        if x["start"]:
            months.add(x["start"].replace(day=1))
    months = sorted(months)

    hire_spend = sum(x["spend"] for x in hire)
    min_extra_total = sum(x["min_extra"] * x["qty"] * x["rate"] for x in hire)
    runrate = sum(x["runrate"] for x in hire)
    trans_spend = sum(x["spend"] for x in trans)
    misc_spend = sum(x["spend"] for x in misc)
    live_n = sum(1 for x in hire if x["live"])
    past_term = [x for x in hire if not x["live"]]

    #  ---- the page ---------------------------------------------------
    body = ("<div class='intro story'><b>THIS IS THE SEPARATE INVOICE - "
            "THE SECOND STREAM, NOT SITEIQ.</b> Nothing on this page "
            "appears on a SiteIQ invoice, and no SiteIQ number appears "
            "here. Transport on this page belongs to this invoice only - "
            "the SiteIQ stream carries its own. The separate invoice "
            "bills by calendar month (July bills to and including 31 "
            "Jul; August opens its own invoice), so every line below is "
            "split by month, ready to check each invoice when it lands. "
            "Start dates and rates are trusted from the pull; expected "
            "end dates change all the time and are treated as the "
            "current plan, never as truth.</div>")
    body += B.tiles_html([
        (("<span class='repl'>{}</span>".format(money(hire_spend))),
         "Hire spend to date"),
        (money(runrate) + "/day", "Daily run rate (live lines)",
         "a" if runrate else "g"),
        (money(trans_spend), "Transport (this invoice)"),
        (money(misc_spend), "One-off supply"),
        ("{}".format(live_n), "Lines on hire now"),
    ])

    #  ---- how the two streams can never double up --------------------
    #  (Andrew, 28 Jul 2026: "how are you supplying this info in the
    #  report to ensure we are not doubling up costs") - the answer
    #  lives ON the page, not in anyone's memory.
    body += "<h2>How this stream stays separate - no double-ups</h2>"
    body += (
        "<div class='intro'>"
        "<b>1. This page IS the separate-invoice list.</b> Every line "
        "below comes straight off the pull, run by run - nothing is "
        "remembered, nothing is assumed. What is not on this page bills "
        "through SiteIQ.<br>"
        "<b>2. On the SiteIQ side, sub-hired units are recognised by "
        "BARCODE</b> - the SUB prefix (SUBHARVEY welders) or a known "
        "supplier code (forklift FK505) - and carry <b>no rate in any "
        "SiteIQ total</b>: not the internal summary, not the plant "
        "report, nowhere. Coates machines with plain numeric or COA "
        "barcodes keep their SiteIQ rates - they are the other stream."
        "<br>"
        "<b>3. Radios and gas monitors are fleet rules</b>, headed 'on "
        "the separate invoice' on the internal summary and never added "
        "into its totals.<br>"
        "<b>4. The cross-check below proves it every run</b> - the "
        "invoice's quantities against the sub-marked units on the site "
        "register. Agreement reads green; any drift flashes amber the "
        "same morning it appears.<br>"
        "<b>New sub gear:</b> load it with a SUB-prefixed barcode and "
        "every rule above picks it up automatically - nothing to "
        "change anywhere.</div>")

    #  ---- month by month - the invoice check -------------------------
    body += "<h2>Invoice months - what each separate invoice should read</h2>"
    mrows = []
    for mf in months:
        ml = month_span(mf)[1]
        h_todate = sum(x["qty"] * x["rate"] * x["by_month"]
                       .get(mf, {}).get("todate", 0) for x in hire)
        h_proj = sum(x["qty"] * x["rate"] * x["by_month"]
                     .get(mf, {}).get("proj", 0) for x in hire)
        m_min = sum(x["min_extra"] * x["qty"] * x["rate"] for x in hire
                    if x["start"] and x["start"].replace(day=1) == mf)
        t_m = sum(x["spend"] for x in trans
                  if x["start"] and x["start"].replace(day=1) == mf)
        s_m = sum(x["spend"] for x in misc
                  if x["start"] and x["start"].replace(day=1) == mf)
        closed = ml < today
        mrows.append(
            "<tr><td><b>{m}</b>{tag}</td><td class='num'>{td}</td>"
            "<td class='num'>{pj}</td><td class='num'>{mn}</td>"
            "<td class='num'>{tr}</td><td class='num'>{ms}</td>"
            "<td class='num'><b>{tot}</b></td></tr>".format(
                m=mf.strftime("%B %Y"),
                tag=(" <span class='pill-done'>(bills to {})</span>"
                     .format(ml.strftime("%d %b")) if not closed else ""),
                td=money(h_todate), pj=money(h_proj), mn=money(m_min),
                tr=money(t_m), ms=money(s_m),
                tot=money(h_proj + m_min + t_m + s_m)))
    body += ("<table class='data'><thead><tr><th>Invoice month</th>"
             "<th class='num'>Hire to date</th>"
             "<th class='num'>Hire projected (to term)</th>"
             "<th class='num'>Minimum-term top-up</th>"
             "<th class='num'>Transport</th><th class='num'>Supply</th>"
             "<th class='num'>Invoice projection</th></tr></thead>"
             "<tbody>" + "".join(mrows) + "</tbody></table>")
    body += ("<div class='note'>\"Projected\" assumes live gear runs to "
             "its current expected term date (or month end). The end "
             "dates move - so will this number, and that is the point: "
             "run me the morning an invoice lands and compare.</div>")

    #  ---- the hire lines ---------------------------------------------
    body += "<h2>On hire on the separate invoice - line by line</h2>"
    rows_h = ""
    for x in sorted(hire, key=lambda x: -x["spend"]):
        rows_h += (
            "<tr><td>{d}{sn}</td><td>{sup}</td><td class='num'>{q:g}</td>"
            "<td class='num'>{r}</td><td class='num'>{sd}</td>"
            "<td class='num'>{ed}</td><td class='num'>{dy}</td>"
            "<td class='num'>{sp}</td></tr>").format(
            d=esc(x["desc"]),
            sn=(" <span style='color:#8B9099'>({})</span>"
                .format(esc(x["serial"]))
                if x["serial"] and x["serial"].lower() != "tba" else ""),
            sup=esc(x["supplier"] or "-"),
            q=x["qty"], r=money(x["rate"]) + "/day",
            sd=x["start"].strftime("%d %b") if x["start"] else "-",
            ed=("<b>{}</b>".format(x["term"].strftime("%d %b"))
                if x["live"] and x["term"] else
                x["term"].strftime("%d %b") if x["term"] else "open"),
            dy=(str(x["days"]) +
                ("<span class='repl'>min {}</span>".format(x["min_days"])
                 if x["min_extra"] else "")),
            sp="<span class='repl'>{}</span>".format(money(x["spend"])))
    body += ("<table class='data'><thead><tr><th>Item</th><th>Supplier"
             "</th><th class='num'>Qty</th><th class='num'>Rate</th>"
             "<th class='num'>Start</th><th class='num'>Expected end</th>"
             "<th class='num'>Days</th><th class='num'>Spend to date</th>"
             "</tr></thead><tbody>" + rows_h + "</tbody></table>")
    if past_term:
        body += ("<div class='note' style='border-left:4px solid #F2B01E'>"
                 "<b>{} line(s) past their expected end date</b> - {}. "
                 "Either it came back (good - the next pull should drop "
                 "it) or the end date needs pushing out in the hire system. "
                 "Worth a look before the invoice lands.</div>").format(
            len(past_term), "; ".join(
                "{} (ended {})".format(esc(x["desc"]),
                                       x["term"].strftime("%d %b"))
                for x in past_term[:6]))
    if min_extra_total:
        body += ("<div class='note'>Minimum-term top-up riding on the "
                 "crib gear: <b>{}</b> beyond actual days - a term of "
                 "the hire, not an error.</div>").format(money(min_extra_total))

    #  ---- transport + misc, each their own -----------------------------
    body += "<h2>Separate-invoice transport - this stream's own freight</h2>"
    if trans:
        body += ("<table class='data'><thead><tr><th>Charge</th>"
                 "<th class='num'>Qty</th><th class='num'>Rate</th>"
                 "<th class='num'>Date</th><th class='num'>Amount</th>"
                 "</tr></thead><tbody>" + "".join(
                     "<tr><td>{d}</td><td class='num'>{q:g}</td>"
                     "<td class='num'>{p}</td><td class='num'>{dt}</td>"
                     "<td class='num'>{a}</td></tr>".format(
                         d=esc(x["desc"]), q=x["qty"], p=money(x["price"]),
                         dt=x["start"].strftime("%d %b") if x["start"]
                         else "-", a=money(x["spend"]))
                     for x in trans) + "</tbody></table>")
    else:
        body += "<div class='note'>No transport charges in this pull.</div>"
    if misc:
        body += "<h2>One-off supply</h2>"
        body += ("<table class='data'><thead><tr><th>Item</th>"
                 "<th class='num'>Qty</th><th class='num'>Price</th>"
                 "<th class='num'>Amount</th></tr></thead><tbody>"
                 + "".join(
                     "<tr><td>{d}</td><td class='num'>{q:g}</td>"
                     "<td class='num'>{p}</td><td class='num'>{a}</td>"
                     "</tr>".format(d=esc(x["desc"]), q=x["qty"],
                                    p=money(x["price"]),
                                    a=money(x["spend"])) for x in misc)
                 + "</tbody></table>")

    #  ---- cross-check with what the site tracks ----------------------
    body += "<h2>Cross-check - the separate invoice v what we track on site</h2>"
    try:
        (items, _p, _mt, radio_fleet, plant, _infra, gas_fleet,
         _roh, _goh, _mb, _mt2) = B.load_rental()

        def _site_count(word):
            """Sub-hired units only - barcode SUB prefix or a known
            supplier code (the way Andrew showed, 28 Jul 2026). Coates
            machines with plain numeric barcodes are SiteIQ-charged and
            deliberately NOT counted against the separate invoice.
            Deduped on barcode - the same unit can appear in both the
            hire rows and the plant register."""
            seen = set()
            for it in list(items) + list(plant):
                if not B.is_sep_invoice(it):
                    continue
                d = (it.get("description", "") + " "
                     + it.get("desc0", "")).upper()
                if word in d:
                    seen.add(str(it.get("barcode") or id(it)).upper())
            return len(seen)

        def _bp_qty(word):
            return int(sum(x["qty"] for x in hire
                           if word in x["desc"].upper()))

        #  Radios compare against the BILLABLE fleet (the site rule caps
        #  billing at 70; spares above that are disclosed, unbilled) -
        #  comparing the invoice to the raw fleet count would flag the
        #  spares as a mismatch when they are the agreement working.
        _billable_radios = min(radio_fleet,
                               getattr(B, "RADIO_BILLABLE_CAP", radio_fleet))
        checks = [
            ("Radios (billable)", _bp_qty("RADIO"), _billable_radios),
            ("Gas monitors", _bp_qty("GAS MONITOR"), gas_fleet),
            #  "WELD" catches both spellings on site: the sub units say
            #  "Welding ...", the invoice says "Welder ..."
            ("Welders (sub-hired)", _bp_qty("WELDER"), _site_count("WELD")),
            ("Forklifts (sub-hired)", _bp_qty("FORKLIFT"),
             _site_count("FORKLIFT")),
        ]
        rows_c = ""
        for lab, bp, site in checks:
            ok = bp == site
            rows_c += ("<tr><td>{l}</td><td class='num'>{b}</td>"
                       "<td class='num'>{s}</td>"
                       "<td class='{c}'>{w}</td></tr>").format(
                l=lab, b=bp, s=site, c="g" if ok else "a",
                w=("MATCHES" if ok else
                   "CHECK - invoice says {}, site register says {}".format(
                       bp, site)))
        body += ("<table class='data'><thead><tr><th>Group</th>"
                 "<th class='num'>On the separate invoice</th>"
                 "<th class='num'>On the site register</th><th>Call</th>"
                 "</tr></thead><tbody>" + rows_c + "</tbody></table>")
        body += ("<div class='note'>Site side reads the SiteIQ "
                 "RENTAL_STOCK register - and for welders and forklifts "
                 "it counts <b>only the sub-hired units</b> (dashed "
                 "item numbers / SUB barcodes). Coates machines with "
                 "plain numeric IDs are SiteIQ-charged and belong to "
                 "the other stream, so they never muddy this check. A "
                 "mismatch is a conversation, not an accusation - but "
                 "if the site holds MORE sub units than this invoice "
                 "bills, something is out for free: check the pull "
                 "before the invoice lands.</div>")
    except Exception as exc:
        body += ("<div class='note'>Site register not readable on this "
                 "run ({}) - cross-check skipped, never guessed."
                 .format(esc(str(exc)[:80])))

    hero = ("{h} hire lines &bull; {t} transport charge{ts} &bull; "
            "run rate {rr}/day &bull; SEPARATE TO SITEIQ".format(
                h=len(hire), t=len(trans),
                ts="" if len(trans) == 1 else "s", rr=money(runrate)))
    limits = ("Read from the Baseplan pull ({f}, saved {ts}). Start "
              "dates and Rate 1 trusted as supplied; the Prebill column "
              "is ignored by instruction; expected end dates move and "
              "are shown as the current plan. Day counts are inclusive "
              "of both ends - the 70 radios at $12.81 reproduce "
              "Baseplan's own line total to the cent. Minimum-day terms "
              "are honoured and attributed to the line's first invoice "
              "month. This page never feeds a SiteIQ number and no "
              "SiteIQ charge appears here.").format(
        f=os.path.basename(path), ts=asof.strftime("%d %b %Y %H:%M"))
    B.emit_report(
        "Coates_K2_Separate_Invoice_{}".format(date_tag),
        "Separate Invoice Tracker",
        "The second invoice stream - monthly, separate to SiteIQ",
        body, hero,
        [B._e_note(esc(
            "{} hire lines on the separate invoice running at {}/day, {} to "
            "date plus {} transport. Split by invoice month in the "
            "attached tracker - it bills calendar months, separate to "
            "SiteIQ.".format(len(hire), money(runrate),
                             money(hire_spend), money(trans_spend))),
            "The second stream.")],
        limits,
        "Coates K2 - Separate Invoice Tracker - {}".format(
            today.strftime("%d %B %Y")),
        asof, dt.datetime.now(),
        "Baseplan charge export (the separate invoice) - NOT SiteIQ",
        report_tag="SEPINVOICE",
        pdf_attach_only=True)
    print("  Separate Invoice tracker: {} hire lines | spend to date {} | run "
          "rate {}/day | transport {} | SEPARATE stream".format(
              len(hire), money(hire_spend), money(runrate),
              money(trans_spend)))
    return 0


if __name__ == "__main__":
    sys.exit(build())
