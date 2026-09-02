#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=====================================================================
COATES CALIBRATION REGISTER - HOUSE-STYLE REPORT (the K2 look)
One run -> client-ready PDF + Outlook email, straight off the live
self-refreshing calibration register.
=====================================================================
Author: Andrew Fisher
The Coates Way - Operational Excellence - POWERED BY SITEIQ

WHAT THIS IS
  The calibration register finally gets a report of its own - the K2
  house style, same shell as the stocktake family. One run produces:

   1. Coates_Ampol_Calibration_K2STYLE.pdf   (THE report - the position,
      the due-soon list, the named chase list, the honest No Date story,
      and the register-health audit)
   2. Coates_Ampol_Calibration_OUTLOOK_SAFE.eml  (DRAFT - never sends)
      + Coates_Ampol_Calibration_EMAIL.html body
      + .draft.json so MAKE_OUTLOOK_DRAFTS keeps working.

WHERE THE NUMBERS COME FROM
  Ampol_Calibration_Register.xlsx in the suite's Data area - the live
  register that refreshes itself off SharePoint. Two sheets are read:
   - 'Live Register'  : every calibrated asset, its certificate, due
     date, days remaining, status, and where it is right now.
   - 'On Hire Audit'  : the register's own exception sweep of the wider
     on-hire fleet, with a Reason on every row.

DATA RULES
  The register's own arithmetic is used verbatim - status and days
  remaining are what the register calculated at its LAST REFRESH, and
  that timestamp is printed on every output alongside the file's saved
  time. Nothing is recalculated, nothing is invented: a blank cell
  renders as a dash with a plain-words note. Blank template rows (rows
  the register pads with a status formula but no asset) are excluded
  from every count and disclosed.
=====================================================================
"""

import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from email.message import EmailMessage
from email.utils import formatdate
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ampol_paths
import build_stocktake_compliance_tool as eng   # write_pdf_robust + find_workbook
import k2shell as sh
from k2shell import esc, money, num, K

import openpyxl

BASE = Path(__file__).resolve().parent
# Outputs land in the suite's dated Reports area - Reports\<today>\
# Calibrations - one folder per day, nothing ever silently overwritten.
OUT = Path(ampol_paths.day_folder("Calibrations"))

CONFIG = {
    "client": "Ampol",
    "title": "Calibration Register",
    "kicker": "COATES · TOOL STORE - CALIBRATION REGISTER REPORT",
    "project": "Ampol Lytton Refinery · Permanent Tool Store",
    "pdf_name": "Coates_Ampol_Calibration_K2STYLE.pdf",
    "eml_name": "Coates_Ampol_Calibration_OUTLOOK_SAFE.eml",
    "email_html": "Coates_Ampol_Calibration_EMAIL.html",
    "draft_json": "Coates_Ampol_Calibration_OUTLOOK.draft.json",
    "team": [
        {"name": "Andrew Fisher", "role": "Shutdown Manager",
         "shift": "", "email": "andrew.fisher@coates.com.au",
         "blurb": "Owns the register and the chase list - anything at all, start here",
         "lead": True},
    ],
    "key_items": [
        ("orange", "IN DATE OR IN STORE", "out-of-date gear never goes out the counter"),
        ("amber", "DUE 30 DAYS", "booked for calibration before it lapses"),
        ("blue", "NO DATE", "awaiting certificate details - not a failure"),
    ],
}

# What each On Hire Audit reason means, in plain words. A reason the
# register invents later still renders - it just gets the honest
# fallback line instead of a translation.
REASON_MEANING = {
    "on hire in rental_stock but not listed in register entry":
        "The item is out on hire in the rental system but has no line in the "
        "register's entry sheet. Most of this is general tooling with no "
        "calibration requirement - the audit sweeps EVERYTHING on hire so "
        "nothing that does need a certificate can slip out unregistered.",
}
REASON_FALLBACK = ("New reason text from the register - read it as written; "
                   "a plain-words translation will be added here once confirmed.")


# =====================================================================
# load - the live register, verbatim
# =====================================================================

def load_register(path):
    """'Live Register' rows as dicts, register arithmetic untouched."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    if "Live Register" not in wb.sheetnames:
        sys.exit("ERROR: the calibration workbook has no 'Live Register' "
                 "sheet - is this the right file in Data\\?")
    ws = wb["Live Register"]
    it = ws.iter_rows(values_only=True)
    hdr = [str(h or "").strip() for h in next(it)]
    ix = {h: i for i, h in enumerate(hdr)}
    need = ["New Asset No", "Description", "Serial No", "Certificate No.",
            "Calibration Date", "Calibration Due", "Days Remaining",
            "Calibration Status", "On Hire", "Hirer Name", "Storage Unit",
            "Last Refresh"]
    missing = [c for c in need if c not in ix]
    if missing:
        sys.exit(f"ERROR: 'Live Register' is missing columns {missing} - "
                 "the register layout has changed; report needs updating.")

    def cell(r, name):
        v = r[ix[name]]
        return "" if v is None else v

    rows, blanks, refresh = [], 0, None
    for r in it:
        if not any(c not in (None, "") for c in r):
            continue
        lr = cell(r, "Last Refresh")
        if isinstance(lr, datetime) and (refresh is None or lr > refresh):
            refresh = lr
        asset = str(cell(r, "New Asset No")).strip()
        desc = str(cell(r, "Description")).strip()
        if not asset and not desc:
            # register template padding - a status formula with no asset
            blanks += 1
            continue
        due = cell(r, "Calibration Due")
        days = cell(r, "Days Remaining")
        rows.append({
            "asset": asset,
            "desc": desc,
            "serial": str(cell(r, "Serial No")).strip(),
            "cert": str(cell(r, "Certificate No.")).strip(),
            "cal_date": cell(r, "Calibration Date") or None,
            "due": due if isinstance(due, datetime) else None,
            "days": int(days) if isinstance(days, (int, float)) else None,
            "status": str(cell(r, "Calibration Status")).strip(),
            "onhire": str(cell(r, "On Hire")).strip(),   # Yes / No / blank
            "hirer": str(cell(r, "Hirer Name")).strip(),
            "unit": str(cell(r, "Storage Unit")).strip(),
        })
    wb.close()
    return rows, blanks, refresh


def load_audit(path):
    """'On Hire Audit' exception rows - reason on every row."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    if "On Hire Audit" not in wb.sheetnames:
        wb.close()
        return []
    ws = wb["On Hire Audit"]
    it = ws.iter_rows(values_only=True)
    hdr = [str(h or "").strip() for h in next(it)]
    ix = {h: i for i, h in enumerate(hdr)}
    out = []
    for r in it:
        if not any(c not in (None, "") for c in r):
            continue
        out.append({
            "hirer": str(r[ix["HIRER_NAME"]] or "").strip() if "HIRER_NAME" in ix else "",
            "desc": str(r[ix["ITEM_DESCRIPTION"]] or "").strip() if "ITEM_DESCRIPTION" in ix else "",
            "barcode": str(r[ix["ITEM_BARCODE"]] or "").strip() if "ITEM_BARCODE" in ix else "",
            "reason": str(r[ix["Reason"]] or "").strip() if "Reason" in ix else "",
        })
    wb.close()
    return out


# =====================================================================
# derive - the positions the pages print
# =====================================================================

def derive(rows, audit):
    d = {}
    d["total"] = len(rows)
    st = Counter(r["status"] or "(no status)" for r in rows)
    d["status"] = st
    d["nodate"] = [r for r in rows if r["status"] == "No Date"]
    d["overdue"] = sorted([r for r in rows if r["status"] == "Overdue"],
                          key=lambda r: (r["days"] if r["days"] is not None else 0))
    d["due30"] = sorted([r for r in rows if r["status"] == "Due 0-30 Days"],
                        key=lambda r: (r["due"] or datetime.max))
    # "in calibration" = certified and not yet inside 30 days of due
    d["incal"] = [r for r in rows if r["status"] in
                  ("Current", "Due 31-60 Days", "Due 61-90 Days")]
    d["dated"] = [r for r in rows if r["due"] is not None]
    d["dated_ok"] = [r for r in d["dated"] if r["status"] != "Overdue"]
    d["od_onhire"] = [r for r in d["overdue"] if r["onhire"] == "Yes"]
    d["od_store"] = [r for r in d["overdue"] if r["onhire"] != "Yes"]
    d["onhire_yes"] = [r for r in rows if r["onhire"] == "Yes"]

    # the chase list, person first - hirers ranked by their worst overdue
    chase = defaultdict(list)
    for r in d["od_onhire"]:
        chase[r["hirer"] or "(no hirer recorded)"].append(r)
    d["chase"] = sorted(chase.items(),
                        key=lambda kv: min(x["days"] or 0 for x in kv[1]))

    # overdue root cause - the item families actually driving the tail,
    # named from the data so the words can never go stale
    d["od_family"] = Counter(" ".join(r["desc"].split()[:2])
                             for r in d["overdue"] if r["desc"])

    # the No Date position - by storage unit and by item family
    d["nd_units"] = Counter((r["unit"] or "(no storage unit recorded)")
                            for r in d["nodate"])
    d["nd_family"] = Counter(" ".join(r["desc"].split()[:2])
                             for r in d["nodate"] if r["desc"])
    d["nd_serial"] = sum(1 for r in d["nodate"] if r["serial"] and r["serial"] != "-")

    # register health - audit exceptions by reason and by hirer
    d["audit_n"] = len(audit)
    d["reasons"] = Counter(a["reason"] or "(no reason recorded)" for a in audit)
    d["audit_hirers"] = Counter(a["hirer"] or "(no hirer recorded)" for a in audit)
    return d


# =====================================================================
# PDF rendering via the engine's robust writer
# =====================================================================

def render_k2_pdf(doc, pdf_path, authored, css):
    doc = doc.replace("</head>", f"<style>{css}</style></head>", 1)
    tmp = OUT / (Path(pdf_path).stem + ".__tmp__.html")
    tmp.write_text(doc, encoding="utf-8")
    # pre-delete: write_pdf_robust treats an EXISTING file as success, so a
    # stale copy from a previous run must never be able to masquerade
    try:
        Path(pdf_path).unlink()
    except OSError:
        pass
    try:
        ok = eng.write_pdf_robust(str(tmp), str(pdf_path))
    finally:
        try:
            tmp.unlink()
        except OSError:
            pass
    if not ok:
        sys.exit(f"ERROR: could not render {Path(pdf_path).name} - no PDF "
                 "engine available. Edge is standard on Coates laptops.")
    raw = open(pdf_path, "rb").read()
    counts = re.findall(rb"/Count\s+(\d+)", raw)
    actual = max(int(c) for c in counts) if counts else -1
    if actual == -1:
        print(f"Layout check         : page count unreadable - authored "
              f"{authored}; open the PDF and confirm")
    elif actual != authored:
        print("*" * 68)
        print(f"WARNING: LAYOUT OVERFLOW in {Path(pdf_path).name} - authored "
              f"{authored} pages, PDF has {actual}. Do not send as is.")
        print("*" * 68)
    else:
        print(f"Layout check         : PASS - {actual} pages "
              f"({Path(pdf_path).name})")


# =====================================================================
# shared page fragments (PDF)
# =====================================================================

def psect(title):
    return f'<div class="sect"><h3>{title}</h3></div>'


def pcallout(inner, tight=True):
    cls = "callout tight" if tight else "callout"
    return f'<div class="{cls}">{inner}</div>'


def pnote(inner):
    return f'<div class="note">{inner}</div>'


def psubh(title, thin=""):
    t = f' <span class="thin">{thin}</span>' if thin else ""
    return f'<div class="sub-h">{title}{t}</div>'


def chartpanel(inner):
    return f'<div class="chartpanel">{inner}</div>'


def dash():
    return '<span class="tbc">&ndash;</span>'


def fmt_due(r):
    return r["due"].strftime("%d %b %Y") if r["due"] else dash()


def fmt_days(days, overdue=False):
    if days is None:
        return dash()
    if overdue:
        return f'<span class="rd">{num(abs(days))}d over</span>'
    cls = "rd" if days < 0 else "a" if days <= 30 else "g"
    return f'<span class="{cls}">{num(days)}d</span>'


def onhire_cell(r):
    if r["onhire"] == "Yes":
        return '<span class="a">Yes</span>'
    if r["onhire"] == "No":
        return "No"
    return dash()


# =====================================================================
# the PDF pages
# =====================================================================

STATUS_ORDER = [("Current", K["green"]), ("Due 61-90 Days", "#4CC38A"),
                ("Due 31-60 Days", K["blue"]), ("Due 0-30 Days", K["amber"]),
                ("Overdue", K["red"]), ("No Date", "#5F7183")]


def build_pages(rows, d, blanks, refresh_s, mtime_s):
    P = []
    total = d["total"]
    dated = len(d["dated"])
    indate_pct = len(d["dated_ok"]) / dated * 100 if dated else 0

    # ---- P1 the position ------------------------------------------------
    segs = [(lab, d["status"].get(lab, 0), col)
            for lab, col in STATUS_ORDER if d["status"].get(lab, 0)]
    ladders = sh.score_rows([
        ("Dated fleet in date", round(indate_pct),
         f"{num(len(d['dated_ok']))} of {num(dated)} assets holding a due date "
         f"are inside it - the register's own status arithmetic"),
        ("Register certified", round(dated / total * 100 if total else 0),
         f"{num(dated)} of {num(total)} assets carry a calibration due date - "
         f"the other {num(len(d['nodate']))} are awaiting certificate details"),
    ])
    # root-cause words built from the data itself - the two item families
    # carrying most of the overdue tail, named and counted
    fam = d["od_family"].most_common(2)
    if fam:
        fam_n = sum(n for _, n in fam)
        cause = (f'the overdue tail is led by <b>{esc(" and ".join(f0.lower() for f0, _ in fam))}</b> '
                 f'({num(fam_n)} of the {num(len(d["overdue"]))}), '
                 f'{num(len(d["od_onhire"]))} of them out on hire with named '
                 f'hirers - the chase list on page 3')
    else:
        cause = 'nothing is overdue - the chase list on page 3 is empty'
    P.append(f"""{pcallout(
        f'<span class="lead">The position.</span> One page, one honest answer: '
        f'is the {esc(CONFIG["client"])} calibrated fleet in date and in hand? '
        f'<b>{num(total)} calibrated assets</b> on the live register. '
        f'<b class="g">{num(len(d["incal"]))} in calibration</b>, '
        f'<b class="a">{num(len(d["due30"]))} due inside 30 days</b>, '
        f'<b class="rd">{num(len(d["overdue"]))} overdue</b> and '
        f'<b>{num(len(d["nodate"]))} with no certificate date yet</b>. The root '
        f'causes are plain: {cause}. '
        f'No Date is paperwork catching up, not gear failing - page 5 says it '
        f'straight.', False)}
<table class="two" style="margin-top:14px"><tr>
  <td style="width:31%"><div class="donut-wrap">
    {sh.donut(round(indate_pct), sh.health_hex(round(indate_pct)), f"{indate_pct:.0f}%", "IN DATE")}
    <div class="donut-cap">Dated assets inside their calibration due date</div></div></td>
  <td style="padding-left:10px">{ladders}</td>
</tr></table>
{psubh("Status mix", "&mdash; every asset on the register, the register&rsquo;s own words")}
{chartpanel(sh.stackband(segs))}
{sh.tiles([
    ("box", num(total), "Calibrated assets", "on the live register", "grey"),
    ("check", num(len(d["incal"])), "In calibration", "current, next due 31+ days", "green"),
    ("clock", num(len(d["due30"])), "Due inside 30 days",
     "book them in now", "amber" if d["due30"] else "green"),
    ("warn", num(len(d["overdue"])), "Overdue",
     f"{num(len(d['od_onhire']))} on hire - chase list", "red" if d["overdue"] else "green"),
])}
{pnote(f'Data as at <b>{esc(refresh_s)}</b> - the register&rsquo;s own Last Refresh timestamp - and the workbook file was saved <b>{esc(mtime_s)}</b>; both are printed because they are not the same moment. Status and days remaining are the register&rsquo;s own arithmetic at that refresh, used verbatim. The register also carries {num(blanks)} blank template rows (a status formula, no asset) - excluded from every count on this report.')}""")

    # ---- P2 due next 30 days -------------------------------------------
    # 16 rows is what the page holds cleanly under the K2 shell - more
    # than that runs into the footer, and an overflowing page never goes
    # to a client. The cut is disclosed on the page.
    cap2 = 16
    d30 = d["due30"]
    drows = []
    for r in d30[:cap2]:
        drows.append([
            esc(r["asset"]) or dash(),
            esc(r["desc"]) or dash(),
            fmt_due(r),
            fmt_days(r["days"]),
            onhire_cell(r),
            esc(r["hirer"]) if r["hirer"] else dash()])
    more2 = (pnote(f'Showing {cap2} of {len(d30)} - the remaining '
                   f'{len(d30) - cap2} are in the register workbook, same order.')
             if len(d30) > cap2 else "")
    P.append(f"""{psect("Due inside 30 days - book these in now")}
{pcallout(f'<b class="a">{num(len(d30))} assets</b> fall due inside 30 days of the register&rsquo;s last refresh, soonest first. Booked in before the date lapses, these never touch the overdue list - that is the whole game. An asset out on hire gets its swap organised at the counter on next touch; the hirer column says exactly who to talk to.')}
{sh.dtable(["Asset", "Description", "Calibration due", "Days left", "On hire", "Who has it"],
           drows, ["", "", "r", "r", "c", ""])}
{more2}
{pnote('Days left are the register&rsquo;s own count at last refresh. A dash means the register holds no value for that cell - nothing here is estimated.')}""")

    # ---- P3 the chase list ----------------------------------------------
    # The chase list and the in-store overdue table each get a page of
    # their own - both on one page ran into the footer, and an
    # overflowing page never goes to a client.
    cap3a = 16
    crows, shown3a = [], 0
    for hirer, items in d["chase"]:
        for j, r in enumerate(sorted(items, key=lambda x: x["days"] or 0)):
            if shown3a >= cap3a:
                break
            who = (f'<b>{esc(hirer)}</b><span class="s2">{len(items)} '
                   f'overdue item{"s" if len(items) > 1 else ""}</span>'
                   if j == 0 else "")
            crows.append([who, esc(r["asset"]) or dash(), esc(r["desc"]) or dash(),
                          fmt_due(r), fmt_days(r["days"], overdue=True)])
            shown3a += 1
    more3a = (pnote(f'Showing {cap3a} of {len(d["od_onhire"])} - the register '
                    f'workbook carries the full list, same order.')
              if len(d["od_onhire"]) > cap3a else "")
    P.append(f"""{psect("Overdue and on hire - the chase list, by name")}
{pcallout(f'<b class="rd">{num(len(d["od_onhire"]))} overdue assets are out on hire right now</b> - these are the ones that cannot be fixed from inside the store, so they get names, not categories. Person first, worst first: a swap or recall on each is the conversation, and every one resolved moves the overdue tile down the same day.', False)}
{sh.dtable(["Who has it", "Asset", "Description", "Was due", "Overdue by"],
           crows, ["", "", "", "r", "r"])}
{more3a}
{pnote('Hirers ranked by their most-overdue item; days are the register&rsquo;s own count at last refresh. Every one of these is a counter conversation on next touch - swap organised, certificate sorted, no drama.')}""")

    # ---- P4 overdue in store --------------------------------------------
    cap3 = 16
    srows = []
    for r in d["od_store"][:cap3]:
        srows.append([esc(r["asset"]) or dash(), esc(r["desc"]) or dash(),
                      esc(r["unit"]) if r["unit"] else dash(),
                      fmt_due(r), fmt_days(r["days"], overdue=True)])
    more3 = (pnote(f'Showing {cap3} of {len(d["od_store"])} in-store overdue items.')
             if len(d["od_store"]) > cap3 else "")
    P.append(f"""{psect("Overdue in store - swap at the shelf")}
{pcallout(f'<b>{num(len(d["od_store"]))} overdue assets are in the store</b> (not on hire, or not matched to a hirer). These never leave the counter out of date - Life Saving Rule 5 - so the fix is a calibration run, not a chase: batch them to the calibrator, and each one comes back onto the dated fleet on page 1.', False)}
{sh.dtable(["Asset", "Description", "Storage unit", "Was due", "Overdue by"],
           srows, ["", "", "", "r", "r"])}
{more3}
{pnote('A dash in the storage unit column means the register holds no bay for that asset - nothing here is estimated.')}""")

    # ---- P4 the No Date position ----------------------------------------
    nd = d["nodate"]
    nd_named = [r for r in nd if r["desc"]]
    # top 10 / top 7 is what fits above the footer - the cut is printed
    units_top = d["nd_units"].most_common(10)
    fam_top = d["nd_family"].most_common(7)
    frows = [[esc(f), num(n)] for f, n in fam_top]
    nd_unnamed = len(nd) - len(nd_named)
    unnamed_note = (f'{num(nd_unnamed)} No Date lines carry an asset number '
                    f'but no description yet - counted above, family unknown '
                    f'until the register line is completed. '
                    if nd_unnamed else '')
    P.append(f"""{psect("No Date - awaiting certificate details, not failures")}
{pcallout(f'<b>{num(len(nd))} assets</b> sit on the register with no calibration date recorded. Say it straight: these are <b>not failed or out-of-test items</b> - they are register lines whose certificate details are still being gathered and entered; the families below show where that paperwork lives. {num(d["nd_serial"])} of them already {"carries" if d["nd_serial"] == 1 else "carry"} a serial number. Each certificate entered moves an asset from this page onto the dated fleet on page 1 - that is the fill-in work under way.', False)}
{psubh("Where they sit", f"&mdash; No Date assets by storage unit, top {len(units_top)} of {len(d['nd_units'])}")}
{chartpanel(sh.hbars([(u, n) for u, n in units_top], colour=K["blue"]))}
{psubh("What they are", f"&mdash; by item family, top {len(fam_top)} of {len(d['nd_family'])}")}
{sh.dtable(["Item family (first words of description)", "Assets"], frows, ["", "r"])}
{pnote(unnamed_note + 'Family = the first words of the register description - a plain grouping, not a new classification. Nothing is guessed.')}""")

    # ---- P5 register health - the audit ---------------------------------
    rtop = d["reasons"].most_common(6)
    rrows = []
    for reason, n in rtop:
        meaning = REASON_MEANING.get(reason.lower(), REASON_FALLBACK)
        rrows.append([f'{esc(reason)}<span class="s2">{esc(meaning)}</span>',
                      num(n)])
    htop = d["audit_hirers"].most_common(10)
    P.append(f"""{psect("Register health - the On Hire Audit")}
{pcallout(f'The register audits itself: every refresh it sweeps the whole on-hire fleet and writes an exception row for anything it cannot reconcile - <b>{num(d["audit_n"])} exception rows</b> this refresh, across <b>{num(len(d["audit_hirers"]))} hirers</b>. This is the health check that stops the register quietly drifting away from reality.', False)}
{psubh("Exceptions by reason", f"&mdash; showing {len(rtop)} of {len(d['reasons'])} reason{'s' if len(d['reasons']) != 1 else ''}, what each means in plain words")}
{sh.dtable(["Reason (as the register writes it)", "Rows"], rrows, ["", "r"])}
{psubh("Where the exceptions sit", f"&mdash; top {len(htop)} of {num(len(d['audit_hirers']))} hirers by exception rows")}
{chartpanel(sh.hbars([(h, n) for h, n in htop], colour=K["orange"]))}
{pnote('An exception row is not a lost item and not a compliance breach - it is the register saying "I can see this on hire and I have no calibration line for it". The bulk is general tooling that needs no certificate; the audit exists so the fraction that does can never slip through unregistered.')}""")

    # ---- P6 close --------------------------------------------------------
    cards = sh.info_cards([
        ("In date or it stays in",
         "Nothing goes out the counter with a lapsed certificate. An overdue "
         "asset in store is a calibration run, not a risk - Life Saving Rule 5, "
         "Tools and Equipment (SEQ-GL-009)."),
        ("The register refreshes itself",
         "Live off SharePoint - the moment a certificate is entered or gear "
         "moves, the next refresh carries it. This report prints the refresh "
         "timestamp it was built from, every page."),
        ("Names, not categories",
         "An overdue asset on hire is chased by hirer name at the counter - "
         "a swap organised on next touch beats a lecture every time."),
        ("Honest about the gaps",
         "No Date means the certificate details are still being entered - said "
         "plainly, counted separately, never blended into a compliance score. "
         "Blanks print as dashes, <b>never guesses</b>."),
    ])
    P.append(f"""{psect("How the calibrated fleet is run")}
{cards}
{psect("Meet the tool store team")}
{pnote(f'The crew running your {esc(CONFIG["client"])} store - keeping the register true, the certificates current and the gear ready. Something not right? Tell us and we&rsquo;ll sort it.')}
{sh.team_cards(CONFIG["team"])}""")
    return P


def render_doc(pages, gen_s, asat_s, refresh_s, mtime_s):
    tot = len(pages)
    body = "".join(sh.render_page(CONFIG, p, i + 1, tot, gen_s, asat_s)
                   for i, p in enumerate(pages))
    doc = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
           f'<title>Coates {esc(CONFIG["client"])} {esc(CONFIG["title"])} - '
           f'{esc(asat_s)}</title></head><body>{body}</body></html>')
    # WHY (12 Aug 2026): the shared page shell labels the as-at stamp
    # "(workbook file time)" - true for exports, wrong for this register,
    # whose honest stamp is its own Last Refresh. Relabel here and show
    # both times, rather than touching the shell every report shares.
    doc = doc.replace(
        "(workbook file time)",
        f"(register Last Refresh &middot; file saved {esc(mtime_s)})")
    return doc, tot


# =====================================================================
# the Outlook email (draft - never sends)
# =====================================================================

def build_email_html(d, gen_s, refresh_s, mtime_s):
    W = 1000
    CW = W - 48
    FONT = sh.FONT
    total = d["total"]
    dated = len(d["dated"])
    indate_pct = len(d["dated_ok"]) / dated * 100 if dated else 0
    parts = []

    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr><td bgcolor="#1A2430" style="padding:22px 24px 19px 24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td>
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:2.5px;color:#F36F21;text-transform:uppercase;">{esc(CONFIG['kicker'])}</div>
<div style="{FONT}font-size:26px;font-weight:bold;color:#FFFFFF;padding-top:8px;">Ampol Calibration Register - The Position</div>
<div style="{FONT}font-size:13px;color:#A7B6C4;padding-top:7px;">{esc(CONFIG['project'])}</div>
</td>
<td width="185" align="right" style="vertical-align:top;">
<div style="{FONT}font-size:11px;font-weight:bold;letter-spacing:1.5px;color:#FFFFFF;">POWERED BY <span style="color:#F36F21;">SITEIQ</span></div>
<div style="{FONT}font-size:11.5px;color:#8395A6;padding-top:5px;">Equipped for anything</div>
</td></tr></table>
<div style="{FONT}font-size:11px;color:#8395A6;padding-top:10px;line-height:1.6;">Generated: <b style="color:#FFFFFF;">{esc(gen_s)}</b> &nbsp;|&nbsp; Data as at: <b style="color:#FFFFFF;">{esc(refresh_s)}</b> (register Last Refresh; file saved {esc(mtime_s)}) &nbsp;|&nbsp; Author: <b style="color:#FFFFFF;">Andrew Fisher</b></div>
</td></tr></table>""")

    parts.append(sh.ecallout(
        f'<span style="color:#D95F14;font-weight:bold;text-transform:uppercase;">'
        f'The position.</span> {sh.eo(num(total) + " calibrated assets")} on the '
        f'live register: <b>{num(len(d["incal"]))}</b> in calibration, '
        f'{sh.eo(num(len(d["due30"])) + " due inside 30 days")}, '
        f'{sh.eo(num(len(d["overdue"])) + " overdue")} '
        f'({num(len(d["od_onhire"]))} of those on hire - the chase list is '
        f'page 3 of the PDF) and <b>{num(len(d["nodate"]))}</b> awaiting '
        f'certificate details. Full detail attached.'))

    parts.append(sh.etiles([
        (num(total), "CALIBRATED ASSETS", "on the live register", "#8A9AAC"),
        (num(len(d["incal"])), "IN CALIBRATION", "current, due 31+ days", "#22C55E"),
        (num(len(d["due30"])), "DUE INSIDE 30 DAYS",
         "book them in now", "#EFA82B" if d["due30"] else "#22C55E"),
        (num(len(d["overdue"])), "OVERDUE",
         f'{num(len(d["od_onhire"]))} on hire - chase',
         "#F0603E" if d["overdue"] else "#22C55E"),
    ]))

    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;"><tr>
<td width="200" align="center" style="vertical-align:top;padding-top:6px;">
{sh.donut_png(round(indate_pct), sh.health_hex(round(indate_pct)), f"{indate_pct:.0f}%", "IN DATE")}
<div style="{FONT}font-size:10.5px;color:#98A6B4;padding-top:8px;">Dated assets inside their due date</div></td>
<td style="vertical-align:top;padding-left:16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
{sh.score_bar_row("Dated fleet in date", round(indate_pct), f"{num(len(d['dated_ok']))} of {num(dated)} assets holding a due date are inside it")}
{sh.score_bar_row("Register certified", round(dated / total * 100 if total else 0), f"{num(dated)} of {num(total)} assets carry a due date - the rest are awaiting certificate details, not failures")}
</table></td></tr></table>""")

    cap = 8
    chase_rows = []
    for hirer, items in d["chase"]:
        for r in sorted(items, key=lambda x: x["days"] or 0):
            chase_rows.append([esc(hirer), esc(r["asset"]) or "&ndash;",
                               esc(r["desc"]) or "&ndash;",
                               r["due"].strftime("%d %b %Y") if r["due"] else "&ndash;",
                               f'{num(abs(r["days"]))}d' if r["days"] is not None else "&ndash;"])
    shown = chase_rows[:cap]
    parts.append(sh.esect("Overdue and on hire - the chase list, by name"))
    parts.append(sh.edtable(["Who has it", "Asset", "Description", "Was due", "Over by"],
                            shown, ["", "", "", "r", "r"]))
    if len(chase_rows) > cap:
        parts.append(sh.enote(f'Showing {cap} of {len(chase_rows)} - the PDF '
                              f'attached carries the full list.'))

    cap2 = 8
    d30 = d["due30"]
    drows = [[esc(r["asset"]) or "&ndash;", esc(r["desc"]) or "&ndash;",
              r["due"].strftime("%d %b %Y") if r["due"] else "&ndash;",
              f'{num(r["days"])}d' if r["days"] is not None else "&ndash;",
              esc(r["hirer"]) if r["hirer"] else "&ndash;"]
             for r in d30[:cap2]]
    parts.append(sh.esect("Due inside 30 days - soonest first"))
    parts.append(sh.edtable(["Asset", "Description", "Due", "Days left", "Who has it"],
                            drows, ["", "", "r", "r", ""]))
    if len(d30) > cap2:
        parts.append(sh.enote(f'Showing {cap2} of {len(d30)} - full list in the PDF.'))

    parts.append(sh.enote(
        f'{num(len(d["nodate"]))} assets carry no certificate date yet - '
        f'awaiting details, not failures; the PDF gives that position a page '
        f'of its own. The register&rsquo;s own On Hire Audit logged '
        f'{num(d["audit_n"])} exception rows this refresh - explained in '
        f'plain words on page 6.'))

    team_line = " &middot; ".join(
        f'<b style="color:#16202C;">{esc(p["name"])}</b> '
        f'<span style="color:#8A9AAC;">{esc(p["role"])}</span>'
        for p in CONFIG["team"])
    parts.append(f"""<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;">
<tr><td style="border-top:1px solid #E4E8EC;padding-top:10px;">
<div style="{FONT}font-size:10px;font-weight:bold;letter-spacing:2px;color:#F36F21;text-transform:uppercase;">Your Coates Tool Store Team</div>
<div style="{FONT}font-size:11px;color:#8A9AAC;padding-top:5px;line-height:1.7;">{team_line}</div>
<div style="{FONT}font-size:10px;color:#98A6B4;padding-top:9px;line-height:1.7;">
Coates Hire &middot; Source: Ampol_Calibration_Register.xlsx (Last Refresh {esc(refresh_s)}; file saved {esc(mtime_s)}). The register&rsquo;s own status arithmetic, used verbatim - blanks shown as dashes, never guessed. The Coates Way - consistent execution, every day. <b style="color:#16202C;">POWERED BY SITEIQ</b></div>
</td></tr></table>""")

    body = "".join(
        f'<tr><td style="padding:0 24px;">{p}</td></tr>'
        if "bgcolor=\"#1A2430\"" not in p[:120] else f'<tr><td>{p}</td></tr>'
        for p in parts)
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Ampol Calibration Register - {esc(refresh_s)}</title></head>
<body bgcolor="#EEF1F4" style="margin:0;padding:0;background-color:#EEF1F4;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#EEF1F4">
<tr><td align="center" style="padding:18px 10px;">
<table role="presentation" width="{W}" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF" style="width:{W}px;max-width:{W}px;">
<tr><td height="6" bgcolor="#F36F21" style="font-size:0;">&nbsp;</td></tr>
{body}
<tr><td height="24" style="font-size:0;">&nbsp;</td></tr>
</table></td></tr></table></body></html>"""


# =====================================================================
# MAIN
# =====================================================================

def main():
    print("=" * 68)
    print("COATES CALIBRATION REGISTER - HOUSE-STYLE REPORT (the K2 look)")
    print("=" * 68)
    src = eng.find_workbook(["Ampol_Calibration_Register*.xlsx"],
                            sys.argv[1] if len(sys.argv) > 1 else None)
    if not src:
        sys.exit("ERROR: no Ampol_Calibration_Register*.xlsx in the suite's "
                 "Data folder - save the register there and run again.")
    print(f"Calibration register : {src}")

    rows, blanks, refresh = load_register(src)
    audit = load_audit(src)
    d = derive(rows, audit)

    mtime = datetime.fromtimestamp(os.path.getmtime(src))
    mtime_s = mtime.strftime("%d %b %Y %H:%M")
    # Data as at = the register's own Last Refresh - the honest stamp for
    # a self-refreshing workbook. The file's saved time is shown with it.
    refresh_s = refresh.strftime("%d %b %Y %H:%M") if refresh else mtime_s
    if refresh is None:
        print("NOTE: no Last Refresh timestamp found in the register - "
              "using the workbook file time as the data-as-at stamp.")
    asat_s = refresh_s
    gen_s = datetime.now().strftime("%d %b %Y %H:%M")

    print(f"Data as at           : {refresh_s}  (register Last Refresh)")
    print(f"File saved           : {mtime_s}")
    print(f"Calibrated assets    : {d['total']:,}  "
          f"(+{blanks:,} blank template rows excluded)")
    print(f"Status mix           : in-cal {len(d['incal']):,} | "
          f"due-30 {len(d['due30']):,} | overdue {len(d['overdue']):,} | "
          f"no-date {len(d['nodate']):,}")
    print(f"Chase list           : {len(d['od_onhire']):,} overdue on hire "
          f"across {len(d['chase']):,} hirers")
    print(f"On Hire Audit        : {d['audit_n']:,} exception rows, "
          f"{len(d['reasons']):,} distinct reason(s)")

    # ---- 1. the PDF -----------------------------------------------------
    css_path = BASE / "k2style.css"
    if not css_path.exists():
        sys.exit("ERROR: k2style.css is missing from the suite folder - the "
                 "house-style PDF cannot render without it.")
    css = css_path.read_text(encoding="utf-8")
    print("-" * 68)
    print("[1/2] Calibration register PDF (house style)...")
    doc, n_pages = render_doc(build_pages(rows, d, blanks, refresh_s, mtime_s),
                              gen_s, asat_s, refresh_s, mtime_s)
    pdf_path = OUT / CONFIG["pdf_name"]
    render_k2_pdf(doc, pdf_path, n_pages, css)

    # ---- 2. the email (draft - never sends) -----------------------------
    print("[2/2] Outlook email (house style, draft only)...")
    html = build_email_html(d, gen_s, refresh_s, mtime_s)
    (OUT / CONFIG["email_html"]).write_text(html, encoding="utf-8")
    msg = EmailMessage()
    subject = (f"Ampol Tool Store - Calibration Register Report - "
               f"as at {refresh.strftime('%d/%m/%Y %H:%M') if refresh else mtime.strftime('%d/%m/%Y %H:%M')}")
    msg["Subject"] = subject
    msg["To"] = eng.STAFF_EMAIL_TO
    msg["Date"] = formatdate(localtime=True)
    msg["X-Unsent"] = "1"
    msg.set_content("This report is best viewed in HTML. The calibration "
                    "register PDF is attached.\n")
    msg.add_alternative(html, subtype="html")
    attach = [str(pdf_path)]
    for p in attach:
        if os.path.exists(p):
            with open(p, "rb") as f:
                msg.add_attachment(f.read(), maintype="application",
                                   subtype="pdf", filename=os.path.basename(p))
    eml_path = OUT / CONFIG["eml_name"]
    with open(eml_path, "wb") as f:
        f.write(msg.as_bytes())
    print(f"EML written          : {eml_path}  "
          f"({os.path.getsize(eml_path):,} bytes)")
    # manifest so MAKE_OUTLOOK_DRAFTS keeps working - recipients derive
    # from the engine's STAFF_EMAIL_TO, one source of truth.
    import json
    to_line = "; ".join(re.findall(r"<([^>]+)>", eng.STAFF_EMAIL_TO))
    (OUT / CONFIG["draft_json"]).write_text(json.dumps({
        "subject": subject,
        "to": to_line,
        "body": CONFIG["email_html"],
        "attachments": [os.path.basename(p) for p in attach],
    }, indent=1), encoding="utf-8")
    print("")
    print(f"NEXT STEP: double-click the .eml in {OUT}, check it, press Send.")
    print("Done. The Coates Way - consistent execution, every day.")


if __name__ == "__main__":
    # Failures leave a nonzero exit so the bat button tells the truth;
    # the bat owns the end-of-run pause - no input() here.
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(f"\nERROR: {e}")
